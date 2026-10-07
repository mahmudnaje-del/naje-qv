export const OPEN_FORMATS = ['markdown', 'csv', 'json', 'html', 'txt', 'deck'] as const;
export type OpenFormat = (typeof OPEN_FORMATS)[number];

export type DeckTheme = {
  background: string;
  title: string;
  text: string;
  accent: string;
};

const LAYOUTS = new Set([
  'title_slide',
  'split_image_left',
  'split_image_right',
  'three_cards',
  'two_columns',
  'bullet_list',
  'showcase',
  'comparison_bars',
  'chart_column',
  'chart_compare',
  'icon_list',
  'full_background_image',
]);

export function isSlideRequest(value: unknown): boolean {
  const id = String(value || '').trim().toLowerCase();
  return id === 'deck' || id === 'pptx' || id === 'pdf_slides' || id === 'powerpoint' || id === 'ppt' || id === 'slides';
}

export function isOpenFormatId(value: unknown): value is OpenFormat {
  return typeof value === 'string' && (OPEN_FORMATS as readonly string[]).includes(value);
}

function campaignBrief(prompt: string): boolean {
  return /حملة|هوية بصرية|تطبيق كامل|موقع كامل|فيديو إعلان|مهمة متكاملة|multi-step/i.test(prompt);
}

export function resolveOpenFormat(explicit: string | undefined | null, prompt: string): OpenFormat | null {
  const asked = String(explicit || '').trim().toLowerCase();
  if (isSlideRequest(asked)) return 'deck';
  if (isOpenFormatId(asked)) return asked;
  if (asked && asked !== 'none') return null;
  const text = String(prompt || '').trim();
  if (!text || campaignBrief(text)) return null;
  if (/وورد|\bdocx\b|مستند\s*pdf|تقرير\s*pdf/i.test(text)) return null;
  if (/بوربوينت|powerpoint|\bpptx\b|عرض تقديمي|شرائح\s*pdf|pdf\s*slides/i.test(text)) return 'deck';

  if (/مارك\s*داون|markdown|\.md\b|ملف\s*md\b/i.test(text)) return 'markdown';
  if (/\bcsv\b|قيم مفصولة|ملف جدول/i.test(text)) return 'csv';
  if (/\bjson\b|ملف جيسون|جيسون/i.test(text)) return 'json';
  if (/ملف\s*html|صفحة\s*html|html file|\.html\b/i.test(text)) return 'html';
  if (/ملف نصي|\.txt\b|plain text/i.test(text)) return 'txt';
  if (/(اعمل|سوّ|سوي|أنشئ|انشئ|جهّز|حضر).{0,24}(عرض|سلايد|شرائح)|عرض تقديمي بصري|\bslide deck\b/i.test(text)) return 'deck';
  return null;
}

export function creationActivity(format: OpenFormat, phase: 'read' | 'search' | 'write' | 'slide' | 'pack', slideNo?: number): string {
  if (phase === 'read') return 'surface.activity.read';
  if (phase === 'search') return 'surface.activity.search';
  if (phase === 'slide') return `surface.activity.slide::${slideNo || 1}`;
  if (phase === 'pack') return format === 'deck' ? 'surface.activity.packDeck' : 'surface.activity.packFile';
  if (format === 'deck') return 'surface.activity.writeDeck';
  if (format === 'markdown') return 'surface.activity.writeMd';
  if (format === 'csv') return 'surface.activity.writeCsv';
  if (format === 'json') return 'surface.activity.writeJson';
  if (format === 'html') return 'surface.activity.writeHtml';
  return 'surface.activity.writeTxt';
}

/** Turn a stable activity key from the stream into the active language. Plain text passes through. */
export function localizeActivity(
  raw: string | undefined | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (!raw) return '';
  const cut = raw.indexOf('::');
  const key = cut === -1 ? raw : raw.slice(0, cut);
  const extra = cut === -1 ? '' : raw.slice(cut + 2);
  if (!key.startsWith('surface.')) return raw;
  const value = t(key, extra ? { n: extra } : undefined);
  return value && value !== key ? value : raw;
}

export function wantsLiveSearch(prompt: string, format: OpenFormat): boolean {
  if (format === 'deck') return /ابحث|أحدث|منافس|مصدر|fact|search|2024|2025|2026/i.test(prompt);
  return /ابحث|من الإنترنت|من الانترنت|google|أحدث الأرقام|search the web/i.test(prompt);
}

