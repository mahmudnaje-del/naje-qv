import React from 'react';
import { cn } from '../../lib/utils';
import { 
  Check, Eye, Code2, ChevronDown, ArrowUp, X, Sparkles, Layout, Zap, Lightbulb, Target
} from 'lucide-react';
import NajeErrorCard from '../NajeErrorCard';
import NajeThinking from '../NajeThinking';
import NajeModelTierSelector from '../NajeModelTierSelector';
import { AssistantTextMessage, parseUiMessage } from '../../pages/Chat';
import NajeReasoningIndicator, { NajeThinkingGeneric, NajePlanningIndicator } from '../NajeReasoningIndicator';
import { InteractiveLoadingPlaceholder } from '../InteractiveLoadingPlaceholder';
import NajeUiPreview from '../NajeUiPreview';
import NajeCodePane from '../NajeCodePane';
import { Message, ChatMessage } from '../../types';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from '../../toastStore';
import { useAppStore } from '../../store';
import { fetchWithRetry } from '../../lib/fetchWithRetry';

interface UiChatPanelProps {
  messages: Message[];
  loading: boolean;
  activeUiTab: 'chat' | 'preview' | 'code';
  setActiveUiTab: (tab: 'chat' | 'preview' | 'code') => void;
  UI_STARTER_TEMPLATES: Array<{ title: string; desc: string; prompt: string }>;
  setInput: (val: string) => void;
  executeSubmission: (prompt: string) => void;
  latestUiHtml: string;
  latestUiMsg: Message | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (e: React.FormEvent) => void;
  uiMode: 'plan' | 'build';
  setUiMode: (mode: 'plan' | 'build') => void;
  uiModelTier: 'lite' | 'core' | 'max';
  setUiModelTier: (tier: 'lite' | 'core' | 'max') => void;
  modelDropdownRef: React.RefObject<HTMLDivElement | null>;
  modelDropdownOpen: boolean;
  setModelDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  MODEL_TIER_INFO: Record<string, { label: string; hint: string }>;
  getMismatchSuggestion: (mode: 'plan' | 'build', text: string) => 'plan' | 'build' | null;
  input: string;
  selectedUiElement: { desc: string; html: string } | null;
  setSelectedUiElement: (el: { desc: string; html: string } | null) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  files: any[];
  abortControllerRef: React.RefObject<AbortController | null>;
  setLoading: (val: boolean) => void;
  aspectRatio: string;
  imageQuality: string;
  videoResolution: string;
  project: any;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  user: any;
  chatId: string | undefined;
  setActiveHistoryDocId: (id: string | null) => void;
  setActiveHistoryContent: (content: string | null) => void;
}

