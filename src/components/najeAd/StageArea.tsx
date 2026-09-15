import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Download, 
  ExternalLink, 
  User, 
  MapPin, 
  Sun, 
  Camera, 
  Sparkles, 
  Layers, 
  Maximize2,
  RefreshCw,
  Film,
  Sliders,
  CheckCircle2,
  Info,
  Lock
} from 'lucide-react';
import { NajiAvatar } from '../../data/avatars/avatarRegistry';
import { NajiLocation } from '../../data/locations/locationRegistry';
import { AdDnaState, LIGHTING_PRESETS, CAMERA_PRESETS, FieldStatusMap } from '../../lib/adDnaEngine';
import { CrewStatusBar } from './CrewStatusBar';
import { FinalCutPanel } from './FinalCutPanel';

export interface StageAreaProps {
  avatar: NajiAvatar | null;
  location: NajiLocation | null;
  dnaState: AdDnaState;
  fieldStatuses: FieldStatusMap;
  onUpdateDna: (partial: Partial<AdDnaState>) => void;
  onOpenCasting: () => void;
  onOpenLocationScout: () => void;
  onResetJob?: () => void;
  videoUrl?: string;
  isGenerating?: boolean;
  progress?: number;
  stepLabel?: string;
  status?: string;
}

const SUB_MESSAGES: Record<string, string[]> = {
  pending: [
    'تجهيز مسار العمل وحجز مساحة الذاكرة...',
    'استدعاء بارامترات الإخراج وحمض الإعلان...'
  ],
  analyzing_prompt: [
    'تحليل السيناريو الإعلاني وتفكيك اللقطات...',
    'مواءمة هوية الأفاتار والموقع مع القصة...',
    'توزيع التوقيت الزمني للمشاهد...'
  ],
  generating_shot_1: [
    'تثبيت هوية الشخصية والملامح بدقة...',
    'ضبط زاوية الكاميرا الافتتاحية وعمق الميدان...',
    'معايرة الإضاءة السينمائية والألوان الأساسية...',
    'رندرة حركة البطل والتفاعل المشهدي...'
  ],
  extracting_continuity: [
    'تحليل الإطار الختامي للقطة الأولى...',
    'بناء جسر الاستمرارية البصرية والضوئية...',
    'نقل موضع الشخصية وحالة الإضاءة بدقة متناهية...'
  ],
  generating_shot_2: [
    'مطابقة موضع الشخصية مع اللقطة السابقة...',
    'استكمال الحركة بسلاسة تامة وتفادي القفزات...',
    'ضبط زاوية الكاميرا الثانية للوصول للذروة الإعلانية...',
    'تكامل الإضاءة والخلفية مع الإطار السابق...'
  ],
  stitching_and_encoding: [
    'دمج اللقطات سينمائيًا بدون انقطاع...',
    'مزامنة الانتقال اللوني ومعدل الإطارات...',
    'ضغط وتشفير الفيديو النهائي بأعلى جودة H.264...'
  ],
  concatenating: [
    'دمج اللقطات سينمائيًا...',
    'مزامنة الانتقال بين المشاهد...'
  ],
  finalizing: [
    'ترميز الفيديو النهائي...',
    'رفع الملف وتجهيز الرابط النهائي للعرض...'
  ]
};

const DEFAULT_SUB_MESSAGES = [
  'معالجة لقطات الفيديو والتوليد الفائق...',
  'مزامنة الكاميرا والإضاءة بدقة عالية...',
  'تطبيق خوارزميات الاستمرارية المشهدية...'
];

