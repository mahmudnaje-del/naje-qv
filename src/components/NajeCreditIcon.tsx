import React from 'react';
import najeWalletCoins from '../assets/icons/naje-wallet-coins.svg';

interface Props {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const NajeCreditIcon: React.FC<Props> = ({
  className = 'w-4 h-4',
  size,
  alt = 'Naje Credit',
}) => {
  return (
    <img
      src={najeWalletCoins}
      alt={alt}
      style={size ? { width: size, height: size } : undefined}
      className={`inline-block object-contain select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};

export default NajeCreditIcon;
