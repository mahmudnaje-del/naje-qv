export interface CompactSource {
  title: string;
  type: string;
  snippet: string;
}

const UI_CAP = 18000;
const SOURCE_CAP = 1000;
const OTHER_TOTAL = 6000;

/** Keep the handed-off UI file, and keep other sources as short snippets so a large project is not pasted into every prompt. */
export function compactProjectSources(
  sources: { id?: string; title?: string; type?: string; content?: string; url?: string }[],
  mediaLabel: string
): CompactSource[] {
  let used = 0;
  return sources.map((source) => {
    const isUi = String(source.id || '').startsWith('src_ui_');
    const raw = source.content
      ? source.content.slice(0, isUi ? UI_CAP : SOURCE_CAP)
      : (source.url || mediaLabel);
    const room = isUi ? raw.length : Math.max(0, OTHER_TOTAL - used);
    const snippet = raw.slice(0, room);
    if (!isUi) used += snippet.length;
    return {
      title: source.title || '',
      type: source.type || 'file',
      snippet: snippet || source.title || mediaLabel,
    };
  });
}
