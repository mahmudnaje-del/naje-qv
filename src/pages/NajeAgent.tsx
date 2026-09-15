import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  Bot, Sparkles, Send, Play, CheckCircle2, Circle, AlertCircle, 
  Layers, Shield, Download, FileText, Image as ImageIcon, Film, 
  Palette, ArrowRight, RefreshCw, ChevronRight, Zap,
  ExternalLink, Eye, Check, X, Sparkle, Volume2, Mic, Code2, 
  FolderTree, FileCode, MonitorPlay, Copy, Archive, CheckCheck,
  MessageSquare, HelpCircle, ArrowUpRight, Cpu, Wrench, Star
} from 'lucide-react';
import NajeSpinner from '../components/NajeSpinner';
import { applyVersionCap, toggleFavoriteVersion, MAX_VERSIONS_PER_ASSET } from '../lib/versionHistory';
import { 
  AgentMission, AgentStep, AgentToolCall, AgentArtifact, 
  AgentPlanProposal, AgentCodeFile, AgentChatMessage, AgentChatTurnResponse,
  ProjectContract, LinkerDiagnostic
} from '../types/agent';
import { toast } from '../toastStore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import NajeCodePane from '../components/NajeCodePane';
import { FullstackBuildProgress } from '../lib/fullstackBuilder';
import { formatProfessionalError } from '../utils/errorFormatter';
import NajeErrorCard from '../components/NajeErrorCard';
import FeaturePaywallModal from '../components/FeaturePaywallModal';
import { hasFeatureAccess } from '../lib/featureAccess';

