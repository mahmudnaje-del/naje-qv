import React, { useEffect, useState } from 'react';
import { Clapperboard, Download, Sparkles, Upload } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppStore } from '../store';
import { auth, db } from '../firebase';
import { hasFeatureAccess } from '../lib/featureAccess';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';
import { toast } from '../toastStore';

const MOODS = [
  { id: 'luxury', label: 'فاخر' },
  { id: 'sport', label: 'رياضي' },
  { id: 'kids', label: 'مرح' },
  { id: 'news', label: 'إخباري' },
  { id: 'cinematic', label: 'سينمائي' },
  { id: 'minimal', label: 'بسيط' },
];

export default function NajeIdent() {
  const { user, updateBalance } = useAppStore();
  const [kind, setKind] = useState<'intro' | 'outro'>('intro');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [mood, setMood] = useState('cinematic');
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<any>(null);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const unsub = onSnapshot(doc(db, 'generation_jobs', jobId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setJob(data);
      if (['completed', 'failed'].includes(data.status)) setBusy(false);
      if (data.status === 'failed') setError(data.error || 'فشل الإنتاج');
    });
    return () => unsub();
  }, [jobId]);

  const pickLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!name.trim()) {
      toast.error('اكتب اسم القناة أو الجهة');
      return;
    }
    if (!hasFeatureAccess(user, 'najeAd')) {
      setPaywall(true);
      return;
    }
    setError(null);
    setBusy(true);
    const token = await auth.currentUser?.getIdToken();
    const prompt = kind === 'intro'
      ? `Cinematic ${duration}-second channel intro bumper for "${name.trim()}". ${tagline.trim() ? `Tagline on screen: ${tagline.trim()}.` : ''} Mood: ${mood}. Logo sting, elegant motion graphics, no dialogue, broadcast-quality ident, ends on a clean logo hold.`
      : `Cinematic ${duration}-second end-card / outro for "${name.trim()}". ${tagline.trim() ? `End line: ${tagline.trim()}.` : ''} Mood: ${mood}. Subscribe/follow composition, logo lockup, no dialogue.`;
    try {
      const res = await fetch('/api/naje-ad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt,
          duration: 10,
          aspectRatio: '16:9',
          resolution: '720p',
          model: 'omni-1.1',
          productName: name.trim(),
          productImageBase64: logo && logo.includes(',') ? logo.slice(logo.indexOf(',') + 1) : undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 402 || data?.error === 'feature_locked') {
        setPaywall(true);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'فشل الطلب');
      if (typeof data.newBalance === 'number') updateBalance(data.newBalance);
      if (data.jobId) setJobId(data.jobId);
      else setBusy(false);
    } catch (e: any) {
      setBusy(false);
      setError(e.message || 'حدث خطأ');
    }
  };

  const videoUrl = job?.videoUrl || job?.mediaUrl;

  return (
    <div className="naje-ad-studio relative h-full overflow-y-auto bg-[#0b0c10] px-3 py-4 text-[#f4efe6] sm:px-6" dir="rtl">
      <StudioBootSplash dark />
      <FeaturePaywallModal isOpen={paywall} onClose={() => setPaywall(false)} feature="najeAd" />
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#16120e,#0b0c10)] p-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-2.5 py-0.5 text-[10px] font-black text-[#e8b86d]">
            <Clapperboard className="h-3.5 w-3.5" /> انترو ونهاية
          </div>
          <h1 className="text-xl font-black text-white">اصنع انترو ونهاية</h1>
          <p className="mt-1 text-xs text-white/50">لصنّاع المحتوى والشركات والجهات — هوية متحركة 5 أو 10 ثوانٍ.</p>
        </header>

        <div className="grid grid-cols-2 gap-2">
          {(['intro', 'outro'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-2xl border py-3 text-sm font-black ${
                kind === k ? 'border-[#d4a574] bg-[#d4a574]/15 text-white' : 'border-white/10 text-white/60'
              }`}
            >
              {k === 'intro' ? 'انترو / بداية' : 'نهاية / أوترو'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([5, 10] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`rounded-2xl border py-3 text-sm font-black ${
                duration === d ? 'border-[#d4a574] bg-[#d4a574]/15 text-white' : 'border-white/10 text-white/60'
              }`}
            >
              {d} ثوانٍ
            </button>
          ))}
        </div>

        <label className="block text-xs font-black">الاسم / القناة / الجهة</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: قناة ناجي، شركة أفق، بودكاست الليل"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
        />
        <label className="block text-xs font-black">جملة الإغلاق أو الشعار النصي</label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="اختياري"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
        />

        <p className="text-xs font-black">المزاج</p>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold ${
                mood === m.id ? 'border-[#d4a574] bg-[#d4a574] text-black' : 'border-white/10 text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => document.getElementById('ident-logo')?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4a574]/40 bg-black/30 py-6"
        >
          {logo ? (
            <img src={logo} alt="شعار" className="h-16 object-contain" />
          ) : (
            <>
              <Upload className="mb-1 h-6 w-6 text-[#e8b86d]" />
              <span className="text-[11px] font-bold text-white/60">أرفق الشعار (اختياري)</span>
            </>
          )}
        </button>
        <input id="ident-logo" type="file" accept="image/*" className="hidden" onChange={(e) => pickLogo(e.target.files?.[0])} />

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={generate}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d4a574] py-3.5 text-sm font-black text-black disabled:opacity-50"
        >
          {busy ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
          {busy ? 'جاري صناعة الهوية…' : `إنتاج ${kind === 'intro' ? 'الانترو' : 'النهاية'} — ${duration}ث`}
        </button>

        {(busy || videoUrl) && (
          <section className="rounded-2xl border border-white/10 bg-black/40 p-3">
            {busy && !videoUrl && (
              <div className="flex flex-col items-center gap-2 py-8">
                <NajeThinking size={56} />
                <span className="text-xs font-bold text-[#e8b86d]">{job?.stepLabel || 'ناجي يبني الهوية…'}</span>
              </div>
            )}
            {videoUrl && <video src={videoUrl} controls playsInline className="w-full rounded-xl bg-black" />}
            {videoUrl && (
              <a href={videoUrl} download className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#e8b86d]">
                <Download className="h-3.5 w-3.5" /> تحميل
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
