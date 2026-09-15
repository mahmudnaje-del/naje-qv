import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic2, User, Users, Play, Square, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import NajeSelect from '../NajeSelect';
import { VOICES } from '../../lib/voiceCatalog';
import { usePricingConfig } from '../../hooks/usePricingConfig';

export function buildVoiceChatPayload(state: any) {
  return {
    voiceMode: state.voiceMode,
    voiceTier: state.voiceTier || 'core',
    selectedVoice: state.selectedVoice,
    speaker1Voice: state.speaker1Voice,
    speaker2Voice: state.speaker2Voice,
    speaker1Name: state.speaker1Name,
    speaker2Name: state.speaker2Name,
    deliveryStyle: state.deliveryStyle,
  };
}

export function parseDualScriptLines(text: string, spk1Name: string, spk2Name: string) {
  const lines = text.split('\n');
  const spk1Trimmed = spk1Name.trim().toLowerCase();
  const spk2Trimmed = spk2Name.trim().toLowerCase();
  const parsed = [];
  const errors = [];
  
  // Detect if user is writing informal colloquial description or general prompt
  const hasColons = text.includes(':');
  const isInformalNarrative = !hasColons || /بيقول|ترد|قال|قالت|سأل|أجاب|بيحكي|تقول|بدون/.test(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      if (!isInformalNarrative) {
        errors.push(`السطر ${i + 1}: لم يتم تحديد اسم المتحدث (مثال: "${spk1Name}: النص...")`);
      }
      parsed.push({ speaker: 'informal', speakerName: 'نص/سرد عامي', text: line, lineNum: i + 1 });
      continue;
    }
    const speakerPart = line.substring(0, colonIdx).trim();
    const dialoguePart = line.substring(colonIdx + 1).trim();
    const speakerLower = speakerPart.toLowerCase();
    if (spk1Trimmed && speakerLower === spk1Trimmed) {
      parsed.push({ speaker: 'speaker1', speakerName: speakerPart, text: dialoguePart, lineNum: i + 1 });
    } else if (spk2Trimmed && speakerLower === spk2Trimmed) {
      parsed.push({ speaker: 'speaker2', speakerName: speakerPart, text: dialoguePart, lineNum: i + 1 });
    } else {
      if (!isInformalNarrative) {
        errors.push(`السطر ${i + 1}: الاسم "${speakerPart}" لا يطابق المتحدثين المعرفين ("${spk1Name}" أو "${spk2Name}")`);
      }
      parsed.push({ speaker: 'informal', speakerName: speakerPart, text: dialoguePart, lineNum: i + 1 });
    }
  }
  return { parsed, errors, isValid: errors.length === 0, isInformalNarrative };
}

