import React from 'react';

interface NajeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NajeLogo: React.FC<NajeLogoProps> = ({ className = '', size = 'md' }) => {
  const dim = size === 'sm' ? 24 : size === 'lg' ? 80 : 32;

  return (
    <img
      src="/logo-mark.svg"
      alt="Naje AI"
      width={dim}
      height={dim}
      draggable={false}
      className={`shrink-0 object-contain ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', width: dim, height: dim }}
    />
  );
};

export default NajeLogo;
