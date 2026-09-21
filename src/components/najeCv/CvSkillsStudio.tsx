import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CvSkill, SkillLevel, SKILL_LEVELS, skillsNamesString, uid } from '../../lib/cvStudio';
import { chipOff, chipOn, Field, inputCls } from './cvUi';

export function CvSkillsStudio({
  skills,
  skillsList,
  onChange,
}: {
  skills: string;
  skillsList?: CvSkill[];
  onChange: (next: { skills: string; skillsList: CvSkill[] }) => void;
}) {
  const [draft, setDraft] = useState('');
  const [level, setLevel] = useState<SkillLevel>('intermediate');
  const list: CvSkill[] =
    skillsList && skillsList.length
      ? skillsList
      : skills
          .split(/[,،\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ id: `seed-${name}`, name, level: 'intermediate' as SkillLevel, evidence: '' }));

  const commitList = (next: CvSkill[]) => {
    onChange({ skillsList: next, skills: skillsNamesString(next, skills) });
  };

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (list.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    commitList([...list, { id: uid(), name, level, evidence: '' }]);
    setDraft('');
    setLevel('intermediate');
  };

  return (
    <div className="space-y-3">
      <Field label="مهارات مفصولة بفاصلة" hint="هذا النص هو ما تقرأه الآلة والقوالب. الاستوديو أدناه يزامنه من الأسماء فقط — بلا نجوم على ورق ATS.">
        <textarea
          rows={2}
          className={inputCls}
          value={skills}
          onChange={(e) => onChange({ skills: e.target.value, skillsList: list })}
          placeholder="Excel، SAP، تفاوض..."
        />
      </Field>

      <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
        <p className="mb-2 text-[11px] font-black text-[#e8c36a]">استوديو المهارات</p>
        <div className="flex flex-wrap gap-1.5">
          <input
            className={`${inputCls} min-w-[140px] flex-1`}
            placeholder="أضف مهارة تتقنها"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <div className="flex flex-wrap gap-1">
            {SKILL_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevel(l.id)}
                className={`rounded-lg border px-2 py-1 text-[10px] font-black ${level === l.id ? chipOn : chipOff}`}
              >
                {l.ar}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]"
          >
            <Plus className="h-3 w-3" /> إضافة
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li key={s.id} className="rounded-xl border border-white/10 p-2">
              <div className="flex items-start gap-2">
                <input
                  className={inputCls}
                  value={s.name}
                  onChange={(e) =>
                    commitList(list.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                  }
                />
                <button
                  type="button"
                  onClick={() => commitList(list.filter((x) => x.id !== s.id))}
                  className="mt-2 text-white/35"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {SKILL_LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => commitList(list.map((x) => (x.id === s.id ? { ...x, level: l.id } : x)))}
                    className={`rounded-lg border px-2 py-0.5 text-[9px] font-black ${s.level === l.id ? chipOn : chipOff}`}
                  >
                    {l.ar}
                  </button>
                ))}
              </div>
              {s.level === 'expert' && (
                <div className="mt-1.5">
                  <p className="mb-1 text-[10px] font-black text-[#e8c36a]">أين استخدمتها؟</p>
                  <input
                    className={inputCls}
                    placeholder="اختياري — شركة، مشروع، أو سياق. لا نمنع الحفظ إن تركتها فارغة."
                    value={s.evidence}
                    onChange={(e) =>
                      commitList(list.map((x) => (x.id === s.id ? { ...x, evidence: e.target.value } : x)))
                    }
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
