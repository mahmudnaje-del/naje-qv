import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n';
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
  const { t } = useI18n();
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
      <Field label={t('cv.skills.comma')} hint={t('cv.skills.commaHint')}>
        <textarea
          rows={2}
          className={inputCls}
          value={skills}
          onChange={(e) => onChange({ skills: e.target.value, skillsList: list })}
          placeholder={t('cv.skills.commaPh')}
        />
      </Field>

      <div className="rounded-xl border border-[#c4a35a]/15 bg-black/25 p-2.5">
        <p className="mb-2 text-[11px] font-black tracking-[0.08em] text-[#e8c36a]">{t('cv.skills.studio')}</p>
        <div className="flex flex-wrap gap-1.5">
          <input
            className={`${inputCls} min-w-[140px] flex-1`}
            placeholder={t('cv.skills.addPh')}
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
                className={`min-h-[44px] rounded-lg border px-2 py-1 text-[10px] font-black ${level === l.id ? chipOn : chipOff}`}
              >
                {t(`cv.level.${l.id}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#c4a35a]/40 px-2 py-1 text-[10px] font-black text-[#e8c36a]"
          >
            <Plus className="h-3 w-3" /> {t('cv.skills.add')}
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
                  className="mt-2 min-h-[44px] min-w-[44px] text-white/35"
                  aria-label={t('cv.field.delete')}
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
                    className={`min-h-[44px] rounded-lg border px-2 py-0.5 text-[9px] font-black ${s.level === l.id ? chipOn : chipOff}`}
                  >
                    {t(`cv.level.${l.id}`)}
                  </button>
                ))}
              </div>
              {s.level === 'expert' && (
                <div className="mt-1.5">
                  <p className="mb-1 text-[10px] font-black text-[#e8c36a]">{t('cv.skills.where')}</p>
                  <input
                    className={inputCls}
                    placeholder={t('cv.skills.evidencePh')}
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
