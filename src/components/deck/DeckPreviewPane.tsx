import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n';
import { toast } from '../../toastStore';
import { exportDeckFile } from '../../lib/deckExport';
import DeckSlideStage, { DeckSlide, DeckThemeInput } from './DeckSlideStage';

type Props = {
  title?: string;
  slides: DeckSlide[];
  theme?: DeckThemeInput | null;
  building?: boolean;
};

export default function DeckPreviewPane({ title, slides, theme, building }: Props) {
  const { t, isRtl } = useI18n();
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0.4);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'pptx' | null>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const total = slides?.length || 0;

  useEffect(() => {
    setIndex(0);
  }, [title, total]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setScale(Math.max(0.12, Math.min(w / 1280, h / 720)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') setIndex((n) => isRtl ? Math.min(total - 1, n + 1) : Math.max(0, n - 1));
      if (e.key === 'ArrowRight') setIndex((n) => isRtl ? Math.max(0, n - 1) : Math.min(total - 1, n + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRtl, total]);

  const slide = slides[Math.min(index, Math.max(0, total - 1))];
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const download = async (kind: 'pdf' | 'pptx') => {
    if (busy) return;
    setMenu(false);
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

  if (!slide) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-500">
        {t('create.deckEmpty')}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-100/80 dark:bg-[#0c0e13]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-300 shadow-sm max-w-[55%]">
          <span className={cn('w-2 h-2 rounded-full bg-emerald-500', building && 'animate-pulse')} />
          <span className="truncate">{building ? t('create.buildingDeck') : t('create.deckBuilt')}</span>
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{busy ? t('create.exporting') : t('create.export')}</span>
            </button>
            {menu && (
              <div className="absolute top-full mt-1 end-0 z-20 min-w-[148px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <button type="button" onClick={() => download('pdf')} className="w-full text-start px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">PDF</button>
                <button type="button" onClick={() => download('pptx')} className="w-full text-start px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">PPTX</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-1 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index <= 0}
          className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
          aria-label={t('create.prevSlide')}
        >
          <PrevIcon className="w-4 h-4" />
        </button>
        <div className="min-w-[88px] text-center text-[12px] font-bold tabular-nums text-slate-600 dark:text-slate-300">
          {t('create.slideOf', { n: index + 1, total })}
        </div>
        <button
          type="button"
          onClick={() => setIndex((n) => Math.min(total - 1, n + 1))}
          disabled={index >= total - 1}
          className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
          aria-label={t('create.nextSlide')}
        >
          <NextIcon className="w-4 h-4" />
        </button>
        {title ? <div className="hidden sm:block text-[12px] font-bold text-slate-500 truncate max-w-[240px] ms-2">{title}</div> : null}
      </div>

      <div ref={stageRef} className="flex-1 min-h-0 relative mx-3 mb-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-200/60 dark:bg-black/30 overflow-hidden">
        <div
          style={{
            width: 1280,
            height: 720,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
            boxShadow: '0 18px 50px rgba(15,23,42,0.18)',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <DeckSlideStage slide={slide} theme={theme} index={index} total={total} deckTitle={title} />
        </div>
      </div>
    </div>
  );
}
