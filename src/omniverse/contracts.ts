export type ArtifactKind = 'text' | 'image' | 'video' | 'document' | 'code' | 'ad' | 'cv' | 'prompt' | 'brand';

export type ArtifactStatus = 'draft' | 'ready' | 'failed';

export interface NajeArtifact {
  id: string;
  kind: ArtifactKind;
  title: string;
  projectId?: string;
  parentId?: string;
  sourceStudio: string;
  createdAt: number;
  status: ArtifactStatus;
  costPoints?: number;
}

export type JobPhase = 'queued' | 'running' | 'paused' | 'needs_approval' | 'completed' | 'failed' | 'cancelled';

export interface NajeJob {
  id: string;
  title: string;
  phase: JobPhase;
  studio: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  spentPoints: number;
  maxPoints?: number;
}

const ARTIFACTS_KEY = 'naje.omniverse.artifacts.v1';
const JOBS_KEY = 'naje.omniverse.jobs.v1';

function readList<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items.slice(0, 200)));
}

export function rememberArtifact(input: Omit<NajeArtifact, 'id' | 'createdAt'> & { id?: string }): NajeArtifact {
  const artifact: NajeArtifact = {
    id: input.id || `art_${Date.now().toString(36)}`,
    createdAt: Date.now(),
    kind: input.kind,
    title: input.title.slice(0, 180),
    projectId: input.projectId,
    parentId: input.parentId,
    sourceStudio: input.sourceStudio,
    status: input.status,
    costPoints: input.costPoints,
  };
  const next = [artifact, ...readList<NajeArtifact>(ARTIFACTS_KEY).filter((item) => item.id !== artifact.id)];
  writeList(ARTIFACTS_KEY, next);
  return artifact;
}

export function listArtifacts(projectId?: string): NajeArtifact[] {
  const items = readList<NajeArtifact>(ARTIFACTS_KEY);
  return projectId ? items.filter((item) => item.projectId === projectId) : items;
}

export function artifactLineage(id: string): NajeArtifact[] {
  const items = readList<NajeArtifact>(ARTIFACTS_KEY);
  const byId = new Map(items.map((item) => [item.id, item]));
  const chain: NajeArtifact[] = [];
  let cursor = byId.get(id);
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.push(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return chain;
}

export function rememberJob(input: Omit<NajeJob, 'id' | 'createdAt' | 'updatedAt' | 'spentPoints'> & { id?: string; spentPoints?: number }): NajeJob {
  const job: NajeJob = {
    id: input.id || `job_${Date.now().toString(36)}`,
    title: input.title.slice(0, 180),
    phase: input.phase,
    studio: input.studio,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    error: input.error,
    spentPoints: input.spentPoints ?? 0,
    maxPoints: input.maxPoints,
  };
  const next = [job, ...readList<NajeJob>(JOBS_KEY).filter((item) => item.id !== job.id)];
  writeList(JOBS_KEY, next);
  return job;
}

export function updateJob(id: string, patch: Partial<Pick<NajeJob, 'phase' | 'error' | 'spentPoints'>>): NajeJob | null {
  const items = readList<NajeJob>(JOBS_KEY);
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const nextJob = { ...current, ...patch, updatedAt: Date.now() };
  writeList(JOBS_KEY, items.map((item) => (item.id === id ? nextJob : item)));
  return nextJob;
}
