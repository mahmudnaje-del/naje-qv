export interface NajeVoice {
  id: string;           // exact API voice name, e.g. "Kore"
  labelAr: string;      // Arabic display label
  gender: 'male' | 'female';
  tone: string;         // detailed listened-to description
  sampleUrl: string;    // static sample file path
}

const STORAGE_URL_PREFIX = '/api/voice-sample?voice=';

export const NAJE_VOICES: NajeVoice[] = [
  { id: 'Kore',          labelAr: 'كور',          gender: 'female', tone: 'قوي وحازم - نبرة قيادية',              sampleUrl: `${STORAGE_URL_PREFIX}kore.wav` },
  { id: 'Puck',          labelAr: 'بَك',           gender: 'male',   tone: 'حيوي ومرح - أسلوب تفاعلي',            sampleUrl: `${STORAGE_URL_PREFIX}puck.wav` },
  { id: 'Charon',        labelAr: 'كارون',        gender: 'male',   tone: 'هادئ واحترافي - نبرة وثائقية',           sampleUrl: `${STORAGE_URL_PREFIX}charon.wav` },
  { id: 'Zephyr',        labelAr: 'زفير',         gender: 'female', tone: 'واضح ومشرق - نبرة إعلانية',             sampleUrl: `${STORAGE_URL_PREFIX}zephyr.wav` },
  { id: 'Aoede',         labelAr: 'أويدي',        gender: 'female', tone: 'دافئ ولحني - مناسب للقصص',             sampleUrl: `${STORAGE_URL_PREFIX}aoede.wav` },
  { id: 'Fenrir',        labelAr: 'فنرير',        gender: 'male',   tone: 'عميق ومهيب - صوت رخيم قادم من العمق',    sampleUrl: `${STORAGE_URL_PREFIX}fenrir.wav` },
  { id: 'Leda',          labelAr: 'ليدا',         gender: 'female', tone: 'أنشطة ورزينة - نبرة راقية ومتقنة',       sampleUrl: `${STORAGE_URL_PREFIX}leda.wav` },
  { id: 'Orus',          labelAr: 'أوروس',        gender: 'male',   tone: 'متزن وإخباري - نبرة المذيع التلفزيوني',  sampleUrl: `${STORAGE_URL_PREFIX}orus.wav` },
  { id: 'Callirrhoe',    labelAr: 'كاليرو',       gender: 'female', tone: 'ناعم وودود - مناسب للبودكاست',          sampleUrl: `${STORAGE_URL_PREFIX}callirrhoe.wav` },
  { id: 'Autonoe',       labelAr: 'أوتونو',       gender: 'female', tone: 'مرح ومتحمس - نبرة حيوية جداً',          sampleUrl: `${STORAGE_URL_PREFIX}autonoe.wav` },
  { id: 'Enceladus',     labelAr: 'إنسيلادوس',    gender: 'male',   tone: 'جهوري وثقيل - طابع درامي قوي',          sampleUrl: `${STORAGE_URL_PREFIX}enceladus.wav` },
  { id: 'Iapetus',       labelAr: 'إيابيتوس',     gender: 'male',   tone: 'حكيم وهادئ - أسلوب تعليمي ورزين',        sampleUrl: `${STORAGE_URL_PREFIX}iapetus.wav` },
  { id: 'Umbriel',       labelAr: 'أومبريل',      gender: 'male',   tone: 'غامض ودافئ - نبرة سينمائية',             sampleUrl: `${STORAGE_URL_PREFIX}umbriel.wav` },
  { id: 'Algieba',       labelAr: 'الجبة',        gender: 'male',   tone: 'رسمي ومباشر - للمقاطع التعريفية',        sampleUrl: `${STORAGE_URL_PREFIX}algieba.wav` },
  { id: 'Despina',       labelAr: 'ديسبينا',      gender: 'female', tone: 'عذب وشبابي - إلقاء عصري خفيف',          sampleUrl: `${STORAGE_URL_PREFIX}despina.wav` },
  { id: 'Erinome',       labelAr: 'إرينومي',      gender: 'female', tone: 'واثق وجاد - نبرة شروحات وتقارير',       sampleUrl: `${STORAGE_URL_PREFIX}erinome.wav` },
  { id: 'Algenib',       labelAr: 'الجانب',       gender: 'male',   tone: 'حيوي وسريع - مناسب للرسائل القصيرة',    sampleUrl: `${STORAGE_URL_PREFIX}algenib.wav` },
  { id: 'Rasalgethi',    labelAr: 'رأس الجاثي',   gender: 'male',   tone: 'عميق وفخم - نبرة وثائقية فاخرة',         sampleUrl: `${STORAGE_URL_PREFIX}rasalgethi.wav` },
  { id: 'Laomedeia',     labelAr: 'لاوميديا',     gender: 'female', tone: 'طبيعي وقريب - نبرة محادثة عفوية',       sampleUrl: `${STORAGE_URL_PREFIX}laomedeia.wav` },
  { id: 'Achernar',      labelAr: 'آخر النهر',    gender: 'female', tone: 'مشجّع وإيجابي - أسلوب تدريبي وتوجيهي',  sampleUrl: `${STORAGE_URL_PREFIX}achernar.wav` },
  { id: 'Alnilam',       labelAr: 'النظام',       gender: 'male',   tone: 'واضح وإرشادي - للتعليم والكتب الصوتية',   sampleUrl: `${STORAGE_URL_PREFIX}alnilam.wav` },
  { id: 'Schedar',       labelAr: 'الصدر',        gender: 'female', tone: 'شجي ومؤثر - نبرة عاطفية تعبيرية',        sampleUrl: `${STORAGE_URL_PREFIX}schedar.wav` },
  { id: 'Gacrux',        labelAr: 'جاكروكس',      gender: 'male',   tone: 'رخيم ومريح - أسلوب تأمل ومراجعة',        sampleUrl: `${STORAGE_URL_PREFIX}gacrux.wav` },
  { id: 'Pulcherrima',   labelAr: 'بولكيريما',   gender: 'female', tone: 'راقي وإعلاني - نبرة شركات وتسويق',      sampleUrl: `${STORAGE_URL_PREFIX}pulcherrima.wav` },
  { id: 'Achird',        labelAr: 'أكيرد',        gender: 'male',   tone: 'ودود وعفوي - إلقاء بودكاست يومي',       sampleUrl: `${STORAGE_URL_PREFIX}achird.wav` },
  { id: 'Zubenelgenubi', labelAr: 'الزبنى',       gender: 'male',   tone: 'صارم وإداري - للخطابات والتقارير',       sampleUrl: `${STORAGE_URL_PREFIX}zubenelgenubi.wav` },
  { id: 'Vindemiatrix',  labelAr: 'مقدم القطاف',  gender: 'female', tone: 'دقيق وتثقيفي - سرد قصصي وتعليمي',       sampleUrl: `${STORAGE_URL_PREFIX}vindemiatrix.wav` },
  { id: 'Sadachbia',     labelAr: 'سعد الأخبية',  gender: 'female', tone: 'خفيف ومبهج - طابع تسويقي مشرق',          sampleUrl: `${STORAGE_URL_PREFIX}sadachbia.wav` },
  { id: 'Sadaltager',    labelAr: 'سعد التاجر',   gender: 'male',   tone: 'روائي وقصصي - طابع تمثيلي درامي',       sampleUrl: `${STORAGE_URL_PREFIX}sadaltager.wav` },
  { id: 'Sulafat',       labelAr: 'السلحفاة',     gender: 'female', tone: 'هادئ وهامس - نبرة استرخاء وقراءة',       sampleUrl: `${STORAGE_URL_PREFIX}sulafat.wav` },
];

export const VOICES = NAJE_VOICES.map(v => ({
  id: v.id,
  name: v.labelAr,
  gender: v.gender,
  tone: v.tone,
  description: v.tone,
  sampleUrl: v.sampleUrl
}));

export const DELIVERY_STYLES = [
  { id: 'default',      labelAr: 'افتراضي (طبيعي)',       instruction: '' },
  { id: 'professional', labelAr: 'احترافي وهادئ',         instruction: 'Speak in a calm, professional, measured tone.' },
  { id: 'warm',         labelAr: 'دافئ وودود',            instruction: 'Speak warmly and conversationally, like a friendly host.' },
  { id: 'energetic',    labelAr: 'حماسي وإعلاني',         instruction: 'Speak with high energy and enthusiasm, like an engaging ad narrator.' },
  { id: 'news',         labelAr: 'إخباري ورسمي',          instruction: 'Read this in a formal, clear news broadcast style.' },
];
