export interface DagStep {
  id: string;
  status: string;
  dependsOn?: string[];
}

/** Steps with no dependsOn field stay chained to the previous step, so old missions keep their order. An explicit empty array means the step can run without waiting. */
export function stepDependencyIds(steps: DagStep[], index: number): string[] {
  const step = steps[index];
  if (!step) return [];
  if (Array.isArray(step.dependsOn)) {
    return step.dependsOn.filter((id) => typeof id === 'string' && id.length > 0 && id !== step.id);
  }
  const prev = index > 0 ? steps[index - 1] : undefined;
  return prev?.id ? [prev.id] : [];
}

/** Index of the next step whose dependencies are already completed. -1 when none is ready. One step at a time, because every step writes the same mission document. */
export function readyStepIndex(steps: DagStep[]): number {
  return steps.findIndex((step, index) => {
    if (step.status === 'completed' || step.status === 'failed') return false;
    return stepDependencyIds(steps, index).every((id) =>
      steps.some((candidate) => candidate.id === id && candidate.status === 'completed')
    );
  });
}
