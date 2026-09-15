import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { buildInitialPlan, splitDuration, VideoPlan } from '../lib/videoOrchestrator';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { 
  Film, 
  Play, 
  Sparkles, 
  Clock, 
  Layers, 
  Video, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Lock,
  User,
  MapPin,
  Dna,
  SlidersHorizontal,
  Compass,
  MonitorPlay,
  RotateCcw,
  Zap,
  Info,
  ImageIcon,
  X
} from 'lucide-react';

import { AVATAR_REGISTRY, NajiAvatar } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY, NajiLocation } from '../data/locations/locationRegistry';
import { 
  AdDnaState, 
  INITIAL_AD_DNA_STATE, 
  computeFieldStatuses, 
  composeMasterAdPrompt 
} from '../lib/adDnaEngine';

import { StageArea } from '../components/najeAd/StageArea';
import { CastingRoom } from '../components/najeAd/CastingRoom';
import { LocationScout } from '../components/najeAd/LocationScout';
import { StyleGallery } from '../components/najeAd/StyleGallery';
import { AdDnaPanel } from '../components/najeAd/AdDnaPanel';
import { ProductionPipelineBar } from '../components/najeAd/ProductionPipelineBar';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';


export default function NajeAd() {
  const { user, updateBalance } = useAppStore();
  const { najeAd } = usePricingConfig();
  
  const najeAdConfig = najeAd || {
    enabled: true,
    pointsRatePerSecond: 2.5,
    durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
    maxShotsPerVideo: 4,
    defaultModelEndpointId: 'video_standard'
  };

  const pointsRate = typeof najeAdConfig.pointsRatePerSecond === 'number' ? najeAdConfig.pointsRatePerSecond : 2.5;
  const rawDurations = najeAdConfig.durationOptionsSec && najeAdConfig.durationOptionsSec.length > 0
    ? najeAdConfig.durationOptionsSec
    : [4, 6, 8, 10, 12, 14, 16, 24, 30];

  // Director mode toggle
  const [isDirectorMode, setIsDirectorMode] = useState(false);

  // Ad DNA State
  const [dnaState, setDnaState] = useState<AdDnaState>(INITIAL_AD_DNA_STATE);
  const fieldStatuses = useMemo(() => computeFieldStatuses(dnaState), [dnaState]);

  // Selected Avatar & Location entities
  const selectedAvatar: NajiAvatar | null = useMemo(() => {
    return dnaState.selectedAvatarId ? (AVATAR_REGISTRY[dnaState.selectedAvatarId] || null) : null;
  }, [dnaState.selectedAvatarId]);

  const selectedLocation: NajiLocation | null = useMemo(() => {
    return dnaState.selectedLocationId ? (LOCATION_REGISTRY[dnaState.selectedLocationId] || null) : null;
  }, [dnaState.selectedLocationId]);

  const updateDna = (partial: Partial<AdDnaState>) => {
    setDnaState(prev => ({ ...prev, ...partial }));
  };

  // Generation Controls
  const [prompt, setPrompt] = useState('');
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(rawDurations.includes(10) ? 10 : rawDurations[0] || 8);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobData, setActiveJobData] = useState<any>(null);
  const [showAdPaywall, setShowAdPaywall] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);

  // Computed Duration Options
  const durationOptions = useMemo(() => {
    return rawDurations.map(sec => {
      const shotsList = splitDuration(sec);
      const cost = Math.ceil(sec * pointsRate);
      const shotsText = shotsList.length === 1 
        ? `لقطة واحدة (${shotsList[0]}s)`
        : `لقطتان (${shotsList.map(s => `${s}s`).join(' + ')})`;
      return {
        value: sec,
        label: `${sec} ثواني`,
        shots: shotsText,
        points: cost
      };
    });
  }, [rawDurations, pointsRate]);

  // Computed real-time breakdown plan
  const livePlan: VideoPlan = useMemo(() => {
    return buildInitialPlan({
      rawPrompt: prompt.trim() || 'مشهد إعلاني سينمائي متتابع',
      totalDurationSec: duration,
      aspectRatio: dnaState.aspectRatio,
      pointsRatePerSecond: pointsRate
    });
  }, [prompt, duration, dnaState.aspectRatio, pointsRate]);

  // Subscribe to real-time updates for active job
  useEffect(() => {
    if (!activeJobId) return;

    const unsub = onSnapshot(doc(db, 'generation_jobs', activeJobId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveJobData(data);

        if (data.status === 'completed') {
          setIsSubmitting(false);
          if (data.consumedBalance && user?.balance !== undefined) {
            updateBalance(Math.max(0, user.balance - data.consumedBalance));
          }
        } else if (data.status === 'failed') {
          setIsSubmitting(false);
          setErrorMessage(data.error || 'تعذر استكمال التوليد. تم استرجاع نقاطك بالكامل.');
        }
      }
    }, (err) => {
      console.error('Error tracking generation job:', err);
    });

    return () => unsub();
  }, [activeJobId, user?.balance, updateBalance]);

  // Fetch user's recent Naje Ad videos
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'generated_media'),
      where('ownerId', '==', user.uid),
      where('type', '==', 'video'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentVideos(docs);
    }, (e) => {
      console.warn('Recent videos fetch fallback:', e);
    });

    return () => unsub();
  }, [user?.uid]);

  // Handle Production Trigger
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract the base64 part
      const base64 = result.split(',')[1];
      setReferenceImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !selectedAvatar && !selectedLocation) {
      setErrorMessage('يرجى كتابة فكرة الإعلان أو اختيار شخصية وموقع على الأقل.');
      return;
    }

    if (!hasFeatureAccess(user, 'najeAd')) {
      setShowAdPaywall(true);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    // Compose rich master prompt with Ad DNA
    const masterPrompt = composeMasterAdPrompt(prompt, dnaState);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('يرجى تسجيل الدخول للمتابعة.');
      }

      const res = await fetch('/api/naje-ad/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: masterPrompt,
          duration,
          aspectRatio: dnaState.aspectRatio,
          resolution,
          model: 'veo',
          brandProfile: referenceImageBase64 ? { referenceImageBase64 } : undefined,
          chatId: `naje_ad_${Date.now()}`,
          projectId: useAppStore.getState().activeProjectId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في بدء عملية التوليد.');
      }

      if (data.jobId) {
        setActiveJobId(data.jobId);
      }

      if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
      }
    } catch (err: any) {
      console.error('Generation trigger failed:', err);
      setIsSubmitting(false);
      setActiveJobId(null);
      setErrorMessage(err.message || 'حدث خطأ أثناء التواصل مع الخادم.');
    }
  };

  const activeJobStatus = activeJobData?.status || (isSubmitting ? 'pending' : 'idle');
  const activeJobProgress = activeJobData?.progress || 0;
  const activeJobStepLabel = activeJobData?.status === 'queued' 
    ? `في طابور الانتظار (أنت في المركز: ${activeJobData?.queuePosition || '...'})`
    : activeJobData?.stepLabel || activeJobData?.currentStepLabel || (isSubmitting ? 'جاري التحضير...' : undefined);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[#0d0f14] text-gray-100 py-6 px-3 sm:px-6 lg:px-8 font-['Cairo'] selection:bg-indigo-500/30 scrollbar-thin" dir="rtl">
      <FeaturePaywallModal
        isOpen={showAdPaywall}
        onClose={() => setShowAdPaywall(false)}
        feature="najeAd"
      />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP BAR: STUDIO HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#11141c]/90 border border-gray-800/80 rounded-3xl p-5 backdrop-blur-md shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
              <Film className="w-3.5 h-3.5" />
              <span>NAJI AD STUDIO FLOOR — الإنتاج السينمائي الحي</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              استوديو إنتاج الإعلانات الفائق
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                حركية وتفاعل سينمائي حي
              </span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              مكتبة متكاملة من 150 شخصية عالمية و150 موقع تصوير مع ربط المشاهد وتحكم دقيق في الإضاءة والكاميرا.
            </p>
          </div>

          {/* User Balance & Quick Status */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="bg-[#161a25] border border-gray-700/80 rounded-2xl px-4 py-2 text-right shadow-inner">
              <div className="text-[10px] text-gray-400 font-bold">رصيد النقاط</div>
              <div className="text-base font-black text-amber-400 font-mono">
                {user?.balance !== undefined ? user.balance.toLocaleString() : 0} <span className="text-[10px] font-normal text-gray-400">نقطة</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROOM NAVIGATION TABS (Single Row Multi-Room Bar with Sliding Layout Indicator) */}
        <div className="flex flex-wrap items-center justify-end gap-2 bg-[#11141c]/80 border border-gray-800/80 rounded-2xl p-2 relative">
          {/* Director Mode Fast Toggle */}
          <button
            type="button"
            onClick={() => setIsDirectorMode(!isDirectorMode)}
            className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              isDirectorMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-[#151924] text-gray-400 border-gray-700 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDirectorMode ? 'الخروج من وضع المخرج' : 'وضع المخرج السريع (Director Mode)'}</span>
          </button>
        </div>

        {/* PRODUCTION PIPELINE BAR */}
        <ProductionPipelineBar
          status={activeJobStatus}
          progress={activeJobProgress}
          stepLabel={activeJobStepLabel}
          shotsCount={livePlan.shots.length}
        />

        {/* ERROR / NOTICES */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* SEQUENTIAL LAYOUT */}
        <AnimatePresence mode="wait">
          {!isDirectorMode && (
            <motion.div
              key="preparation-rooms"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 overflow-hidden"
            >
              {/* ROOM 2: CASTING ROOM */}
              <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-3xl shadow-xl overflow-hidden">
                <CastingRoom
                  selectedAvatarId={dnaState.selectedAvatarId}
                  onSelectAvatar={(avatarId) => updateDna({ selectedAvatarId: avatarId })}
                />
              </div>

              {/* ROOM 3: LOCATION SCOUT */}
              <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-3xl shadow-xl overflow-hidden">
                <LocationScout
                  selectedLocationId={dnaState.selectedLocationId}
                  onSelectLocation={(locationId) => updateDna({ selectedLocationId: locationId })}
                />
              </div>

              {/* ROOM 3.5: STYLE GALLERY */}
              <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-3xl shadow-xl overflow-hidden">
                <StyleGallery
                  selectedStyleId={dnaState.selectedStyleTemplateId || null}
                  onSelectStyle={(styleId) => updateDna({ selectedStyleTemplateId: styleId })}
                />
              </div>

              {/* ROOM 4: AD DNA PANEL */}
              <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-3xl p-6 shadow-xl">
                <AdDnaPanel
                  dnaState={dnaState}
                  fieldStatuses={fieldStatuses}
                  onUpdateDna={updateDna}
                  onOpenCasting={() => {}}
                  onOpenLocationScout={() => {}}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE & PRODUCTION FORM */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 4 Cols: Shot Breakdown Plan */}
            <div className="lg:col-span-4 space-y-4">
              {/* Multi-Shot Production Plan Info Card */}
              <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-md shadow-xl text-right">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>خطة اللقطات المتتابعة (Shot Breakdown)</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-gray-400">
                    {livePlan.totalDurationSec}s إجمالي
                  </span>
                </div>

                <div className="space-y-2">
                  {livePlan.shots.map((shot: any, idx: number) => (
                    <div key={shot.shotNumber} className="p-2.5 rounded-xl bg-[#0b0e14] border border-gray-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-indigo-400">لقطة {shot.shotNumber}: {idx === 0 ? 'اللقطة الافتتاحية' : 'لقطة التتمة والتوسع'}</span>
                        <span className="text-gray-400 font-mono">{shot.durationSec} ثواني</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        {shot.descriptionAr || (idx === 0 ? 'تأسيس المشهد وبناء الهوية البصرية' : 'استمرارية الحركة والوصول للذروة الإعلانية')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Stage Viewport & Production Launch Form */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Central Stage Area */}
              <StageArea
                avatar={selectedAvatar}
                location={selectedLocation}
                dnaState={dnaState}
                fieldStatuses={fieldStatuses}
                onUpdateDna={updateDna}
                onOpenCasting={() => {}}
                onOpenLocationScout={() => {}}
                onResetJob={() => {
                  setActiveJobId(null);
                  setActiveJobData(null);
                }}
                videoUrl={activeJobData?.videoUrl || activeJobData?.mediaUrl}
                isGenerating={isSubmitting}
                progress={activeJobProgress}
                stepLabel={activeJobStepLabel}
                status={activeJobStatus}
              />

              {/* Script & Launch Card */}
              <div className={`bg-[#11141c]/90 border rounded-3xl p-6 shadow-2xl space-y-5 ${isDirectorMode ? 'border-amber-500/30' : 'border-gray-800/80'}`}>
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${isDirectorMode ? 'text-amber-400' : 'text-indigo-400'}`} />
                    <h3 className="text-xs font-black text-white">كتابة السيناريو وبدء الإنتاج (Production Launch)</h3>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    التكلفة التقديرية: {livePlan.totalEstimatedCostPoints} نقطة
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Script Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      فكرة وسيناريو الإعلان (Prompt Script)
                    </label>
                    <textarea
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="اكتب فكرة الإعلان وسيقوم المحرك بدمج الشخصية والموقع والإضاءة والأبعاد المختارة تلقائياً في سيناريو سينمائي متكامل..."
                      disabled={isSubmitting || najeAdConfig.enabled === false}
                      className="w-full bg-[#0b0e14] border border-gray-700/80 rounded-2xl p-3.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none disabled:opacity-50"
                    />
                  </div>

                  
                  {/* Reference Image Upload */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      صورة مرجعية للقطة الأولى (اختياري)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 bg-[#0b0e14] border border-gray-700/80 border-dashed rounded-2xl p-3.5 flex items-center justify-center cursor-pointer hover:border-purple-500 transition group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        <div className="flex items-center gap-2 text-gray-500 group-hover:text-purple-400 transition">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-xs font-bold">
                            {referenceImageBase64 ? 'تم إرفاق الصورة المرجعية بنجاح (انقر لتغييرها)' : 'انقر لرفع صورة مرجعية'}
                          </span>
                        </div>
                      </label>
                      {referenceImageBase64 && (
                        <button
                          type="button"
                          onClick={() => setReferenceImageBase64(null)}
                          disabled={isSubmitting}
                          className="px-3 py-3.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                          title="إزالة الصورة"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Duration Selector Matrix -> Select Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      مدة الفيديو المطلوبة:
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      disabled={isSubmitting || najeAdConfig.enabled === false}
                      className="w-full bg-[#0e111a] border border-gray-700/80 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50 cursor-pointer"
                    >
                      {durationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.points} نقطة
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Action Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || najeAdConfig.enabled === false}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500/90 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black transition shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري توليد ومعالجة المشاهد السينمائية ({activeJobProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>توليد وبدء الإنتاج الآن — خصم {livePlan.totalEstimatedCostPoints} نقطة</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>

        {/* RECENT GENERATED VIDEOS GALLERY */}
        {recentVideos.length > 0 && (
          <div className="bg-[#11141c]/90 border border-gray-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <span>معرض الإعلانات والمشاهد المولدة مؤخراً</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">{recentVideos.length} فيديو</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recentVideos.map((vid) => (
                <div key={vid.id} className="bg-[#0b0e14] border border-gray-800 rounded-2xl p-3 space-y-2 overflow-hidden group">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
                    <video
                      src={vid.url || vid.videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white truncate">{vid.prompt || 'مشهد إعلاني متتابع'}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{vid.durationSec || vid.duration || 8}s • {vid.aspectRatio || '16:9'}</span>
                      <a
                        href={vid.url || vid.videoUrl}
                        download
                        className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                      >
                        <Download className="w-3 h-3" />
                        <span>تحميل</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
