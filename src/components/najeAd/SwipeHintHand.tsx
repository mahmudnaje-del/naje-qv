import React from 'react';
import { motion } from 'motion/react';

export function SwipeHintHand({ label }: { label: string }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-0.5" aria-hidden>
      <div className="relative h-[3.35rem] w-[5.5rem]">
        <motion.svg
          width="88"
          height="54"
          viewBox="0 0 88 54"
          fill="none"
          className="absolute inset-0"
          animate={{ x: [6, -10, 6], opacity: [0.25, 0.85, 0.25] }}
          transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M18 20c10-9 22-12 36-10" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.22" />
          <path d="M16 28c12-8 24-11 38-9" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.4" />
          <path d="M20 36c10-6 20-8 32-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.28" />
        </motion.svg>
        <motion.svg
          width="88"
          height="54"
          viewBox="0 0 88 54"
          fill="none"
          className="absolute inset-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
          animate={{ x: [8, -12, 8] }}
          transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M46 8.5c.7-2.4 3.2-3.6 5.4-2.6 1.6.8 2.4 2.5 2.2 4.3l-.8 11.2 1.4-1.6c1.4-1.7 4-1.6 5.3.3 1 1.5.8 3.5-.4 4.8l-8.6 9.4c-1.6 1.8-2.5 4.1-2.6 6.5l-.2 3.4c0 2.3-1.9 4.2-4.2 4.2h-9.6c-2.1 0-3.9-1.5-4.2-3.6l-1.6-9.4c-.4-2.2.3-4.5 1.9-6.1l7.6-7.6V12.2c0-2.3 1.9-4.1 4.2-4.1 1.4 0 2.7.7 3.4 1.9V8.5Z"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </motion.svg>
      </div>
      <span className="max-w-[9.5rem] text-center text-[9px] font-black leading-tight tracking-wide text-white/70">
        {label}
      </span>
    </div>
  );
}