export function creationSystem(format: OpenFormat, slidesCount?: number): string {
  const shared = `أنت محرّك الإنشاء في ناجي. نفّذ الطلب فعلاً. لا تعتذر بأن الصيغة غير مدعومة. إذا نقصت معلومة، افترض افتراضاً واضحاً واذكره في سطر واحد ثم أكمل.
اكتب باللغة التي كتب بها المستخدم. العربي يبقى عربياً فصيحاً وعملياً.
لا تضع مقدمة خارج الملف.`;

  if (format === 'markdown') {
    return `${shared}
أخرج ملف Markdown فقط، بدون سياج كود. عنوان، أقسام، قوائم، وجدول إذا نفع.`;
  }
  if (format === 'csv') {
    return `${shared}
أخرج CSV فقط. السطر الأول عناوين الأعمدة. افصل بفواصل. لا تضع سياج كود ولا شرح.`;
  }
  if (format === 'json') {
    return `${shared}
أخرج JSON صالحاً فقط، بدون سياج كود وبدون شرح.`;
  }
  if (format === 'html') {
    return `${shared}
أخرج مستند HTML كاملاً يبدأ بـ <!DOCTYPE html>. صفحة واحدة مستقلة، CSS داخلها، وRTL إذا كان المحتوى عربياً. بلا موارد خارجية.`;
  }
  if (format === 'txt') {
    return `${shared}
أخرج نصاً صافياً بلا تنسيق ماركداون ثقيل.`;
  }
  const count = Math.min(20, Math.max(3, Number(slidesCount) || 8));
  return `${shared}
أخرج JSON فقط، بلا سياج، بهذا الشكل:
{
  "title": "عنوان العرض",
  "theme": { "background": "#FFFFFF", "title": "#0F172A", "text": "#334155", "accent": "#4F46E5" },
  "slides": [
    {
      "layoutTemplate": "title_slide",
      "eyebrow": "01",
      "slideTitle": "جملة لا عنوان عام",
      "slideSubtitle": "",
      "speakerNotes": "ملاحظتان للمقدّم.",
      "content": {
        "text": "",
        "bulletPoints": [],
        "aiImagePrompt": "وصف بصري دقيق للمشهد أو الرسم، لا تتركه فارغاً",
        "visualSource": "ai",
        "cards": [{ "title": "", "text": "", "iconKeyword": "spark" }],
        "stats": { "value": "", "label": "" },
        "comparisons": [{ "label": "", "value": 40, "max": 100 }]
      }
    }
  ]
}
القواعد البصرية:
- بالضبط ${count} شرائح.
- نوّع layoutTemplate بين: title_slide, split_image_left, split_image_right, three_cards, two_columns, bullet_list, showcase, comparison_bars, icon_list, full_background_image.
- icon_list و three_cards تحمل بطاقات بعنوان ونص قصير. two_columns للمقارنة بين وضعين.
- comparison_bars و chart_column تستخدمان comparisons بقيم رقمية.
- كل شريحة تحمل فكرة واحدة ظاهرة في slideTitle أو البطاقات أو النقاط. لا تترك شريحة فارغة.
- لا تكرر نفس التخطيط مرتين متتاليتين.
- العنوان جملة قصيرة. النقطة فكرة واحدة.`;
}

export function stripFence(raw: string): string {
  const text = String(raw || '').trim();
  const fence = text.match(/```(?:json|markdown|md|html|csv|txt)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}

function asString(value: unknown, max = 400): string {
  const text = String(value ?? '').trim();
  return text.length > max ? text.slice(0, max) : text;
}

export function parseDeck(raw: string): { title: string; theme: DeckTheme; slides: any[] } | null {
  const body = stripFence(raw);
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
  const slides = Array.isArray(parsed?.slides) ? parsed.slides : [];
  if (!slides.length) return null;
  const themeIn = parsed.theme || {};
  const theme: DeckTheme = {
    background: asString(themeIn.background || '#12141A', 16) || '#12141A',
    title: asString(themeIn.title || '#F6F1E7', 16) || '#F6F1E7',
    text: asString(themeIn.text || '#C9C3B6', 16) || '#C9C3B6',
    accent: asString(themeIn.accent || '#D4A574', 16) || '#D4A574',
  };
  const clean = slides.slice(0, 20).map((slide: any, index: number) => {
    const layout = LAYOUTS.has(slide?.layoutTemplate) ? slide.layoutTemplate : (index === 0 ? 'title_slide' : 'bullet_list');
    const content = slide?.content || {};
    return {
      layoutTemplate: layout,
      eyebrow: asString(slide?.eyebrow, 40),
      slideTitle: asString(slide?.slideTitle || slide?.title || `شريحة ${index + 1}`, 80),
      slideSubtitle: asString(slide?.slideSubtitle, 120),
      speakerNotes: asString(slide?.speakerNotes, 500),
      content: {
        text: asString(content.text, 400),
        bulletPoints: Array.isArray(content.bulletPoints) ? content.bulletPoints.slice(0, 6).map((item: unknown) => asString(item, 160)).filter(Boolean) : [],
        aiImagePrompt: asString(content.aiImagePrompt || content.visual || slide?.slideTitle, 300),
        visualSource: 'ai',
        cards: Array.isArray(content.cards)
          ? content.cards.slice(0, 4).map((card: any) => ({
              title: asString(card?.title, 60),
              text: asString(card?.text, 180),
              iconKeyword: asString(card?.iconKeyword || 'spark', 24),
            }))
          : [],
        stats: content.stats ? { value: asString(content.stats.value, 16), label: asString(content.stats.label, 40) } : undefined,
        comparisons: Array.isArray(content.comparisons)
          ? content.comparisons.slice(0, 5).map((bar: any) => ({
              label: asString(bar?.label, 40),
              value: Number(bar?.value) || 0,
              max: Number(bar?.max) || 100,
            }))
          : [],
      },
    };
  });
  return { title: asString(parsed.title || clean[0]?.slideTitle || 'عرض ناجي', 80), theme, slides: clean };
}

export function artifactMeta(format: Exclude<OpenFormat, 'deck'>, body: string, prompt: string) {
  const title = asString(prompt.replace(/\s+/g, ' '), 42) || 'naje-file';
  const safe = title.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'naje-file';
  const spec: Record<Exclude<OpenFormat, 'deck'>, { extension: string; mime: string }> = {
    markdown: { extension: 'md', mime: 'text/markdown' },
    csv: { extension: 'csv', mime: 'text/csv' },
    json: { extension: 'json', mime: 'application/json' },
    html: { extension: 'html', mime: 'text/html' },
    txt: { extension: 'txt', mime: 'text/plain' },
  };
  const file = spec[format];
  return {
    format,
    title,
    filename: `${safe}.${file.extension}`,
    extension: file.extension,
    mime: file.mime,
    text: stripFence(body),
  };
}
