import React from 'react';
import { ShieldCheck, Lock, Zap, CheckCircle2, CreditCard } from 'lucide-react';

// Official Visa Card Badge
export const VisaBadge: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-8',
    md: 'h-6 w-10',
    lg: 'h-8 w-14',
  }[size];

  return (
    <div
      title="Visa Card"
      className={`inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-1 py-0.5 shadow-sm select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <svg viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M17.8 19H14.7L16.6 5.5H19.7L17.8 19ZM29.2 5.9C28.5 5.6 27.4 5.3 26.1 5.3C22.8 5.3 20.5 7 20.5 9.5C20.5 11.4 22.2 12.4 23.5 13C24.8 13.6 25.3 14 25.3 14.7C25.3 15.6 24.2 16.1 23.2 16.1C22.1 16.1 21.3 15.8 20.3 15.3L19.9 15.1L19.4 18.1C20.2 18.5 21.6 18.9 23 18.9C26.6 18.9 28.9 17.1 28.9 14.4C28.9 12.8 27.9 11.6 25.9 10.7C24.7 10.1 24 9.7 24 9.1C24 8.5 24.6 7.9 25.9 7.9C26.9 7.9 27.7 8.1 28.3 8.4L28.6 8.5L29.2 5.9ZM37.7 5.5H35.3C34.5 5.5 33.9 5.8 33.5 6.6L28.6 19H32.3L33 17.1H37.6L38 19H41.3L38.4 5.5H37.7ZM34.1 14.2C34.4 13.4 35.5 10.2 35.5 10.2C35.5 10.2 35.8 9.4 36 8.7L36.3 10.1C36.3 10.1 36.9 13.2 37.1 14.2H34.1ZM12.7 5.5L9.6 14.7L9.2 12.8C8.6 10.7 6.8 8.4 4.5 7.2L7.5 19H11.2L16.7 5.5H12.7Z"
          fill="#1A1F71"
          className="dark:fill-[#2563EB]"
        />
        <path
          d="M6.8 5.5H0.1L0 5.7C5.1 7 8.5 10.3 9.9 14.2L8.7 6.8C8.5 5.8 7.7 5.5 6.8 5.5Z"
          fill="#F7B600"
        />
      </svg>
    </div>
  );
};

// Official Mastercard Badge
export const MastercardBadge: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-8',
    md: 'h-6 w-10',
    lg: 'h-8 w-14',
  }[size];

  return (
    <div
      title="Mastercard"
      className={`inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-1 py-0.5 shadow-sm select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="14" cy="12" r="9" fill="#EB001B" />
        <circle cx="26" cy="12" r="9" fill="#F79E1B" />
        <path
          d="M20 5.67C22.25 7.37 23.68 9.55 23.68 12C23.68 14.45 22.25 16.63 20 18.33C17.75 16.63 16.32 14.45 16.32 12C16.32 9.55 17.75 7.37 20 5.67Z"
          fill="#FF5F00"
        />
      </svg>
    </div>
  );
};

// Mada Badge (National Payment Network in Saudi/Gulf)
export const MadaBadge: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-8',
    md: 'h-6 w-10',
    lg: 'h-8 w-14',
  }[size];

  return (
    <div
      title="بطاقة مدى (Mada Debit)"
      className={`inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-1 py-0.5 shadow-sm select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M6 14.5C6 11.5 8 9 11 9C13 9 14.8 10.2 15.5 12" stroke="#008037" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M15.5 12C16.2 13.8 18 15 20 15C23 15 25 12.5 25 9.5" stroke="#0098DA" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="31" cy="12" r="2.5" fill="#008037" />
        <circle cx="9" cy="7" r="1.5" fill="#0098DA" />
      </svg>
    </div>
  );
};

// Official PayPal Logo Badge
export const PayPalBadge: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-8',
    md: 'h-6 w-10',
    lg: 'h-8 w-14',
  }[size];

  return (
    <div
      title="PayPal"
      className={`inline-flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-1 py-0.5 shadow-sm select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <svg viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M12.5 19H8.5L12 4.5H19C21.8 4.5 23.5 5.8 23 8.3C22.6 10.3 20.8 12.2 18 12.2H14.5L13.2 17.5L12.5 19Z"
          fill="#003087"
        />
        <path
          d="M14.5 19H10.5L13.8 5.5H19.5C22.2 5.5 24 6.8 23.5 9.2C23 11.2 21.2 13.1 18.5 13.1H15.8L14.7 17.5L14.5 19Z"
          fill="#0079C1"
          fillOpacity="0.85"
        />
      </svg>
    </div>
  );
};

