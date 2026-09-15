import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Bot, Palette, Film, Wand2, Layers, 
  LayoutTemplate, Image as ImageIcon, Video, 
  MessageSquare, BrainCircuit, Globe, ChevronRight,
  MonitorSmartphone, PenTool, Focus, Rocket, Fingerprint, ScanFace, Cuboid
} from 'lucide-react';
import NajeSpinner from '../NajeSpinner';

interface WelcomeScreenProps {
  lang: 'ar' | 'en';
  onLangChange?: (lang: 'ar' | 'en') => void;
  onNavigate: (screen: any, mode?: any, createNewChat?: boolean) => void;
  onSecretClick: () => void;
  userName?: string;
}

export function WelcomeScreen({ lang = 'ar', onNavigate, onSecretClick, userName }: WelcomeScreenProps) {
  const isAr = true;
  const { scrollYProgress } = useScroll();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCardClick = (id: string, screen: any, mode?: any, isChat?: boolean) => {
    if (loadingId) return;
    setLoadingId(id);
    setTimeout(() => {
      onNavigate(screen, mode, isChat);
    }, 300);
  };

  const navItems = [
    { id: 'app_main', icon: Palette, nameAr: 'انشئ شعارك او هويتك البصرية', nameEn: 'Create Logo or Brand Identity', targetAr: 'للمصممين وصناع المحتوى', targetEn: 'For designers and content creators', descAr: 'صمم هويتك البصرية المبتكرة وشعاراتك باحترافية عالية وبأدوات ذكية متطورة.', descEn: 'Design your innovative brand identity and logos professionally with advanced smart tools.', color: 'from-blue-400 to-cyan-500', textColor: 'text-blue-400', dotColor: 'bg-blue-400', screen: 'app' },
    { id: 'app_brand_kit', icon: Layers, nameAr: 'مولد حزمة الهوية البصرية المتكاملة', nameEn: 'Integrated Brand Kit Generator', targetAr: 'للشركات والمؤسسات', targetEn: 'For companies and institutions', descAr: 'نظام متقدم لتوليد استراتيجيات وحزم الهوية البصرية الشاملة للعلامات التجارية.', descEn: 'An advanced system for generating comprehensive brand identity strategies and kits.', color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-400', dotColor: 'bg-emerald-400', screen: 'app', mode: 'brand_kit' },
    { id: 'gallery', icon: ImageIcon, nameAr: 'المعرض', nameEn: 'Gallery', targetAr: 'للباحثين عن الإلهام', targetEn: 'For inspiration seekers', descAr: 'معرض حصري يضم أرقى الإبداعات لتستلهم منها رؤيتك وتثري مشاريعك القادمة.', descEn: 'An exclusive gallery featuring the finest creations to inspire your vision and enrich future projects.', color: 'from-rose-400 to-fuchsia-500', textColor: 'text-rose-400', dotColor: 'bg-rose-400', screen: 'gallery' },
  ];

  return (
    <div className="bg-[#030303] min-h-full text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] ltr:left-[-10%] rtl:right-[-10%] w-[40rem] h-[40rem] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] ltr:right-[-10%] rtl:left-[-10%] w-[50rem] h-[50rem] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[20%] w-[30rem] h-[30rem] bg-blue-900/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-16 md:pt-20 pb-12 px-6 text-center max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center w-full"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userName ? `أهلاً بك ${userName} — نُبدع لك في كل بكسل` : 'أهلاً بك — نُبدع لك في كل بكسل'}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.2] mb-8 max-w-4xl mx-auto">
              {isAr ? (
                <>وكالتك الإبداعية المتكاملة <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-teal-400">المدعومة بالذكاء الاصطناعي</span></>
              ) : (
                <>Your Complete Creative Agency <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-teal-400">Powered by AI</span></>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-16 font-light">
              {isAr 
                ? 'منصة تصميم احترافية تحول أفكارك إلى هويات بصرية، شعارات، وفيديوهات إعلانية مذهلة. أدوات متقدمة تفهم رؤيتك وتصيغها بأدق التفاصيل.' 
                : 'A professional design platform that turns your ideas into stunning brand identities, logos, and video ads. Advanced tools that understand your vision and craft it to the finest details.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {navItems.map((item, i) => {
                const isLoading = loadingId === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                    disabled={loadingId !== null}
                    onClick={() => handleCardClick(item.id, item.screen, item.mode, false)}
                    className={`group relative p-8 rounded-[2rem] bg-white/[0.04] border backdrop-blur-2xl transition-all duration-500 text-start overflow-hidden flex flex-col items-start gap-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_0_rgba(147,51,234,0.15)] z-10 hover:z-20 transform ${
                      isLoading 
                        ? 'border-purple-500/60 bg-purple-950/20 scale-[0.98] shadow-[0_0_30px_rgba(168,85,247,0.3)]' 
                        : 'border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:scale-95 hover:-translate-y-1'
                    }`}
                  >
                    <div className="w-full flex flex-col gap-4">
                      <div className="w-full flex justify-between items-center">
                        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${item.color} ${isLoading ? 'bg-purple-500/20 border-purple-500/50 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-opacity-10 border-white/5 group-hover:scale-110'} text-white shadow-lg border transition-all duration-300`}>
                          {isLoading ? <NajeSpinner className="w-6 h-6 text-purple-300" /> : <item.icon className="w-6 h-6" />}
                        </div>
                        {isLoading ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse">
                            <NajeSpinner className="w-3.5 h-3.5" />
                            <span className="text-[10px] md:text-xs font-bold tracking-wide">
                              {isAr ? 'جاري التحميل...' : 'Loading...'}
                            </span>
                          </div>
                        ) : item.targetAr ? (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md ${item.textColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} shadow-[0_0_8px_currentColor]`}></span>
                            <span className="text-[10px] md:text-xs font-medium tracking-wide">
                              {isAr ? item.targetAr : item.targetEn}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-2 text-base md:text-lg group-hover:text-white/90 transition-colors">{isAr ? item.nameAr : item.nameEn}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">{isAr ? item.descAr : item.descEn}</p>
                      </div>
                    </div>
                    {isLoading ? (
                      <div className="absolute bottom-6 rtl:left-6 ltr:right-6 flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                        <NajeSpinner className="w-5 h-5" />
                      </div>
                    ) : (
                      <ChevronRight className={`absolute bottom-6 rtl:left-6 ltr:right-6 w-4 h-4 text-slate-600 group-hover:text-white transition-all duration-300 ${isAr ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* OUR STORY SECTION */}
        <section className="py-24 px-6 relative border-t border-white/5 bg-gradient-to-b from-black/0 to-indigo-900/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 mb-8">
                  <Wand2 className="w-4 h-4" />
                  {isAr ? 'قصة Creative AI' : 'The Story of Creative AI'}
              </div>
              <h2 className="text-3xl md:text-5xl font-black leading-tight mb-8 text-white">
                {isAr ? 'لطالما تساءلنا...' : 'We always wondered...'}
              </h2>
              <p className="text-xl md:text-3xl text-slate-300 leading-relaxed font-light mb-8 max-w-3xl mx-auto">
                {isAr 
                  ? 'ماذا سيحدث لو اجتمع المصممون المبدعون مع مهندسي الذكاء الاصطناعي؟'
                  : 'What would happen if creative designers joined forces with AI engineers?'}
              </p>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto font-light">
                {isAr
                  ? 'ماذا لو تم بناء أداة لا تكتفي بإنشاء التصاميم، بل تفهم الفكرة خلف التصميم نفسه؟ لم يعد الأمر مجرد تساؤل. لقد أصبح واقعًا نعيشه اليوم مع منصتنا.'
                  : 'What if a tool was built not just to generate designs, but to deeply understand the concept behind them? It is no longer just a question. It is reality today.'
                }
              </p>
            </motion.div>
          </div>
        </section>

        {/* THE SECRET SAUCE SECTION */}
        <section className="py-24 px-6 relative border-t border-white/5 bg-black/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: isAr ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                  <BrainCircuit className="w-4 h-4" />
                  {isAr ? 'الطبقة الذكية المخفية' : 'The Hidden Smart Layer'}
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight text-white">
                  {isAr ? 'نفهم فكرتك،' : 'We understand your vision,'} <br />
                  <span className="text-slate-500">{isAr ? 'ونحولها إلى تحفة فنية.' : 'and turn it into a masterpiece.'}</span>
                </h2>
                <p className="text-slate-400 leading-relaxed text-lg font-light">
                  {isAr 
                    ? 'نعلم أن الكثيرين يمتلكون أفكارًا رائعة لكن يصعب عليهم وصفها. أضفنا طبقة ذكاء اصطناعي متقدمة تعمل في الخلفية؛ كل ما عليك هو كتابة فكرتك بأي أسلوب، وسيقوم نظامنا بتحليلها وفهمها بعمق، ثم تحويلها إلى وصف احترافي متكامل يُرسل مباشرة إلى محرك التصميم.' 
                    : 'We know many have great ideas but struggle to describe them perfectly. We added an advanced AI layer in the background. Write your idea in any style, and our system will analyze and deeply understand it, converting it into a professional prompt sent directly to the design engine.'}
                </p>
                <div className="pt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400"><CheckCircle2 className="w-5 h-5" /></div>
                    {isAr ? 'كلما كان وصفك أدق، كانت النتيجة أكثر إبداعاً وإبهاراً.' : 'The more accurate your description, the more creative and stunning the result.'}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400"><CheckCircle2 className="w-5 h-5" /></div>
                    {isAr ? 'لقد قمنا بإنشاء شعار وأيقونة Creative AI باستخدام الأداة نفسها!' : 'We created the Creative AI logo and icon using the tool itself!'}
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/20 group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-purple-900/50 mix-blend-overlay z-10 transition-opacity group-hover:opacity-0 duration-500" />
                <img src="/icon.png" alt="Creative AI Generated Logo" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out" />
                <div className="absolute bottom-6 inset-x-6 z-20 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <p className="text-xs md:text-sm font-mono text-purple-300">
                    {isAr ? '> تم تصميم هذا الشعار بواسطة Creative AI' : '> This logo was designed by Creative AI'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PREMIUM BENTO GRID SHOWCASE */}
        <section className="py-24 px-6 relative border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-white">
                {isAr ? 'ماذا يمكنك تصميمه؟' : 'What can you design?'}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-light">
                {isAr ? 'وكالة إبداعية متكاملة تعمل بالذكاء الاصطناعي تتيح لك إنشاء تصاميم احترافية بجودة عالية تناسب الأفراد، الشركات، العلامات التجارية، وصناع المحتوى.' : 'A complete AI-powered creative agency that allows you to create professional, high-quality designs suitable for individuals, businesses, brands, and content creators.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
              
              {/* Logo Design - Spans 2 columns */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.1 }}
                className="md:col-span-2 relative group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-8 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Fingerprint className="absolute -right-10 -bottom-10 w-64 h-64 text-white/[0.02] group-hover:text-purple-500/10 group-hover:scale-110 transition-all duration-700" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-300">
                  <PenTool className="w-7 h-7" />
                </div>
                <h3 className="relative z-10 text-2xl font-bold mb-3 text-white">{isAr ? 'تصميم الشعارات الاحترافية' : 'Professional Logo Design'}</h3>
                <p className="relative z-10 text-sm md:text-base text-slate-400 leading-relaxed max-w-md font-light">
                  {isAr 
                    ? 'أنشئ شعارًا احترافيًا يعكس هويتك. نصمم شعارات نصية، رمزية، ومدمجة، بالإضافة إلى أيقونات التطبيقات العصرية الجاهزة للنشر.' 
                    : 'Create a professional logo that reflects your identity. We design text, symbol, and combination logos, plus modern app icons ready for publishing.'}
                </p>
              </motion.div>

              {/* Brand Identity - Spans 1 column, full height */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.2 }}
                className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-bl from-white/[0.03] to-transparent p-8 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Layers className="absolute -left-10 -bottom-10 w-56 h-56 text-white/[0.02] group-hover:text-indigo-500/10 group-hover:scale-110 transition-all duration-700" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-300">
                  <LayoutTemplate className="w-7 h-7" />
                </div>
                <h3 className="relative z-10 text-2xl font-bold mb-3 text-white">{isAr ? 'الهوية البصرية الكاملة' : 'Complete Brand Kit'}</h3>
                <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light">
                  {isAr 
                    ? 'بطاقات أعمال، أوراق رسمية، وقوالب موحدة تخلق توافقاً مثالياً يمنح علامتك مظهراً متناسقاً في كل مكان.' 
                    : 'Business cards, letterheads, and unified templates creating perfect consistency that gives your brand a cohesive look everywhere.'}
                </p>
              </motion.div>

              {/* Smart Integration */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.3 }}
                className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-tr from-white/[0.03] to-transparent p-8 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Cuboid className="absolute -right-8 -top-8 w-48 h-48 text-white/[0.02] group-hover:text-cyan-500/10 group-hover:rotate-12 transition-all duration-700" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-300">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h3 className="relative z-10 text-xl font-bold mb-2 text-white">{isAr ? 'الدمج الذكي الواقعي' : 'Realistic Smart Integration'}</h3>
                <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light">
                  {isAr ? 'ارفع شعارك أو صورة منتجك لنقوم بدمجها بشكل طبيعي داخل مشاهد واقعية مع إضاءة سينمائية احترافية.' : 'Upload your logo or product image and we naturally merge it into realistic scenes with professional cinematic lighting.'}
                </p>
              </motion.div>

              {/* Billboards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.4 }}
                className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-t from-white/[0.03] to-transparent p-8 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <MonitorSmartphone className="absolute -left-8 -top-8 w-48 h-48 text-white/[0.02] group-hover:text-emerald-500/10 group-hover:-rotate-12 transition-all duration-700" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-300">
                  <ScanFace className="w-7 h-7" />
                </div>
                <h3 className="relative z-10 text-xl font-bold mb-2 text-white">{isAr ? 'اللوحات والواجهات' : 'Billboards & Storefronts'}</h3>
                <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light">
                  {isAr ? 'صمم إعلانات خارجية وواجهات محلات تجارية بجودة واقعية مذهلة تلفت الأنظار وتبرز رسالتك الإعلانية بقوة.' : 'Design outdoor ads and storefronts with stunning realism that captures attention and powerfully highlights your message.'}
                </p>
              </motion.div>

              {/* Video Ads */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.5 }}
                className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-tl from-white/[0.03] to-transparent p-8 flex flex-col justify-end"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Film className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.02] group-hover:text-amber-500/10 group-hover:scale-110 transition-all duration-700" />
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-300">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="relative z-10 text-xl font-bold mb-2 text-white">{isAr ? 'فيديوهات إعلانية سينمائية' : 'Cinematic Video Ads'}</h3>
                <p className="relative z-10 text-sm text-slate-400 leading-relaxed font-light">
                  {isAr ? 'إنتاج فيديو عالي الجودة يبدأ بكتابة السيناريو، توليد المشاهد، وصولاً إلى التحريك السينمائي والانتقالات الاحترافية.' : 'Produce high-quality video starting with scriptwriting, scene generation, all the way to cinematic animation and transitions.'}
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-32 px-6 relative border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">
                {isAr ? 'صمّم أسرع، أبدع أكثر' : 'Design Faster, Create More'}
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                {isAr ? 'حتى نحن في Qelva AI نعتمد على Creative AI لإنشاء الشعارات وأيقونات التطبيقات الخاصة بمشاريعنا. اجعل أفكارك تنبض بالحياة اليوم.' : 'Even we at Qelva AI rely on Creative AI to create logos and app icons for our projects. Bring your ideas to life today.'}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  disabled={loadingId !== null}
                  onClick={() => handleCardClick('footer_cta', 'app', 'logo')}
                  className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2 disabled:opacity-80"
                >
                  {loadingId === 'footer_cta' ? (
                    <>
                      <span>{isAr ? 'جاري الانتقال...' : 'Navigating...'}</span>
                      <NajeSpinner className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span>{isAr ? 'ابدأ التصميم الآن' : 'Start Designing Now'}</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
