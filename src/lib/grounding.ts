import { JSDOM } from 'jsdom';
import { Type } from '@google/genai';
import { resolveEngineModel } from './modelEnvConfig';

export interface Fact {
  id: string;
  statement: string;
  kind: "feature" | "metric" | "process" | "constraint" | "definition" | "claim";
  sourceQuote: string;
  sourceLocator: string;
  value?: number;
  unit?: string;
  period?: string;
  comparisonTo?: string;
  derived?: boolean;
}

export interface GroundingReport {
  mode: string;
  factsExtracted: number;
  factsVerified: number;
  factsRejected: number;
  claimsAudited: number;
  claimsSupported: number;
  claimsRemoved: { id: string; category: string; text: string }[];
  evidenceFailures: number;
  breachCount: number;
  slidesDropped: number;
  countReason?: string;
  imagesUsed: number;
  imagesFallback: number;
}

export function normalize(str: string): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x0030))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();
}

export function verifyFacts(facts: Fact[], sourceText: string): { ok: Fact[]; rejected: { fact: Fact; reason: string }[] } {
  const normSource = normalize(sourceText);
  const ok: Fact[] = [];
  const rejected: { fact: Fact; reason: string }[] = [];

  for (const fact of facts) {
    if (!fact.sourceQuote || fact.sourceQuote.length < 10) {
      rejected.push({ fact, reason: 'Missing or short sourceQuote' });
      continue;
    }
    const normQuote = normalize(fact.sourceQuote);
    if (normSource.includes(normQuote)) {
      ok.push(fact);
    } else {
      rejected.push({ fact, reason: 'Quote not found in source text' });
    }
  }

  return { ok, rejected };
}

