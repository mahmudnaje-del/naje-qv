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
      <span className="pointer-events-none absolute start-2 top-2 h-2.5 w-2.5 border-s border-t border-[#8ec8ff]/75" />
      <span className="pointer-events-none absolute end-2 top-2 h-2.5 w-2.5 border-e border-t border-[#8ec8ff]/75" />
      <span className="pointer-events-none absolute bottom-2 start-2 h-2.5 w-2.5 border-b border-s border-[#8ec8ff]/75" />
      <span className="pointer-events-none absolute bottom-2 end-2 h-2.5 w-2.5 border-e border-b border-[#8ec8ff]/75" />
      {bars && (
        <>
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-black/85" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-black/85" />
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
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  frame?: boolean;
}) {
  const inner = (
    <>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-black text-[#e7eef8]">{title}</h2>}
            {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-[#93a0b5]">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </>
  );
  if (frame) {
    return (
      <RegFrame className={`rounded-2xl bg-[#0e131c] p-3 sm:rounded-[24px] sm:p-4 ${className}`}>{inner}</RegFrame>
    );
  }
  return (
    <section className={`rounded-2xl border border-[#8ec8ff]/18 bg-[#0e131c] p-3 sm:rounded-[24px] sm:p-4 ${className}`}>
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
      className={`inline-flex min-h-[44px] shrink-0 items-center rounded-xl border px-3 py-2 text-[11px] font-bold transition disabled:opacity-40 ${
        active
          ? 'border-[#8ec8ff] bg-[#8ec8ff]/15 text-[#e7eef8] shadow-[0_0_18px_rgba(142,200,255,0.18)]'
          : 'border-[#8ec8ff]/15 bg-black/30 text-[#93a0b5] hover:border-[#8ec8ff]/40 hover:text-[#e7eef8]'
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
  scroll = false,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <div>
      {title && <p className="mb-1.5 text-[11px] font-black text-[#e7eef8]">{title}</p>}
      {hint && <p className="mb-2 text-[10px] leading-relaxed text-[#93a0b5]">{hint}</p>}
      <div className={scroll ? 'flex gap-1.5 overflow-x-auto pb-1' : 'flex flex-wrap gap-1.5'}>{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-black text-[#e7eef8]">{children}</label>;
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
      className="w-full rounded-2xl border border-[#8ec8ff]/15 bg-black/40 px-3 py-2.5 text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/70 focus:border-[#8ec8ff] focus:outline-none"
    />
  );
}

export const fieldClass =
  'w-full resize-none rounded-2xl border border-[#8ec8ff]/15 bg-black/40 p-3 text-sm text-[#e7eef8] placeholder:text-[#93a0b5]/70 focus:border-[#8ec8ff] focus:outline-none';
