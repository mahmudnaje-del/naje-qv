import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  value: string | number;
  label: string | React.ReactNode;
}

interface NajeSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
}

export default function NajeSelect({ value, onChange, options, className = '', placeholder = 'اختر...' }: NajeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value || opt.value.toString() === value?.toString());

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[38px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 outline-none text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 font-medium flex items-center justify-between gap-2 text-xs text-right cursor-pointer transition-all shadow-xs"
      >
        <span className="truncate block flex-1 text-right font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] w-full mt-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-gray-800/90 rounded-2xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin font-sans left-0 top-full p-1 ring-1 ring-black/5 dark:ring-white/10"
          >
            {options.map((option) => {
              const isSelected = option.value === value || option.value.toString() === value?.toString();
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-right cursor-pointer my-0.5 ${
                    isSelected
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className="truncate block flex-1 text-right">{option.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 mr-1 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
