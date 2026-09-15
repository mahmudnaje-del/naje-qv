import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface WaitForGenerationJobOptions {
  jobId: string;
  isVideo?: boolean;
  onData?: (data: any) => void;
  onProgress?: (progress: number, stepLabel?: string) => void;
}

/**
 * Standard waiter contract for asynchronous generation jobs.
 * - 15s timeout if job document does not exist
 * - 180s (non-video) or 360s (video) generation timeout
 * - Cleans up listeners and timers on settle
 * - Resolves on 'completed' or 'model_upgrade_suggestion'
 * - Rejects on 'failed' or snapshot error
 */
export function waitForGenerationJob({
  jobId,
  isVideo = false,
  onData,
  onProgress
}: WaitForGenerationJobOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubJob: (() => void) | null = null;
    let notExistTimer: any = null;
    let timeoutTimer: any = null;

    const cleanup = () => {
      if (notExistTimer) {
        clearTimeout(notExistTimer);
        notExistTimer = null;
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      if (unsubJob) {
        unsubJob();
        unsubJob = null;
      }
    };

    const safeResolve = (val: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(val);
    };

    const safeReject = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    // 15-second missing doc timeout
    notExistTimer = setTimeout(() => {
      safeReject(new Error('تعذّر تتبع مهمة التوليد.'));
    }, 15000);

    // 180s non-video or 360s video timeout
    const maxDurationMs = isVideo ? 360000 : 180000;
    timeoutTimer = setTimeout(() => {
      safeReject(new Error('انتهت مهلة التوليد. إذا تم خصم نقاط بالخطأ ستُعاد تلقائياً.'));
    }, maxDurationMs);

    unsubJob = onSnapshot(
      doc(db, 'generation_jobs', jobId),
      (snap) => {
        if (!snap.exists()) return;

        if (notExistTimer) {
          clearTimeout(notExistTimer);
          notExistTimer = null;
        }

        const jobData: any = snap.data();
        if (onData) onData(jobData);
        if (onProgress && jobData.progress !== undefined) {
          onProgress(jobData.progress, jobData.stepLabel);
        }

        if (jobData.action === 'model_upgrade_suggestion') {
          safeResolve(jobData);
          return;
        }

        if (jobData.status === 'completed') {
          safeResolve(jobData);
          return;
        }

        if (jobData.status === 'failed') {
          safeReject(new Error(jobData.error || 'تعذّر إكمال التوليد. لم يتم خصم أي نقاط.'));
          return;
        }
      },
      (err) => {
        console.error('generation_jobs snapshot error:', err);
        safeReject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}
