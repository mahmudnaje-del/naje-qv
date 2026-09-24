import React from 'react';
import { useI18n } from '../../i18n';
import { recruiterScan, type CvData } from '../../lib/cvStudio';
import { ghostGoldBtn, goldBtn } from './cvUi';

export function CvScanOverlay({
  cv,
  active,
  onToggle,
  children,
}: {
  cv: CvData;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const scan = recruiterScan(cv);
  const bothOk = scan.name === 'ok' && scan.headline === 'ok';
  return (
    <div className={active ? 'naje-cv-scan-root relative' : 'relative'}>
      {active ? (
        <style>{`
          .naje-cv-scan-root [data-cv-scan="name-ok"],
          .naje-cv-scan-root [data-cv-scan="headline-ok"] {
            box-shadow: inset 0 0 0 2px #34d399;
            border-radius: 4px;
          }
          .naje-cv-scan-root [data-cv-scan="name-empty"],
          .naje-cv-scan-root [data-cv-scan="headline-empty"] {
            box-shadow: inset 0 0 0 2px #f87171;
            border-radius: 4px;
          }
          .naje-cv-scan-root [data-cv-scan="summary-generic"],
          .naje-cv-scan-root [data-cv-scan="date-missing"] {
            box-shadow: inset 0 0 0 2px #fbbf24;
            border-radius: 4px;
          }
        `}</style>
      ) : null}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-black tracking-[0.14em] text-[#e8c36a]/80">{t('cv.scan.preview')}</p>
        <button type="button" onClick={onToggle} className={active ? goldBtn : ghostGoldBtn}>
          {t('cv.scan.toggle')}
        </button>
      </div>
      {children}
      {active ? (
        <div className="mt-2 space-y-1 px-1">
          <p className="text-[10px] leading-relaxed text-white/50">{t('cv.scan.note')}</p>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-black">
            <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-200">
              {bothOk ? t('cv.scan.green') : t('cv.scan.greenMissing')}
            </span>
            <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-100">{t('cv.scan.amber')}</span>
            <span className="rounded-md border border-rose-400/30 bg-rose-500/10 px-1.5 py-0.5 text-rose-200">{t('cv.scan.red')}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
