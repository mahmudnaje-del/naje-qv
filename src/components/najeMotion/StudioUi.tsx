import React from 'react';

export function RegFrame({
  children,
  className = '',
  bars = false,
}: {
  children: React.ReactNode;
  className?: string;
  bars?: boolean;
}) {
  return (
    <div className={`motion-letterbox relative ${className}`}>
      <span className="pointer-events-none absolute start-2 top-2 h-2.5 w-2.5 border-s-2 border-t-2 border-[#8ec8ff]/60" />
      <span className="pointer-events-none absolute end-2 top-2 h-2.5 w-2.5 border-e-2 border-t-2 border-[#8ec8ff]/60" />
      <span className="pointer-events-none absolute bottom-2 start-2 h-2.5 w-2.5 border-b-2 border-s-2 border-[#8ec8ff]/60" />
      <span className="pointer-events-none absolute bottom-2 end-2 h-2.5 w-2.5 border-e-2 border-b-2 border-[#8ec8ff]/60" />
      {bars && (
        <>
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1 sm:h-1.5 bg-black/85" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 sm:h-1.5 bg-black/85" />
        </>
      )}
      {children}
    </div>
  );
}

export function StudioCard({
  title,
  hint,
  children,
  className = '',
  action,
  frame = false,
  icon,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  frame?: boolean;
  icon?: React.ReactNode;
}) {
  const inner = (
    <>
      {(title || action) && (
        <div className="mb-3.5 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex items-start gap-2.5">
            {icon && (
              <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-[#8ec8ff]/25 bg-[#8ec8ff]/10 text-[#8ec8ff]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-sm sm:text-base font-black text-[#e7eef8] tracking-tight">{title}</h2>}
              {hint && <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-[#93a0b5]">{hint}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </>
  );

  if (frame) {
    return (
      <RegFrame className={`rounded-2xl sm:rounded-[26px] border border-[#8ec8ff]/20 bg-[#0e131c]/95 p-3.5 sm:p-5 shadow-lg shadow-black/40 backdrop-blur-md ${className}`}>
        {inner}
      </RegFrame>
    );
  }
  return (
    <section className={`rounded-2xl sm:rounded-[26px] border border-[#8ec8ff]/18 bg-[#0e131c]/95 p-3.5 sm:p-5 shadow-md shadow-black/30 backdrop-blur-md ${className}`}>
      {inner}
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
  disabled,
  className = '',
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.97] touch-manipulation disabled:opacity-40 sm:text-[12px] select-none ${
        active
          ? 'border-[#8ec8ff] bg-[#8ec8ff]/20 text-[#e7eef8] shadow-[0_0_18px_rgba(142,200,255,0.3)] ring-1 ring-[#8ec8ff]/40'
          : 'border-[#8ec8ff]/15 bg-black/40 text-[#93a0b5] hover:border-[#8ec8ff]/40 hover:bg-black/60 hover:text-[#e7eef8]'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function ChipRow({
  title,
  hint,
  children,
  scroll = false,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {title && <p className="text-xs font-black text-[#e7eef8] tracking-tight">{title}</p>}
      {hint && <p className="text-[10px] sm:text-[11px] leading-relaxed text-[#93a0b5]">{hint}</p>}
      <div
        className={
          scroll
            ? 'flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none sm:flex-wrap touch-pan-x'
            : 'flex flex-wrap gap-2'
        }
      >
        {children}
      </div>
    </div>
  );
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-black text-[#e7eef8] tracking-tight">
      {children}
      {required && <span className="ms-1 text-[#ffb020]">*</span>}
    </label>
  );
}

export function StudioInput({
  value,
  onChange,
  placeholder,
  id,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-[#8ec8ff]/18 bg-black/40 px-3.5 py-2.5 text-base sm:text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/50 focus:border-[#8ec8ff] focus:bg-black/60 focus:outline-none transition-colors ${className}`}
    />
  );
}

export const fieldClass =
  'w-full min-h-[88px] resize-none rounded-xl sm:rounded-2xl border border-[#8ec8ff]/18 bg-black/40 p-3.5 text-base sm:text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/50 focus:border-[#8ec8ff] focus:bg-black/60 focus:outline-none transition-colors';
