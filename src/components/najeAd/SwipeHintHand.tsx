import React from 'react';
import { motion } from 'motion/react';

export function SwipeHintHand({ label }: { label: string }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-0.5" aria-hidden>
      <div className="relative h-14 w-20">
        <motion.svg
          width="80"
          height="56"
          viewBox="0 0 80 56"
          fill="none"
          className="absolute inset-0"
          animate={{ x: [4, -8, 4], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M10 18c12-8 26-11 42-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.25" />
          <path d="M8 27c14-8 28-10 44-7" stroke="white" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
          <path d="M12 36c12-6 24-8 38-6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.28" />
        </motion.svg>
        <motion.svg
          width="80"
          height="56"
          viewBox="0 0 80 56"
          fill="none"
          className="absolute inset-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)]"
          animate={{ x: [6, -10, 6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M39.2 5.2c2.5 0 4.5 2 4.5 4.5v16.8l1.6-1.8c1.3-1.5 3.6-1.6 5.1-.3 1.4 1.2 1.6 3.3.5 4.8L41 42.4c-1.5 1.9-3.8 3-6.2 3H24.4c-3.7 0-6.7-3.1-6.5-6.8l.6-10.2c.2-2.4 2.2-4.2 4.6-4.2.7 0 1.4.2 2 .5V9.7c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5v12.2h2.1V9.7c0-2.5 2-4.5 4.5-4.5Z"
            fill="white"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </motion.svg>
      </div>
      <span className="max-w-[9.5rem] text-center text-[9px] font-black leading-tight tracking-wide text-[#e8b86d]/90">
        {label}
      </span>
    </div>
  );
}