import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  DollarSign, 
  Clock, 
  Layers, 
  Cpu, 
  Power, 
  ExternalLink,
  Info,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Activity,
  Play
} from 'lucide-react';
import { auth } from '../../firebase';
import { toast } from '../../toastStore';
import { POINT_USD_VALUE } from '../../lib/modelRegistry';

interface NajeAdConfig {
  enabled: boolean;
  pointsRatePerSecond: number;
  durationOptionsSec: number[];
  maxShotsPerVideo: number;
  defaultModelEndpointId: string;
}

interface GenerationJob {
  id: string;
  ownerId?: string;
  userId?: string;
  status: string;
  progress?: number;
  stepLabel?: string;
  totalDurationSec?: number;
  shotsCount?: number;
  consumedBalance?: number;
  mediaUrl?: string;
  videoUrl?: string;
  resultUrl?: string;
  prompt?: string;
  createdAt?: number;
  error?: string;
}

const AVAILABLE_DURATION_PRESETS = [4, 6, 8, 10, 12, 14, 16, 24, 30];

const MODEL_OPTIONS = [
  { id: 'video_standard', label: 'Naje Video (قياسي — NAJE_MODEL_VIDEO_CORE)', provider: 'Veo' },
  { id: 'video_veo_lite', label: 'Naje Video Lite (خفيف — NAJE_MODEL_VIDEO_CORE)', provider: 'Veo' },
  { id: 'video_omni', label: 'Naje Video Pro (متقدم — NAJE_MODEL_VIDEO_PRO)', provider: 'Veo Pro' },
];

