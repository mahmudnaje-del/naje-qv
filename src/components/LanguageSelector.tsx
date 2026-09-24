import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n, SupportedLocale, LOCALES_META } from '../i18n';
import { cn } from '../lib/utils';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'card' | 'compact';
  className?: string;
}

export default function LanguageSelector({
  variant = 'dropdown',
  className = '',
}: LanguageSelectorProps) {
  const { locale, setLocale, locales, supportedLocales, t, isRtl } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentMeta = locales[locale] || locales.ar;

  // 1. Settings Card Grid Variant
  if (variant === 'card') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {supportedLocales.map((code) => {
            const meta = locales[code];
            const isSelected = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={cn(
                  "p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2.5",
                  isSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30"
                    : "bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
                aria-pressed={isSelected}
                aria-label={`Select language: ${meta.nativeName}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0" role="img" aria-hidden>
                    {meta.flag}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-xs font-bold truncate",
                      isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"
                    )}>
                      {meta.nativeName}
                    </span>
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate">
                      {meta.name}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Compact Icon-only or Topbar Dropdown
  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
          open
            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400/50 text-indigo-600 dark:text-indigo-400"
            : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('settings.languageTitle')}
        title={t('settings.languageTitle')}
      >
        <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-sm shrink-0" role="img" aria-hidden>{currentMeta.flag}</span>
        <span className="hidden sm:inline text-xs font-bold">{currentMeta.nativeName}</span>
        <ChevronDown className={cn("w-3 h-3 text-gray-600 dark:text-gray-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#0e1014] border border-gray-200 dark:border-gray-800 p-1.5 shadow-xl",
              isRtl ? "left-0 origin-top-left" : "right-0 origin-top-right"
            )}
            role="listbox"
            aria-label={t('settings.languageTitle')}
          >
            <div className="px-2 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900 mb-1">
              {t('settings.languageTitle')}
            </div>
            {supportedLocales.map((code) => {
              const meta = locales[code];
              const isSelected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-start",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-hidden>{meta.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{meta.nativeName}</span>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{meta.name}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
