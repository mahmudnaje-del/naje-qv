import React from 'react';
import { FileText, MessageCircle, Sparkles, Upload, User } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  applyMarketDefaults,
  applyPersonaDefaults,
  CvData,
  CvLang,
  CvMarket,
  CvPersona,
  MARKETS,
  PERSONAS,
} from '../../lib/cvStudio';
import { chipOff, chipOn, goldBtn, inputCls } from './cvUi';

const PATHS = [
  { id: 'create', icon: FileText },
  { id: 'talk', icon: MessageCircle },
  { id: 'import', icon: Upload },
  { id: 'profile', icon: User },
] as const;

export function CvHero({
  onCreate,
  onInterview,
  onImport,
  onDemo,
  onUseProfile,
}: {
  onCreate: () => void;
  onInterview: () => void;
  onImport: () => void;
  onDemo: () => void;
  onUseProfile?: () => void;
}) {
  const { t } = useI18n();
  const go = {
    create: onCreate,
    talk: onInterview,
    import: onImport,
    profile: onUseProfile || onCreate,
  };

  return (
    <div className="mx-auto max-w-3xl px-1 py-6 sm:py-10">
      <div className="flex gap-4 sm:gap-5">
        <div className="cv-spine shrink-0 self-stretch" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black tracking-[0.22em] text-[#e8c36a]">{t('cv.brand')}</p>
          <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight text-white sm:text-4xl">{t('cv.hero.headline')}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#f3ead8]/70 sm:text-base">{t('cv.hero.promise')}</p>
          <div className="mt-8 divide-y divide-[#c4a35a]/15 border-y border-[#c4a35a]/25">
            {PATHS.map((row, index) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={go[row.id]}
                  className="flex min-h-[44px] w-full items-center gap-3 py-3 text-start transition hover:bg-[#c4a35a]/8"
                >
                  <span className="w-8 shrink-0 font-mono text-[10px] font-black tracking-[0.14em] text-[#c4a35a]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Icon className="h-4 w-4 shrink-0 text-[#e8c36a]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-white">{t(`cv.hero.${row.id}`)}</span>
                    <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-white/45">{t(`cv.hero.${row.id}Sub`)}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onDemo}
              className="flex min-h-[44px] w-full items-center gap-3 py-3 text-start transition hover:bg-[#c4a35a]/8"
            >
              <span className="inline-flex w-8 shrink-0 items-center">
                <span className="rounded border border-[#e8c36a]/50 px-1 py-0.5 text-[8px] font-black tracking-[0.12em] text-[#e8c36a]">
                  {t('cv.hero.demoMark')}
                </span>
              </span>
              <Sparkles className="h-4 w-4 shrink-0 text-[#e8c36a]" />
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">{t('cv.hero.demo')}</span>
                <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-white/45">{t('cv.hero.demoSub')}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CvOnboard({
  cv,
  onApply,
  onBack,
  onEnter,
}: {
  cv: CvData;
  onApply: (fn: (c: CvData) => CvData) => void;
  onBack: () => void;
  onEnter: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-1 py-4 sm:py-8">
      <button type="button" onClick={onBack} className="mb-4 min-h-[44px] text-[11px] font-black text-white/45">
        {t('cv.onboard.back')}
      </button>
      <div className="flex gap-4">
        <div className="cv-spine shrink-0 self-stretch" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black text-white">{t('cv.onboard.title')}</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">{t('cv.onboard.sub')}</p>

          <p className="mb-2 mt-6 text-[11px] font-black tracking-[0.12em] text-[#e8c36a]">{t('cv.onboard.persona')}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApply((c) => applyPersonaDefaults(c, p.id as CvPersona))}
                className={`min-h-[44px] rounded-xl border px-2 py-2 text-start ${cv.persona === p.id ? chipOn : chipOff}`}
              >
                <span className="block text-[11px] font-black">{t(`cv.persona.${p.id}`)}</span>
                <span className="mt-0.5 block text-[9px] text-white/40">{t(`cv.persona.${p.id}Hint`)}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-[11px] font-black tracking-[0.12em] text-[#e8c36a]">{t('cv.onboard.market')}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MARKETS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onApply((c) => applyMarketDefaults(c, m.id as CvMarket))}
                className={`min-h-[44px] rounded-xl border px-2 py-2 text-start ${cv.market === m.id ? chipOn : chipOff}`}
              >
                <span className="block text-[11px] font-black">{t(`cv.market.${m.id}`)}</span>
                <span className="mt-0.5 block text-[9px] text-white/40">{t(`cv.market.${m.id}Hint`)}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-[11px] font-black tracking-[0.12em] text-[#e8c36a]">{t('cv.onboard.docLang')}</p>
          <div className="flex gap-1.5">
            {(['ar', 'en'] as CvLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onApply((c) => ({ ...c, lang: l }))}
                className={`min-h-[44px] rounded-lg px-3 py-1.5 text-[11px] font-black ${cv.lang === l ? 'bg-[#c4a35a] text-[#1a140c]' : 'border border-white/10 text-white/60'}`}
              >
                {t(l === 'ar' ? 'cv.doc.ar' : 'cv.doc.en')}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-6 text-[11px] font-black tracking-[0.12em] text-[#e8c36a]">{t('cv.onboard.target')}</p>
          <input
            className={inputCls}
            value={cv.targetRole}
            onChange={(e) => onApply((c) => ({ ...c, targetRole: e.target.value }))}
            placeholder={t('cv.onboard.targetPh')}
          />

          <button type="button" onClick={onEnter} className={`${goldBtn} mt-6 w-full py-3 text-sm`}>
            {t('cv.onboard.enter')}
          </button>
        </div>
      </div>
    </div>
  );
}
