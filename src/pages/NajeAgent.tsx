import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { db, auth } from '../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, 
  doc, deleteDoc, getDoc, getDocs, limit, setDoc 
} from 'firebase/firestore';
import { 
  Bot, Sparkles, Send, Play, CheckCircle2, Circle, AlertCircle, 
  Layers, Shield, Download, FileText, Image as ImageIcon, Film, 
  Palette, ArrowRight, RefreshCw, ChevronRight, ChevronLeft, Zap,
  ExternalLink, Eye, Check, X, Sparkle, Volume2, Mic, Code2, 
  FolderTree, FileCode, MonitorPlay, Copy, Archive, CheckCheck,
  MessageSquare, HelpCircle, ArrowUpRight, Cpu, Wrench, Star,
  PanelRight, Upload, Paperclip, Link2, Plus, Trash2, BookOpen,
  FolderOpen, FileSpreadsheet, Share2, Tag, Megaphone, CheckSquare
} from 'lucide-react';
import NajeSpinner from '../components/NajeSpinner';
import BalanceTopDropdown from '../components/BalanceTopDropdown';
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

export interface AgentSourceItem {
  id: string;
  title: string;
  type: 'file' | 'image' | 'link' | 'text';
  content?: string;
  url?: string;
  previewUrl?: string;
  size?: number;
  addedAt: number;
}

function sanitizeHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/data\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
    .replace(/action\s*=\s*["']?\s*javascript:[^"'>]*/gi, '');
}

const INITIAL_GREETING: AgentChatMessage = {
  id: 'msg_welcome',
  role: 'model',
  type: 'reply',
  content: 'أهلاً بك! أنا وكيل ناجي (Naje Agent) — نظام الوكلاء المتعددين لبناء الهوية البصرية، صياغة الإعلانات، وهندسة المشاريع المتكاملة. يمكنك رفع ملفاتك ومصادرك في تبويب "المصادر" ليعتمد عليها وكيل الهوية ووكيل الإعلانات مباشرة أثناء بناء مشروعك. صف فكرتك وسنتولى التخطيط والتنفيذ خطوة بخطوة.',
  timestamp: Date.now()
};

const SUGGESTED_PROMPTS = [
  'ابنِ لي هوية بصرية كاملة مع إعلانات سوشيال ميديا وفيديو ترويجي لمتجري',
  'حلل مصادر مشروعي وأنشئ لوحة الألوان والشعار مع حملة إعلانات إطلاق',
  'اصنع إعلان فيديو سينمائي مع سيناريو وتعليق صوتي فخم لمنتجي',
  'بناء موقع تجارة إلكترونية كامل مع هوية البراند وتصاميم الإعلانات'
];

const getAgentMeta = (toolName: string) => {
  switch (toolName) {
    case 'brand_identity':
    case 'graphic_designer':
      return { name: 'وكيل الهوية', icon: Palette };
    case 'marketing_copywriter':
    case 'ad_creator':
      return { name: 'وكيل الإعلانات', icon: Megaphone };
    case 'video_director':
    case 'voiceover_producer':
      return { name: 'وكيل الفيديو', icon: Film };
    case 'fullstack_engineer':
      return { name: 'وكيل الأنظمة', icon: Code2 };
    default:
      return { name: 'وكيل ناجي', icon: Bot };
  }
};

export default function NajeAgent() {
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get('chatId');

  // Active top navigation tab: الدردشة / النتائج / المصادر
  const [tab, setTab] = useState<'chat' | 'results' | 'sources'>('chat');

  // Mission & Chat state
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [activeMission, setActiveMission] = useState<AgentMission | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AgentPlanProposal | null>(null);
  const [showAgentPaywall, setShowAgentPaywall] = useState(false);

  // Sources state (المصادر)
  const [sources, setSources] = useState<AgentSourceItem[]>([]);
  const [addingSourceType, setAddingSourceType] = useState<'file' | 'image' | 'link' | 'text' | null>(null);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceFileUploading, setSourceFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executingStatusMessage, setExecutingStatusMessage] = useState<string>('');
  const [liveProgress, setLiveProgress] = useState<FullstackBuildProgress | null>(null);
  const [selectedArtifactPreview, setSelectedArtifactPreview] = useState<AgentArtifact | null>(null);
  const [selectedCodeTab, setSelectedCodeTab] = useState<'preview' | 'code'>('preview');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [resultsFilter, setResultsFilter] = useState<'all' | 'brand' | 'ads' | 'video' | 'audio' | 'code' | 'docs'>('all');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingChat]);

  // Sync Chat Session and Sources with Firestore
  useEffect(() => {
    if (!user) return;
    let active = true;

    const syncChatSession = async () => {
      try {
        if (chatId) {
          const chatDocSnap = await getDoc(doc(db, 'chats', chatId));
          if (chatDocSnap.exists()) {
            const data = chatDocSnap.data();
            if (Array.isArray(data.sources)) {
              setSources(data.sources);
            }
            if (data.missionId && !activeMission) {
              const mSnap = await getDoc(doc(db, 'autonoma_missions', data.missionId));
              if (mSnap.exists() && active) {
                setActiveMission({ id: mSnap.id, ...mSnap.data() } as AgentMission);
              }
            }
          }
        } else {
          // Find latest agent chat or create one
          const q = query(
            collection(db, 'chats'),
            where('ownerId', '==', user.uid),
            where('type', '==', 'agent'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!active) return;
          if (!snap.empty) {
            const latest = snap.docs[0];
            setSearchParams({ chatId: latest.id }, { replace: true });
            const data = latest.data();
            if (Array.isArray(data.sources)) {
              setSources(data.sources);
            }
          } else {
            const newRef = doc(collection(db, 'chats'));
            await setDoc(newRef, {
              ownerId: user.uid,
              type: 'agent',
              title: 'مساحة وكيل ناجي',
              createdAt: Date.now(),
              sources: []
            });
            if (!active) return;
            setSearchParams({ chatId: newRef.id }, { replace: true });
          }
        }
      } catch (err) {
        console.warn('Error syncing agent chat session:', err);
      }
    };

    syncChatSession();
    return () => { active = false; };
  }, [user, chatId]);

  // Save sources to Firestore when modified
  const updateSources = async (newSources: AgentSourceItem[]) => {
    setSources(newSources);
    if (chatId) {
      try {
        await updateDoc(doc(db, 'chats', chatId), {
          sources: newSources,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn('Error saving sources:', e);
      }
    }
  };

  // Add a new source handler
  const handleAddSource = (item: Omit<AgentSourceItem, 'id' | 'addedAt'>) => {
    const newItem: AgentSourceItem = {
      id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...item,
      addedAt: Date.now()
    };
    const updated = [newItem, ...sources];
    updateSources(updated);
    setAddingSourceType(null);
    setSourceTitle('');
    setSourceContent('');
    setSourceUrl('');
    toast.success('تمت إضافة المصدر بنجاح! سيتم اعتماده بواسطة الوكلاء.');
  };

  // Handle file upload to sources
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isImage = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFileUploading(true);
    const reader = new FileReader();

    if (isImage) {
      reader.onload = () => {
        const result = reader.result as string;
        handleAddSource({
          title: file.name,
          type: 'image',
          previewUrl: result,
          content: `صورة مرجعية: ${file.name} (حجم: ${(file.size / 1024).toFixed(1)} KB)`,
          size: file.size
        });
        setSourceFileUploading(false);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        handleAddSource({
          title: file.name,
          type: 'file',
          content: text.slice(0, 10000), // Ingest content snippet
          size: file.size
        });
        setSourceFileUploading(false);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Delete source
  const handleDeleteSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    updateSources(updated);
    toast.success('تم حذف المصدر.');
  };

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
      type: 'reply',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsSendingChat(true);

    // Update chat title in recent chats
    if (chatId) {
      updateDoc(doc(db, 'chats', chatId), {
        title: text.length > 28 ? `وكيل ناجي: ${text.slice(0, 28)}...` : `وكيل ناجي: ${text}`,
        updatedAt: Date.now()
      }).catch(() => {});
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error('يجب تسجيل الدخول لاستخدام وكيل ناجي.');
        setIsSendingChat(false);
        return;
      }

      // Pack project sources and multi-agent context
      const projectContext = {
        sources: sources.map(s => ({
          title: s.title,
          type: s.type,
          snippet: s.content ? s.content.slice(0, 1000) : (s.url || 'مرفق وسائط/ملف')
        })),
        sourceCount: sources.length,
        orchestrationSystem: 'Multi-Agent Orchestra (Brand Identity Agent, Advertising & Campaign Agent, Video & Script Director, Graphic Designer, Fullstack Engineer)',
        missionFocus: 'بناء الهوية البصرية المتكاملة، صياغة الإعلانات التسويقية، وتوليد المشاريع بالاعتماد الوثيق على مصادر المشروع المرفوعة'
      };

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
          })),
          projectContext
        })
      });

      if (!res.ok) {
        throw new Error('تعذر التواصل مع خادم وكيل ناجي حالياً.');
      }

      const turnData = await res.json();
      const turn: AgentChatTurnResponse = turnData.turn || turnData.result;

      if (turnData.success && turn) {
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

      if (chatId) {
        await updateDoc(doc(db, 'chats', chatId), {
          missionId: docRef.id,
          title: proposal.missionTitle,
          updatedAt: Date.now()
        });
      }

      toast.success('تم إنشاء خطة العمل بنجاح! انقر على "بدء التنفيذ المستقل" لبدء توليد المخرجات.');
    } catch (err: any) {
      console.error('Error approving proposal:', err);
      toast.error('تعذر حفظ الخطة، حاول ثانية.');
    }
  };

  // Start Autonomous Execution Loop
  const handleRunMission = async () => {
    if (!activeMission || isExecuting) return;

    if (!hasFeatureAccess(user, 'najeAgent')) {
      setShowAgentPaywall(true);
      return;
    }

    setIsExecuting(true);
    const missionRef = doc(db, 'autonoma_missions', activeMission.id);
    await updateDoc(missionRef, { status: 'executing', updatedAt: Date.now() });

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Auth token required');

      let accumulatedBrand = activeMission.brandContext || {};
      let missionArtifacts = [...(activeMission.artifacts || [])];
      let consumed = activeMission.consumedPoints || 0;

      for (let sIdx = 0; sIdx < activeMission.steps.length; sIdx++) {
        setCurrentStepIndex(sIdx);
        const step = activeMission.steps[sIdx];

        step.status = 'in_progress';
        await updateDoc(missionRef, { steps: activeMission.steps, updatedAt: Date.now() });

        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            tc.status = 'running';
            await updateDoc(missionRef, { steps: activeMission.steps, updatedAt: Date.now() });

            // Streaming handler for code projects
            if (tc.name === 'fullstack_engineer') {
              setExecutingStatusMessage(`جاري نسج وبناء المشروع البرمجي مع وكيل الأنظمة...`);
              const streamRes = await fetch('/api/agent/execute-tool-stream', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  toolName: tc.name,
                  inputParams: { ...tc.input, brandContext: accumulatedBrand, sources },
                  brandContext: accumulatedBrand
                })
              });

              if (!streamRes.ok) {
                const errData = await streamRes.json().catch(() => ({}));
                throw new Error(errData.error || 'فشل تشغيل مهندس الأنظمة المستقل.');
              }

              const reader = streamRes.body?.getReader();
              const decoder = new TextDecoder();
              let streamBuffer = '';

              if (reader) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  streamBuffer += decoder.decode(value, { stream: true });
                  const lines = streamBuffer.split('\n\n');
                  streamBuffer = lines.pop() || '';

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const event = JSON.parse(line.slice(6));
                        if (event.type === 'progress') {
                          setLiveProgress(event.progress);
                          if (event.statusMessage) setExecutingStatusMessage(event.statusMessage);
                        } else if (event.type === 'complete') {
                          tc.status = 'completed';
                          tc.output = event.output;
                          consumed += tc.pointsCost;

                          if (event.artifacts && Array.isArray(event.artifacts)) {
                            for (const art of event.artifacts) {
                              missionArtifacts = applyVersionCap(missionArtifacts, art).updatedVersions;
                            }
                          }
                          setLiveProgress(null);
                        } else if (event.type === 'error') {
                          throw new Error(event.error || 'حدث خطأ أثناء نسج الملفات.');
                        }
                      } catch (parseErr) {
                        console.warn('SSE Parse error:', parseErr);
                      }
                    }
                  }
                }
              }
            } else {
              setExecutingStatusMessage(`جاري تنفيذ: ${tc.title}...`);
              const execRes = await fetch('/api/agent/execute-tool', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  toolName: tc.name,
                  inputParams: { ...tc.input, brandContext: accumulatedBrand, sources },
                  brandContext: accumulatedBrand
                })
              });

              if (!execRes.ok) {
                const errData = await execRes.json().catch(() => ({}));
                throw new Error(errData.error || `فشل تشغيل أداة ${tc.title}`);
              }

              const execData = await execRes.json();
              tc.status = 'completed';
              tc.output = execData.output;
              consumed += tc.pointsCost;

              if (tc.name === 'brand_identity' && execData.output?.palette) {
                accumulatedBrand = { ...accumulatedBrand, ...execData.output };
              }

              if (execData.artifacts && Array.isArray(execData.artifacts)) {
                for (const art of execData.artifacts) {
                  missionArtifacts = applyVersionCap(missionArtifacts, art).updatedVersions;
                }
              }
            }

            await updateDoc(missionRef, {
              steps: activeMission.steps,
              artifacts: missionArtifacts,
              consumedPoints: consumed,
              brandContext: accumulatedBrand,
              updatedAt: Date.now()
            });
          }
        }

        step.status = 'completed';
        await updateDoc(missionRef, { steps: activeMission.steps, updatedAt: Date.now() });
      }

      await updateDoc(missionRef, {
        status: 'completed',
        consumedPoints: consumed,
        updatedAt: Date.now()
      });

      toast.success('اكتملت المهمة بنجاح! تم بناء الهوية والإعلانات والمخرجات، يمكنك معاينتها في تبويب "النتائج".');
      setTab('results');
    } catch (err: any) {
      console.error('Execution error:', err);
      toast.error(err.message || 'توقف التنفيذ بسبب خطأ.');
      await updateDoc(missionRef, { status: 'failed', updatedAt: Date.now() });
    } finally {
      setIsExecuting(false);
      setExecutingStatusMessage('');
      setLiveProgress(null);
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

  // Filtered artifacts
  const allArtifacts = activeMission?.artifacts || [];
  const filteredArtifacts = allArtifacts.filter(art => {
    if (resultsFilter === 'all') return true;
    if (resultsFilter === 'brand') return art.type === 'brand_palette' || art.type === 'image';
    if (resultsFilter === 'ads') return art.type === 'image' || art.type === 'document';
    if (resultsFilter === 'video') return art.type === 'video';
    if (resultsFilter === 'audio') return art.type === 'audio';
    if (resultsFilter === 'code') return art.type === 'code_project';
    if (resultsFilter === 'docs') return art.type === 'pdf' || art.type === 'document';
    return true;
  });

  // Active agents status: displays ONLY when agents are actually executing a task
  const isAnyAgentWorking = isExecuting || (activeMission?.status === 'executing');
  
  const currentRunningTools = activeMission && currentStepIndex >= 0 && activeMission.steps[currentStepIndex]
    ? (activeMission.steps[currentStepIndex].toolCalls?.filter(tc => tc.status === 'running') || [])
    : [];

  const activeAgentNames = currentRunningTools.length > 0
    ? Array.from(new Set(currentRunningTools.map(tc => getAgentMeta(tc.name).name)))
    : (isAnyAgentWorking ? ['وكيل ناجي'] : []);

  const activeAgentsCount = Math.max(activeAgentNames.length, 1);
  const ActiveAgentIcon = currentRunningTools.length > 0 
    ? getAgentMeta(currentRunningTools[0].name).icon 
    : Bot;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9FC] dark:bg-[#0a0c10] text-slate-800 dark:text-slate-200 overflow-hidden font-sans" dir="rtl">
      <FeaturePaywallModal
        isOpen={showAgentPaywall}
        onClose={() => setShowAgentPaywall(false)}
        feature="najeAgent"
      />

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFileUpload(e, false)} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt,.json,.md,.csv" 
      />
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={(e) => handleFileUpload(e, true)} 
        className="hidden" 
        accept="image/*" 
      />
      <input 
        type="file" 
        ref={chatAttachmentInputRef} 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const isImg = file.type.startsWith('image/');
            handleFileUpload(e, isImg);
            setInputText(prev => prev ? `${prev}\n(تم إرفاق المصدر: ${file.name})` : `اعتمد على المصدر المرفوع (${file.name}) لبناء الهوية والحملة الإعلانية.`);
          }
        }} 
        className="hidden" 
      />

      {/* ========================================================= */}
      {/* 1. Header: Sidebar Toggle, Title, 3 Tabs, Balance Dropdown */}
      {/* ========================================================= */}
      <div className="h-14 sm:h-16 px-3 sm:px-5 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-[#0f1218]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        {/* Right side: Sidebar toggle and Brand title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition cursor-pointer"
            title={sidebarOpen ? "إخفاء القائمة الجانبية" : "إظهار القائمة الجانبية"}
            aria-label="تبديل القائمة الجانبية"
          >
            <PanelRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                وكيل ناجي · نظام الوكلاء المتعددين
              </h1>
              <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Agent Pro
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
              بناء الهوية البصرية وصياغة الإعلانات والمشاريع المتكاملة من مصادرك
            </p>
          </div>
        </div>

        {/* Left side: The 3 Requested Tab Buttons + Balance Dropdown */}
        <div className="flex items-center gap-2">
          {/* Segmented 3-Tab Control: الدردشة / النتائج / المصادر */}
          <div className="bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl flex items-center gap-1 border border-gray-200/80 dark:border-gray-800">
            {/* 1. الدردشة */}
            <button
              onClick={() => setTab('chat')}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 relative ${
                tab === 'chat' 
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="الدردشة"
              aria-label="الدردشة"
            >
              <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* 2. النتائج */}
            <button
              onClick={() => setTab('results')}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 relative ${
                tab === 'results' 
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="النتائج"
              aria-label="النتائج"
            >
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {allArtifacts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  {allArtifacts.length}
                </span>
              )}
            </button>

            {/* 3. المصادر */}
            <button
              onClick={() => setTab('sources')}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 relative ${
                tab === 'sources' 
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="المصادر"
              aria-label="المصادر"
            >
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {sources.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  {sources.length}
                </span>
              )}
            </button>
          </div>

          <BalanceTopDropdown />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. Main Content Body according to the Active Tab          */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">

        {/* --------------------------------------------------------- */}
        {/* TAB 1: الدردشة (Chat & Multi-Agent Workstation)           */}
        {/* --------------------------------------------------------- */}
        {tab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white shadow-sm'
                  }`}>
                    {msg.role === 'user' ? 'أنت' : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div className="space-y-3 min-w-0 max-w-[90%] sm:max-w-[85%]">
                    {msg.content && (
                      <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white shadow-sm rounded-tr-sm'
                          : 'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm text-gray-800 dark:text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    )}

                    {/* Clarification Question Card */}
                    {msg.question && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 font-extrabold">
                          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>سؤال استيضاحي من الوكيل:</span>
                        </div>
                        <p className="leading-relaxed">{msg.question}</p>
                        {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                            {msg.suggestedQuickReplies.map((reply, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleSendMessage(reply)}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                              >
                                {reply}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mission Proposal Card */}
                    {msg.proposal && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 to-indigo-50/70 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 shadow-md space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                                {msg.proposal.missionTitle}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                              {msg.proposal.planSummary}
                            </p>
                          </div>
                          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-600 text-white shadow-sm shrink-0">
                            {msg.proposal.totalEstimatedPoints} نقطة
                          </span>
                        </div>

                        {/* Proposed Steps */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">مراحل التنفيذ المقترحة:</span>
                          {msg.proposal.steps.map((st, sIdx) => (
                            <div key={sIdx} className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-xl border border-gray-200/60 dark:border-gray-800/60 text-xs">
                              <div className="font-bold text-gray-800 dark:text-gray-200">{st.title}</div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{st.description}</p>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleApproveProposal(msg.proposal!)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition cursor-pointer flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>اعتماد الخطة والبدء</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Realtime Execution HUD if mission is active */}
              {activeMission && (
                <div className="my-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-800/80 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {activeMission.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeMission.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        activeMission.status === 'executing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      }`}>
                        {activeMission.status === 'completed' ? 'مكتملة' : activeMission.status === 'executing' ? 'قيد المعالجة' : 'بانتظار الإطلاق'}
                      </span>
                    </div>

                    {activeMission.status !== 'executing' && activeMission.status !== 'completed' && (
                      <button
                        onClick={handleRunMission}
                        disabled={isExecuting}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>تشغيل المهام الآن</span>
                      </button>
                    )}

                    {activeMission.status === 'completed' && (
                      <button
                        onClick={() => setTab('results')}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>معاينة النتائج</span>
                      </button>
                    )}
                  </div>

                  {/* Steps status */}
                  <div className="space-y-2">
                    {activeMission.steps.map((st, idx) => (
                      <div key={st.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                          {st.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                           st.status === 'in_progress' ? <NajeSpinner className="w-4 h-4 text-amber-500" /> :
                           <Circle className="w-4 h-4 text-gray-400" />}
                          <span className="font-bold text-gray-800 dark:text-gray-200">{st.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{st.toolCalls?.length || 0} أدوات</span>
                      </div>
                    ))}
                  </div>

                  {isExecuting && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <NajeSpinner className="w-4 h-4" />
                      <span>{executingStatusMessage || 'وكلاء ناجي يعملون على معالجة الخطوات بالتتابع...'}</span>
                    </div>
                  )}
                </div>
              )}

              {isSendingChat && (
                <div className="flex gap-3 max-w-2xl ml-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <NajeSpinner className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>وكيل ناجي يقرأ مصادرك ويهندس الاستجابة...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggested Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-gray-100 dark:border-gray-800/60 bg-white/20 dark:bg-gray-900/20">
                {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:text-purple-600 transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-[#0f1218]/90 backdrop-blur-md">
              <div className="max-w-4xl mx-auto space-y-2">
                {/* Active Agent Working Indicator: Appears ONLY when agent is actually working */}
                {isAnyAgentWorking && (
                  <div className="flex items-center justify-start animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/80 shadow-xs text-xs font-bold text-purple-700 dark:text-purple-300">
                      <div className="relative flex items-center justify-center">
                        <ActiveAgentIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <span>
                        {activeAgentsCount === 1 ? '1 وكيل شغال' : `${activeAgentsCount} وكلاء شغالين`}
                      </span>
                      {activeAgentNames.length > 0 && (
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-white/80 dark:bg-gray-900/60 px-2 py-0.5 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                          {activeAgentNames.join(' · ')}
                        </span>
                      )}
                      {executingStatusMessage && (
                        <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400 hidden sm:inline max-w-xs truncate">
                          ({executingStatusMessage})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex items-center gap-2"
                >
                  {/* Direct Attachment Button (Adds directly to Sources) */}
                  <button
                    type="button"
                    onClick={() => chatAttachmentInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
                    title="إرفاق ملف أو صورة لمصادر المشروع"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={sources.length > 0 ? "صف فكرتك وسيعتمد الوكلاء على مصادرك المرفوعة..." : "صف مشروعك لبناء الهوية والإعلانات (أو ارفع مصادرك أولاً)..."}
                    disabled={isSendingChat}
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSendingChat}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isSendingChat ? <NajeSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    <span className="hidden sm:inline">إرسال</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 2: النتائج (Results & Deliverables)                   */}
        {/* --------------------------------------------------------- */}
        {tab === 'results' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Header & Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-gray-800">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>معرض النتائج والمخرجات</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  كافة الشعارات، الإعلانات، الفيديوهات، الأكواد، والكتيبات التي صنعها نظام الوكلاء
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'brand', label: 'الهوية والشعار' },
                  { id: 'ads', label: 'الإعلانات' },
                  { id: 'video', label: 'فيديو' },
                  { id: 'audio', label: 'صوتيات' },
                  { id: 'code', label: 'أنظمة وأكواد' },
                  { id: 'docs', label: 'كتيبات' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setResultsFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      resultsFilter === f.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredArtifacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                  <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                    لم يتم توليد نتائج بعد
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mt-1 mb-4 leading-relaxed">
                    ابدأ محادثة في تبويب "الدردشة" واطلب من الوكلاء بناء الهوية البصرية أو صياغة الإعلانات، وستظهر كافة النتائج والمخرجات فور اكتمالها هنا.
                  </p>
                  <button
                    onClick={() => setTab('chat')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>بدء مهمة في الدردشة</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArtifacts.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => { setSelectedArtifactPreview(art); setActiveFileIndex(0); setSelectedCodeTab('preview'); }}
                      className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-purple-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {art.type === 'code_project' && <Code2 className="w-4 h-4 text-blue-600" />}
                            {art.type === 'image' && <ImageIcon className="w-4 h-4 text-purple-600" />}
                            {art.type === 'video' && <Film className="w-4 h-4 text-pink-600" />}
                            {art.type === 'audio' && <Volume2 className="w-4 h-4 text-emerald-600" />}
                            {art.type === 'pdf' && <FileText className="w-4 h-4 text-indigo-600" />}
                            {art.type === 'brand_palette' && <Palette className="w-4 h-4 text-amber-500" />}
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate max-w-[170px]">
                              {art.title}
                            </span>
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
                              toast.success((art as any).isFavorite ? 'تم إزالة التثبيت' : 'تم تثبيت المخرج وحمايته ⭐');
                            }}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              (art as any).isFavorite ? 'text-amber-500' : 'text-gray-400 opacity-60 group-hover:opacity-100'
                            }`}
                            title="تثبيت"
                          >
                            <Star className={`w-4 h-4 ${(art as any).isFavorite ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>

                        {/* Thumbnail / Visual representation */}
                        {art.type === 'image' && art.url && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img src={art.url} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                        )}

                        {art.type === 'video' && art.url && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                            <video src={art.url} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {art.type === 'brand_palette' && art.data?.palette && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5">
                              {Object.entries(art.data.palette).slice(0, 5).map(([k, hex]: any) => (
                                <div key={k} className="h-6 flex-1 rounded-md" style={{ backgroundColor: hex }} title={`${k}: ${hex}`} />
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">{art.data.name || 'لوحة الألوان المعتمدة'}</p>
                          </div>
                        )}

                        {art.type === 'code_project' && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold block">
                              {art.files?.length || 1} ملفات برمجية منسوجة
                            </span>
                            <span className="text-[10px] text-gray-500 block">جاهز للمعاينة الحية والتحميل كـ ZIP</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs mt-3">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(art.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                        <div className="flex items-center gap-2">
                          {art.type === 'code_project' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadZip(art); }}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
                              title="تحميل ZIP"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-purple-600 font-bold text-[11px] flex items-center gap-1">
                            <span>معاينة</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 3: المصادر (Project Sources & Assets)                 */}
        {/* --------------------------------------------------------- */}
        {tab === 'sources' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Header banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-purple-500/5 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                    المصادر المرجعية للمشروع
                  </h2>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  أي مصدر ترفعه هنا (شعارك الحالي، صور منتجاتك، ملفات ومستندات، روابط، أو موجز مكتوب) يقرأه وكلاء ناجي تلقائياً: يبني وكيل الهوية البصرية الشعار والألوان بناءً عليه، ويصنع وكيل الإعلانات حملتك التسويقية المتناغمة معه.
                </p>
              </div>

              {/* Add actions dropdown / buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sourceFileUploading}
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-400 rounded-xl text-xs font-bold text-gray-800 dark:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رفع مستند</span>
                </button>

                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={sourceFileUploading}
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 rounded-xl text-xs font-bold text-gray-800 dark:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>رفع صورة أو شعار</span>
                </button>

                <button
                  onClick={() => setAddingSourceType('link')}
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-sky-400 rounded-xl text-xs font-bold text-gray-800 dark:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Link2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>إضافة رابط</span>
                </button>

                <button
                  onClick={() => setAddingSourceType('text')}
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-amber-400 rounded-xl text-xs font-bold text-gray-800 dark:text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>كتابة موجز</span>
                </button>
              </div>
            </div>

            {/* Modal / Inline form for Link or Text Source */}
            {addingSourceType && (
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">
                    {addingSourceType === 'link' ? 'إضافة رابط أو موقع مرجعي' : 'كتابة موجز نصي لعلامتك التجارية'}
                  </h3>
                  <button onClick={() => setAddingSourceType(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="عنوان المصدر (مثال: موقع المنافس، أو موجز الرؤية)..."
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />

                {addingSourceType === 'link' ? (
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                  />
                ) : (
                  <textarea
                    rows={3}
                    placeholder="اكتب تفاصيل هوية مشروعك، الألوان المفضلة، الجمهور المستهدف، أو نص الإعلان المرغوب..."
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-900 dark:text-white"
                  />
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAddingSourceType(null)}
                    className="px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:bg-gray-100"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (!sourceTitle.trim()) {
                        toast.error('يرجى كتابة عنوان للمصدر');
                        return;
                      }
                      handleAddSource({
                        title: sourceTitle,
                        type: addingSourceType,
                        url: sourceUrl || undefined,
                        content: sourceContent || undefined
                      });
                    }}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
                  >
                    حفظ المصدر
                  </button>
                </div>
              </div>
            )}

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {sources.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/40 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                    لا توجد مصادر مرفوعة بعد
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mt-1 mb-4 leading-relaxed">
                    قم برفع ملفات PDF، صور الشعار أو المنتجات، أو روابط المواقع التي ترغب أن يستلهم منها وكيل الهوية البصرية ووكيل الإعلانات.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>رفع أول مصدر الآن</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sources.map((src) => (
                    <div
                      key={src.id}
                      className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-emerald-300 transition flex flex-col justify-between group shadow-sm"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              {src.type === 'file' && <FileText className="w-4 h-4" />}
                              {src.type === 'image' && <ImageIcon className="w-4 h-4" />}
                              {src.type === 'link' && <Link2 className="w-4 h-4" />}
                              {src.type === 'text' && <FileSpreadsheet className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                                {src.title}
                              </h4>
                              <span className="text-[10px] text-gray-400">
                                {src.type === 'file' ? 'مستند مرجعي' :
                                 src.type === 'image' ? 'صورة / شعار' :
                                 src.type === 'link' ? 'رابط خارجي' : 'موجز نصي'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="حذف المصدر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Image Preview Thumbnail if type is image */}
                        {src.previewUrl && (
                          <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img src={src.previewUrl} alt={src.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Content Snippet */}
                        {src.content && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-3 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl leading-relaxed">
                            {src.content}
                          </p>
                        )}

                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{src.url}</span>
                          </a>
                        )}
                      </div>

                      <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400">
                        <span>{new Date(src.addedAt).toLocaleDateString('ar-EG')}</span>
                        <span className="text-emerald-600 font-bold">معتمد لدى الوكلاء ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA bar to start chat with these sources */}
            {sources.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="text-center sm:text-right">
                  <span className="text-xs font-extrabold block">جاهز للبدء؟ تم ربط {sources.length} مصادر</span>
                  <span className="text-[11px] text-purple-100 opacity-90">سيعتمد وكيل الهوية ووكيل الإعلانات على هذه المصادر مباشرة.</span>
                </div>
                <button
                  onClick={() => {
                    setTab('chat');
                    handleSendMessage(`اعتمد على مصادر المشروع المرفوعة (${sources.map(s => s.title).join('، ')})، وابدأ نظام الوكلاء لبناء الهوية البصرية الكاملة وصياغة الإعلانات وسيناريو الحملة التسويقية.`);
                  }}
                  className="px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-extrabold shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>بدء بناء الهوية والحملة الإعلانية من المصادر</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. Full Artifact Preview Modal (Code, Palette, Video, Audio) */}
      {/* ========================================================= */}
      {selectedArtifactPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {selectedArtifactPreview.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedArtifactPreview.type === 'code_project' && (
                  <button
                    onClick={() => handleDownloadZip(selectedArtifactPreview)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل ZIP</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedArtifactPreview(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {selectedArtifactPreview.type === 'code_project' && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                    <button
                      onClick={() => setSelectedCodeTab('preview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedCodeTab === 'preview' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                    >
                      معاينة حية
                    </button>
                    <button
                      onClick={() => setSelectedCodeTab('code')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedCodeTab === 'code' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                    >
                      استعراض الأكواد ({selectedArtifactPreview.files?.length || 0})
                    </button>
                  </div>

                  {selectedCodeTab === 'preview' ? (
                    <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <iframe
                        srcDoc={selectedArtifactPreview.data?.previewHtml || sanitizeHtmlContent(selectedArtifactPreview.files?.find(f => f.path.endsWith('.html'))?.content || '')}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex min-h-0 overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl">
                      <div className="w-56 border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-2 space-y-1">
                        {selectedArtifactPreview.files?.map((f, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => setActiveFileIndex(fIdx)}
                            className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono truncate block ${activeFileIndex === fIdx ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            dir="ltr"
                          >
                            {f.path}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 overflow-auto bg-gray-950 p-4 text-xs font-mono text-gray-200" dir="ltr">
                        <pre>{selectedArtifactPreview.files?.[activeFileIndex]?.content}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedArtifactPreview.type === 'image' && selectedArtifactPreview.url && (
                <div className="h-full flex items-center justify-center p-4">
                  <img src={selectedArtifactPreview.url} alt={selectedArtifactPreview.title} className="max-h-full max-w-full rounded-2xl shadow-lg object-contain" />
                </div>
              )}

              {selectedArtifactPreview.type === 'video' && selectedArtifactPreview.url && (
                <div className="h-full flex items-center justify-center p-4 bg-black rounded-2xl">
                  <video src={selectedArtifactPreview.url} controls className="max-h-full max-w-full rounded-xl" autoPlay />
                </div>
              )}

              {selectedArtifactPreview.type === 'brand_palette' && (
                <div className="p-6 space-y-6 max-w-2xl mx-auto">
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">دليل ألوان الهوية البصرية المعتمدة</h4>
                  {selectedArtifactPreview.data?.palette && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(selectedArtifactPreview.data.palette).map(([k, hex]: any) => (
                        <div key={k} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
                          <div className="h-16 rounded-lg shadow-sm" style={{ backgroundColor: hex }} />
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-gray-500">{k}</span>
                            <span className="font-bold text-gray-900 dark:text-white">{hex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedArtifactPreview.data?.typography && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs space-y-2">
                      <span className="font-bold text-gray-900 dark:text-white block">الخطوط والطباعة:</span>
                      <p className="text-gray-600 dark:text-gray-300">{JSON.stringify(selectedArtifactPreview.data.typography)}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedArtifactPreview.type === 'audio' && selectedArtifactPreview.url && (
                <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                  <Volume2 className="w-16 h-16 text-emerald-600" />
                  <audio src={selectedArtifactPreview.url} controls className="w-full max-w-md" />
                </div>
              )}

              {selectedArtifactPreview.type === 'pdf' && (
                <div className="p-6 space-y-4 max-w-3xl mx-auto">
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">{selectedArtifactPreview.title}</h4>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                    {selectedArtifactPreview.data?.content || 'محتوى الوثيقة الاستراتيجية...'}
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
