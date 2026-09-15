import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Crown,
  Check,
  Bot,
  Megaphone,
  Clapperboard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

declare global {
  interface Window {
    paypal?: any;
  }
}

export interface StorePackage {
  id: string;
  points: number;
  usd: number;
}

export interface PackageContent {
  name: string;
  tagline: string;
  icon: React.ReactNode;
  badge?: string;
  accent: string; // tailwind gradient classes
  features: string[];
}

// Marketing content keyed by backend package id — the price/points always
// come from the server (/api/paypal/config), this only supplies the copy.
export const PACKAGE_CONTENT: Record<string, PackageContent> = {
  pkg_5: {
    name: 'الشرارة',
    tagline: 'أول خطوة نحو إبداعك الحقيقي',
    icon: <Sparkles className="w-6 h-6" />,
    accent: 'from-gray-400/20 to-gray-200/10',
    features: [
      'رصيد يضاف فوراً لحسابك',
      'وصول كامل إلى Creatively AI',
      'توليد صور وفيديوهات بأحدث نماذج الذكاء الاصطناعي',
      'يكفي لعشرات التصاميم أو عدة مقاطع فيديو',
    ],
  },
  pkg_10: {
    name: 'المُبتكر',
    tagline: 'رصيد أكبر، وأدوات أذكى تشتغل لحسابك',
    icon: <Zap className="w-6 h-6" />,
    badge: 'الأكثر طلباً',
    accent: 'from-amber-500/25 to-purple-600/15',
    features: [
      'كل مزايا باقة الشرارة',
      'ضعف رصيد النقاط لمشاريع أكبر بلا توقف',
      'وصول كامل إلى Creatively AI',
      'وصول حصري إلى Naje AI Agent — وكيلك الذكي الذي ينفّذ المهام نيابة عنك',
    ],
  },
  pkg_20: {
    name: 'الأسطورة',
    tagline: 'كل أدوات ناجي بين إيديك، بلا أي حدود',
    icon: <Crown className="w-6 h-6" />,
    badge: 'القوة الكاملة',
    accent: 'from-purple-600/30 to-amber-500/20',
    features: [
      'كل مزايا باقة المُبتكر',
      'أكبر رصيد نقاط متاح لأقصى إنتاجية',
      'وصول كامل لكل أدوات المنصة بدون استثناء',
      'وصول إلى Naje Ad — أداة صناعة الإعلانات الاحترافية',
      'توليد فيديوهات تصل حتى 30 ثانية بجودة سينمائية',
    ],
  },
};

// Safe fallback if the config endpoint is slow/unavailable, so the page
// never renders empty. Real price always comes from the server once loaded.
const FALLBACK_PACKAGES: StorePackage[] = [
  { id: 'pkg_5', points: 50, usd: 5.0 },
  { id: 'pkg_10', points: 100, usd: 10.0 },
  { id: 'pkg_20', points: 200, usd: 20.0 },
];