export const AdminNajeAd: React.FC = () => {
  const [config, setConfig] = useState<NajeAdConfig>({
    enabled: true,
    pointsRatePerSecond: 2.5,
    durationOptionsSec: [4, 6, 8, 10, 12, 14, 16, 24, 30],
    maxShotsPerVideo: 4,
    defaultModelEndpointId: 'video_standard'
  });

  const [initialConfig, setInitialConfig] = useState<NajeAdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const fetchConfigAndJobs = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Fetch Config
      const configRes = await fetch('/api/admin/naje-ad-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) {
          const merged: NajeAdConfig = {
            enabled: data.config.enabled !== false,
            pointsRatePerSecond: typeof data.config.pointsRatePerSecond === 'number' ? data.config.pointsRatePerSecond : 2.5,
            durationOptionsSec: Array.isArray(data.config.durationOptionsSec) && data.config.durationOptionsSec.length > 0
              ? data.config.durationOptionsSec
              : [4, 6, 8, 10, 12, 14, 16, 24, 30],
            maxShotsPerVideo: data.config.maxShotsPerVideo || 4,
            defaultModelEndpointId: data.config.defaultModelEndpointId || 'video_standard'
          };
          setConfig(merged);
          setInitialConfig(merged);
        }
      }

      // Fetch Recent Jobs
      fetchJobs(token);
    } catch (err: any) {
      console.error('Failed to load Naje Ad admin settings:', err);
      toast.error('تعذر جلب إعدادات Naje Ad');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (authToken?: string) => {
    setLoadingJobs(true);
    try {
      const token = authToken || (await auth.currentUser?.getIdToken());
      if (!token) return;
      const res = await fetch('/api/admin/naje-ad-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      }
    } catch (e) {
      console.warn('Jobs fetch error:', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchConfigAndJobs();
  }, []);

  const hasChanges = useMemo(() => {
    if (!initialConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('يرجى تسجيل الدخول مجدداً');

      const res = await fetch('/api/admin/naje-ad-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ التعديلات');
      }

      setInitialConfig({ ...config });
      toast.success('تم حفظ وتطبيق إعدادات Naje Ad بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleDuration = (sec: number) => {
    const current = [...config.durationOptionsSec];
    if (current.includes(sec)) {
      if (current.length <= 1) {
        toast.error('يجب الإبقاء على خيار مدة واحد على الأقل');
        return;
      }
      setConfig({ ...config, durationOptionsSec: current.filter(s => s !== sec).sort((a, b) => a - b) });
    } else {
      setConfig({ ...config, durationOptionsSec: [...current, sec].sort((a, b) => a - b) });
    }
  };

  // Economic analysis
  const rate = config.pointsRatePerSecond || 2.5;
  const estimatedCostPerSecUSD = 0.05; // Google Veo ~ $0.05/sec
  const pointsValueUSD = POINT_USD_VALUE; // e.g. $0.005 to $0.01 per point
  const revenueUSDPerSec = rate * pointsValueUSD;
  const estimatedMarginPercent = revenueUSDPerSec > 0 
    ? Math.round(((revenueUSDPerSec - estimatedCostPerSecUSD) / revenueUSDPerSec) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-xl">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">جاري تحميل إعدادات وإحصائيات Naje Ad...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة محرك Naje Ad (Multi-Shot Video)</h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  config.enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}>
                  {config.enabled ? 'المحرك قيد العمل' : 'المحرك متوقف'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                التحكم بأسعار التوليد بالثانية، خيارات المدد الزمنية المتاحة للمستخدم، ونموذج التوليد الافتراضي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchJobs()}
              disabled={loadingJobs}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">تسعيرة الثانية</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
              {config.pointsRatePerSecond} نقطة / ث
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">المدد المتاحة</span>
            <span className="text-lg font-black text-gray-900 dark:text-white font-mono mt-0.5 block">
              {config.durationOptionsSec.length} خيارات
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">أقصى لقطات متتابعة</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
              {config.maxShotsPerVideo} لقطات
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">عمليات التوليد بالسجل</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {jobs.length} طلب
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Presets (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <span>إعدادات التسعير والتحكم بالمحرك</span>
            </h3>

            {/* Enable Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
              <div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">تفعيل ميزة Naje Ad للمستخدمين</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  عند التعطيل، تظهر رسالة إدارية للمستخدمين بأن الميزة تخضع للصيانة دون فقدان إعداداتهم.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enabled ? 'translate-x-[-1.25rem]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Points Rate per Second */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                معدل خصم النقاط لكل ثانية فيديو (Points / Sec):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="50"
                  value={config.pointsRatePerSecond}
                  onChange={(e) => setConfig({ ...config, pointsRatePerSecond: Math.max(0.1, parseFloat(e.target.value) || 2.5) })}
                  className="w-40 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white font-mono focus:border-indigo-500 outline-none transition"
                />
                <span className="text-xs text-gray-500">نقطة لكل ثانية واحدة من الفيديو المولد</span>
              </div>
            </div>

            {/* Default Model Endpoint */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                منفذ نموذج الفيديو الافتراضي (Model Endpoint):
              </label>
              <select
                value={config.defaultModelEndpointId}
                onChange={(e) => setConfig({ ...config, defaultModelEndpointId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Options Checkbox Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                المدد الزمنية المتاحة للاختيار في واجهة المستخدم (بالثواني):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVAILABLE_DURATION_PRESETS.map((sec) => {
                  const isChecked = config.durationOptionsSec.includes(sec);
                  const cost = Math.ceil(sec * config.pointsRatePerSecond);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => toggleDuration(sec)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <span className="text-xs">{sec} ثواني</span>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">{cost} نقطة</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Shots */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                أقصى عدد لقطات مسموح بدمجها للمشهد الواحد:
              </label>
              <input
                type="number"
                value={2}
                disabled
                className="w-32 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 font-mono outline-none cursor-not-allowed opacity-70"
              />
              <span className="text-[11px] text-gray-500 block mt-1">(مغلق مؤقتاً: النظام حالياً يدعم لقطتين 2-Shots كحد أقصى للحفاظ على استمرارية الشخصية)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Live Simulation & Margin Calculator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>محاكاة التكاليف والهامش الاقتصادي</span>
            </h3>

            {/* Table of Live Calculations */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                جدول التسعير المباشر بناءً على المعدل المختار ({config.pointsRatePerSecond} نقطة/ث):
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-xs text-right">
                  <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="p-2.5 font-bold">المدة</th>
                      <th className="p-2.5 font-bold">اللقطات</th>
                      <th className="p-2.5 font-bold">تكلفة النقاط</th>
                      <th className="p-2.5 font-bold">القيمة التقديرية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {config.durationOptionsSec.map((sec) => {
                      const costPts = Math.ceil(sec * config.pointsRatePerSecond);
                      const shotsCount = sec > 8 ? 2 : 1;
                      const approxUSD = (costPts * POINT_USD_VALUE).toFixed(2);
                      return (
                        <tr key={sec} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">{sec} ثواني</td>
                          <td className="p-2.5 text-gray-500">{shotsCount === 1 ? 'لقطة (1)' : 'لقطتان (2)'}</td>
                          <td className="p-2.5 font-black text-amber-500 font-mono">{costPts} نقطة</td>
                          <td className="p-2.5 text-gray-400 font-mono">~${approxUSD}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profit Margin Card */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">هامش الربح التقديري لكل ثانية:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  estimatedMarginPercent >= 30 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {estimatedMarginPercent}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                يتم احتساب الهامش بناءً على التكلفة الحقيقية لـ Google Veo (~$0.05/ثانية) مقارنة بسعر النقطة الافتراضي للجمهور.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Jobs Tracker */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-black text-gray-900 dark:text-white">أحدث عمليات التوليد عبر Naje Ad</h3>
          </div>
          <span className="text-xs text-gray-500">إجمالي السجلات: {jobs.length}</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Film className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-gray-500">لم يتم تسجيل أي عمليات توليد فيديو بعد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-bold">معرف الطلب (Job ID)</th>
                  <th className="pb-3 font-bold">المستخدم</th>
                  <th className="pb-3 font-bold">وصف المشهد</th>
                  <th className="pb-3 font-bold">المدة واللقطات</th>
                  <th className="pb-3 font-bold">النقاط</th>
                  <th className="pb-3 font-bold">الحالة</th>
                  <th className="pb-3 font-bold text-center">المعاينة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {jobs.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const isFailed = job.status === 'failed';
                  const mediaLink = job.mediaUrl || job.videoUrl || job.resultUrl;

                  return (
                    <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                      <td className="py-3 font-mono text-[11px] text-gray-500">{job.id.slice(0, 18)}...</td>
                      <td className="py-3 font-mono text-[11px] text-gray-700 dark:text-gray-300">{(job.ownerId || job.userId || '').slice(0, 8)}...</td>
                      <td className="py-3 max-w-xs truncate text-gray-900 dark:text-gray-200" title={job.prompt}>
                        {job.prompt || 'مشهد إعلاني'}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300 font-mono">
                        {job.totalDurationSec || 8}s ({job.shotsCount || 1} shots)
                      </td>
                      <td className="py-3 font-black text-amber-500 font-mono">
                        {job.consumedBalance || 20} نقطة
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 animate-pulse'
                        }`}>
                          {isCompleted ? 'مكتمل بنجاح' : isFailed ? 'فشل / مسترجع' : 'قيد المعالجة'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {mediaLink ? (
                          <a
                            href={mediaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition font-bold text-[10px]"
                          >
                            <Play className="w-3 h-3" />
                            <span>مشاهدة</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
