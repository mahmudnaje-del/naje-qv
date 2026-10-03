import React from 'react';
import { Clapperboard, Film, Sparkles, Wand2, ShieldCheck, Video, Zap } from 'lucide-react';
import type { HeroPresetId, MotionKind } from '../../lib/motionStudio';
import { useMotionI18n } from './i18n';
import { KindCards } from './KindCards';
import { RegFrame } from './StudioUi';
import { NajeIdentIcon } from '../icons/SuiteIcons';

export function HeroLaunch({
  onChoose,
}: {
  onChoose: (kind: MotionKind, preset?: HeroPresetId) => void;
}) {
  const { t } = useMotionI18n();

  return (
    <RegFrame bars className="overflow-hidden rounded-2xl sm:rounded-[32px] bg-gradient-to-b from-[#111726] to-[#0a0d14] p-4 sm:p-8 shadow-2xl shadow-black/70 border border-[#8ec8ff]/20">
      {/* Top Studio Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#8ec8ff]/30 bg-[#8ec8ff]/10 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-[#e7eef8]">
          <NajeIdentIcon size={28} className="h-7 w-7 shrink-0" />
          <span className="motion-tally inline-block h-2 w-2 rounded-full bg-[#ffb020] animate-pulse" aria-hidden />
          <span className="text-[#ffb020] font-mono">IDENT STUDIO</span>
          <span className="text-[#93a0b5] text-[10px]">· موشن غرافيك وشارات بصرية</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-[#93a0b5]">
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#8ec8ff]" />
            <span>توليد ذكي فائق الدقة</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>متوافق مع كل المنصات</span>
          </span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="max-w-2xl">
        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-snug tracking-tight text-[#e7eef8]">
          {t('motion.hero.title')}
        </h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm lg:text-base leading-relaxed text-[#93a0b5]">
          {t('motion.hero.subtitle')}
        </p>
      </div>

      {/* Presets and Kind Cards */}
      <div className="mt-5 sm:mt-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-black text-[#e7eef8] tracking-tight">
            اختر نوع الشارة للبدء مباشرة:
          </span>
          <span className="text-[10px] text-[#8ec8ff] font-bold">
            جاهز ومعدل بمقاسات المنصات
          </span>
        </div>
        <KindCards variant="hero" onChange={onChoose} />
      </div>

      {/* Feature Pills */}
      <div className="mt-5 sm:mt-6 pt-4 border-t border-[#8ec8ff]/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] sm:text-xs text-[#93a0b5]">
        <div className="p-2 rounded-xl bg-black/30 border border-[#8ec8ff]/10 flex flex-col items-center gap-1">
          <Film className="w-4 h-4 text-[#8ec8ff]" />
          <span className="font-bold text-[#e7eef8]">16:9 & 9:16 & 1:1</span>
          <span className="text-[9px] text-[#93a0b5]/80">لكل أحجام الشاشات</span>
        </div>
        <div className="p-2 rounded-xl bg-black/30 border border-[#8ec8ff]/10 flex flex-col items-center gap-1">
          <Sparkles className="w-4 h-4 text-[#ffb020]" />
          <span className="font-bold text-[#e7eef8]">هوية بصرية متكاملة</span>
          <span className="text-[9px] text-[#93a0b5]/80">ألوان، خطوط، وشعار مخصص</span>
        </div>
        <div className="p-2 rounded-xl bg-black/30 border border-[#8ec8ff]/10 flex flex-col items-center gap-1">
          <Video className="w-4 h-4 text-[#8ec8ff]" />
          <span className="font-bold text-[#e7eef8]">دقة 1080p FHD</span>
          <span className="text-[9px] text-[#93a0b5]/80">إخراج سينمائي جاهز للمونتاج</span>
        </div>
        <div className="p-2 rounded-xl bg-black/30 border border-[#8ec8ff]/10 flex flex-col items-center gap-1">
          <Wand2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-[#e7eef8]">مخرج ذكاء اصطناعي</span>
          <span className="text-[9px] text-[#93a0b5]/80">تنسيق المشاهد واللقطات تلقائياً</span>
        </div>
      </div>
    </RegFrame>
  );
}
