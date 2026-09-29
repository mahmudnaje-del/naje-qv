import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  Bot, Wand2, Palette, Clapperboard, Film, FileBadge,
  Code2, BookOpen, Image as ImageIcon, FileText, Brain,
  ArrowUpRight, Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useAppStore } from '../store';

const STUDIOS = [
  { id: 'agent', to: '/naje-agent-core', icon: Bot, accent: 'from-indigo-400 to-violet-500', glow: 'rgba(129,140,248,0.35)' },
  { id: 'prompt', to: '/naje-prompt', icon: Wand2, accent: 'from-violet-400 to-fuchsia-500', glow: 'rgba(192,132,252,0.35)' },
  { id: 'creative', to: '/creative-studio', icon: Palette, accent: 'from-cyan-400 to-blue-500', glow: 'rgba(34,211,238,0.28)' },
  { id: 'ad', to: '/naje-ad', icon: Clapperboard, accent: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.28)' },
  { id: 'motion', to: '/naje-ident', icon: Film, accent: 'from-sky-300 to-indigo-400', glow: 'rgba(125,211,252,0.28)' },
  { id: 'cv', to: '/naje-cv', icon: FileBadge, accent: 'from-yellow-300 to-amber-500', glow: 'rgba(253,224,71,0.28)' },
  { id: 'dev', to: '/naje-developer', icon: Code2, accent: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.28)' },
  { id: 'source', to: '/naje-source', icon: BookOpen, accent: 'from-lime-300 to-emerald-500', glow: 'rgba(163,230,53,0.24)' },
  { id: 'media', to: '/', icon: ImageIcon, accent: 'from-rose-400 to-pink-500', glow: 'rgba(251,113,133,0.28)' },
  { id: 'docs', to: '/', icon: FileText, accent: 'from-sky-400 to-blue-600', glow: 'rgba(56,189,248,0.24)' },
  { id: 'memory', to: '/', icon: Brain, accent: 'from-teal-300 to-cyan-500', glow: 'rgba(45,212,191,0.24)' },
] as const;

function setSpotlight(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${clientX - r.left}px`);
  el.style.setProperty('--my', `${clientY - r.top}px`);
}

export default function WelcomeStudioDeck() {
  const { t, isRtl } = useI18n();
  const user = useAppStore((s) => s.user);
  const setNewChatModalOpen = useAppStore((s) => s.setNewChatModalOpen);
  const reduce = useReducedMotion();
  const name = user?.displayName?.trim();
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07080d] text-white shadow-[0_28px_90px_-28px_rgba(79,70,229,0.5)]"
      dir={isRtl ? 'rtl' : 'ltr'}
      onMouseMove={(e) => {
        if (reduce) return;
        const root = sectionRef.current;
        if (root) setSpotlight(root, e.clientX, e.clientY);
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -start-16 h-72 w-72 rounded-full bg-indigo-600/25 blur-[90px]"
          style={reduce ? undefined : { animation: 'najePulse 9s ease-in-out infinite' }}
        />
        <div className="absolute -bottom-28 -end-10 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:22px_22px]" />
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: 'radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(99,102,241,0.16), transparent 55%)',
          }}
        />
      </div>

      <div className="relative z-10 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-7">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {t('welcome.kicker')}
            </div>
            <p className="text-xs font-medium text-white/55 mb-1">
              {name ? t('welcome.helloUser', { name }) : t('welcome.hello')}
            </p>
            <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight leading-[1.15]">
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-100 to-amber-200">
                {t('welcome.title')}
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/65 font-light">{t('welcome.lead')}</p>
            <p className="mt-2 text-[12px] font-medium text-indigo-200/80">{t('welcome.tagline')}</p>
          </div>
          <button
            type="button"
            onClick={() => setNewChatModalOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-gray-950 px-4 py-2.5 text-xs font-black hover:bg-indigo-50 active:scale-[0.98] transition shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_30px_-12px_rgba(255,255,255,0.45)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('welcome.cta')}
          </button>
        </motion.div>

        <div className="mt-6 -mx-1 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STUDIOS.map((studio, i) => {
            const Icon = studio.icon;
            const isAction = studio.to === '/';
            const featured = i < 2;

            const inner = (
              <>
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(220px circle at var(--mx, 50%) var(--my, 30%), ${studio.glow}, transparent 60%)`,
                  }}
                />
                <div className="pointer-events-none absolute -top-px inset-x-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${studio.accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
                <div className="relative mt-4">
                  <h3 className="text-sm font-bold tracking-tight">{t(`welcome.card.${studio.id}.name`)}</h3>
                  <p className={`mt-1.5 text-[11.5px] leading-relaxed text-white/55 font-light ${featured ? 'line-clamp-4' : 'line-clamp-3'}`}>
                    {t(`welcome.card.${studio.id}.desc`)}
                  </p>
                </div>
              </>
            );

            const cls = `group relative snap-center min-w-[78%] sm:min-w-0 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 text-start backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 block h-full w-full ${featured ? 'sm:min-h-[168px]' : ''}`;

            const onMove = (e: React.MouseEvent<HTMLElement>) => {
              if (reduce) return;
              setSpotlight(e.currentTarget, e.clientX, e.clientY);
            };

            return (
              <motion.div
                key={studio.id}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.035, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {isAction ? (
                  <button type="button" onClick={() => setNewChatModalOpen(true)} onMouseMove={onMove} className={cls}>
                    {inner}
                  </button>
                ) : (
                  <Link to={studio.to} onMouseMove={onMove} className={cls}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes najePulse {
          0%, 100% { transform: scale(1); opacity: .25; }
          50% { transform: scale(1.12); opacity: .4; }
        }
      `}</style>
    </section>
  );
}
