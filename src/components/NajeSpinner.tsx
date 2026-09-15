import React from 'react';
import najeLoaderSignature from '../assets/icons/naje-loader-signature.svg';
import { cn } from '../lib/utils';

interface NajeSpinnerProps {
  className?: string;
  size?: number | string;
}

export const NajeSpinner: React.FC<NajeSpinnerProps> = ({ className, size }) => {
  return (
    <img
      src={najeLoaderSignature}
      alt="جاري التحميل"
      style={size ? { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size } : undefined}
      className={cn('inline-block object-contain shrink-0', className || 'w-4 h-4')}
    />
  );
};

export default NajeSpinner;
