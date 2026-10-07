import { useEffect, type RefObject } from 'react';

/**
 * Pin a full-screen app shell to the visible viewport.
 * On Android the keyboard does not shrink `100dvh`. The browser then scrolls
 * the layout to reveal the focused field, which shoves the header off-screen
 * and leaves a white band between the composer and the keys.
 * Following visualViewport keeps the header on screen and the composer flush.
 */
export function useVisualViewportShell(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const vv = window.visualViewport;
    if (!el || !vv) return;

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.classList.toggle('keyboard-open', keyboard > 80);
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.right = '0';
        el.style.width = '100%';
        el.style.top = `${Math.round(vv.offsetTop)}px`;
        el.style.height = `${Math.round(vv.height)}px`;
      });
    };

    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
      window.removeEventListener('orientationchange', apply);
      el.style.position = '';
      el.style.left = '';
      el.style.right = '';
      el.style.width = '';
      el.style.top = '';
      el.style.height = '';
      document.documentElement.classList.remove('keyboard-open');
    };
  }, [ref]);
}
