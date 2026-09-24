import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Send, Palette, Briefcase, Target, Layers } from 'lucide-react';
import { FORM_CONFIGS, FormField } from '../lib/formConfigs';
import { useI18n } from '../i18n';

interface BrandKitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, mode: string) => void;
}

export function BrandKitFormModal({ isOpen, onClose, onSubmit }: BrandKitFormModalProps) {
  const { t, isRtl } = useI18n();
  const [selectedFormKey, setSelectedFormKey] = useState<string>('brand_kit');
  const [formData, setFormData] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const currentFields: FormField[] = FORM_CONFIGS[selectedFormKey] || FORM_CONFIGS['brand_kit'];

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxToggle = (fieldId: string, optionId: string) => {
    const currentList: string[] = formData[fieldId] || [];
    const updated = currentList.includes(optionId)
      ? currentList.filter(id => id !== optionId)
      : [...currentList, optionId];
    setFormData(prev => ({ ...prev, [fieldId]: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let compiledPrompt = `[طلب ${selectedFormKey === 'brand_kit' ? 'دليل هوية متكامل (Brand Kit)' : 'شعار وهوية بصرية'}]\n`;
    
    currentFields.forEach(field => {
      const val = formData[field.id];
      if (val) {
        if (Array.isArray(val)) {
          compiledPrompt += `- ${isRtl ? field.labelAr : field.labelEn}: ${val.join(', ')}\n`;
        } else {
          compiledPrompt += `- ${isRtl ? field.labelAr : field.labelEn}: ${val}\n`;
        }
      }
    });

    onSubmit(compiledPrompt, selectedFormKey);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh] text-start"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {isRtl ? 'استوديو إنشاء الهويات والشعارات' : 'Brand Kit & Logo Studio'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">Creative AI</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl ? 'قم بتعبئة نموذج الطلب لتوليد هوية بصرية كاملة بدقة الاحترافيين' : 'Fill in the brief to generate a complete visual identity kit'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition cursor-pointer"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Tabs Selector */}
          <div className="flex gap-2 my-4 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'brand_kit', label: isRtl ? 'دليل هوية متكامل (Brand Kit)' : 'Complete Brand Kit', icon: Layers },
              { key: 'horizontal_logo', label: isRtl ? 'تصميم شعار احترافي' : 'Professional Logo', icon: Briefcase },
              { key: 'logo_and_identity', label: isRtl ? 'شعار + تطبيقات الهوية' : 'Logo & Identity Apps', icon: Target },
              { key: 'social_post', label: isRtl ? 'منشورات السوشال ميديا' : 'Social Media Posts', icon: Palette }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedFormKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setSelectedFormKey(tab.key); setFormData({}); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg' 
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
            {currentFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>{isRtl ? field.labelAr : field.labelEn}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{isRtl ? field.labelEn : field.labelAr}</span>
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={(isRtl ? field.placeholderAr : field.placeholderEn) || ''}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    placeholder={(isRtl ? field.placeholderAr : field.placeholderEn) || ''}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition resize-none"
                  />
                )}

                {field.type === 'radio' && field.options && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {field.options.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleChange(field.id, opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          formData[field.id] === opt.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isRtl ? opt.labelAr : opt.labelEn}
                      </button>
                    ))}
                  </div>
                )}

                {field.type === 'multicheckbox' && field.options && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {field.options.map((opt) => {
                      const isSelected = (formData[field.id] || []).includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleCheckboxToggle(field.id, opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isRtl ? opt.labelAr : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isRtl ? 'إرسال وتوليد الهوية الإبداعية' : 'Generate Brand Kit'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
