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
import { useI18n } from '../../i18n';
import { POINT_USD_VALUE } from '../../lib/modelRegistry';

interface NajeAdConfig {
  enabled: boolean;
  pointsRatePerSecond: number;
  durationOptionsSec: number[];
  maxShotsPerVideo: number;
  defaultModelEndpointId: string;
  resolutionMultiplier?: { '360p'?: number; '720p'?: number; '1080p'?: number; '4k'?: number };
  editMultiplier?: number;
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
  omniModel?: string;
  error?: string;
}

const AVAILABLE_DURATION_PRESETS = [10, 20, 30, 40];

const MODEL_OPTIONS = [
  { id: 'video_omni', labelKey: 'tools.admin.adModelOmni', provider: 'Naje Video Pro' },
];

export const AdminNajeAd: React.FC = () => {
  const { t, isRtl } = useI18n();
  const [config, setConfig] = useState<NajeAdConfig>({
    enabled: true,
    pointsRatePerSecond: 2.5,
    durationOptionsSec: [10, 20, 30, 40],
    maxShotsPerVideo: 1,
    defaultModelEndpointId: 'video_omni',
    resolutionMultiplier: { '360p': 0.35, '720p': 1, '1080p': 1.5, '4k': 3 },
    editMultiplier: 0.5
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
              : [10, 20, 30, 40],
            maxShotsPerVideo: data.config.maxShotsPerVideo || 1,
            defaultModelEndpointId: data.config.defaultModelEndpointId || 'video_omni',
            resolutionMultiplier: data.config.resolutionMultiplier || { '360p': 0.35, '720p': 1, '1080p': 1.5, '4k': 3 },
            editMultiplier: typeof data.config.editMultiplier === 'number' ? data.config.editMultiplier : 0.5
          };
          setConfig(merged);
          setInitialConfig(merged);
        }
      }

      // Fetch Recent Jobs
      fetchJobs(token);
    } catch (err: any) {
      console.error('Failed to load Naje Ad admin settings:', err);
      toast.error(t('tools.admin.adLoadError'));
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
      if (!token) throw new Error(t('tools.admin.adRelogin'));

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
        throw new Error(data.error || t('tools.admin.adSaveFail'));
      }

      setInitialConfig({ ...config });
      toast.success(t('tools.admin.adSaveOk'));
    } catch (err: any) {
      toast.error(err.message || t('tools.admin.adSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleDuration = (sec: number) => {
    const current = [...config.durationOptionsSec];
    if (current.includes(sec)) {
      if (current.length <= 1) {
        toast.error(t('tools.admin.adNeedDuration'));
        return;
      }
      setConfig({ ...config, durationOptionsSec: current.filter(s => s !== sec).sort((a, b) => a - b) });
    } else {
      setConfig({ ...config, durationOptionsSec: [...current, sec].sort((a, b) => a - b) });
    }
  };

  // Economic analysis
  const rate = config.pointsRatePerSecond || 2.5;
  const estimatedCostPerSecUSD = 0.10; // Gemini Omni ~ $0.10/sec at 720p
  const pointsValueUSD = POINT_USD_VALUE; // e.g. $0.005 to $0.01 per point
  const revenueUSDPerSec = rate * pointsValueUSD;
  const estimatedMarginPercent = revenueUSDPerSec > 0 
    ? Math.round(((revenueUSDPerSec - estimatedCostPerSecUSD) / revenueUSDPerSec) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-xl">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('tools.admin.adLoading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.adTitle')}</h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  config.enabled 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}>
                  {config.enabled ? t('tools.admin.adEngineOn') : t('tools.admin.adEngineOff')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('tools.admin.adSubtitle')}
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
              <span>{t('tools.admin.pricingRefresh')}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? t('common.saving') : t('tools.admin.adSave')}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">{t('tools.admin.adRateLabelKpi')}</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
              {t('tools.admin.adPtsPerSec', { rate: config.pointsRatePerSecond })}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">{t('tools.admin.adDurationsKpi')}</span>
            <span className="text-lg font-black text-gray-900 dark:text-white font-mono mt-0.5 block">
              {t('tools.admin.adOptions', { count: config.durationOptionsSec.length })}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">{t('tools.admin.adEngineKpi')}</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
              Naje Video Pro
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200/60 dark:border-gray-800/60">
            <span className="text-[11px] font-bold text-gray-500 block">{t('tools.admin.adJobsKpi')}</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {t('tools.admin.adRequests', { count: jobs.length })}
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
              <span>{t('tools.admin.adSettingsTitle')}</span>
            </h3>

            {/* Enable Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
              <div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">{t('tools.admin.adEnableTitle')}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('tools.admin.adEnableDesc')}
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
                {t('tools.admin.adRateField')}
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
                <span className="text-xs text-gray-500">{t('tools.admin.adPointPerSecHint')}</span>
              </div>
            </div>

            {/* Default Model Endpoint */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('tools.admin.adEndpointLabel')}
              </label>
              <select
                value={config.defaultModelEndpointId}
                onChange={(e) => setConfig({ ...config, defaultModelEndpointId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {t(m.labelKey)} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Options Checkbox Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('tools.admin.adDurationsField')}
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
                      <span className="text-xs">{t('tools.admin.seconds', { count: sec })}</span>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5">{t('tools.admin.pointsN', { count: cost })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution multipliers */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('tools.admin.adResMultiplier')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['360p', '720p', '1080p', '4k'] as const).map((key) => (
                  <label key={key} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 text-center">
                    <span className="block text-[11px] font-bold text-gray-500 mb-1">{key}</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="10"
                      value={config.resolutionMultiplier?.[key] ?? (key === '360p' ? 0.35 : key === '1080p' ? 1.5 : key === '4k' ? 3 : 1)}
                      onChange={(e) => setConfig({
                        ...config,
                        resolutionMultiplier: {
                          ...(config.resolutionMultiplier || {}),
                          [key]: Math.max(0.1, parseFloat(e.target.value) || 1),
                        }
                      })}
                      className="w-full bg-transparent text-center text-sm font-black font-mono outline-none"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">{t('tools.admin.adResHint')}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Live Simulation & Margin Calculator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>{t('tools.admin.adMarginTitle')}</span>
            </h3>

            {/* Table of Live Calculations */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {t('tools.admin.adLiveTable', { rate: config.pointsRatePerSecond })}
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-xs text-start">
                  <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="p-2.5 font-bold">{t('common.duration')}</th>
                      <th className="p-2.5 font-bold">360p</th>
                      <th className="p-2.5 font-bold">720p</th>
                      <th className="p-2.5 font-bold">1080p</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {config.durationOptionsSec.map((sec) => {
                      const mul = config.resolutionMultiplier || { '360p': 0.35, '720p': 1, '1080p': 1.5, '4k': 3 };
                      const p720 = Math.ceil(sec * config.pointsRatePerSecond * (mul['720p'] || 1) * 1.1);
                      const p360 = Math.ceil(sec * config.pointsRatePerSecond * (mul['360p'] || 0.35));
                      const p1080 = Math.ceil(sec * config.pointsRatePerSecond * (mul['1080p'] || 1.5) * 1.1);
                      return (
                        <tr key={sec} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">{t('tools.admin.seconds', { count: sec })}</td>
                          <td className="p-2.5 font-mono text-gray-500">{p360}</td>
                          <td className="p-2.5 font-black text-amber-500 font-mono">{p720}</td>
                          <td className="p-2.5 font-mono text-gray-500">{p1080}</td>
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
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('tools.admin.adMarginPerSec')}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  estimatedMarginPercent >= 30 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {estimatedMarginPercent}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {t('tools.admin.adMarginNote')}
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
            <h3 className="text-base font-black text-gray-900 dark:text-white">{t('tools.admin.adJobsTitle')}</h3>
          </div>
          <span className="text-xs text-gray-500">{t('tools.admin.adTotalRecords', { count: jobs.length })}</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Film className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-gray-500">{t('tools.admin.adEmpty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-bold">{t('tools.admin.adColJob')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.colUser')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.adColScene')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.adColDurShots')}</th>
                  <th className="pb-3 font-bold">{t('common.points')}</th>
                  <th className="pb-3 font-bold">{t('common.status')}</th>
                  <th className="pb-3 font-bold text-center">{t('common.preview')}</th>
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
                        {job.prompt || t('tools.admin.adSceneFallback')}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300 font-mono">
                        {job.totalDurationSec || 10}s · Naje Video Pro
                      </td>
                      <td className="py-3 font-black text-amber-500 font-mono">
                        {t('tools.admin.pointsN', { count: job.consumedBalance || 20 })}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 animate-pulse'
                        }`}>
                          {isCompleted ? t('tools.admin.adStatusDone') : isFailed ? t('tools.admin.adStatusFail') : t('tools.admin.adStatusRun')}
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
                            <span>{t('tools.admin.adWatch')}</span>
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
