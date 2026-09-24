import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '../../lib/featureFlags';
import { ToggleLeft, ToggleRight, ShieldAlert, Power, CheckCircle, Save, Mic, Layers, FileText, Film } from 'lucide-react';
import { toast } from '../../toastStore';
import { useI18n } from '../../i18n';

export default function AdminFeatureFlags() {
  const { t } = useI18n();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'feature_flags'));
        if (snap.exists()) {
          setFlags({ ...DEFAULT_FEATURE_FLAGS, ...snap.data() });
        }
      } catch (err) {
        console.warn('Error fetching feature flags:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlags();
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'feature_flags'), {
        ...flags,
        updatedAt: Date.now()
      });

      // Audit Log
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          await fetch('/api/admin/log-audit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'update_feature_flags',
              details: flags
            })
          }).catch(() => {});
        }
      } catch (e) {}

      toast.success(t('tools.admin.flagsSaved'));
    } catch (err: any) {
      console.error('Error saving feature flags:', err);
      toast.error(t('tools.admin.flagsSaveError', { message: err.message }));
    } finally {
      setSaving(false);
    }
  };

  const featureItems: { key: keyof FeatureFlags; title: string; desc: string; icon: any }[] = [
    {
      key: 'voiceChatEnabled',
      title: t('tools.admin.flagVoiceTitle'),
      desc: t('tools.admin.flagVoiceDesc'),
      icon: Mic
    },
    {
      key: 'uiStudioEnabled',
      title: t('tools.admin.flagUiTitle'),
      desc: t('tools.admin.flagUiDesc'),
      icon: Layers
    },
    {
      key: 'pdfSlidesEnabled',
      title: t('tools.admin.flagSlidesTitle'),
      desc: t('tools.admin.flagSlidesDesc'),
      icon: FileText
    },
    {
      key: 'videoGenerationEnabled',
      title: t('tools.admin.flagVideoTitle'),
      desc: t('tools.admin.flagVideoDesc'),
      icon: Film
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black mb-2">
            <Power className="w-3.5 h-3.5" />
            <span>{t('tools.admin.flagsBadge')}</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {t('tools.admin.flagsTitle')}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {t('tools.admin.flagsDesc')}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? t('common.saving') : t('tools.admin.flagsSave')}</span>
        </button>
      </div>

      {/* Feature Flags Cards */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">{t('tools.admin.flagsLoading')}</div>
        ) : (
          featureItems.map((item) => {
            const isEnabled = flags[item.key];
            const Icon = item.icon;
            return (
              <div 
                key={item.key}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isEnabled
                    ? 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                    : 'bg-rose-950/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    isEnabled ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>{item.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                        isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isEnabled ? t('tools.admin.flagOn') : t('tools.admin.flagOff')}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-2xl">{item.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(item.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    isEnabled
                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isEnabled ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-rose-400" />
                      <span>{t('tools.admin.flagDisable')}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-emerald-400" />
                      <span>{t('tools.admin.flagEnable')}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
