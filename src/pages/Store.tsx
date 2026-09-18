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
  CreditCard,
  Lock,
  Globe,
  Info,
} from 'lucide-react';
import {
  VisaBadge,
  MastercardBadge,
  MadaBadge,
  AmexBadge,
  PayPalBadge,
} from '../components/PaymentBadges';

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
  name: { ar: string; en: string };
  tagline: { ar: string; en: string };
  iconType: 'sparkles' | 'zap' | 'crown';
  badge?: { ar: string; en: string };
  accent: string;
  features: { ar: string[]; en: string[] };
}

export const PACKAGE_CONTENT: Record<string, PackageContent> = {
  pkg_5: {
    name: { ar: 'الشرارة', en: 'The Spark' },
    tagline: { ar: 'أول خطوة نحو إبداعك الحقيقي', en: 'Your first step into real AI creativity' },
    iconType: 'sparkles',
    accent: 'from-gray-400/20 to-gray-200/10',
    features: {
      ar: [
        '50 نقطة تضاف فوراً لرصيدك',
        'وصول كامل إلى Creatively AI',
        'وصول إلى ناجي من مصادرك — دردشة مقيّدة بمصادرك',
        'توليد صور وفيديوهات بأحدث نماذج الذكاء الاصطناعي',
        'يكفي لعشرات التصاميم أو عدة مقاطع فيديو',
      ],
      en: [
        '50 points added instantly to your balance',
        'Full access to Creatively AI',
        'Access Naje Source — chat grounded only in your sources',
        'Generate images & videos with latest AI models',
        'Great for dozens of designs or video clips',
      ],
    },
  },
  pkg_10: {
    name: { ar: 'المُبتكر', en: 'The Innovator' },
    tagline: { ar: 'رصيد أكبر، وأدوات أذكى تشتغل لحسابك', en: 'More points, smarter autonomous agents' },
    iconType: 'zap',
    badge: { ar: 'الأكثر طلباً', en: 'Most Popular' },
    accent: 'from-amber-500/25 to-purple-600/15',
    features: {
      ar: [
        'كل مزايا باقة الشرارة',
        '100 نقطة لمشاريع متواصلة بلا توقف',
        'وصول كامل إلى Creatively AI',
        'وصول حصري إلى Naje AI Agent — وكيلك الذكي لتنفيذ المهام',
        'وصول إلى ناجي المطور — فحص أرشيف الموقع وكتابة بريف للوكيل',
      ],
      en: [
        'All features from The Spark package',
        '100 points for non-stop productivity',
        'Full access to Creatively AI suite',
        'Exclusive access to autonomous Naje AI Agent',
        'Access Naje Developer — ZIP audit and agent briefing',
      ],
    },
  },
  pkg_20: {
    name: { ar: 'الأسطورة', en: 'The Legend' },
    tagline: { ar: 'كل أدوات ناجي بين إيديك، بلا أي حدود', en: 'All Naje tools at your command, without limits' },
    iconType: 'crown',
    badge: { ar: 'القوة الكاملة', en: 'Ultimate Power' },
    accent: 'from-purple-600/30 to-amber-500/20',
    features: {
      ar: [
        'كل مزايا باقة المُبتكر',
        '200 نقطة لأقصى إنتاجية وأعلى أولوية',
        'وصول كامل لكل أدوات المنصة بدون استثناء',
        'وصول إلى Naje Ad — أداة صناعة الإعلانات الاحترافية',
        'توليد فيديوهات تصل حتى 30 ثانية بجودة سينمائية',
      ],
      en: [
        'All features from The Innovator package',
        '200 points for maximum speed & scale',
        'Full unrestricted access to all platform tools',
        'Full access to Naje Ad Studio for video ads',
        'Cinematic video generation up to 30 seconds',
      ],
    },
  },
};

const FALLBACK_PACKAGES: StorePackage[] = [
  { id: 'pkg_5', points: 50, usd: 5.0 },
  { id: 'pkg_10', points: 100, usd: 10.0 },
  { id: 'pkg_20', points: 200, usd: 20.0 },
];

