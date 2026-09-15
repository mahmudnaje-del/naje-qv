import React, { useId } from 'react';

// مؤشر تفكير Naje AI — يستعرض تفكير حرف الـ N النابض لـ Naje
export function NajeThinking({ size = 40, className = '' }: { size?: number; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const violetGradId = `najeThinkingV_${uid}`;
  const goldGradId = `najeThinkingG_${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="ناجي يفكّر"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={violetGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={goldGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBC85A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <style>{`
          .naje-n-block { transform-box: fill-box; transform-origin: center; animation: najePopAnim 1.9s cubic-bezier(.34,1.4,.5,1) infinite; }
          .naje-n-v { filter: drop-shadow(0 0 3px rgba(139,92,246,.55)); }
          .naje-n-d { filter: drop-shadow(0 0 3.5px rgba(212,175,55,.6)); }
          @keyframes najePopAnim {
            0%,100% { opacity:0; transform:scale(.25); }
            11%     { opacity:1; transform:scale(1.12); }
            20%     { transform:scale(1); }
            20%,52% { opacity:1; }
            70%     { opacity:0; transform:scale(.25); }
          }
          @media (prefers-reduced-motion: reduce) { .naje-n-block { animation:none; opacity:1; transform:none; } }
        `}</style>
      </defs>
      <rect className="naje-n-block naje-n-v" x="106.0" y="146.0" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.00s' }} />
      <rect className="naje-n-block naje-n-v" x="106.0" y="220.8" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.09s' }} />
      <rect className="naje-n-block naje-n-v" x="106.0" y="295.6" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.18s' }} />
      <rect className="naje-n-block naje-n-d" x="188.8" y="210.2" width="61.1" height="61.1" rx="13.4" fill={`url(#${goldGradId})`} style={{ animationDelay: '0.27s' }} />
      <rect className="naje-n-block naje-n-d" x="262.1" y="243.8" width="61.1" height="61.1" rx="13.4" fill={`url(#${goldGradId})`} style={{ animationDelay: '0.36s' }} />
      <rect className="naje-n-block naje-n-v" x="344.9" y="146.0" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.45s' }} />
      <rect className="naje-n-block naje-n-v" x="344.9" y="220.8" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.54s' }} />
      <rect className="naje-n-block naje-n-v" x="344.9" y="295.6" width="61.1" height="61.1" rx="13.4" fill={`url(#${violetGradId})`} style={{ animationDelay: '0.63s' }} />
    </svg>
  );
}

export default NajeThinking;

