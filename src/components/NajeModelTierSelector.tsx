import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Cpu, Film, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePricingConfig } from '../hooks/usePricingConfig';
import najeTierLite from '../assets/icons/naje-tier-lite.svg';
import najeTierCore from '../assets/icons/naje-tier-core.svg';
import najeTierMax from '../assets/icons/naje-tier-max.svg';

const TierLiteIcon = ({ className }: { className?: string }) => (
  <img src={najeTierLite} alt="Lite" className={cn("w-4 h-4 object-contain", className)} />
);
const TierCoreIcon = ({ className }: { className?: string }) => (
  <img src={najeTierCore} alt="Core" className={cn("w-4 h-4 object-contain", className)} />
);
const TierMaxIcon = ({ className }: { className?: string }) => (
  <img src={najeTierMax} alt="Max" className={cn("w-4 h-4 object-contain", className)} />
);

// ==========================================
// 1. TEXT / UI MODEL TIERS
// ==========================================
export type ModelTier = 'lite' | 'core' | 'max';

export interface ModelTierConfig {
  id: ModelTier;
  label: string;
  badge: string;
  hint: string;
  multiplier: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgActive: string;
}

export const MODEL_TIERS: Record<ModelTier, ModelTierConfig> = {
  lite: {
    id: 'lite',
    label: 'Naje Lite',
    badge: 'فائق السرعة',
    hint: 'الأسرع والأخفّ — استجابة فورية وتفكير مباشر وسريع.',
    multiplier: '0.6x',
    icon: TierLiteIcon,
    accentColor: 'text-amber-500 dark:text-amber-400',
    bgActive: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15',
  },
  core: {
    id: 'core',
    label: 'Naje Core',
    badge: 'المتوازن (افتراضي)',
    hint: 'المتوازن — ذكاء متطور وسرعة فائقة لمعظم المهام اليومية والمعقدة.',
    multiplier: '1.0x',
    icon: TierCoreIcon,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgActive: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/30',
  },
  max: {
    id: 'max',
    label: 'Naje Pro',
    badge: 'تفكير احترافي',
    hint: 'الأعمق — تفكير استدلالي وتحليلي متقدم للمهام البرمجية والاستراتيجية.',
    multiplier: '2.0x',
    icon: TierMaxIcon,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgActive: 'bg-purple-50 dark:bg-purple-950/60 border-purple-500/30',
  },
};

export const MODEL_TIER_INFO: Record<ModelTier, { label: string; hint: string }> = {
  lite: { label: MODEL_TIERS.lite.label, hint: MODEL_TIERS.lite.hint },
  core: { label: MODEL_TIERS.core.label, hint: MODEL_TIERS.core.hint },
  max:  { label: MODEL_TIERS.max.label, hint: MODEL_TIERS.max.hint },
};

interface NajeModelTierSelectorProps {
  value: ModelTier;
  onChange: (tier: ModelTier) => void;
  className?: string;
  disabled?: boolean;
  dropDirection?: 'up' | 'down';
}

