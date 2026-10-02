import React from 'react';

interface SuiteIconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Naje Ad Engine Icon (محرك الإعلانات - ناجي أد)
 * Signature Fixed Colors: Electric Cyan, Ultra Marine & Golden Conversion Spark
 * Concept: High-impact digital advertising horn & dynamic broadcast beam
 */
export const NajeAdIcon: React.FC<SuiteIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width={size}
    height={size}
  >
    <defs>
      <linearGradient id="naje-ad-body" x1="2" y1="5" x2="16" y2="19" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="naje-ad-bell" x1="12" y1="4" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="naje-ad-gold" x1="17" y1="4" x2="22" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    {/* Megaphone Back Handle & Body */}
    <path
      d="M4.5 13.5V17C4.5 17.8 5.2 18.5 6 18.5H7.5C8.3 18.5 9 17.8 9 17V14.5"
      stroke="#0284C7"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Acoustic Main Cone Body */}
    <path
      d="M3 10.5C3 9.4 3.9 8.5 5 8.5H7.5L14 4.5V17.5L7.5 13.5H5C3.9 13.5 3 12.6 3 11.5V10.5Z"
      fill="url(#naje-ad-body)"
    />

    {/* High-Gloss Light Edge Reflection */}
    <path
      d="M4.5 9.5H7.5L13 6.1V7.5L7.8 10.5H4.5C3.9 10.5 3.5 10.1 3.5 9.5C3.5 9.5 3.9 9.5 4.5 9.5Z"
      fill="#BAE6FD"
      fillOpacity="0.65"
    />

    {/* Flared Acoustic Output Rim */}
    <path
      d="M14 5.2C15.2 6.5 16 8.8 16 11C16 13.2 15.2 15.5 14 16.8"
      stroke="url(#naje-ad-bell)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Broadcast Signal Wave 1 */}
    <path
      d="M17.8 7.5C18.9 8.5 19.5 9.7 19.5 11C19.5 12.3 18.9 13.5 17.8 14.5"
      stroke="#38BDF8"
      strokeWidth="1.9"
      strokeLinecap="round"
    />

    {/* Broadcast Signal Wave 2 */}
    <path
      d="M20.8 5.2C22.5 6.8 23.5 8.8 23.5 11C23.5 13.2 22.5 15.2 20.8 16.8"
      stroke="#0284C7"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />

    {/* Golden Conversion Sparkle / Star at top right */}
    <path
      d="M18.5 3L19.2 4.6L20.8 5.3L19.2 6L18.5 7.6L17.8 6L16.2 5.3L17.8 4.6L18.5 3Z"
      fill="url(#naje-ad-gold)"
    />
  </svg>
);

/**
 * 2. Naje Ident & Motion Studio Icon (أستوديو الهوية والموشن - ناجي إيدنت)
 * Signature Fixed Colors: Sunset Amber, Coral Tangerine & Golden Kinetic Core
 * Concept: Dynamic cinematic motion aperture & play burst
 */
export const NajeIdentIcon: React.FC<SuiteIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width={size}
    height={size}
  >
    <defs>
      <linearGradient id="naje-ident-bg" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="naje-ident-inner" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FDE68A" />
      </linearGradient>
      <linearGradient id="naje-ident-gold" x1="10" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FEF08A" />
      </linearGradient>
    </defs>

    {/* Cinematic Motion Outer Ring / Smooth Squircle Frame */}
    <rect
      x="2.5"
      y="2.5"
      width="19"
      height="19"
      rx="6"
      fill="url(#naje-ident-bg)"
    />

    {/* Subtle Inner Camera Lens Vignette */}
    <circle cx="12" cy="12" r="7.5" fill="#C2410C" fillOpacity="0.35" />

    {/* Kinetic Motion Ribbon Arcs (Creates optical illusion of rotation & motion) */}
    <path
      d="M12 4.5C16.1 4.5 19.5 7.9 19.5 12"
      stroke="#FED7AA"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeOpacity="0.75"
    />
    <path
      d="M12 19.5C7.9 19.5 4.5 16.1 4.5 12"
      stroke="#7C2D12"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />

    {/* Dynamic Kinetic Play Triangle (Centric Focus) */}
    <path
      d="M10.2 8.8C10.2 8.1 11 7.6 11.6 8L16.2 11.2C16.7 11.6 16.7 12.4 16.2 12.8L11.6 16C11 16.4 10.2 15.9 10.2 15.2V8.8Z"
      fill="url(#naje-ident-gold)"
    />

    {/* Motion Sparkle / Lens Flare in upper corner */}
    <circle cx="6.5" cy="6.5" r="1.2" fill="#FFFFFF" fillOpacity="0.9" />
    <circle cx="18" cy="17.5" r="0.9" fill="#FEF08A" fillOpacity="0.8" />
  </svg>
);