export default function UiChatPanel({
  messages,
  loading,
  activeUiTab,
  setActiveUiTab,
  UI_STARTER_TEMPLATES,
  setInput,
  executeSubmission,
  latestUiHtml,
  latestUiMsg,
  messagesEndRef,
  handleSend,
  uiMode,
  setUiMode,
  uiModelTier,
  setUiModelTier,
  modelDropdownRef,
  modelDropdownOpen,
  setModelDropdownOpen,
  MODEL_TIER_INFO,
  getMismatchSuggestion,
  input,
  selectedUiElement,
  setSelectedUiElement,
  textareaRef,
  files,
  abortControllerRef,
  setLoading,
  aspectRatio,
  imageQuality,
  videoResolution,
  project,
  setMessages,
  user,
  chatId,
  setActiveHistoryDocId,
  setActiveHistoryContent,
}: UiChatPanelProps) {
  // Guard against infinite auto-repair loops (same runtime error re-firing forever).
  const autoRepairCountRef = React.useRef(0);
  const lastRepairSigRef = React.useRef<string>('');
  React.useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'user') {
      autoRepairCountRef.current = 0;
      lastRepairSigRef.current = '';
    }
  }, [messages]);
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
      {/* Left Pane: Chat Stream + Dedicated Input */}
      <div className={cn(
        "flex flex-col h-full bg-transparent transition-all duration-200 w-full",
        activeUiTab === 'chat' 
          ? "flex-1" 
          : "hidden lg:flex lg:w-[380px] xl:w-[420px] flex-shrink-0 border-l border-gray-200/60 dark:border-gray-800/60"
      )}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="space-y-3 py-2 text-right">
              <div>
                <h3 className="text-gray-800 dark:text-gray-200 text-xs font-bold mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 inline" />
                  <span>نماذج أولية وقوالب بدء سريعة:</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  اختر قالبًا للبدء وتخصيصه فورًا عبر الذكاء الاصطناعي
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {UI_STARTER_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInput(tmpl.prompt);
                      executeSubmission(tmpl.prompt);
                    }}
                    className="p-3 rounded-xl text-right transition border bg-white/80 dark:bg-gray-900/50 border-gray-200/70 dark:border-gray-800/60 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/10 flex flex-col gap-0.5 cursor-pointer group w-full text-right"
                  >
                    <div className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tmpl.title}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                      {tmpl.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'max-w-[85%] naje-glass-card py-2.5 px-3.5 text-xs' : 'w-full text-gray-900 dark:text-gray-200 text-xs'}`}>
                    {msg.role === 'assistant' ? (
                      (() => {
                        const parsed = parseUiMessage(msg.content);
                        if (parsed.hasHtml) {
                          return (
                            <div className="space-y-2 w-full">
                              {parsed.chatText && (
                                <div className="p-2.5 bg-white/70 dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800 rounded-2xl text-xs leading-relaxed text-gray-800 dark:text-gray-200 shadow-sm">
                                  <AssistantTextMessage content={parsed.chatText} isStreaming={loading && msg.id === messages[messages.length - 1]?.id} searchSources={(msg as any).searchSources} />
                                </div>
                              )}
                              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl flex flex-col gap-2 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="font-bold text-gray-900 dark:text-white truncate">تم تحديث واجهة المستخدم</span>
                                  </div>
                                  <NajeThinking size={18} className="shrink-0 animate-pulse" />
                                </div>
                                <div className="flex items-center gap-1.5 pt-1 border-t border-indigo-100 dark:border-indigo-900/30">
                                  <button
                                    type="button"
                                    onClick={() => setActiveUiTab('preview')}
                                    className="flex-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>المعاينة</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveUiTab('code')}
                                    className="flex-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                                  >
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>الكود</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (msg.content?.startsWith('__NAJE_ERROR_JSON__:')) {
                          return <NajeErrorCard jsonContent={msg.content} />;
                        } else {
                          return <AssistantTextMessage content={msg.content} isStreaming={loading && msg.id === messages[messages.length - 1]?.id} searchSources={(msg as any).searchSources} />;
                        }
                      })()
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-full">
                {uiMode === 'plan' ? (
                  <NajePlanningIndicator hasStarted={!!latestUiHtml} />
                ) : !latestUiHtml ? (
                  <InteractiveLoadingPlaceholder userPrompt={messages[messages.length - 1]?.content} />
                ) : (
                  <NajeReasoningIndicator chatType="ui" rawHtml={latestUiHtml} hasStartedContent={!!latestUiHtml} />
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Docked Input Form for UI Pane */}
        <div className="p-2 sm:p-3 bg-[#FAF9FC]/95 dark:bg-[#0d0f12]/95 border-t border-gray-200/80 dark:border-gray-800/80 w-full shrink-0 z-30 pb-safe backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSend} className="w-full max-w-4xl mx-auto p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl flex flex-col gap-2 relative transition-all duration-200">
            {/* Mode & Model Tier Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-gray-900 p-0.5 rounded-lg border border-gray-300/80 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setUiMode('plan')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                      uiMode === 'plan'
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                  >
                    <Layout className="w-3 h-3" />
                    <span>تخطيط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUiMode('build')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1",
                      uiMode === 'build'
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                  >
                    <Zap className="w-3 h-3" />
                    <span>بناء</span>
                  </button>
                </div>

                {/* Model Tier Selector Dropdown */}
                <NajeModelTierSelector
                  value={uiModelTier}
                  onChange={setUiModelTier}
                  disabled={loading}
                />
              </div>

              {uiMode === 'plan' ? (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                  استشارة وتخطيط (مجاني)
                </span>
              ) : (
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-900/40">
                  توليد واجهة كود حقيقية ({uiModelTier === 'lite' ? '0.6x' : uiModelTier === 'max' ? '2.0x' : '1.0x'})
                </span>
              )}
            </div>

            {/* Mismatch Suggestion Chip */}
            {(() => {
              const mismatch = getMismatchSuggestion(uiMode, input);
              if (!mismatch) return null;
              return (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between text-xs my-1">
                  <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />
                    <span>
                      {mismatch === 'plan'
                        ? 'يبدو إنك بتفكر بالفكرة مش جاهز للبناء بعد — بدك أحوّلك لوضع التخطيط؟'
                        : 'حسّيت إنك جاهز تبني! بدك أحوّلك لوضع البناء؟'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUiMode(mismatch)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg transition cursor-pointer shrink-0"
                  >
                    {mismatch === 'plan' ? 'التبديل للتخطيط' : 'التبديل للبناء'}
                  </button>
                </div>
              );
            })()}

            {selectedUiElement && (
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center justify-between text-xs">
                <span className="truncate text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0 inline" />
                  <span>تعديل عنصر: {selectedUiElement.desc}</span>
                </span>
                <button type="button" onClick={() => setSelectedUiElement(null)} className="text-gray-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { 
                    e.preventDefault(); 
                    handleSend(e); 
                  } 
                }}
                placeholder={selectedUiElement ? "اكتب طلب التعديل على هذا العنصر..." : "صف واجهة المستخدم..."}
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 outline-none resize-none min-h-[38px] max-h-[100px] text-gray-900 dark:text-white"
                rows={1}
              />
              {loading ? (
                <button
                  type="button"
                  onClick={() => {
                    if (abortControllerRef.current) abortControllerRef.current.abort();
                    setLoading(false);
                  }}
                  className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
                  title="إيقاف"
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && files.length === 0}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Middle Pane: Live Preview */}
      <div className={cn(
        "flex-1 h-full flex flex-col overflow-hidden bg-slate-100/70 dark:bg-slate-950/70 p-2 sm:p-4",
        activeUiTab === 'preview' ? "flex" : "hidden"
      )}>
        <NajeUiPreview
          rawHtml={latestUiHtml}
          isStreaming={loading}
          onSelectElement={(el) => {
            setSelectedUiElement(el);
            setActiveUiTab('chat');
          }}
          onAutoRepair={async (errMsg, line) => {
            if (loading || !latestUiHtml) return;
            // Stop infinite repair loops: never repair the SAME error twice, and cap total attempts.
            const sig = `${errMsg}@${line}`;
            if (lastRepairSigRef.current === sig) {
              console.warn('[auto-repair] same error already attempted — stopping to avoid a loop.');
              return;
            }
            if (autoRepairCountRef.current >= 3) {
              console.warn('[auto-repair] attempt cap reached — stopping.');
              toast.error('تعذّر الإصلاح التلقائي بعد عدة محاولات. جرّب تعديل الطلب يدوياً.');
              return;
            }
            lastRepairSigRef.current = sig;
            autoRepairCountRef.current += 1;
            const repairPrompt = `[AUTO-REPAIR BUG FIX]: The following runtime JS error occurred during user interaction: "${errMsg}" at line ${line}. Carefully review the code logic, fix the error, and return the complete corrected document without breaking existing styles or features.`;
            try {
              setLoading(true);
              const token = await auth.currentUser?.getIdToken();
              const res = await fetchWithRetry('/api/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  history: messages.map(m => ({ role: m.role, content: m.content, files: m.files })),
                  prompt: repairPrompt,
                  type: 'ui',
                  model: uiModelTier,
                  config: { aspectRatio, quality: imageQuality, resolution: videoResolution },
                  files: [],
                  projectData: project,
                  isEdit: true,
                  isAutoRepair: true,
                  previousHtml: latestUiHtml,
                  mode: 'build',
                  chatId: chatId || 'ui-chat',
                  projectId: project?.id || useAppStore.getState().activeProjectId || undefined
                })
              });
              if (res.ok) {
                const data = await res.json();
                const newHtml = data.html || data.text;
                if (newHtml) {
                  const newAssistantMsg: ChatMessage = {
                    id: String(Date.now()),
                    chatId: chatId || 'ui-chat',
                    role: 'assistant',
                    content: newHtml,
                    createdAt: Date.now()
                  };
                  setMessages(prev => [...prev, newAssistantMsg]);
                  toast.success('تم إكمال الإصلاح التلقائي بنجاح!');
                }
              }
            } catch (e) {
              console.error('Auto repair failed:', e);
            } finally {
              setLoading(false);
            }
          }}
          onSaveToProject={project ? () => {
            if (!user || !latestUiHtml) return;
            addDoc(collection(db, 'generated_media'), {
              ownerId: user.uid,
              projectId: project.id,
              chatId,
              kind: 'ui',
              title: `واجهة UI - ${new Date().toLocaleDateString('ar-SA')}`,
              content: latestUiHtml,
              createdAt: Date.now()
            }).then(() => toast.success('تم حفظ الواجهة في المشروع بنجاح')).catch(() => toast.error('خطأ أثناء حفظ الواجهة'));
          } : undefined}
          onOpenHistory={() => {
            if (!latestUiMsg) return;
            setActiveHistoryDocId(chatId || latestUiMsg.id);
            setActiveHistoryContent(latestUiHtml);
          }}
          onRegenerate={() => {
            setInput('أعد توليد الواجهة بنفس الفكرة وتصميم أفضل');
            setActiveUiTab('chat');
            if (textareaRef.current) textareaRef.current.focus();
          }}
        />
      </div>

      {/* Right Pane: Code View */}
      <div className={cn(
        "flex-1 h-full flex flex-col overflow-hidden bg-slate-900 p-2 sm:p-4",
        activeUiTab === 'code' ? "flex" : "hidden"
      )}>
        <NajeCodePane code={latestUiHtml} isStreaming={loading} />
      </div>
    </div>
  );
}
