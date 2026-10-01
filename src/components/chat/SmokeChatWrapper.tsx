import React, { useState, useEffect, useRef } from 'react';
import { getChatTypeConfig } from '../../lib/chatTypeConfig';
import { ChatType } from '../../types';

interface SmokeChatWrapperProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  isTyping?: boolean;
  intensity?: 'normal' | 'high' | 'subtle';
  chatType?: string | ChatType;
  variant?: 'card' | 'dock';
}

// Convert hex color to rgba helper
function hexToRgba(hex: string, alpha: number): string {
  let c = (hex || '#6366f1').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export const SmokeChatWrapper: React.FC<SmokeChatWrapperProps> = ({
  children,
  className = '',
  contentClassName = '',
  isTyping: explicitIsTyping,
  intensity = 'normal',
  chatType,
  variant = 'card'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Real-time smooth physics state
  const targetEnergyRef = useRef(0);
  const currentEnergyRef = useRef(0);
  const phaseRef = useRef(0);
  const secondaryPhaseRef = useRef(0);
  const typingTimerRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  
  const [internalTyping, setInternalTyping] = useState(false);
  const activeTyping = explicitIsTyping !== undefined ? explicitIsTyping : internalTyping;

  const config = chatType ? getChatTypeConfig(chatType) : null;
  const color1 = config?.smokeColors[0] || '#6366f1'; // Primary signature color
  const color2 = config?.smokeColors[1] || '#8b5cf6'; // Secondary harmonic color

  // Intensity multipliers
  const intensityFactor = intensity === 'high' ? 1.3 : intensity === 'subtle' ? 0.7 : 1.0;
  const isDock = variant === 'dock';

  // Track keystrokes / input dynamically with smooth excitement & decay
  const handleUserActivity = () => {
    targetEnergyRef.current = 1.0;
    setInternalTyping(true);
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    // Smoothly decay back to calm after typing pause
    typingTimerRef.current = window.setTimeout(() => {
      targetEnergyRef.current = 0.0;
      setInternalTyping(false);
    }, 1200);
  };

  useEffect(() => {
    if (explicitIsTyping !== undefined) {
      targetEnergyRef.current = explicitIsTyping ? 1.0 : 0.0;
      setInternalTyping(explicitIsTyping);
    }
  }, [explicitIsTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (animFrameIdRef.current) window.cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Canvas fluid wave physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(rect.width);
      height = Math.round(rect.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);
    resize();

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      if (width <= 0 || height <= 0) {
        animFrameIdRef.current = window.requestAnimationFrame(render);
        return;
      }

      // Smooth exponential lerp for seamless, fluid acceleration & deceleration
      const lerpSpeed = 0.048;
      currentEnergyRef.current += (targetEnergyRef.current - currentEnergyRef.current) * lerpSpeed;
      const energy = currentEnergyRef.current * intensityFactor;

      // Speed accelerates smoothly when typing: 0.015 idle -> 0.052 active surge
      const speed = (0.015 + energy * 0.037);
      phaseRef.current += speed;
      secondaryPhaseRef.current += speed * 0.76;

      ctx.clearRect(0, 0, width, height);

      // ── 1. Internal Ambient Glow Layer across the full dock width ──
      const glowRadius = Math.max(width * 0.65, 300);
      const glowGrad = ctx.createRadialGradient(
        width / 2,
        height + 10,
        10,
        width / 2,
        height,
        glowRadius
      );
      glowGrad.addColorStop(0, hexToRgba(color1, 0.12 + energy * 0.16));
      glowGrad.addColorStop(0.5, hexToRgba(color2, 0.06 + energy * 0.10));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Base water line anchored along the bottom of the container
      const baseHeight = isDock 
        ? Math.min(height * 0.52, 76) 
        : Math.min(height * 0.45, 68);
      const surgeLift = energy * (isDock ? 24 : 22); // Wave surges upward when typing!
      const baseY = height - baseHeight + 10 - surgeLift;

      // ── 2. Layer 2: Deep Harmonic Counter-Wave (Secondary Wave) ──
      {
        const amp2 = (7 + energy * 15);
        const freq2 = (Math.PI * 2) / Math.max(width * (isDock ? 0.65 : 0.85), 240);

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);

        const step = 8;
        for (let x = 0; x <= width; x += step) {
          const y = baseY + 6 + 
            Math.sin(x * freq2 - secondaryPhaseRef.current) * amp2 +
            Math.cos(x * freq2 * 0.5 + phaseRef.current * 0.6) * (amp2 * 0.35);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad2 = ctx.createLinearGradient(0, baseY - amp2, 0, height);
        grad2.addColorStop(0, hexToRgba(color2, 0.18 + energy * 0.20));
        grad2.addColorStop(0.55, hexToRgba(color2, 0.08 + energy * 0.09));
        grad2.addColorStop(1, hexToRgba(color2, 0.01));

        ctx.fillStyle = grad2;
        ctx.fill();
      }

      // ── 3. Layer 3: Primary Luminous Wave (Main Front Wave) ──
      {
        const amp1 = (10 + energy * 18);
        const freq1 = (Math.PI * 2) / Math.max(width * (isDock ? 0.55 : 0.72), 200);

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);

        const step = 6;
        for (let x = 0; x <= width; x += step) {
          // Complex fluid equation: main sine wave + harmonic overtone + micro-ripple on typing agitation
          const ripple = energy > 0.08 ? Math.sin(x * 0.042 + phaseRef.current * 2.4) * (3.5 * energy) : 0;
          const y = baseY + 
            Math.sin(x * freq1 + phaseRef.current) * amp1 +
            Math.sin(x * freq1 * 1.7 - phaseRef.current * 0.8) * (amp1 * 0.28) +
            ripple;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad1 = ctx.createLinearGradient(0, baseY - amp1, 0, height);
        grad1.addColorStop(0, hexToRgba(color1, 0.28 + energy * 0.28));
        grad1.addColorStop(0.4, hexToRgba(color1, 0.14 + energy * 0.14));
        grad1.addColorStop(1, hexToRgba(color1, 0.02));

        ctx.fillStyle = grad1;
        ctx.fill();

        // ── 4. Shimmering Crest Line (The liquid luminous crest) ──
        ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
          const ripple = energy > 0.08 ? Math.sin(x * 0.042 + phaseRef.current * 2.4) * (3.5 * energy) : 0;
          const y = baseY + 
            Math.sin(x * freq1 + phaseRef.current) * amp1 +
            Math.sin(x * freq1 * 1.7 - phaseRef.current * 0.8) * (amp1 * 0.28) +
            ripple;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const crestGrad = ctx.createLinearGradient(0, 0, width, 0);
        crestGrad.addColorStop(0, hexToRgba(color1, 0.35 + energy * 0.45));
        crestGrad.addColorStop(0.5, hexToRgba(color2, 0.65 + energy * 0.35));
        crestGrad.addColorStop(1, hexToRgba(color1, 0.35 + energy * 0.45));

        ctx.strokeStyle = crestGrad;
        ctx.lineWidth = 1.3 + energy * 1.1;
        ctx.stroke();
      }

      // ── 5. Internal Ambient Luminous Edge Reflections ──
      if (energy > 0.12) {
        const bottomGlow = ctx.createLinearGradient(0, height - 20, 0, height);
        bottomGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGlow.addColorStop(1, hexToRgba(color1, 0.20 * energy));
        ctx.fillStyle = bottomGlow;
        ctx.fillRect(0, height - 20, width, 20);
      }

      animFrameIdRef.current = window.requestAnimationFrame(render);
    };

    render();

    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        if (animFrameIdRef.current) window.cancelAnimationFrame(animFrameIdRef.current);
      } else {
        if (!isRunning) {
          isRunning = true;
          render();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) window.cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [color1, color2, intensityFactor, isDock]);

  const frameClass = isDock ? 'smoke-chat-dock' : 'smoke-chat-card rounded-2xl sm:rounded-3xl';
  const frameStyle: React.CSSProperties = isDock ? {
    overflow: 'hidden',
    contain: 'paint',
    clipPath: 'inset(0)',
    WebkitClipPath: 'inset(0)',
    borderTopColor: activeTyping ? hexToRgba(color1, 0.45) : undefined,
    boxShadow: activeTyping 
      ? `inset 0 4px 18px -4px ${hexToRgba(color1, 0.18)}` 
      : undefined
  } : {
    borderRadius: '1.5rem',
    clipPath: 'inset(0 round 1.5rem)',
    WebkitClipPath: 'inset(0 round 1.5rem)',
    contain: 'paint',
    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
    borderColor: activeTyping ? hexToRgba(color1, 0.45) : undefined,
    boxShadow: activeTyping 
      ? `0 0 24px -4px ${hexToRgba(color1, 0.25)}, inset 0 0 14px -3px ${hexToRgba(color1, 0.18)}` 
      : undefined
  };

  return (
    <div
      ref={containerRef}
      onKeyDownCapture={handleUserActivity}
      onInputCapture={handleUserActivity}
      onCompositionUpdateCapture={handleUserActivity}
      onPasteCapture={handleUserActivity}
      onFocusCapture={handleUserActivity}
      className={`smoke-chat-frame ${frameClass} relative overflow-hidden isolate transition-all duration-300 ${activeTyping ? 'smoke-active-typing' : ''} ${className}`}
      style={frameStyle}
    >
      {/* ── Internal Canvas Fluid Wave Layer (Strictly contained inside the frame boundaries) ── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
        style={{
          borderRadius: isDock ? '0' : 'inherit',
          willChange: 'contents'
        }}
      />

      {/* ── Chat Box Content (Elevated cleanly above waves) ── */}
      <div className={`relative z-10 w-full ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default SmokeChatWrapper;
