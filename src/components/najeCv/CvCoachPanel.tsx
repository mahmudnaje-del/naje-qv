import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  atsRisk,
  CAREER_BREAKS,
  careerBreakSelected,
  careerBreakValue,
  careerGaps,
  completeness,
  CvData,
  firstTwoLines,
  HrTip,
  recruiterScan,
  scoreCv,
} from '../../lib/cvStudio';
import { chipOff, chipOn, ghostGoldBtn } from './cvUi';

function tipKey(id: string) {
  if (id.startsWith('date-current')) return 'dateCurrent';
  if (id.startsWith('date-order')) return 'dateOrder';
  return id;
}

export function CvCoachPanel({
  cv,
  dismissed,
  onDismiss,
  onImprove,
  scanMode,
  onToggleScan,
  onCareerBreak,
}: {
  cv: CvData;
  dismissed: string[];
  onDismiss: (id: string) => void;
  onImprove: (id: string) => void;
  scanMode?: boolean;
  onToggleScan?: () => void;
  onCareerBreak?: (value: string) => void;
}) {
  const { t, formatNumber } = useI18n();
  const { score, tips } = scoreCv(cv);
  const risk = atsRisk(cv);
  const ticks = completeness(cv);
  const two = firstTwoLines(cv);
  const scan = recruiterScan(cv);
  const gaps = careerGaps(cv);
  const visible = tips.filter((tip) => !dismissed.includes(tip.id));
  const missing = ticks.filter((item) => !item.ok);
  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-[#e8c36a]' : 'text-rose-300';
  const riskColor = risk.level === 'high' ? 'text-rose-300' : risk.level === 'moderate' ? 'text-amber-200' : 'text-emerald-300';

  const tickWord = (item: (typeof ticks)[number]) => {
    if (item.ok) return t('cv.tick.done');
    if (item.optional) return t('cv.tick.optional');
    return t('cv.tick.missing');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#c4a35a]/25 bg-[#c4a35a]/8 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-white">{t('cv.coach.title')}</h3>
          <div className="text-end">
            <div className="text-[10px] text-white/40">{t('cv.coach.scan')}</div>
            <div className={`font-mono text-lg font-black ${scoreColor}`}>{formatNumber(score)}</div>
          </div>
        </div>
        <p className="mb-3 text-[10px] leading-relaxed text-white/45">{t('cv.coach.scanNote')}</p>
        <div className={`mb-3 flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 ${riskColor}`}>
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-[11px] font-black">{t('cv.coach.atsRisk', { level: t(`cv.risk.${risk.level}`) })}</p>
            {risk.reasons.length ? (
              <ul className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-white/60">
                {risk.reasons.map((r) => (
                  <li key={r}>{t(`cv.risk.reason.${r}`)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[10px] text-white/55">{t('cv.coach.noRisk')}</p>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black tracking-wide text-[#e8c36a]">{t('cv.coach.twoLines')}</p>
            {onToggleScan ? (
              <button type="button" onClick={onToggleScan} className={`${ghostGoldBtn} py-1 text-[9px]`}>
                {scanMode ? t('cv.coach.hideScan') : t('cv.coach.showScan')}
              </button>
            ) : null}
          </div>
          <p className={`text-[15px] font-black ${scan.name === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {two.name || t('cv.coach.namePh')}
          </p>
          <p className={`text-[12px] font-bold ${scan.headline === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {two.headline || t('cv.coach.headlinePh')}
          </p>
          <p
            className={`mt-1 text-[11px] leading-relaxed ${
              scan.summaryFirst === 'ok' ? 'text-emerald-200/80' : scan.summaryFirst === 'generic' ? 'text-amber-200' : 'text-white/45'
            }`}
          >
            {two.summaryFirst || t('cv.coach.summaryPh')}
          </p>
          <p className="mt-2 text-[9px] leading-relaxed text-white/40">{t('cv.coach.scanLegend')}</p>
        </div>

        {gaps.length > 0 && (
          <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/8 p-2.5">
            <p className="text-[11px] font-black text-amber-100">{t('cv.coach.gapAsk')}</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">{t('cv.coach.gapNote')}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {CAREER_BREAKS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCareerBreak?.(careerBreakValue(c, cv.lang))}
                  className={`min-h-[44px] rounded-lg border px-2 py-1 text-[10px] font-black ${careerBreakSelected(cv.careerBreak, c) ? chipOn : chipOff}`}
                >
                  {t(`cv.break.${c.id}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mb-1.5 text-[10px] font-black text-white/50">{t('cv.coach.complete')}</p>
        <div className="mb-3 flex flex-wrap gap-1">
          {ticks.map((item) => (
            <span
              key={item.id}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${
                item.ok ? 'bg-emerald-500/15 text-emerald-200' : item.optional ? 'bg-white/5 text-white/35' : 'bg-rose-500/10 text-rose-200'
              }`}
            >
              {tickWord(item)} · {t(`cv.tick.${item.id}`)}
            </span>
          ))}
        </div>

        {missing.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-black text-[#e8c36a]">{t('cv.coach.missingTitle')}</p>
            <p className="mb-1.5 text-[10px] leading-relaxed text-white/40">{t('cv.coach.missingNote')}</p>
            <div className="flex flex-wrap gap-1">
              {missing.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onImprove(item.id)}
                  className="min-h-[44px] rounded-lg border border-[#c4a35a]/30 px-2 py-1 text-[10px] font-black text-[#e8c36a]"
                >
                  {t(`cv.tick.${item.id}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {visible.map((tip: HrTip) => (
            <li
              key={tip.id}
              className={`rounded-xl border p-2.5 ${
                tip.level === 'stop'
                  ? 'border-rose-400/30 bg-rose-500/10'
                  : tip.level === 'ok'
                    ? 'border-emerald-400/30 bg-emerald-500/10'
                    : 'border-amber-400/25 bg-amber-500/10'
              }`}
            >
              <p className="text-[11px] font-black text-white">{t(`cv.tip.${tipKey(tip.id)}.title`, tip.params)}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/65">{t(`cv.tip.${tipKey(tip.id)}.body`, tip.params)}</p>
              {tip.level !== 'ok' && (
                <div className="mt-2 flex gap-2">
                  <button type="button" className={`${ghostGoldBtn} py-1`} onClick={() => onImprove(tip.id)}>
                    {t('cv.coach.improve')}
                  </button>
                  <button type="button" className="min-h-[44px] text-[10px] font-black text-white/40" onClick={() => onDismiss(tip.id)}>
                    {t('cv.coach.dismiss')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
