import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import NajeThinking from '../NajeThinking';
import { askNaje, parseModelJson } from '../../lib/askNaje';
import { CV_PATCH_SCHEMA, NAJE_CV_TRUTH, patchPreviewLines } from '../../lib/cvStudio';
import { goldBtn, ghostGoldBtn, inputCls } from './cvUi';

async function extractDocx(file: File): Promise<string> {
  // mammoth is a listed dependency (browser extractRawText). Types may be absent in this toolchain.
  // @ts-ignore mammoth has no guaranteed local types in this workspace
  const mod = await import('mammoth');
  const mammoth = (mod as any).default || mod;
  if (!mammoth?.extractRawText) throw new Error('تعذر تحميل قارئ Word');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return String(result?.value || '').trim();
}

export function CvImport({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (patch: Record<string, unknown>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState('');
  const [pdfNote, setPdfNote] = useState(false);
  const [busy, setBusy] = useState<'file' | 'ai' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patch, setPatch] = useState<Record<string, unknown> | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!open) return null;

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    setPatch(null);
    setPdfNote(false);
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      setPdfNote(true);
      setRaw('');
      return;
    }
    setBusy('file');
    try {
      if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const text = await extractDocx(file);
        if (!text) throw new Error('الملف بلا نص قابل للقراءة');
        setRaw(text);
      } else if (name.endsWith('.txt') || file.type.startsWith('text/') || name.endsWith('.md')) {
        setRaw(await file.text());
      } else {
        setError('الصيغ المدعومة: DOCX و TXT. للـPDF الصق النص يدوياً.');
      }
    } catch (e: any) {
      setError(e?.message || 'تعذر قراءة الملف');
    } finally {
      setBusy(null);
    }
  };

  const parse = async () => {
    if (raw.trim().length < 20) {
      setError('الصق نصاً أطول أو استورد ملف Word');
      return;
    }
    setBusy('ai');
    setError(null);
    setPatch(null);
    try {
      const prompt = `${NAJE_CV_TRUTH}

حوّل نص السيرة التالي إلى JSON:
{"patch":{...},"confirm":"ملخص جملة"}
${CV_PATCH_SCHEMA}
استخرج فقط ما هو مكتوب. لا تخترع وظائف أو معدلات أو أرقام. إن غاب حقل اتركه.

النص:
${raw.trim().slice(0, 12000)}`;
      const res = await askNaje(prompt, { model: 'core' });
      const json = parseModelJson(res);
      const p = json?.patch && typeof json.patch === 'object' ? json.patch : json && json.fullName ? json : null;
      if (!p || typeof p !== 'object') throw new Error('ناجي لم يُرجع هيكلاً قابلاً للمراجعة');
      setPatch(p);
      setConfirmText(String(json?.confirm || 'هذا ما استُخرج من الملف. لن يُدمج حتى تؤكد.'));
    } catch (e: any) {
      setError(e?.message || 'تعذر التحويل');
    } finally {
      setBusy(null);
    }
  };

  const lines = patch ? patchPreviewLines(patch) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" dir="rtl">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#c4a35a]/25 bg-[#0b1220] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-[#e8c36a]">استيراد</p>
            <p className="text-sm font-black text-white">Word أو نص — ثم تأكيد</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/50" aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ghostGoldBtn} onClick={() => fileRef.current?.click()} disabled={!!busy}>
              <Upload className="h-3.5 w-3.5" /> اختر ملفاً
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.txt,.md,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
          {pdfNote && (
            <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-100">
              لا نفكّك ملفات PDF في المتصفح دون مكتبة إضافية. افتح الملف وانسخ النص هنا — هذا أصدق من تحليل وهمي.
            </p>
          )}
          <textarea
            className={inputCls}
            rows={8}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setPatch(null);
            }}
            placeholder="الصق نص سيرتك هنا، أو استورد DOCX…"
          />
          <button type="button" className={goldBtn} disabled={!!busy} onClick={() => void parse()}>
            {busy === 'ai' ? <NajeThinking size={16} /> : null}
            {busy === 'file' ? 'يقرأ الملف…' : busy === 'ai' ? 'يستخرج…' : 'حوّل إلى سيرة'}
          </button>
          {error && <p className="text-[11px] text-rose-300">{error}</p>}
          {patch && (
            <div className="rounded-2xl border border-[#c4a35a]/35 bg-[#c4a35a]/10 p-3">
              <p className="text-[10px] font-black text-[#e8c36a]">مراجعة قبل الدمج</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white">{confirmText}</p>
              {lines.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-white/65">
                  {lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className={goldBtn}
                  onClick={() => {
                    onConfirm(patch);
                    onClose();
                  }}
                >
                  تأكيد الدمج
                </button>
                <button type="button" className="text-[11px] font-black text-white/45" onClick={() => setPatch(null)}>
                  رفض
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
