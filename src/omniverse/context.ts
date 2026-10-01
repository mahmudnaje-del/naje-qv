export type ContextSource =
  | 'instruction'
  | 'project_instruction'
  | 'constraint'
  | 'pinned'
  | 'memory'
  | 'preference'
  | 'inferred';

export interface ContextPiece {
  source: ContextSource;
  text: string;
}

const RANK: Record<ContextSource, number> = {
  instruction: 1,
  project_instruction: 2,
  constraint: 3,
  pinned: 4,
  memory: 5,
  preference: 6,
  inferred: 7,
};

export function resolveContext(pieces: ContextPiece[]): { chosen: ContextPiece | null; conflicts: ContextPiece[] } {
  const ranked = [...pieces].filter((piece) => piece.text.trim()).sort((a, b) => RANK[a.source] - RANK[b.source]);
  const chosen = ranked[0] || null;
  const conflicts = chosen
    ? ranked.filter((piece) => piece !== chosen && piece.text.trim() !== chosen.text.trim() && RANK[piece.source] > RANK[chosen.source])
    : [];
  return { chosen, conflicts };
}