export default function NajeModelTierSelector({
  value = 'core',
  onChange,
  className,
  disabled,
  dropDirection = 'up'
}: NajeModelTierSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTier = MODEL_TIERS[value] || MODEL_TIERS.core;
  const CurrentIcon = currentTier.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block text-right z-30", className)} ref={containerRef} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer select-none",
          "bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200/90 dark:hover:bg-gray-700/90",
          "border border-gray-300/70 dark:border-gray-700/80 shadow-sm",
          "text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
          open && "ring-2 ring-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <CurrentIcon className={cn("w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110", currentTier.accentColor)} />
        <span className="truncate whitespace-nowrap">{currentTier.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-gray-500 transition-transform duration-200 shrink-0", open && "rotate-180 text-indigo-600 dark:text-indigo-400")} />
      </button>

      {/* Pop-up Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="listbox"
            className={cn(
              "absolute z-50 w-72 sm:w-80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl",
              "bg-white/95 dark:bg-gray-900/95 border border-gray-200/90 dark:border-gray-800/90",
              "flex flex-col gap-1 ring-1 ring-black/5 dark:ring-white/10",
              dropDirection === 'up' 
                ? "bottom-full mb-2 right-0 origin-bottom-right" 
                : "top-full mt-2 right-0 origin-top-right",
              "max-w-[calc(100vw-32px)]"
            )}
          >
            {/* Header info */}
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                اختر نموذج المعالجة
              </span>
              <span className="text-[10px] text-gray-400">Naje Engine</span>
            </div>

            {/* List of Tiers */}
            <div className="flex flex-col gap-1 pt-1">
              {(Object.keys(MODEL_TIERS) as ModelTier[]).map((tierKey) => {
                const tier = MODEL_TIERS[tierKey];
                const Icon = tier.icon;
                const isSelected = value === tierKey;

                return (
                  <button
                    key={tierKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(tierKey);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 border text-xs",
                      isSelected
                        ? cn(tier.bgActive, "border-current shadow-sm font-semibold")
                        : "border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {/* Icon container */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected 
                        ? "bg-white dark:bg-gray-900 shadow-sm" 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className={cn("w-4 h-4", tier.accentColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={cn("font-bold", isSelected ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200")}>
                            {tier.label}
                          </span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0",
                            isSelected
                              ? "bg-indigo-600 text-white dark:bg-indigo-500"
                              : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}>
                            {tier.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-normal">
                        {tier.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 2. IMAGE MODEL SELECTOR
// ==========================================
export type ImageModelType = 'lite' | 'spectra' | 'nova';

export interface ImageModelConfig {
  id: ImageModelType;
  label: string;
  badge: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgActive: string;
}

export const IMAGE_MODELS: Record<ImageModelType, ImageModelConfig> = {
  lite: {
    id: 'lite',
    label: 'Naje Imagen Lite',
    badge: '0.5 نقطة',
    hint: 'خفيف وفائق السرعة للمسودات والأفكار السريعة (nano-banana-2-lite).',
    icon: TierLiteIcon,
    accentColor: 'text-amber-500 dark:text-amber-400',
    bgActive: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15',
  },
  spectra: {
    id: 'spectra',
    label: 'Naje Imagen',
    badge: 'نقطة واحدة (افتراضي)',
    hint: 'توازن مثالي بين الدقة العالية وتفاصيل الألوان (nano-banana-2).',
    icon: TierCoreIcon,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgActive: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/30',
  },
  nova: {
    id: 'nova',
    label: 'Naje Imagen Pro',
    badge: '1.5 نقطة (احترافي)',
    hint: 'أقصى واقعية سينمائية ودقة متناهية بالتفاصيل (nano-banana-pro).',
    icon: TierMaxIcon,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgActive: 'bg-purple-50 dark:bg-purple-950/60 border-purple-500/30',
  },
};

export function NajeImageModelSelector({
  value = 'spectra',
  onChange,
  className,
  disabled,
  dropDirection = 'up'
}: {
  value: string;
  onChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
  dropDirection?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pricing = usePricingConfig();

  const dynamicImageModels: Record<ImageModelType, ImageModelConfig> = useMemo(() => ({
    lite: {
      id: 'lite',
      label: 'Naje Imagen Lite',
      badge: `${pricing.image?.liteBase ?? 0.5} نقطة`,
      hint: 'خفيف وفائق السرعة للمسودات والأفكار السريعة (nano-banana-2-lite).',
      icon: TierLiteIcon,
      accentColor: 'text-amber-500 dark:text-amber-400',
      bgActive: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15',
    },
    spectra: {
      id: 'spectra',
      label: 'Naje Imagen',
      badge: (pricing.image?.base ?? 1.0) === 1 ? 'نقطة واحدة (افتراضي)' : `${pricing.image?.base} نقاط (افتراضي)`,
      hint: 'توازن مثالي بين الدقة العالية وتفاصيل الألوان (nano-banana-2).',
      icon: TierCoreIcon,
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      bgActive: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/30',
    },
    nova: {
      id: 'nova',
      label: 'Naje Imagen Pro',
      badge: `${pricing.image?.proBase ?? 1.5} نقطة (احترافي)`,
      hint: 'أقصى واقعية سينمائية ودقة متناهية بالتفاصيل (nano-banana-pro).',
      icon: TierMaxIcon,
      accentColor: 'text-purple-600 dark:text-purple-400',
      bgActive: 'bg-purple-50 dark:bg-purple-950/60 border-purple-500/30',
    },
  }), [pricing]);

  const currentModel = (dynamicImageModels as any)[value] || dynamicImageModels.spectra;
  const CurrentIcon = currentModel.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block text-right z-30", className)} ref={containerRef} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer select-none",
          "bg-indigo-500/10 dark:bg-indigo-950/50 hover:bg-indigo-500/20 dark:hover:bg-indigo-900/60",
          "border border-indigo-500/25 dark:border-indigo-500/30 shadow-sm",
          "text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
          open && "ring-2 ring-indigo-500/50 bg-indigo-100/60 dark:bg-indigo-900/80 border-indigo-500",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <CurrentIcon className={cn("w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110", currentModel.accentColor)} />
        <span className="truncate whitespace-nowrap">{currentModel.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-indigo-400 transition-transform duration-200 shrink-0", open && "rotate-180 text-indigo-600 dark:text-indigo-300")} />
      </button>

      {/* Pop-up Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="listbox"
            className={cn(
              "absolute z-50 w-72 sm:w-80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl",
              "bg-white/95 dark:bg-gray-900/95 border border-gray-200/90 dark:border-gray-800/90",
              "flex flex-col gap-1 ring-1 ring-black/5 dark:ring-white/10",
              dropDirection === 'up' 
                ? "bottom-full mb-2 right-0 origin-bottom-right" 
                : "top-full mt-2 right-0 origin-top-right",
              "max-w-[calc(100vw-32px)]"
            )}
          >
            {/* Header info */}
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                اختر نموذج توليد الصور
              </span>
              <span className="text-[10px] text-gray-400">Naje Imagen Studio</span>
            </div>

            {/* List of Models */}
            <div className="flex flex-col gap-1 pt-1">
              {(Object.keys(dynamicImageModels) as ImageModelType[]).map((key) => {
                const model = dynamicImageModels[key];
                const Icon = model.icon;
                const isSelected = value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 border text-xs",
                      isSelected
                        ? cn(model.bgActive, "border-current shadow-sm font-semibold")
                        : "border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected 
                        ? "bg-white dark:bg-gray-900 shadow-sm" 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className={cn("w-4 h-4", model.accentColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={cn("font-bold", isSelected ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200")}>
                            {model.label}
                          </span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0",
                            isSelected
                              ? "bg-indigo-600 text-white dark:bg-indigo-500"
                              : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}>
                            {model.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-normal">
                        {model.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 3. VIDEO MODEL SELECTOR
// ==========================================
export type VideoModelType = 'veo' | 'veo-pro';

export interface VideoModelConfig {
  id: VideoModelType;
  label: string;
  badge: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgActive: string;
}

export const VIDEO_MODELS: Record<VideoModelType, VideoModelConfig> = {
  veo: {
    id: 'veo',
    label: 'Naje Video',
    badge: '3 نقاط (4 ثوانٍ)',
    hint: 'توليد سريع وسلس لحركات واقعية وطبيعية عالية الجودة.',
    icon: Film,
    accentColor: 'text-pink-500 dark:text-pink-400',
    bgActive: 'bg-pink-500/10 border-pink-500/30 dark:bg-pink-500/15',
  },
  'veo-pro': {
    id: 'veo-pro',
    label: 'Naje Video Pro',
    badge: '6 نقاط (5 ثوانٍ)',
    hint: 'إخراج سينمائي فائق الدقة وثبات عالي للتفاصيل والحركات.',
    icon: TierMaxIcon,
    accentColor: 'text-rose-500 dark:text-rose-400',
    bgActive: 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/15',
  },
};

export function NajeVideoModelSelector({
  value = 'veo',
  onChange,
  className,
  disabled,
  dropDirection = 'up'
}: {
  value: string;
  onChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
  dropDirection?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentModel = (VIDEO_MODELS as any)[value] || VIDEO_MODELS.veo;
  const CurrentIcon = currentModel.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-block text-right z-30", className)} ref={containerRef} dir="rtl">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer select-none",
          "bg-pink-500/10 dark:bg-pink-950/50 hover:bg-pink-500/20 dark:hover:bg-pink-900/60",
          "border border-pink-500/25 dark:border-pink-500/30 shadow-sm",
          "text-pink-700 dark:text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/40",
          open && "ring-2 ring-pink-500/50 bg-pink-100/60 dark:bg-pink-900/80 border-pink-500",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <CurrentIcon className={cn("w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110", currentModel.accentColor)} />
        <span className="truncate whitespace-nowrap">{currentModel.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-pink-400 transition-transform duration-200 shrink-0", open && "rotate-180 text-pink-600 dark:text-pink-300")} />
      </button>

      {/* Pop-up Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropDirection === 'up' ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="listbox"
            className={cn(
              "absolute z-50 w-72 sm:w-80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl",
              "bg-white/95 dark:bg-gray-900/95 border border-gray-200/90 dark:border-gray-800/90",
              "flex flex-col gap-1 ring-1 ring-black/5 dark:ring-white/10",
              dropDirection === 'up' 
                ? "bottom-full mb-2 right-0 origin-bottom-right" 
                : "top-full mt-2 right-0 origin-top-right",
              "max-w-[calc(100vw-32px)]"
            )}
          >
            {/* Header info */}
            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-pink-500" />
                اختر نموذج توليد الفيديو
              </span>
              <span className="text-[10px] text-gray-400">Naje Video Studio</span>
            </div>

            {/* List of Models */}
            <div className="flex flex-col gap-1 pt-1">
              {(Object.keys(VIDEO_MODELS) as VideoModelType[]).map((key) => {
                const model = VIDEO_MODELS[key];
                const Icon = model.icon;
                const isSelected = value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 border text-xs",
                      isSelected
                        ? cn(model.bgActive, "border-current shadow-sm font-semibold")
                        : "border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isSelected 
                        ? "bg-white dark:bg-gray-900 shadow-sm" 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className={cn("w-4 h-4", model.accentColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={cn("font-bold", isSelected ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200")}>
                            {model.label}
                          </span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0",
                            isSelected
                              ? "bg-pink-600 text-white dark:bg-pink-500"
                              : "bg-gray-200/80 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}>
                            {model.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-pink-600 dark:bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-normal">
                        {model.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