export async function verifyRenderedDeck(
  html: string,
  verifiedFacts: Fact[],
  sourceText: string,
  mode: string,
  ai: any,
  MODEL_ID: string,
  geminiSemaphore: any
): Promise<{ cleanHtml: string, reportUpdates: Partial<GroundingReport> }> {
  const isGrounded = mode === 'grounded';
  
  // Parse HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Stamp IDs on block-level elements containing text
  const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div'];
  let claimCounter = 1;
  const elementsWithClaims: { id: string, text: string, el: Element }[] = [];
  
  for (const tag of blockTags) {
    const els = document.querySelectorAll(tag);
    for (const el of els) {
      // Don't stamp empty or pure container divs
      if (tag === 'div') {
        const hasDirectText = Array.from(el.childNodes).some((n: any) => n.nodeType === 3 && n.textContent?.trim().length! > 0);
        if (!hasDirectText) continue; // It's just a layout container
      }
      
      const text = el.textContent?.trim();
      if (text && text.length > 2) {
        if (!el.hasAttribute('data-claim-id')) {
          const id = `c${claimCounter.toString().padStart(3, '0')}`;
          el.setAttribute('data-claim-id', id);
          elementsWithClaims.push({ id, text, el });
          claimCounter++;
        }
      }
    }
  }

  const reportUpdates: Partial<GroundingReport> = {
    claimsAudited: elementsWithClaims.length,
    claimsSupported: 0,
    claimsRemoved: [],
    evidenceFailures: 0,
    breachCount: 0,
    slidesDropped: 0
  };

  // 1. Breach detection (ITEM 5b)
  const metrics = verifiedFacts.filter(f => f.kind === 'metric' && typeof f.value !== 'undefined');
  const slidesEls = document.querySelectorAll('.slide');
  for (const slide of slidesEls) {
    for (const metric of metrics) {
      const valStr = metric.value!.toString();
      const slideHtmlStr = slide.innerHTML;
      const totalOccurrences = (slideHtmlStr.match(new RegExp('\\b' + valStr + '\\b', 'g')) || []).length;
      if (totalOccurrences > 0) {
        let safeOccurrences = 0;
        const ltrSpans = slide.querySelectorAll('span[dir="ltr"]');
        for (const span of ltrSpans) {
          const spanHtml = span.innerHTML;
          safeOccurrences += (spanHtml.match(new RegExp('\\b' + valStr + '\\b', 'g')) || []).length;
        }
        if (totalOccurrences > safeOccurrences) {
          reportUpdates.breachCount = (reportUpdates.breachCount || 0) + 1;
        }
      }
    }
  }

  if (elementsWithClaims.length === 0) {
    return { cleanHtml: dom.window.document.body.innerHTML, reportUpdates };
  }

  // 2. Prepare Audit prompt
  const deckText = elementsWithClaims.map(c => `[ID: ${c.id}] ${c.text}`).join('\n');
  
  let auditPrompt = '';
  if (isGrounded) {
    auditPrompt = `You are a compliance auditor for a document generator. You are the last check
before a file reaches a paying user. You are not editing or improving the deck.
You decide, for each claim, whether the source material supports it.

MODE: grounded
The user supplied source material. The deck must contain nothing the source does
not support. Anything else is fabrication, regardless of how plausible it sounds.

For EACH element id, decide:

  supported  — the source states this, in any wording, in any language
  unsupported — the source does not state it and it cannot be read off the source
  contradicted — the source states something incompatible with it

Judge MEANING, not wording. "عائد استثمار" and "عائد الاستثمار" and "ROI" and
"نسبة العائد على الاستثمار" are the same claim. "ايزو 27001" and "ISO 27001" are
the same claim. A restatement of a source fact in different words is supported.

Pay particular attention to these, and mark each with its category:

  attributed_quote — any statement presented as spoken or written by a person or
      a role. The attribution may be an em-dash, a name, a job title, a company,
      or nothing at all beyond context. If the source does not contain that
      person saying that thing, it is fabricated. This is the highest-risk
      category in the product.
  certification    — any claim of certification, accreditation, standard or audit
      status, in any language or transliteration.
  third_party      — any named external company, customer, partner or vendor.
  financial        — any performance, return, saving, growth or payback figure,
      with or without a percent sign, including multiples ("5 أضعاف").
  guarantee        — uptime, SLA, availability or similar promise.
  regulatory       — any legal or compliance conformity claim.
  award            — any ranking, award, or market position.
  metric           — any other number presented as fact.
  none             — ordinary prose with no verifiable claim.

For each element return: id, verdict, category, and evidence.
evidence: for \`supported\`, a VERBATIM span from the source that supports it.
For the other verdicts, evidence is "".

A claim is supported ONLY if you can quote the source. If you cannot produce the
quote, the verdict is not supported. Do not reason from general knowledge about
the world or about this product — only from the supplied source.

Return JSON only.

SOURCE MATERIAL:
${sourceText}

DECK CLAIMS:
${deckText}
`;
  } else {
    // Creative mode
    auditPrompt = `You are a compliance auditor for a document generator.
MODE: creative
There is no source material. 
Flag any \`attributed_quote\`, \`certification\`, \`regulatory\` or \`award\` claim, because
those are unsafe to invent even in a speculative deck. Financial and metric
figures are permitted but must be labelled illustrative in the deck footer (you do not do the labelling, just return supported).

For EACH element id, decide:
  unsupported — if it is an \`attributed_quote\`, \`certification\`, \`regulatory\` or \`award\`.
  supported — otherwise.

Pay particular attention to these, and mark each with its category:
  attributed_quote — any statement presented as spoken or written by a person or a role.
  certification    — any claim of certification, accreditation, standard or audit status.
  regulatory       — any legal or compliance conformity claim.
  award            — any ranking, award, or market position.
  third_party      — any named external company, customer, partner or vendor.
  financial        — financial figures.
  guarantee        — uptime, SLA, availability.
  metric           — other numbers.
  none             — ordinary prose.

For each element return: id, verdict, category, and evidence ("" for all in creative mode).
Return JSON only.

DECK CLAIMS:
${deckText}
`;
  }

  let claimsResult: any[] = [];
  let retryCount = 0;
  
  while (retryCount < 2) {
    await geminiSemaphore.acquire();
    try {
      const auditRes = await ai.models.generateContent({
        model: resolveEngineModel(MODEL_ID),
        contents: auditPrompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 65535,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              claims: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                id:       { type: Type.STRING },
                verdict:  { type: Type.STRING, enum: ["supported","unsupported","contradicted"] },
                category: { type: Type.STRING, enum: ["attributed_quote","certification","third_party","financial","guarantee","regulatory","award","metric","none"] },
                evidence: { type: Type.STRING },
              }, required: ["id","verdict","category","evidence"] } }
            },
            required: ["claims"]
          }
        }
      });
      const parsed = JSON.parse(auditRes.text || '{}');
      claimsResult = parsed.claims || [];
      break;
    } catch (e: any) {
      console.warn("Audit JSON parse error, retrying...", e);
      retryCount++;
      if (retryCount >= 2) throw new Error("Verification could not complete.");
    } finally {
      geminiSemaphore.release();
    }
  }

  const normSource = normalize(sourceText);
  
  // 3. Server-side enforcement
  for (const claimRes of claimsResult) {
    const elData = elementsWithClaims.find(c => c.id === claimRes.id);
    if (!elData) continue;
    
    let { verdict, category, evidence } = claimRes;
    
    // 2.4 Verify the evidence
    if (verdict === 'supported' && isGrounded) {
      const normEvidence = normalize(evidence);
      if (normEvidence && !normSource.includes(normEvidence)) {
        verdict = 'unsupported';
        reportUpdates.evidenceFailures = (reportUpdates.evidenceFailures || 0) + 1;
      }
    }
    
    if (verdict === 'supported') {
      reportUpdates.claimsSupported = (reportUpdates.claimsSupported || 0) + 1;
      continue;
    }
    
    // Unsupported or contradicted
    if (category === 'none') {
      // keep, report as unverified
      continue;
    }
    
    let shouldRemove = false;
    if (category === 'attributed_quote') {
      shouldRemove = true;
      // also remove adjacent attribution
      const el = elData.el;
      const sibs = [el.previousElementSibling, el.nextElementSibling];
      for (const sib of sibs) {
        if (sib && sib.textContent) {
          const sibText = sib.textContent.trim();
          if (sibText.length < 120 && /(—|–|-|CEO|CTO|CFO|COO|قال|صرّح|المدير|الرئيس التنفيذي)/i.test(sibText)) {
             sib.remove();
          }
        }
      }
    } else if (['certification', 'third_party', 'financial', 'guarantee', 'regulatory', 'award'].includes(category)) {
      shouldRemove = true;
    } else if (category === 'metric') {
      shouldRemove = true;
    }
    
    if (shouldRemove) {
      elData.el.remove();
      reportUpdates.claimsRemoved!.push({ id: claimRes.id, category, text: elData.text });
    }
  }

  // 4. Slide dropping logic
  const remainingSlides = document.querySelectorAll('.slide');
  for (const slide of remainingSlides) {
    const textLen = slide.textContent?.replace(/\s+/g, '').length || 0;
    if (textLen < 15) { 
       slide.remove();
       reportUpdates.slidesDropped = (reportUpdates.slidesDropped || 0) + 1;
    }
  }

  // JSDOM creates an entire HTML document. We only want the content of <body> without wrapping it if it wasn't there.
  return { cleanHtml: document.body.innerHTML, reportUpdates };
}