export function VoiceSettingsPanel({
  chat,
  loading,
  showVoiceSettings,
  voiceMode,
  setVoiceMode,
  voiceTier = 'core',
  setVoiceTier,
  selectedVoice,
  setSelectedVoice,
  speaker1Name,
  setSpeaker1Name,
  speaker1Voice,
  setSpeaker1Voice,
  speaker2Name,
  setSpeaker2Name,
  speaker2Voice,
  setSpeaker2Voice,
  deliveryStyle,
  setDeliveryStyle,
  playingVoiceSample,
  playVoicePreview,
  input
}: any) {
  const pricing = usePricingConfig();
  if (chat?.type !== 'voice' || !showVoiceSettings || loading) return null;

  const words = (input || '').trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMin = pricing.voice?.estimatedWordsPerMinute || 140;
  const costPerSec = pricing.voice?.costPerAudioSecond ?? 0.02;
  const estimatedSeconds = Math.max(3, Math.ceil((words / wordsPerMin) * 60));
  const estimatedCost = Math.max(pricing.voice?.minCost ?? 0.10, parseFloat((estimatedSeconds * costPerSec).toFixed(2)));

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-slate-50 dark:bg-slate-900/95 border-b border-gray-200 dark:border-white/10 p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-4 text-xs sm:text-sm max-h-[220px] sm:max-h-[350px] overflow-y-auto scrollbar-thin"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-2.5">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <Mic2 className="w-4 h-4 text-emerald-500" />
          <span>إعدادات استوديو التسجيلات الصوتية (Voice Studio)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Tier: Core vs Pro */}
          <div className="flex items-center gap-1 bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setVoiceTier?.('core')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                voiceTier === 'core'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
              title="نموذج الصوت الأساسي والسريع (NAJE_MODEL_VOICE_CORE)"
            >
              <Zap className="w-3 h-3" />
              <span>Core</span>
            </button>
            <button
              type="button"
              onClick={() => setVoiceTier?.('pro')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                voiceTier === 'pro'
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
              title="نموذج الصوت الاحترافي الفائق (NAJE_MODEL_VOICE_PRO)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Pro</span>
            </button>
          </div>

          {/* Mode: Single vs Dual */}
          <div className="flex items-center gap-1 bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setVoiceMode('single')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                voiceMode === 'single'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>صوت واحد</span>
            </button>
            <button
              type="button"
              onClick={() => setVoiceMode('dual')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                voiceMode === 'dual'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>صوتان (حوار)</span>
            </button>
          </div>
        </div>
      </div>
      {voiceMode === 'single' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">اختر الصوت (30 صوت متوفر):</span>
            <div className="flex items-center gap-2">
              <NajeSelect
                value={selectedVoice}
                onChange={val => setSelectedVoice(val)}
                options={VOICES.map(v => ({
                  value: v.id,
                  label: `${v.name} (${v.gender === 'male' ? 'رجل' : 'امرأة'}) — ${v.tone}`
                }))}
              />
              <button
                type="button"
                onClick={() => playVoicePreview(selectedVoice)}
                className={cn(
                  "p-2.5 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center",
                  playingVoiceSample === selectedVoice
                    ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                )}
                title="استماع لعينة الصوت الحية"
              >
                {playingVoiceSample === selectedVoice ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            {VOICES.find(v => v.id === selectedVoice) && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                "{VOICES.find(v => v.id === selectedVoice)?.description}"
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">أسلوب الإلقاء:</span>
            <NajeSelect
              value={deliveryStyle}
              onChange={val => setDeliveryStyle(val)}
              options={[
                { value: 'default', label: 'طبيعي معتدل (تلقائي)' },
                { value: 'professional', label: 'رسمي هادئ احترافي' },
                { value: 'warm', label: 'ودود ودافئ (بودكاست)' },
                { value: 'energetic', label: 'حماسي وإعلاني (High Energy)' },
                { value: 'news', label: 'إخباري واضح ومباشر' }
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speaker 1 */}
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/40 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">المتحدث الأول:</span>
                <input
                  type="text"
                  value={speaker1Name}
                  onChange={e => setSpeaker1Name(e.target.value)}
                  placeholder="اسم المتحدث الأول (مثال: أحمد)"
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white font-bold flex-1 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <NajeSelect
                  value={speaker1Voice}
                  onChange={val => setSpeaker1Voice(val)}
                  options={VOICES.map(v => ({
                    value: v.id,
                    label: `${v.name} (${v.gender === 'male' ? 'رجل' : 'امرأة'}) — ${v.tone}`
                  }))}
                />
                <button
                  type="button"
                  onClick={() => playVoicePreview(speaker1Voice)}
                  className={cn(
                    "p-2 rounded-lg border transition cursor-pointer flex-shrink-0 flex items-center justify-center",
                    playingVoiceSample === speaker1Voice
                      ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                      : "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white"
                  )}
                  title="استماع لعينة الصوت"
                >
                  {playingVoiceSample === speaker1Voice ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* Speaker 2 */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">المتحدث الثاني:</span>
                <input
                  type="text"
                  value={speaker2Name}
                  onChange={e => setSpeaker2Name(e.target.value)}
                  placeholder="اسم المتحدث الثاني (مثال: سارة)"
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white font-bold flex-1 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <NajeSelect
                  value={speaker2Voice}
                  onChange={val => setSpeaker2Voice(val)}
                  options={VOICES.map(v => ({
                    value: v.id,
                    label: `${v.name} (${v.gender === 'male' ? 'رجل' : 'امرأة'}) — ${v.tone}`
                  }))}
                />
                <button
                  type="button"
                  onClick={() => playVoicePreview(speaker2Voice)}
                  className={cn(
                    "p-2 rounded-lg border transition cursor-pointer flex-shrink-0 flex items-center justify-center",
                    playingVoiceSample === speaker2Voice
                      ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                  )}
                  title="استماع لعينة الصوت"
                >
                  {playingVoiceSample === speaker2Voice ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">أسلوب الإلقاء للحوار:</span>
            <NajeSelect
              value={deliveryStyle}
              onChange={val => setDeliveryStyle(val)}
              options={[
                { value: 'default', label: 'طبيعي معتدل (تلقائي)' },
                { value: 'professional', label: 'رسمي هادئ احترافي' },
                { value: 'warm', label: 'ودود ودافئ (بودكاست)' },
                { value: 'energetic', label: 'حماسي وإعلاني (High Energy)' },
                { value: 'news', label: 'إخباري واضح ومباشر' }
              ]}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <strong>تنبيه صياغة السكريبت للحوار:</strong> يرجى إدخال الحوار بسطور منفصلة وتبدأ باسم المتحدث بالضبط مثل:<br/>
            <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{speaker1Name || 'أحمد'}: مرحبا بك في البرنامج...</code><br/>
            <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{speaker2Name || 'سارة'}: أهلاً وسهلاً، يسعدني التواجد اليوم...</code>
          </p>
        </div>
      )}
      {/* Live Script Parser Chips & Validation Warnings */}
      {voiceMode === 'dual' && input.trim().length > 0 && (() => {
        const parsedResult = parseDualScriptLines(input, speaker1Name, speaker2Name);
        return (
          <div className="flex flex-col gap-2 p-2.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">تحليل وسياق الحوار:</span>
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", parsedResult.isInformalNarrative ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" : parsedResult.isValid ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400")}>
                {parsedResult.isInformalNarrative ? 'صياغة عامية (سيتم التنظيم والفرز الذكي تلقائياً)' : parsedResult.isValid ? 'السكريبت منظم ومباشر' : 'يوجد أخطاء صياغة'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {parsedResult.parsed.map((item, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border",
                    item.speaker === 'speaker1' && "bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300",
                    item.speaker === 'speaker2' && "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
                    item.speaker === 'informal' && "bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
                    (item.speaker === 'unknown' || item.speaker === 'invalid') && "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold"
                  )}
                  title={item.text}
                >
                  <span className="opacity-60">#{item.lineNum}</span>
                  <strong>{item.speakerName || 'عامي'}:</strong>
                  <span className="truncate max-w-[120px]">{item.text || '...'}</span>
                </span>
              ))}
            </div>
            {parsedResult.errors.length > 0 && !parsedResult.isInformalNarrative && (
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {parsedResult.errors[0]}
              </div>
            )}
          </div>
        );
      })()}
      <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>
            تقدير مدة الصوت: ~{estimatedSeconds} ثانية
            ({words} كلمة)
          </span>
        </div>
        <div className="font-bold">
          التكلفة التقديرية: ~{estimatedCost.toFixed(2)} نقطة
        </div>
      </div>
    </motion.div>
  );
}
