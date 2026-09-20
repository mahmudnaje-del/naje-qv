import React from 'react';

export function SwipeHintHand({ label }: { label: string }) {
  return (
    <p className="px-2 text-center text-[10px] font-bold leading-relaxed text-white/40">
      {label}
    </p>
  );
}
