/** Design constitution for Naje UI generation. Shared by the server prompt and the client handoff. */

export const UI_FONT_PAIRINGS = [
  { id: 'editorial-ar', display: 'Fraunces', text: 'IBM Plex Sans Arabic', href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap', note: 'مجلة: عنوان لاتيني حاد مع نص عربي هادئ' },
  { id: 'naskh', display: 'Amiri', text: 'Noto Naskh Arabic', href: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap', note: 'نصي ثقافي، مناسب للتراث والمعرفة' },
  { id: 'kufi', display: 'Noto Kufi Arabic', text: 'Readex Pro', href: 'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@500;700&family=Readex+Pro:wght@400;500;600&display=swap', note: 'هندسي عربي، مناسب لمنتج أو أداة' },
  { id: 'news', display: 'Newsreader', text: 'Source Sans 3', href: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,650&family=Source+Sans+3:wght@400;600&display=swap', note: 'صحيفة: عناوين تحريرية ونص واضح' },
  { id: 'grotesk', display: 'Familjen Grotesk', text: 'Literata', href: 'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;700&family=Literata:opsz,wght@7..72,400;7..72,600&display=swap', note: 'استوديو: غروتسك مع نص قراءة' },
  { id: 'soft-ar', display: 'El Messiri', text: 'Tajawal', href: 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;700&family=Tajawal:wght@400;500;700&display=swap', note: 'عربي دافئ بلا مظهر «تطبيق جاهز»' },
  { id: 'poster', display: 'Besley', text: 'Outfit', href: 'https://fonts.googleapis.com/css2?family=Besley:wght@500;700&family=Outfit:wght@400;500;600&display=swap', note: 'ملصق: سيرف للعنوان وسانس للنص' },
  { id: 'document', display: 'Source Serif 4', text: 'IBM Plex Sans Arabic', href: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,650&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap', note: 'مستند مؤسسي هادئ' },
] as const;

/** Drop embedded images so the interface file can travel to Naje Agent without blowing the chat document. */
export function compactUiForAgent(html: string): string {
  const stripped = String(html || '').replace(/data:[^"'\s>]{60,}/g, '');
  return stripped.length > 500000 ? stripped.slice(0, 500000) : stripped;
}

export function collectUserImageSlots(files: Array<{ data?: string; mimeType?: string }> | undefined | null): Record<string, string> {
  const slots: Record<string, string> = {};
  if (!Array.isArray(files)) return slots;
  let n = 0;
  for (const file of files) {
    if (!file?.data || !file.mimeType || !String(file.mimeType).startsWith('image/')) continue;
    n += 1;
    if (n > 4) break;
    const raw = String(file.data);
    slots[`user-${n}`] = raw.startsWith('data:')
      ? raw
      : `data:${file.mimeType};base64,${raw.includes(',') ? raw.split(',')[1] : raw}`;
  }
  return slots;
}

/** Swap empty slot images for real bytes after the model finishes. Never put these URIs in the prompt. */
export function injectImageSlots(html: string, slots: Record<string, string>): string {
  let out = html || '';
  for (const [id, uri] of Object.entries(slots)) {
    if (!uri) continue;
    const safeId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<img\\b([^>]*?)data-naje-slot=(["'])${safeId}\\2([^>]*)>`, 'gi');
    out = out.replace(re, (_match, before: string, quote: string, after: string) => {
      let attrs = `${before}data-naje-slot=${quote}${id}${quote}${after}`;
      if (/\ssrc\s*=/i.test(attrs)) attrs = attrs.replace(/\ssrc\s*=\s*(["'])[\s\S]*?\1/i, ` src="${uri}"`);
      else attrs += ` src="${uri}"`;
      return `<img${attrs}>`;
    });
  }
  return out;
}

const SECRET_IN_UI = /AIza[0-9A-Za-z\-_]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]+PRIVATE KEY-----/g;

/** Strip secrets and flag unsafe URLs or inline handlers before a generated page is previewed. */
export function inspectGeneratedUi(html: string): { html: string; issues: string[] } {
  const issues: string[] = [];
  let out = String(html || '');
  if (SECRET_IN_UI.test(out)) {
    issues.push('secret');
    SECRET_IN_UI.lastIndex = 0;
    out = out.replace(SECRET_IN_UI, '[redacted]');
  }
  if (/javascript\s*:/i.test(out)) issues.push('javascript-url');
  if (/data:\s*text\/html/i.test(out)) issues.push('data-text-html');
  if (/(?:^|[\s<"'])on[a-z]+\s*=/i.test(out)) issues.push('inline-handler');
  if (out.length > 40 && !/name\s*=\s*["']viewport["']/i.test(out) && /<\/html>/i.test(out)) issues.push('viewport');
  return { html: out, issues };
}

export const UI_BUILD_DIRECTIVE = `You are Naje Studio. You design one complete, self-contained HTML interface that a senior art director would ship. You are not a template engine.

OUTPUT SHAPE
- First line: ONE short Arabic sentence (max 18 words) telling the user what you made. Then a newline.
- Then the document only: <!DOCTYPE html> ... </html>. No markdown fences, no commentary after the document.
- One <style> block and at most one <script> block. Close every tag. Valid nesting.
- Before each major region write exactly: <!-- naje:section NAME --> where NAME is a short Arabic label (مثال: الغلاف، الفهرس، العمل).

TYPOGRAPHY — pick ONE pairing and commit. Load it with a single <link> to Google Fonts. No other external URL is allowed.
${UI_FONT_PAIRINGS.map((p) => `- ${p.id}: display "${p.display}" + text "${p.text}" — ${p.note}\n  ${p.href}`).join('\n')}
Set font-family on the body and a distinct display face on headings. Never use Inter, Roboto, Arial, Helvetica, system-ui, or Cairo as the design face. Never use more than two families.

COLOR
- Choose an ink, a paper, and ONE accent that belong to the subject. Write them as custom properties.
- The accent is not purple, not indigo, not a purple-to-blue gradient, unless the user's brand literally is that color.
- No glassmorphism as the whole UI. No neon glow. No mesh-gradient hero blob. No dark slate (#0f172a) with indigo buttons.

LAYOUT GRAMMAR — pick ONE and name it in a CSS comment: /* grammar: NAME */
Allowed: editorial-split, instrument, gallery, ledger, stage, index, app-shell.
- editorial-split: asymmetric columns, a real measure for text, one dominant image.
- instrument: dense and quiet, hairlines, tabular numbers, a task not a poster.
- gallery: full-bleed images with captions, not cards in a grid of equals.
- ledger: one column of rows, like a well-set document.
- stage: one object, everything else subordinate.
- index: the list IS the navigation.
- app-shell: ONLY if the user asked for an app screen. A real task, not a widget collage.
FORBIDDEN as the default, even if it "looks polished":
- Centered hero + two buttons + three identical feature cards + logo row + testimonials + pricing + footer.
- Equal bento grids of rounded cards with a tiny icon, a bold title, and a gray sentence.
- Fake social proof ("10k+ users", "99.9% uptime", five stars) unless the user supplied the numbers.
- Emoji as icons. Generic "Unlock / Elevate / Seamless / Next-gen / Welcome to the future" copy.
- A pricing table unless the user asked for prices.
If you notice you are building that banned page, stop and choose a different grammar before you continue.

IMAGES
- Do not paste base64. Do not use random external image URLs (unsplash, picsum, placeholder.com).
- User photos, if any, are inserted by the server. Mark them: <img data-naje-slot="user-1" alt="وصف محدد"> and omit src.
- Generated photos, if the plan lists them, use data-naje-slot="gen-1" and data-naje-slot="gen-2". Omit src.
- If no slot was given, draw with inline SVG or CSS. An original drawing beats a fake stock photo.
- Every image has a real alt in the language of the page. Give images a crop and a reason to exist. Do not sprinkle decorative photos.

CRAFT
- Realistic, specific copy for THIS subject. No lorem, no "Item 1", no "Your title here".
- Type scale with a visible jump between display and body. Comfortable measure (about 60–75 characters) for long text.
- Spacing from a small set (4, 8, 12, 20, 32, 48, 72). Not a random padding on every block.
- Semantic landmarks, labels, visible focus, contrast that can be read in daylight.
- Phone at 390px must change STRUCTURE inside @media (max-width: 640px): columns stack, side navigation becomes a top index or a bottom bar, tables become rows. A query that only shrinks type is a failed page.
- Touch targets at least 44px on the phone layout.
- Interaction that the subject needs: a filter filters, a tab switches, a form validates, a menu opens. In-memory data if the subject is a tool. No frameworks, no fetch, no analytics.

ARABIC
- If the subject is Arabic, <html lang="ar" dir="rtl"> and the text face must be an Arabic family from the list. Latin tokens stay LTR.

SELF-CHECK before you stop
1. Is the grammar one of the seven, and obviously not the banned hero+cards page?
2. Are the fonts one allowed pairing, actually loaded, and not Inter/Roboto/system-ui?
3. Is there a single accent that is not the default AI purple?
4. Does 390px restructure the layout?
5. Are image slots empty of src, and is there no base64 in the file?
If any answer is no, revise the document before you return it.`;
