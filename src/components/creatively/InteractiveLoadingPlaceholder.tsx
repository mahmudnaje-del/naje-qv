import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../firebase';
import { getEpisodes, Frame } from './LoadingEpisodes';

// ----------------- CHARACTERS -----------------
const SleekCharacter = ({ color, glowColor, flip, pose }: { color: string, glowColor: string, flip: boolean, pose: string }) => {
  return (
    <motion.div 
       className="relative w-12 h-16 drop-shadow-[0_5px_15px_rgba(0,0,0,0.6)]"
       initial={false}
       animate={{ 
         scaleX: flip ? -1 : 1,
         y: pose === 'jump' ? [-10, -30, -10] : pose === 'idle' ? [0, -3, 0] : pose === 'walk' ? [0, -4, 0] : 0,
       }}
       transition={{
         y: {
           repeat: Infinity,
           duration: pose === 'jump' ? 0.6 : pose === 'walk' ? 0.3 : 2,
           ease: pose === 'walk' ? "linear" : "easeInOut"
         },
         scaleX: { duration: 0.3 }
       }}
    >
       {/* Body */}
       <motion.div 
         className="absolute top-4 left-3 w-6 h-8 rounded-xl shadow-inner border border-white/10" 
         style={{ backgroundColor: color, boxShadow: `inset 0 0 12px ${glowColor}50` }} 
         animate={{ 
           rotate: pose === 'hurt' ? -10 : pose === 'celebrate' ? [0, -10, 10, 0] : 0,
           y: pose === 'walk' ? [0, -1, 0] : 0 
         }}
         transition={{ repeat: pose === 'celebrate' ? Infinity : (pose === 'walk' ? Infinity : 0), duration: pose === 'celebrate' ? 0.5 : 0.3 }}
       />
       
       {/* Head */}
       <motion.div 
         className="absolute top-0 left-3 w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shadow-lg border border-white/20"
         style={{ backgroundColor: color, boxShadow: `0 0 20px ${glowColor}60` }}
         animate={{ 
           y: pose === 'walk' ? [0, -2, 0] : pose === 'hurt' ? -4 : pose === 'celebrate' ? [0, -4, 0] : 0, 
           rotate: pose === 'hurt' ? -15 : pose === 'celebrate' ? [0, -15, 15, 0] : 0 
         }}
         transition={{ repeat: pose === 'walk' || pose === 'celebrate' ? Infinity : 0, duration: pose === 'celebrate' ? 0.5 : 0.3 }}
       >
          <motion.div 
            className="w-4 h-1.5 rounded-full" 
            style={{ backgroundColor: glowColor, boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}` }} 
            animate={{ 
              scaleY: pose === 'hurt' ? 0.3 : pose === 'celebrate' ? [1, 1.5, 1] : 1, 
              opacity: pose === 'work' ? [1, 0.4, 1] : 1 
            }}
            transition={{ repeat: pose === 'work' || pose === 'celebrate' ? Infinity : 0, duration: pose === 'celebrate' ? 0.5 : 0.8 }}
          />
       </motion.div>

       {/* Arms */}
       <motion.div 
         className="absolute top-5 left-1 w-2 h-6 rounded-full origin-top shadow-md border border-white/10"
         style={{ backgroundColor: color }}
         animate={
           pose === 'wave' ? { rotate: [0, -40, 40, -40, 0] } :
           pose === 'walk' ? { rotate: [30, -30, 30] } :
           pose === 'work' ? { rotate: [-20, -60, -20] } :
           pose === 'hurt' ? { rotate: -70 } :
           pose === 'jump' || pose === 'celebrate' ? { rotate: -150 } :
           { rotate: 10 }
         }
         transition={{ repeat: pose === 'idle' || pose === 'hurt' || pose === 'jump' ? 0 : Infinity, duration: pose === 'work' ? 0.3 : pose === 'walk' ? 0.6 : 0.6 }}
       />
       <motion.div 
         className="absolute top-5 right-1 w-2 h-6 rounded-full origin-top shadow-md border border-white/10"
         style={{ backgroundColor: color }}
         animate={
           pose === 'wave' ? { rotate: [0, 60, -20, 60, 0] } :
           pose === 'walk' ? { rotate: [-30, 30, -30] } :
           pose === 'work' ? { rotate: [20, 60, 20] } :
           pose === 'hurt' ? { rotate: 70 } :
           pose === 'jump' || pose === 'celebrate' ? { rotate: 150 } :
           { rotate: -10 }
         }
         transition={{ repeat: pose === 'idle' || pose === 'hurt' || pose === 'jump' ? 0 : Infinity, duration: pose === 'work' ? 0.3 : pose === 'walk' ? 0.6 : 0.6 }}
       />

       {/* Legs */}
       <motion.div 
         className="absolute top-11 left-3.5 w-2 h-6 rounded-full origin-top shadow-md border border-white/10"
         style={{ backgroundColor: color }}
         animate={
           pose === 'walk' ? { rotate: [-40, 40, -40], y: [0, -2, 0] } : 
           pose === 'jump' ? { rotate: -20, y: -5 } : 
           { rotate: 0, y: 0 }
         }
         transition={{ repeat: pose === 'idle' || pose === 'jump' ? 0 : Infinity, duration: 0.6 }}
       />
       <motion.div 
         className="absolute top-11 right-3.5 w-2 h-6 rounded-full origin-top shadow-md border border-white/10"
         style={{ backgroundColor: color }}
         animate={
           pose === 'walk' ? { rotate: [40, -40, 40], y: [0, -2, 0] } : 
           pose === 'jump' ? { rotate: 20, y: -5 } : 
           { rotate: 0, y: 0 }
         }
         transition={{ repeat: pose === 'idle' || pose === 'jump' ? 0 : Infinity, duration: 0.6 }}
       />
    </motion.div>
  )
}

// ----------------- SCENES -----------------
const Scene0 = () => (
  <div className="absolute inset-0 overflow-hidden opacity-90">
    <motion.svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="treeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <motion.path d="M100 200 Q100 120 100 100" stroke="#1e293b" strokeWidth="8" fill="none" />
      <motion.path d="M100 120 C60 100 30 60 100 20 C170 60 140 100 100 120" fill="url(#treeGrad)" animate={{ scale: [1, 1.03, 1], rotate: [0, 1, -1, 0], transformOrigin: '100px 120px' }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
      {[...Array(5)].map((_, i) => (
        <motion.circle key={i} cx={80 + i * 10} cy={40 + i * 15} r="3" fill="#34d399" animate={{ y: [0, 15, 0], x: [0, (i % 2 ? 8 : -8), 0], opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.3 }} />
      ))}
    </motion.svg>
    <div className="absolute bottom-[48px] left-1/2 translate-x-12 z-10 opacity-70">
      <svg width="30" height="150" viewBox="0 0 40 150" fill="none">
        <rect x="5" y="0" width="4" height="150" fill="#1e293b" />
        <rect x="32" y="0" width="4" height="150" fill="#1e293b" />
        {[...Array(8)].map((_, i) => <rect key={i} x="5" y={15 + i*20} width="30" height="3" fill="#334155" />)}
      </svg>
    </div>
  </div>
);

const Scene1 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-end justify-center pb-14 opacity-80">
    <div className="w-full flex justify-between px-8 gap-4">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="flex-1 h-36 bg-slate-900 border border-slate-700 rounded-t-lg relative overflow-hidden flex flex-col gap-2 p-2 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
           {[...Array(5)].map((_, j) => (
             <div key={j} className="h-4 w-full bg-slate-800 rounded flex items-center px-1.5 gap-1.5">
               <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: Math.random() * 2 + 0.5 }} />
               <motion.div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: Math.random() * 2 + 0.5 }} />
             </div>
           ))}
           <motion.div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 blur-sm" animate={{ y: [0, 144, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
        </motion.div>
      ))}
    </div>
  </div>
);

const Scene2 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center opacity-70 perspective-[800px]">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute border border-fuchsia-500/40 rounded-full"
        style={{ width: 100 + i * 50, height: 100 + i * 50, boxShadow: `0 0 30px rgba(217, 70, 239, 0.2) inset, 0 0 20px rgba(217, 70, 239, 0.1)` }}
        animate={{ rotateX: [60, 60], rotateZ: [0, 360], y: [-(i * 8), (i * 8), -(i * 8)] }}
        transition={{ rotateZ: { repeat: Infinity, duration: 10 + i * 5, ease: "linear" }, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
      />
    ))}
    <motion.div className="w-16 h-16 bg-fuchsia-600 rounded-full blur-2xl" animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
  </div>
);

const Scene3 = () => (
  <div className="absolute inset-0 overflow-hidden opacity-90 filter blur-[15px]">
    <motion.div className="absolute top-10 left-10 w-48 h-48 bg-indigo-600 rounded-full mix-blend-screen" animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
    <motion.div className="absolute bottom-10 right-10 w-36 h-36 bg-rose-600 rounded-full mix-blend-screen" animate={{ x: [0, -50, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} />
    <motion.div className="absolute top-1/2 left-1/2 w-24 h-24 bg-amber-500 rounded-full mix-blend-screen" animate={{ x: [-30, 30, -30], y: [-30, 30, -30], scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} />
  </div>
);

const Scene4 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center pb-8">
    <div className="w-[85%] h-[65%] border border-slate-600/50 relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <motion.div className="absolute w-full h-full bg-slate-800" animate={{ clipPath: ['circle(25% at 50% 50%)', 'circle(45% at 50% 50%)', 'circle(25% at 50% 50%)'] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} />
      <motion.div className="w-16 h-16 border-4 border-white rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.8)] z-10 flex items-center justify-center" animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { repeat: Infinity, duration: 10, ease: "linear" }, scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}>
         <div className="w-4 h-4 bg-white rounded-full" />
      </motion.div>
      <motion.div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
    </div>
  </div>
);

const Scene5 = () => (
  <div className="absolute inset-0 overflow-hidden flex flex-col justify-between py-6 opacity-60">
    <div className="w-full flex justify-around px-4">
      {[...Array(8)].map((_, i) => <div key={i} className="w-6 h-4 bg-slate-950 border border-slate-800 rounded-sm" />)}
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-xl" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} />
      <motion.div className="absolute w-[200%] h-0.5 bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.8)] rotate-12" animate={{ y: [-150, 150] }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} />
    </div>
    <div className="w-full flex justify-around px-4">
      {[...Array(8)].map((_, i) => <div key={i} className="w-6 h-4 bg-slate-950 border border-slate-800 rounded-sm" />)}
    </div>
  </div>
);

const Scene6 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center opacity-40">
    <motion.div className="text-[140px] font-serif font-black text-slate-500 absolute" animate={{ y: [-20, 20, -20], rotate: [-5, 5, -5], scale: [1, 1.1, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}>
      A
    </motion.div>
    <motion.div className="text-[120px] font-sans font-bold text-slate-400 absolute ml-24 mt-24" animate={{ y: [20, -20, 20], rotate: [5, -5, 5], scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
      g
    </motion.div>
    <motion.div className="absolute left-0 w-full h-0.5 bg-rose-500 shadow-[0_0_15px_#f43f5e]" animate={{ top: ['10%', '90%', '10%'] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
    <motion.div className="absolute top-0 h-full w-0.5 bg-rose-500 shadow-[0_0_15px_#f43f5e]" animate={{ left: ['10%', '90%', '10%'] }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} />
  </div>
);

const Scene7 = () => (
  <div className="absolute inset-0 overflow-hidden opacity-70">
    <motion.div className="absolute bottom-0 left-4 w-32 h-48 bg-slate-800/80 border-r border-t border-slate-600 backdrop-blur-md shadow-2xl" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
    <motion.div className="absolute bottom-0 right-12 w-28 h-56 bg-slate-800/90 border-l border-t border-slate-500 backdrop-blur-md shadow-2xl" animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} />
    <motion.div className="absolute bottom-0 right-48 w-20 h-40 bg-slate-700/80 border border-slate-500 backdrop-blur-sm shadow-xl" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 2 }} />
    <motion.div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-b from-white/15 to-transparent rotate-45 transform origin-top-right mix-blend-overlay" animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ repeat: Infinity, duration: 6 }} />
  </div>
);

const Scene8 = () => (
  <div className="absolute inset-0 overflow-hidden opacity-50">
    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2 p-6">
      {[...Array(16)].map((_, i) => (
        <motion.div key={i} className="bg-slate-700/20 rounded-lg border border-slate-500/30 backdrop-blur-sm" animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.95, 1, 0.95] }} transition={{ repeat: Infinity, duration: Math.random() * 3 + 2, delay: Math.random() * 2 }} />
      ))}
    </div>
    <motion.svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_10px_#38bdf8]" viewBox="0 0 100 100" preserveAspectRatio="none">
       <motion.path d="M 10 90 A 80 80 0 0 1 90 10" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" animate={{ strokeDashoffset: [0, -40] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} />
    </motion.svg>
  </div>
);

const Scene9 = () => (
  <div className="absolute inset-0 overflow-hidden bg-slate-950">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-12 h-0.5 bg-white rounded-full shadow-[0_0_8px_white]"
        style={{ top: `${Math.random() * 100}%`, left: '100%' }}
        animate={{ left: ['100%', '-30%'] }}
        transition={{ repeat: Infinity, duration: Math.random() * 0.4 + 0.1, delay: Math.random(), ease: "linear" }}
      />
    ))}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/40 rounded-full blur-[40px] animate-pulse" />
  </div>
);

const Scene10 = () => (
  <div className="absolute inset-0 overflow-hidden bg-slate-900 flex items-center justify-center">
    <div className="absolute w-full h-[2px] bg-sky-500/30" />
    <motion.div className="w-16 h-16 border-t-2 border-r-2 border-sky-400 rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
  </div>
);
const Scene11 = () => (
  <div className="absolute inset-0 overflow-hidden bg-gradient-to-tr from-slate-950 to-indigo-900 opacity-60">
    {[...Array(5)].map((_, i) => (
      <motion.div key={i} className="absolute w-32 h-32 border border-indigo-400/20 rounded-full" animate={{ scale: [1, 2, 1], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 3, delay: i * 0.6 }} />
    ))}
  </div>
);
const Scene12 = () => (
  <div className="absolute inset-0 overflow-hidden flex flex-wrap gap-1 p-2 opacity-30">
    {[...Array(100)].map((_, i) => (
      <motion.div key={i} className="w-4 h-4 bg-slate-700" animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ repeat: Infinity, duration: Math.random() * 2 + 1 }} />
    ))}
  </div>
);
const Scene13 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center opacity-50">
    <motion.div className="w-full h-24 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent skew-y-12" animate={{ y: [-50, 50, -50] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
  </div>
);
const Scene14 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
    <motion.div className="text-[200px] text-slate-800/20 font-black blur-sm" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
      {'{}'}
    </motion.div>
  </div>
);
const Scene15 = () => (
  <div className="absolute inset-0 overflow-hidden opacity-40">
    <motion.div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-slate-900/10 to-transparent" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 5 }} />
  </div>
);
const Scene16 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
    <div className="w-32 h-32 grid grid-cols-2 gap-2 opacity-50">
      {[...Array(4)].map((_, i) => (
        <motion.div key={i} className="bg-emerald-500/30 rounded-br-2xl" animate={{ rotate: [0, 90, 0] }} transition={{ repeat: Infinity, duration: 4, delay: i * 0.2 }} />
      ))}
    </div>
  </div>
);
const Scene17 = () => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/40 to-transparent" animate={{ x: [-100, 100, -100] }} transition={{ repeat: Infinity, duration: 7, ease: "linear" }} />
  </div>
);
const Scene18 = () => (
  <div className="absolute inset-0 overflow-hidden flex items-center justify-center opacity-60">
    <motion.div className="w-48 h-48 border-[10px] border-slate-800 rounded-full border-t-rose-500/50" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} />
  </div>
);
const Scene19 = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
    <motion.div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-transparent" animate={{ y: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 5, ease: "linear" }} />
  </div>
);

const Scenes = [Scene0, Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10, Scene11, Scene12, Scene13, Scene14, Scene15, Scene16, Scene17, Scene18, Scene19];

// ----------------- PROPS & BUBBLES -----------------
const Props = ({ type }: { type: string }) => {
  if (type === "apple") return <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_20px_#ef4444] border-[3px] border-red-400" />;
  if (type === "coffee") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" className="drop-shadow-[0_0_10px_#eab308]">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
  if (type === "wand") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="drop-shadow-[0_0_12px_#a855f7]">
      <path d="M21 3l-6 6" />
      <path d="M21 3v6" />
      <path d="M21 3h-6" />
      <path d="M10 14L3 21" />
    </svg>
  );
  if (type === "paint") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" className="drop-shadow-[0_0_12px_#ec4899]">
       <circle cx="13.5" cy="10.5" r="8.5" />
       <circle cx="10.5" cy="8.5" r="1.5" />
       <circle cx="15.5" cy="9.5" r="1.5" />
       <circle cx="12.5" cy="13.5" r="1.5" />
    </svg>
  );
  if (type === "rocket") return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" className="drop-shadow-[0_0_20px_#38bdf8]">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
  if (type === "camera") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="drop-shadow-[0_0_10px_#10b981]">
       <rect x="2" y="8" width="16" height="12" rx="2" />
       <circle cx="10" cy="14" r="3" />
       <path d="M18 11l4-2v10l-4-2" />
    </svg>
  );
  if (type === "grid") return (
    <div className="w-36 h-36 border-2 border-cyan-500/60 relative shadow-[0_0_30px_rgba(6,182,212,0.4)] bg-cyan-500/10">
      <div className="absolute top-1/3 left-0 w-full h-0.5 bg-cyan-500/60" />
      <div className="absolute top-2/3 left-0 w-full h-0.5 bg-cyan-500/60" />
      <div className="absolute left-1/3 top-0 w-0.5 h-full bg-cyan-500/60" />
      <div className="absolute left-2/3 top-0 w-0.5 h-full bg-cyan-500/60" />
    </div>
  );
  return null;
};

const SpeechBubble = ({ text, isRtl, speaker }: { text: string, isRtl: boolean, speaker: 'omar' | 'arthur' }) => {
  const isOmar = speaker === 'omar';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5, y: 30, filter: 'blur(10px)', rotateX: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
      className={`absolute top-6 w-[85%] max-w-[280px] bg-slate-900/90 backdrop-blur-2xl border ${isOmar ? 'border-sky-500/40 shadow-[0_15px_40px_rgba(14,165,233,0.3)]' : 'border-red-500/40 shadow-[0_15px_40px_rgba(239,68,68,0.3)]'} p-4 text-[11px] sm:text-xs font-medium text-slate-200 rounded-3xl z-50`}
      style={{ 
        direction: isRtl ? 'rtl' : 'ltr',
        left: isOmar ? '5%' : 'auto',
        right: isOmar ? 'auto' : '5%',
        transformOrigin: isOmar ? 'bottom left' : 'bottom right'
      }}
    >
      <div className={`font-bold mb-2 ${isOmar ? 'text-sky-400' : 'text-red-400'} text-[10px] uppercase tracking-widest flex items-center gap-2`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isOmar ? 'bg-sky-400' : 'bg-red-400'} animate-pulse shadow-[0_0_8px_currentColor]`} />
        {isOmar ? (isRtl ? 'عمر (المهندس)' : 'Omar') : (isRtl ? 'الذكاء آرثر' : 'Arthur AI')}
      </div>
      <p className="leading-relaxed drop-shadow-md whitespace-pre-wrap">{text}</p>
      
      {/* Tail pointing down */}
      <div 
        className={`absolute -bottom-3 w-6 h-6 bg-slate-900/90 backdrop-blur-2xl border-b border-r ${isOmar ? 'border-sky-500/40' : 'border-red-500/40'} rotate-45`} 
        style={{
          left: isOmar ? '25px' : 'auto',
          right: isOmar ? 'auto' : '25px',
          borderBottomRightRadius: '4px'
        }}
      />
    </motion.div>
  );
};

