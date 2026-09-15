import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import { ShieldCheck, Sparkles, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { NajeSpinner } from './NajeSpinner';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalPackage {
  id: string;
  points: number;
  usd: number;
  badge?: string;
}

const DEFAULT_PACKAGES: PayPalPackage[] = [
  { id: 'pkg_10', points: 10, usd: 2.0, badge: 'انطلاقة' },
  { id: 'pkg_50', points: 50, usd: 8.0, badge: 'الأكثر طلباً' },
  { id: 'pkg_120', points: 120, usd: 15.0, badge: 'أفضل قيمة' },
];

export const PayPalRechargeSection: React.FC = () => {
  const { updateBalance } = useAppStore();
  const [packages, setPackages] = useState<PayPalPackage[]>(DEFAULT_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState<string>('pkg_50');
  const [clientId, setClientId] = useState<string>('');
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [sdkLoading, setSdkLoading] = useState<boolean>(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<{ points: number; newBalance: number } | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const selectedPackageRef = useRef<string>(selectedPackage);

  // Keep ref synchronized for PayPal callbacks
  useEffect(() => {
    selectedPackageRef.current = selectedPackage;
  }, [selectedPackage]);

  // 1. Fetch PayPal public configuration (Client ID & Packages)
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/paypal/config');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.clientId) {
              setClientId(data.clientId);
            }
            if (data.mode) {
              setMode(data.mode);
            }
            if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
              const mapped: PayPalPackage[] = data.packages.map((p: any) => ({
                id: p.id,
                points: p.points,
                usd: p.usd,
                badge: p.id === 'pkg_50' ? 'الأكثر طلباً' : p.id === 'pkg_120' ? 'أفضل قيمة' : undefined,
              }));
              setPackages(mapped);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load PayPal config:', err);
      } finally {
        if (isMounted) setSdkLoading(false);
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load PayPal JS SDK dynamically once Client ID is retrieved
  useEffect(() => {
    if (!clientId) return;

    const scriptId = 'naje-paypal-sdk-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const onScriptLoaded = () => {
      setSdkLoading(false);
      setSdkError(null);
    };

    if (!script) {
      setSdkLoading(true);
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
      script.async = true;
      script.onload = onScriptLoaded;
      script.onerror = () => {
        setSdkLoading(false);
        setSdkError('تعذر تحميل واجهة PayPal. يرجى التحقق من اتصال الإنترنت أو إعدادات الحساب.');
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      setSdkLoading(false);
    }
  }, [clientId]);

  // 3. Render PayPal Buttons when SDK and container are ready
  useEffect(() => {
    if (!clientId || sdkLoading || !window.paypal) return;
    if (!buttonContainerRef.current) return;

    // Clear previous button DOM nodes
    buttonContainerRef.current.innerHTML = '';

    try {
      window.paypal
        .Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 44,
          },
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
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ package_id: selectedPackageRef.current }),
              });

              const data = await res.json();
              if (!res.ok || !data.order_id) {
                const errMsg = data.error || 'فشل في إنشاء طلب الدفع عبر PayPal';
                toast.error(errMsg);
                setIsProcessing(false);
                throw new Error(errMsg);
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
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ order_id: data.orderID }),
              });

              const result = await res.json();
              setIsProcessing(false);

              if (!res.ok) {
                toast.error(result.error || 'حدث خطأ أثناء تأكيد عملية الدفع');
                return;
              }

              // Update user balance globally across the application
              if (typeof result.newBalance === 'number') {
                updateBalance(result.newBalance);
              }

              const pointsAdded = result.points_added || packages.find(p => p.id === selectedPackageRef.current)?.points || 0;
              setSuccessInfo({
                points: pointsAdded,
                newBalance: result.newBalance,
              });

              toast.success(`تم بنجاح شحن ${pointsAdded} نقطة إلى رصيدك! شكراً لثقتك بنظام ناجي.`);
            } catch (err: any) {
              setIsProcessing(false);
              toast.error(err.message || 'فشل في إتمام عملية الشحن');
            }
          },
          onError: (err: any) => {
            setIsProcessing(false);
            console.error('PayPal Buttons Error:', err);
            toast.error('تعذرت عملية الدفع عبر PayPal. يرجى المحاولة مرة أخرى.');
          },
          onCancel: () => {
            setIsProcessing(false);
          },
        })
        .render(buttonContainerRef.current)
        .catch((err: any) => {
          console.error('Failed to render PayPal Buttons:', err);
        });
    } catch (err) {
      console.error('PayPal Buttons initialization error:', err);
    }
  }, [clientId, sdkLoading, selectedPackage, updateBalance]);

  return (
    <div id="paypal-recharge-card" className="bg-[#0b0c10] border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-6 sm:p-8 transition-all shadow-xl relative overflow-hidden font-sans">
      {/* Subtle Dark Luxe background aura */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">اشحن عبر PayPal</h2>
              {mode === 'sandbox' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Sandbox التجريبي
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              شحن فوري للنقاط مباشرة ببطاقتك الائتمانية أو رصيد PayPal بأمان معتمد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>دفع مؤمّن ومشفر 100%</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">اكتمل الشحن بنجاح!</p>
              <p className="text-[11px] text-emerald-300">
                أضيفت <span className="font-extrabold text-white">{successInfo.points} نقطة إبداع</span> إلى رصيدك. الرصيد الإجمالي الحالي: <span className="font-mono text-white font-bold">{successInfo.newBalance}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessInfo(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded transition"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Package Selection Cards */}
      <div className="mb-6 relative z-10">
        <label className="block text-xs font-semibold text-gray-300 mb-3">اختر باقة النقاط:</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {packages.map((pkg) => {
            const isSelected = selectedPackage === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative text-right p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/15 via-purple-950/20 to-black border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : 'bg-[#12141a] hover:bg-[#161922] border-gray-800 hover:border-gray-700 text-gray-300'
                }`}
              >
                {/* Value Tag Badge */}
                {pkg.badge && (
                  <span
                    className={`absolute -top-2.5 left-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-sm ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-300'
                        : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      {pkg.points}
                    </span>
                    <span className="text-xs font-semibold text-amber-400">نقطة</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    كافية لتوليد صور ونصوص وفيديوهات ذكية
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                  <span className="text-xs text-gray-400">السعر:</span>
                  <span className="text-base font-extrabold font-mono text-amber-300">
                    ${pkg.usd.toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected package summary & Checkout */}
      <div className="bg-[#12141a] border border-gray-800 rounded-xl p-4 sm:p-5 relative z-10">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800 text-xs">
          <span className="text-gray-400">الباقة المختارة:</span>
          <span className="font-bold text-white">
            {packages.find((p) => p.id === selectedPackage)?.points} نقطة مقابل{' '}
            <span className="text-amber-400 font-mono font-extrabold">
              ${packages.find((p) => p.id === selectedPackage)?.usd.toFixed(2)} USD
            </span>
          </span>
        </div>

        {/* PayPal SDK rendering area */}
        {clientId ? (
          <div>
            {sdkLoading && (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
                <NajeSpinner className="w-5 h-5 text-amber-400" />
                <span>جاري تحميل بوابة دفع PayPal الآمنة...</span>
              </div>
            )}

            {sdkError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{sdkError}</span>
              </div>
            )}

            {/* Container where PayPal official buttons render */}
            <div
              id="paypal-button-container"
              ref={buttonContainerRef}
              className={`min-h-[44px] transition-opacity duration-200 ${
                isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            />

            {isProcessing && (
              <div className="mt-2 text-center text-xs text-amber-300 flex items-center justify-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>جاري معالجة الشحن واعتماد الرصيد...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-1">
                خدمة شحن PayPal مفعلة برمجياً
              </p>
              <p className="text-gray-400 text-[11px]">
                بانتظار ضبط مفتاح <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">PAYPAL_CLIENT_ID</code> و <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">PAYPAL_SECRET</code> في متغيرات السيرفر السحابي (Cloud Run). بمجرد إدخال المفاتيح سيظهر زر PayPal و Debit/Credit Card المباشر هنا فوراً.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
