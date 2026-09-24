import type { IdentSlot, MotionDuration } from '../../lib/motionStudio';

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** Plan titles/bodies for the UI. The Omni prompt keeps computeMotionPlan text. */
export function localizedPlan(
  t: TFn,
  slot: IdentSlot,
  duration: MotionDuration,
  params: { motion: string; logo: string; cta: string }
) {
  return [0, 1, 2].map((i) => ({
    title: t(`motion.plan.${slot}.${duration}.${i}.title`),
    body: t(`motion.plan.${slot}.${duration}.${i}.body`, params),
  }));
}