export function InteractiveLoadingPlaceholder({ lang, forceEpIndex, userPrompt }: { lang: 'ar' | 'en', forceEpIndex?: number, userPrompt?: string }) {
  const [epIndex, setEpIndex] = useState(0);
  const [frameData, setFrameData] = useState<Frame>({ d: 0 });
  const [showTitle, setShowTitle] = useState(true);
  const [introTitle, setIntroTitle] = useState({ ar: '', en: '' });

  const [dynamicSequence, setDynamicSequence] = useState<Frame[] | null>(null);
  const [isFetchingDynamic, setIsFetchingDynamic] = useState(!!userPrompt);

  useEffect(() => {
    if (!userPrompt) {
      setIsFetchingDynamic(false);
      return;
    }
    let mounted = true;
    setIsFetchingDynamic(true);
    
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/generate-episode', {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: userPrompt })
        });
        if (!res.ok) {
          if (mounted) setIsFetchingDynamic(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
          setDynamicSequence(data.frames);
        }
        setIsFetchingDynamic(false);
      } catch (err) {
        console.error("Failed to fetch dynamic episode", err);
        if (mounted) setIsFetchingDynamic(false);
      }
    })();

    return () => { mounted = false; };
  }, [userPrompt]);


  useEffect(() => {
    const allEps = getEpisodes();
    
    // Pick a random episode unless forced
    let selectedIndex = forceEpIndex;
    if (selectedIndex === undefined) {
      selectedIndex = Math.floor(Math.random() * allEps.length);
    }
    setEpIndex(selectedIndex % allEps.length);

    const smartTitles = [
      { ar: "تهيئة المحرك الإبداعي...", en: "Initializing Creative Engine..." },
      { ar: "حقن الإلهام في السيرفر...", en: "Injecting Inspiration into Server..." },
      { ar: "تجهيز بكسلات عالية الجودة...", en: "Preparing High-Quality Pixels..." },
      { ar: "استدعاء خوارزميات الفن...", en: "Summoning Art Algorithms..." },
      { ar: "صناعة المستحيل مؤقتاً...", en: "Crafting the Impossible Temporarily..." },
      { ar: "تجميع أفكار من المستقبل...", en: "Gathering Ideas from the Future..." },
      { ar: "إيقاظ آرثر من النوم...", en: "Waking Arthur Up..." },
      { ar: "نقل البيانات عبر الأبعاد...", en: "Transferring Data Across Dimensions..." }
    ];
    setIntroTitle(smartTitles[Math.floor(Math.random() * smartTitles.length)]);
  }, [forceEpIndex]);

  useEffect(() => {
    let mounted = true;
    
    const allEps = getEpisodes();
    const safeIndex = epIndex % allEps.length;
    
    // If a userPrompt is provided but dynamicSequence is not yet loaded, wait for it!
    if (isFetchingDynamic) {
      // Just show the title and wait. Don't start any episode.
      setShowTitle(true);
      return () => { mounted = false; };
    }

    setShowTitle(true);
    
    // Hide title after 2.5s
    const titleTimer = setTimeout(() => {
      if (mounted) setShowTitle(false);
    }, 2500);

    const sequence = dynamicSequence || allEps[safeIndex] || allEps[0];
    
    const runAnimation = async () => {
      // wait for title to finish if we want, or run concurrently
      await new Promise(r => setTimeout(r, 2000));
      if (!mounted) return;

      let state = { ...sequence[0] };
      setFrameData(state);

      for (let i = 1; i < sequence.length; i++) {
        const duration = Math.max(2500, sequence[i-1].d || 4500);
        await new Promise(r => setTimeout(r, duration));
        if (!mounted) break;
        
        let newState = { ...state, ...sequence[i] };
        
        if (sequence[i].oT_ar !== undefined || sequence[i].oT_en !== undefined) {
           newState.aT_ar = undefined;
           newState.aT_en = undefined;
        } else if (sequence[i].aT_ar !== undefined || sequence[i].aT_en !== undefined) {
           newState.oT_ar = undefined;
           newState.oT_en = undefined;
        }
        state = newState;
        setFrameData(state);
      }
    };
    runAnimation();
    
    return () => { 
      mounted = false; 
      clearTimeout(titleTimer);
    };
  }, [epIndex, dynamicSequence, isFetchingDynamic]);

  const omarTxt = lang === 'ar' ? frameData.oT_ar : frameData.oT_en;
  const arthurTxt = lang === 'ar' ? frameData.aT_ar : frameData.aT_en;
  
  const SceneComponent = Scenes[epIndex % Scenes.length];

  return (
    <div className="relative w-[280px] sm:w-[320px] md:w-[400px] h-[300px] sm:h-[340px] bg-slate-950 border border-slate-700/60 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-2 mx-auto sm:mx-0 select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className={`absolute top-1/4 right-6 w-32 h-32 rounded-full blur-[40px] ${epIndex % 2 === 0 ? 'bg-indigo-500/20' : 'bg-emerald-500/20'} animate-pulse`} />
         <div className={`absolute bottom-1/4 left-8 w-24 h-24 rounded-full blur-[40px] ${epIndex % 3 === 0 ? 'bg-fuchsia-400/20' : 'bg-blue-400/20'} animate-pulse`} />
      </div>
      <div className="absolute bottom-0 w-full h-14 bg-slate-950 border-t border-slate-800 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] z-0" />
      
      {/* Dynamic Background Scene per Episode */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={epIndex} 
          className="absolute inset-0 z-10"
          initial={{ opacity: 0, filter: 'blur(20px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(20px)' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <SceneComponent />
        </motion.div>
      </AnimatePresence>
      
      {/* Title Card Overlay (The cinematic intro) */}
      <AnimatePresence>
        {showTitle && (
          <motion.div 
            className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center px-4"
            >
              <div className="text-amber-500 font-mono text-[10px] tracking-[0.3em] uppercase mb-2">
                {lang === 'ar' ? 'نظام Creative AI' : 'Creative AI System'}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                {lang === 'ar' ? introTitle.ar : introTitle.en}
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dialog System */}
      <AnimatePresence mode="wait">
        {(!showTitle && omarTxt) ? (
           <SpeechBubble key={`o-${omarTxt}`} text={omarTxt} isRtl={lang === 'ar'} speaker="omar" />
        ) : (!showTitle && arthurTxt) ? (
           <SpeechBubble key={`a-${arthurTxt}`} text={arthurTxt} isRtl={lang === 'ar'} speaker="arthur" />
        ) : null}
      </AnimatePresence>

      {/* Omar (Slate/Sky) */}
      <motion.div 
        className="absolute bottom-[56px] z-20"
        style={{ left: 'calc(50% - 24px)' }}
        animate={{ 
           y: frameData.oY ?? 0, 
           x: frameData.oX ?? -110,
           opacity: showTitle ? 0 : 1
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <SleekCharacter color="#1e293b" glowColor="#38bdf8" flip={frameData.oF || false} pose={frameData.oPose || 'idle'} />
      </motion.div>

      {/* Arthur (Slate/Red) */}
      <motion.div 
        className="absolute bottom-[56px] z-20"
        style={{ left: 'calc(50% - 24px)' }}
        animate={{
          y: frameData.aY ?? 0,
          x: frameData.aX ?? 30,
          opacity: showTitle ? 0 : 1
        }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
      >
        <SleekCharacter color="#1e293b" glowColor="#f87171" flip={frameData.aF || false} pose={frameData.aPose || 'idle'} />
      </motion.div>

      {/* Props */}
      <AnimatePresence>
        {(!showTitle && frameData.pT && frameData.pT !== 'none') && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ 
              opacity: 1,
              scale: 1,
              x: frameData.pX ?? 0,
              y: frameData.pY ?? 0,
              rotate: frameData.pR ?? 0 
            }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute left-1/2 bottom-[56px] z-30" 
          >
            <Props type={frameData.pT} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
