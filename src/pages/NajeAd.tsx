import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Clapperboard, Download, Film, Sparkles, Wand2 } from 'lucide-react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { hasFeatureAccess } from '../lib/featureAccess';
import { AdDnaState, INITIAL_AD_DNA_STATE } from '../lib/adDnaEngine';
import { AVATAR_REGISTRY } from '../data/avatars/avatarRegistry';
import { LOCATION_REGISTRY } from '../data/locations/locationRegistry';
import {
  BeatInterval,
  BeatSlot,
  NAJE_VIDEO_PRO_LABEL,
  OmniDuration,
  OmniResolution,
  SceneBoardCard,
  composeOmniAdPrompt,
  defaultSceneBoard,
  estimateOmniPoints,
  mergeBeatSlots,
} from '../lib/omniAd';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import NajeCreditIcon from '../components/NajeCreditIcon';
import { CastingRoom } from '../components/najeAd/CastingRoom';
import { LocationScout } from '../components/najeAd/LocationScout';
import { StyleGallery } from '../components/najeAd/StyleGallery';
import { CastBoard } from '../components/najeAd/CastBoard';
import { ProControlGrid } from '../components/najeAd/ProControlGrid';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';
import { useI18n, translate } from '../i18n';
import SmokeChatWrapper from '../components/chat/SmokeChatWrapper';
import { useLivePlaceholder, AD_STUDIO_PHRASES } from '../hooks/useLivePlaceholder';

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
  const { isRtl, t } = useI18n();
  const { najeAd } = usePricingConfig();
  const pointsRate = typeof najeAd?.pointsRatePerSecond === 'number' ? najeAd.pointsRatePerSecond : 2.5;
  const resMul = najeAd?.resolutionMultiplier;

  const [dna, setDna] = useState<AdDnaState>({ ...INITIAL_AD_DNA_STATE, language: '', dialect: '' });
  const [sceneCards, setSceneCards] = useState<SceneBoardCard[]>(() => defaultSceneBoard());
  const [customCharacter, setCustomCharacter] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState<string | null>(null);
  const [showCastHint, setShowCastHint] = useState(true);
  const [showLocHint, setShowLocHint] = useState(true);

  const [duration, setDuration] = useState<OmniDuration>(10);
  const [resolution, setResolution] = useState<OmniResolution>('720p');
  const [cameraMotion, setCameraMotion] = useState('');
  const [lighting, setLighting] = useState('');
  const [marketingGoal, setMarketingGoal] = useState('');
  const [audioMode, setAudioMode] = useState('');
  const [pace, setPace] = useState('');
  const [colorGrade, setColorGrade] = useState('');
  const [productPlacement, setProductPlacement] = useState('');
  const [cta, setCta] = useState('');
  const [voiceCast, setVoiceCast] = useState('');
  const [musicEnergy, setMusicEnergy] = useState('');
  const [hookStyle, setHookStyle] = useState('');
  const [beatInterval, setBeatInterval] = useState<BeatInterval | null>(null);
  const [beatSlots, setBeatSlots] = useState<BeatSlot[]>([]);
  const [prompt, setPrompt] = useState('');
  const dynamicPlaceholder = useLivePlaceholder(AD_STUDIO_PHRASES);

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
    try {
      const raw = sessionStorage.getItem('naje-prompt-handoff');
      if (!raw) return;
      const j = JSON.parse(raw);
      const best = String(j?.bestFor || '').toLowerCase();
      const promptText = typeof j?.prompt === 'string' ? j.prompt.trim() : '';
      if (!promptText) return;
      const forAd = best === 'ad' || best === 'video' || best === '';
      if (!forAd) return;
      setPrompt((prev) => prev || promptText);
      sessionStorage.removeItem('naje-prompt-handoff');
    } catch {
      /* ignore */
    }
  }, []);

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
        setErrorMessage(data.error || translate('adui.generateFailed', undefined, useAppStore.getState().language || 'ar'));
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
    if (!token) throw new Error(translate('adui.loginRequired', undefined, useAppStore.getState().language || 'ar'));
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
    if (!res.ok) throw new Error(data?.error || translate('adui.requestFailed', undefined, useAppStore.getState().language || 'ar'));
    if (data?.newBalance !== undefined) updateBalance(data.newBalance);
    return data;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const hasTalent = Boolean(avatar || customCharacter || sceneCards.some((c) => c.kind === 'character' || c.kind === 'character_extra'));
    const hasBeats = beatSlots.some((s) => s.text.trim());
    if (!prompt.trim() && !productCard?.name && !hasTalent && !hasBeats) {
      setErrorMessage(t('adui.needIdea'));
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
        beatInterval,
        beats: beatSlots.map((s) => ({ from: s.from, to: s.to, text: s.text })),
      });
      if (data?.jobId) setActiveJobId(data.jobId);
      else setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || t('adui.serverError'));
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
      setErrorMessage(err.message || t('adui.editFailed'));
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
      setErrorMessage(err.message || t('adui.extendFailed'));
    }
  };

  const videoUrl = activeJob?.videoUrl || activeJob?.mediaUrl;
  const progress = activeJob?.progress || 0;
  const stepLabel = activeJob?.status === 'queued'
    ? t('najeIdent.queueStatus', { position: activeJob?.queuePosition || '…' })
    : activeJob?.stepLabel || (isSubmitting ? t('adui.preparing') : '');

  return (
    <div className="naje-ad-studio relative h-full overflow-y-auto bg-[#0b0c10] px-2.5 pb-8 pt-2 text-[#f4efe6] sm:px-6 sm:py-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <StudioBootSplash dark />
      <FeaturePaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="najeAd" />
      <div className="mx-auto max-w-6xl space-y-3 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 py-1">
          <p className="text-xs text-white/60 font-medium leading-relaxed">
            {t('adui.subtitle', { label: NAJE_VIDEO_PRO_LABEL })}
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {errorMessage}
            </span>
            <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">{t('common.close')}</button>
          </div>
        )}

        <section className="rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-4">
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
                name: t('adui.attachedCharacter'),
              }));
            }}
            showHint={showCastHint}
            onUserSwipe={() => setShowCastHint(false)}
          />
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-4">
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
                name: t('adui.attachedPlace'),
              }));
            }}
            showHint={showLocHint}
            onUserSwipe={() => setShowLocHint(false)}
          />
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-4">
          <StyleGallery
            selectedStyleId={dna.selectedStyleTemplateId}
            onSelectStyle={(id) => updateDna({ selectedStyleTemplateId: id, style: id })}
          />
        </section>

        <section className="rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-4">
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
          onDuration={(v) => {
            setDuration(v);
            if (beatInterval) setBeatSlots((prev) => mergeBeatSlots(v, beatInterval, prev));
          }}
          resolution={resolution}
          onResolution={setResolution}
          aspectRatio={dna.aspectRatio}
          onAspect={(v) => updateDna({ aspectRatio: v })}
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
          onLanguage={(v) => updateDna({ language: v, dialect: '' })}
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
          beatInterval={beatInterval}
          onBeatInterval={(v) => {
            setBeatInterval(v);
            if (!v) setBeatSlots([]);
            else setBeatSlots((prev) => mergeBeatSlots(duration, v, prev));
          }}
          beatSlots={beatSlots}
          onBeatSlots={setBeatSlots}
          pointsRate={pointsRate}
          resolutionMultiplier={resMul}
        />

        <p className="px-1 text-[11px] leading-relaxed text-white/50">
          {t('adui.omniPolicy')}
        </p>

        <SmokeChatWrapper className="w-full" chatType="video">
        <form onSubmit={handleGenerate} className="space-y-3 rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-5">
          <label className="block text-xs font-black text-white">{t('adui.scriptLabel')}</label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={dynamicPlaceholder || t('adui.scriptPlaceholder')}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || najeAd?.enabled === false}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[var(--naje-accent)] via-[var(--naje-accent-2)] to-[color-mix(in_srgb,var(--naje-s)_70%,white)] py-3.5 text-sm font-black text-[var(--naje-on-accent)] shadow-[0_12px_40px_-12px_var(--naje-glow)] disabled:opacity-50"
          >
            {isSubmitting ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
            {isSubmitting ? stepLabel || t('adui.producing') : t('adui.produceCta', { points })}
          </button>
        </form>
        </SmokeChatWrapper>

        {(isSubmitting || videoUrl) && (
          <section className="space-y-3 rounded-2xl border border-white/8 bg-naje-elevated p-3 sm:rounded-[28px] sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-sm font-black text-white">
                <Film className="h-4 w-4 text-[var(--naje-accent)]" /> {t('adui.monitor')}
              </h3>
              {isSubmitting && <span className="text-[11px] font-mono text-[var(--naje-accent-2)]">{progress}%</span>}
            </div>
            {isSubmitting && (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-gradient-to-l from-[var(--naje-accent)] to-[#7dd3c7]" animate={{ width: `${Math.max(8, progress)}%` }} />
              </div>
            )}
            {isSubmitting && !videoUrl && (
              <div className="flex flex-col items-center gap-2 py-8">
                <NajeThinking size={52} />
                <span className="text-xs font-bold text-[#e8b86d]">{stepLabel || t('adui.building')}</span>
              </div>
            )}
            {videoUrl && (
              <video src={videoUrl} controls playsInline className="w-full overflow-hidden rounded-2xl bg-black" />
            )}
            {activeJob?.warning && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">{activeJob.warning}</p>
            )}
            {videoUrl && !isSubmitting && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <a href={videoUrl} download className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold">
                    <Download className="h-3.5 w-3.5" /> {t('common.download')}
                  </a>
                  {(activeJob?.totalDurationSec || duration) < 40 && (
                    <button type="button" onClick={handleExtend} className="inline-flex items-center gap-1 rounded-xl border border-[#7dd3c7]/40 px-3 py-2 text-[11px] font-bold text-[#7dd3c7]">
                      {t('adui.extendScene')}
                      <span className="text-white/40">{t('adui.secondsSpan', { from: activeJob?.totalDurationSec || duration, to: Math.min(40, (activeJob?.totalDurationSec || duration) + 10) })}</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder={t('adui.editPlaceholder')}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[var(--naje-accent)] focus:outline-none"
                  />
                  <button type="button" onClick={handleEdit} className="inline-flex items-center gap-1 rounded-xl bg-[var(--naje-accent)] px-3 py-2 text-[11px] font-black text-black">
                    <Wand2 className="h-3.5 w-3.5" /> {t('adui.apply')}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {recentVideos.length > 0 && (
          <section className="rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[28px] sm:p-4">
            <h3 className="mb-3 text-sm font-black text-white">{t('adui.recentAds')}</h3>
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
