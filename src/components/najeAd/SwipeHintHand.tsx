import React from 'react';
import { motion } from 'motion/react';

/** Exact white/black pointing-left hand from the user's swipe clip, plus fingertip motion dots. */
export function SwipeHintHand({ label }: { label: string }) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-0.5" aria-hidden>
      <div className="relative h-[4.6rem] w-[8.2rem] overflow-visible">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute top-1/2 h-[7px] w-[7px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.85)]"
            style={{ left: 6 + i * 11, marginTop: -3 }}
            animate={{
              opacity: [0, 0.95, 0],
              x: [10, -18],
              scale: [0.35, 1, 0.15],
            }}
            transition={{
              duration: 1.05,
              repeat: Infinity,
              delay: 0.08 + i * 0.14,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.img
          src="/swipe-hand.png"
          alt=""
          draggable={false}
          className="absolute left-[54%] top-1/2 h-[3.6rem] w-auto max-w-[6.4rem] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]"
          animate={{ x: [14, -20, 14] }}
          transition={{
            duration: 1.55,
            repeat: Infinity,
            ease: [0.42, 0.0, 0.58, 1],
          }}
        />
      </div>
      <span className="max-w-[10.5rem] text-center text-[9px] font-black leading-tight tracking-wide text-[#e8b86d]/90">
        {label}
      </span>
    </div>
  );
}
