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
  Gift,
} from 'lucide-react';
import {
  VisaBadge,
  MastercardBadge,
  MadaBadge,
  AmexBadge,
  PayPalBadge,
} from '../components/PaymentBadges';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import NajeCreditIcon from '../components/NajeCreditIcon';

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
    accent: 'slate',
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
    accent: 'amber',
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
    accent: 'legend',
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
  const { t, locale, isRtl } = useI18n();
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const [packages, setPackages] = useState<StorePackage[]>(FALLBACK_PACKAGES);
  const [clientId, setClientId] = useState<string>('');
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [selectedId, setSelectedId] = useState<string>(
    highlightParam && (highlightParam === 'pkg_5' || highlightParam === 'pkg_10' || highlightParam === 'pkg_20') ? highlightParam : 'pkg_10'
  );
  const [sdkLoading, setSdkLoading] = useState<boolean>(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ points: number; newBalance: number } | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [redeemLoading, setRedeemLoading] = useState<boolean>(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string>(selectedId);

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    if (!user) {
      toast.error(t('shell.store.loginToPay'));
      return;
    }
    setRedeemLoading(true);
    setRedeemError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t('shell.store.loginToPay'));

      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('surface.store.badCode'));
      }

      if (typeof data.newBalance === 'number') {
        updateBalance(data.newBalance);
      }
      setSuccessInfo({ points: data.addedPoints, newBalance: data.newBalance });
      toast.success(t('shell.store.pointsAdded', { points: data.addedPoints }));
      setVoucherCode('');
    } catch (err: any) {
      setRedeemError(err.message || t('surface.store.redeemError'));
      toast.error(err.message || t('surface.store.redeemError'));
    } finally {
      setRedeemLoading(false);
    }
  };

  const getPackageDetails = (pkgId: string) => {
    if (pkgId === 'pkg_5') {
      return {
        name: t('store.sparkName'),
        tagline: t('store.sparkTagline'),
        iconType: 'sparkles' as const,
        accent: 'slate',
        badge: undefined,
        features: [
          t('store.sparkFeat1'),
          t('store.sparkFeat2'),
          t('store.sparkFeat3'),
          t('store.sparkFeat4'),
          t('store.sparkFeat5'),
        ],
      };
    }
    if (pkgId === 'pkg_10') {
      return {
        name: t('store.innovatorName'),
        tagline: t('store.innovatorTagline'),
        iconType: 'zap' as const,
        accent: 'amber',
        badge: t('store.mostPopularBadge'),
        features: [
          t('store.innovatorFeat1'),
          t('store.innovatorFeat2'),
          t('store.innovatorFeat3'),
          t('store.innovatorFeat4'),
          t('store.innovatorFeat5'),
        ],
      };
    }
    return {
      name: t('store.legendName'),
      tagline: t('store.legendTagline'),
      iconType: 'crown' as const,
      accent: 'legend',
      badge: t('store.ultimateBadge'),
      features: [
        t('store.legendFeat1'),
        t('store.legendFeat2'),
        t('store.legendFeat3'),
        t('store.legendFeat4'),
        t('store.legendFeat5'),
      ],
    };
  };

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

  // 2. Load PayPal JS SDK enforcing locale and US buyer country
  useEffect(() => {
    if (!clientId) return;
    const scriptId = 'naje-store-paypal-sdk';
    const targetLocale = locale === 'ar' ? 'ar_EG' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : locale === 'de' ? 'de_DE' : locale === 'pt' ? 'pt_PT' : 'en_US';
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
      setSdkError(t('shell.store.gatewayLoadFail'));
    };
    document.body.appendChild(script);
  }, [clientId, locale]);

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
                toast.error(t('shell.store.loginToPay'));
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
                  data.error || t('shell.store.createOrderFail')
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
                  result.error || t('shell.store.confirmPayError')
                );
                return;
              }
              if (typeof result.newBalance === 'number') updateBalance(result.newBalance);
              const pointsAdded =
                result.points_added ||
                packages.find((p) => p.id === selectedIdRef.current)?.points ||
                0;
              setSuccessInfo({ points: pointsAdded, newBalance: result.newBalance });
              toast.success(t('shell.store.pointsAdded', { points: pointsAdded }));
            } catch (err: any) {
              toast.error(
                err.message || t('shell.store.completeFail')
              );
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err: any) => {
            setIsProcessing(false);
            console.error('PayPal button error:', err);
            toast.error(t('shell.store.paypalFail'));
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
  }, [clientId, sdkLoading, selectedId, packages, updateBalance, locale]);

  const selectedPackage = packages.find((p) => p.id === selectedId);
  const selectedContent = getPackageDetails(selectedId);

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
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-6xl mx-auto w-full font-sans scrollbar-thin transition-all"
    >
      {/* Top Bar with Navigation and Language Switcher */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition"
        >
          <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? '' : 'rotate-180'}`} />
          <span>{t('common.back')}</span>
        </Link>

        {/* Global Multi-Language Selector */}
        <LanguageSelector />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('store.heroTitle')}
            </h1>
          </div>
          {mode === 'sandbox' && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {t('shell.store.sandbox')}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
          {t('store.heroSubtitle')}
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('store.balanceLabel')}:
            </span>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono flex items-center gap-1.5">
              <NajeCreditIcon className="w-4 h-4" />
              <span>{Number((user.balance || 0).toFixed(2))} {t('store.pointsUnit')}</span>
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
                {t('store.paymentSuccess')}
              </p>
              <p className="text-xs text-emerald-300">
                {t('shell.store.addedPoints', { points: successInfo.points })} — {t('shell.store.balanceNow', { balance: successInfo.newBalance })}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold px-4 py-2 rounded-xl transition whitespace-nowrap"
          >
            {t('shell.store.startCreating')}
          </Link>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {packages.map((pkg) => {
          const content = getPackageDetails(pkg.id);
          const isSelected = selectedId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedId(pkg.id)}
              className={`relative text-start p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col bg-white dark:bg-zinc-900 ${
                isSelected
                  ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {content.badge && (
                <span
                  className={`absolute -top-3 start-5 text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-800'
                  }`}
                >
                  {content.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  {renderIcon(content.iconType)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">{content.name}</h3>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{content.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <NajeCreditIcon className="w-6 h-6 shrink-0" />
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">{pkg.points}</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {t('store.pointsUnit')}
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-700 dark:text-amber-300 mb-5">
                ${pkg.usd.toFixed(2)} USD
              </div>

              <ul className="space-y-2.5 flex-1">
                {content.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-5 text-center text-xs font-bold py-2 rounded-xl transition ${
                  isSelected
                    ? 'bg-amber-400 text-black'
                    : 'bg-zinc-900 text-white dark:bg-zinc-800'
                }`}
              >
                {isSelected
                  ? t('shell.store.selectedNow')
                  : t('store.purchaseBtn')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Checkout panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-zinc-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                {t('shell.store.checkoutTitle')}
              </p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>{selectedContent?.name}</span>
                <span className="text-zinc-400">•</span>
                <span className="text-amber-700 dark:text-amber-300 font-mono font-black inline-flex items-center gap-1.5">
                  <NajeCreditIcon className="w-4 h-4 shrink-0" />
                  <span>{selectedPackage?.points} {t('store.pointsUnit')}</span>
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-amber-700 dark:text-amber-400 font-mono font-extrabold text-xl">
                  ${selectedPackage?.usd.toFixed(2)} USD
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('store.guaranteedSecurity')}</span>
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
                        {t('shell.store.cardsTitle')}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {t('shell.store.instantCard')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      {t('shell.store.cardsBody')}
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
                <strong className="text-white">{t('shell.store.bankProtectTitle')}</strong>{' '}
                {t('shell.store.bankProtectBody')}
              </p>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Payment Execution Section (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-naje-elevated border border-gray-800 rounded-2xl p-5 shadow-lg relative">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        {t('shell.store.gatewayTitle')}
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
                            {t('shell.store.loadingGateway')}
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
                            {t('common.retry')}
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
                            {t('shell.store.processingTopup')}
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
                            {t('shell.store.cardsConfigured')}
                          </p>
                          <p className="text-gray-300 text-xs">
                            <>
                              {t('shell.store.awaitingClient')}{' '}
                              <code className="text-amber-300 font-mono bg-black/50 px-1 py-0.5 rounded">
                                PAYPAL_CLIENT_ID
                              </code>{' '}
                              {t('shell.store.onServer')}
                            </>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {t('shell.store.acceptedCards')}
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
                        {t('shell.store.pci')}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {t('shell.store.neverStoreCard')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-naje-elevated border border-gray-800 rounded-2xl p-4 text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-gray-400 font-medium">
                    <span>{t('shell.store.receipt')}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                      <Zap className="w-3 h-3" />
                      {t('shell.store.instantDelivery')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{t('shell.store.selectedPackage')}</span>
                    <span className="font-bold text-white">{selectedContent?.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{t('shell.store.creativeBalance')}</span>
                    <span className="font-bold text-amber-400 font-mono inline-flex items-center gap-1.5">
                      <NajeCreditIcon className="w-4 h-4 shrink-0" />
                      <span>+{selectedPackage?.points} {t('store.pointsUnit')}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-300">
                    <span>{t('shell.store.fees')}</span>
                    <span className="text-emerald-400 font-bold">
                      {t('shell.store.feesIncluded')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-sm">
                    <span className="font-extrabold text-white">
                      {t('shell.store.totalDue')}
                    </span>
                    <span className="font-mono font-black text-lg text-amber-300">
                      ${selectedPackage?.usd.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Direct Voucher Redemption Card in Store */}
                <div className="bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-black border border-purple-500/25 rounded-2xl p-4 text-xs shadow-md">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-500/20 text-purple-300 font-bold">
                    <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{t('surface.store.voucherTitle')}</span>
                  </div>
                  <p className="text-[11px] text-gray-300 mb-3">
                    {t('surface.store.voucherBody')}
                  </p>
                  <form onSubmit={handleRedeemVoucher} className="space-y-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        if (redeemError) setRedeemError(null);
                      }}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      disabled={redeemLoading}
                      dir="ltr"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-xl px-3 py-2 text-xs font-mono text-center uppercase tracking-widest text-white placeholder-gray-500 outline-none transition disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={redeemLoading || !voucherCode.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      {redeemLoading ? (
                        <>
                          <NajeSpinner className="w-3.5 h-3.5 text-white" />
                          <span>{t('common.processing')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t('surface.store.redeemNow')}</span>
                        </>
                      )}
                    </button>
                    {redeemError && (
                      <p className="text-[11px] text-rose-400 text-center font-semibold mt-1">
                        {redeemError}
                      </p>
                    )}
                  </form>
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
          {t('shell.store.ssl')}
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          {t('shell.store.autoPoints')}
        </span>
        <span className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          {t('shell.store.agentAccess')}
        </span>
        <span className="flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
          {t('shell.store.adTools')}
        </span>
        <span className="flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5 text-rose-400" />
          {t('shell.store.cinematic30')}
        </span>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        {t('shell.store.haveCode')}
        <Link to="/settings" className="text-indigo-500 font-bold hover:text-indigo-400">
          {t('shell.store.redeemInSettings')}
        </Link>
      </p>
    </div>
  );
}
