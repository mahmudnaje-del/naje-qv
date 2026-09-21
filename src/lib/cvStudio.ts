export type CvMarket = 'gulf' | 'ats' | 'jadarat' | 'creative';
export type CvLang = 'ar' | 'en';
export type CvTemplate = 'naje' | 'gulf' | 'jadarat' | 'gold' | 'modern' | 'academic';

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
}

export interface CvCourse {
  id: string;
  name: string;
  issuer: string;
  year: string;
  hours: string;
  accredited: 'yes' | 'no' | 'internal' | '';
  gained: string;
}

export interface CvCertificate {
  id: string;
  name: string;
  issuer: string;
  year: string;
  idNumber: string;
  expires: string;
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
  market: CvMarket;
  lang: CvLang;
  template: CvTemplate;
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
  return { id: uid(), title: '', company: '', city: '', start: '', end: '', current: false, bullets: '' };
}
export function emptyEducation(): CvEducation {
  return { id: uid(), school: '', degreeLevel: 'bachelor', field: '', gpa: '', gpaScale: '5', year: '', honors: '' };
}
export function emptyCourse(): CvCourse {
  return { id: uid(), name: '', issuer: '', year: '', hours: '', accredited: '', gained: '' };
}
export function emptyCertificate(): CvCertificate {
  return { id: uid(), name: '', issuer: '', year: '', idNumber: '', expires: '' };
}
export function emptyLanguage(): CvLanguage {
  return { id: uid(), name: '', level: 'b2' };
}
export function emptyProject(): CvProject {
  return { id: uid(), name: '', role: '', year: '', detail: '' };
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
    languages: [{ id: uid(), name: 'العربية', level: 'native' }, { id: uid(), name: 'English', level: 'b2' }],
    projects: [],
    market: 'gulf',
    lang: 'ar',
    template: 'gulf',
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

function hasNumber(s: string) {
  return /\d/.test(s);
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
      body: '80٪ من مسح الـ6 ثوانٍ يذهب للاسم والمسمّى الحالي/المستهدف. اكتب المسمّى الذي تريد أن يُصنَّف تحته — لا «باحث عن عمل».',
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

  if (cv.jobPosting.trim().length > 40) {
    const hay = `${cv.headline} ${cv.summary} ${cv.skills} ${cv.experiences.map((e) => e.bullets).join(' ')}`.toLowerCase();
    const keys = cv.jobPosting
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#]+/u)
      .filter((w) => w.length > 3)
      .slice(0, 24);
    const hit = keys.filter((k) => hay.includes(k)).length;
    const ratio = keys.length ? hit / keys.length : 0;
    if (ratio >= 0.28) score += 8;
    else
      tips.push({
        id: 'kw',
        level: 'warn',
        title: 'ضعف التطابق مع الإعلان',
        body: '99٪ من السير تفشل لأن الخبرة لا تغطي ما يطلبه الإعلان. انقل مصطلحات الدور إلى الملخص والمهارات والنقاط — بصدق.',
      });
  }

  score = Math.max(8, Math.min(100, score));
  if (tips.length === 0) {
    tips.push({
      id: 'ready',
      level: 'ok',
      title: 'السطران الأولان جاهزان للمسح',
      body: 'الاسم، المسمّى، رقم في الملخص، وتواصل واضح. راجع التصدير كـPDF نصّي لا صورة.',
    });
  }
  return { score, tips: tips.slice(0, 5) };
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