function sanitizeHtmlContent(html: string): string {
  if (!html) return '';
  return html
    // Strip dangerous active tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Strip all inline event handlers (e.g. onclick, onload, onerror, onmouseover...)
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Strip javascript: and vbscript: URIs in attributes
    .replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/data\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/action\s*=\s*["']?\s*javascript:[^"'>]*/gi, '');
}

const INITIAL_GREETING: AgentChatMessage = {
  id: 'msg_welcome',
  role: 'model',
  type: 'reply',
  content: 'أهلاً بك! أنا Naje Agent Core — محرك البناء والنسج البرمجي المستقل. أستطيع تخطيط وصياغة وتوليد المنظومات البرمجية متعددة الملفات، وبناء الهويات الرقمية، والأبحاث المعززة بالبحث الحي. صف فكرتك أو مشروعك وسأنسج لك المعمارية الكاملة.',
  timestamp: Date.now()
};

const SUGGESTED_PROMPTS = [
  'مرحبا! ما هي قدراتك ونطاق عملك؟',
  'بناء موقع تجارة إلكترونية كامل مع هوية بصرية وشعار',
  'تصميم هوية فاخرة لبراند عطور مع فويس أوفر وفيديو إعلاني',
  'كتيب استراتيجي تسويقي من 4 فصول لشركة ناشئة'
];

export default function NajeAgent() {
  const { user } = useAppStore();
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [activeMission, setActiveMission] = useState<AgentMission | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AgentPlanProposal | null>(null);
  const [showAgentPaywall, setShowAgentPaywall] = useState(false);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executingStatusMessage, setExecutingStatusMessage] = useState<string>('');
  const [liveProgress, setLiveProgress] = useState<FullstackBuildProgress | null>(null);
  const [selectedArtifactPreview, setSelectedArtifactPreview] = useState<AgentArtifact | null>(null);
  const [selectedCodeTab, setSelectedCodeTab] = useState<'preview' | 'code'>('preview');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingChat]);

  // Subscribe to user missions
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'autonoma_missions'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgentMission));
      setMissions(docs);
      if (activeMission) {
        const updated = docs.find(d => d.id === activeMission.id);
        if (updated) setActiveMission(updated);
      }
    }, (err) => {
      console.warn('Missions listener error:', err);
    });

    return () => unsub();
  }, [user?.uid, activeMission?.id]);

  // Send message to Agent Conversational Turn Endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSendingChat) return;

    if (!hasFeatureAccess(user, 'najeAgent')) {
      setShowAgentPaywall(true);
      return;
    }

    const userMessage: AgentChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsSendingChat(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error('يجب تسجيل الدخول لمحادثة Naje Agent Core.');
        setIsSendingChat(false);
        return;
      }

      const res = await fetch('/api/agent/chat-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content || m.question || (m.proposal ? m.proposal.planSummary : '')
          }))
        })
      });

      if (!res.ok) {
        throw new Error('تعذر التواصل مع Naje Agent Core حالياً.');
      }

      const turnData: { success: boolean; turn: AgentChatTurnResponse } = await res.json();
      if (turnData.success && turnData.turn) {
        const turn = turnData.turn;
        const botMsg: AgentChatMessage = {
          id: `bot_${Date.now()}`,
          role: 'model',
          type: turn.type,
          content: turn.type === 'reply' ? turn.message : undefined,
          question: turn.type === 'clarification' ? turn.question : undefined,
          suggestedQuickReplies: turn.type === 'clarification' ? turn.suggestedQuickReplies : undefined,
          proposal: turn.type === 'proposal' ? turn.proposal : undefined,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMsg]);
        if (turn.type === 'proposal') {
          setActiveProposal(turn.proposal);
        }
      }
    } catch (err: any) {
      console.error('Chat turn error:', err);
      const formattedErrorContent = await formatProfessionalError(err, { chatType: 'agent' });
      setMessages(prev => [...prev, {
        id: `bot_err_${Date.now()}`,
        role: 'model',
        type: 'reply',
        content: formattedErrorContent,
        timestamp: Date.now()
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // User accepts proposal -> Create mission in Firestore
  const handleApproveProposal = async (proposal: AgentPlanProposal) => {
    if (!user?.uid) {
      toast.error('يجب تسجيل الدخول أولاً.');
      return;
    }

    if ((user.balance ?? 0) < proposal.totalEstimatedPoints) {
      toast.error(`رصيدك الحالي (${user.balance ?? 0}) لا يكفي لتشغيل هذه المهمة (${proposal.totalEstimatedPoints} نقطة).`);
      return;
    }

    try {
      const steps: AgentStep[] = proposal.steps.map((st, idx) => ({
        id: `step_${idx + 1}`,
        title: st.title,
        description: st.description,
        status: 'pending',
        toolCalls: st.tools.map((t, tIdx) => ({
          id: `tool_${idx + 1}_${tIdx + 1}`,
          name: t.name,
          title: t.title,
          status: 'pending',
          input: t.inputParams || {},
          pointsCost: t.estimatedPoints
        }))
      }));

      const newMissionData: Omit<AgentMission, 'id'> = {
        ownerId: user.uid,
        title: proposal.missionTitle,
        userPrompt: messages.filter(m => m.role === 'user').map(m => m.content).join(' | '),
        status: 'waiting_approval',
        estimatedPoints: proposal.totalEstimatedPoints,
        consumedPoints: 0,
        planSummary: proposal.planSummary,
        steps,
        artifacts: [],
        auditHistory: [],
        brandContext: proposal.brandContext,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'autonoma_missions'), newMissionData);
      const fullMission: AgentMission = { id: docRef.id, ...newMissionData };
      setActiveMission(fullMission);
      toast.success('تم إنشاء خطة العمل بنجاح! يمكنك مراجعتها والبدء فوراً.');
    } catch (err: any) {
      console.error('Error approving proposal:', err);
      toast.error('تعذر حفظ الخطة، حاول ثانية.');
    }
  };

  // Start Autonomous Execution Loop
  const handleExecuteMission = async () => {
    if (!activeMission || isExecuting) return;

    try {
      setIsExecuting(true);
      setLiveProgress(null);

      await updateDoc(doc(db, 'autonoma_missions', activeMission.id), {
        status: 'executing',
        updatedAt: Date.now()
      });

      const currentMission: AgentMission = { 
        ...activeMission, 
        status: 'executing',
        steps: [...activeMission.steps],
        artifacts: [...activeMission.artifacts],
        auditHistory: [...(activeMission.auditHistory || [])]
      };

      const totalSteps = currentMission.steps.length;

      for (let sIdx = 0; sIdx < totalSteps; sIdx++) {
        setCurrentStepIndex(sIdx);
        const step = currentMission.steps[sIdx];
        step.status = 'in_progress';

        await updateDoc(doc(db, 'autonoma_missions', currentMission.id), {
          steps: currentMission.steps,
          updatedAt: Date.now()
        });

        // Run tools sequentially inside this step
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const tc of step.toolCalls) {
            tc.status = 'running';
            
            // Set initial status message based on tool
            if (tc.name === 'fullstack_engineer') {
              setExecutingStatusMessage('Naje Agent Core يحلل المتطلبات ويخطط المعمارية الهندسية الشاملة...');
            } else if (tc.name === 'web_grounding') {
              setExecutingStatusMessage('Naje Agent Core يستدعي Google Search Grounding ويستخرج أحدث البيانات الحية...');
            } else if (tc.name === 'brand_identity') {
              setExecutingStatusMessage('Naje Agent Core يصيغ الهوية اللفظية ولوحة الألوان المتناسقة...');
            } else if (tc.name === 'image_studio') {
              setExecutingStatusMessage('Naje Agent Core يولد الصورة الاحترافية بدقة عالية...');
            } else if (tc.name === 'voice_narration') {
              setExecutingStatusMessage('Naje Agent Core يولد التسجيل الصوتي الطبيعي والمعالجة الصوتية...');
            } else if (tc.name === 'document_architect') {
              setExecutingStatusMessage('Naje Agent Core يصيغ وهيكلة فصول الكتيب الفاخر...');
            } else {
              setExecutingStatusMessage('Naje Agent Core يعالج ويولد المخرج الذاتي...');
            }

            await updateDoc(doc(db, 'autonoma_missions', currentMission.id), {
              steps: currentMission.steps
            });

            const token = await auth.currentUser?.getIdToken();
            if (!token) {
              throw new Error('جلسة الدخول غير صالحة.');
            }

            // If tool is fullstack_engineer -> Use Real-Time SSE Stream Endpoint
            if (tc.name === 'fullstack_engineer') {
              const streamRes = await fetch('/api/agent/execute-tool-stream', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  toolName: tc.name,
                  inputParams: tc.input,
                  missionContext: {
                    missionId: currentMission.id,
                    brandContext: currentMission.brandContext,
                    userPrompt: currentMission.userPrompt,
                    auditHistory: currentMission.auditHistory
                  },
                  chatId: currentMission.id,
                  projectId: useAppStore.getState().activeProjectId || undefined
                })
              });

              if (!streamRes.ok) {
                const errJson = await streamRes.json().catch(() => ({}));
                throw new Error(errJson.error || 'تعذر تشغيل Naje Agent Core عبر قناة البث المباشر.');
              }

              const reader = streamRes.body?.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let streamDone = false;
              let finalData: any = null;
              let lastStreamError = '';

              if (reader) {
                while (!streamDone) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const eventBlocks = buffer.split('\n\n');
                  buffer = eventBlocks.pop() || '';

                  for (const block of eventBlocks) {
                    const eventMatch = block.match(/^event:\s*(\w+)/m);
                    const dataMatch = block.match(/^data:\s*(.+)$/m);

                    if (eventMatch && dataMatch) {
                      const eventType = eventMatch[1];
                      try {
                        const parsedPayload = JSON.parse(dataMatch[1]);
                        if (eventType === 'progress') {
                          setLiveProgress(parsedPayload);
                          if (parsedPayload.statusMessage) {
                            setExecutingStatusMessage(parsedPayload.statusMessage);
                          }
                        } else if (eventType === 'done') {
                          finalData = parsedPayload;
                          streamDone = true;
                        } else if (eventType === 'error') {
                          lastStreamError = parsedPayload.error || 'فشلت معالجة نسج المشروع البرمجي.';
                          streamDone = true;
                        }
                      } catch (parseErr) {
                        console.warn('SSE chunk parse error:', parseErr);
                      }
                    }
                  }
                }
              }

              if (finalData && finalData.success) {
                tc.status = 'completed';
                tc.output = finalData.output;
                currentMission.consumedPoints += (finalData.pointsDeducted || 0);

                if (finalData.artifact) {
                  const { updatedVersions } = applyVersionCap(currentMission.artifacts, finalData.artifact, MAX_VERSIONS_PER_ASSET);
                  currentMission.artifacts = updatedVersions;
                }

                if (finalData.audit) {
                  if (!currentMission.auditHistory) currentMission.auditHistory = [];
                  currentMission.auditHistory.push({
                    stepTitle: step.title,
                    feedback: finalData.audit.feedback || 'تم اعتماد المشروع بنجاح',
                    passed: !!finalData.audit.passed,
                    timestamp: Date.now()
                  });
                }
              } else {
                tc.status = 'failed';
                tc.error = lastStreamError || finalData?.error || 'تعذّر قراءة رد النموذج.';
              }

            } else {
              // Standard Tool Execution
              const execRes = await fetch('/api/agent/execute-tool', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  toolName: tc.name,
                  inputParams: tc.input,
                  missionContext: {
                    missionId: currentMission.id,
                    brandContext: currentMission.brandContext,
                    userPrompt: currentMission.userPrompt,
                    auditHistory: currentMission.auditHistory || []
                  },
                  chatId: currentMission.id,
                  projectId: useAppStore.getState().activeProjectId || undefined
                })
              });

              const execData = await execRes.json();
              if (execData.success) {
                tc.status = 'completed';
                tc.output = execData.output;
                currentMission.consumedPoints += (execData.pointsDeducted || 0);

                if (execData.artifact) {
                  const { updatedVersions } = applyVersionCap(currentMission.artifacts, execData.artifact, MAX_VERSIONS_PER_ASSET);
                  currentMission.artifacts = updatedVersions;
                }

                if (execData.audit) {
                  if (!currentMission.auditHistory) currentMission.auditHistory = [];
                  currentMission.auditHistory.push({
                    stepTitle: step.title,
                    feedback: execData.audit.feedback || 'تم الاعتماد بنجاح',
                    passed: !!execData.audit.passed,
                    timestamp: Date.now()
                  });
                }
              } else {
                tc.status = 'failed';
                tc.error = execData.error;
              }
            }

            // Sync step, artifacts, and audit history to Firestore
            await updateDoc(doc(db, 'autonoma_missions', currentMission.id), {
              steps: currentMission.steps,
              artifacts: currentMission.artifacts,
              auditHistory: currentMission.auditHistory,
              consumedPoints: currentMission.consumedPoints,
              updatedAt: Date.now()
            });
          }
        }

        step.status = 'completed';
        await updateDoc(doc(db, 'autonoma_missions', currentMission.id), {
          steps: currentMission.steps,
          updatedAt: Date.now()
        });
      }

      await updateDoc(doc(db, 'autonoma_missions', currentMission.id), {
        status: 'completed',
        updatedAt: Date.now()
      });

      toast.success('تم إنجاز المهمة بالكامل ونسج جميع المخرجات بنجاح!');
    } catch (err: any) {
      console.error('Mission execution error:', err);
      toast.error(err.message || 'حدث خطأ أثناء تنفيذ المهمة.');
    } finally {
      setIsExecuting(false);
      setLiveProgress(null);
      setCurrentStepIndex(-1);
      setExecutingStatusMessage('');
    }
  };

  // Download code artifact as ZIP
  const handleDownloadZip = async (artifact: AgentArtifact) => {
    try {
      const zip = new JSZip();
      const files: AgentCodeFile[] = artifact.files || [];
      
      if (files.length === 0 && artifact.data?.previewHtml) {
        zip.file("index.html", artifact.data.previewHtml);
      } else {
        files.forEach(f => {
          zip.file(f.path, f.content);
        });
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, artifact.downloadFilename || `${artifact.title || 'project'}.zip`);
      toast.success('تم تصدير وتحميل حزمة المشروع البرمجي ZIP بنجاح!');
    } catch (err) {
      console.error('ZIP download error:', err);
      toast.error('تعذر تصدير المشروع كملف مضغوط.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9FC] dark:bg-[#0d0f12] text-slate-800 dark:text-slate-200 overflow-hidden font-sans" dir="rtl">
      <FeaturePaywallModal
        isOpen={showAgentPaywall}
        onClose={() => setShowAgentPaywall(false)}
        feature="najeAgent"
      />
      
      {/* 1. Top Header Bar */}
      <div className="h-16 px-6 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-gray-900 dark:text-white tracking-wide" dir="ltr">Naje Agent Core</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" dir="ltr">
                Engine Pro
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">محرك البناء البرمجي وصياغة المنظومات والهويات الرقمية متعددة الملفات</p>
          </div>
        </div>

        {/* Action / Balance Indicator */}
        <div className="flex items-center gap-3">
          {activeMission ? (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
              <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-bold text-gray-700 dark:text-gray-300">النقاط:</span>
              <span className="font-extrabold text-purple-600 dark:text-purple-400">{activeMission.consumedPoints} / {activeMission.estimatedPoints}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>الرصيد: {user?.balance ?? 0} نقطة</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Workstation Area (3-Column Layout) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left Column: Missions History Sidebar */}
        <div className="w-72 border-l border-gray-200/80 dark:border-gray-800/80 bg-white/40 dark:bg-gray-900/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-900 dark:text-white">سجل مشاريع <span dir="ltr">Naje Agent Core</span></span>
            <button 
              onClick={() => {
                setActiveMission(null);
                setActiveProposal(null);
              }}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/50"
            >
              <MessageSquare className="w-3 h-3" />
              محادثة جديدة
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {missions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Cpu className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">لا توجد مشاريع سابقة. تحدث مع <span dir="ltr">Naje Agent Core</span> وسيقترح لك معمارية محكمة عند تحديد طلبك!</p>
              </div>
            ) : (
              missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setActiveMission(m)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    activeMission?.id === m.id
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/60 shadow-sm'
                      : 'bg-white/60 dark:bg-gray-900/50 border-gray-200/60 dark:border-gray-800/60 hover:border-purple-200 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{m.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        m.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        m.status === 'executing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      }`}>
                        {m.status === 'completed' ? 'مكتملة' : m.status === 'executing' ? 'قيد التنفيذ' : 'بانتظار الموافقة'}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('هل تريد حذف هذا المشروع وسجله؟')) {
                            await deleteDoc(doc(db, 'autonoma_missions', m.id));
                            if (activeMission?.id === m.id) setActiveMission(null);
                            toast.success('تم حذف المشروع بنجاح.');
                          }
                        }}
                        className="p-1 hover:text-red-600 text-gray-400 dark:text-gray-500 rounded transition-colors"
                        title="حذف المشروع"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{m.planSummary || m.userPrompt}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Column: Interactive Conversational Workstation / Execution Flow */}
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-200/80 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/40 overflow-hidden">
          
          {!activeMission ? (
            // ==========================================
            // CONVERSATIONAL CHAT WORKSTATION
            // ==========================================
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 max-w-2xl ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm'
                    }`}>
                      {msg.role === 'user' ? 'أنت' : <Cpu className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble Content */}
                    <div className="space-y-3 min-w-0 max-w-[85%]">
                      
                      {/* Standard Text Bubble or Error Card */}
                      {msg.content && (
                        msg.content.startsWith('__NAJE_ERROR_JSON__:') ? (
                          <div className="w-full">
                            <NajeErrorCard jsonContent={msg.content} />
                          </div>
                        ) : (
                          <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white rounded-tr-xs shadow-sm font-medium'
                              : 'bg-white dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 rounded-tl-xs shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                        )
                      )}

                      {/* Clarification Question Bubble with Quick Replies */}
                      {msg.type === 'clarification' && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border border-purple-200 dark:border-purple-800/60 rounded-tl-xs shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                            <HelpCircle className="w-4 h-4" />
                            <span>استيضاح لتخصيص الخطة المعمارية:</span>
                          </div>
                          <p className="text-xs leading-relaxed">{msg.question}</p>

                          {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              {msg.suggestedQuickReplies.map((reply, rIdx) => (
                                <button
                                  key={rIdx}
                                  onClick={() => handleSendMessage(reply)}
                                  disabled={isSendingChat}
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <span>{reply}</span>
                                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Proposal Card Bubble */}
                      {msg.type === 'proposal' && msg.proposal && (
                        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/95 border border-purple-300 dark:border-purple-700 shadow-md space-y-4 text-gray-800 dark:text-gray-200">
                          
                          {/* Proposal Header */}
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                                {msg.proposal.missionTitle}
                              </span>
                            </div>
                            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {msg.proposal.totalEstimatedPoints} نقطة
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            {msg.proposal.planSummary}
                          </p>

                          {/* Steps List */}
                          <div className="space-y-2">
                            {msg.proposal.steps.map((st, sIdx) => (
                              <div key={sIdx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/60 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                                  <span>{sIdx + 1}. {st.title}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{st.description}</p>
                              </div>
                            ))}
                          </div>

                          {/* Approval Action Button */}
                          <div className="pt-2">
                            <button
                              onClick={() => handleApproveProposal(msg.proposal!)}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              اعتماد المعمارية وبدء النسج الذاتي ({msg.proposal.totalEstimatedPoints} نقطة)
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                ))}

                {isSendingChat && (
                  <div className="flex gap-3 max-w-2xl ml-auto">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500">
                      <NajeSpinner className="w-3.5 h-3.5" />
                      <span><span dir="ltr">Naje Agent Core</span> يفكر ويصيغ المعمارية...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input & Suggested Chips Bar */}
              <div className="p-4 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm space-y-2.5">
                {messages.length <= 2 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isSendingChat}
                        className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950/60 dark:hover:text-purple-300 transition-all border border-gray-200/60 dark:border-gray-700/60 cursor-pointer shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl border border-purple-200/80 dark:border-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500">
                  <textarea
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="تحدث مع Naje Agent Core أو اطلب بناء منظومة برمجية/موقع/هوية/فيديو..."
                    className="w-full bg-transparent resize-none p-3.5 outline-none text-xs text-gray-900 dark:text-white placeholder:text-gray-400 leading-relaxed"
                  />
                  <div className="pl-3">
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isSendingChat || !inputText.trim()}
                      className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isSendingChat ? <NajeSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // ==========================================
            // ACTIVE MISSION EXECUTION GRAPH VIEW
            // ==========================================
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Mission Header Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      {activeMission.title}
                    </h2>
                    {activeMission.status === 'waiting_approval' && (
                      <button
                        onClick={handleExecuteMission}
                        disabled={isExecuting}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                      >
                        {isExecuting ? <NajeSpinner className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        بدء النسج والتنفيذ ({activeMission.estimatedPoints} نقطة)
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    {activeMission.planSummary}
                  </p>

                  {/* Brand Context Chips */}
                  {activeMission.brandContext && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                      {activeMission.brandContext.brandName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          البراند: {activeMission.brandContext.brandName}
                        </span>
                      )}
                      {activeMission.brandContext.industry && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          المجال: {activeMission.brandContext.industry}
                        </span>
                      )}
                      {activeMission.brandContext.tone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          النبرة: {activeMission.brandContext.tone}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Steps Execution Graph */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">مراحل التنفيذ والتدقيق الهندسي</h3>
                  
                  {activeMission.steps.map((step, idx) => {
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div 
                        key={step.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          step.status === 'completed' ? 'bg-white dark:bg-gray-900/70 border-emerald-300/80 dark:border-emerald-800/50' :
                          step.status === 'in_progress' || isCurrent ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-600 shadow-md ring-1 ring-purple-400' :
                          'bg-white/40 dark:bg-gray-900/30 border-gray-200/60 dark:border-gray-800/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : step.status === 'in_progress' || isCurrent ? (
                              <NajeSpinner className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            )}
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {idx + 1}. {step.title}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            step.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            step.status === 'in_progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                            'bg-gray-100 text-gray-500 dark:bg-gray-800'
                          }`}>
                            {step.status === 'completed' ? 'مكتملة ومدققة' : step.status === 'in_progress' ? 'جاري النسج والتوليد...' : 'مجدولة'}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">{step.description}</p>

                        {/* Real-time Weaver Compiler HUD Banner */}
                        {(step.status === 'in_progress' || isCurrent) && (
                          <div className="mb-3 p-3.5 rounded-xl bg-purple-950/80 border border-purple-500/40 shadow-inner text-white space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                <span className="font-extrabold text-purple-300">محرك <span dir="ltr">Naje Agent Core</span> في وضع المعالجة الحية</span>
                              </div>
                              {liveProgress && liveProgress.totalFiles > 0 && (
                                <span className="text-[10px] font-mono font-bold bg-purple-900/80 px-2 py-0.5 rounded border border-purple-700">
                                  {liveProgress.completedFiles} / {liveProgress.totalFiles} ملفات
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-100">
                              <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                              <span>{executingStatusMessage || 'Naje Agent Core ينسج المعمارية البرمجية...'}</span>
                            </div>

                            {/* Active file glowing path indicator */}
                            {liveProgress?.activeFilePath && (
                              <div className="flex items-center gap-2 text-[11px] bg-black/40 px-2.5 py-1.5 rounded-lg border border-purple-500/20">
                                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-gray-400">الملف النشط:</span>
                                <span className="font-mono text-indigo-300 font-bold" dir="ltr">{liveProgress.activeFilePath}</span>
                              </div>
                            )}

                            {/* Progress bar */}
                            {liveProgress && liveProgress.totalFiles > 0 && (
                              <div className="w-full bg-purple-900/50 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-full transition-all duration-300"
                                  style={{ width: `${Math.round((liveProgress.completedFiles / liveProgress.totalFiles) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tool Calls Breakdown */}
                        {step.toolCalls && step.toolCalls.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                            {step.toolCalls.map((tc) => (
                              <div key={tc.id} className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-xl">
                                <div className="flex items-center gap-2">
                                  {tc.name === 'brand_identity' && <Palette className="w-3.5 h-3.5 text-amber-500" />}
                                  {tc.name === 'image_studio' && <ImageIcon className="w-3.5 h-3.5 text-purple-500" />}
                                  {tc.name === 'video_director' && <Film className="w-3.5 h-3.5 text-pink-500" />}
                                  {tc.name === 'voice_narration' && <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
                                  {tc.name === 'fullstack_engineer' && <Code2 className="w-3.5 h-3.5 text-blue-500" />}
                                  {tc.name === 'document_architect' && <FileText className="w-3.5 h-3.5 text-indigo-500" />}
                                  {tc.name === 'web_grounding' && <Sparkles className="w-3.5 h-3.5 text-cyan-500" />}
                                  <span className="font-bold text-gray-700 dark:text-gray-300">{tc.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">{tc.pointsCost} نقطة</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Audit Quality History */}
                {activeMission.auditHistory && activeMission.auditHistory.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      <Shield className="w-4 h-4" />
                      <span>سجل تدقيق الجودة والتحقق (Audit History)</span>
                    </div>
                    <div className="space-y-1.5">
                      {activeMission.auditHistory.map((audit, aIdx) => (
                        <div key={aIdx} className="text-[11px] bg-white/80 dark:bg-gray-900/60 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white">[{audit.stepTitle}]: </span>
                            <span className="text-gray-600 dark:text-gray-300">{audit.feedback}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Artifacts Canvas */}
        <div className="w-80 border-r border-gray-200/80 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-extrabold text-gray-900 dark:text-white">معرض المخرجات (Artifacts)</span>
            </div>
            {activeMission?.artifacts && (
              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full" title={`الحد الأقصى للإصدارات: ${MAX_VERSIONS_PER_ASSET}`}>
                {activeMission.artifacts.length}/{MAX_VERSIONS_PER_ASSET}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!activeMission || activeMission.artifacts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Layers className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400">ستظهر هنا المخرجات النهائية (المشروع البرمجي المنسوج، الشعار، الفيديو، التسجيل الصوتي، الكتيب) فور اكتمال خطوات <span dir="ltr">Naje Agent Core</span>.</p>
              </div>
            ) : (
              activeMission.artifacts.map((art) => (
                <div 
                  key={art.id}
                  onClick={() => { setSelectedArtifactPreview(art); setActiveFileIndex(0); setSelectedCodeTab('preview'); }}
                  className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-purple-300 shadow-sm cursor-pointer transition-all flex flex-col gap-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {art.type === 'code_project' && <Code2 className="w-4 h-4 text-blue-600" />}
                      {art.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-600" />}
                      {art.type === 'video' && <Film className="w-4 h-4 text-pink-600" />}
                      {art.type === 'audio' && <Volume2 className="w-4 h-4 text-emerald-600" />}
                      {art.type === 'pdf' && <FileText className="w-4 h-4 text-indigo-600" />}
                      {art.type === 'brand_palette' && <Palette className="w-4 h-4 text-amber-500" />}
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{art.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!activeMission) return;
                        const updated = toggleFavoriteVersion(activeMission.artifacts, art.id);
                        activeMission.artifacts = updated;
                        await updateDoc(doc(db, 'autonoma_missions', activeMission.id), {
                          artifacts: updated,
                          updatedAt: Date.now()
                        });
                        toast.success((art as any).isFavorite ? 'تم إزالة التثبيت' : 'تم تثبيت الإصدار لمنع الحذف التلقائي ⭐');
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        (art as any).isFavorite 
                          ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40' 
                          : 'text-gray-400 hover:text-amber-500 opacity-60 group-hover:opacity-100'
                      }`}
                      title={(art as any).isFavorite ? 'إصدار مثبت ومحمي من الحذف' : 'تثبيت الإصدار لحمايته من الحذف التلقائي'}
                    >
                      <Star className={`w-3.5 h-3.5 ${(art as any).isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {art.type === 'code_project' && (
                    <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-300 font-bold">
                        <span className="flex items-center gap-1"><FolderTree className="w-3 h-3" /> {art.files?.length || 1} ملفات برمجية</span>
                        <span className="bg-blue-200/60 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-[9px]">معاينة حية + ZIP</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{art.data?.projectDescription}</p>
                    </div>
                  )}

                  {art.type === 'image' && (art.previewUrl || art.url) && (
                    <div className="h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <img src={art.previewUrl || art.url} alt={art.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span>انقر للمعاينة الكاملة</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. Full Artifact Preview Modal */}
      {selectedArtifactPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  {selectedArtifactPreview.type === 'code_project' ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{selectedArtifactPreview.title}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">ID: {selectedArtifactPreview.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedArtifactPreview.type === 'code_project' && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedCodeTab('preview')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedCodeTab === 'preview' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <MonitorPlay className="w-3.5 h-3.5 inline ml-1" />
                      المعاينة التفاعلية
                    </button>
                    <button
                      onClick={() => setSelectedCodeTab('code')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        selectedCodeTab === 'code' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 inline ml-1" />
                      الأكواد والمحرر
                    </button>
                  </div>
                )}

                {selectedArtifactPreview.type === 'code_project' && (
                  <button
                    onClick={() => handleDownloadZip(selectedArtifactPreview)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    تحميل حزمة ZIP
                  </button>
                )}

                <button
                  onClick={() => setSelectedArtifactPreview(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
              
              {/* Fullstack Code Project Preview (Live Iframe vs Multi-File Code Pane) */}
              {selectedArtifactPreview.type === 'code_project' && (
                selectedCodeTab === 'preview' ? (
                  <div className="flex-1 h-[550px] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white">
                    <iframe
                      srcDoc={selectedArtifactPreview.data?.previewHtml || selectedArtifactPreview.files?.find(f => f.path === 'index.html')?.content || '<div class="p-8 font-sans">تطبيق الويب جاهز للمعاينة</div>'}
                      className="w-full h-full border-none"
                      title="Live Code Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex min-h-[500px] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-950 text-gray-200 font-mono text-xs">
                    {/* Files List */}
                    <div className="w-64 border-l border-gray-800 bg-gray-900/80 p-3 space-y-1 overflow-y-auto">
                      <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <span className="text-[10px] font-extrabold uppercase text-gray-400">ملفات المشروع</span>
                        <span className="text-[9px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                          {selectedArtifactPreview.files?.length || 0} ملفاً
                        </span>
                      </div>
                      {(selectedArtifactPreview.files || []).map((file, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => setActiveFileIndex(fIdx)}
                          className={`w-full text-right px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 truncate transition-colors ${
                            activeFileIndex === fIdx ? 'bg-purple-900/40 text-purple-300 border border-purple-800/60 shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <FileCode className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                            <span className="truncate text-xs font-mono" dir="ltr">{file.path}</span>
                          </div>
                          <span className="text-[9px] font-mono text-gray-500 uppercase px-1 rounded bg-gray-950/60 shrink-0">
                            {file.language || 'txt'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active File Editor/Viewer powered by NajeCodePane */}
                    <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
                      <NajeCodePane
                        code={selectedArtifactPreview.files?.[activeFileIndex]?.content || selectedArtifactPreview.data?.previewHtml || ''}
                        language={selectedArtifactPreview.files?.[activeFileIndex]?.language || 'typescript'}
                        fileName={selectedArtifactPreview.files?.[activeFileIndex]?.path || 'index.html'}
                        title={selectedArtifactPreview.files?.[activeFileIndex]?.path || 'الملف المصدري'}
                      />
                    </div>
                  </div>
                )
              )}

              {/* Text & Web Grounding Live Search Citations Preview */}
              {(selectedArtifactPreview.type === 'text' || selectedArtifactPreview.type === 'grounding_search') && (
                <div className="space-y-6 max-w-3xl mx-auto p-4">
                  <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">نتائج وتوصيات أبحاث السوق المباشرة</h3>
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedArtifactPreview.data?.analysis || selectedArtifactPreview.data?.text || ''}
                    </div>
                  </div>

                  {/* Google Search Live Citations Sources */}
                  {(selectedArtifactPreview.sources || selectedArtifactPreview.data?.sources) && (
                    <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 dark:text-indigo-300">
                        <ExternalLink className="w-4 h-4 text-indigo-600" />
                        <span>مصادر وتوثيقات Google Search الحية (Live Verified Citations):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(selectedArtifactPreview.sources || selectedArtifactPreview.data?.sources || []).map((source: any, sIdx: number) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200/60 dark:border-indigo-800/50 hover:border-indigo-500 flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-gray-200 hover:text-indigo-600 transition shadow-xs group"
                          >
                            <span className="truncate pr-2">{source.title || 'رابط المصدر المعتمد'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {selectedArtifactPreview.type === 'image' && (
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="max-h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
                    <img src={selectedArtifactPreview.previewUrl || selectedArtifactPreview.url} alt={selectedArtifactPreview.title} className="w-full h-full object-contain" />
                  </div>
                  {selectedArtifactPreview.data?.promptUsed && (
                    <div className="w-full max-w-xl p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-300 font-mono">
                      <span className="font-bold block text-gray-900 dark:text-white mb-1">Prompt Used:</span>
                      {selectedArtifactPreview.data.promptUsed}
                    </div>
                  )}
                </div>
              )}

              {/* Audio Voiceover Preview */}
              {selectedArtifactPreview.type === 'audio' && (
                <div className="p-8 flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <div className="w-full bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center space-y-2">
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium italic">
                      "{selectedArtifactPreview.data?.narrationText}"
                    </p>
                    <span className="text-[10px] text-gray-400 block">الصوت: {selectedArtifactPreview.data?.voice || 'Fenrir'}</span>
                  </div>
                  {selectedArtifactPreview.url && (
                    <audio controls className="w-full" src={selectedArtifactPreview.url} />
                  )}
                </div>
              )}

              {/* PDF Document Chapters Reader */}
              {selectedArtifactPreview.type === 'pdf' && (
                <div className="space-y-4 max-w-2xl mx-auto p-4">
                  <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">{selectedArtifactPreview.data?.docTitle}</h2>
                    {selectedArtifactPreview.data?.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{selectedArtifactPreview.data.subtitle}</p>
                    )}
                  </div>
                  <div className="space-y-6">
                    {selectedArtifactPreview.data?.chapters?.map((chap: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                        <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400">{chap.chapterTitle}</h4>
                        <div 
                          className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 space-y-2"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(chap.contentHtml) }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Palette */}
              {selectedArtifactPreview.type === 'brand_palette' && (
                <div className="space-y-6 max-w-xl mx-auto p-4">
                  <div className="text-center">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{selectedArtifactPreview.data?.brandName}</h2>
                    <p className="text-xs text-gray-500 mt-1">{selectedArtifactPreview.data?.vision}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedArtifactPreview.data?.colorPalette?.map((col: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center gap-2">
                        <div className="w-12 h-12 rounded-xl shadow-inner border border-black/10" style={{ backgroundColor: col.hex }} />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{col.name}</span>
                        <span className="text-[10px] font-mono text-gray-400">{col.hex}</span>
                        <span className="text-[9px] text-gray-500">{col.usage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
