import React from 'react';
import { 
  Sparkles, 
  UserCheck, 
  MapPin, 
  FileText, 
  Film, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export interface ProductionPipelineBarProps {
  status: string; // 'planning' | 'queued' | 'generating_shot_1' | 'extracting_continuity' | 'generating_shot_2' | 'quality_check' | 'concatenating' | 'finalizing' | 'completed' | 'failed'
  progress?: number;
  stepLabel?: string;
  shotsCount?: number;
}

interface StepDef {
  key: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: StepDef[] = [
  { key: 'concept', label: 'المفهوم', labelEn: 'CONCEPT', icon: Sparkles },
  { key: 'cast', label: 'الشخصية', labelEn: 'CAST', icon: UserCheck },
  { key: 'location', label: 'الموقع', labelEn: 'LOCATION', icon: MapPin },
  { key: 'script', label: 'السيناريو', labelEn: 'SCRIPT', icon: FileText },
  { key: 'generation', label: 'التوليد', labelEn: 'GENERATION', icon: Film },
  { key: 'edit', label: 'المونتاج والدمج', labelEn: 'EDIT', icon: Layers },
  { key: 'export', label: 'التصدير', labelEn: 'EXPORT', icon: CheckCircle2 }
];

export const ProductionPipelineBar: React.FC<ProductionPipelineBarProps> = ({
  status,
  progress = 0,
  stepLabel,
  shotsCount = 1
}) => {
  // Map internal backend status to pipeline step index
  const getActiveStepIndex = (st: string): number => {
    switch (st) {
      case 'idle':
        return 3; // Ready at script/concept phase
      case 'planning':
        return 3; // SCRIPT
      case 'queued':
        return 4; // Waiting in queue (Script is done, waiting to start Generation)
      case 'generating_shot_1':
      case 'extracting_continuity':
      case 'generating_shot_2':
      case 'quality_check':
        return 4; // GENERATION
      case 'concatenating':
      case 'finalizing':
        return 5; // EDIT
      case 'completed':
        return 6; // EXPORT
      case 'failed':
        return -1;
      default:
        return 3;
    }
  };

  const activeIndex = getActiveStepIndex(status);
  const isQueued = status === 'queued';
  const isBusy = ['planning', 'generating_shot_1', 'extracting_continuity', 'generating_shot_2', 'quality_check', 'concatenating', 'finalizing'].includes(status);
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className="w-full bg-[#0d0f14]/90 border border-gray-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md text-right" dir="rtl">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isCompleted ? 'bg-emerald-400' : isFailed ? 'bg-rose-400' : isBusy || isQueued ? 'bg-indigo-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-xs font-black text-white tracking-wide uppercase">
              مسار الإنتاج السينمائي (Production Pipeline)
            </span>
          </div>
          {shotsCount > 1 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              متعدد اللقطات ({shotsCount} Shots)
            </span>
          )}
        </div>

        {/* Live Status Label */}
        <div className="flex items-center gap-2">
          {stepLabel && (
            <span className="text-xs text-gray-300 font-medium truncate max-w-xs">
              {stepLabel}
            </span>
          )}
          {isQueued && (
            <span className="text-xs font-black text-amber-400 font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              في انتظار دور المعالجة...
            </span>
          )}
          {isBusy && (
            <span className="text-xs font-black text-indigo-400 font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {progress}%
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              جاهز للعرض
            </span>
          )}
          {isFailed && (
            <span className="text-xs font-black text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              توقف مؤقت
            </span>
          )}
        </div>
      </div>

      {/* Steps Row */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isPast = idx < activeIndex || isCompleted;
          // If queued, we don't highlight the active step, it just waits
          const isCurrent = idx === activeIndex && !isCompleted && !isQueued;
          
          return (
            <div
              key={step.key}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                isCompleted || isPast
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 animate-pulse'
                  : 'bg-[#11141c]/60 border-gray-800/50 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-indigo-400' : 'text-gray-400'}`} />
                )}
              </div>
              <span className="text-[11px] font-bold leading-tight block truncate w-full">
                {step.label}
              </span>
              <span className="text-[8px] tracking-wider opacity-60 uppercase font-mono block">
                {step.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