export default function Store() {
  const { user, updateBalance } = useAppStore();
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
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

  // 2. Load PayPal JS SDK enforcing Arabic or English locale and US buyer country (preventing Hebrew default)
  useEffect(() => {
    if (!clientId) return;
    const scriptId = 'naje-store-paypal-sdk';
    const targetLocale = lang === 'en' ? 'en_US' : 'ar_EG';
    const desiredSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=USD&intent=capture&locale=${targetLocale}&buyer-country=US`;

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.getAttribute('data-locale') === targetLocale && window.paypal) {
        setSdkLoading(false);
        return;
      }
      existingScript.remove();
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
      }
    }

    setSdkLoading(true);
    const script = document.createElement('script');
    script.id = scriptId;
    script.setAttribute('data-locale', targetLocale);
    script.src = desiredSrc;
    script.async = true;
    script.onload = () => {
      setSdkLoading(false);
      setSdkError(null);
    };
    script.onerror = () => {
      setSdkLoading(false);
      setSdkError(
        lang === 'ar'
          ? 'تعذر تحميل بوابة الدفع. تحقق من اتصال الإنترنت وحاول مرة أخرى.'
          : 'Failed to load payment gateway. Please check your connection and try again.'
      );
    };
    document.body.appendChild(script);
  }, [clientId, lang]);

  // 3. Render the PayPal Buttons for the currently selected package
  useEffect(() => {
    if (!clientId || sdkLoading || !window.paypal || !buttonContainerRef.current) return;

    buttonContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 45 },
          createOrder: async () => {
            setSuccessInfo(null);
            try {
              const token = await auth.currentUser?.getIdToken();
              if (!token) {
                toast.error(
                  lang === 'ar'
                    ? 'يجب تسجيل الدخول أولاً لإتمام عملية الدفع'
                    : 'Please log in first to complete payment'
                );
                throw new Error('User not authenticated');
              }
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ package_id: selectedIdRef.current }),
              });
              const data = await res.json();
              if (!res.ok || !data.order_id) {
                toast.error(
                  data.error ||
                    (lang === 'ar'
                      ? 'فشل في إنشاء طلب الدفع عبر PayPal'
                      : 'Failed to create PayPal payment order')
                );
                throw new Error(data.error || 'create_order_failed');
              }
              return data.order_id;
            } catch (err: any) {
              throw err;
            }
          },
          onApprove: async (data: any) => {
            setIsProcessing(true);
            try {
              const token = await auth.currentUser?.getIdToken();
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ order_id: data.orderID }),
              });
              const result = await res.json();
              if (!res.ok) {
                toast.error(
                  result.error ||
                    (lang === 'ar'
                      ? 'حدث خطأ أثناء تأكيد عملية الدفع'
                      : 'An error occurred while confirming payment')
                );
                return;
              }
              if (typeof result.newBalance === 'number') updateBalance(result.newBalance);
              const pointsAdded =
                result.points_added ||
                packages.find((p) => p.id === selectedIdRef.current)?.points ||
                0;
              setSuccessInfo({ points: pointsAdded, newBalance: result.newBalance });
              toast.success(
                lang === 'ar'
                  ? `تم شحن ${pointsAdded} نقطة إلى رصيدك بنجاح!`
                  : `Successfully added ${pointsAdded} points to your balance!`
              );
            } catch (err: any) {
              toast.error(
                err.message ||
                  (lang === 'ar' ? 'فشل في إتمام عملية الشحن' : 'Payment completion failed')
              );
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err: any) => {
            setIsProcessing(false);
            console.error('PayPal button error:', err);
            toast.error(
              lang === 'ar'
                ? 'تعذرت عملية الدفع عبر PayPal أو البطاقة. يرجى التحقق من البيانات والمحاولة مرة أخرى.'
                : 'Payment via PayPal or card was unsuccessful. Please check card info and try again.'
            );
          },
          onCancel: () => {
            setIsProcessing(false);
          },
        })
        .render(buttonContainerRef.current)
        .catch((err: any) => console.error('Failed to render PayPal Buttons:', err));
    } catch (err) {
      console.error('PayPal Buttons initialization error:', err);
    }
  }, [clientId, sdkLoading, selectedId, packages, updateBalance, lang]);

  const selectedPackage = packages.find((p) => p.id === selectedId);
  const selectedContent = PACKAGE_CONTENT[selectedId];

  const renderIcon = (type: 'sparkles' | 'zap' | 'crown') => {
    switch (type) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-6xl mx-auto w-full font-sans scrollbar-thin transition-all"
    >
      {/* Top Bar with Navigation and Language Switcher */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition"
        >
          <ArrowRight className={`w-3.5 h-3.5 ${lang === 'en' ? 'rotate-180' : ''}`} />
          <span>{lang === 'ar' ? 'العودة للإعدادات' : 'Back to Settings'}</span>
        </Link>

        {/* Bilingual Selector (Arabic & English) */}
        <div className="flex items-center gap-2 bg-[#12141a] border border-gray-800 rounded-xl p-1 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'ar'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              lang === 'en'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {lang === 'ar' ? 'متجر شحن رصيد ناجي' : 'Naje AI Points Store'}
            </h1>
          </div>
          {mode === 'sandbox' && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {lang === 'ar' ? 'وضع تجريبي (Sandbox)' : 'Sandbox Mode'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
          {lang === 'ar'
            ? 'اشحن رصيدك فوراً للوصول الكامل إلى جميع أدوات وتوليدات الذكاء الاصطناعي وصناعة الإعلانات.'
            : 'Top up your points balance instantly for full access to all AI tools, autonomous agents, and video ads.'}
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {lang === 'ar' ? 'رصيدك الحالي:' : 'Current Balance:'}
            </span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
              {Number((user.balance || 0).toFixed(2))} {lang === 'ar' ? 'نقطة' : 'pts'}
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
              <p className="text-sm font-bold text-white">
                {lang === 'ar' ? 'تم شحن رصيدك بنجاح!' : 'Points Added Successfully!'}
              </p>
              <p className="text-xs text-emerald-300">
                {lang === 'ar' ? (
                  <>
                    أضيفت <span className="font-extrabold text-white">{successInfo.points} نقطة</span> — رصيدك الآن{' '}
                    <span className="font-mono font-bold text-white">{successInfo.newBalance}</span> نقطة
                  </>
                ) : (
                  <>
                    Added <span className="font-extrabold text-white">{successInfo.points} points</span> — Your balance is now{' '}
                    <span className="font-mono font-bold text-white">{successInfo.newBalance}</span> pts
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold px-4 py-2 rounded-xl transition whitespace-nowrap"
          >
            {lang === 'ar' ? 'ابدأ الإبداع الآن' : 'Start Creating Now'}
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
              className={`relative ${
                lang === 'ar' ? 'text-right' : 'text-left'
              } p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col bg-gradient-to-b ${
                content.accent
              } ${
                isSelected
                  ? 'border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/50 bg-[#0b0c10]'
                  : 'border-gray-800 bg-[#0e1014] hover:border-gray-700'
              }`}
            >
              {content.badge && (
                <span
                  className={`absolute -top-3 ${
                    lang === 'ar' ? 'right-5' : 'left-5'
                  } text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {content.badge[lang]}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-amber-400">
                  {renderIcon(content.iconType)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{content.name[lang]}</h3>
                  <p className="text-[11px] text-gray-400">{content.tagline[lang]}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-white font-mono">{pkg.points}</span>
                <span className="text-xs font-semibold text-amber-400">
                  {lang === 'ar' ? 'نقطة إبداع' : 'Creative Points'}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-300 mb-5">
                ${pkg.usd.toFixed(2)} USD
              </div>

              <ul className="space-y-2.5 flex-1">
                {content.features[lang].map((feature, i) => (
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
                {isSelected
                  ? lang === 'ar'
                    ? 'مُختارة الآن'
                    : 'Currently Selected'
                  : lang === 'ar'
                  ? 'اختر هذه الباقة'
                  : 'Choose This Package'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Checkout panel */}
      <div className="bg-[#0b0c10] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-800">
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {lang === 'ar' ? 'إتمام الشراء للباقة المحددة' : 'Checkout for Selected Package'}
              </p>
              <p className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{selectedContent?.name[lang]}</span>
                <span className="text-gray-500">•</span>
                <span className="text-amber-300 font-mono font-black">
                  {selectedPackage?.points} {lang === 'ar' ? 'نقطة' : 'pts'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-amber-400 font-mono font-extrabold text-xl">
                  ${selectedPackage?.usd.toFixed(2)} USD
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'دفع مؤمّن ومشفر 100%' : '100% Secure & Encrypted'}</span>
              </div>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-1">
                <VisaBadge size="sm" />
                <MastercardBadge size="sm" />
                <PayPalBadge size="sm" />
                <MadaBadge size="sm" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Card & Payment Network Notice Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-[#131722] to-slate-900/90 border border-amber-400/20 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-inner">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-white">
                        {lang === 'ar'
                          ? 'بطاقات الائتمان والدفع المباشر (Credit & Debit Cards)'
                          : 'Credit & Debit Cards (Visa • Mastercard • Mada • Amex)'}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {lang === 'ar'
                          ? 'دفع فوري بدون الحاجة لحساب PayPal'
                          : 'Instant Direct Card Checkout'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      {lang === 'ar'
                        ? 'تدعم البوابة الدفع المباشر بجميع بطاقات الائتمان والسحب البنكي (Visa • Mastercard • مدى • Amex) دون الحاجة لامتلاك أو فتح حساب، كما يمكنك الدفع مباشرة برصيد حساب PayPal.'
                        : 'Supports all major credit & debit cards worldwide without requiring a PayPal account, or you can pay with your existing PayPal balance.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                  <VisaBadge size="sm" />
                  <MastercardBadge size="sm" />
                  <PayPalBadge size="sm" />
                  <MadaBadge size="sm" />
                  <AmexBadge size="sm" />
                </div>
              </div>
            </div>

            {/* Why PayPal opens a secure checkout page/modal */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/25 flex items-start gap-2.5 text-xs text-indigo-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {lang === 'ar' ? (
                  <>
                    <strong className="text-white">حماية بنكية عالمية:</strong> عند الضغط على زر الدفع، تفتح بوابة PayPal نافذة مشفرة لمعالجة بيانات بطاقتك مباشرة على خوادم بنكية آمنة معتمدة (PCI-DSS). لا يتم تخزين أرقام بطاقتك على خوادمنا نهائياً، وتضاف النقاط فوراً لحسابك.
                  </>
                ) : (
                  <>
                    <strong className="text-white">Global Bank Protection:</strong> Clicking the payment button opens an encrypted PayPal gateway window to handle your card details directly on certified banking servers (PCI-DSS). Your card details are never stored on our servers, and points are credited instantly.
                  </>
                )}
              </p>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Payment Execution Section (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#0e1118] border border-gray-800 rounded-2xl p-5 shadow-lg relative">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        {lang === 'ar' ? 'بوابة الدفع والمعالجة المباشرة' : 'Direct Payment Gateway'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Protected
                    </span>
                  </div>

                  {/* PayPal SDK rendering area */}
                  {clientId ? (
                    <div>
                      {sdkLoading && (
                        <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-xs text-gray-400">
                          <NajeSpinner className="w-6 h-6 text-amber-400" />
                          <span>
                            {lang === 'ar'
                              ? 'جاري تحميل بوابة الدفع الآمنة وشارات البطاقات...'
                              : 'Loading secure payment gateway...'}
                          </span>
                        </div>
                      )}
                      {sdkError && (
                        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{sdkError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="text-[11px] underline text-rose-400 hover:text-white cursor-pointer"
                          >
                            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                          </button>
                        </div>
                      )}
                      <div
                        ref={buttonContainerRef}
                        className={`min-h-[50px] w-full transition-opacity duration-200 ${
                          isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'
                        }`}
                      />
                      {isProcessing && (
                        <div className="mt-3 text-xs text-amber-300 flex items-center justify-center gap-2 animate-pulse bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>
                            {lang === 'ar'
                              ? 'جاري معالجة الشحن وإيداع النقاط في حسابك...'
                              : 'Processing transaction and crediting points...'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-purple-900/10 to-black border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-300 text-sm mb-1">
                            {lang === 'ar'
                              ? 'خدمة الدفع ببطاقات الائتمان والسحب مفعلة برمجياً'
                              : 'Credit & Debit Card Checkout Configured'}
                          </p>
                          <p className="text-gray-300 text-xs">
                            {lang === 'ar' ? (
                              <>
                                بوابة PayPal وبطاقات Visa و Mastercard جاهزة. بانتظار تعيين{' '}
                                <code className="text-amber-300 font-mono bg-black/50 px-1 py-0.5 rounded">
                                  PAYPAL_CLIENT_ID
                                </code>{' '}
                                في خادم التطبيق.
                              </>
                            ) : (
                              <>
                                PayPal and card processing are ready. Awaiting{' '}
                                <code className="text-amber-300 font-mono bg-black/50 px-1 py-0.5 rounded">
                                  PAYPAL_CLIENT_ID
                                </code>{' '}
                                environment configuration.
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {lang === 'ar' ? 'البطاقات المعتمدة فور التفعيل:' : 'Accepted cards:'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <VisaBadge size="sm" />
                          <MastercardBadge size="sm" />
                          <PayPalBadge size="sm" />
                          <MadaBadge size="sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security badges footer */}
                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ar'
                          ? 'معتمد ومحمي بمعايير PCI-DSS المصرفية'
                          : 'Certified PCI-DSS Compliant'}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {lang === 'ar'
                        ? 'لا يتم تخزين بيانات بطاقتك أبداً'
                        : 'Card info is never stored'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#0e1118] border border-gray-800 rounded-2xl p-4 text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-gray-400 font-medium">
                    <span>{lang === 'ar' ? 'ملخص الفاتورة الفورية' : 'Order Receipt'}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                      <Zap className="w-3 h-3" />
                      {lang === 'ar' ? 'تسليم فوري لحظي' : 'Instant Delivery'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{lang === 'ar' ? 'الباقة المختارة:' : 'Selected Package:'}</span>
                    <span className="font-bold text-white">{selectedContent?.name[lang]}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{lang === 'ar' ? 'الرصيد الإبداعي:' : 'Creative Points:'}</span>
                    <span className="font-bold text-amber-400 font-mono">
                      +{selectedPackage?.points} {lang === 'ar' ? 'نقطة إبداع' : 'points'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{lang === 'ar' ? 'الضرائب ورسوم المعالجة:' : 'Taxes & Gateway Fees:'}</span>
                    <span className="text-emerald-400 font-bold">
                      {lang === 'ar' ? '$0.00 (شاملة)' : '$0.00 (Included)'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-sm">
                    <span className="font-extrabold text-white">
                      {lang === 'ar' ? 'المبلغ الإجمالي للدفع:' : 'Total Amount Due:'}
                    </span>
                    <span className="font-mono font-black text-lg text-amber-300">
                      ${selectedPackage?.usd.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {lang === 'ar' ? 'دفع مشفّر بالكامل 256-bit' : 'Full 256-bit SSL Encryption'}
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          {lang === 'ar'
            ? 'النقاط تُضاف تلقائياً فور تأكيد الدفع'
            : 'Instant Automatic Balance Top-up'}
        </span>
        <span className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          {lang === 'ar' ? 'وصول فوري للوكيل الذكي' : 'Full Naje AI Agent Access'}
        </span>
        <span className="flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
          {lang === 'ar' ? 'أدوات إعلانية متقدمة' : 'Advanced Video Ad Studio'}
        </span>
        <span className="flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5 text-rose-400" />
          {lang === 'ar' ? 'فيديو سينمائي حتى 30 ثانية' : 'Up to 30s Cinematic Videos'}
        </span>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        {lang === 'ar' ? 'عندك كود شحن مسبق الدفع؟ ' : 'Have a prepaid activation code? '}
        <Link to="/settings" className="text-indigo-500 font-bold hover:text-indigo-400">
          {lang === 'ar' ? 'استخدمه من صفحة الإعدادات' : 'Redeem it in Settings'}
        </Link>
      </p>
    </div>
  );
}
