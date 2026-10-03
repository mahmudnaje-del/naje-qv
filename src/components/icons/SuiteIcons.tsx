import React from 'react';
import adIcon from '../../assets/studio-icons/naje-ad.png';
import identIcon from '../../assets/studio-icons/naje-ident.png';
import cvIcon from '../../assets/studio-icons/naje-cv.png';
import creativeIcon from '../../assets/studio-icons/creative-icon.png';

interface SuiteIconProps {
  className?: string;
  size?: number;
}

function SuiteMark({ src, alt, className = 'w-5 h-5', size = 20 }: SuiteIconProps & { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`${className} object-cover rounded-[22%]`}
    />
  );
}

export const NajeAdIcon: React.FC<SuiteIconProps> = (props) => (
  <SuiteMark {...props} src={adIcon} alt="ناجي أد" />
);

export const NajeIdentIcon: React.FC<SuiteIconProps> = (props) => (
  <SuiteMark {...props} src={identIcon} alt="استوديو الحركة" />
);

export const NajeCvIcon: React.FC<SuiteIconProps> = (props) => (
  <SuiteMark {...props} src={cvIcon} alt="السيرة" />
);

export const CreativeStudioIcon: React.FC<SuiteIconProps> = (props) => (
  <SuiteMark {...props} src={creativeIcon} alt="الاستوديو الإبداعي" />
);
