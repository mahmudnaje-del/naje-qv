export type FieldType = 'text' | 'textarea' | 'radio' | 'multicheckbox' | 'image_upload';

export interface FormField {
  id: string;
  labelAr: string;
  labelEn: string;
  type: FieldType;
  options?: { id: string; labelAr: string; labelEn: string }[];
  placeholderAr?: string;
  placeholderEn?: string;
}

export const FORM_CONFIGS: Record<string, FormField[]> = {
  horizontal_logo: [
    { id: 'projectName', labelAr: 'اسم الشركة/المشروع', labelEn: 'Company/Project Name', type: 'text' },
    { id: 'logoText', labelAr: 'الشعار النصي المطلوب', labelEn: 'Required Logo Text', type: 'text' },
    { id: 'slogan', labelAr: 'السلوغان (إن وجد)', labelEn: 'Slogan (if any)', type: 'text' },
    { id: 'industry', labelAr: 'مجال العمل', labelEn: 'Industry/Field of Work', type: 'text' },
    { id: 'designStyle', labelAr: 'أسلوب التصميم', labelEn: 'Design Style', type: 'text' },
    { id: 'logoNature', labelAr: 'طبيعة الشعار', labelEn: 'Logo Nature', type: 'text' },
    { id: 'preferredColors', labelAr: 'الألوان المفضلة', labelEn: 'Preferred Colors', type: 'text' },
    { id: 'forbiddenColors', labelAr: 'الألوان الممنوعة', labelEn: 'Forbidden Colors', type: 'text' },
    { id: 'referenceLogos', labelAr: 'أمثلة شعارات أعجبتك', labelEn: 'Logos you liked (Examples)', type: 'textarea' },
    { id: 'additionalDetails', labelAr: 'تفاصيل إضافية', labelEn: 'Additional Details', type: 'textarea' },
    { id: 'includeSymbol', labelAr: 'هل تريد رمزًا مع النص؟', labelEn: 'Include a symbol with text?', type: 'radio', options: [
        { id: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
        { id: 'no', labelAr: 'لا', labelEn: 'No' }
    ]},
    { id: 'specificSymbol', labelAr: 'هل يوجد رمز معين يجب استخدامه؟', labelEn: 'Is there a specific symbol to use?', type: 'text' },
    { id: 'targetAudience', labelAr: 'الجمهور المستهدف', labelEn: 'Target Audience', type: 'text' }
  ],
  logo_and_identity: [
    { id: 'projectName', labelAr: 'اسم المشروع', labelEn: 'Project Name', type: 'text' },
    { id: 'industry', labelAr: 'مجال العمل', labelEn: 'Industry', type: 'text' },
    { id: 'visionMission', labelAr: 'الرؤية والرسالة', labelEn: 'Vision & Mission', type: 'textarea' },
    { id: 'targetAudience', labelAr: 'الجمهور المستهدف', labelEn: 'Target Audience', type: 'text' },
    { id: 'logoNature', labelAr: 'طبيعة الشعار', labelEn: 'Logo Nature', type: 'text' },
    { id: 'preferredColors', labelAr: 'الألوان المفضلة', labelEn: 'Preferred Colors', type: 'text' },
    { id: 'referenceLogos', labelAr: 'أمثلة مرجعية', labelEn: 'Reference Examples', type: 'textarea' },
    { id: 'identityStyle', labelAr: 'أسلوب الهوية', labelEn: 'Identity Style', type: 'text' },
    { id: 'primaryColors', labelAr: 'الألوان الرئيسية', labelEn: 'Primary Colors', type: 'text' },
    { id: 'preferredFonts', labelAr: 'الخطوط المفضلة (اختياري)', labelEn: 'Preferred Fonts', type: 'text' },
    { id: 'needBrandGuidelines', labelAr: 'هل تحتاج دليل استخدام؟', labelEn: 'Do you need Brand Guidelines?', type: 'radio', options: [
        { id: 'yes', labelAr: 'نعم', labelEn: 'Yes' }, { id: 'no', labelAr: 'لا', labelEn: 'No' }
    ]},
    { id: 'requiredOutputs', labelAr: 'المخرجات المطلوبة', labelEn: 'Required Outputs', type: 'multicheckbox', options: [
        { id: 'business_card', labelAr: 'بطاقة أعمال', labelEn: 'Business Card' },
        { id: 'letterhead', labelAr: 'ورقة رسمية', labelEn: 'Letterhead' },
        { id: 'email_sig', labelAr: 'توقيع بريد إلكتروني', labelEn: 'Email Signature' },
        { id: 'social_templates', labelAr: 'قوالب سوشال ميديا', labelEn: 'Social Media Templates' },
        { id: 'brand_guidelines', labelAr: 'ملف Brand Guidelines', labelEn: 'Brand Guidelines File' }
    ]}
  ],
  full: [
    { id: 'projectName', labelAr: 'اسم العلامة التجارية', labelEn: 'Brand Name', type: 'text' },
    { id: 'industry', labelAr: 'النشاط التجاري', labelEn: 'Commercial Activity', type: 'text' },
    { id: 'visionMission', labelAr: 'الرؤية والرسالة', labelEn: 'Vision & Mission', type: 'textarea' },
    { id: 'targetAudience', labelAr: 'الجمهور المستهدف', labelEn: 'Target Audience', type: 'text' },
    { id: 'brandPersonality', labelAr: 'شخصية العلامة التجارية', labelEn: 'Brand Personality', type: 'text' },
    { id: 'coreValues', labelAr: 'القيم الأساسية', labelEn: 'Core Values', type: 'textarea' },
    { id: 'mainCompetitors', labelAr: 'المنافسون الرئيسيون', labelEn: 'Main Competitors', type: 'textarea' },
    { id: 'requiredOutputs', labelAr: 'عناصر الهوية المطلوبة', labelEn: 'Required Identity Elements', type: 'multicheckbox', options: [
        { id: 'logo', labelAr: 'شعار', labelEn: 'Logo' },
        { id: 'colors', labelAr: 'ألوان', labelEn: 'Colors' },
        { id: 'fonts', labelAr: 'خطوط', labelEn: 'Fonts' },
        { id: 'icons', labelAr: 'أيقونات', labelEn: 'Icons' },
        { id: 'business_card', labelAr: 'بطاقة أعمال', labelEn: 'Business Card' },
        { id: 'envelope', labelAr: 'ظرف رسمي', labelEn: 'Envelope' },
        { id: 'letterhead', labelAr: 'ورق مراسلات', labelEn: 'Letterhead' },
        { id: 'mugs', labelAr: 'أكواب', labelEn: 'Mugs' },
        { id: 'shirts', labelAr: 'قمصان', labelEn: 'Shirts' },
        { id: 'bags', labelAr: 'أكياس تغليف', labelEn: 'Packaging Bags' },
        { id: 'cars', labelAr: 'سيارات الشركة', labelEn: 'Company Cars' },
        { id: 'storefronts', labelAr: 'واجهات المحلات', labelEn: 'Storefronts' },
        { id: 'social', labelAr: 'منشورات سوشال ميديا', labelEn: 'Social Media Posts' }
    ]},
    { id: 'otherOutputs', labelAr: 'أخرى (حدد إن وجد)', labelEn: 'Other (specify)', type: 'text' }
  ],
  brand_kit: [
    { id: 'projectName', labelAr: 'اسم العلامة التجارية / المشروع', labelEn: 'Brand / Project Name', type: 'text' },
    { id: 'industry', labelAr: 'النشاط ومجال العمل', labelEn: 'Commercial Activity & Industry', type: 'text', placeholderAr: 'مثال: شركة عطور فاخرة، شركة ذكاء اصطناعي ناشئة، مقهى مختص...', placeholderEn: 'e.g., Luxury perfume company, AI startup, specialty coffee shop...' },
    { id: 'brandIdea', labelAr: 'فكرة ورؤية المشروع بالتفصيل', labelEn: 'Project Idea & Vision in Detail', type: 'textarea', placeholderAr: 'اكتب فكرة مشروعك هنا وسنقوم بابتكار هوية متكاملة له...', placeholderEn: 'Write your project idea here and we will design a fully integrated brand identity kit for it...' },
    { id: 'targetAudience', labelAr: 'الجمهور المستهدف والعملاء', labelEn: 'Target Audience & Ideal Customer', type: 'text', placeholderAr: 'مثال: جيل الشباب المهتمين بالتقنية، محبو الأناقة والفخامة...', placeholderEn: 'e.g., Tech-savvy youth, lovers of elegance and luxury...' },
    { id: 'logoLetter', labelAr: 'هل تود ان يتم تصميم الشعار بأسم التطبيق او بالحرف الأول من اسم التطبيق؟ (اختياري)', labelEn: 'Would you like the logo to be designed with the application name or its first letter? (Optional)', type: 'text' },
    { id: 'preferredColors', labelAr: 'الألوان المفضلة للهوية (اختياري)', labelEn: 'Preferred Identity Colors (Optional)', type: 'text' },
    { id: 'brandKitImage', labelAr: 'إرفاق صور مرجعية أو مصادر (اختياري)', labelEn: 'Attach reference images (Optional)', type: 'image_upload' }
  ],
  social_post: [
    { id: 'targetPlatform', labelAr: 'المنصة المستهدفة', labelEn: 'Target Platform', type: 'text' },
    { id: 'numberOfDesigns', labelAr: 'عدد التصاميم', labelEn: 'Number of Designs', type: 'text' },
    { id: 'designSizes', labelAr: 'مقاس التصميم', labelEn: 'Design Size', type: 'radio', options: [
        { id: 'square', labelAr: 'مربع (1080×1080)', labelEn: 'Square (1080x1080)' },
        { id: 'portrait', labelAr: 'طولي (1080×1350)', labelEn: 'Portrait (1080x1350)' },
        { id: 'story', labelAr: 'ستوري/ريلز (1080×1920)', labelEn: 'Story/Reel (1080x1920)' },
    ]},
    { id: 'requiredText', labelAr: 'النص المطلوب', labelEn: 'Required Text', type: 'textarea' },
    { id: 'goal', labelAr: 'الهدف', labelEn: 'Goal', type: 'multicheckbox', options: [
        { id: 'ad', labelAr: 'إعلان', labelEn: 'Advertisement' },
        { id: 'offer', labelAr: 'عرض', labelEn: 'Offer' },
        { id: 'event', labelAr: 'مناسبة', labelEn: 'Event' },
        { id: 'awareness', labelAr: 'توعية', labelEn: 'Awareness' },
        { id: 'intro', labelAr: 'منشور تعريفي', labelEn: 'Introductory Post' }
    ]},
    { id: 'identityColors', labelAr: 'ألوان الهوية', labelEn: 'Identity Colors', type: 'text' }
  ],
  youtube_thumbnail: [
    { id: 'videoTitle', labelAr: 'عنوان الفيديو', labelEn: 'Video Title', type: 'text' },
    { id: 'videoIdea', labelAr: 'فكرة الفيديو', labelEn: 'Video Idea', type: 'textarea' },
    { id: 'designStyle', labelAr: 'أسلوب التصميم', labelEn: 'Design Style', type: 'text' },
    { id: 'preferredColors', labelAr: 'ألوان مفضلة', labelEn: 'Preferred Colors', type: 'text' },
    { id: 'addEffects', labelAr: 'هل تريد إضافة أسهم أو تأثيرات؟', labelEn: 'Add arrows or effects?', type: 'radio', options: [
        { id: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
        { id: 'no', labelAr: 'لا', labelEn: 'No' }
    ]},
    { id: 'channelName', labelAr: 'اسم القناة', labelEn: 'Channel Name', type: 'text' }
  ],
  youtube_cover: [
    { id: 'channelName', labelAr: 'اسم القناة', labelEn: 'Channel Name', type: 'text' },
    { id: 'contentType', labelAr: 'نوع المحتوى', labelEn: 'Content Type', type: 'text' },
    { id: 'coverContent', labelAr: 'محتوى الغلاف', labelEn: 'Cover Content', type: 'textarea' },
    { id: 'requiredText', labelAr: 'النصوص المطلوبة', labelEn: 'Required Texts', type: 'textarea' },
    { id: 'socialLinks', labelAr: 'روابط التواصل (ستظهر في الغلاف)', labelEn: 'Social Links (to appear)', type: 'text' },
    { id: 'publishSchedule', labelAr: 'مواعيد النشر (اختياري)', labelEn: 'Publishing Schedule (Optional)', type: 'text' },
    { id: 'designStyle', labelAr: 'أسلوب التصميم', labelEn: 'Design Style', type: 'text' },
    { id: 'channelColors', labelAr: 'ألوان القناة', labelEn: 'Channel Colors', type: 'text' },
    { id: 'referenceExamples', labelAr: 'أمثلة مفضلة', labelEn: 'Favorite Examples', type: 'textarea' }
  ],
  whatsapp_channel: [
    { id: 'channelName', labelAr: 'اسم قناة الواتساب', labelEn: 'WhatsApp Channel Name', type: 'text' },
    { id: 'contentType', labelAr: 'نوع محتوى القناة والهدف منها', labelEn: 'Channel Content Type & Goal', type: 'text', placeholderAr: 'مثال: تقني، أخبار، فكاهي، عقارات، اقتباسات ومقولات...', placeholderEn: 'e.g., Tech, news, comedy, real estate, quotes...' },
    { id: 'coverContent', labelAr: 'تفاصيل ومحتوى صورة الغلاف المطلوبة', labelEn: 'Cover Graphic Details & Content', type: 'textarea', placeholderAr: 'صف المشهد أو العناصر المفضلة لصورة الغلاف...', placeholderEn: 'Describe preferred scenery or elements for the cover image...' },
    { id: 'requiredText', labelAr: 'النصوص والعبارات المطلوبة على الغلاف (إن وجد)', labelEn: 'Required Texts on Cover (if any)', type: 'textarea' },
    { id: 'designStyle', labelAr: 'أسلوب التصميم والروح العامة', labelEn: 'Design Style & Overall Vibe', type: 'text', placeholderAr: 'مثال: بسيط وعصري، رسمي وفاخر، ملون وحيوي...', placeholderEn: 'e.g., Minimalist, luxury formal, colorful...' },
    { id: 'channelColors', labelAr: 'ألوان الهوية المفضلة', labelEn: 'Preferred Channel Colors', type: 'text' }
  ],
  story: [
    { id: 'platformType', labelAr: 'نوع المنصة', labelEn: 'Platform Type', type: 'text' },
    { id: 'storyGoal', labelAr: 'الهدف من الستوري', labelEn: 'Story Goal', type: 'text' },
    { id: 'requiredText', labelAr: 'النص المطلوب', labelEn: 'Required Text', type: 'textarea' },
    { id: 'cta', labelAr: 'الدعوة للإجراء (CTA)', labelEn: 'Call to Action', type: 'multicheckbox', options: [
        { id: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact Us' },
        { id: 'buy', labelAr: 'زر شراء', labelEn: 'Buy Button' },
        { id: 'visit', labelAr: 'زيارة الموقع', labelEn: 'Visit Website' },
        { id: 'follow', labelAr: 'متابعة الصفحة', labelEn: 'Follow Page' }
    ]}
  ],
  business_card: [
    { id: 'personName', labelAr: 'الاسم', labelEn: 'Name', type: 'text' },
    { id: 'jobTitle', labelAr: 'المسمى الوظيفي', labelEn: 'Job Title', type: 'text' },
    { id: 'phoneNumber', labelAr: 'رقم الهاتف', labelEn: 'Phone Number', type: 'text' },
    { id: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', type: 'text' },
    { id: 'website', labelAr: 'الموقع الإلكتروني', labelEn: 'Website', type: 'text' },
    { id: 'companyName', labelAr: 'اسم الشركة', labelEn: 'Company Name', type: 'text' },
    { id: 'address', labelAr: 'العنوان', labelEn: 'Address', type: 'text' },
    { id: 'sides', labelAr: 'التصميم (وجه أم وجهان؟)', labelEn: 'Design (One side or two?)', type: 'radio', options: [
        { id: 'one', labelAr: 'وجه واحد', labelEn: 'One side' },
        { id: 'two', labelAr: 'وجهان', labelEn: 'Two sides' }
    ]},
    { id: 'qrCode', labelAr: 'هل تريد QR Code؟', labelEn: 'Include QR Code?', type: 'radio', options: [
        { id: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
        { id: 'no', labelAr: 'لا', labelEn: 'No' }
    ]},
    { id: 'identityColors', labelAr: 'ألوان الهوية', labelEn: 'Identity Colors', type: 'text' },
    { id: 'designStyle', labelAr: 'أسلوب التصميم', labelEn: 'Design Style', type: 'multicheckbox', options: [
        { id: 'simple', labelAr: 'بسيط', labelEn: 'Simple' },
        { id: 'modern', labelAr: 'عصري', labelEn: 'Modern' },
        { id: 'professional', labelAr: 'احترافي', labelEn: 'Professional' },
        { id: 'luxurious', labelAr: 'فخم', labelEn: 'Luxurious' },
        { id: 'tech', labelAr: 'تقني', labelEn: 'Tech' },
        { id: 'youthful', labelAr: 'شبابي', labelEn: 'Youthful' },
        { id: 'fun', labelAr: 'مرح', labelEn: 'Fun' },
        { id: 'bold', labelAr: 'جريء', labelEn: 'Bold' },
        { id: 'futuristic', labelAr: 'مستقبلي', labelEn: 'Futuristic' },
        { id: 'classic', labelAr: 'كلاسيكي', labelEn: 'Classic' }
    ]}
  ],
  video_ad: [
    { id: 'resultType', labelAr: 'نوع النتيجة المحصلة', labelEn: 'Result Type', type: 'radio', options: [
        { id: 'video', labelAr: 'فيديو احترافي (Creative Ai Video)', labelEn: 'Professional Video (Creative Ai Video)' },
        { id: 'image', labelAr: 'صورة (لوحة قصة/ستوري بورد)', labelEn: 'Image Storyboard' }
    ]},
    { id: 'videoDuration', labelAr: 'مدة الفيديو (وقت الفيديو)', labelEn: 'Video Duration', type: 'radio', options: [
        { id: '4s', labelAr: '4 ثواني (تخصم 2 نقاط)', labelEn: '4 seconds (costs 2 points)' },
        { id: '5s', labelAr: '5 ثواني (تخصم 2.5 نقاط)', labelEn: '5 seconds (costs 2.5 points)' },
        { id: '6s', labelAr: '6 ثواني (تخصم 3 نقاط)', labelEn: '6 seconds (costs 3 points)' },
        { id: '8s', labelAr: '8 ثواني (تخصم 4 نقاط)', labelEn: '8 seconds (costs 4 points)' },
        { id: '10s', labelAr: '10 ثواني (تخصم 5 نقاط)', labelEn: '10 seconds (costs 5 points)' }
    ]},
    { id: 'videoSubject', labelAr: 'المنتج أو بطل الفيديو', labelEn: 'Main Subject / Product', type: 'text', placeholderAr: 'مثال: سيارة رياضية حمراء، زجاجة عطر، شاب رياضي يرتدي حذاء...', placeholderEn: 'e.g., Red sports car, perfume bottle, athlete wearing shoes...' },
    { id: 'marketingGoal', labelAr: 'الهدف من الإعلان', labelEn: 'Marketing Goal', type: 'radio', options: [
        { id: 'showcase', labelAr: 'استعراض فخامة المنتج', labelEn: 'Premium Product Showcase' },
        { id: 'lifestyle', labelAr: 'أسلوب حياة (Lifestyle)', labelEn: 'Lifestyle Integration' },
        { id: 'action', labelAr: 'إثارة وحركة', labelEn: 'Action & Excitement' },
        { id: 'storytelling', labelAr: 'سرد قصة قصيرة', labelEn: 'Short Narrative/Story' },
        { id: 'ugc', labelAr: 'محتوى عفوي (UGC)', labelEn: 'User Generated Content (UGC)' }
    ]},
    { id: 'videoAction', labelAr: 'الحدث والحركة (السيناريو التفصيلي)', labelEn: 'Action & Scenario Details', type: 'textarea', placeholderAr: 'صف المشهد بدقة. ماذا يحدث؟ (مثال: الكاميرا تقترب ببطء من زجاجة العطر، ثم يتناثر رذاذ الماء حولها بحركة بطيئة...)', placeholderEn: 'Describe the scene accurately. What happens? (e.g., Camera slowly zooms into the perfume bottle, water splashes around it in slow motion...)' },
    { id: 'setting', labelAr: 'البيئة والموقع', labelEn: 'Setting & Location', type: 'text', placeholderAr: 'مثال: استوديو مظلم بإضاءة نيون، قمة جبل جليدي، شارع مزدحم...', placeholderEn: 'e.g., Dark studio with neon lights, snowy mountain peak, busy street...' },
    { id: 'cameraMotion', labelAr: 'حركة وزاوية الكاميرا', labelEn: 'Camera Motion & Angle', type: 'radio', options: [
        { id: 'cinematic_pan', labelAr: 'حركة سينمائية بطيئة', labelEn: 'Slow Cinematic Pan' },
        { id: 'dynamic_tracking', labelAr: 'تتبع سريع للهدف', labelEn: 'Dynamic Subject Tracking' },
        { id: 'macro_zoom', labelAr: 'تقريب شديد التفاصيل (Macro)', labelEn: 'Ultra-detail Macro Zoom' },
        { id: 'fpv_drone', labelAr: 'لقطة طائرة درون مجنونة (FPV)', labelEn: 'Aggressive FPV Drone' },
        { id: 'handheld', labelAr: 'تصوير يدوي واقعي', labelEn: 'Realistic Handheld' }
    ]},
    { id: 'lighting', labelAr: 'الإضاءة والألوان', labelEn: 'Lighting & Colors', type: 'radio', options: [
        { id: 'cinematic', labelAr: 'ظلال وإضاءة سينمائية (Cinematic)', labelEn: 'Cinematic Shadows' },
        { id: 'neon', labelAr: 'سايبربانك ونيون متباين', labelEn: 'Cyberpunk / High Contrast Neon' },
        { id: 'natural', labelAr: 'إضاءة طبيعية ساطعة (ضوء الشمس)', labelEn: 'Bright Natural Sunlight' },
        { id: 'studio', labelAr: 'إضاءة استوديو ناعمة واحترافية', labelEn: 'Soft Professional Studio' }
    ]},
    { id: 'visualStyle', labelAr: 'النمط البصري العام', labelEn: 'Overall Visual Style', type: 'radio', options: [
        { id: 'live_action', labelAr: 'تصوير واقعي (Live-action)', labelEn: 'Photorealistic Live-action' },
        { id: 'cgi_3d', labelAr: 'جرافيكس ثلاثي الأبعاد فاخر (CGI)', labelEn: 'High-end 3D CGI' },
        { id: 'motion_graphics', labelAr: 'موشن جرافيك عصري', labelEn: 'Modern Motion Graphics' },
        { id: 'anime', labelAr: 'أنمي عالي الجودة', labelEn: 'High-quality Anime' }
    ]},
    { id: 'aspectRatio', labelAr: 'أبعاد الإعلان', labelEn: 'Aspect Ratio', type: 'radio', options: [
        { id: '16_9', labelAr: 'شاشة عريضة / يوتيوب (16:9)', labelEn: 'Widescreen (16:9)' },
        { id: '9_16', labelAr: 'طولي / تيك توك وريلز (9:16)', labelEn: 'Vertical / Reels (9:16)' }
    ]}
  ],
  billboard: [
    { id: 'projectName', labelAr: 'اسم المحل أو المعرض التجاري', labelEn: 'Business/Store Name', type: 'text', placeholderAr: 'مثال: سوبرماركت أبو أحمد، صالون الفخامة، مطعم البركة...', placeholderEn: 'e.g., Abu Ahmad Supermarket, Al-Baraka Restaurant...' },
    { id: 'logoChoice', labelAr: 'كيف تفضل كتابة وتصميم الاسم على اللوحة؟', labelEn: 'How would you like the store name/logo designed on the signboard?', type: 'radio', options: [
        { id: 'store_name', labelAr: 'كتابة اسم المحل كاملاً بخط وتصميم جميل وواضح', labelEn: 'Design with full store name in beautiful clear font' },
        { id: 'first_letter', labelAr: 'تصميم شعار رمزي مبتكر من الحرف الأول لاسم المحل', labelEn: 'Design symbolic logo using the first letter' },
        { id: 'have_logo', labelAr: 'لدي شعار خاص جاهز بالفعل وسأرفقه بالأسفل لدمجه باللوحة', labelEn: 'I have my own logo ready and will upload it below to integrate' }
    ]},
    { id: 'slogan', labelAr: 'الكلام الفرعي أو العبارات التسويقية والنشاط المطلوب كتابته', labelEn: 'Sub-text, Main Activity or Marketing Slogan to write', type: 'text', placeholderAr: 'مثال: بيع وصيانة جوالات، مأكولات بحرية طازجة، عصائر طبيعية...', placeholderEn: 'e.g., Selling and repairing smartphones, fresh seafood...' },
    { id: 'billboardSize', labelAr: 'مقاس اللوحة وحجمها المناسب لك', labelEn: 'Signboard Size & Dimensions', type: 'radio', options: [
        { id: 'wide_3x1', labelAr: 'لوحة واجهة محل عريضة (3 متر × 1 متر)', labelEn: 'Widescreen Storefront Sign (3x1 meters)' },
        { id: 'std_2x1', labelAr: 'لوحة واجهة متوسطة (2 متر × 1 متر)', labelEn: 'Medium Storefront Sign (2x1 meters)' },
        { id: 'street_4x3', labelAr: 'يافطة إعلانية كبيرة للشارع (4 متر × 3 متر)', labelEn: 'Large Street Billboard (4x3 meters)' },
        { id: 'stand_1_2x1_8', labelAr: 'ستاند واقف طولي للرصيف أو داخل المجمع (1.2 متر × 1.8 متر)', labelEn: 'Vertical Pedestrian/Mupis Stand (1.2x1.8 meters)' },
        { id: 'custom', labelAr: 'مقاس مخصص آخر حسب رغبتي', labelEn: 'Other Custom Dimensions' }
    ]},
    { id: 'billboardType', labelAr: 'نوع اللوحة وطريقة تصنيعها وطباعتها', labelEn: 'Signboard Material & Type', type: 'radio', options: [
        { id: 'flex', labelAr: 'لوحة صندوقية مضيئة من الداخل (فليكس بوكس)', labelEn: 'Internal backlit box sign (Flex Lightbox)' },
        { id: 'banner', labelAr: 'لوحة قماشية عادية مشدودة على إطار بدون إضاءة (بنر خارجي)', labelEn: 'Regular stretched canvas sign without lighting (Banner)' },
        { id: '3d_led', labelAr: 'حروف بارزة ومجسمة مضيئة وراقية (حروف LED ثلاثية الأبعاد)', labelEn: 'Luxury 3D Raised LED Channel Letters' },
        { id: 'rollup', labelAr: 'رول اب ستاند طولي واقف سهل الحمل والطي (للمعارض أو داخل المحل)', labelEn: 'Portable Indoor Roll-up Stand' }
    ]},
    { id: 'calligraphyStyle', labelAr: 'شكل ونوع الخط العربي المفضل لكتابة الاسم الرئيسي', labelEn: 'Preferred Arabic Calligraphy Style', type: 'radio', options: [
        { id: 'thuluth', labelAr: 'خط الثلث (كلاسيكي، فخم، تقليدي ومهيب)', labelEn: 'Thuluth (Classic, prestigious and traditional)' },
        { id: 'diwani', labelAr: 'الخط الديواني (ناعم، انسيابي، فني وجذاب)', labelEn: 'Diwani (Soft, flowing, artistic and elegant)' },
        { id: 'kufic', labelAr: 'الخط الكوفي (مربع، حديث، هندسي ومرتب جداً)', labelEn: 'Kufic (Square, modern and geometric)' },
        { id: 'ruqah', labelAr: 'خط الرقعة (واضح، بسيط، سهل وسريع القراءة للمارة)', labelEn: 'Ruq\'ah (Simple, clear and fast to read for passersby)' },
        { id: 'free_modern', labelAr: 'خط حر ومبتكر (تصميم عصري فني خاص)', labelEn: 'Modern Creative Typography' }
    ]},
    { id: 'industry', labelAr: 'وصف بسيط للمحل والمنتجات أو الخدمات اللي بتقدمها', labelEn: 'Simple description of your store, products or services', type: 'textarea', placeholderAr: 'مثال: نحن محل هدايا وورد طبيعي منسق بطريقة عصرية نستهدف الشباب والمناسبات السعيدة بلمسة فخمة...', placeholderEn: 'e.g., Luxury sweets shop targeting families, presenting authentic flavours...' },
    { id: 'contactInfo', labelAr: 'أرقام التواصل أو العنوان وحسابات التواصل المطلوب وضعها (اختياري)', labelEn: 'Contact details, address, or social accounts to display (Optional)', type: 'text', placeholderAr: 'مثال: هاتف 0599000000، العنوان: مقابل البنك الوطني، حساب إنستغرام @brand', placeholderEn: 'e.g., Phone: 0599000000, Address: King Faisal St., @instagram' },
    { id: 'preferredColors', labelAr: 'الألوان التي تفضلها للوحتك', labelEn: 'Preferred Colors for the Signboard', type: 'text', placeholderAr: 'مثال: أريد ألوان ملكية مثل الأسود مع الذهبي، أو أزرق بحري هادئ مع أبيض...', placeholderEn: 'e.g., Classic gold with royal black, navy and white, bright colors...' },
    { id: 'designVibe', labelAr: 'الجو العام واللمسة الفنية المطلوبة للوحة', labelEn: 'Overall Aesthetic Vibe', type: 'radio', options: [
        { id: 'luxurious', labelAr: 'تصميم فخم، كلاسيكي وله هيبة (يدل على الجودة العالية)', labelEn: 'Luxurious & Classic' },
        { id: 'modern', labelAr: 'تصميم عصري، مبتكر، ملفت وجديد كلياً', labelEn: 'Modern, striking & innovative' },
        { id: 'vibrant', labelAr: 'تصميم مليء بالألوان والبهجة والنشاط والحيوية', labelEn: 'Vibrant, colourful & energetic' },
        { id: 'clean', labelAr: 'تصميم هادئ جداً، بسيط ومريح للعين وأنيق بساطته', labelEn: 'Minimalist, clean & elegant' }
    ]}
  ]
};

export const BRAND_KIT_ITEMS = [
  { id: 'logo', nameAr: 'الشعار الرئيسي', nameEn: 'Primary Logo' },
  { id: 'business_card', nameAr: 'بطاقة الأعمال', nameEn: 'Business Card' },
  { id: 'stationery', nameAr: 'الأوراق والمطبوعات', nameEn: 'Stationery' },
  { id: 'social_media', nameAr: 'قالب التواصل الاجتماعي', nameEn: 'Social Media Template' }
];
