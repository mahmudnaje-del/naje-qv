import React from 'react';

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c4a35a] focus:outline-none';

export const goldBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#c4a35a] px-3 py-2 text-[11px] font-black text-[#1a140c] disabled:opacity-40';

export const ghostGoldBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#c4a35a]/40 px-3 py-2 text-[11px] font-black text-[#e8c36a] disabled:opacity-40';

export const chipOn = 'border-[#c4a35a] bg-[#c4a35a]/15 text-white';
export const chipOff = 'border-white/10 bg-black/25 text-white/70';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-right">
      <span className="mb-1 block text-[11px] font-black text-[#f3ead8]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-white/40">{hint}</span>}
    </label>
  );
}

export function Box({
  id,
  icon,
  title,
  hint,
  action,
  children,
  collapsed,
  onToggle,
  active,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  active?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-2xl border p-3 sm:p-4 ${
        active ? 'border-[#c4a35a]/45 bg-white/[0.05]' : 'border-white/10 bg-white/[0.035]'
      }`}
    >
      <div
        className={`mb-3 flex items-start justify-between gap-2 ${onToggle ? 'cursor-pointer lg:cursor-default' : ''}`}
        onClick={onToggle}
        onKeyDown={
          onToggle
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        role={onToggle ? 'button' : undefined}
        tabIndex={onToggle ? 0 : undefined}
      >
        <div>
          <h3 className="inline-flex items-center gap-2 text-sm font-black text-white">
            {icon}
            {title}
          </h3>
          {hint && <p className="mt-1 text-[10px] leading-relaxed text-white/40">{hint}</p>}
        </div>
        {action ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {action}
          </div>
        ) : null}
      </div>
      <div className={collapsed ? 'hidden lg:block' : ''}>{children}</div>
    </section>
  );
}
