import React from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  atsRisk,
  atsRiskLabel,
  completeness,
  CvData,
  firstTwoLines,
  HrTip,
  scoreCv,
} from '../../lib/cvStudio';
import { ghostGoldBtn } from './cvUi';

export function CvCoachPanel({
  cv,
  dismissed,
  onDismiss,
  onImprove,
}: {
  cv: CvData;
  dismissed: string[];
  onDismiss: (id: string) => void;
  onImprove: (id: string) => void;
}) {
  const { score, tips } = scoreCv(cv);
  const risk = atsRisk(cv);
  const ticks = completeness(cv);
  const two = firstTwoLines(cv);
  const visible = tips.filter((t) => !dismissed.includes(t.id));
  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-[#e8c36a]' : 'text-rose-300';
  const riskColor = risk.level === 'high' ? 'text-rose-300' : risk.level === 'moderate' ? 'text-amber-200' : 'text-emerald-300';

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#c4a35a]/25 bg-[#c4a35a]/8 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">مدرب المسح</h3>
          <div className="text-left">
            <div className="text-[10px] text-white/40">جاهزية المسح</div>
            <div className={`font-mono text-lg font-black ${scoreColor}`}>{score}</div>
          </div>
        </div>
        <p className="mb-3 text-[10px] leading-relaxed text-white/45">
          جاهزية المسح تقيس وضوح الاسم والمسمّى والملخص والتواريخ — ليست «فرص قبول» ولا درجة ATS.
        </p>
        <div className={`mb-3 flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 ${riskColor}`}>
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-[11px] font-black">{atsRiskLabel(risk.level)}</p>
            {risk.reasons.length ? (
              <ul className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-white/60">
                {risk.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[10px] text-white/55">لا مؤشرات كسر قراءة واضحة في القالب الحالي.</p>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-1 text-[10px] font-black tracking-wide text-[#e8c36a]">اختبار السطرين الأولين</p>
          <p className="text-[15px] font-black text-white">{two.name || '— الاسم —'}</p>
          <p className="text-[12px] font-bold text-[#c4a35a]">{two.headline || '— المسمّى —'}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/65">{two.summaryFirst || '— أول سطر في الملخص —'}</p>
        </div>

        <p className="mb-1.5 text-[10px] font-black text-white/50">اكتمال الأقسام</p>
        <div className="mb-3 flex flex-wrap gap-1">
          {ticks.map((t) => (
            <span
              key={t.id}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${
                t.ok ? 'bg-emerald-500/15 text-emerald-200' : t.optional ? 'bg-white/5 text-white/35' : 'bg-rose-500/10 text-rose-200'
              }`}
            >
              {t.ok ? 'تم' : t.optional ? 'اختياري' : 'ناقص'} · {t.ar}
            </span>
          ))}
        </div>

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
              <p className="text-[11px] font-black text-white">{tip.title}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/65">{tip.body}</p>
              {tip.level !== 'ok' && (
                <div className="mt-2 flex gap-2">
                  <button type="button" className={`${ghostGoldBtn} py-1`} onClick={() => onImprove(tip.id)}>
                    تحسين
                  </button>
                  <button type="button" className="text-[10px] font-black text-white/40" onClick={() => onDismiss(tip.id)}>
                    تجاهل
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
