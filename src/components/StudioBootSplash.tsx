import React, { useEffect, useState } from 'react';
import NajeThinking from './NajeThinking';

/** Brief pulsing-N overlay shown whenever a studio route mounts. */
export function StudioBootSplash({
  dark = false,
  duration = 640,
}: {
  dark?: boolean;
  duration?: number;
}) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), duration);
    return () => window.clearTimeout(t);
  }, [duration]);
  if (!show) return null;
  return (
    <div
      className={`absolute inset-0 z-[60] flex flex-col items-center justify-center ${
        dark ? 'bg-[#0b0c10]' : 'bg-naje-canvas'
      }`}
    >
      <NajeThinking size={64} />
      <span className={`mt-3 text-xs font-black ${dark ? 'text-[#e8b86d]' : 'text-indigo-600 dark:text-indigo-300'}`}>
        ناجي يفكّر…
      </span>
    </div>
  );
}

export default StudioBootSplash;
