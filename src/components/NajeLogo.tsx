import React from 'react';
import { useAppStore } from '../store';

interface NajeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NajeLogo: React.FC<NajeLogoProps> = ({ className = '', size = 'md' }) => {
  const themeMode = useAppStore((s) => s.themeMode);
  const dim = size === 'sm' ? 24 : size === 'lg' ? 80 : 32;
  const radius = size === 'sm' ? 6 : size === 'lg' ? 18 : 8;
  const src = themeMode === 'light' ? '/logo-light.png' : '/logo-512.png';

  return (
    <img
      src={src}
      alt="Naje AI"
      width={dim}
      height={dim}
      draggable={false}
      className={`shrink-0 shadow-md shadow-indigo-500/10 object-cover ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', width: dim, height: dim, borderRadius: radius }}
    />
  );
};

export default NajeLogo;
