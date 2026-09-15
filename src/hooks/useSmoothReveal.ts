import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to smoothly reveal streaming text word-by-word or clause-by-clause
 */
export function useSmoothReveal(rawText: string, isStreaming: boolean) {
  const [shownText, setShownText] = useState(rawText);
  const rawRef = useRef(rawText);
  rawRef.current = rawText;

  useEffect(() => {
    if (!isStreaming) {
      setShownText(rawText);
      return;
    }

    let animationFrameId: number;

    const tick = () => {
      setShownText((prev) => {
        const target = rawRef.current;
        if (prev === target) return prev;
        if (prev.length >= target.length) return target;

        // Catch up speed: if target is way ahead, reveal more characters
        const diff = target.length - prev.length;
        let increment = 1;
        if (diff > 100) increment = 15;
        else if (diff > 50) increment = 8;
        else if (diff > 20) increment = 4;
        else if (diff > 8) increment = 2;

        return target.slice(0, prev.length + increment);
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStreaming, rawText]);

  useEffect(() => {
    if (!isStreaming) {
      setShownText(rawText);
    }
  }, [isStreaming, rawText]);

  return shownText;
}
