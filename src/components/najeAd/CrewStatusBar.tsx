import React from 'react';
import { Clapperboard, Camera, Sun, Scissors } from 'lucide-react';
import { useI18n } from '../../i18n';

export interface CrewStatusBarProps {
  status: string; // 'planning' | 'queued' | 'generating_shot_1' | 'extracting_continuity' | 'generating_shot_2' | 'quality_check' | 'concatenating' | 'finalizing' | 'completed' | 'failed'
}

export const CrewStatusBar: React.FC<CrewStatusBarProps> = ({ status }) => {
  const { t } = useI18n();
  const isGeneratingShots = ['generating_shot_1', 'extracting_continuity', 'generating_shot_2', 'quality_check'].includes(status);
  const isEditing = ['concatenating', 'finalizing'].includes(status);
  const isPreparing = ['planning'].includes(status);
  const isQueued = status === 'queued';
  const isBusy = isGeneratingShots || isEditing || isPreparing;

  const crew = [
    {
      id: 'director',
      label: t('adui.crew.director'),
      icon: Clapperboard,
      active: isBusy || isQueued,
      activeLabel: isQueued ? t('adui.crew.queue') : isEditing ? t('adui.crew.supervising') : isGeneratingShots ? t('adui.crew.directingShots') : isPreparing ? t('adui.crew.analyzing') : t('adui.crew.active'),
      color: isQueued ? 'bg-amber-400' : 'bg-emerald-400'
    },
    {
      id: 'camera',
      label: t('adui.crew.camera'),
      icon: Camera,
      active: isGeneratingShots,
      activeLabel: t('adui.crew.shooting'),
      color: 'bg-indigo-400'
    },
    {
      id: 'lighting',
      label: t('adui.crew.lighting'),
      icon: Sun,
      active: isGeneratingShots,
      activeLabel: t('adui.crew.grading'),
      color: 'bg-amber-400'
    },
    {
      id: 'editor',
      label: t('adui.crew.editor'),
      icon: Scissors,
      active: isEditing,
      activeLabel: t('adui.crew.merging'),
      color: 'bg-purple-400'
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#080a0f]/90 border border-gray-800/80 text-[11px]">
      <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span>{t('adui.crew.title')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {crew.map((member) => {
          const Icon = member.icon;
          return (
            <div
              key={member.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${
                member.active
                  ? 'bg-[#121622] border-gray-700 text-white shadow-xs'
                  : 'bg-transparent border-transparent text-gray-400 opacity-60'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {member.active && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${member.color} opacity-75`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${member.active ? member.color : 'bg-gray-600'}`} />
              </span>
              <Icon className={`w-3 h-3 ${member.active ? 'text-gray-200' : 'text-gray-400'}`} />
              <span className="font-semibold">{member.label}</span>
              {member.active && (
                <span className="text-[9px] font-mono text-indigo-300 font-bold">
                  [{member.activeLabel}]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
