import React from 'react';
import type { MotionAspect, MotionDuration, MotionRes } from '../../lib/motionStudio';
import { Chip, ChipRow, StudioCard } from './StudioUi';

export function FormatBar({
  duration,
  aspect,
  resolution,
  onDuration,
  onAspect,
  onResolution,
}: {
  duration: MotionDuration;
  aspect: MotionAspect;
  resolution: MotionRes;
  onDuration: (v: MotionDuration) => void;
  onAspect: (v: MotionAspect) => void;
  onResolution: (v: MotionRes) => void;
}) {
  return (
    <StudioCard title="المقاس والمدة" hint="المحرك يولّد دائماً نافذة 10 ثوانٍ. الخمس ثوانٍ وخزة داخلها.">
      <div className="space-y-3">
        <ChipRow title="المدة">
          {([5, 10] as const).map((d) => (
            <Chip key={d} active={duration === d} onClick={() => onDuration(d)}>
              {d} ث
            </Chip>
          ))}
        </ChipRow>
        {duration === 5 && (
          <p className="rounded-xl border border-[#d4a574]/20 bg-[#d4a574]/8 px-3 py-2 text-[10px] leading-relaxed text-[#e8b86d]">
            المحرك يولّد مقطعاً من 10ث؛ نوجّهه ليكون وخزة 5 ثوانٍ ثم ثبات الشعار.
          </p>
        )}
        <ChipRow title="الإطار">
          <Chip active={aspect === '16:9'} onClick={() => onAspect('16:9')}>
            16:9 يوتيوب
          </Chip>
          <Chip active={aspect === '9:16'} onClick={() => onAspect('9:16')}>
            9:16 شورتس/تيك توك
          </Chip>
          <Chip active={aspect === '1:1'} onClick={() => onAspect('1:1')}>
            1:1
          </Chip>
        </ChipRow>
        {aspect === '1:1' && (
          <p className="text-[10px] leading-relaxed text-white/40">
            1:1 يُصاغ كتكوين مربع داخل إطار 9:16
          </p>
        )}
        <ChipRow title="الدقة">
          <Chip active={resolution === '720p'} onClick={() => onResolution('720p')}>
            720p
          </Chip>
          <Chip active={resolution === '1080p'} onClick={() => onResolution('1080p')}>
            1080p
          </Chip>
        </ChipRow>
      </div>
    </StudioCard>
  );
}