export default function Store() {
  const { user, updateBalance } = useAppStore();
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const [packages, setPackages] = useState<StorePackage[]>(FALLBACK_PACKAGES);
  const [clientId, setClientId] = useState<string>('');
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [selectedId, setSelectedId] = useState<string>(
    highlightParam && PACKAGE_CONTENT[highlightParam] ? highlightParam : 'pkg_10'
  );
  const [sdkLoading, setSdkLoading] = useState<boolean>(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ points: number; newBalance: number } | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string>(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // 1. Load real config (client id + live packages/prices) from the server
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/paypal/config');
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.clientId) setClientId(data.clientId);
          if (data.mode) setMode(data.mode);
          if (Array.isArray(data.packages) && data.packages.length > 0) {
            setPackages(data.packages);
          }
        }
      } catch (err) {
        console.warn('Failed to load PayPal config:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load PayPal JS SDK once we have a client id
  useEffect(() => {
    if (!clientId) return;
    const scriptId = 'naje-store-paypal-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      setSdkLoading(true);
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = () => {
        setSdkLoading(false);
        setSdkError(null);
      };
      script.onerror = () => {
        setSdkLoading(false);
        setSdkError('تعذر تحميل بوابة الدفع. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      setSdkLoading(false);
    }
  }, [clientId]);

  // 3. Render the PayPal Buttons for the currently selected package
  useEffect(() => {
    if (!clientId || sdkLoading || !window.paypal || !buttonContainerRef.current) return;

    buttonContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 45 },
          createOrder: async () => {
            setIsProcessing(true);
            setSuccessInfo(null);
            try {
              const token = await auth.currentUser?.getIdToken();
              if (!token) {
                toast.error('يجب تسجيل الدخول أولاً لإتمام عملية الدفع');
                setIsProcessing(false);
                throw new Error('User not authenticated');
              }
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ package_id: selectedIdRef.current }),
              });
              const data = await res.json();
              if (!res.ok || !data.order_id) {
                toast.error(data.error || 'فشل في إنشاء طلب الدفع عبر PayPal');
                setIsProcessing(false);
                throw new Error(data.error || 'create_order_failed');
              }
              return data.order_id;
            } catch (err: any) {
              setIsProcessing(false);
              throw err;
            }
          },
          onApprove: async (data: any) => {
            try {
              const token = await auth.currentUser?.getIdToken();
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ order_id: data.orderID }),
              });
              const result = await res.json();
              setIsProcessing(false);
              if (!res.ok) {
                toast.error(result.error || 'حدث خطأ أثناء تأكيد عملية الدفع');
                return;
              }
              if (typeof result.newBalance === 'number') updateBalance(result.newBalance);
              const pointsAdded =
                result.points_added || packages.find((p) => p.id === selectedIdRef.current)?.points || 0;
              setSuccessInfo({ points: pointsAdded, newBalance: result.newBalance });
              toast.success(`تم شحن ${pointsAdded} نقطة إلى رصيدك بنجاح!`);
            } catch (err: any) {
              setIsProcessing(false);
              toast.error(err.message || 'فشل في إتمام عملية الشحن');
            }
          },
          onError: () => {
            setIsProcessing(false);
            toast.error('تعذرت عملية الدفع عبر PayPal. حاول مرة أخرى.');
          },
          onCancel: () => setIsProcessing(false),
        })
        .render(buttonContainerRef.current)
        .catch((err: any) => console.error('Failed to render PayPal Buttons:', err));
    } catch (err) {
      console.error('PayPal Buttons initialization error:', err);
    }
  }, [clientId, sdkLoading, selectedId, packages, updateBalance]);

  const selectedPackage = packages.find((p) => p.id === selectedId);
  const selectedContent = PACKAGE_CONTENT[selectedId];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-6xl mx-auto w-full font-sans scrollbar-thin">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition mb-4"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للإعدادات</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            متجر نقاط ناجي
          </h1>
          {mode === 'sandbox' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              وضع تجريبي
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
          كل فكرة عندك تستاهل تنولد بأفضل نسخة منها. اختر الباقة يلي تناسب طموحك، والنقاط تضاف لحسابك خلال ثوانٍ.
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">رصيدك الحالي:</span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white">
              {Number((user.balance || 0).toFixed(2))} نقطة
            </span>
          </div>
        )}
      </div>

      {/* Success banner */}
      {successInfo && (
        <div className="mb-8 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">تم شحن رصيدك بنجاح!</p>
              <p className="text-xs text-emerald-300">
                أضيفت <span className="font-extrabold text-white">{successInfo.points} نقطة</span> — رصيدك الآن{' '}
                <span className="font-mono font-bold text-white">{successInfo.newBalance}</span> نقطة
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold px-4 py-2 rounded-xl transition whitespace-nowrap"
          >
            ابدأ الإبداع الآن
          </Link>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {packages.map((pkg) => {
          const content = PACKAGE_CONTENT[pkg.id];
          if (!content) return null;
          const isSelected = selectedId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedId(pkg.id)}
              className={`relative text-right p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col bg-gradient-to-b ${content.accent} ${
                isSelected
                  ? 'border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/50 bg-[#0b0c10]'
                  : 'border-gray-800 bg-[#0e1014] hover:border-gray-700'
              }`}
            >
              {content.badge && (
                <span
                  className={`absolute -top-3 right-5 text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {content.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-amber-400">
                  {content.icon}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{content.name}</h3>
                  <p className="text-[11px] text-gray-400">{content.tagline}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-white">{pkg.points}</span>
                <span className="text-xs font-semibold text-amber-400">نقطة إبداع</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-300 mb-5">${pkg.usd.toFixed(2)}</div>

              <ul className="space-y-2.5 flex-1">
                {content.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-5 text-center text-xs font-bold py-2 rounded-xl transition ${
                  isSelected
                    ? 'bg-amber-400 text-black'
                    : 'bg-gray-900 text-gray-300 border border-gray-800'
                }`}
              >
                {isSelected ? 'مُختارة الآن' : 'اختر هذه الباقة'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Checkout panel */}
      <div className="bg-[#0b0c10] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-gray-800">
            <div>
              <p className="text-xs text-gray-400 mb-1">إتمام الشراء لباقة</p>
              <p className="text-base font-bold text-white">
                {selectedContent?.name} — {selectedPackage?.points} نقطة مقابل{' '}
                <span className="text-amber-400 font-mono">${selectedPackage?.usd.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
              <span>دفع مؤمّن عبر PayPal</span>
            </div>
          </div>

          {clientId ? (
            <div>
              {sdkLoading && (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                  <NajeSpinner className="w-5 h-5 text-amber-400" />
                  <span>جاري تحميل بوابة الدفع الآمنة...</span>
                </div>
              )}
              {sdkError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{sdkError}</span>
                </div>
              )}
              <div
                ref={buttonContainerRef}
                className={`min-h-[45px] max-w-md transition-opacity duration-200 ${
                  isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'
                }`}
              />
              {isProcessing && (
                <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري معالجة الشحن...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-400">جاري تجهيز بوابة الدفع، يرجى الانتظار...</p>
            </div>
          )}
        </div>
      </div>

      {/* Trust strip */}
      <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />دفع مشفّر بالكامل</span>
        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" />النقاط تُضاف تلقائياً فور تأكيد الدفع</span>
        <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-purple-400" />وصول فوري لأدوات الوكيل الذكي</span>
        <span className="flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5 text-indigo-400" />أدوات إعلانية احترافية</span>
        <span className="flex items-center gap-1.5"><Clapperboard className="w-3.5 h-3.5 text-rose-400" />فيديو حتى 30 ثانية بأعلى جودة</span>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        عندك كود شحن جاهز؟{' '}
        <Link to="/settings" className="text-indigo-500 font-bold hover:text-indigo-400">
          استخدمه من صفحة الإعدادات
        </Link>
      </p>
    </div>
  );
}
