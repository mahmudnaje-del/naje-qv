import React, { useState } from 'react';

export function locationPreviewSrc(id: string) {
  return `/locations/${id}.webp`;
}

export function LocationPhoto({
  id,
  name,
  gradient,
  className = '',
}: {
  id: string;
  name: string;
  gradient: [string, string];
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={locationPreviewSrc(id)}
      alt={name}
      className={`object-cover object-center ${className}`}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
