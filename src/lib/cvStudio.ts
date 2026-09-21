export type CvMarket = 'gulf' | 'ats' | 'jadarat' | 'creative';
export type CvLang = 'ar' | 'en';
export type CvTemplate = 'naje' | 'gulf' | 'jadarat' | 'gold' | 'modern' | 'academic';
export type CvPersona =
  | 'student'
  | 'graduate'
  | 'employee'
  | 'switcher'
  | 'freelancer'
  | 'manager'
  | 'specialist'
  | 'no_experience';
export type CvCountry = 'SA' | 'AE' | 'QA' | 'KW' | 'BH' | 'OM' | 'EG' | 'JO' | 'INTL';

export type DegreeLevel =
  | 'high_school'
  | 'diploma'
  | 'bachelor'
  | 'master'
  | 'phd'
  | 'board'
  | 'other';

export interface CvExperience {
  id: string;
  title: string;
  company: string;
  city: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string;
  employmentType?: string;
}

export interface CvEducation {
  id: string;
  school: string;
  degreeLevel: DegreeLevel;
  field: string;
  gpa: string;
  gpaScale: '4' | '5' | '100';
  year: string;
  honors: string;
  showGpa?: boolean;
}

export interface CvCourse {
  id: string;
  name: string;
  issuer: string;
  year: string;
  hours: string;
  accredited: 'yes' | 'no' | 'internal' | '';
  gained: string;
  providerType?: string;
}

export interface CvCertificate {
  id: string;
  name: string;
  issuer: string;
  year: string;
  idNumber: string;
  expires: string;
  url?: string;
  status?: string;
}

export interface CvLanguage {
  id: string;
  name: string;
  level: string;
}

export interface CvProject {
  id: string;
  name: string;
  role: string;
  year: string;
  detail: string;
  link?: string;
}

export interface CvAchievement {
  id: string;
  title: string;
  org: string;
  year: string;
  detail: string;
}

export interface CvPublication {
  id: string;
  title: string;
  venue: string;
  year: string;
  doi: string;
}

export interface CvCustomSection {
  id: string;
  title: string;
  body: string;
}

export interface CvData {
  fullName: string;
  headline: string;
  summary: string;
  targetRole: string;
  jobPosting: string;
  photo: string | null;
  photoEnhanced: boolean;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string;
  portfolio: string;
  github?: string;
  nationality: string;
  dob: string;
  age: string;
  gender: string;
  marital: string;
  visa: string;
  license: string;
  notice: string;
  availability: string;
  skills: string;
  military: string;
  volunteer: string;
  references: string;
  showPhoto: boolean;
  showPersonal: boolean;
  experiences: CvExperience[];
  education: CvEducation[];
  courses: CvCourse[];
  certificates: CvCertificate[];
  languages: CvLanguage[];
  projects: CvProject[];
  achievements: CvAchievement[];
  publications: CvPublication[];
  customSections: CvCustomSection[];
  market: CvMarket;
  lang: CvLang;
  template: CvTemplate;
  persona: CvPersona;
  targetCountry: CvCountry;
  wizardDone: boolean;
  coverLetter: string;
}

