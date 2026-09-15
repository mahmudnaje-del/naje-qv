export type GatedFeature = 'creativelyAI' | 'najeAgent' | 'najeAd';

export const FEATURE_MIN_TIER: Record<GatedFeature, number> = {
  creativelyAI: 1,
  najeAgent: 2,
  najeAd: 3,
};

export const TIER_UNLOCK_PACKAGE: Record<number, string> = {
  1: 'pkg_5',
  2: 'pkg_10',
  3: 'pkg_20',
};

// Client-side check — purely for UX (skip an unnecessary network round trip
// and show the paywall immediately). The server enforces this for real on
// every gated endpoint regardless of what this function returns.
export function hasFeatureAccess(user: any, feature: GatedFeature): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const tier = Number(user.highestPurchasedTier || 0);
  return tier >= FEATURE_MIN_TIER[feature];
}
