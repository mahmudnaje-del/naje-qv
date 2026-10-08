import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, PanInfo, useDragControls } from 'motion/react';
import { SwipeHintHand } from './SwipeHintHand';
import { useI18n } from '../../i18n';

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
  showHand?: boolean;
  handLabel?: string;
}

function blocksDrag(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [data-no-drag]'));
}

export function LtrCount({ current, total }: { current: number; total: number }) {
  return (
    <span
      className="font-mono text-[11px] font-black tabular-nums text-white/55"
      dir="ltr"
      style={{ unicodeBidi: 'bidi-override' }}
    >
      {current} / {total}
    </span>
  );
}

export function CircularCardCarousel<T>({
  items,
  getKey,
  isSelected,
  onSelect,
  renderCard,
  centerIndex,
  onCenterIndexChange,
  frameClassName = 'h-[320px] sm:h-[360px]',
  onUserSwipe,
  showHand = false,
  handLabel,
}: CircularCarouselProps<T>) {
  const { t } = useI18n();
  const resolvedHand = handLabel ?? t('adui.swipe');
  const total = items.length;
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);
  const flippedRef = useRef(false);
  const movedRef = useRef(false);
  const dragControls = useDragControls();
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(320);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const apply = () => setFrameW(el.clientWidth || 320);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxSafePeek = Math.max(24, Math.floor((frameW * 0.5) - (frameW < 420 ? 68 : 88)));
  const peekX = Math.max(28, Math.min(maxSafePeek, Math.round(frameW * 0.19)));

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

  const peekOffsets = total > 1 ? [-1, 0, 1] : [0];

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        className={`relative ${frameClassName} w-full flex items-center justify-center select-none overflow-hidden rounded-2xl sm:rounded-3xl`}
        dir="ltr"
      >
        {peekOffsets.map((offset) => {
          const itemIndex = wrapIndex(centerIndex + offset);
          const item = items[itemIndex];
          if (!item) return null;

          const isCenter = offset === 0;
          const selected = isSelected(item);

          return (
            <motion.div
              key={isCenter ? `center-${getKey(item)}-${centerIndex}` : `peek-${offset}-${getKey(item)}`}
              drag={isCenter ? 'x' : false}
              dragListener={false}
              dragControls={isCenter ? dragControls : undefined}
              dragDirectionLock
              dragElastic={0.16}
              dragMomentum={false}
              dragConstraints={{ left: -140, right: 140 }}
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
                x: isCenter ? 0 : offset * peekX,
                y: isCenter ? 0 : 8,
                scale: isCenter ? 1 : 0.74,
                opacity: isCenter ? 1 : 0.72,
                zIndex: isCenter ? 30 : 8,
                rotate: isCenter ? 0 : offset * 4,
              }}
              transition={{ type: 'spring', stiffness: 440, damping: 36, mass: 0.6 }}
              className={`absolute ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} rounded-2xl ${
                selected && isCenter
                  ? 'ring-2 ring-[#d4a574] shadow-[0_18px_40px_-16px_rgba(212,165,116,0.45)]'
                  : isCenter
                  ? 'shadow-[0_20px_40px_-18px_rgba(0,0,0,0.75)]'
                  : 'shadow-[0_12px_28px_-18px_rgba(0,0,0,0.7)]'
              }`}
              style={{
                pointerEvents: 'auto',
                touchAction: isCenter ? 'none' : 'auto',
                WebkitUserSelect: 'none',
                filter: isCenter ? 'none' : 'brightness(0.7)',
              }}
            >
              {renderCard(item, isCenter)}
            </motion.div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="mt-1 flex flex-col items-center justify-center gap-0.5">
          {showHand ? <SwipeHintHand label={resolvedHand} /> : null}
          <LtrCount current={centerIndex + 1} total={total} />
        </div>
      )}
    </div>
  );
}
