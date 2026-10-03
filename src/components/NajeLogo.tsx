import React, { useId } from 'react';

interface NajeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NajeLogo: React.FC<NajeLogoProps> = ({ className = '', size = 'md' }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const goldGradId = `najeLogoGold_${uid}`;
  const violetGradId = `najeLogoViolet_${uid}`;
  const bgGradId = `najeLogoBg_${uid}`;

  const dim = size === 'sm' ? 24 : size === 'lg' ? 80 : 32;
  const radius = size === 'sm' ? 6 : size === 'lg' ? 18 : 8;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={dim}
      height={dim}
      role="img"
      aria-label="Naje AI"
      className={`shrink-0 shadow-md shadow-indigo-500/10 ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: radius }}
    >
      <title>Naje AI</title>
      <defs>
        <linearGradient id={goldGradId} gradientUnits="userSpaceOnUse" x1="0" y1="47" x2="0" y2="707">
          <stop offset="0%" stopColor="#EFD066" />
          <stop offset="100%" stopColor="#D2A82F" />
        </linearGradient>
        <linearGradient id={violetGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <radialGradient id={bgGradId} cx="256" cy="256" r="360" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1D27" />
          <stop offset="100%" stopColor="#0F1115" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="114" fill={`url(#${bgGradId})`} />
      <rect x="106" y="146" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <rect x="106" y="221" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <rect x="106" y="296" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <rect x="345" y="146" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <rect x="345" y="221" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <rect x="345" y="296" width="61" height="61" rx="14" fill={`url(#${violetGradId})`} />
      <g transform="translate(219.5,240.5) scale(0.09701) translate(-445,-377)" fill="none" stroke={`url(#${goldGradId})`} strokeWidth="62" strokeLinecap="round" strokeLinejoin="round">
        <rect x="153" y="214" width="584" height="462" rx="110" />
        <line x1="344" y1="384" x2="344" y2="506" />
        <line x1="546" y1="384" x2="546" y2="506" />
        <line x1="74" y1="445" x2="153" y2="445" />
        <line x1="737" y1="445" x2="816" y2="445" />
        <path d="M322 78H444V214" />
      </g>
      <g transform="translate(292.5,274.5) scale(0.09701) translate(-445,-377)" fill="none" stroke={`url(#${goldGradId})`} strokeWidth="62" strokeLinecap="round" strokeLinejoin="round">
        <rect x="153" y="214" width="584" height="462" rx="110" />
        <line x1="344" y1="384" x2="344" y2="506" />
        <line x1="546" y1="384" x2="546" y2="506" />
        <line x1="74" y1="445" x2="153" y2="445" />
        <line x1="737" y1="445" x2="816" y2="445" />
        <path d="M322 78H444V214" />
      </g>
    </svg>
  );
};

export default NajeLogo;