/**
 * 3. Naje CV Pro Icon (السيرة الذاتية الاحترافية - ناجي CV)
 * Signature Fixed Colors: Royal Indigo, Deep Violet & Polished Gold Seal
 * Concept: Executive portfolio document with certified distinction medal
 */
export const NajeCvIcon: React.FC<SuiteIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width={size}
    height={size}
  >
    <defs>
      <linearGradient id="naje-cv-card" x1="4" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="40%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id="naje-cv-fold" x1="14" y1="2" x2="20" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
      <linearGradient id="naje-cv-seal" x1="14" y1="13" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Primary Executive Document Body */}
    <path
      d="M4.5 4.5C4.5 3.4 5.4 2.5 6.5 2.5H14.5L19.5 7.5V19.5C19.5 20.6 18.6 21.5 17.5 21.5H6.5C5.4 21.5 4.5 20.6 4.5 19.5V4.5Z"
      fill="url(#naje-cv-card)"
    />

    {/* Sleek 3D Document Corner Fold */}
    <path
      d="M14.5 2.5V6.5C14.5 7.1 14.9 7.5 15.5 7.5H19.5L14.5 2.5Z"
      fill="url(#naje-cv-fold)"
    />

    {/* Executive Avatar / Profile Photo Placard */}
    <rect x="7.5" y="6" width="4.5" height="4.5" rx="1.5" fill="#E0E7FF" fillOpacity="0.9" />
    <circle cx="9.75" cy="7.7" r="1.1" fill="#4F46E5" />
    <path d="M8.2 10.2C8.4 9.4 9.1 9 9.75 9C10.4 9 11.1 9.4 11.3 10.2H8.2Z" fill="#4F46E5" />

    {/* Clean Structured Content Lines */}
    <rect x="7.5" y="12.5" width="5.5" height="1.6" rx="0.8" fill="#E0E7FF" fillOpacity="0.85" />
    <rect x="7.5" y="15.5" width="4.2" height="1.6" rx="0.8" fill="#C7D2FE" fillOpacity="0.75" />

    {/* Golden Executive Certification Medal (Bottom Right) */}
    <circle cx="16.5" cy="16.5" r="3.6" fill="url(#naje-cv-seal)" />
    {/* Inner Star / Checkmark of Distinction */}
    <path
      d="M15.2 16.5L16.2 17.5L18.2 15.3"
      stroke="#FFFFFF"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 4. Creative Studio Icon (أستوديو الإبداع - كرييتف ستوديو)
 * Signature Fixed Colors: Cosmic Purple, Neon Magenta & Aurora Cyan
 * Concept: Radiant generative crystal spark & artistic prism
 */
export const CreativeStudioIcon: React.FC<SuiteIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width={size}
    height={size}
  >
    <defs>
      <linearGradient id="creative-star-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E879F9" />
        <stop offset="35%" stopColor="#C084FC" />
        <stop offset="70%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7E22CE" />
      </linearGradient>
      <linearGradient id="creative-ring-grad" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <radialGradient id="creative-core" cx="12" cy="12" r="5" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#F5D0FE" />
        <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ambient Glowing Core */}
    <circle cx="12" cy="12" r="5" fill="url(#creative-core)" />

    {/* Orbiting Generative Energy Ring */}
    <ellipse
      cx="12"
      cy="12"
      rx="9.5"
      ry="4.2"
      transform="rotate(-25 12 12)"
      stroke="url(#creative-ring-grad)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeDasharray="2.5 3.5"
    />

    {/* Central Brilliant 4-Point Prism Star */}
    <path
      d="M12 2.5C12 7.8 7.8 12 2.5 12C7.8 12 12 16.2 12 21.5C12 16.2 16.2 12 21.5 12C16.2 12 12 7.8 12 2.5Z"
      fill="url(#creative-star-grad)"
    />

    {/* High-Gloss Core Highlight & Sparkles */}
    <circle cx="12" cy="12" r="1.8" fill="#FFFFFF" />

    {/* Satellite Satellite Sparks */}
    <circle cx="19.5" cy="5.5" r="1.2" fill="#38BDF8" />
    <circle cx="4.5" cy="18.5" r="1" fill="#FDE047" />
  </svg>
);
