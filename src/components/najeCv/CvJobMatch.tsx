import React from 'react';
import { Target } from 'lucide-react';
import { CvData, jobAlignment, jobKeywordCoverage } from '../../lib/cvStudio';
import { Box, ghostGoldBtn, inputCls } from './cvUi';

export function CvJobMatch({
  cv,
  onPosting,
  onAddSkill,
}: {
  cv: CvData;
  onPosting: (text: string) => void;
  onAddSkill: (keyword: string) => void;
}) {
  const { hit, missing, ratio, keys, strong, partial } = jobKeywordCoverage(cv);
  const align = jobAlignment(cv);
  const ready = cv.jobPosting.trim().length >= 20;

  return (
    <Box
      id="cv-sec-jobmatch"
      icon={<Target className="h-4 w-4 text-[#c4a35a]" />}
      title="تطابق كلمات الإعلان"
      hint="تغطية حقيقية بين نص الإعلان وسيرتك — ليست درجة ATS ولا ضمان مقابلة."
    >
      <textarea
        rows={5}
        className={inputCls}
        value={cv.jobPosting}
        onChange={(e) => onPosting(e.target.value)}
        placeholder="الصق إعلان الوظيفة كما هو…"
      />
      {!ready && <p className="mt-2 text-[11px] text-white/40">الصق 20 حرفاً على الأقل لنحسب التداخل.</p>}
      {ready && (
        <div className="mt-3 space-y-3">
          <p className="text-[12px] font-black text-white">
            تغطية الكلمات: {hit.length} من {keys.length}
            <span className="mr-2 font-mono text-[11px] text-white/45">({Math.round(ratio * 100)}٪ تداخل لفظي)</span>
          </p>
          {strong.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-black text-emerald-300">تطابق قوي — في المسمّى أو المهارات</p>
              <div className="flex flex-wrap gap-1">
                {strong.map((k) => (
                  <span key={k} className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {partial.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-black text-sky-200">تطابق جزئي — ورد في الملخص أو الخبرات</p>
              <div className="flex flex-wrap gap-1">
                {partial.map((k) => (
                  <span key={k} className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-100">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-black text-amber-200">ناقص — أضفه فقط إن كنت تتقنه. ناجي لا يضيف مهارة نيابةً عنك.</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onAddSkill(k)}
                    className={`${ghostGoldBtn} py-1 text-[10px]`}
                    title="يُضاف إلى حقل المهارات بعد أن تقرّ أنك تمتلكها"
                  >
                    أضف للكلمات: {k}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(align.experience.relevant.length > 0 || align.experience.partial.length > 0 || align.experience.none.length > 0) && (
            <div className="space-y-1 text-[10px] leading-relaxed text-white/55">
              <p className="font-black text-white/70">محاذاة الخبرات مع الإعلان — تداخل لفظي فقط</p>
              {align.experience.relevant.map((x) => (
                <p key={x}>ذات صلة: {x}</p>
              ))}
              {align.experience.partial.map((x) => (
                <p key={x}>جزئياً: {x}</p>
              ))}
              {align.experience.none.map((x) => (
                <p key={x}>غير ظاهرة في كلمات الإعلان: {x}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Box>
  );
}