export const DEGREE_LABELS: Record<DegreeLevel, { ar: string; en: string }> = {
  high_school: { ar: 'ثانوية عامة', en: 'High School' },
  diploma: { ar: 'دبلوم', en: 'Diploma' },
  bachelor: { ar: 'بكالوريوس', en: 'Bachelor' },
  master: { ar: 'ماجستير', en: 'Master' },
  phd: { ar: 'دكتوراه', en: 'PhD' },
  board: { ar: 'بورد / زمالة', en: 'Board / Fellowship' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const ACCREDIT_LABELS = {
  yes: { ar: 'معتمدة', en: 'Accredited' },
  no: { ar: 'غير معتمدة', en: 'Not accredited' },
  internal: { ar: 'دورة داخلية للجهة', en: 'Internal / in-house' },
};

export const LANG_LEVELS = [
  { id: 'native', ar: 'لغة أم', en: 'Native' },
  { id: 'c2', ar: 'إتقان C2', en: 'C2 Mastery' },
  { id: 'c1', ar: 'متقدم C1', en: 'C1 Advanced' },
  { id: 'b2', ar: 'فوق المتوسط B2', en: 'B2 Upper-int.' },
  { id: 'b1', ar: 'متوسط B1', en: 'B1 Intermediate' },
  { id: 'a2', ar: 'أساسي A2', en: 'A2 Elementary' },
];

export const GENDER_OPTS = [
  { id: '', ar: 'بدون ذكر', en: 'Omit' },
  { id: 'male', ar: 'ذكر', en: 'Male' },
  { id: 'female', ar: 'أنثى', en: 'Female' },
];

export const MARITAL_OPTS = [
  { id: '', ar: 'بدون ذكر', en: 'Omit' },
  { id: 'single', ar: 'أعزب / عزباء', en: 'Single' },
  { id: 'married', ar: 'متزوج / متزوجة', en: 'Married' },
];

export const PERSONAS: { id: CvPersona; ar: string; en: string; hint: string }[] = [
  { id: 'student', ar: 'طالب', en: 'Student', hint: 'التعليم والمشاريع أولاً' },
  { id: 'graduate', ar: 'خرّيج', en: 'Graduate', hint: 'تدريب + مشاريع + مهارات' },
  { id: 'employee', ar: 'موظف', en: 'Professional', hint: 'خبرة ثم مهارات' },
  { id: 'switcher', ar: 'أغيّر مجالي', en: 'Career change', hint: 'نقل المهارات بصدق' },
  { id: 'freelancer', ar: 'مستقل', en: 'Freelancer', hint: 'عملاء ومشاريع لا شركة واحدة' },
  { id: 'manager', ar: 'مدير', en: 'Manager', hint: 'قيادة وأرقام' },
  { id: 'specialist', ar: 'مختص', en: 'Specialist', hint: 'عمق تقني' },
  { id: 'no_experience', ar: 'بدون خبرة بعد', en: 'No experience', hint: 'دراسة، تطوع، دورات' },
];

export const COUNTRIES: { id: CvCountry; ar: string; market: CvMarket }[] = [
  { id: 'SA', ar: 'السعودية', market: 'gulf' },
  { id: 'AE', ar: 'الإمارات', market: 'gulf' },
  { id: 'QA', ar: 'قطر', market: 'gulf' },
  { id: 'KW', ar: 'الكويت', market: 'gulf' },
  { id: 'BH', ar: 'البحرين', market: 'gulf' },
  { id: 'OM', ar: 'عُمان', market: 'gulf' },
  { id: 'EG', ar: 'مصر', market: 'ats' },
  { id: 'JO', ar: 'الأردن', market: 'ats' },
  { id: 'INTL', ar: 'دولي / شركات عالمية', market: 'ats' },
];

export const TEMPLATES: { id: CvTemplate; ar: string; en: string; hint: string; ats: boolean }[] = [
  { id: 'naje', ar: 'نواة ناجي', en: 'Naje Core', hint: 'عمود واحد · يمرّ ATS وجدارات', ats: true },
  { id: 'gulf', ar: 'الخليج', en: 'Gulf', hint: 'صورة + جنسية + إقامة — المعيار المحلي', ats: false },
  { id: 'jadarat', ar: 'جدارات', en: 'Jadarat', hint: 'عناوين قياسية ونص حقيقي للقطاع الحكومي', ats: true },
  { id: 'gold', ar: 'ذهبي تنفيذي', en: 'Executive Gold', hint: 'لكبار المختصين والعروض أمام إنسان', ats: false },
  { id: 'modern', ar: 'حديث', en: 'Modern', hint: 'شريط جانبي — للتسليم اليدوي لا للآلات', ats: false },
  { id: 'academic', ar: 'أكاديمي', en: 'Academic', hint: 'التعليم والمعدل والشهادات أولاً', ats: true },
];

export const MARKETS: { id: CvMarket; ar: string; hint: string }[] = [
  { id: 'gulf', ar: 'الخليج', hint: 'صورة مهنية، جنسية، إقامة، إشعار. صفحتان مقبولتان.' },
  { id: 'ats', ar: 'شركات عالمية / ATS', hint: 'بدون صورة ولا عمر. عمود واحد. كلمات الإعلان.' },
  { id: 'jadarat', ar: 'جدارات / حكومي', hint: 'نص قابل للنسخ، تواريخ شهر/سنة، عناوين قياسية.' },
  { id: 'creative', ar: 'إبداعي / تسليم يدوي', hint: 'للتصميم والضيافة حين يفتح الملف إنسان لا آلة.' },
];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyExperience(): CvExperience {
  return { id: uid(), title: '', company: '', city: '', start: '', end: '', current: false, bullets: '', employmentType: '' };
}
export function emptyEducation(): CvEducation {
  return { id: uid(), school: '', degreeLevel: 'bachelor', field: '', gpa: '', gpaScale: '5', year: '', honors: '', showGpa: true };
}
export function emptyCourse(): CvCourse {
  return { id: uid(), name: '', issuer: '', year: '', hours: '', accredited: '', gained: '', providerType: '' };
}
export function emptyCertificate(): CvCertificate {
  return { id: uid(), name: '', issuer: '', year: '', idNumber: '', expires: '', url: '', status: '' };
}
export function emptyLanguage(): CvLanguage {
  return { id: uid(), name: '', level: 'b2' };
}
export function emptyProject(): CvProject {
  return { id: uid(), name: '', role: '', year: '', detail: '', link: '' };
}
export function emptyAchievement(): CvAchievement {
  return { id: uid(), title: '', org: '', year: '', detail: '' };
}
export function emptyPublication(): CvPublication {
  return { id: uid(), title: '', venue: '', year: '', doi: '' };
}
export function emptyCustomSection(): CvCustomSection {
  return { id: uid(), title: '', body: '' };
}

export function emptyCv(): CvData {
  return {
    fullName: '',
    headline: '',
    summary: '',
    targetRole: '',
    jobPosting: '',
    photo: null,
    photoEnhanced: false,
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedin: '',
    portfolio: '',
    github: '',
    nationality: '',
    dob: '',
    age: '',
    gender: '',
    marital: '',
    visa: '',
    license: '',
    notice: '',
    availability: '',
    skills: '',
    military: '',
    volunteer: '',
    references: '',
    showPhoto: true,
    showPersonal: true,
    experiences: [emptyExperience()],
    education: [emptyEducation()],
    courses: [],
    certificates: [],
    languages: [
      { id: uid(), name: 'العربية', level: 'native' },
      { id: uid(), name: 'English', level: 'b2' },
    ],
    projects: [],
    achievements: [],
    publications: [],
    customSections: [],
    market: 'gulf',
    lang: 'ar',
    template: 'gulf',
    persona: 'employee',
    targetCountry: 'SA',
    wizardDone: false,
    coverLetter: '',
  };
}

export function demoCv(): CvData {
  return {
    ...emptyCv(),
    wizardDone: true,
    fullName: 'مثال ناجي (بيانات تجريبية)',
    headline: 'أخصائي موارد بشرية',
    summary:
      'أخصائي موارد بشرية بخبرة 5 سنوات في التوظيف والامتثال، أغلق 40 وظيفة سنوياً وخفّض زمن التوظيف 22٪ عبر مسار مقابلات موحّد.',
    targetRole: 'أخصائي استقطاب مواهب',
    email: 'demo@naje.ai',
    phone: '+966500000000',
    city: 'الرياض',
    country: 'السعودية',
    nationality: 'سعودي',
    visa: 'مواطن',
    notice: '30 يوماً',
    skills: 'استقطاب، مقابلات سلوكية، Excel، أنظمة ATS، تواصل',
    experiences: [
      {
        id: uid(),
        title: 'أخصائي توظيف',
        company: 'شركة نموذجية',
        city: 'الرياض',
        start: '2021-03',
        end: '',
        current: true,
        bullets:
          'أدرت مسار توظيف لـ 6 إدارات وأغلقت 40 شاغراً سنوياً.\nخفّضت زمن التوظيف من 48 إلى 37 يوماً عبر دليل مقابلات موحّد.',
        employmentType: 'دوام كامل',
      },
    ],
    education: [
      {
        id: uid(),
        school: 'جامعة الملك سعود',
        degreeLevel: 'bachelor',
        field: 'إدارة أعمال',
        gpa: '4.2',
        gpaScale: '5',
        year: '2020',
        honors: '',
        showGpa: true,
      },
    ],
    market: 'gulf',
    template: 'gulf',
    persona: 'employee',
    targetCountry: 'SA',
    lang: 'ar',
  };
}

export interface HrTip {
  id: string;
  level: 'stop' | 'warn' | 'ok';
  title: string;
  body: string;
}

export function applyMarketDefaults(cv: CvData, market: CvMarket): CvData {
  if (market === 'gulf') {
    return { ...cv, market, template: cv.template === 'naje' || cv.template === 'jadarat' ? 'gulf' : cv.template, showPhoto: true, showPersonal: true };
  }
  if (market === 'ats') {
    return { ...cv, market, template: 'naje', showPhoto: false, showPersonal: false };
  }
  if (market === 'jadarat') {
    return { ...cv, market, lang: 'ar', template: 'jadarat', showPhoto: false, showPersonal: false };
  }
  return { ...cv, market, template: cv.template === 'naje' ? 'gold' : cv.template, showPhoto: true, showPersonal: true };
}

export function applyPersonaDefaults(cv: CvData, persona: CvPersona): CvData {
  const next = { ...cv, persona };
  if (persona === 'student' || persona === 'graduate' || persona === 'no_experience') {
    next.template = cv.market === 'gulf' ? 'gulf' : 'academic';
  } else if (persona === 'manager') {
    next.template = cv.market === 'ats' || cv.market === 'jadarat' ? 'naje' : 'gold';
  }
  return next;
}

export function applyCountry(cv: CvData, country: CvCountry): CvData {
  const row = COUNTRIES.find((c) => c.id === country);
  const market = row?.market || cv.market;
  return applyMarketDefaults({ ...cv, targetCountry: country, country: row?.ar || cv.country }, market);
}

function hasNumber(s: string) {
  return /\d/.test(s);
}

export function atsRisk(cv: CvData): { level: 'low' | 'moderate' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  if (cv.template === 'modern' || cv.template === 'gold') {
    reasons.push('القوالب متعددة الأعمدة أو المزخرفة تُقرأ بترتيب خاطئ في كثير من الأنظمة.');
  }
  if (cv.showPhoto && (cv.market === 'ats' || cv.market === 'jadarat')) {
    reasons.push('الصورة والعمر يعيقان التحليل الآلي وقد تُحذف بيانات التواصل إن وُضعت بجانبها.');
  }
  if (!cv.headline.trim()) reasons.push('بدون مسمّى واضح يفشل تصنيف الملف.');
  if (cv.experiences.some((e) => (e.title || e.company) && !e.start)) reasons.push('تواريخ ناقصة تُربك ترتيب الخبرة.');
  let level: 'low' | 'moderate' | 'high' = 'low';
  if (reasons.length >= 2) level = 'high';
  else if (reasons.length === 1) level = 'moderate';
  if (cv.template === 'modern') level = 'high';
  return { level, reasons };
}

export function jobKeywordCoverage(cv: CvData): { keys: string[]; hit: string[]; missing: string[]; ratio: number } {
  const posting = cv.jobPosting.trim();
  if (posting.length < 20) return { keys: [], hit: [], missing: [], ratio: 0 };
  const hay = `${cv.headline} ${cv.summary} ${cv.skills} ${cv.experiences.map((e) => `${e.title} ${e.bullets}`).join(' ')} ${cv.courses.map((c) => c.name).join(' ')}`.toLowerCase();
  const stop = new Set(['this', 'that', 'with', 'from', 'your', 'their', 'have', 'will', 'the', 'and', 'for', 'you', 'على', 'في', 'من', 'إلى', 'هذا', 'هذه', 'التي', 'الذي', 'أن', 'إن', 'كان', 'يكون']);
  const keys = posting
    .toLowerCase()
    .split(/[^\p{L}\p{N}+#]+/u)
    .filter((w) => w.length > 3 && !stop.has(w));
  const uniq: string[] = [];
  for (const k of keys) {
    if (!uniq.includes(k)) uniq.push(k);
    if (uniq.length >= 28) break;
  }
  const hit = uniq.filter((k) => hay.includes(k));
  const missing = uniq.filter((k) => !hay.includes(k));
  return { keys: uniq, hit, missing, ratio: uniq.length ? hit.length / uniq.length : 0 };
}

export function completeness(cv: CvData): { id: string; ar: string; ok: boolean; optional?: boolean }[] {
  return [
    { id: 'name', ar: 'الاسم', ok: cv.fullName.trim().length >= 3 },
    { id: 'title', ar: 'المسمّى', ok: cv.headline.trim().length >= 4 },
    { id: 'contact', ar: 'التواصل', ok: Boolean(cv.email && cv.phone) },
    { id: 'summary', ar: 'الملخص', ok: cv.summary.trim().length >= 40 },
    { id: 'exp', ar: 'الخبرة / المشاريع', ok: cv.experiences.some((e) => e.title || e.company) || cv.projects.some((p) => p.name) },
    { id: 'edu', ar: 'التعليم', ok: cv.education.some((e) => e.school.trim()) },
    { id: 'skills', ar: 'المهارات', ok: cv.skills.trim().length > 2 },
    { id: 'certs', ar: 'شهادات', ok: cv.certificates.some((c) => c.name.trim()), optional: true },
    { id: 'courses', ar: 'دورات', ok: cv.courses.some((c) => c.name.trim()), optional: true },
  ];
}

export function scoreCv(cv: CvData): { score: number; tips: HrTip[] } {
  const tips: HrTip[] = [];
  let score = 12;

  if (cv.fullName.trim().length >= 3) score += 8;
  else tips.push({ id: 'name', level: 'stop', title: 'الاسم غير ظاهر', body: 'أول ما يراه الـHR هو اسمك. اكتبه كاملاً كما في الهوية أو جواز السفر.' });

  if (cv.headline.trim().length >= 4) score += 12;
  else
    tips.push({
      id: 'headline',
      level: 'stop',
      title: 'المسمّى الوظيفي مفقود من أول سطرين',
      body: '80٪ من مسح الـ6 ثوانٍ يذهب للاسم والمسمّى الحالي/المستهدف. اكتب المسمّى الذي تريد أن تُصنَّف تحته — لا «باحث عن عمل».',
    });

  if (cv.email && cv.phone) score += 6;
  else tips.push({ id: 'contact', level: 'stop', title: 'التواصل ناقص', body: 'هاتف مع مفتاح الدولة وبريد مهني. لا تضعهم في تذييل يتجاهله ATS.' });

  if (cv.city.trim()) score += 4;
  else tips.push({ id: 'city', level: 'warn', title: 'المدينة غير واضحة', body: 'في الخليج الموقع والإقامة يقرّران إن كنت تدخل القائمة أم لا — من أول نظرة.' });

  const summary = cv.summary.trim();
  if (summary.length >= 40) {
    score += 6;
    if (hasNumber(summary)) score += 6;
    else
      tips.push({
        id: 'summary-num',
        level: 'warn',
        title: 'الملخص بلا رقم',
        body: '«محترف نتائج» لا يوقف أحداً. رقم واحد في السطرين الأولين (سنوات، فريق، نسبة، مبلغ) يغيّر القرار.',
      });
    if (summary.length > 520)
      tips.push({ id: 'summary-long', level: 'warn', title: 'الملخص صار فقرة', body: '3–4 أسطر كحد أقصى. الجدار النصي يُرمى قبل الخبرة.' });
  } else {
    tips.push({
      id: 'summary',
      level: 'stop',
      title: 'لا يوجد عرض قيمة في الأعلى',
      body: 'بدون ملخص قصير، العين تقفز ثم تغادر. صِغ 3 أسطر: من أنت، لأي دور، بأية نتيجة.',
    });
  }

  const realExp = cv.experiences.filter((e) => e.title.trim() || e.company.trim());
  const realProjects = (cv.projects || []).filter((p) => p.name.trim());
  if (realExp.length) {
    score += 8;
    const dated = realExp.filter((e) => e.start);
    if (dated.length === realExp.length) score += 6;
    else tips.push({ id: 'dates', level: 'warn', title: 'خبرة بلا تواريخ', body: 'السيرة الوظيفية تُكره لأنها تخفي التواريخ. ترتيب زمني عكسي مع شهر/سنة.' });
    const withNums = realExp.filter((e) => hasNumber(e.bullets));
    if (withNums.length) score += 8;
    else
      tips.push({
        id: 'bullets',
        level: 'stop',
        title: 'المهام بلا أثر',
        body: '«مسؤول عن المبيعات» لا يُقرأ. صيغة الـHR: فعل قوي + ماذا فعلت + رقم. 94٪ من السير تُرفض لضعف النقاط لا لنقص الشهادات.',
      });
    const long = realExp.some((e) => e.bullets.split('\n').some((l) => l.trim().length > 180));
    if (long) tips.push({ id: 'wall', level: 'warn', title: 'نقطة أطول من سطرين', body: 'إن تجاوزت النقطة سطرين، أغلب المسؤلين يتجاوزونها.' });
  } else if (realProjects.length) {
    score += 6;
    tips.push({
      id: 'exp',
      level: 'warn',
      title: 'لا خبرة وظيفية — المشاريع تحمل الملف',
      body: 'للطالب والخرّيج: اجعل المشروع يصف مشكلة، دورك، أداة، ونتيجة.',
    });
  } else {
    tips.push({
      id: 'exp',
      level: 'warn',
      title: 'لا توجد خبرة بعد',
      body: 'للخرّيج: املأ المشاريع والتدريب التطبيقي والتطوع. الفراغ في الخبرة مع عنوان «موظف» يُرمى فوراً.',
    });
  }

  const edu = cv.education.filter((e) => e.school.trim());
  if (edu.length) {
    score += 5;
    if (edu.some((e) => e.gpa.trim())) score += 3;
  } else tips.push({ id: 'edu', level: 'warn', title: 'التعليم غير مذكور', body: 'الدرجة والجهة وسنة التخرج تُمسح في الثواني الأولى مع المسمّى.' });

  if (cv.skills.trim()) score += 6;
  else tips.push({ id: 'skills', level: 'warn', title: 'لا مهارات قابلة للفلترة', body: 'ATS يبحث كلمات الإعلان. ضع 8–12 مهارة حقيقية وردت في الوظيفة المستهدفة.' });

  if (cv.languages.some((l) => l.name.trim())) score += 3;

  if (cv.market === 'gulf' || cv.market === 'creative') {
    if (cv.showPhoto && !cv.photo)
      tips.push({
        id: 'photo',
        level: 'warn',
        title: 'صورة الخليج ناقصة',
        body: 'في معظم أدوار الإمارات والسعودية وقطر الصورة المهنية معيار. سيلفي أو صورة جواز قد تؤذي أكثر من حذف الصورة.',
      });
    if (cv.showPhoto && cv.photo && cv.photoEnhanced) score += 3;
    if (!cv.nationality.trim())
      tips.push({ id: 'nat', level: 'warn', title: 'الجنسية غير ظاهرة', body: 'في الخليج الجنسية ترتبط بالتأشيرة والكوتا. إخفاؤها يبدو كسيرة غربية أُرسلت بالخطأ.' });
    if (!cv.visa.trim())
      tips.push({ id: 'visa', level: 'warn', title: 'حالة الإقامة', body: 'قابل للتحويل / إقامة سارية / خارج الدولة — غالباً أول فلتر بعد المسمّى.' });
    else score += 4;
  }

  if (cv.market === 'ats' || cv.market === 'jadarat') {
    if (cv.showPhoto)
      tips.push({
        id: 'photo-ats',
        level: 'warn',
        title: 'الصورة تعيق ATS',
        body: 'للشركات العالمية وجدارات: احذف الصورة والعمر والحالة الاجتماعية. الآلة لا تكافئها والبعض يخفض الملف بسببها.',
      });
    if (cv.template === 'modern' || cv.template === 'gold')
      tips.push({
        id: 'cols',
        level: 'stop',
        title: 'القالب الإبداعي يُكسّر القراءة الآلية',
        body: 'عمودان وجداول وأيقونات تُقرأ بترتيب خاطئ. اختر نواة ناجي أو جدارات لهذا السوق.',
      });
  }

  const courses = cv.courses.filter((c) => c.name.trim());
  if (courses.length) {
    score += 3;
    if (courses.some((c) => !c.issuer.trim() || !c.gained.trim()))
      tips.push({
        id: 'course',
        level: 'warn',
        title: 'دورة بلا جهة أو بلا فائدة',
        body: 'الـHR يسأل: من منحها؟ هل معتمدة؟ ماذا صرت تفعل بعدها؟ اسم الدورة وحدها لا يضيف سطراً.',
      });
    else score += 3;
  }

  const kw = jobKeywordCoverage(cv);
  if (cv.jobPosting.trim().length > 40) {
    if (kw.ratio >= 0.28) score += 8;
    else
      tips.push({
        id: 'kw',
        level: 'warn',
        title: 'ضعف التطابق مع الإعلان',
        body: 'انقل مصطلحات الدور إلى الملخص والمهارات والنقاط — بصدق. ناجي لا يخترع مهارة غائبة.',
      });
  }

  score = Math.max(8, Math.min(100, score));
  if (tips.length === 0) {
    tips.push({
      id: 'ready',
      level: 'ok',
      title: 'السطران الأولان جاهزان للمسح',
      body: 'الاسم، المسمّى، رقم في الملخص، وتواصل واضح. للآلة صدّر PDF نصّي أو Word، لا تعتمد على صورة الصفحة وحدها.',
    });
  }
  return { score, tips: tips.slice(0, 6) };
}

export function bulletsOf(raw: string): string[] {
  return raw
    .split(/\n|•|- /)
    .map((s) => s.replace(/^[•\-\u2013\u2014]\s*/, '').trim())
    .filter(Boolean);
}

export function rangeLabel(start: string, end: string, current: boolean, lang: CvLang) {
  if (!start && !end) return '';
  const now = lang === 'ar' ? 'حتى الآن' : 'Present';
  if (current) return `${start} – ${now}`;
  return [start, end].filter(Boolean).join(' – ');
}

export const CV_STORAGE_KEY = 'naje-cv-draft-v1';

export function hydrateCv(raw: Partial<CvData> | null | undefined): CvData {
  const base = emptyCv();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    experiences: Array.isArray(raw.experiences) && raw.experiences.length ? raw.experiences : base.experiences,
    education: Array.isArray(raw.education) && raw.education.length ? raw.education : base.education,
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    certificates: Array.isArray(raw.certificates) ? raw.certificates : [],
    languages: Array.isArray(raw.languages) && raw.languages.length ? raw.languages : base.languages,
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    publications: Array.isArray(raw.publications) ? raw.publications : [],
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
  };
}

export const NAJE_CV_TRUTH = `أنت ناجي، محرر سير ذاتية للخليج والعربية. قواعد لا تُكسر:
1) لا تخترع وظائف، شركات، جهات تعليم، معدلات GPA، أرقام أداء، شهادات، دورات، أو مهارات لم يذكرها المستخدم صراحة.
2) إن غاب رقم من كلام المستخدم، لا تضف رقماً ولا نسبة ولا عدد سنوات غير مذكور.
3) لا تكتب «مضمون مقابلة» ولا «نسبة قبول ATS» ولا «ATS 97%».
4) أعد فقط ما طُلب، بالعربية الفصيحة العملية بلا كليشيهات (شغوف، محترف، ديناميكي، نتائج مثبتة).
5) إن كانت المعلومات ناقصة، أبقِ النص صادقاً وقصيراً بدل التلفيق.`;

export const ATS_RISK_AR: Record<'low' | 'moderate' | 'high', string> = {
  low: 'منخفضة',
  moderate: 'متوسطة',
  high: 'مرتفعة',
};

export function isDemoCv(cv: CvData): boolean {
  const n = cv.fullName || '';
  return n.includes('مثال ناجي') || n.includes('بيانات تجريبية');
}

export function firstTwoLines(cv: CvData): { name: string; headline: string; summaryFirst: string } {
  const summaryFirst =
    cv.summary
      .trim()
      .split(/\n/)
      .map((s) => s.trim())
      .find(Boolean) || '';
  return { name: cv.fullName.trim(), headline: cv.headline.trim(), summaryFirst };
}

export function appendSkill(skills: string, keyword: string): string {
  const add = keyword.trim();
  if (!add) return skills;
  const items = skills
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.some((s) => s.toLowerCase() === add.toLowerCase())) return skills;
  return [...items, add].join('، ');
}

export function atsRiskLabel(level: 'low' | 'moderate' | 'high'): string {
  return `مخاطر تحليل ATS: ${ATS_RISK_AR[level]}`;
}

export const TIP_JUMP: Record<string, { tab: 'build' | 'coach'; anchor: string }> = {
  name: { tab: 'build', anchor: 'cv-sec-identity' },
  headline: { tab: 'build', anchor: 'cv-sec-identity' },
  contact: { tab: 'build', anchor: 'cv-sec-contact' },
  city: { tab: 'build', anchor: 'cv-sec-contact' },
  summary: { tab: 'build', anchor: 'cv-sec-identity' },
  'summary-num': { tab: 'build', anchor: 'cv-sec-identity' },
  'summary-long': { tab: 'build', anchor: 'cv-sec-identity' },
  exp: { tab: 'build', anchor: 'cv-sec-experience' },
  dates: { tab: 'build', anchor: 'cv-sec-experience' },
  bullets: { tab: 'build', anchor: 'cv-sec-experience' },
  wall: { tab: 'build', anchor: 'cv-sec-experience' },
  edu: { tab: 'build', anchor: 'cv-sec-education' },
  skills: { tab: 'build', anchor: 'cv-sec-skills' },
  certs: { tab: 'build', anchor: 'cv-sec-certs' },
  courses: { tab: 'build', anchor: 'cv-sec-courses' },
  course: { tab: 'build', anchor: 'cv-sec-courses' },
  photo: { tab: 'build', anchor: 'cv-sec-identity' },
  'photo-ats': { tab: 'build', anchor: 'cv-sec-template' },
  nat: { tab: 'build', anchor: 'cv-sec-personal' },
  visa: { tab: 'build', anchor: 'cv-sec-personal' },
  cols: { tab: 'build', anchor: 'cv-sec-template' },
  kw: { tab: 'coach', anchor: 'cv-sec-jobmatch' },
};

export function cvFactsForPrompt(cv: CvData): string {
  const lines: string[] = [];
  const add = (k: string, v?: string) => {
    if (v && v.trim()) lines.push(`${k}: ${v.trim()}`);
  };
  add('الاسم', cv.fullName);
  add('المسمّى', cv.headline);
  add('الوظيفة المستهدفة', cv.targetRole);
  add('الملخص', cv.summary);
  add('البريد', cv.email);
  add('الهاتف', cv.phone);
  add('المدينة', cv.city);
  add('الدولة', cv.country);
  add('الجنسية', cv.nationality);
  add('الإقامة', cv.visa);
  add('المهارات', cv.skills);
  add('التطوع', cv.volunteer);
  add('الخدمة الوطنية', cv.military);
  cv.experiences
    .filter((e) => e.title.trim() || e.company.trim())
    .forEach((e, i) => {
      lines.push(
        `خبرة ${i + 1}: ${e.title} — ${e.company} (${e.start || '?'}–${e.current ? 'حتى الآن' : e.end || '?'}) ${e.city} ${e.employmentType || ''}\n${e.bullets}`
      );
    });
  cv.education
    .filter((e) => e.school.trim() || e.field.trim())
    .forEach((e, i) => {
      lines.push(
        `تعليم ${i + 1}: ${DEGREE_LABELS[e.degreeLevel].ar} ${e.field} — ${e.school} ${e.year} ${e.gpa ? `معدل ${e.gpa}/${e.gpaScale}` : ''} ${e.honors}`
      );
    });
  cv.courses.filter((c) => c.name.trim()).forEach((c) => lines.push(`دورة: ${c.name} — ${c.issuer} ${c.year}`));
  cv.certificates.filter((c) => c.name.trim()).forEach((c) => lines.push(`شهادة: ${c.name} — ${c.issuer} ${c.year}`));
  cv.projects.filter((p) => p.name.trim()).forEach((p) => lines.push(`مشروع: ${p.name} — ${p.role} ${p.year} ${p.detail}`));
  cv.languages.filter((l) => l.name.trim()).forEach((l) => lines.push(`لغة: ${l.name} (${l.level})`));
  cv.achievements.filter((a) => a.title.trim()).forEach((a) => lines.push(`إنجاز: ${a.title} — ${a.org} ${a.year}`));
  cv.publications.filter((p) => p.title.trim()).forEach((p) => lines.push(`نشر: ${p.title} — ${p.venue} ${p.year}`));
  return lines.join('\n') || 'لا توجد بيانات مؤكدة بعد.';
}

export const CV_PATCH_SCHEMA = `أرجع JSON فقط. الحقول المسموحة في patch (Partial CvData) — لا تضف غيرها:
fullName, headline, summary, targetRole, email, phone, city, country, linkedin, portfolio, github,
nationality, dob, age, gender, marital, visa, license, notice, availability, skills, military, volunteer, references, persona,
experiences[{id,title,company,city,start,end,current,bullets,employmentType}],
education[{id,school,degreeLevel,field,gpa,gpaScale,year,honors,showGpa}],
courses[{id,name,issuer,year,hours,accredited,gained,providerType}],
certificates[{id,name,issuer,year,idNumber,expires,url,status}],
languages[{id,name,level}],
projects[{id,name,role,year,detail,link}],
achievements[{id,title,org,year,detail}],
publications[{id,title,venue,year,doi}],
customSections[{id,title,body}].
degreeLevel أحد: high_school|diploma|bachelor|master|phd|board|other.
gpaScale أحد: 4|5|100.
persona أحد: student|graduate|employee|switcher|freelancer|manager|specialist|no_experience.
لا تضع صورة ولا wizardDone ولا coverLetter ولا jobPosting في الاستخراج إلا إن طُلب ذلك.`;

const LIST_FACTORIES = {
  experiences: emptyExperience,
  education: emptyEducation,
  courses: emptyCourse,
  certificates: emptyCertificate,
  languages: emptyLanguage,
  projects: emptyProject,
  achievements: emptyAchievement,
  publications: emptyPublication,
  customSections: emptyCustomSection,
} as const;

function isBlankExperience(e: CvExperience) {
  return !e.title.trim() && !e.company.trim() && !e.bullets.trim();
}
function isBlankEducation(e: CvEducation) {
  return !e.school.trim() && !e.field.trim();
}
function isBlankCourse(e: CvCourse) {
  return !e.name.trim();
}
function isBlankCertificate(e: CvCertificate) {
  return !e.name.trim();
}
function isBlankLanguage(e: CvLanguage) {
  return !e.name.trim();
}
function isBlankProject(e: CvProject) {
  return !e.name.trim();
}
function isBlankAchievement(e: CvAchievement) {
  return !e.title.trim();
}
function isBlankPublication(e: CvPublication) {
  return !e.title.trim();
}
function isBlankCustom(e: CvCustomSection) {
  return !e.title.trim() && !e.body.trim();
}

const BLANK: Record<keyof typeof LIST_FACTORIES, (row: any) => boolean> = {
  experiences: isBlankExperience,
  education: isBlankEducation,
  courses: isBlankCourse,
  certificates: isBlankCertificate,
  languages: isBlankLanguage,
  projects: isBlankProject,
  achievements: isBlankAchievement,
  publications: isBlankPublication,
  customSections: isBlankCustom,
};

const SAME: Partial<Record<keyof typeof LIST_FACTORIES, (a: any, b: any) => boolean>> = {
  experiences: (a, b) =>
    a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
    a.company.trim().toLowerCase() === b.company.trim().toLowerCase() &&
    Boolean(a.title.trim() || a.company.trim()),
  education: (a, b) =>
    a.school.trim().toLowerCase() === b.school.trim().toLowerCase() && a.field.trim().toLowerCase() === b.field.trim().toLowerCase(),
  languages: (a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
  courses: (a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.issuer.trim().toLowerCase() === b.issuer.trim().toLowerCase(),
  certificates: (a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
  projects: (a, b) => a.name.trim().toLowerCase() === b.name.trim().toLowerCase(),
  achievements: (a, b) => a.title.trim().toLowerCase() === b.title.trim().toLowerCase(),
  publications: (a, b) => a.title.trim().toLowerCase() === b.title.trim().toLowerCase(),
  customSections: (a, b) => a.title.trim().toLowerCase() === b.title.trim().toLowerCase(),
};

function mergeList<K extends keyof typeof LIST_FACTORIES>(key: K, current: CvData[K], incoming: unknown): CvData[K] {
  if (!Array.isArray(incoming)) return current;
  const factory = LIST_FACTORIES[key];
  const isBlank = BLANK[key];
  const same = SAME[key];
  const incomingItems = incoming
    .map((raw) => {
      const base = factory() as any;
      if (!raw || typeof raw !== 'object') return base;
      const next = { ...base, ...(raw as object), id: String((raw as any).id || uid()) };
      if (key === 'education') {
        const lvl = next.degreeLevel;
        if (!DEGREE_LABELS[lvl as DegreeLevel]) next.degreeLevel = 'bachelor';
        if (!['4', '5', '100'].includes(String(next.gpaScale))) next.gpaScale = '5';
        next.gpa = next.gpa != null ? String(next.gpa) : '';
        next.showGpa = next.showGpa !== false;
      }
      if (key === 'experiences') {
        next.current = Boolean(next.current);
        next.bullets = typeof next.bullets === 'string' ? next.bullets : Array.isArray(next.bullets) ? next.bullets.join('\n') : '';
      }
      if (key === 'courses' && next.accredited && !['yes', 'no', 'internal', ''].includes(next.accredited)) next.accredited = '';
      return next;
    })
    .filter((row) => !isBlank(row));
  if (!incomingItems.length) return current;
  const kept = (current as any[]).filter((row) => !isBlank(row));
  const out = [...kept];
  for (const item of incomingItems) {
    if (same && out.some((x) => same(x, item))) continue;
    out.push(item);
  }
  return (out.length ? out : current) as CvData[K];
}

const SCALAR_KEYS: (keyof CvData)[] = [
  'fullName',
  'headline',
  'summary',
  'targetRole',
  'jobPosting',
  'email',
  'phone',
  'city',
  'country',
  'linkedin',
  'portfolio',
  'github',
  'nationality',
  'dob',
  'age',
  'gender',
  'marital',
  'visa',
  'license',
  'notice',
  'availability',
  'military',
  'volunteer',
  'references',
  'coverLetter',
];

export function mergeCvPatch(base: CvData, patch: Record<string, unknown> | Partial<CvData> | null | undefined): CvData {
  if (!patch || typeof patch !== 'object') return base;
  const next: CvData = { ...base };
  for (const k of SCALAR_KEYS) {
    const v = (patch as any)[k];
    if (typeof v === 'string' && v.trim()) (next as any)[k] = v.trim();
  }
  if (typeof (patch as any).skills === 'string' && (patch as any).skills.trim()) {
    const bits = String((patch as any).skills)
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    next.skills = bits.reduce((acc, k) => appendSkill(acc, k), next.skills);
  }
  const persona = (patch as any).persona;
  if (typeof persona === 'string' && PERSONAS.some((p) => p.id === persona)) next.persona = persona as CvPersona;
  const lang = (patch as any).lang;
  if (lang === 'ar' || lang === 'en') next.lang = lang;
  const market = (patch as any).market;
  if (market === 'gulf' || market === 'ats' || market === 'jadarat' || market === 'creative') next.market = market;
  next.experiences = mergeList('experiences', next.experiences, (patch as any).experiences);
  next.education = mergeList('education', next.education, (patch as any).education);
  next.courses = mergeList('courses', next.courses, (patch as any).courses);
  next.certificates = mergeList('certificates', next.certificates, (patch as any).certificates);
  next.languages = mergeList('languages', next.languages, (patch as any).languages);
  next.projects = mergeList('projects', next.projects, (patch as any).projects);
  next.achievements = mergeList('achievements', next.achievements, (patch as any).achievements);
  next.publications = mergeList('publications', next.publications, (patch as any).publications);
  next.customSections = mergeList('customSections', next.customSections, (patch as any).customSections);
  return next;
}

export function patchPreviewLines(patch: Partial<CvData> | Record<string, unknown>): string[] {
  const lines: string[] = [];
  const p = patch as any;
  if (p.fullName) lines.push(`الاسم: ${p.fullName}`);
  if (p.headline) lines.push(`المسمّى: ${p.headline}`);
  if (p.summary) lines.push(`ملخص: ${String(p.summary).slice(0, 140)}`);
  if (p.email || p.phone) lines.push(`تواصل: ${[p.email, p.phone].filter(Boolean).join(' · ')}`);
  if (p.city) lines.push(`مدينة: ${p.city}`);
  if (p.skills) lines.push(`مهارات: ${p.skills}`);
  if (Array.isArray(p.experiences)) p.experiences.forEach((e: any) => lines.push(`خبرة: ${e?.title || ''} — ${e?.company || ''}`));
  if (Array.isArray(p.education)) p.education.forEach((e: any) => lines.push(`تعليم: ${e?.field || ''} — ${e?.school || ''}`));
  if (Array.isArray(p.courses)) p.courses.forEach((e: any) => lines.push(`دورة: ${e?.name || ''}`));
  if (Array.isArray(p.certificates)) p.certificates.forEach((e: any) => lines.push(`شهادة: ${e?.name || ''}`));
  if (Array.isArray(p.projects)) p.projects.forEach((e: any) => lines.push(`مشروع: ${e?.name || ''}`));
  if (Array.isArray(p.languages)) p.languages.forEach((e: any) => lines.push(`لغة: ${e?.name || ''}`));
  return lines.filter((l) => l.replace(/.*:\s*/, '').trim()).slice(0, 12);
}
