import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '../../lib/featureFlags';
import { ToggleLeft, ToggleRight, ShieldAlert, Power, CheckCircle, Save, Mic, Layers, FileText, Film } from 'lucide-react';
import { toast } from '../../toastStore';

export default function AdminFeatureFlags() {
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

      toast.success('تم حفظ مفاتيح التحكم بالميزات بنجاح!');
    } catch (err: any) {
      console.error('Error saving feature flags:', err);
      toast.error('حدث خطأ أثناء حفظ مفاتيح الميزات: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const featureItems: { key: keyof FeatureFlags; title: string; desc: string; icon: any }[] = [
    {
      key: 'voiceChatEnabled',
      title: 'المحادثات الصوتية والوضع المباشر',
      desc: 'التحكم بإتاحة أزرار التسجيل الصوتي وتوليد الردود الصوتية المباشرة للمستخدمين.',
      icon: Mic
    },
    {
      key: 'uiStudioEnabled',
      title: 'استوديو توليد ومعاينة الواجهات UI Studio',
      desc: 'إمكانية بناء وتوليد الواجهات البرمجية وتفاعلاتها المباشرة بالـ Canvas.',
      icon: Layers
    },
    {
      key: 'pdfSlidesEnabled',
      title: 'توليد العروض التقديمية وملفات PPTX/PDF',
      desc: 'التحكم بأداة تحويل الأفكار إلى شرائح وعروض تقديمية واحترافية.',
      icon: FileText
    },
    {
      key: 'videoGenerationEnabled',
      title: 'توليد المقاطع السينمائية والفيديو',
      desc: 'التحكم بمحرك تحويل النصوص والصور إلى مقاطع فيديو متكاملة.',
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
            <span>مفاتيح الإيقاف والتشغيل الفوري (Feature Kill Switches)</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            مفاتيح التحكم بميزات المنصة
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            تمكّنك هذه القواطع من إيقاف أي ميزة رئيسية فوراً في البيئة الحية عند الصيانة أو تحديث الخوادم دون الحاجة إلى إعادة رفع الكود.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ مفاتيح الميزات'}</span>
        </button>
      </div>

      {/* Feature Flags Cards */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">جاري تحميل إعدادات الميزات...</div>
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
                        {isEnabled ? 'مُفعّلة ونشطة' : 'متوقفة للصيانة'}
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
                      <span>إيقاف الميزة</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-emerald-400" />
                      <span>تفعيل الميزة</span>
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
