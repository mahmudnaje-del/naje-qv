import { splitDuration, VIDEO_CLIP_POLICY } from './videoOrchestrator';

export interface StitchPlan {
  requestedSec: number;
  clips: number[];
  strategy: 'single_clip' | 'omni_extend' | 'veo_stitch';
  noteAr: string;
}

export function planVideoStitch(requestedSec: number, engine: 'veo' | 'omni' = 'veo'): StitchPlan {
  const sec = Math.max(4, Math.min(40, Math.round(requestedSec)));
  if (engine === 'omni') {
    const chunks = Math.max(1, Math.ceil(sec / 10));
    return {
      requestedSec: sec,
      clips: Array.from({ length: chunks }, () => 10),
      strategy: sec <= 10 ? 'single_clip' : 'omni_extend',
      noteAr: 'أومني يرجّع امتداد المشهد نفسه، مش مقطعين منفصلين. السقف 40 ثانية.',
    };
  }
  const clips = splitDuration(sec);
  return {
    requestedSec: clips.reduce((a, b) => a + b, 0),
    clips,
    strategy: clips.length > 1 ? 'veo_stitch' : 'single_clip',
    noteAr:
      clips.length > 1
        ? `فيو يرجّع لقطة ${clips[0]} ث ثم لقطات لاحقة. الدمج عبر /api/video/stitch وليس رداً واحداً بـ ${sec} ثانية.`
        : 'لقطة واحدة، بلا دمج.',
  };
}

export { VIDEO_CLIP_POLICY };
