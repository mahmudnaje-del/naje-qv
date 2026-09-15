// Arabic display labels for location categories.
// The underlying `category` field on each location (in locationRegistry.ts) stays in English —
// display-only translation layer.
export const CATEGORY_LABEL_AR: Record<string, string> = {
  "Residential": "سكني",
  "Corporate & Business": "أعمال وشركات",
  "Retail & Shopping": "تجزئة وتسوق",
  "Food & Hospitality": "طعام وضيافة",
  "Urban & City": "حضري ومدن",
  "Education": "تعليم",
  "Healthcare": "رعاية صحية",
  "Fitness & Sports": "لياقة ورياضة",
  "Beauty & Fashion": "جمال وأزياء",
  "Technology & AI": "تقنية وذكاء اصطناعي",
  "Travel & Hotels": "سفر وفنادق",
  "Nature & Outdoors": "طبيعة وأماكن مفتوحة",
  "Automotive & Transportation": "سيارات ومواصلات",
  "Studio & Creative Production": "استوديو وإنتاج إبداعي",
  "Community & Family": "مجتمع وعائلة",
  "Additional Global Commercial": "تجاري عالمي إضافي",
};

export function getCategoryLabelAr(englishCategory: string): string {
  return CATEGORY_LABEL_AR[englishCategory] || englishCategory;
}
