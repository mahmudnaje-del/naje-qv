import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import NajeSelect from '../NajeSelect';
import { usePricingConfig } from '../../hooks/usePricingConfig';

export function buildImageChatPayload(state: any) {
  return {
    model: state.imageModel,
    preset: state.imagePreset,
    config: { aspectRatio: state.aspectRatio, quality: state.imageQuality, preset: state.imagePreset }
  };
}

const PRESET_TO_ASPECT_RATIO: Record<string, string> = {
  fb_cover: '16:9',
  fb_post: '1:1',
  ig_square: '1:1',
  ig_portrait: '4:5',
  ig_story: '9:16',
  tw_post: '16:9',
  tw_header: '16:9',
  yt_thumb: '16:9',
  yt_cover: '16:9',
  li_cover: '16:9',
  li_post: '1:1',
  sc_story: '9:16',
  tt_video: '9:16'
};

export function ImageSettingsPanel({
  chat,
  showImageSettings,
  setShowImageSettings,
  imageModel,
  setImageModel,
  imageQuality,
  setImageQuality,
  imagePreset,
  setImagePreset,
  aspectRatio,
  setAspectRatio,
  getCalculatedCost,
  files
}: any) {
  const pricing = usePricingConfig();
  if (chat?.type !== 'image' || !showImageSettings) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 dark:bg-gray-950/45 border-b border-gray-200 dark:border-gray-900/80 p-4 flex flex-col gap-4 text-sm "
    >
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-900/60 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
          <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>إعدادات توليد الصورة الفنية</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowImageSettings(false)}
          className="p-1 rounded-lg text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">النموذج الفني</span>
          <NajeSelect
            value={imageModel}
            onChange={(val) => {
              setImageModel(val);
              if (val === 'lite') setImageQuality('standard');
            }}
            options={[
              { value: 'lite', label: `Naje Imagen Lite (${pricing.image?.liteBase ?? 0.5} نقطة - خفيف وسريع)` },
              { value: 'spectra', label: `Naje Imagen (${(pricing.image?.base ?? 1) === 1 ? 'نقطة واحدة' : `${pricing.image.base} نقاط`} - افتراضي)` },
              { value: 'nova', label: `Naje Imagen Pro (${pricing.image?.proBase ?? 1.5} نقطة - احترافي)` }
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">جودة ودقة الصورة</span>
          <NajeSelect
            value={imageQuality}
            onChange={(val) => setImageQuality(val as 'standard' | 'hd')}
            options={
              imageModel === 'lite'
                ? [{ value: 'standard', label: 'Standard 1K (دقة قياسية - x1.0)' }]
                : [
                    { value: 'standard', label: 'Standard 1K (دقة قياسية - x1.0)' },
                    { value: 'hd', label: 'HD 2K (دقة عالية - x1.5)' }
                  ]
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">أبعاد الصورة / المنصة والقالب</span>
          <NajeSelect
            value={imagePreset}
            onChange={(val) => {
              setImagePreset(val);
              if (val !== 'custom' && PRESET_TO_ASPECT_RATIO[val]) {
                setAspectRatio(PRESET_TO_ASPECT_RATIO[val]);
              }
            }}
            options={[
              { value: 'custom', label: 'مخصص (حسب الأبعاد اليدوية)' },
              { value: 'fb_cover', label: 'فيسبوك: غلاف صفحة (16:9 - منطقة آمنة للغلاف)' },
              { value: 'fb_post', label: 'فيسبوك: صورة منشور (1:1)' },
              { value: 'ig_square', label: 'إنستغرام: منشور مربع (1:1)' },
              { value: 'ig_portrait', label: 'إنستغرام: منشور طولي (4:5)' },
              { value: 'ig_story', label: 'إنستغرام: قصة / ريلز (9:16 - آمن للأزرار)' },
              { value: 'tw_post', label: 'تويتر: صورة منشور (16:9)' },
              { value: 'tw_header', label: 'تويتر: غلاف حساب (3:1 - تجنب صورة البروفايل)' },
              { value: 'yt_thumb', label: 'يوتيوب: صورة مصغرة (16:9 - تجنب شارة الوقت)' },
              { value: 'yt_cover', label: 'يوتيوب: غلاف قناة (16:9 - شريط العرض الآمن)' },
              { value: 'li_cover', label: 'لينكد إن: غلاف حساب شخصي (4:1)' },
              { value: 'li_post', label: 'لينكد إن: صورة منشور (1:1)' },
              { value: 'sc_story', label: 'سناب شات: قصة (9:16)' },
              { value: 'tt_video', label: 'تيك توك: خلفية فيديو (9:16 - آمن للأزرار)' }
            ]}
          />
        </div>
        {imagePreset === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">نسبة العرض للارتفاع</span>
            <NajeSelect
                value={aspectRatio}
                onChange={(val) => setAspectRatio(val)}
                options={[
                  { value: '1:1', label: '1:1 (مربع)' },
                  { value: '16:9', label: '16:9 (عرضي)' },
                  { value: '9:16', label: '9:16 (طولي)' },
                  { value: '4:3', label: '4:3 (عرضي)' },
                  { value: '3:4', label: '3:4 (طولي)' },
                  { value: '21:9', label: '21:9 (سينمائي)' },
                  { value: '4:5', label: '4:5 (طولي إنستغرام)' },
                  { value: '5:4', label: '5:4 (عرضي مقارب)' }
                ]}
              />
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-indigo-50/80 dark:bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>
            التكلفة الإنشائية الفورية: <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-sm">
              {getCalculatedCost()}
            </strong> نقطة {files.length > 0 && <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">(يتضمن +{(files.length * (pricing.image?.imageAddon ?? 0.1)).toFixed(1)} لدمج {files.length} صورة)</span>}
          </span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowImageSettings(false)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          تأكيد وإغلاق
        </button>
      </div>
    </motion.div>
  );
}
