import React from 'react';
import { motion } from 'motion/react';

export function SwipeHintHand({ label }: { label: string }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-0.5" aria-hidden>
      <div className="relative h-14 w-[4.5rem]">
        <motion.span
          className="absolute left-1 top-6 h-8 w-8 rounded-full bg-[var(--naje-accent)]/15"
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.svg
          width="72"
          height="56"
          viewBox="0 0 72 56"
          fill="none"
          className="absolute inset-0"
          animate={{ x: [10, -14, 10] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M14 22c8-6 16-8 24-7" stroke="var(--naje-accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
          <path d="M16 28c7-4 14-6 22-5" stroke="var(--naje-accent-2)" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
          <path d="M18 33c6-3 12-4 18-3" stroke="#f4efe6" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
          <ellipse cx="40" cy="50" rx="11" ry="3" fill="rgba(212,165,116,0.22)" />
          <path
            d="M33.2 18.5c0-3.4 2.4-5.6 5.1-5.6 2.7 0 5 2.2 5 5.6v6.2c1.1-1.5 2.8-2.4 4.8-1.7 2.2.8 2.9 3 2.4 5.1l-1.6 6.6c2.1.5 3.7 2.4 3.7 4.8 0 3.6-3.3 6.7-9.1 6.7H32.6c-5.4 0-9.4-3.4-9.4-8.6V30.4c0-2.6 2-4.7 4.6-4.9.6 0 1.2.1 1.7.4V18.5Z"
            fill="#f7f1e8"
            stroke="#c17f59"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M38.2 8.5v11.5" stroke="#c17f59" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="38.2" cy="7.2" r="2.1" fill="var(--naje-accent-2)" stroke="#c17f59" strokeWidth="1.1" />
        </motion.svg>
      </div>
      <span className="max-w-[9.5rem] text-center text-[9px] font-black leading-tight tracking-wide text-[var(--naje-accent-2)]/90">
        {label}
      </span>
    </div>
  );
}
