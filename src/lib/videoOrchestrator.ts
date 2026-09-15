export interface ShotPlan {
  shotNumber: number;
  durationSec: number;
  prompt: string;
  descriptionAr: string;
  cameraMovement: string;
  estimatedCostPoints?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface VideoPlan {
  id?: string;
  title?: string;
  rawPrompt?: string;
  model?: string;
  styleLock?: string;
  createdAt?: number;
  totalDurationSec: number;
  totalEstimatedCostPoints: number;
  aspectRatio: '16:9' | '9:16';
  shots: ShotPlan[];
}

export const DURATION_LADDER: Record<number, number[]> = {
  4:  [4],
  6:  [6],
  8:  [8],
  10: [4, 6],
  12: [4, 8],
  14: [8, 6],
  16: [8, 8],
  24: [8, 8, 8],
  30: [8, 8, 8, 6],
};

export const SUPPORTED_TOTAL_DURATIONS = Object.keys(DURATION_LADDER).map(Number).sort((a, b) => a - b);

export function splitDuration(targetSec: number): number[] {
  const shots = DURATION_LADDER[targetSec];
  if (!shots) {
    const nearest = SUPPORTED_TOTAL_DURATIONS.reduce((closest, d) =>
      Math.abs(d - targetSec) < Math.abs(closest - targetSec) ? d : closest
    );
    return DURATION_LADDER[nearest];
  }
  return shots;
}

/**
 * Builds the initial VideoPlan with multi-shot breakdown and prompts.
 */
export function buildInitialPlan(params: {
  rawPrompt: string;
  totalDurationSec: number;
  aspectRatio?: '16:9' | '9:16';
  model?: string;
  brandProfile?: any;
  pointsRatePerSecond?: number;
}): VideoPlan {
  const {
    rawPrompt,
    totalDurationSec,
    aspectRatio = '16:9',
    model = 'veo-lite',
    brandProfile,
    pointsRatePerSecond = 2.5
  } = params;

  const durationSegments = splitDuration(totalDurationSec);
  const totalCalculated = durationSegments.reduce((sum, d) => sum + d, 0);

  const styleContext = brandProfile?.style ? `Style: ${brandProfile.style}. ` : '';
  const colorContext = brandProfile?.colors?.length ? `Palette: ${brandProfile.colors.join(', ')}. ` : '';
  const styleLock = `${styleContext}${colorContext}Consistent cinematic lighting, ultra-clean commercial look, perfectly continuous subject and environment, 24fps motion cadence, ${aspectRatio} aspect ratio.`;

  const shots: ShotPlan[] = durationSegments.map((dur, index) => {
    const isFirstShot = index === 0;
    const isMultiShot = durationSegments.length > 1;

    let shotPrompt = '';
    let descriptionAr = '';
    let cameraMovement = '';

    if (isFirstShot) {
      descriptionAr = `اللقطة الأولى (${dur} ثواني): لقطة تأسيسية وبداية المشهد مع تثبيت العناصر البصرية.`;
      cameraMovement = 'Smooth establishing forward tracking or gentle pan';
      shotPrompt = `[Shot 1 of ${durationSegments.length} - ${dur}s]: Establishing shot for "${rawPrompt}". Establish main subject and dynamic scene setting with crystal-clear focus, stable cinematography, and rich textural detail. ${styleLock}`;
    } else {
      descriptionAr = `اللقطة رقم ${index + 1} (${dur} ثواني): لقطة تكميلية متصلة بصرياً بالإطار الختامي للقطة السابقة.`;
      cameraMovement = 'Seamless continuation push-in / dynamic subject motion';
      shotPrompt = `[Shot ${index + 1} of ${durationSegments.length} - ${dur}s]: Continuous sequence directly following Shot ${index} for "${rawPrompt}". Must maintain EXACT subject appearance, wardrobe, environment, lighting angle, and color palette from the initial reference frame. Action intensifies smoothly to resolution. ${styleLock}`;
    }

    return {
      shotNumber: index + 1,
      durationSec: dur,
      prompt: shotPrompt,
      descriptionAr,
      cameraMovement,
      requiresImageInput: !isFirstShot && isMultiShot,
      status: 'pending'
    };
  });

  const totalCost = Math.round(totalCalculated * pointsRatePerSecond);

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: rawPrompt.length > 40 ? `${rawPrompt.substring(0, 37)}...` : rawPrompt,
    rawPrompt,
    totalDurationSec: totalCalculated,
    aspectRatio,
    model,
    shots,
    totalEstimatedCostPoints: totalCost,
    styleLock,
    createdAt: Date.now()
  };
}
