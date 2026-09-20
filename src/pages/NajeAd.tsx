import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Clapperboard, Download, Film, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { hasFeatureAccess } from '../lib/featureAccess';
import { AdDnaState, DIALECT_OPTIONS, INITIAL_AD_DNA_STATE } from '../lib/adDnaEngine';
import { AVATAR_REGISTRY } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY } from '../data/locations/locationRegistry';
import {
  NAJE_VIDEO_PRO_LABEL,
  OmniDuration,
  OmniResolution,
  SceneBoardCard,
  composeOmniAdPrompt,
  estimateOmniPoints,
} from '../lib/omniAd';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { CastingRoom } from '../components/najeAd/CastingRoom';
import { LocationScout } from '../components/najeAd/LocationScout';
import { StyleGallery } from '../components/najeAd/StyleGallery';
import { CastBoard } from '../components/najeAd/CastBoard';
import { ProControlGrid } from '../components/najeAd/ProControlGrid';

function stripDataUrl(dataUrl: string | null | undefined): string | undefined {
  if (!dataUrl) return undefined;
  const i = dataUrl.indexOf(',');
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

function upsertKind(cards: SceneBoardCard[], kind: SceneBoardCard['kind'], patch: Partial<SceneBoardCard>): SceneBoardCard[] {
  const idx = cards.findIndex((c) => c.kind === kind);
  if (idx === -1) {
    return [...cards, { id: `sc_${kind}_${Date.now().toString(36)}`, kind, ...patch }];
  }
  const next = [...cards];
  next[idx] = { ...next[idx], ...patch };
  return next;
}

export default function NajeAd() {
  const { user, updateBalance } = useAppStore();
  const { najeAd } = usePricingConfig();
  const pointsRate = typeof najeAd?.pointsRatePerSecond === 'number' ? najeAd.pointsRatePerSecond : 2.5;
  const resMul = najeAd?.resolutionMultiplier;

  const [dna, setDna] = useState<AdDnaState>(INITIAL_AD_DNA_STATE);
  const [sceneCards, setSceneCards] = useState<SceneBoardCard[]>([]);
  const [customCharacter, setCustomCharacter] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState<string | null>(null);
  const [showCastHint, setShowCastHint] = useState(true);
  const [showLocHint, setShowLocHint] = useState(true);

  const [duration, setDuration] = useState<OmniDuration>(10);
  const [resolution, setResolution] = useState<OmniResolution>('720p');
  const [cameraMotion, setCameraMotion] = useState('cinematic_pan');
  const [lighting, setLighting] = useState('studio');
  const [marketingGoal, setMarketingGoal] = useState('showcase');
  const [audioMode, setAudioMode] = useState('native');
  const [pace, setPace] = useState('medium');
  const [colorGrade, setColorGrade] = useState('warm');
  const [productPlacement, setProductPlacement] = useState('hero');
  const [cta, setCta] = useState('hold');
  const [voiceCast, setVoiceCast] = useState('talent');
  const [musicEnergy, setMusicEnergy] = useState('soft');
  const [hookStyle, setHookStyle] = useState('product_first');
  const [prompt, setPrompt] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [editText, setEditText] = useState('');

  const avatar = dna.selectedAvatarId ? AVATAR_REGISTRY[dna.selectedAvatarId] || null : null;
  const location = dna.selectedLocationId ? LOCATION_REGISTRY[dna.selectedLocationId] || null : null;
  const points = estimateOmniPoints({ durationSec: duration, resolution, pointsRatePerSecond: pointsRate, resolutionMultiplier: resMul });
  const productCard = sceneCards.find((c) => c.kind === 'product');
  const updateDna = (partial: Partial<AdDnaState>) => setDna((p) => ({ ...p, ...partial }));

  useEffect(() => {
    if (!activeJobId) return;
    const unsub = onSnapshot(doc(db, 'generation_jobs', activeJobId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setActiveJob(data);
      if (data.lastActionError) setErrorMessage(data.lastActionError);
      if (data.status === 'completed' || data.status === 'failed') {
        setIsSubmitting(false);
      }
      if (data.status === 'failed') {
        setErrorMessage(data.error || 'تعذر استكمال التوليد. أُعيدت نقاطك.');
      }
      if (['generating', 'editing', 'extending', 'queued', 'planning', 'finalizing'].includes(data.status)) {
        setIsSubmitting(true);
      }
    });
    return () => unsub();
  }, [activeJobId]);

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
      setRecentVideos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  const postJob = async (path: string, body: Record<string, unknown>) => {
    if (!hasFeatureAccess(user, 'najeAd')) {
      setShowPaywall(true);
      return null;
    }
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('يرجى تسجيل الدخول.');
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (res.status === 402 || data?.error === 'feature_locked') {
      setShowPaywall(true);
      return null;
    }
    if (!res.ok) throw new Error(data?.error || 'فشل الطلب');
    if (data?.newBalance !== undefined) updateBalance(data.newBalance);
    return data;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const hasTalent = Boolean(avatar || customCharacter || sceneCards.some((c) => c.kind === 'character' || c.kind === 'character_extra'));
    if (!prompt.trim() && !productCard?.name && !hasTalent) {
      setErrorMessage('أضف منتجاً أو شخصية أو اكتب فكرة الإعلان.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    const master = composeOmniAdPrompt({
      script: prompt,
      dna,
      styleId: dna.selectedStyleTemplateId,
      sceneCards,
      cameraMotion,
      lighting,
      marketingGoal,
      audioMode,
      pace,
      colorGrade,
      productPlacement,
      cta,
      voiceCast,
      musicEnergy,
      hookStyle,
      durationSec: duration,
      aspectRatio: dna.aspectRatio,
    });
    const primaryChar = sceneCards.find((c) => c.kind === 'character');
    const primaryLoc = sceneCards.find((c) => c.kind === 'location');
    const extraImages = sceneCards
      .filter((c) => c.preview && c.kind !== 'product' && c.kind !== 'character' && c.kind !== 'location')
      .slice(0, 6)
      .map((c) => ({
        kind: c.kind,
        id: c.id,
        name: c.name,
        appearAtSec: c.appearAtSec,
        imageBase64: stripDataUrl(c.preview),
      }));
    try {
      const data = await postJob('/api/naje-ad/generate', {
        prompt: master,
        duration,
        aspectRatio: dna.aspectRatio,
        resolution,
        model: 'omni-1.1',
        productName: productCard?.name || '',
        productImageBase64: stripDataUrl(productCard?.preview),
        characterImageBase64: stripDataUrl(primaryChar?.preview || customCharacter),
        locationImageBase64: stripDataUrl(primaryLoc?.preview || customLocation),
        selectedAvatarId: primaryChar?.avatarId || dna.selectedAvatarId,
        selectedLocationId: primaryLoc?.locationId || dna.selectedLocationId,
        sceneCards: sceneCards.map(({ preview, ...rest }) => rest),
        extraImages,
        cameraMotion,
        lighting,
        marketingGoal,
        audioMode,
      });
      if (data?.jobId) setActiveJobId(data.jobId);
      else setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء التواصل مع الخادم.');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || !activeJobId) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const data = await postJob('/api/naje-ad/edit', { jobId: activeJobId, instruction: editText.trim() });
      if (data?.jobId) setActiveJobId(data.jobId);
      setEditText('');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'فشل التحرير');
    }
  };

  const handleExtend = async () => {
    if (!activeJobId) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const data = await postJob('/api/naje-ad/extend', { jobId: activeJobId });
      if (data?.jobId) setActiveJobId(data.jobId);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'فشل تمديد المشهد');
    }
  };

  const videoUrl = activeJob?.videoUrl || activeJob?.mediaUrl;
  const progress = activeJob?.progress || 0;
  const stepLabel = activeJob?.status === 'queued'
    ? `في الانتظار (المركز ${activeJob?.queuePosition || '…'})`
    : activeJob?.stepLabel || (isSubmitting ? 'جاري التحضير…' : '');

  return (
    <div className="h-full overflow-y-auto bg-[#07080c] px-3 py-5 text-[#f4efe6] sm:px-6" dir="rtl">
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeAd" />
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(1200px_circle_at_100%_-20%,rgba(212,165,116,0.16),transparent_45%),linear-gradient(180deg,#141218,#0b0c10)] p-5 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-[#e8b86d]">
                <Clapperboard className="h-3.5 w-3.5" /> NAJE AD · {NAJE_VIDEO_PRO_LABEL}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">استوديو الإعلان المتحرك</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
                {NAJE_VIDEO_PRO_LABEL} — توليد، تمديد المشهد حتى 40 ثانية، وتحرير باللغة الطبيعية على Gemini Omni 1.1 Flash.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-right">
              <div className="text-[10px] text-white/40">رصيدك</div>
              <div className="font-mono text-lg font-black text-[#e8b86d]">{(user?.balance ?? 0).toLocaleString()} نقطة</div>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {errorMessage}
            </span>
            <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">إغلاق</button>
          </div>
        )}

        <section className="rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
          <CastingRoom
            selectedAvatarId={dna.selectedAvatarId}
            customPreview={customCharacter}
            onSelectAvatar={(id) => {
              setCustomCharacter(null);
              updateDna({ selectedAvatarId: id });
              const av = id ? AVATAR_REGISTRY[id] : null;
              setSceneCards((prev) => upsertKind(prev, 'character', {
                avatarId: id,
                name: av?.name,
                preview: null,
              }));
            }}
            onCustomFile={(url) => {
              setCustomCharacter(url);
              updateDna({ selectedAvatarId: null });
              setSceneCards((prev) => upsertKind(prev, 'character', {
                avatarId: null,
                preview: url,
                name: 'شخصية مرفقة',
              }));
            }}
            showHint={showCastHint}
            onUserSwipe={() => setShowCastHint(false)}
          />
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
          <LocationScout
            selectedLocationId={dna.selectedLocationId}
            customPreview={customLocation}
            onSelectLocation={(id) => {
              setCustomLocation(null);
              updateDna({ selectedLocationId: id });
              const loc = id ? LOCATION_REGISTRY[id] : null;
              setSceneCards((prev) => upsertKind(prev, 'location', {
                locationId: id,
                name: loc?.name,
                preview: null,
              }));
            }}
            onCustomFile={(url) => {
              setCustomLocation(url);
              updateDna({ selectedLocationId: null });
              setSceneCards((prev) => upsertKind(prev, 'location', {
                locationId: null,
                preview: url,
                name: 'مكان مرفق',
              }));
            }}
            showHint={showLocHint}
            onUserSwipe={() => setShowLocHint(false)}
          />
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
          <StyleGallery
            selectedStyleId={dna.selectedStyleTemplateId}
            onSelectStyle={(id) => updateDna({ selectedStyleTemplateId: id, style: id })}
          />
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
          <CastBoard
            cards={sceneCards}
            onChange={setSceneCards}
            duration={duration}
            libraryAvatar={avatar}
            libraryLocation={location}
          />
        </section>

        <ProControlGrid
          duration={duration}
          onDuration={setDuration}
          resolution={resolution}
          onResolution={setResolution}
          aspectRatio={dna.aspectRatio}
          onAspect={(v) => updateDna({ aspectRatio: v })}
          platform={dna.platform}
          onPlatform={(v) => updateDna({ platform: v })}
          cameraMotion={cameraMotion}
          onCamera={setCameraMotion}
          lighting={lighting}
          onLighting={setLighting}
          marketingGoal={marketingGoal}
          onGoal={setMarketingGoal}
          audioMode={audioMode}
          onAudio={setAudioMode}
          dialect={dna.dialect}
          onDialect={(v) => updateDna({ dialect: v })}
          language={dna.language}
          onLanguage={(v) => {
            const dialects = DIALECT_OPTIONS[v] || [];
            updateDna({ language: v, dialect: dialects[0]?.id || '' });
          }}
          pace={pace}
          onPace={setPace}
          colorGrade={colorGrade}
          onColorGrade={setColorGrade}
          productPlacement={productPlacement}
          onProductPlacement={setProductPlacement}
          cta={cta}
          onCta={setCta}
          voiceCast={voiceCast}
          onVoiceCast={setVoiceCast}
          musicEnergy={musicEnergy}
          onMusicEnergy={setMusicEnergy}
          hookStyle={hookStyle}
          onHookStyle={setHookStyle}
          pointsRate={pointsRate}
          resolutionMultiplier={resMul}
        />

        <form onSubmit={handleGenerate} className="space-y-3 rounded-[28px] border border-white/8 bg-[#0e1016] p-5">
          <label className="block text-xs font-black text-white">سيناريو الإعلان</label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: الكاميرا تدور حول الزجاجة ثم ترفعها اليد ببطء نحو الضوء، رذاذ ماء، ابتسامة واثقة..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || najeAd?.enabled === false}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#c17f59] via-[#d4a574] to-[#7dd3c7] py-3.5 text-sm font-black text-black shadow-[0_12px_40px_-12px_rgba(212,165,116,0.7)] disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isSubmitting ? stepLabel || 'جاري الإنتاج…' : `إنتاج الإعلان — ${points} نقطة`}
          </button>
        </form>

        {(isSubmitting || videoUrl) && (
          <section className="space-y-3 rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-sm font-black text-white">
                <Film className="h-4 w-4 text-[#d4a574]" /> المونيتور
              </h3>
              {isSubmitting && <span className="text-[11px] font-mono text-[#e8b86d]">{progress}%</span>}
            </div>
            {isSubmitting && (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-gradient-to-l from-[#d4a574] to-[#7dd3c7]" animate={{ width: `${Math.max(8, progress)}%` }} />
              </div>
            )}
            {videoUrl && (
              <video src={videoUrl} controls playsInline className="w-full overflow-hidden rounded-2xl bg-black" />
            )}
            {videoUrl && !isSubmitting && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <a href={videoUrl} download className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold">
                    <Download className="h-3.5 w-3.5" /> تحميل
                  </a>
                  {(activeJob?.totalDurationSec || duration) < 40 && (
                    <button type="button" onClick={handleExtend} className="inline-flex items-center gap-1 rounded-xl border border-[#7dd3c7]/40 px-3 py-2 text-[11px] font-bold text-[#7dd3c7]">
                      تمديد المشهد +10ث
                      <span className="text-white/40">({activeJob?.totalDurationSec || duration}→{Math.min(40, (activeJob?.totalDurationSec || duration) + 10)}ث)</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="تحرير طبيعي: اجعل الإضاءة أدفأ، أخفِ الحوار، قرّب المنتج..."
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
                  />
                  <button type="button" onClick={handleEdit} className="inline-flex items-center gap-1 rounded-xl bg-[#d4a574] px-3 py-2 text-[11px] font-black text-black">
                    <Wand2 className="h-3.5 w-3.5" /> طبّق
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {recentVideos.length > 0 && (
          <section className="rounded-[28px] border border-white/8 bg-[#0e1016] p-4">
            <h3 className="mb-3 text-sm font-black text-white">آخر الإعلانات</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {recentVideos.map((vid) => (
                <div key={vid.id} className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                  <video src={vid.url || vid.videoUrl || vid.mediaUrl} controls playsInline className="aspect-video w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
