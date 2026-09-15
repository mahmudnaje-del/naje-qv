import React from 'react';
import { 
  Dna, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Globe, 
  Sliders, 
  Smartphone, 
  Sparkles, 
  User, 
  MapPin,
  HelpCircle,
  Film
} from 'lucide-react';
import { 
  AdDnaState, 
  FieldStatusMap, 
  PLATFORM_OPTIONS, 
  LANGUAGE_OPTIONS, 
  DIALECT_OPTIONS, 
  STYLE_OPTIONS,
  detectConflicts 
} from '../../lib/adDnaEngine';
import { AVATAR_REGISTRY } from '../../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY } from '../../data/locations/locationRegistry';

export interface AdDnaPanelProps {
  dnaState: AdDnaState;
  fieldStatuses: FieldStatusMap;
  onUpdateDna: (partial: Partial<AdDnaState>) => void;
  onOpenCasting: () => void;
  onOpenLocationScout: () => void;
}

export const AdDnaPanel: React.FC<AdDnaPanelProps> = ({
  dnaState,
  fieldStatuses,
  onUpdateDna,
  onOpenCasting,
  onOpenLocationScout
}) => {
  const avatar = dnaState.selectedAvatarId ? AVATAR_REGISTRY[dnaState.selectedAvatarId] : null;
  const location = dnaState.selectedLocationId ? LOCATION_REGISTRY[dnaState.selectedLocationId] : null;
  const conflicts = detectConflicts(dnaState);

  const availableDialects = DIALECT_OPTIONS[dnaState.language] || DIALECT_OPTIONS['ar'];

  const handleLanguageChange = (lang: string) => {
    const defaultDialect = DIALECT_OPTIONS[lang]?.[0]?.id || 'standard';
    onUpdateDna({ language: lang, dialect: defaultDialect });
  };

  const handlePlatformChange = (platformId: string) => {
    const plat = PLATFORM_OPTIONS.find(p => p.id === platformId);
    if (plat) {
      onUpdateDna({
        platform: platformId,
        aspectRatio: plat.defaultRatio as '16:9' | '9:16'
      });
    } else {
      onUpdateDna({ platform: platformId });
    }
  };

  return (
    <div className="flex flex-col space-y-4 bg-[#0d0f14]/90 border border-gray-800/80 rounded-2xl p-4 text-right backdrop-blur-md shadow-xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">حمض الإعلان النووي (Ad DNA Engine)</h3>
            <p className="text-[10px] text-gray-400">محرك الاعتماديات والقفل الذكي للمحددات الإعلانية</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          مُزامن حياً
        </span>
      </div>

      {/* Conflict Box if any */}
      {conflicts.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>تنبيه توافق المعايير:</span>
          </div>
          {conflicts.map((c, i) => (
            <p key={i} className="text-[11px] text-amber-200/90 leading-relaxed pr-5">
              {c.reason}
            </p>
          ))}
        </div>
      )}

      {/* 1. Protagonist / Avatar DNA Core */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>الشخصية والبطل (Protagonist):</span>
          </label>
          <button
            type="button"
            onClick={onOpenCasting}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            تغيير (150 شخصية)
          </button>
        </div>

        {avatar ? (
          <div className="p-3 rounded-xl bg-[#141722] border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{avatar.name} ({avatar.age} سنة)</span>
              <span className="text-[10px] font-mono text-indigo-300">{avatar.id}</span>
            </div>
            
            {/* Locked Attributes Pill List */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>العمر: {avatar.age}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>المهنة: {avatar.profession}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>المنطقة: {avatar.visualRegion.split('—')[0]}</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCasting}
            className="w-full p-2.5 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-indigo-500 transition text-xs font-bold"
          >
            + اختر شخصية من مكتبة الأفاتار
          </button>
        )}
      </div>

      {/* 2. Location / Environment DNA Core */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span>موقع التصوير (Environment):</span>
          </label>
          <button
            type="button"
            onClick={onOpenLocationScout}
            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
          >
            تغيير (150 موقع)
          </button>
        </div>

        {location ? (
          <div className="p-3 rounded-xl bg-[#141722] border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{location.name}</span>
              <span className="text-[10px] font-mono text-purple-300">{location.id}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300 border border-gray-700 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>الفئة: {location.category}</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLocationScout}
            className="w-full p-2.5 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-purple-500 transition text-xs font-bold"
          >
            + اختر موقعاً من مكتبة المواقع
          </button>
        )}
      </div>

      {/* 3. Platform & Technical Distribution */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>منصة النشر الأساسية (Distribution Platform):</span>
        </label>
        <select
          value={dnaState.platform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          className="w-full bg-[#141722] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {PLATFORM_OPTIONS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {fieldStatuses['aspectRatio']?.status === 'conditional' && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium pt-0.5">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            <span>{fieldStatuses['aspectRatio'].reason}</span>
          </div>
        )}
      </div>

      {/* 4. Language & Dialect */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>اللغة:</span>
          </label>
          <select
            value={dnaState.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-[#141722] border border-gray-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {LANGUAGE_OPTIONS.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>اللهجة:</span>
          </label>
          <select
            value={dnaState.dialect}
            onChange={(e) => onUpdateDna({ dialect: e.target.value })}
            className="w-full bg-[#141722] border border-gray-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {availableDialects.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Visual Commercial Style */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
          <Film className="w-3.5 h-3.5 text-pink-400" />
          <span>الأسلوب الإعلاني (Commercial Style):</span>
        </label>
        <select
          value={dnaState.style}
          onChange={(e) => onUpdateDna({ style: e.target.value })}
          className="w-full bg-[#141722] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {STYLE_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Bottom Summary Footer */}
      <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-400 flex items-center justify-between">
        <span>أبعاد المشهد: <strong className="text-white font-mono">{dnaState.aspectRatio}</strong></span>
        <span>النمط: <strong className="text-indigo-300 font-mono">Multi-Shot Engine</strong></span>
      </div>
    </div>
  );
};
