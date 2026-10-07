import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Eye, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { toast } from '../../toastStore';
import { exportDeckFile } from '../../lib/deckExport';
import type { DeckSlide, DeckThemeInput } from './DeckSlideStage';

type Props = {
  title?: string;
  slides: DeckSlide[];
  theme?: DeckThemeInput | null;
  onPreview: () => void;
};

export default function DeckMessageCard({ title, slides, theme, onPreview }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'pptx' | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const download = async (kind: 'pdf' | 'pptx') => {
    if (busy) return;
    setOpen(false);
    setBusy(kind);
    try {
      await exportDeckFile({ title, slides, theme }, kind);
    } catch (err) {
      console.error(err);
      toast.error(t('create.exportFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-gray-900 dark:text-white truncate">{title || t('create.deck')}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t('create.deckSlides', { count: slides.length })} · PDF · PPTX</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('studio.previewTab')}</span>
        </button>
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={!!busy}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{busy ? t('create.exporting') : t('create.export')}</span>
          </button>
          {open && (
            <div className="absolute bottom-full mb-1 end-0 z-30 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <button type="button" onClick={() => download('pdf')} className="w-full text-start px-3 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">.pdf</button>
              <button type="button" onClick={() => download('pptx')} className="w-full text-start px-3 py-2 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">.pptx</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
