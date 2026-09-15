export interface AssetVersion<T = any> {
  id: string;
  assetId?: string;
  versionNumber: number;
  data: T;
  createdAt: number;
  isFavorite?: boolean;
  pinned?: boolean;
  title?: string;
  summary?: string;
}

export const MAX_VERSIONS_PER_ASSET = 20;

/**
 * Applies a strict maximum version limit to an asset's version history list.
 *
 * Rules:
 * 1. Favorited versions (isFavorite === true or pinned === true) are NEVER pruned automatically.
 * 2. If the total version count exceeds MAX_VERSIONS_PER_ASSET, the oldest unfavorited versions are pruned.
 * 3. If all versions are favorited and limit is reached, returns a warning flag without destroying favorites.
 */
export function applyVersionCap<T extends { isFavorite?: boolean; pinned?: boolean; createdAt?: number }>(
  existingVersions: T[],
  newVersion: T,
  cap: number = MAX_VERSIONS_PER_ASSET
): {
  updatedVersions: T[];
  archivedCount: number;
  allFavoritesCapHit: boolean;
} {
  const combined = [...existingVersions, newVersion];
  
  if (combined.length <= cap) {
    return {
      updatedVersions: combined,
      archivedCount: 0,
      allFavoritesCapHit: false
    };
  }

  // Count favorited versions
  const favoritedCount = combined.filter(v => v.isFavorite || v.pinned).length;
  
  // If all are favorited and we exceed cap
  if (favoritedCount >= cap && (newVersion.isFavorite || newVersion.pinned)) {
    return {
      updatedVersions: combined.slice(-cap),
      archivedCount: combined.length - cap,
      allFavoritesCapHit: true
    };
  }

  // We need to prune (combined.length - cap) non-favorited versions, starting from the oldest
  const excess = combined.length - cap;
  let prunedCount = 0;
  
  const result: T[] = [];
  
  // Sort oldest to newest for evaluation
  const chronological = [...combined].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  for (const v of chronological) {
    const isProtected = v.isFavorite || v.pinned;
    if (!isProtected && prunedCount < excess) {
      // Prune / Archive this oldest unfavorited version
      prunedCount++;
      continue;
    }
    result.push(v);
  }

  // Ensure result does not exceed cap if possible
  const finalVersions = result.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return {
    updatedVersions: finalVersions,
    archivedCount: prunedCount,
    allFavoritesCapHit: false
  };
}

export function toggleFavoriteVersion<T extends Record<string, any>>(
  versions: T[],
  versionIndexOrId: number | string
): T[] {
  return versions.map((v: any, idx: number) => {
    if (idx === versionIndexOrId || v.id === versionIndexOrId) {
      return {
        ...v,
        isFavorite: !v.isFavorite
      };
    }
    return v;
  });
}
