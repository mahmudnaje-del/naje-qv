import React from 'react';
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
  const scan = recruiterScan(cv);
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
        <p className="text-[10px] font-black tracking-wide text-white/40">معاينة A4 — كما سيُصدَّر</p>
        <button type="button" onClick={onToggle} className={active ? goldBtn : ghostGoldBtn}>
          محاكاة مسح المسؤول
        </button>
      </div>
      {children}
      {active ? (
        <div className="mt-2 space-y-1 px-1">
          <p className="text-[10px] leading-relaxed text-white/50">
            نقاط قد يلاحظها المسؤول أولاً — ليست تنبؤاً بقرار التوظيف.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-black">
            <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-200">
              أخضر · الاسم/المسمّى{scan.name === 'ok' && scan.headline === 'ok' ? '' : ' — ناقص'}
            </span>
            <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-100">
              أصفر · ملخص عام أو تواريخ ناقصة
            </span>
            <span className="rounded-md border border-rose-400/30 bg-rose-500/10 px-1.5 py-0.5 text-rose-200">
              أحمر · اسم أو مسمّى فارغ
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
