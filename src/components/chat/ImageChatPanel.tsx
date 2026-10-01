import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import NajeSelect from '../NajeSelect';
import { usePricingConfig } from '../../hooks/usePricingConfig';
import { useI18n } from '../../i18n';
import NajeCreditIcon from '../NajeCreditIcon';

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
  const { t, isRtl } = useI18n();
  const pricing = usePricingConfig();
  if (chat?.type !== 'image' || !showImageSettings) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="bg-gray-50 dark:bg-gray-950/45 border-b border-gray-200 dark:border-gray-900/80 p-4 flex flex-col gap-4 text-sm text-start"
    >
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-900/60 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
          <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t('chatui.imageSettings')}</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowImageSettings(false)}
          className="p-1 rounded-lg text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 transition cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.imageModel')}</span>
          <NajeSelect
            value={imageModel}
            onChange={(val) => {
              setImageModel(val);
              if (val === 'lite') setImageQuality('standard');
            }}
            options={[
              { value: 'lite', label: `Naje Imagen Lite (${pricing.image?.liteBase ?? 0.5} ${t('common.pointsShort') || 'pts'})` },
              { value: 'spectra', label: `Naje Imagen (${pricing.image?.base ?? 1} ${t('common.pointsShort') || 'pts'})` },
              { value: 'nova', label: `Naje Imagen Pro (${pricing.image?.proBase ?? 1.5} ${t('common.pointsShort') || 'pts'})` }
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.imageQuality')}</span>
          <NajeSelect
            value={imageQuality}
            onChange={(val) => setImageQuality(val as 'standard' | 'hd')}
            options={
              imageModel === 'lite'
                ? [{ value: 'standard', label: 'Standard 1K (x1.0)' }]
                : [
                    { value: 'standard', label: 'Standard 1K (x1.0)' },
                    { value: 'hd', label: 'HD 2K (x1.5)' }
                  ]
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.imageDimensions')}</span>
          <NajeSelect
            value={imagePreset}
            onChange={(val) => {
              setImagePreset(val);
              if (val !== 'custom' && PRESET_TO_ASPECT_RATIO[val]) {
                setAspectRatio(PRESET_TO_ASPECT_RATIO[val]);
              }
            }}
            options={[
              { value: 'custom', label: t('chatui.customAspect') },
              { value: 'fb_cover', label: 'Facebook Cover (16:9)' },
              { value: 'fb_post', label: 'Facebook Post (1:1)' },
              { value: 'ig_square', label: 'Instagram Square (1:1)' },
              { value: 'ig_portrait', label: 'Instagram Portrait (4:5)' },
              { value: 'ig_story', label: 'Instagram Story / Reel (9:16)' },
              { value: 'tw_post', label: 'X / Twitter Post (16:9)' },
              { value: 'tw_header', label: 'X / Twitter Header (3:1)' },
              { value: 'yt_thumb', label: 'YouTube Thumbnail (16:9)' },
              { value: 'yt_cover', label: 'YouTube Channel Art (16:9)' },
              { value: 'li_cover', label: 'LinkedIn Cover (4:1)' },
              { value: 'li_post', label: 'LinkedIn Post (1:1)' },
              { value: 'sc_story', label: 'Snapchat Story (9:16)' },
              { value: 'tt_video', label: 'TikTok Video Background (9:16)' }
            ]}
          />
        </div>
        {imagePreset === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.aspectRatio')}</span>
            <NajeSelect
                value={aspectRatio}
                onChange={(val) => setAspectRatio(val)}
                options={[
                  { value: '1:1', label: '1:1' },
                  { value: '16:9', label: '16:9' },
                  { value: '9:16', label: '9:16' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' },
                  { value: '21:9', label: '21:9' },
                  { value: '4:5', label: '4:5' },
                  { value: '5:4', label: '5:4' }
                ]}
              />
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-indigo-50/80 dark:bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span>
            {t('shared.instantCost')}{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono text-sm inline-flex items-center gap-1">
              <NajeCreditIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{getCalculatedCost()}</span>
            </strong> {t('common.pointsShort')} {files.length > 0 && <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">{t('shared.sourceImages', { count: files.length })}</span>}
          </span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowImageSettings(false)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          {t('shared.confirmAndClose')}
        </button>
      </div>
    </motion.div>
  );
}
