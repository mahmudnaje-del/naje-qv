import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useDragControls } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CircularCarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  isSelected: (item: T) => boolean;
  onSelect: (item: T) => void;
  renderCard: (item: T, isCenter: boolean) => React.ReactNode;
  centerIndex: number;
  onCenterIndexChange: (newIndex: number) => void;
  frameClassName?: string;
  onUserSwipe?: () => void;
  showArrows?: boolean;
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

function blocksDrag(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [data-no-drag]'));
}

export function CircularCardCarousel<T>({
  items,
  getKey,
  isSelected,
  onSelect,
  renderCard,
  centerIndex,
  onCenterIndexChange,
  frameClassName = 'h-[400px] sm:h-[460px]',
  onUserSwipe,
  showArrows = true,
}: CircularCarouselProps<T>) {
  const total = items.length;
  const width = useViewportWidth();
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);
  const flippedRef = useRef(false);
  const movedRef = useRef(false);
  const dragControls = useDragControls();

  const wrapIndex = useCallback(
    (i: number) => {
      if (total === 0) return 0;
      return ((i % total) + total) % total;
    },
    [total]
  );

  const commitFlip = useCallback(
    (direction: 1 | -1) => {
      if (lockedRef.current || total < 2) return;
      lockedRef.current = true;
      flippedRef.current = true;
      onUserSwipe?.();
      onCenterIndexChange(wrapIndex(centerIndex + direction));
      window.setTimeout(() => {
        lockedRef.current = false;
        draggingRef.current = false;
        flippedRef.current = false;
        movedRef.current = false;
      }, 180);
    },
    [centerIndex, onCenterIndexChange, onUserSwipe, total, wrapIndex]
  );

  useEffect(() => {
    if (total === 0) return;
    if (centerIndex < 0 || centerIndex >= total) onCenterIndexChange(0);
  }, [centerIndex, onCenterIndexChange, total]);

  if (total === 0) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (lockedRef.current) return;
    if (blocksDrag(e.target)) return;
    draggingRef.current = false;
    movedRef.current = false;
    flippedRef.current = false;
    dragControls.start(e);
  };

  const handleDragStart = () => {
    draggingRef.current = true;
    flippedRef.current = false;
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8) {
      movedRef.current = true;
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const projected = dx + vx * 0.16;
    const distance = Math.max(Math.abs(dx), Math.abs(projected));
    const shouldFlip = distance > 28 || Math.abs(vx) > 120;
    if (shouldFlip && !lockedRef.current) {
      commitFlip(projected < 0 ? 1 : -1);
    } else {
      draggingRef.current = false;
    }
  };

  const visibleWindowLimit = width < 640 ? 1 : 2;
  const actualWindow = Math.min(visibleWindowLimit, Math.floor((total - 1) / 2));
  const visibleOffsets = Array.from({ length: actualWindow * 2 + 1 }, (_, i) => i - actualWindow);
  const step = width < 400 ? 72 : width < 640 ? 96 : 140;

  return (
    <div
      className={`relative ${frameClassName} w-full flex items-center justify-center select-none overflow-visible py-1`}
      dir="ltr"
      style={{ perspective: 1200 }}
    >
      {showArrows && total > 1 && (
        <>
          <button
            type="button"
            aria-label="البطاقة السابقة"
            onClick={(e) => {
              e.stopPropagation();
              commitFlip(-1);
            }}
            className="absolute left-0 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/85 backdrop-blur sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="البطاقة التالية"
            onClick={(e) => {
              e.stopPropagation();
              commitFlip(1);
            }}
            className="absolute right-0 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/85 backdrop-blur sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
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
            dragListener={false}
            dragControls={isCenter ? dragControls : undefined}
            dragDirectionLock
            dragElastic={0.18}
            dragMomentum={false}
            dragConstraints={{ left: -240, right: 240 }}
            dragTransition={{ bounceStiffness: 520, bounceDamping: 38 }}
            onPointerDownCapture={isCenter ? handlePointerDown : undefined}
            onDragStart={isCenter ? handleDragStart : undefined}
            onDrag={isCenter ? handleDrag : undefined}
            onDragEnd={isCenter ? handleDragEnd : undefined}
            onClickCapture={(e) => {
              if (movedRef.current || flippedRef.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onClick={() => {
              if (movedRef.current || lockedRef.current || flippedRef.current) return;
              onSelect(item);
              onCenterIndexChange(itemIndex);
            }}
            animate={{
              x: offset * step,
              scale: isCenter ? 1 : 1 - absOffset * 0.1,
              opacity: absOffset > actualWindow ? 0 : 1 - absOffset * 0.18,
              zIndex: 30 - absOffset,
              rotateY: offset * -5,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.65 }}
            className={`absolute ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} rounded-2xl ${
              selected
                ? 'ring-2 ring-[#d4a574] shadow-[0_16px_40px_-18px_rgba(212,165,116,0.7)]'
                : isCenter
                ? 'ring-1 ring-white/10'
                : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              pointerEvents: absOffset > 1 ? 'none' : 'auto',
              touchAction: isCenter ? 'none' : 'auto',
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
