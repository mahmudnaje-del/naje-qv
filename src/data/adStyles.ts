export interface AdStyle {
  id: string;
  name: string;
  desc: string;
  prompt: string;
  gradient: [string, string];
  accent: string;
}

/** Advertising-only visual languages — not the old cinematic template library. */
export const AD_STYLES: AdStyle[] = [
  {
    id: 'hero_product',
    name: 'استعراض منتج فاخر',
    desc: 'المنتج هو النجم: إضاءة استوديو، حركة بطيئة، لمسة فاخرة.',
    prompt: 'Premium hero product commercial: the product is the star, slow orbital or push-in camera, jewel-like studio lighting, tactile materials, luxury color grade, no clutter.',
    gradient: ['#2a1810', '#d4a574'],
    accent: '#e8b86d',
  },
  {
    id: 'lifestyle',
    name: 'لايف ستايل يومي',
    desc: 'لحظة حياة حقيقية مع المنتج داخلها بشكل طبيعي.',
    prompt: 'Authentic lifestyle commercial: natural daylight, real-world environment, product used casually by the talent, warm unforced motion, documentary-adjacent but polished.',
    gradient: ['#1a2a22', '#7dcea0'],
    accent: '#7dcea0',
  },
  {
    id: 'ugc',
    name: 'محتوى عفوي UGC',
    desc: 'كاميرا يد، طاقة تيك توك، إحساس صديق يوصي بالمنتج.',
    prompt: 'UGC / creator-style ad: handheld phone camera, slightly imperfect framing, direct-to-camera energy, authentic social-proof vibe, high conversion, not cinematic artifice.',
    gradient: ['#1c1428', '#c084fc'],
    accent: '#c084fc',
  },
  {
    id: 'tiktok_hook',
    name: 'هوك تيك توك',
    desc: 'الثلاث ثوانٍ الأولى توقف التمرير ثم تُغلق البيع.',
    prompt: 'Vertical social hook ad: aggressive first-frame attention grab, fast rhythmic motion, on-screen product payoff, punchy pacing built for mute-autoplay then sound-on.',
    gradient: ['#1a1020', '#fb7185'],
    accent: '#fb7185',
  },
  {
    id: 'brand_story',
    name: 'قصة علامة عاطفية',
    desc: 'سرد قصير يربط المنتج بشعور لا يُنسى.',
    prompt: 'Emotional brand-story commercial: intimate close-ups, restrained camera, music-led pacing, a human moment that resolves on the product as meaning not just object.',
    gradient: ['#141824', '#93c5fd'],
    accent: '#93c5fd',
  },
  {
    id: 'before_after',
    name: 'قبل وبعد',
    desc: 'تحول واضح من مشكلة إلى نتيجة مع المنتج.',
    prompt: 'Before-and-after commercial: visually readable transformation, matched framing, the product as the causal bridge, satisfying reveal, clean continuity of talent and space.',
    gradient: ['#1a1a14', '#fbbf24'],
    accent: '#fbbf24',
  },
  {
    id: 'fashion_editorial',
    name: 'أزياء إديتوريال',
    desc: 'موضة عالية، مشية واثقة، ضوء مجلّة.',
    prompt: 'High-fashion editorial commercial: runway or studio strobe, confident body language, fabric motion, luxury catalogue energy, fashion-film color.',
    gradient: ['#1a1216', '#f9a8d4'],
    accent: '#f9a8d4',
  },
  {
    id: 'tech_minimal',
    name: 'تقني مينيمال',
    desc: 'سطح نظيف، إضاءة باردة، ابتكار هادئ.',
    prompt: 'Tech-minimal commercial: seamless surfaces, cool key light, precise macro of interface or material, silent luxury of engineering, restrained motion graphics feel without fake UI glitches.',
    gradient: ['#0f1720', '#67e8f9'],
    accent: '#67e8f9',
  },
  {
    id: 'food_macro',
    name: 'طعام ماكرو',
    desc: 'بخار، لمعان، لقطة مقربة تشهي.',
    prompt: 'Macro food commercial: extreme close-up texture, steam and glisten, slow pour or bite, rich saturated appetite color, shallow focus, sensory ASMR-adjacent motion.',
    gradient: ['#1c140c', '#fb923c'],
    accent: '#fb923c',
  },
  {
    id: 'auto_cinematic',
    name: 'سيارات سينمائي',
    desc: 'حركة معدنية، انعكاسات، طريق أو استوديو درامي.',
    prompt: 'Automotive cinematic commercial: low tracking shots, paint reflections, road spray or studio turntable, powerful engine-body language, dusk or night drama.',
    gradient: ['#101418', '#94a3b8'],
    accent: '#94a3b8',
  },
  {
    id: 'beauty_slowmo',
    name: 'جمال وحركة بطيئة',
    desc: 'بشرة، عطر، شعر، رذاذ بطيء كالحرير.',
    prompt: 'Beauty slow-motion commercial: skin texture, hair and fabric in 120fps-feel motion, mist or perfume spray, satin light, intimate glamour without uncanny faces.',
    gradient: ['#1a1020', '#e879f9'],
    accent: '#e879f9',
  },
  {
    id: 'launch_drop',
    name: 'إطلاق منتج',
    desc: 'كشف درامي كإطلاق عالمي.',
    prompt: 'Product-launch drop commercial: dark stage, theatrical reveal, rising energy, logo-safe negative space at the end card moment, event-scale lighting.',
    gradient: ['#120c18', '#a78bfa'],
    accent: '#a78bfa',
  },
  {
    id: 'testimonial',
    name: 'شهادة عميل',
    desc: 'وجه يتحدث بصدق ثم يُظهر المنتج.',
    prompt: 'Testimonial commercial: natural talking-head then cutaway of product in use, trustworthy eye-level lens, soft window light, sincere not salesy.',
    gradient: ['#121c18', '#6ee7b7'],
    accent: '#6ee7b7',
  },
  {
    id: 'offer_urgency',
    name: 'عرض محدود',
    desc: 'إيقاع سريع يضغط لاتخاذ قرار.',
    prompt: 'Limited-offer commercial: urgent but premium pacing, clear product hero, countdown energy without cheap stock-graphics, ends on a decisive product hold.',
    gradient: ['#1c1010', '#f87171'],
    accent: '#f87171',
  },
  {
    id: 'sport_energy',
    name: 'رياضي عالي الطاقة',
    desc: 'عرق، انفجار حركة، منتج أداء.',
    prompt: 'Sports-energy commercial: kinetic tracking, grit and sweat, explosive motion, performance product integration, high-contrast athletic grade.',
    gradient: ['#14120c', '#facc15'],
    accent: '#facc15',
  },
  {
    id: 'family_warm',
    name: 'عائلي دافئ',
    desc: 'بيت، ضحك، منتج يُسهّل اللحظة.',
    prompt: 'Warm family commercial: golden indoor practicals, multi-generational natural interaction, product as a helper in a lived-in home, gentle humor.',
    gradient: ['#1c180e', '#f6d58a'],
    accent: '#f6d58a',
  },
  {
    id: 'night_city',
    name: 'مدينة ليلية فاخرة',
    desc: 'نيون مبلل، أناقة حضرية.',
    prompt: 'Night-city luxury commercial: wet asphalt reflections, refined neon, talent walking with product, cosmopolitan after-dark glamour.',
    gradient: ['#0c1020', '#818cf8'],
    accent: '#818cf8',
  },
  {
    id: 'clean_studio',
    name: 'استوديو أبيض نظيف',
    desc: 'خلفية سيلس، ظل ناعم، كتالوج راقٍ.',
    prompt: 'Clean white-studio commercial: seamless cyclorama, soft shadow, catalog-grade product isolation, elegant simple camera move, premium e-commerce hero.',
    gradient: ['#1a1a1c', '#e7e5e4'],
    accent: '#d6d3d1',
  },
  {
    id: 'travel_hospitality',
    name: 'سفر وضيافة',
    desc: 'أفق، لمسة فندق، دعوة للذهاب.',
    prompt: 'Travel and hospitality commercial: wide establishing into intimate amenity details, golden hour or lobby glow, wanderlust without stock cliché.',
    gradient: ['#102028', '#5eead4'],
    accent: '#5eead4',
  },
  {
    id: 'app_in_hand',
    name: 'تطبيق في اليد',
    desc: 'هاتف حقيقي، واجهة مقروءة، استخدام واضح.',
    prompt: 'App-in-hand commercial: photoreal smartphone held by talent, screen content readable and correct if shown, natural thumb interaction, lifestyle around the device.',
    gradient: ['#10141c', '#38bdf8'],
    accent: '#38bdf8',
  },
];

export function getAdStyle(id: string | null | undefined): AdStyle | null {
  if (!id) return null;
  return AD_STYLES.find((s) => s.id === id) || null;
}
