import { applyVersionCap, MAX_VERSIONS_PER_ASSET } from '../src/lib/versionHistory.ts';

type Version = { id: string; createdAt: number; isFavorite?: boolean };

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

// Over the real cap: oldest is favorited, the next is not, every other item is favorited.
// Favorites must all survive; the oldest unfavorited item must be the one removed.
{
  const existing: Version[] = [];
  for (let i = 0; i < MAX_VERSIONS_PER_ASSET; i++) {
    existing.push({
      id: `e${i}`,
      createdAt: i + 1,
      isFavorite: i !== 1,
    });
  }
  const newest: Version = {
    id: 'new-fav',
    createdAt: MAX_VERSIONS_PER_ASSET + 10,
    isFavorite: true,
  };
  const { updatedVersions } = applyVersionCap(existing, newest);
  const kept = new Set(updatedVersions.map((v) => v.id));

  for (const v of [...existing, newest]) {
    if (v.isFavorite) assert(kept.has(v.id), `favorite ${v.id} was dropped over the cap`);
  }
  assert(!kept.has('e1'), 'oldest unfavorited item was not dropped');
  assert(updatedVersions.length === MAX_VERSIONS_PER_ASSET, 'cap was not applied by dropping the unfavorited item');
}

// Over the cap with the oldest item unfavorited: that oldest item is dropped, not a newer one.
{
  const existing: Version[] = [];
  for (let i = 0; i < MAX_VERSIONS_PER_ASSET; i++) {
    existing.push({
      id: `u${i}`,
      createdAt: 100 + i,
      isFavorite: false,
    });
  }
  const newest: Version = {
    id: 'new-plain',
    createdAt: 100 + MAX_VERSIONS_PER_ASSET,
    isFavorite: false,
  };
  const { updatedVersions } = applyVersionCap(existing, newest);
  const kept = new Set(updatedVersions.map((v) => v.id));

  assert(!kept.has('u0'), 'oldest unfavorited item was not dropped');
  assert(kept.has('u1'), 'a newer unfavorited item was dropped instead of the oldest');
  assert(kept.has('new-plain'), 'the newest item was dropped instead of the oldest unfavorited');
  assert(updatedVersions.length === MAX_VERSIONS_PER_ASSET, 'result must be capped at MAX_VERSIONS_PER_ASSET');
}

console.log('version cap ok');
