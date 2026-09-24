import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { A4_H, A4_W } from './CvPaperStyles';

/** Fits the real A4 sheet to the column. Export still uses the off-screen full sheet. */
export function CvPaperStage({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const well = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const el = well.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      setScale(Math.min(1, Math.max(0.28, w / A4_W)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="cv-folio">
      <span className="cv-folio-corner cv-folio-corner-tl" aria-hidden />
      <span className="cv-folio-corner cv-folio-corner-tr" aria-hidden />
      <span className="cv-folio-corner cv-folio-corner-bl" aria-hidden />
      <span className="cv-folio-corner cv-folio-corner-br" aria-hidden />
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] font-black tracking-[0.22em] text-[#e8c36a]">{t('cv.folio.kicker')}</p>
        <p className="text-[10px] font-bold text-[#f3ead8]/60">{t('cv.folio.page')}</p>
      </div>
      <div className="cv-folio-well">
        <div ref={well} className="overflow-hidden" style={{ height: Math.round(A4_H * scale) }}>
          <div className="flex justify-center">
            <div
              className="cv-folio-sheet"
              style={{
                width: A4_W,
                height: A4_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                flex: '0 0 auto',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-[#f3ead8]/55">{t('cv.folio.caption')}</p>
    </div>
  );
}
