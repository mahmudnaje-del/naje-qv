import React from 'react';
import { Target } from 'lucide-react';
import { CvData, jobKeywordCoverage } from '../../lib/cvStudio';
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
  const { hit, missing, ratio, keys } = jobKeywordCoverage(cv);
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
          {hit.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-black text-emerald-300">موجودة في سيرتك</p>
              <div className="flex flex-wrap gap-1">
                {hit.map((k) => (
                  <span key={k} className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-black text-amber-200">ناقصة — أضفها فقط إن كنت تتقنها</p>
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
        </div>
      )}
    </Box>
  );
}
