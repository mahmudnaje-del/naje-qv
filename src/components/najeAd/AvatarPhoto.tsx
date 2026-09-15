import React, { useState } from 'react';

export function avatarPreviewSrc(id: string) {
  return `/avatars/${id}.jpg`;
}

export function AvatarPhoto({
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
        className={`flex items-center justify-center font-black text-white ${className}`}
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        aria-hidden
      >
        {name.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={avatarPreviewSrc(id)}
      alt={name}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
