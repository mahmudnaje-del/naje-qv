import React, { useCallback, useState, useEffect } from 'react';
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
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
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
  onCenterIndexChange
}: CircularCarouselProps<T>) {
  const total = items.length;
  const width = useViewportWidth();

  // Safe circular wrapping index
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

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50; // px threshold to trigger swipe
    if (info.offset.x < -threshold) {
      // Swiped left -> next card
      onCenterIndexChange(wrapIndex(centerIndex + 1));
    } else if (info.offset.x > threshold) {
      // Swiped right -> prev card
      onCenterIndexChange(wrapIndex(centerIndex - 1));
    }
  };

  // If items total is smaller than visible window * 2 + 1, adapt window
  const visibleWindowLimit = width < 480 ? 1 : 3;
  const actualWindow = Math.min(visibleWindowLimit, Math.floor((total - 1) / 2));
  const visibleOffsets = Array.from(
    { length: actualWindow * 2 + 1 },
    (_, i) => i - actualWindow
  );

  return (
    <div
      className="relative h-[340px] sm:h-[380px] w-full flex items-center justify-center select-none overflow-visible py-4"
      dir="ltr"
      style={{ perspective: 1000 }}
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
            key={getKey(item)}
            drag={isCenter ? 'x' : false}
            dragElastic={0.25}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={isCenter ? handleDragEnd : undefined}
            onClick={() => {
              onSelect(item);
              onCenterIndexChange(itemIndex);
            }}
            animate={{
              x: offset * (width < 480 ? 60 : (width < 640 ? 70 : 110)),
              scale: 1 - absOffset * 0.12,
              opacity: absOffset > actualWindow ? 0 : 1 - absOffset * 0.2,
              zIndex: 20 - absOffset,
              rotateY: offset * -10
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`absolute cursor-pointer rounded-2xl transition-shadow ${
              selected
                ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-500/40'
                : 'hover:ring-2 hover:ring-indigo-400/50'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {renderCard(item, isCenter)}
          </motion.div>
        );
      })}
    </div>
  );
}
