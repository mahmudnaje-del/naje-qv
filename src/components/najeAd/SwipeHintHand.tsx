import React from 'react';
import { motion } from 'motion/react';

export function SwipeHintHand({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex flex-col items-center gap-1">
      <motion.div
        className="relative"
        animate={{ x: [18, -28, 18] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden>
          <ellipse cx="32" cy="54" rx="14" ry="4" fill="rgba(212,165,116,0.18)" />
          <path
            d="M26 28c0-3 2-5 4.5-5s4.5 2 4.5 5v2.5c1.2-1.6 3-2.4 5-1.6 2 .8 2.6 2.8 2.2 4.6L40 42c2.2.4 4 2.2 4 4.6 0 3.4-3 6.4-8.5 6.4H28c-5 0-9-3.2-9-8.2V34c0-2.4 1.8-4.4 4.2-4.6.6 0 1.3.1 1.8.4V28Z"
            fill="#f4efe6"
            stroke="#d4a574"
            strokeWidth="1.6"
          />
          <path d="M30.5 16v12" stroke="#c17f59" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </motion.div>
      <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold tracking-wide text-[#e8b86d] shadow-lg shadow-black/40 backdrop-blur">
        {label}
      </span>
    </div>
  );
}
