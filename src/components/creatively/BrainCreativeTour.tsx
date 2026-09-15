import React, { useState, useEffect } from 'react';
import { 
  Brain, Cpu, Layers, Compass, Sliders, Play, 
  Sparkles, Check, Lightbulb, Eye, ChevronLeft, 
  HelpCircle, Zap, Code, Shield, MessageSquare, 
  Palette, Type, RefreshCw, Star, Info
} from 'lucide-react';

interface BrainCreativeTourProps {
  lang: 'ar' | 'en';
  onBack: () => void;
}

const SAMPLE_PROJECTS = [
  {
    id: 'roastery',
    titleAr: 'مقهى ومحمصة أثرية دافئة',
    titleEn: 'Cozy Antique Roastery',
    descAr: 'مقهى يقدم القهوة المختصة مع طابع خشبي تراثي وأجواء دافئة مريحة.',
    descEn: 'Specialty coffee roastery featuring a warm heritage wooden interior.',
    industryAr: 'الضيافة والمطاعم',
    industryEn: 'Hospitality & Restaurants',
    traits: ['كلاسيكي', 'ودود', 'طبيعي', 'أنيق'],
    traitsEn: ['Classic', 'Friendly', 'Natural', 'Elegant'],
    emotions: ['الود', 'الفخامة', 'البساطة'],
    emotionsEn: ['Friendliness', 'Luxury', 'Simplicity'],
    colors: [
      { hex: '#78350F', nameAr: 'بني خشبي عتيق', nameEn: 'Antique Wood Brown', descAr: 'يعزز الشعور بالأصالة والدفء والترابط الاجتماعي.', descEn: 'Enhances the feeling of heritage, warmth, and social gathering.' },
      { hex: '#FCD34D', nameAr: 'ذهبي دافئ مضيء', nameEn: 'Warm Amber Gold', descAr: 'يضفي طاقة ترحيبية راقية مريحة للعين.', descEn: 'Infuses an upscale, welcoming energy that is comfortable to the eye.' }
    ],
    typography: 'Space Grotesk (عرض العناوين) + Inter (النصوص)',
    geometryAr: 'شكل دائري متوازن يرمز للتجمع، مع نقوش دقيقة مستوحاة من أوراق شجر البن.',
    geometryEn: 'Circular emblem representing gathering, accented by coffee leaf linework.',
    prompt: 'Premium organic heritage specialty coffee house logo, rustic brass coffee bean emblem, circular stamp typography, antique wood texture backdrop, cinematic volumetric golden lighting, luxury matte finish, extremely photorealistic --v 6.0',
    sloganAr: 'للقهوة حكاية.. وللأصالة عنوان دافئ',
    sloganEn: 'Every bean tells a story, every corner breathes heritage',
    videoScenarioAr: 'يبدأ المشهد بـ زووم إن بطيء على حبات بن تدور فوق منضدة خشبية عتيقة، مع تصاعد بخار دافئ يتقاطع مع خيوط إضاءة ذهبية. صوت طحن القهوة اليدوي يملأ الأثير متبوعاً بشعار المحمصة المضيء.',
    videoScenarioEn: 'Slow cinematic zoom on coffee beans rotating on a rustic dark oak table, warm steam rising through golden morning light rays. Sound of mechanical grinding fades into the glowing warm roastery emblem.'
  },
  {
    id: 'pharmacy',
    titleAr: 'صيدلية تقنية ومجمع رعاية رقمي',
    titleEn: 'Innovative Digital Care Hub',
    descAr: 'صيدلية ومجمع رعاية طبية يدمج الذكاء الاصطناعي مع الخدمات الصحية السريعة.',
    descEn: 'A future-forward medical pharmacy merging health sciences with fast AI services.',
    industryAr: 'الرعاية الطبية والتقنية',
    industryEn: 'Healthcare & Technology',
    traits: ['تقني', 'بسيط', 'موثوق', 'مستقبلي'],
    traitsEn: ['Tech', 'Simple', 'Reliable', 'Futuristic'],
    emotions: ['الأمان', 'الثقة', 'التميز'],
    emotionsEn: ['Safety', 'Trust', 'Distinctiveness'],
    colors: [
      { hex: '#06B6D4', nameAr: 'سماوي تقني ساطع', nameEn: 'Bright Cyan Tech', descAr: 'يرمز للنقاء والوضوح والتقنيات الطبية المتقدمة والذكاء.', descEn: 'Symbolizes purity, clarity, advanced medical science, and cyber intelligence.' },
      { hex: '#0F172A', nameAr: 'رمادي ليلي عميق', nameEn: 'Obsidian Midnight Gray', descAr: 'يوفر تباينًا عاليًا وهيبة رسمية توحي بالانضباط والأمان.', descEn: 'Provides sharp contrast and corporate prestige, conveying discipline and safety.' }
    ],
    typography: 'JetBrains Mono (بيانات تقنية) + Inter (نصوص موثوقة)',
    geometryAr: 'خطوط مونو-لاين متقاطعة تعبر عن الرابط الجيني الطبي والمستقبل التكنولوجي السحابي.',
    geometryEn: 'Monoline DNA cross helix representing scientific research integrated with technology.',
    prompt: 'Minimalist futuristic medical health hub logo, clean geometric double helix icon, cyan glow neon filaments, clinical medical grade steel backing, subtle dynamic UI metrics overlay, volumetric cyber light --v 6.0',
    sloganAr: 'رعاية ذكية تفهم احتياجك بنبض المستقبل',
    sloganEn: 'Smart healing powered by technology, trusted for generations',
    videoScenarioAr: 'المشهد يعرض كبسولة رعاية مضيئة تنفتح بسلاسة، مع شاشات هولوغرام زرقاء تعرض مؤشرات حيوية بدقة متناهية. تتقارب خطوط النور لتشكل واجهة الصيدلية المستقبلية البراقة بوهج أزرق ساحر.',
    videoScenarioEn: 'A glowing medical care pod opens smoothly, displaying cybernetic hologram health metrics in deep blue. Light lines converge to showcase the glowing cyan glass pharmacy storefront.'
  },
  {
    id: 'burger',
    titleAr: 'مطعم برجر عصري مفعم بالحيوية',
    titleEn: 'Energetic Modern Burger Shop',
    descAr: 'مطعم وجبات سريعة يقدم برجر مشوي على اللهب بأسلوب جرافيتي شبابي صاخب.',
    descEn: 'Gourmet flame-grilled burger place with a loud youth-oriented graffiti vibe.',
    industryAr: 'الأغذية والمطاعم والترفيه',
    industryEn: 'Food & Entertainment',
    traits: ['شبابي', 'جريء', 'حيوي', 'مرح'],
    traitsEn: ['Youthful', 'Bold', 'Lively', 'Fun'],
    emotions: ['الإبداع', 'التميز', 'الحداثة'],
    emotionsEn: ['Creativity', 'Distinctiveness', 'Modernity'],
    colors: [
      { hex: '#F97316', nameAr: 'برتقالي لهبي مشتعل', nameEn: 'Fiery Orange Burn', descAr: 'يحفز الرغبة والشهية ويوحي بالحيوية والحرارة والمذاق الحار.', descEn: 'Stimulates desire and appetite, evoking energy, heat, and flame-grilled taste.' },
      { hex: '#E11D48', nameAr: 'وردي جريء / أحمر كرزي', nameEn: 'Bold Cherry Red', descAr: 'يجذب الانتباه فورياً، ويعطي انطباع السرعة والجرأة والجنون الإبداعي.', descEn: 'Immediately captures visual attention, conveying speed, boldness, and creative flair.' }
    ],
    typography: 'Outfit Display (عريض لافت) + Inter (مقروئية عالية)',
    geometryAr: 'أشكال مسارات اللهب مع شطائر مقسمة بزوايا حادة مائلة ترمز للسرعة والديناميكية والشباب.',
    geometryEn: 'Flame trails fused with stylized sharp-angled burger patties, representing energy and speed.',
    prompt: 'Bold modern burger brand logo design, dynamic flame trails enveloping delicious neon burger outline, street art graffiti spray paint textures, vibrant orange and pink color splash, dark alley brick wall background --v 6.0',
    sloganAr: 'طعم يلهب حواسك.. جنون في كل قطمة',
    sloganEn: 'Ignite your taste buds, pure culinary madness in every bite',
    videoScenarioAr: 'المشهد يعرض تصاعد لهب حقيقي مفعم بالسرعة خلف شريحة لحم مشوية تدور في الهواء بحركة بطيئة (Slow-Mo). قطرات الجبن الذائب تتطاير بجمال، تليها ضربة إضاءة قوية تُظهر لوحة المحل المضيئة بلون برتقالي ملتهب.',
    videoScenarioEn: 'Fast-paced edits of roaring fire flames behind a juicy gourmet patty spinning in slow motion. Melting cheddar splatters dramatically, followed by a sudden neon strike revealing the fiery orange storefront sign.'
  }
];

