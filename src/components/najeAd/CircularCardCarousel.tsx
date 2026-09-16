import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, PanInfo } from 'motion/react';

export interface CircularCarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  renderCard: (item: T, isCenter: boolean) => React.ReactNode;
  centerIndex: number;
  onCenterIndexChange: (newIndex: number) => void;
  frameClassName?: string;
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export function CircularCardCarousel<T>({
  items,
  getKey,
  isSelected,
  onSelect,
  renderCard,
  centerIndex,
  onCenterIndexChange,
  frameClassName = 'h-[540px] sm:h-[580px]',
}: CircularCarouselProps<T>) {
  const total = items.length;
  const width = useViewportWidth();
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);
  const flippedRef = useRef(false);

  const wrapIndex = useCallback(
    (i: number) => {
      if (total === 0) return 0;
      return ((i % total) + total) % total;
    },
    [total]
  );

  const commitFlip = useCallback(
    (direction: 1 | -1) => {
      if (lockedRef.current || flippedRef.current) return;
      lockedRef.current = true;
      flippedRef.current = true;
      onCenterIndexChange(wrapIndex(centerIndex + direction));
      window.setTimeout(() => {
        lockedRef.current = false;
        draggingRef.current = false;
        flippedRef.current = false;
      }, 160);
    },
    [centerIndex, onCenterIndexChange, wrapIndex]
  );

  if (total === 0) {
    return null;
  }

  const handleDragStart = () => {
    draggingRef.current = true;
    flippedRef.current = false;
  };

  const maybeFlip = (offsetX: number, velocityX: number) => {
    if (lockedRef.current || flippedRef.current) return;
    const projected = offsetX + velocityX * 0.18;
    const shouldFlip = Math.abs(offsetX) > 40 || Math.abs(velocityX) > 150 || Math.abs(projected) > 64;
    if (!shouldFlip) return;
    commitFlip(projected < 0 ? 1 : -1);
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90) {
      maybeFlip(info.offset.x, info.velocity.x);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!flippedRef.current) {
      maybeFlip(info.offset.x, info.velocity.x);
    }
    if (!flippedRef.current) {
      draggingRef.current = false;
    }
  };

  const visibleWindowLimit = width < 480 ? 1 : 3;
  const actualWindow = Math.min(visibleWindowLimit, Math.floor((total - 1) / 2));
  const visibleOffsets = Array.from({ length: actualWindow * 2 + 1 }, (_, i) => i - actualWindow);
  const step = width < 480 ? 88 : width < 640 ? 112 : 152;

  return (
    <div
      className={`relative ${frameClassName} w-full flex items-center justify-center select-none overflow-visible py-2 touch-pan-x`}
      dir="ltr"
      style={{ perspective: 1200 }}
    >
      {visibleOffsets.map((offset) => {
        const itemIndex = wrapIndex(centerIndex + offset);
        const item = items[itemIndex];
        if (!item) return null;

        const isCenter = offset === 0;
        const absOffset = Math.abs(offset);
        const selected = isSelected(item);

        return (
          <motion.div
            key={isCenter ? `center-${getKey(item)}-${centerIndex}` : `${getKey(item)}-${offset}`}
            drag={isCenter ? 'x' : false}
            dragListener={isCenter}
            dragElastic={0.06}
            dragMomentum={false}
            dragConstraints={{ left: -220, right: 220 }}
            onDragStart={isCenter ? handleDragStart : undefined}
            onDrag={isCenter ? handleDrag : undefined}
            onDragEnd={isCenter ? handleDragEnd : undefined}
            onClick={() => {
              if (draggingRef.current || lockedRef.current) return;
              onSelect(item);
              onCenterIndexChange(itemIndex);
            }}
            animate={{
              x: offset * step,
              scale: isCenter ? 1 : 1 - absOffset * 0.12,
              opacity: absOffset > actualWindow ? 0 : 1 - absOffset * 0.2,
              zIndex: 30 - absOffset,
              rotateY: offset * -6,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.65 }}
            className={`absolute ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} rounded-2xl ${
              selected ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-500/40' : 'hover:ring-2 hover:ring-indigo-400/50'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              pointerEvents: absOffset > 1 ? 'none' : 'auto',
              touchAction: isCenter ? 'pan-x' : 'auto',
              WebkitUserSelect: 'none',
            }}
          >
            {renderCard(item, isCenter)}
          </motion.div>
        );
      })}
    </div>
  );
}
