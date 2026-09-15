import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface NajeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NajeLogo: React.FC<NajeLogoProps> = ({ className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 rounded-lg text-xs',
    md: 'w-8 h-8 rounded-xl text-sm',
    lg: 'w-20 h-20 rounded-2xl text-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-10 h-10',
  }[size];

  if (imgError) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20 flex-shrink-0 border border-indigo-400/30 ${className}`}
        title="استوديو ناجي"
      >
        <Sparkles className={`${iconSizes} text-white`} />
      </div>
    );
  }

  return (
    <img
      src="/logo-mark.svg"
      alt="Naje"
      width={size === 'sm' ? 24 : size === 'lg' ? 80 : 32}
      height={size === 'sm' ? 24 : size === 'lg' ? 80 : 32}
      onError={() => setImgError(true)}
      className={`${sizeClasses} shadow-md shadow-indigo-500/20 object-contain flex-shrink-0 bg-white dark:bg-gray-900 border border-indigo-500/10 p-0.5 ${className}`}
    />
  );
};

export default NajeLogo;
