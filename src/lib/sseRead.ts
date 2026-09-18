export async function readNajeSse(
  res: Response,
  onEvent: (data: any) => void
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('لا يوجد رد من الخادم.');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = done ? '' : (events.pop() || '');
    for (const block of events) {
      const line = block.split('\n').find(l => l.startsWith('data: ')) || '';
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6);
      if (raw === '[DONE]') return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) throw new Error(parsed.error);
        onEvent(parsed);
      } catch (e: any) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
    if (done) break;
  }
}