export const StageArea: React.FC<StageAreaProps> = ({
  avatar,
  location,
  dnaState,
  fieldStatuses,
  onUpdateDna,
  onOpenCasting,
  onOpenLocationScout,
  onResetJob,
  videoUrl,
  isGenerating = false,
  progress = 0,
  stepLabel,
  status = 'idle'
}) => {
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  // Derive stage background gradient blending avatar & location color palettes
  const avatarGrad = avatar?.placeholderGradient || ['#4f46e5', '#7c3aed'];
  const locationGrad = location?.placeholderGradient || ['#1e293b', '#0f172a'];

  const stageBackgroundStyle = {
    background: `linear-gradient(135deg, ${locationGrad[0]}dd 0%, #0d0f14 45%, ${avatarGrad[0]}cc 100%)`
  };

  const isVertical = dnaState.aspectRatio === '9:16';
  const ratioLocked = fieldStatuses['aspectRatio']?.status === 'conditional';

  // Micro-messages rotation every 2.5 seconds during active generation
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setSubMessageIndex((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const activeMessages = SUB_MESSAGES[status] || DEFAULT_SUB_MESSAGES;
  const currentSubMessage = activeMessages[subMessageIndex % activeMessages.length];

  return (
    <div className="flex flex-col h-full space-y-3.5 text-right" dir="rtl">
      {/* Top Stage Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f14]/80 border border-gray-800/80 rounded-2xl p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">منصة الإنتاج الافتراضي (Stage Area)</h3>
            <p className="text-[10px] text-gray-400">معاينة التكوين المشهدي المباشر للشخصية والموقع والإضاءة</p>
          </div>
        </div>

        {/* Quick Stage Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lighting Selector */}
          <div className="flex items-center gap-1.5 bg-[#141721] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs text-gray-200">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={dnaState.lighting}
              onChange={(e) => onUpdateDna({ lighting: e.target.value })}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer"
            >
              {LIGHTING_PRESETS.map((lp) => (
                <option key={lp.id} value={lp.id} className="bg-[#141721] text-gray-200">
                  {lp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Preset Selector */}
          <div className="flex items-center gap-1.5 bg-[#141721] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs text-gray-200">
            <Camera className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={dnaState.cameraAngle}
              onChange={(e) => onUpdateDna({ cameraAngle: e.target.value })}
              className="bg-transparent text-xs text-gray-200 outline-none cursor-pointer"
            >
              {CAMERA_PRESETS.map((cp) => (
                <option key={cp.id} value={cp.id} className="bg-[#141721] text-gray-200">
                  {cp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio Toggle */}
          <div className="flex items-center gap-1.5 bg-[#141721] border border-gray-700/60 rounded-xl px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <select
              value={dnaState.aspectRatio}
              onChange={(e) => onUpdateDna({ aspectRatio: e.target.value as '16:9' | '9:16' })}
              disabled={ratioLocked}
              className={`bg-transparent text-xs text-gray-200 outline-none cursor-pointer ${ratioLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="16:9" className="bg-[#141721] text-gray-200">16:9 أفقي</option>
              <option value="9:16" className="bg-[#141721] text-gray-200">9:16 عمودي</option>
            </select>
            {ratioLocked && (
              <span className="text-[10px] text-amber-400" title={fieldStatuses['aspectRatio']?.reason}>
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Studio Crew Status Bar */}
      <CrewStatusBar status={status || (isGenerating ? 'generating_shot_1' : 'idle')} />

      {/* Main Viewport Card */}
      <div 
        className="relative flex-1 min-h-[380px] md:min-h-[460px] rounded-3xl border border-gray-800/80 overflow-hidden flex items-center justify-center p-6 shadow-2xl transition-all duration-700"
        style={stageBackgroundStyle}
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

        {/* Video Mode (If generated video is ready) */}
        {videoUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center"
          >
            <div className={`relative overflow-hidden rounded-2xl border border-indigo-500/40 shadow-2xl bg-black ${
              isVertical ? 'w-64 max-w-full aspect-[9/16]' : 'w-full aspect-video'
            }`}>
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            
            <FinalCutPanel videoUrl={videoUrl} onReset={() => onResetJob && onResetJob()} />
          </motion.div>
        ) : isGenerating ? (
          /* Real-time Generation Animation Viewport */
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 text-center max-w-md w-full p-6 rounded-3xl bg-[#0b0e14]/90 border border-indigo-500/30 backdrop-blur-xl shadow-2xl space-y-4"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Film className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            
            <div>
              <h4 className="text-base font-black text-white">جاري توليد وإنتاج المشهد السينمائي...</h4>
              <p className="text-xs text-indigo-300 font-medium mt-1">{stepLabel || 'معالجة لقطات الفيديو والتوليد الدقيق...'}</p>
              
              {/* Rotating Micro-Messages */}
              <div className="h-6 mt-2 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentSubMessage}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] text-amber-300 font-semibold truncate px-2"
                  >
                    ✨ {currentSubMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400 font-sans text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                المحرك السينمائي يعمل
              </span>
              <span>{progress}% مكتمل</span>
            </div>
          </motion.div>
        ) : (
          /* Virtual Visual Composition Preview (Stage Layout) */
          <div className="relative z-10 w-full max-w-3xl flex flex-col items-stretch gap-6 p-6 rounded-3xl bg-[#0b0e14]/80 border border-gray-800/80 backdrop-blur-xl shadow-2xl">
            
            {/* Left: Avatar Card Preview */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={avatar?.id || 'no-avatar'}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col space-y-3 p-4 rounded-2xl bg-[#121620]/90 border border-gray-700/60 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    بطل الإعلان المختار
                  </span>
                  <button
                    type="button"
                    onClick={onOpenCasting}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>تغيير الأفاتار</span>
                  </button>
                </div>

                {avatar ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shrink-0 border border-white/20"
                        style={{ background: `linear-gradient(135deg, ${avatar.placeholderGradient[0]}, ${avatar.placeholderGradient[1]})` }}
                      >
                        {avatar.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{avatar.name} ({avatar.age} سنة)</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">{avatar.visualRegion}</p>
                        <span className="text-[10px] text-indigo-300 font-mono">{avatar.id} • {avatar.profession}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-300/90 leading-relaxed bg-[#0b0d12] p-2.5 rounded-xl border border-gray-800/70">
                      <p className="truncate"><strong className="text-gray-400">الملامح:</strong> {avatar.skin}</p>
                      <p className="truncate"><strong className="text-gray-400">الملابس:</strong> {avatar.clothing}</p>
                      <p className="truncate"><strong className="text-gray-400">التعبير:</strong> {avatar.expression}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <p className="text-xs font-bold">لم يتم اختيار أفاتار بعد</p>
                    <button
                      type="button"
                      onClick={onOpenCasting}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
                    >
                      استعراض غرفة التمثيل (150 شخصية)
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Right: Location Card Preview */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={location?.id || 'no-location'}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col space-y-3 p-4 rounded-2xl bg-[#121620]/90 border border-gray-700/60 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    بيئة وموقع التصوير
                  </span>
                  <button
                    type="button"
                    onClick={onOpenLocationScout}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>تغيير الموقع</span>
                  </button>
                </div>

                {location ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shrink-0 border border-white/20"
                        style={{ background: `linear-gradient(135deg, ${location.placeholderGradient[0]}, ${location.placeholderGradient[1]})` }}
                      >
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{location.name}</h4>
                        <p className="text-[11px] text-purple-300 font-medium">{location.category}</p>
                        <span className="text-[10px] text-gray-400 font-mono">{location.id}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-300/90 leading-relaxed bg-[#0b0d12] p-2.5 rounded-xl border border-gray-800/70">
                      <p className="line-clamp-2 text-gray-300">{location.description}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400">
                        <span>الإضاءة: {dnaState.lighting}</span>
                        <span>•</span>
                        <span>الكاميرا: {dnaState.cameraAngle}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <p className="text-xs font-bold">لم يتم اختيار موقع تصوير</p>
                    <button
                      type="button"
                      onClick={onOpenLocationScout}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
                    >
                      استعراض مكتبة المواقع (150 موقع)
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        )}
      </div>
    </div>
  );
};