export default function BrainCreativeTour({ lang, onBack }: BrainCreativeTourProps) {
  const [selectedProj, setSelectedProj] = useState(SAMPLE_PROJECTS[0]);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [simNightView, setSimNightView] = useState(true);

  // Auto-step simulation handler
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      if (simulationStep < 4) {
        const stepTextsAr = [
          'جاري تفكيك النص واستنباط سمات ومجال العمل والمشاعر المناسبة للهوية...',
          'جاري تطبيق نظرية الألوان وتحديد الأشكال الهندسية ونوعية الخطوط المعتمدة...',
          'جاري بناء وهندسة صياغة الموجه الذكي وصقل الكلمات المفتاحية للبصريات...',
          'جاري دمج النتائج وتجهيز واجهات محاكاة البيئة الواقعية للهوية واللوحات الإعلانية...'
        ];
        const stepTextsEn = [
          'Analyzing brand keywords, extracting target traits and emotional psychology indicators...',
          'Applying color theories, matching geometric systems, and picking ideal typography pairings...',
          'Formulating backend prompt directives and optimizing lighting & materials keys...',
          'Synthesizing final output packages and readying real-world environment simulator...'
        ];
        
        setCurrentProgressText(lang === 'ar' ? stepTextsAr[simulationStep] : stepTextsEn[simulationStep]);
        
        timer = setTimeout(() => {
          setSimulationStep(prev => prev + 1);
        }, 2200);
      } else {
        setIsSimulating(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulating, simulationStep, lang]);

  const startSimulation = () => {
    setSimulationStep(0);
    setIsSimulating(true);
  };

  const changeProject = (proj: typeof SAMPLE_PROJECTS[0]) => {
    setSelectedProj(proj);
    setSimulationStep(0);
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-8 md:py-12 px-4 md:px-8 relative overflow-x-hidden overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Absolute visual ambient lights */}
      <div className="fixed top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header navigation section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-center text-slate-300 hover:text-white"
              title={lang === 'ar' ? 'رجوع للرئيسية' : 'Back to Home'}
            >
              <ChevronLeft className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
            </button>
            <div className="text-start">
              <div className="flex items-center gap-2">
                <Brain className="w-7 h-7 text-fuchsia-400 animate-pulse" />
                <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-teal-400">
                  {lang === 'ar' ? 'مختبر عقل خوارزمية الذكاء الاصطناعي' : 'AI Algorithm Core Brain Lab'}
                </h1>
              </div>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                {lang === 'ar' ? 'محاكاة تفاعلية حية لطريقة تفكير وابتكار الهويات البصرية واللوحات الإعلانية في الخلفية' : 'Live interactive simulation of back-end creative thoughts, branding theories, & billboard rendering'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-bold font-mono">CORE_ENGINE: ACTIVE v3.5</span>
          </div>
        </div>

        {/* Introduction Dashboard info card */}
        <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 bg-fuchsia-500/10 rounded-2xl border border-fuchsia-500/20 text-fuchsia-400 shrink-0">
            <Cpu className="w-10 h-10 animate-spin-slow" />
          </div>
          <div className="text-start space-y-1.5 grow">
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {lang === 'ar' ? 'كيف تصنع الخوارزمية الفخامة والإبداع؟' : 'How does the algorithm craft luxury and creativity?'}
            </h3>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              {lang === 'ar' 
                ? 'خلافاً للمولدات العشوائية، تتبع خوارزميتنا قواعد ثابتة في هندسة التصميم. تبدأ بفك دلالات الكلمات، وتحليل علم النفس اللوني والرموز الهندسية، ثم تركيب موجه فائق الدقة ومطابقة أبعاد اللوحات مع الواقع لضمان أعلى مستويات الفخامة.'
                : 'Unlike random generators, our algorithm implements strict engineering principles. It analyzes semantics, utilizes color psychology, chooses geometric frameworks, designs prompts, and calculates precise environmental aspect ratios for the finest aesthetics.'}
            </p>
          </div>
        </div>

        {/* Main interactive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Selection & Parameters (lg:col-span-4) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Step A: Select Brand Scenario */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl text-start">
              <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center justify-center text-xs font-bold">1</span>
                {lang === 'ar' ? 'اختر فكرة النشاط للتجربة' : 'Select a Brand Scenario'}
              </h3>
              
              <div className="flex flex-col gap-3">
                {SAMPLE_PROJECTS.map(proj => {
                  const isSelected = selectedProj.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => changeProject(proj)}
                      className={`p-4 rounded-2xl border text-start transition-all duration-300 relative overflow-hidden ${
                        isSelected 
                          ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(217,70,239,0.15)]'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {lang === 'ar' ? proj.titleAr : proj.titleEn}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-fuchsia-400 shrink-0" />}
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                        {lang === 'ar' ? proj.descAr : proj.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step B: Start Simulating Control block */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl text-start flex flex-col gap-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">2</span>
                {lang === 'ar' ? 'لوحة التحكم والتشغيل' : 'Simulation Control Console'}
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                {lang === 'ar' 
                  ? 'انقر لبدء المحاكاة ومشاهدة كيف تتلقى عقول الخوارزمية مدخلاتك وتقسمها وتخرج التصميم النهائي.'
                  : 'Click to boot up the generator’s brain and watch how it processes inputs to synthesize files.'}
              </p>

              <button
                type="button"
                onClick={startSimulation}
                disabled={isSimulating}
                className={`w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 border ${
                  isSimulating 
                    ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 cursor-not-allowed animate-pulse'
                    : 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white border-white/20 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-fuchsia-400" />
                    <span>{lang === 'ar' ? 'العقل الإبداعي يفكر حالياً...' : 'Thinking Process Active...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{lang === 'ar' ? 'تشغيل محاكاة التفكير' : 'Start Thought Simulation'}</span>
                  </>
                )}
              </button>

              {isSimulating && (
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center gap-3 mt-2 animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping shrink-0" />
                  <p className="text-slate-300 text-xs font-medium leading-normal text-start">
                    {currentProgressText}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Engine metrics */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 text-start space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>PARSING ENGINE:</span>
                <span className="text-teal-400 font-bold">GPT-SEMANTIC-V3</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>RATIO COMPUTATION:</span>
                <span className="text-indigo-400 font-bold">GRID-ASPECT-CALC</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>RENDER MODE:</span>
                <span className="text-fuchsia-400 font-bold">HIGH-GLOW-EMISSIVE</span>
              </div>
              <div className="flex justify-between">
                <span>COMPILER ENGINE:</span>
                <span className="text-amber-400 font-bold">PDF-KIT-VECTORIZER</span>
              </div>
            </div>

          </div>

          {/* Right Column: Thought Simulator Output (lg:col-span-8) */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-start">
            
            {/* Visualizer Frame */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 md:p-7 backdrop-blur-xl flex flex-col gap-6 relative min-h-[450px]">
              
              {/* Shimmer overlay for when simulation is active */}
              {isSimulating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full border-4 border-fuchsia-500/25 flex items-center justify-center">
                      <Brain className="w-10 h-10 text-fuchsia-400 animate-bounce" />
                    </div>
                    <div className="absolute top-0 inset-x-0 w-20 h-20 rounded-full border-4 border-t-fuchsia-500 border-r-transparent border-l-transparent border-b-transparent animate-spin" />
                  </div>
                  <h4 className="text-white text-lg font-bold">
                    {lang === 'ar' ? 'جاري محاكاة مراحل الإبداع والتفكير...' : 'Simulating Thinking Logic Steps...'}
                  </h4>
                  <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                    {currentProgressText}
                  </p>

                  {/* Animated step ticks */}
                  <div className="flex items-center gap-2 mt-6">
                    {[0, 1, 2, 3].map(step => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          simulationStep >= step ? 'w-8 bg-fuchsia-500' : 'w-2 bg-white/20'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 1: Semantic Breakdown Details */}
              <div className={`space-y-3 transition-all duration-500 ${simulationStep >= 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center text-[10px] font-bold">Step 1</span>
                    {lang === 'ar' ? 'الخطوة 1: تفكيك المفاهيم والتأثير السيكولوجي' : 'Stage 1: Semantic Parsing & Psychology'}
                  </h4>
                  {simulationStep >= 1 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">COMPILED</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 border border-white/5 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider">{lang === 'ar' ? 'السمات المستنبطة (Traits)' : 'Extracted Traits'}</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(lang === 'ar' ? selectedProj.traits : selectedProj.traitsEn).map((t, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] text-slate-300 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider">{lang === 'ar' ? 'المشاعر المستهدفة (Emotions)' : 'Targeted Emotions'}</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(lang === 'ar' ? selectedProj.emotions : selectedProj.emotionsEn).map((em, idx) => (
                        <span key={idx} className="px-2 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 rounded-md text-[11px] font-medium">
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* STAGE 2: Geometric Mapping & Color Theory */}
              <div className={`space-y-3 transition-all duration-500 ${simulationStep >= 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold">Step 2</span>
                  {lang === 'ar' ? 'الخطوة 2: صياغة المخطط الهندسي والبصري' : 'Stage 2: Geometrical & Visual Design System'}
                </h4>

                <div className="space-y-3 bg-black/30 border border-white/5 p-4 rounded-2xl">
                  {/* Colors psychology */}
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider mb-2">{lang === 'ar' ? 'سيكولوجية الألوان المختارة' : 'Color Theory & Palette'}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProj.colors.map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl border border-white/10">
                          <div className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-inner" style={{ backgroundColor: c.hex }} />
                          <div className="text-xs">
                            <span className="font-bold text-white block">{lang === 'ar' ? c.nameAr : c.nameEn}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{lang === 'ar' ? c.descAr : c.descEn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Font & Geometry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider mb-1.5">{lang === 'ar' ? 'النمط الهندسي والرموز' : 'Geometry & Symbolism'}</span>
                      <p className="text-slate-300 leading-normal text-[11px]">
                        {lang === 'ar' ? selectedProj.geometryAr : selectedProj.geometryEn}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider mb-1.5">{lang === 'ar' ? 'الخطوط والطباعة' : 'Typography Hierarchy'}</span>
                      <p className="text-slate-300 font-bold font-mono">
                        {selectedProj.typography}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STAGE 3: Behind Scenes Prompting */}
              <div className={`space-y-3 transition-all duration-500 ${simulationStep >= 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-bold">Step 3</span>
                  {lang === 'ar' ? 'الخطوة 3: تركيب الموجه الذكي وصقل المعالم' : 'Stage 3: Advanced AI Prompt Orchestration'}
                </h4>

                <div className="bg-slate-950/90 border border-white/10 p-4 rounded-2xl relative group font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto text-start">
                  <div className="absolute top-3 right-3 text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                    PROMPT_TEMPLATE
                  </div>
                  <code className="block mt-2 select-all whitespace-pre-wrap select-text">
                    {selectedProj.prompt}
                  </code>
                </div>
              </div>

              {/* STAGE 4: Immersive Outputs Preview */}
              <div className={`space-y-4 transition-all duration-500 ${simulationStep >= 4 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center text-[10px] font-bold">Step 4</span>
                  {lang === 'ar' ? 'الخطوة 4: مخرجات الهوية والسيناريوهات الناتجة' : 'Stage 4: Synthesized Visual Output & Scenarios'}
                </h4>

                {/* Slogan & Copywriting block */}
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
                  <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider">{lang === 'ar' ? 'صياغة شعار تسويقي (Slogan / Copywriting)' : 'Marketing Slogan Draft'}</span>
                  <p className="text-white text-base font-extrabold flex items-center gap-2">
                    <span className="text-lg text-fuchsia-400">“</span>
                    {lang === 'ar' ? selectedProj.sloganAr : selectedProj.sloganEn}
                    <span className="text-lg text-fuchsia-400">”</span>
                  </p>
                </div>

                {/* Simulated Interactive Billboard */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                  <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-xs font-bold text-white">
                        {lang === 'ar' ? 'معاين اللوحة والبيئة التفاعلي' : 'Interactive Storefront Billboard Simulator'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimNightView(!simNightView)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        simNightView 
                          ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' 
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {simNightView 
                        ? (lang === 'ar' ? 'الوضع المسائي' : 'Night View') 
                        : (lang === 'ar' ? 'الوضع النهاري' : 'Day View')}
                    </button>
                  </div>

                  {/* Simulator container */}
                  <div className={`relative h-44 flex flex-col items-center justify-end p-4 overflow-hidden transition-all duration-700 ${
                    simNightView 
                      ? 'bg-gradient-to-b from-slate-950 to-slate-900 text-white' 
                      : 'bg-gradient-to-b from-sky-200 to-slate-200 text-slate-800'
                  }`}>
                    
                    {/* Simulated Facade glass doors */}
                    <div className={`absolute bottom-0 w-36 h-20 border-t border-x rounded-t-lg transition-colors ${
                      simNightView ? 'bg-black/30 border-white/15' : 'bg-stone-300/60 border-stone-400/50'
                    }`} />

                    {/* Glowing Billboard */}
                    <div className={`absolute bottom-12 w-[85%] h-16 border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-500 z-10 ${
                      simNightView 
                        ? `bg-black/90 ${
                            selectedProj.id === 'roastery' ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' :
                            selectedProj.id === 'pharmacy' ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' :
                            'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                          }`
                        : 'bg-white border-slate-300 shadow-md'
                    }`}>
                      {/* Logo and Slogan */}
                      <span className={`text-xs font-mono tracking-wider font-extrabold uppercase ${
                        simNightView 
                          ? (selectedProj.id === 'roastery' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                             selectedProj.id === 'pharmacy' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' :
                             'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]')
                          : 'text-slate-900'
                      }`}>
                        {lang === 'ar' ? selectedProj.titleAr : selectedProj.titleEn}
                      </span>
                      <span className={`text-[8px] truncate max-w-full opacity-80 mt-1 ${simNightView ? 'text-slate-300' : 'text-slate-500'}`}>
                        {lang === 'ar' ? selectedProj.sloganAr : selectedProj.sloganEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promotional Video Ad Scenario */}
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-2">
                  <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider">{lang === 'ar' ? 'سيناريو الفيديو الإعلاني المولد (Video Script & Audio)' : 'Generated Video Ad Scenario & Script'}</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {lang === 'ar' ? selectedProj.videoScenarioAr : selectedProj.videoScenarioEn}
                  </p>
                </div>

              </div>

              {/* STAGE 0: Default State when not active or simulated */}
              {simulationStep === 0 && !isSimulating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-4">
                    <Sliders className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>
                  <h4 className="text-white text-base font-bold">
                    {lang === 'ar' ? 'جاهز لبدء جولة محاكاة التفكير' : 'Ready to Start Thought Tour'}
                  </h4>
                  <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                    {lang === 'ar' 
                      ? 'يرجى اختيار نشاط من القائمة الجانبية ثم الضغط على "تشغيل محاكاة التفكير" لمتابعة مراحل هندسة الأفكار والذكاء.'
                      : 'Please choose an activity from the panel and click "Start Thought Simulation" to watch creative algorithms map your brand.'}
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Core Principles & Theory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start mt-4">
          <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
            <Palette className="w-5 h-5 text-fuchsia-400" />
            <h4 className="text-sm font-bold text-white">{lang === 'ar' ? 'علم نفس الألوان (Color Psychology)' : 'Color Psychology'}</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'لا نعتمد على ألوان عشوائية بل ندرس الانطباع العصبي للعميل. فالذهب يعطي شعوراً بالأصالة والرفاهية، بينما يرمز السيان إلى الدقة والذكاء التقني السحابي.'
                : 'Colors are never chosen at random. We study neural impressions. Amber represents heritage and authenticity, whereas cyan portrays precise cloud intelligence and care.'}
            </p>
          </div>
          <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">{lang === 'ar' ? 'الهندسة والنسبة الذهبية (Aspect Golden Ratio)' : 'Geometric Architecture'}</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'ندمج نسب العرض بالارتفاع للوحات الإعلانية (مثل 2:1 و3:1) لنضمن أن تظهر النصوص بجمالية مطلقة تتماشى مع زوايا الرؤية ومسافات مرور المشاة بالواقع.'
                : 'We merge billboard aspect ratios (such as 2:1 and 3:1) to guarantee typography displays with absolute aesthetics corresponding to real pedestrian distance angles.'}
            </p>
          </div>
          <div className="bg-slate-900/40 border border-white/10 p-5 rounded-2xl flex flex-col gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">{lang === 'ar' ? 'صياغة الموجه المحكم (Prompt Engineering)' : 'Prompt Engineering'}</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              {lang === 'ar' 
                ? 'نقوم بصناعة الموجه الخلفي تلقائياً بإضافة لمسات فوتوغرافية ومواد تشطيب كالمطفي اللامع والبرونز العتيق، لتحفيز محرك التوليد بأعلى دقة.'
                : 'Our backend constructs rich context automatically by injecting photographic cues like matte finishes and antique bronze, prompting generative engines to highest standards.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
