import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import NajeSelect from '../NajeSelect';
import { usePricingConfig } from '../../hooks/usePricingConfig';
import { useI18n } from '../../i18n';
import NajeCreditIcon from '../NajeCreditIcon';

export function buildVideoChatPayload(state: any) {
  return {
    model: state.videoModel,
    config: { 
      aspectRatio: state.aspectRatio === '9:16' ? '9:16' : '16:9', 
      resolution: state.videoResolution 
    },
    duration: state.videoDuration
  };
}

export function VideoSettingsPanel({
  chat,
  showVideoSettings,
  setShowVideoSettings,
  videoModel,
  setVideoModel,
  videoResolution,
  setVideoResolution,
  videoDuration,
  setVideoDuration,
  aspectRatio,
  setAspectRatio,
  getCalculatedCost,
  files
}: any) {
  const { t, isRtl } = useI18n();
  const pricing = usePricingConfig();
  if (chat?.type !== 'video' || !showVideoSettings) return null;

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
          <Film className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t('chatui.videoSettings')}</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowVideoSettings(false)}
          className="p-1 rounded-lg text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 transition cursor-pointer"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.generationModel')}</span>
          <NajeSelect
            value={videoModel}
            onChange={(val) => { setVideoModel(val); setVideoDuration(val === 'veo' ? '4' : '5'); }}
            options={[
              { value: 'veo', label: 'Naje Video' },
              { value: 'veo-pro', label: 'Naje Video Pro' }
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.videoResolution')}</span>
          <NajeSelect
            value={videoResolution}
            onChange={(val) => setVideoResolution(val as any)}
            options={[
              { value: '720p', label: '720p HD (x1.0)' },
              { value: '1080p', label: '1080p Full HD (x1.6)' }
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.videoDuration')}</span>
          <NajeSelect
            value={videoDuration}
            onChange={(val) => setVideoDuration(val)}
            options={videoModel === 'veo' ? [
              { value: '4', label: t('chatui.secondsPoints', { seconds: 4, points: 2 }) },
              { value: '6', label: t('chatui.secondsPoints', { seconds: 6, points: 3 }) },
              { value: '8', label: t('chatui.secondsPoints', { seconds: 8, points: 4 }) }
            ] : [
              { value: '5', label: t('chatui.secondsPoints', { seconds: 5, points: 2.5 }) },
              { value: '10', label: t('chatui.secondsPoints', { seconds: 10, points: 5 }) }
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-800 dark:text-gray-400 font-medium">{t('chatui.videoFrame')}</span>
          <NajeSelect
            value={aspectRatio === '9:16' ? '9:16' : '16:9'}
            onChange={(val) => setAspectRatio(val)}
            options={[
              { value: '16:9', label: t('chatui.landscape') },
              { value: '9:16', label: t('chatui.portrait') }
            ]}
          />
        </div>
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
          onClick={() => setShowVideoSettings(false)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          {t('shared.confirmAndClose')}
        </button>
      </div>
    </motion.div>
  );
}
