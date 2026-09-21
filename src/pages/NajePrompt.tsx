import React, { useState } from 'react';
import { Copy, MessageSquareText, Send, Sparkles } from 'lucide-react';
import { auth } from '../firebase';
import { toast } from '../toastStore';
import NajeThinking from '../components/NajeThinking';
import StudioBootSplash from '../components/StudioBootSplash';

type AskQ = { id: string; q: string; options?: string[] };
type Phase = 'idle' | 'thinking' | 'ask' | 'ready';

function parseModelJson(raw: string): any | null {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : t;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function askNaje(prompt: string): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يلزم تسجيل الدخول');
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      type: 'text',
      prompt,
      history: [],
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(raw);
      throw new Error(j.error || 'تعذر التواصل مع ناجي');
    } catch (e: any) {
      if (e?.message && !e.message.includes('JSON')) throw e;
      throw new Error(raw.slice(0, 180) || 'تعذر التواصل مع ناجي');
    }
  }
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('event-stream') || raw.includes('data:')) {
    let acc = '';
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        if (j.error) throw new Error(String(j.error));
        if (typeof j.replaceContent === 'string') acc = j.replaceContent;
        else if (typeof j.text === 'string') acc += j.text;
        else if (typeof j.content === 'string') acc += j.content;
      } catch (e: any) {
        if (e instanceof SyntaxError) {
          acc += payload;
          continue;
        }
        throw e;
      }
    }
    if (acc.trim()) return acc;
  }
  try {
    const j = JSON.parse(raw);
    return String(j.text || j.content || j.reply || j.output || raw);
  } catch {
    return raw;
  }
}

const SYSTEM = `أنت «ناجي برومبت». مهمتك صياغة برومبت إنتاج جاهز، لا التحقيق.
أرجع JSON فقط بدون شرح.
إذا الفكرة واضحة بما يكفي (حتى لو ناقصة تفاصيل ثانوية): 
{"mode":"ready","title":"عنوان قصير","prompt":"برومبت إنتاج عربي/إنجليزي غني وجاهز للنموذج","bestFor":"image|video|ad|text"}
إذا ينقصك معلومة جوهرية واحدة أو اثنتين فقط (الهدف، المنتج، أو المنصة) وليس ألواناً أو زوايا:
{"mode":"ask","questions":[{"id":"q1","q":"سؤال واحد واضح","options":["خيار1","خيار2","خيار3"]}]}
لا تسأل أكثر من سؤالين. لا تعيد السؤال إذا المستخدم أجاب. لا تحقق.`;

export default function NajePrompt() {
  const [idea, setIdea] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<AskQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState<{ title: string; prompt: string; bestFor?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (extra?: string) => {
    const seed = idea.trim();
    if (!seed) {
      toast.error('اكتب فكرتك أولاً');
      return;
    }
    setError(null);
    setPhase('thinking');
    const payload = extra
      ? `${SYSTEM}\n\nفكرة المستخدم:\n${seed}\n\nإجابات توضيحية:\n${extra}`
      : `${SYSTEM}\n\nفكرة المستخدم:\n${seed}`;
    try {
      const raw = await askNaje(payload);
      const data = parseModelJson(raw);
      if (data?.mode === 'ask' && Array.isArray(data.questions) && data.questions.length && !extra) {
        setQuestions(data.questions.slice(0, 2).map((q: any, i: number) => ({
          id: String(q.id || `q${i + 1}`),
          q: String(q.q || q.question || ''),
          options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : undefined,
        })).filter((q: AskQ) => q.q));
        setPhase('ask');
        return;
      }
      const prompt = String(data?.prompt || raw).trim();
      if (!prompt) throw new Error('لم يصل برومبت واضح');
      setReady({
        title: String(data?.title || 'البرومبت الجاهز'),
        prompt,
        bestFor: data?.bestFor,
      });
      setPhase('ready');
    } catch (e: any) {
      setError(e?.message || 'تعذر بناء البرومبت');
      setPhase('idle');
    }
  };

  const submitAnswers = () => {
    const lines = questions
      .map((q) => `- ${q.q}: ${answers[q.id]?.trim() || 'بدون إجابة'}`)
      .join('\n');
    run(lines);
  };

  return (
    <div className="relative h-full overflow-y-auto bg-naje-canvas px-3 py-4 sm:px-6" dir="rtl">
      <StudioBootSplash />
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="rounded-3xl border border-indigo-500/20 bg-gradient-to-bl from-indigo-600/15 via-transparent to-transparent p-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-300">
            <MessageSquareText className="h-3.5 w-3.5" /> ناجي برومبت
          </div>
          <h1 className="text-xl font-black text-naje-ink">حوّل فكرتك إلى برومبت جاهز</h1>
          <p className="mt-1 text-xs text-naje-muted">النموذج يفهم أولاً. يسأل فقط إذا نقص شيء جوهري — مو تحقيق من أول رسالة.</p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="mb-2 block text-xs font-black text-naje-ink">فكرتك</label>
          <textarea
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="مثال: إعلان عطر فاخر لليل، أو صورة منتج على سطح رخامي..."
            className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-naje-ink placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-black/30"
          />
          <button
            type="button"
            disabled={phase === 'thinking'}
            onClick={() => run()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {phase === 'thinking' ? <NajeThinking size={22} /> : <Sparkles className="h-4 w-4" />}
            {phase === 'thinking' ? 'ناجي يقرأ الفكرة…' : 'افهم الفكرة'}
          </button>
        </section>

        {error && <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">{error}</p>}

        {phase === 'ask' && (
          <section className="space-y-3 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-black text-naje-ink">نقطة واحدة لتوضيح الاتجاه — مش قائمة تحقيق</p>
            {questions.map((q) => (
              <div key={q.id} className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="mb-2 text-sm font-bold text-naje-ink">{q.q}</p>
                {q.options && q.options.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                        className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold ${
                          answers[q.id] === opt
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-zinc-200 text-naje-ink dark:border-zinc-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  placeholder="أو اكتب جوابك…"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-black/30"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={submitAnswers}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 text-sm font-black text-white"
            >
              <Send className="h-4 w-4" /> أكمل البرومبت
            </button>
          </section>
        )}

        {phase === 'ready' && ready && (
          <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h2 className="text-sm font-black text-naje-ink">{ready.title}</h2>
            {ready.bestFor && <p className="mt-1 text-[10px] font-bold text-emerald-600">الأنسب: {ready.bestFor}</p>}
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/80 p-3 text-[12px] leading-relaxed text-white">{ready.prompt}</pre>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(ready.prompt);
                toast.success('تم نسخ البرومبت');
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black dark:border-zinc-700"
            >
              <Copy className="h-3.5 w-3.5" /> نسخ
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
