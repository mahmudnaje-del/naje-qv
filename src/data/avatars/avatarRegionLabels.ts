// Arabic display labels for avatar region groupings.
// The underlying `visualRegion` field on each avatar (in avatarRegistry.ts) stays in English —
// this is a display-only translation layer, used purely for UI rendering.
export const REGION_LABEL_AR: Record<string, string> = {
  "MENA / West Asia": "الشرق الأوسط وغرب آسيا",
  "Sub-Saharan Africa": "أفريقيا جنوب الصحراء",
  "South Asia": "جنوب آسيا",
  "East / Southeast Asia": "شرق وجنوب شرق آسيا",
  "Europe": "أوروبا",
  "North America": "أمريكا الشمالية",
  "Latin America / Caribbean": "أمريكا اللاتينية والكاريبي",
  "Oceania / Global Mix": "أوقيانوسيا ومزيج عالمي",
};

export function getRegionLabelAr(englishRegionKey: string): string {
  return REGION_LABEL_AR[englishRegionKey] || englishRegionKey;
}
