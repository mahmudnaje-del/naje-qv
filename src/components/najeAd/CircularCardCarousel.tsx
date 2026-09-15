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
}: CircularCarouselProps<T>) {
  const total = items.length;
  const width = useViewportWidth();
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);

  const wrapIndex = useCallback(
    (i: number) => {
      if (total === 0) return 0;
      return ((i % total) + total) % total;
    },
    [total]
  );

  if (total === 0) {
    return null;
  }

  const handleDragStart = () => {
    draggingRef.current = true;
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (lockedRef.current) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const shouldFlip = Math.abs(offset) > 36 || Math.abs(velocity) > 280;
    if (!shouldFlip) {
      draggingRef.current = false;
      return;
    }
    lockedRef.current = true;
    const goingNext = offset + velocity * 0.18 < 0;
    onCenterIndexChange(wrapIndex(centerIndex + (goingNext ? 1 : -1)));
    window.setTimeout(() => {
      lockedRef.current = false;
      draggingRef.current = false;
    }, 280);
  };

  const visibleWindowLimit = width < 480 ? 1 : 3;
  const actualWindow = Math.min(visibleWindowLimit, Math.floor((total - 1) / 2));
  const visibleOffsets = Array.from({ length: actualWindow * 2 + 1 }, (_, i) => i - actualWindow);
  const step = width < 480 ? 72 : width < 640 ? 92 : 128;

  return (
    <div
      className="relative h-[430px] sm:h-[470px] w-full flex items-center justify-center select-none overflow-visible py-3 touch-pan-y"
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
            dragElastic={0.18}
            dragMomentum={false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={isCenter ? handleDragStart : undefined}
            onDragEnd={isCenter ? handleDragEnd : undefined}
            onClick={() => {
              if (draggingRef.current || lockedRef.current) return;
              onSelect(item);
              onCenterIndexChange(itemIndex);
            }}
            animate={{
              x: offset * step,
              scale: isCenter ? 1 : 1 - absOffset * 0.1,
              opacity: absOffset > actualWindow ? 0 : 1 - absOffset * 0.18,
              zIndex: 30 - absOffset,
              rotateY: offset * -8,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.7 }}
            className={`absolute ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} rounded-2xl ${
              selected ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-500/40' : 'hover:ring-2 hover:ring-indigo-400/50'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              pointerEvents: absOffset > 1 ? 'none' : 'auto',
              touchAction: isCenter ? 'pan-y' : 'auto',
            }}
          >
            {renderCard(item, isCenter)}
          </motion.div>
        );
      })}
    </div>
  );
}
