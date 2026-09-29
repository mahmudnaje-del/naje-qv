import { TranslationSchema } from '../types';
import { en } from './en';

export const tr: TranslationSchema = {
  ...en,
  common: {
    ...en.common,
    welcomeUser: 'Hoş geldin, {{name}}',
  },
  nav: {
    ...en.nav,
    brandTitle: 'NAJE Stüdyo',
  },
  onboarding: {
    ...en.onboarding,
    welcomeTitle: 'NAJE Stüdyo’ya hoş geldiniz',
    welcomeSubtitle: 'Fikirleri gerçek üretime çeviren yapay zekâ platformu.',
    step1Title: 'Fikrinizin başladığı yer',
    step1Desc: 'NAJE sohbet, planlama, içerik, tasarım, reklam, video, ses, belge ve yazılımı tek deneyimde birleştirir.',
    step1CardTitle: 'Üretim için tasarlandı',
    step1CardDesc: 'Sadece bir sohbet penceresi değil — anlama, planlama, üretme ve sonuçlar üzerinde çalışma.',
    step2Title: 'Stüdyolar',
    step2Desc: 'Her ürünün kendi iş akışı var: ajanlar, prompt, reklam, motion, CV, kod ve kaynaklar.',
    finishBtn: 'Üretime başla',
    completedToast: 'Tur bitti. NAJE Stüdyo’ya hoş geldiniz.',
  },
  najeModules: {
    najeAgentDesc: 'Görevleri bölen, planlayan ve özel araçlarla yürüten ajan sistemi.',
    najePromptDesc: 'İlk fikri net, tam bir isteğe dönüştüren stüdyo.',
    najeAdDesc: 'Konseptten sahneye ve nihai sonuca reklam stüdyosu.',
    najeMotionDesc: 'Intro, outro ve görsel hareket için profesyonel planlar.',
    najeCvDesc: 'ATS uyumuna yardımcı araçlarla profesyonel CV.',
    najeDeveloperDesc: 'Yazılım projesini yükleyin, kodu konuşun, geliştirin ve dışa aktarın.',
    najeSourceDesc: 'Yalnızca sizin eklediğiniz kaynaklara dayanan sohbet.',
    creativeStudioDesc: 'Fikir, tasarım, görsel kimlik ve pazarlama materyalleri.',
    creativeAiDesc: 'Tek yerden içerik, tasarım ve marka kimliği.',
  },
};
