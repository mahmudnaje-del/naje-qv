import React from 'react';
import { Clapperboard, Camera, Sun, Scissors } from 'lucide-react';

export interface CrewStatusBarProps {
  status: string; // 'planning' | 'queued' | 'generating_shot_1' | 'extracting_continuity' | 'generating_shot_2' | 'quality_check' | 'concatenating' | 'finalizing' | 'completed' | 'failed'
}

export const CrewStatusBar: React.FC<CrewStatusBarProps> = ({ status }) => {
  const isGeneratingShots = ['generating_shot_1', 'extracting_continuity', 'generating_shot_2', 'quality_check'].includes(status);
  const isEditing = ['concatenating', 'finalizing'].includes(status);
  const isPreparing = ['planning'].includes(status);
  const isQueued = status === 'queued';
  const isBusy = isGeneratingShots || isEditing || isPreparing;

  const crew = [
    {
      id: 'director',
      label: 'المخرج (Director)',
      icon: Clapperboard,
      active: isBusy || isQueued,
      activeLabel: isQueued ? 'في طابور الانتظار' : isEditing ? 'إشراف على المونتاج' : isGeneratingShots ? 'توجيه اللقطات' : isPreparing ? 'تحليل السيناريو' : 'نشط',
      color: isQueued ? 'bg-amber-400' : 'bg-emerald-400'
    },
    {
      id: 'camera',
      label: 'الكاميرا (Camera)',
      icon: Camera,
      active: isGeneratingShots,
      activeLabel: 'تصوير وحركة 50mm',
      color: 'bg-indigo-400'
    },
    {
      id: 'lighting',
      label: 'الإضاءة (Lighting)',
      icon: Sun,
      active: isGeneratingShots,
      activeLabel: 'معايرة سينمائية',
      color: 'bg-amber-400'
    },
    {
      id: 'editor',
      label: 'المونتير (Editor)',
      icon: Scissors,
      active: isEditing,
      activeLabel: 'دمج واستمرارية',
      color: 'bg-purple-400'
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#080a0f]/90 border border-gray-800/80 text-[11px]" dir="rtl">
      <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span>طاقم الاستوديو السينمائي (Crew Status):</span>
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
