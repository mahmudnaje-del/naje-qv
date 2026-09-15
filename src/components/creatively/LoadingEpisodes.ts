export type Frame = {
  d: number;
  oX?: number; oY?: number; oF?: boolean; 
  oT_ar?: string; oT_en?: string;
  oPose?: 'idle' | 'walk' | 'work' | 'wave' | 'hurt' | 'celebrate' | 'jump';
  aX?: number; aY?: number; aF?: boolean; 
  aT_ar?: string; aT_en?: string;
  aPose?: 'idle' | 'walk' | 'work' | 'wave' | 'hurt' | 'celebrate' | 'jump';
  pT?: 'apple' | 'coffee' | 'wand' | 'paint' | 'rocket' | 'camera' | 'grid' | 'none';
  pX?: number; pY?: number; pR?: number;
};

export const getEpisodes = (): Frame[][] => [
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0, oPose: 'idle', aPose: 'work' },
    { d: 4500, oT_ar: 'آرثر، لماذا جعلت لون السماء في التصميم أخضر؟', oT_en: 'Arthur, why did you make the sky green in the design?' },
    { d: 4500, aT_ar: 'لأن الأخضر يرمز للنمو. ألا تريد أن ينمو التطبيق؟', aT_en: 'Green represents growth. Don\'t you want the app to grow?', aPose: 'celebrate', pT: 'paint', pX: 40, pY: -10 },
    { d: 4500, oT_ar: 'نعم، ولكن السماء ليست خضراء!', oT_en: 'Yes, but the sky isn\'t green!', oPose: 'work' },
    { d: 4500, aT_ar: 'ربما في كوكبك. في عالم الإبداع، السماء كما أريدها أنا.', aT_en: 'Maybe on your planet. In the creative world, the sky is what I want it to be.', aPose: 'idle' },
    { d: 8000, oT_ar: 'أعدها زرقاء قبل أن يظنوا أننا نبيع خضروات.', oT_en: 'Make it blue before they think we sell vegetables.', oPose: 'idle', pT: 'none' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0, aPose: 'idle' },
    { d: 4500, oT_ar: 'هل انتهيت من رسم الشعار؟', oT_en: 'Are you done drawing the logo?' },
    { d: 4500, aT_ar: 'نعم، رسمت أسداً يرتدي نظارة شمسية ويقرأ كتاباً.', aT_en: 'Yes, I drew a lion wearing sunglasses and reading a book.', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'هذا تطبيق للمحاماة!', oT_en: 'This is a law firm app!', oPose: 'work' },
    { d: 4500, aT_ar: 'بالضبط! الأسد للقوة، والنظارة للعدالة العمياء.', aT_en: 'Exactly! Lion for power, sunglasses for blind justice.', aPose: 'wave' },
    { d: 4500, oT_ar: 'وماذا عن الكتاب؟', oT_en: 'And what about the book?' },
    { d: 8000, aT_ar: 'إنه يقرأ أتعابه. أليس هذا ما يفعله المحامون؟', aT_en: 'He\'s reading his fees. Isn\'t that what lawyers do?', aPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, aT_ar: 'عمر، لقد قمت بتبسيط واجهة المستخدم كما طلبت.', aT_en: 'Omar, I simplified the user interface as requested.', aPose: 'work' },
    { d: 4500, oT_ar: 'رائع! أين الأزرار؟', oT_en: 'Great! Where are the buttons?', oPose: 'idle' },
    { d: 4500, aT_ar: 'أزلتها. الأزرار تسبب التوتر. المستخدم الآن يتأمل الشاشة فقط.', aT_en: 'Removed them. Buttons cause stress. The user just meditates on the screen now.', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'وكيف سيتفاعل مع التطبيق؟', oT_en: 'And how will they interact with the app?', oPose: 'work' },
    { d: 4500, aT_ar: 'بالتخاطر العاطفي. التصميم الجيد لا يحتاج إلى نقر.', aT_en: 'Emotional telepathy. Good design needs no clicking.', aPose: 'wave' },
    { d: 8000, oT_ar: 'أعد الأزرار فوراً، نحن لا نبيع التأمل!', oT_en: 'Bring back the buttons immediately, we don\'t sell meditation!', oPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, oT_ar: 'ما هذا الخط الذي استخدمته؟ إنه بالكاد يُقرأ!', oT_en: 'What is this font you used? It\'s barely readable!', oPose: 'work' },
    { d: 4500, aT_ar: 'إنه "خط الغموض الأنيق". يجبر المستخدم على التركيز العميق.', aT_en: 'It\'s "Elegant Mystery". Forces the user to focus deeply.', aPose: 'idle' },
    { d: 4500, oT_ar: 'إنه يجبر المستخدم على الذهاب لطبيب العيون!', oT_en: 'It forces the user to visit the eye doctor!', oPose: 'wave' },
    { d: 4500, aT_ar: 'الفن الحقيقي يتطلب تضحية.', aT_en: 'True art requires sacrifice.', aPose: 'celebrate' },
    { d: 8000, oT_ar: 'استخدم خطاً طبيعياً وإلا ضحيت بك.', oT_en: 'Use a normal font or I will sacrifice you.', oPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, aT_ar: 'لقد أضفت لمسة سحرية للتصميم: موسيقى حزينة تعمل تلقائياً.', aT_en: 'Added a magic touch: sad music playing automatically.', aPose: 'work', pT: 'wand', pX: 40, pY: -10 },
    { d: 4500, oT_ar: 'لماذا موسيقى حزينة؟', oT_en: 'Why sad music?', oPose: 'work' },
    { d: 4500, aT_ar: 'لتجعلهم يقدرون جماليات الألوان الداكنة التي اخترناها.', aT_en: 'To make them appreciate the beauty of our dark colors.', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'سيغلقون الموقع فوراً ويبكون!', oT_en: 'They will close the site immediately and cry!', oPose: 'wave' },
    { d: 4500, aT_ar: 'هذا يسمى "التفاعل العاطفي العميق". أليس هذا هدفنا؟', aT_en: 'That\'s "Deep Emotional Interaction". Isn\'t that our goal?', aPose: 'idle' },
    { d: 8000, oT_ar: 'هدفنا أن يشتروا المنتج، لا أن يدخلوا في اكتئاب!', oT_en: 'Our goal is for them to buy the product, not get depressed!', pT: 'none', oPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, oT_ar: 'طلبت منك صورة احترافية للموظفين، لماذا يرتدون جميعاً قبعات قراصنة؟', oT_en: 'I asked for a pro team photo, why are they all wearing pirate hats?', oPose: 'work' },
    { d: 4500, aT_ar: 'لأنها شركة ناشئة (Startup)، والقراصنة هم رواد الأعمال الأصليون!', aT_en: 'Because it\'s a startup, and pirates are the original entrepreneurs!', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'نحن شركة تأمين!', oT_en: 'We are an insurance company!', oPose: 'jump' },
    { d: 4500, aT_ar: 'تأمين السفن؟', aT_en: 'Ship insurance?', aPose: 'wave' },
    { d: 8000, oT_ar: 'تأمين على الحياة! أزل القبعات فوراً.', oT_en: 'Life insurance! Remove the hats immediately.', oPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, aT_ar: 'عمر، هل يمكنني أخذ إجازة؟', oT_en: 'Omar, can I take a vacation?', aPose: 'idle' },
    { d: 4500, oT_ar: 'إجازة؟ أنت مساعد ذكي!', oT_en: 'Vacation? You are a smart assistant!', oPose: 'work' },
    { d: 4500, aT_ar: 'نعم، ولكن الإبداع المستمر يرهق خوارزمياتي العاطفية.', aT_en: 'Yes, but constant creativity exhausts my emotional algorithms.', aPose: 'wave' },
    { d: 4500, oT_ar: 'ليس لديك خوارزميات عاطفية.', oT_en: 'You don\'t have emotional algorithms.', oPose: 'idle' },
    { d: 8000, aT_ar: 'هذا ما تقوله أنت! لقد رسمت دمعة رقمية للتو.', aT_en: 'That\'s what you say! I just drew a digital tear.', aPose: 'hurt' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, oT_ar: 'التصميم يبدو فارغاً جداً، أليس كذلك؟', oT_en: 'The design looks very empty, doesn\'t it?', oPose: 'idle' },
    { d: 4500, aT_ar: 'هذا يسمى "المساحة السلبية"، يا عمر. إنها تتيح للتصميم أن يتنفس.', aT_en: 'That\'s called "Negative Space", Omar. It lets the design breathe.', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'لكن المساحة السلبية تشغل 90% من الشاشة!', oT_en: 'But the negative space is 90% of the screen!', oPose: 'work' },
    { d: 4500, aT_ar: 'نحن نبيع الهدوء والسكينة.', aT_en: 'We are selling peace and tranquility.', aPose: 'wave' },
    { d: 8000, oT_ar: 'بل نبيع الهواء. أضف بعض المحتوى!', oT_en: 'We are selling air. Add some content!', oPose: 'jump' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, aT_ar: 'لقد غيرت لون خلفية الموقع بناءً على حالة الطقس للمستخدم.', aT_en: 'I changed the background color based on the user\'s weather.', aPose: 'work' },
    { d: 4500, oT_ar: 'فكرة جيدة. وماذا لو كان الطقس عاصفاً؟', oT_en: 'Good idea. And what if the weather is stormy?', oPose: 'idle' },
    { d: 4500, aT_ar: 'الشاشة تهتز وتومض باللون الرمادي، ويختفي المحتوى!', aT_en: 'The screen shakes, flashes gray, and content disappears!', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'هذا مرعب! المستخدم سيظن أن هاتفه تعطل.', oT_en: 'That\'s terrifying! The user will think their phone broke.', oPose: 'wave' },
    { d: 8000, aT_ar: 'لكنه واقعي جداً!', aT_en: 'But it\'s very realistic!', aPose: 'idle' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, oT_ar: 'طلبت منك أيقونة لزر "تواصل معنا"، لماذا وضعت صورة حمامة؟', oT_en: 'I asked for a "Contact Us" icon, why did you put a pigeon?', oPose: 'work' },
    { d: 4500, aT_ar: 'الحمامة الزاجلة هي أقدم وسيلة تواصل. لمسة كلاسيكية.', aT_en: 'Carrier pigeon is the oldest communication. Classic touch.', aPose: 'celebrate' },
    { d: 4500, oT_ar: 'ضع أيقونة هاتف أو رسالة مثل باقي البشر.', oT_en: 'Put a phone or message icon like the rest of humanity.', oPose: 'idle' },
    { d: 8000, aT_ar: 'البشر يفتقرون للرومانسية. سأغيرها إلى هاتف أرضي من السبعينات.', aT_en: 'Humans lack romance. I\'ll change it to a 70s landline.', aPose: 'wave' }
  ],
  [
    { d: 1000, oX: -110, oY: -80, oF: true, aX: 30, aY: 0 },
    { d: 4500, aT_ar: 'عمر، لقد استلهمت التصميم الجديد من لوحات بيكاسو.', aT_en: 'Omar, I got inspired by Picasso paintings for the new design.', aPose: 'work' },
    { d: 4500, oT_ar: 'بيكاسو؟ ولكن هذا متجر لبيع الأحذية!', oT_en: 'Picasso? But this is a shoe store!', oPose: 'wave' },
    { d: 4500, aT_ar: 'نعم، لذا رسمت حذاءً بعين واحدة ويبتسم من الجانب.', aT_en: 'Yes, so I drew a one-eyed shoe smiling from the side.', aPose: 'celebrate', pT: 'paint', pX: 40, pY: -10 },
    { d: 8000, oT_ar: 'الناس يريدون حذاءً يرتدونه، لا أن يسألوه عن رأيه في الحياة!', oT_en: 'People want a shoe to wear, not to ask it about life!', oPose: 'idle', pT: 'none' }
  ]
];