// American Express Badge
export const AmexBadge: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-5 w-8',
    md: 'h-6 w-10',
    lg: 'h-8 w-14',
  }[size];

  return (
    <div
      title="American Express"
      className={`inline-flex items-center justify-center bg-[#016FD0] border border-[#015db0] rounded-md px-1 py-0.5 shadow-sm select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <span className="text-[9px] font-black text-white tracking-tighter uppercase font-mono">AMEX</span>
    </div>
  );
};

// Grouped Row of Payment Badges
export const PaymentBrandIconsRow: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <VisaBadge size={size} />
      <MastercardBadge size={size} />
      <PayPalBadge size={size} />
      <MadaBadge size={size} />
      <AmexBadge size={size} />
    </div>
  );
};

// Highly Polished Virtual Holographic Bank Card Mockup
export const VirtualCreditCardVisual: React.FC<{
  packageName?: string;
  points?: number;
  usd?: number;
  className?: string;
}> = ({ packageName = 'الباقة المختارة', points = 100, usd = 10, className = '' }) => {
  return (
    <div
      className={`relative w-full aspect-[1.62/1] max-w-[340px] mx-auto rounded-2xl p-5 text-white overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-amber-400/30 bg-gradient-to-br from-slate-900 via-[#131620] to-[#0c0d12] ${className}`}
    >
      {/* Decorative gradient aura */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

      {/* Card Header: Platform title + NFC waves */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-purple-500 flex items-center justify-center text-black font-black text-[10px] shadow-sm">
            N
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-amber-200 block leading-tight">
              NAJE CREATIVE
            </span>
            <span className="text-[9px] text-gray-400 font-mono tracking-widest block">SECURE PASSPORT</span>
          </div>
        </div>

        {/* Contactless / NFC waves */}
        <div className="flex items-center gap-1 text-gray-400">
          <svg className="w-5 h-5 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8.5 16.5a5 5 0 0 1 0-9" strokeLinecap="round" />
            <path d="M12 19a8.5 8.5 0 0 0 0-14" strokeLinecap="round" />
            <path d="M15.5 21.5a12 12 0 0 0 0-19" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Gold EMV Chip Simulation */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-1 border border-amber-200/60 shadow-md flex items-center justify-center">
          <div className="w-full h-full border border-amber-800/40 rounded-[2px] flex items-center justify-center">
            <div className="w-3 h-full border-x border-amber-800/40" />
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-gray-400 block">شحن مباشر فور تأكيد الدفع</span>
          <span className="text-xs font-black text-amber-400 font-mono">+{points} PTS</span>
        </div>
      </div>

      {/* Card Masked Digits */}
      <div className="relative z-10 font-mono text-sm tracking-[0.25em] text-gray-200 mb-4 font-semibold flex items-center gap-3">
        <span>••••</span>
        <span>••••</span>
        <span>••••</span>
        <span className="text-amber-300 font-bold">4242</span>
      </div>

      {/* Card Footer: Package & Accepted Badges */}
      <div className="relative z-10 flex items-end justify-between pt-1 border-t border-white/10">
        <div>
          <span className="text-[8px] text-gray-400 uppercase tracking-wider block">باقة الشحن</span>
          <span className="text-xs font-extrabold text-white">{packageName}</span>
          <span className="text-[10px] text-amber-400 font-mono font-bold mr-1.5">${usd.toFixed(2)}</span>
        </div>

        {/* Visa & Mastercard Badges overlapping */}
        <div className="flex items-center gap-1.5">
          <VisaBadge size="sm" />
          <MastercardBadge size="sm" />
        </div>
      </div>
    </div>
  );
};
