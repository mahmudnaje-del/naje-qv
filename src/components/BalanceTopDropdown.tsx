import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import najeWalletCoins from '../assets/icons/naje-wallet-coins.svg';
import NajeSpinner from './NajeSpinner';
import {
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Gift,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Coins,
} from 'lucide-react';

interface BalanceTopDropdownProps {
  isCreativeMode?: boolean;
}

export const BalanceTopDropdown: React.FC<BalanceTopDropdownProps> = ({ isCreativeMode }) => {
  const { user, updateBalance } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
    setMessage({ text: '', type: '' });
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء محاولة استرداد الكود');
      }

      updateBalance(data.newBalance);
      setMessage({
        text: `تم شحن ${data.addedPoints} نقطة إلى رصيدك بنجاح!`,
        type: 'success',
      });
      toast.success(`تم شحن ${data.addedPoints} نقطة بنجاح!`);
      setCode('');
    } catch (err: any) {
      setMessage({ text: err.message || 'كود الشحن غير صالح', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToStore = () => {
    setIsOpen(false);
    navigate('/store');
  };

  const formattedBalance = Number((user?.balance || 0).toFixed(2));

  return (
    <div className="relative inline-block text-right" ref={dropdownRef}>
      {/* Desktop Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="انقر لإدارة وشحن الرصيد"
        className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
          isCreativeMode
            ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white'
            : 'bg-gray-50 hover:bg-purple-50/60 dark:bg-gray-950/60 dark:hover:bg-gray-900 border border-gray-200 hover:border-purple-300 dark:border-gray-800 text-gray-800 dark:text-gray-300'
        } ${isOpen ? 'ring-2 ring-amber-400/60 border-amber-400' : ''}`}
      >
        <span className="truncate max-w-[120px]">{user?.displayName || 'مبدع ناجي'}</span>
        <span className={isCreativeMode ? 'text-slate-500' : 'text-gray-400 dark:text-gray-600'}>•</span>
        <span
          className={`${
            isCreativeMode ? 'text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
          } font-extrabold font-sans flex items-center gap-1.5`}
        >
          <img src={najeWalletCoins} alt="رصيد" className="w-4 h-4 object-contain" />
          <span>{formattedBalance} نقطة</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-500' : ''
          }`}
        />
      </button>

      {/* Mobile Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="شحن وشراء الرصيد"
        className={`sm:hidden flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 ${
          isCreativeMode
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
        } ${isOpen ? 'ring-2 ring-amber-400/60' : ''}`}
      >
        <img src={najeWalletCoins} alt="رصيد" className="w-3.5 h-3.5 object-contain" />
        <span className="font-sans font-bold">{formattedBalance}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-500' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 sm:left-0 rtl:right-auto sm:rtl:right-auto mt-2 w-[calc(100vw-32px)] max-w-[340px] sm:w-84 bg-[#ffffff] dark:bg-[#0e1015] border border-purple-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-purple-900/15 dark:shadow-black/60 p-4 z-50 text-right overflow-hidden"
            style={{ minWidth: '290px' }}
          >
            {/* Header: Balance Display */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">
                    رصيدك الحالي
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black font-sans text-gray-900 dark:text-white">
                      {formattedBalance}
                    </span>
                    <span className="text-xs font-bold text-amber-500">نقطة إبداع</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                فوري ومؤمّن
              </span>
            </div>

            {/* Option 1: Buy Balance Button (Directed to /stor) */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoToStore}
                className="w-full relative group overflow-hidden p-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-purple-700 hover:from-amber-400 hover:via-amber-500 hover:to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 text-right">
                  <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 text-amber-200">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight flex items-center gap-1.5">
                      <span>شراء الرصيد</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    </span>
                    <span className="text-[10px] font-normal text-amber-100/90 truncate">
                      باقات تبدأ من 5$ عبر PayPal
                    </span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:-translate-x-0.5 transition-transform rtl:rotate-180">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
              <span className="bg-white dark:bg-[#0e1015] px-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 absolute">
                أو شحن الرصيد بالكود
              </span>
            </div>

            {/* Option 2: Redeem Code Section */}
            <div className="mt-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                <Gift className="w-3.5 h-3.5 text-purple-500" />
                <span>شحن الرصيد بالكود</span>
              </div>

              <form onSubmit={handleRedeem} className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      if (message.text) setMessage({ text: '', type: '' });
                    }}
                    placeholder="أدخل كود الشحن (مثال: NAJE-XXXX)"
                    disabled={loading}
                    dir="ltr"
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-sans transition outline-none disabled:opacity-50 text-center uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white disabled:text-gray-500 dark:disabled:text-gray-600 font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  {loading ? (
                    <>
                      <NajeSpinner className="w-3.5 h-3.5 text-white" />
                      <span>جاري الاسترداد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تفعيل وشحن الكود</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status Message */}
              <AnimatePresence>
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-2.5 p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                    )}
                    <span className="truncate">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BalanceTopDropdown;
