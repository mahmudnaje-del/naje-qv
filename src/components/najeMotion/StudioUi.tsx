import React from 'react';

export function StudioCard({
  title,
  hint,
  children,
  className = '',
  action,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-white/8 bg-[#0e1016] p-3 sm:rounded-[24px] sm:p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-black text-white">{title}</h2>}
            {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
  disabled,
  className = '',
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center rounded-xl border px-3 py-2 text-[11px] font-bold transition disabled:opacity-40 ${
        active
          ? 'border-[#d4a574] bg-[#d4a574]/15 text-white shadow-[0_0_18px_rgba(212,165,116,0.18)]'
          : 'border-white/10 bg-black/30 text-white/65 hover:border-white/25 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function ChipRow({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {title && <p className="mb-1.5 text-[11px] font-black text-white/80">{title}</p>}
      {hint && <p className="-mt-1 mb-2 text-[10px] text-white/40">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-black text-white/80">{children}</label>;
}

export function StudioInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#d4a574] focus:outline-none"
    />
  );
}
