import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, getDocs, onSnapshot, doc, getDoc 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { UserData, ChatSession, Message } from '../../types';
import { 
  MessageSquare, User, Search, Filter, Calendar, ArrowRight, 
  Film, Image as ImageIcon, FileText, Mic, Layers, Bot, AlertCircle,
  Eye, Volume2, Code, ShieldCheck, Download, ExternalLink, Play,
  Smartphone, Monitor, Maximize2, X, Copy, Check, Sparkles, Cpu, Layers3
} from 'lucide-react';
import { toast } from '../../toastStore';
import NajeUiPreview from '../NajeUiPreview';

function parseUiMessage(content: string | undefined): { chatText: string; html: string; hasHtml: boolean } {
  if (!content) return { chatText: '', html: '', hasHtml: false };
  let text = content.trim();

  const fenceMatch = text.match(/```html?\s*([\s\S]*?)(?:```|$)/i);
  if (fenceMatch) {
    const htmlPart = fenceMatch[1].trim();
    const fenceIndex = text.indexOf('```');
    const chatText = text.slice(0, fenceIndex).trim();
    return { chatText, html: htmlPart, hasHtml: htmlPart.length > 0 };
  }

  const htmlStartMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*|<html[\s\S]*)/i);
  if (htmlStartMatch && htmlStartMatch.index !== undefined) {
    const chatText = text.slice(0, htmlStartMatch.index).trim();
    let htmlPart = htmlStartMatch[1].trim();
    const endMatch = htmlPart.match(/([\s\S]*?<\/html>)/i);
    if (endMatch) {
      htmlPart = endMatch[1].trim();
    }
    return { chatText, html: htmlPart, hasHtml: htmlPart.length > 0 };
  }

  return { chatText: text, html: '', hasHtml: false };
}

function isUiDocument(content: string | undefined): boolean {
  if (!content) return false;
  return parseUiMessage(content).hasHtml;
}

class MessageErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('[AdminUserChats] message render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 text-xs my-2">
          تعذّر عرض هذه الرسالة (بيانات غير متوقعة). راجع سجل الأخطاء بالمتصفح للتفاصيل.
        </div>
      );
    }
    return this.props.children;
  }
}

function wrapUiHtml(html: string): string {
  if (!html) return '';
  if (html.includes('<html') && (html.includes('tailwindcss') || html.includes('script'))) {
    return html;
  }
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Cairo', 'Plus Jakarta Sans', sans-serif; background-color: #0b0f17; color: #f8fafc; margin: 0; padding: 0; }
  </style>
</head>
<body class="p-4 antialiased min-h-screen">
  ${html}
</body>
</html>`;
}

interface AdminUserChatsProps {
  users: UserData[];
  initialUserId?: string | null;
  onClearInitialUser?: () => void;
}

export default function AdminUserChats({
  users,
  initialUserId,
  onClearInitialUser
}: AdminUserChatsProps) {
  // Navigation State: Level 1 (user) -> Level 2 (chats) -> Level 3 (messages)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userSearch, setUserSearch] = useState('');
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [chatSearch, setChatSearch] = useState('');

  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Interactive View Controls for UI & Media
  const [viewMode, setViewMode] = useState<'messages' | 'live_ui' | 'code'>('messages');
  const [uiDevice, setUiDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto audit logging helper
  const logAdminAction = async (action: string, targetUserId: string, chatId?: string, details?: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      await fetch('/api/admin/log-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          targetUserId,
          chatId,
          details
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('Audit log write error:', e);
    }
  };

  // If initialUserId passed from Users tab
  useEffect(() => {
    if (initialUserId && users.length > 0) {
      const found = users.find(u => u.uid === initialUserId);
      if (found) {
        handleSelectUser(found);
      }
    }
  }, [initialUserId, users]);

  // Select User -> Fetch User's Chats & Log Audit
  const handleSelectUser = async (userObj: UserData) => {
    setSelectedUser(userObj);
    setSelectedChat(null);
    setMessages([]);
    setViewMode('messages');
    setChatsLoading(true);

    logAdminAction('view_user_chats', userObj.uid, undefined, {
      userName: userObj.displayName || userObj.email || 'مستخدم'
    });

    try {
      const q = query(
        collection(db, 'chats'),
        where('ownerId', '==', userObj.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const fetched: ChatSession[] = [];
      snap.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
      });
      setChats(fetched);
    } catch (err: any) {
      console.error('Error fetching user chats:', err);
      toast.error('حدث خطأ أثناء جلب محادثات المستخدم: ' + err.message);
    } finally {
      setChatsLoading(false);
    }
  };

  // Select Chat -> Fetch Messages & Log Audit
  const handleSelectChat = async (chat: ChatSession) => {
    if (!selectedUser) return;
    setSelectedChat(chat);
    setMessagesLoading(true);
    setViewMode('messages');

    logAdminAction('view_chat_messages', selectedUser.uid, chat.id, {
      chatTitle: chat.title,
      chatType: chat.type
    });

    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chat.id),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      const fetched: Message[] = [];
      snap.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(fetched);
    } catch (err: any) {
      console.error('Error fetching chat messages:', err);
      toast.error('حدث خطأ أثناء جلب رسائل المحادثة.');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Filter Users
  const filteredUsers = users.filter(u => {
    const text = (u.displayName || '') + ' ' + (u.email || '') + ' ' + (u.uid || '');
    return text.toLowerCase().includes(userSearch.toLowerCase());
  });

  // Filter Chats
  const filteredChats = chats.filter(c => {
    const matchesSearch = (c.title || '').toLowerCase().includes(chatSearch.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'video': return <Film className="w-4 h-4 text-amber-400" />;
      case 'ui': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'document': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'voice': return <Mic className="w-4 h-4 text-cyan-400" />;
      default: return <MessageSquare className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getChatTypeName = (type: string) => {
    switch (type) {
      case 'image': return 'تصاميم وصور';
      case 'video': return 'فيديو سينمائي';
      case 'ui': return 'استوديو الواجهات';
      case 'document': return 'مستند وعرض';
      case 'voice': return 'صوتي';
      default: return 'نصي حواري';
    }
  };

  const getModelBadgeForChat = (chat: ChatSession, msgs: Message[]) => {
    // Check if any message explicitly stores modelId
    const withModel = msgs.slice().reverse().find(m => (m as any).modelId || (m as any).model);
    if (withModel) {
      return (withModel as any).modelId || (withModel as any).model;
    }
    // Infer standard model defaults per studio
    switch (chat.type) {
      case 'image': return 'Naje Image Engine';
      case 'video': return 'Naje Video Engine';
      case 'ui': return 'Naje UI Builder';
      case 'voice': return 'Naje Voice Studio';
      case 'document': return 'Naje Document Engine';
      default: return 'Naje Core Engine';
    }
  };

  // Find latest UI code snippet from messages
  const latestUiCode = messages.slice().reverse().find(m => m.uiCode)?.uiCode || '';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('تم نسخ الكود بنجاح');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>خاصية رقابة الجودة والدعم الفني الموثق</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>استعراض وسجل محادثات المستخدمين المباشر</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            اطّلع على محادثات المستخدمين بنفس شكل وتجربة الواجهة الأصلية: معاينة الواجهات المباشرة، الصور المرفقة والمولدة، الفيديوهات والتسجيلات الصوتية.
          </p>
        </div>

        {selectedUser && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setSelectedChat(null);
              setChats([]);
              setMessages([]);
              if (onClearInitialUser) onClearInitialUser();
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لقائمة جميع المستخدمين</span>
          </button>
        )}
      </div>

      {/* Main Container Grid */}
      {!selectedUser ? (
        /* LEVEL 1: SELECT USER */
        <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني أو المعرف..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <span className="text-xs text-gray-400 font-bold self-center">
              إجمالي المستخدمين: <span className="text-amber-400">{filteredUsers.length}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div 
                key={u.uid}
                className="bg-gray-900/60 border border-gray-800/80 hover:border-amber-500/40 rounded-2xl p-4 transition shadow-md flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName || 'User'} className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm">
                      {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition">
                      {u.displayName || 'مستخدم بدون اسم'}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate dir-ltr text-right">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-[11px] text-gray-400">
                  <span>الرصيد: <strong className="text-amber-400">{u.balance ?? 5}</strong> نقطة</span>
                  <button
                    onClick={() => handleSelectUser(u)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-black text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>عرض المحادثات</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LEVEL 2 & 3: USER CHATS AND RICH MESSAGE VIEWER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* USER CHATS LIST (4 cols) */}
          <div className="lg:col-span-4 bg-[#0e1015] border border-gray-800 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col h-[800px]">
            {/* Selected User Header Card */}
            <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs shrink-0">
                  {(selectedUser.displayName || selectedUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black text-white truncate">{selectedUser.displayName || 'مستخدم'}</h3>
                  <p className="text-[10px] text-gray-400 truncate dir-ltr text-right">{selectedUser.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full shrink-0">
                {chats.length} محادثات
              </span>
            </div>

            {/* Chat Type Filter Strip */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'text', label: 'نصوص' },
                { id: 'image', label: 'صور' },
                { id: 'video', label: 'فيديو' },
                { id: 'ui', label: 'واجهات' },
                { id: 'voice', label: 'صوتي' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer ${
                    typeFilter === f.id
                      ? 'bg-amber-500 text-gray-950 shadow-md'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث بعناوين المحادثات..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Chats Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-800">
              {chatsLoading ? (
                <div className="text-center py-12 text-xs text-gray-500">جاري تحميل المحادثات...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500">لا توجد محادثات متطابقة.</div>
              ) : (
                filteredChats.map((c) => {
                  const isSelected = selectedChat?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectChat(c)}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-md'
                          : 'bg-gray-900/40 border-gray-800 hover:bg-gray-900/80 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-gray-800 border border-gray-700 shrink-0">
                          {getChatIcon(c.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{c.title || 'محادثة بدون عنوان'}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {getChatTypeName(c.type)} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-SA') : ''}
                          </span>
                        </div>
                      </div>

                      <Eye className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LEVEL 3: MESSAGE VIEWER & RICH STUDIO PANEL (8 cols) */}
          <div className="lg:col-span-8 bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col h-[800px]">
            {!selectedChat ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-white mb-1">اختر محادثة لمعاينة تفاصيلها الحية</h3>
                <p className="text-xs max-w-md">
                  انقر على أي محادثة من القائمة لعرض الحوار الكامل بالصور، الفيديوهات، معاينة الواجهات الحية، والأصوات.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Top Header & Studio View Selector */}
                <div className="pb-4 mb-4 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {getChatIcon(selectedChat.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{selectedChat.title}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {getModelBadgeForChat(selectedChat, messages)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        نوع المحادثة: <strong className="text-gray-200">{getChatTypeName(selectedChat.type)}</strong> • {messages.length} رسائل
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector for UI / Code / Messages */}
                  {selectedChat.type === 'ui' && latestUiCode && (
                    <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                      <button
                        onClick={() => setViewMode('messages')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          viewMode === 'messages' ? 'bg-amber-500 text-gray-950 shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>الحوار</span>
                      </button>
                      <button
                        onClick={() => setViewMode('live_ui')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          viewMode === 'live_ui' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Layers3 className="w-3.5 h-3.5" />
                        <span>المعاينة الحية</span>
                      </button>
                      <button
                        onClick={() => setViewMode('code')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          viewMode === 'code' ? 'bg-gray-800 text-cyan-300 shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>الكود</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* VIEW MODE 1: LIVE UI PREVIEW (FOR UI STUDIO CHATS) */}
                {viewMode === 'live_ui' && latestUiCode ? (
                  <div className="flex-1 flex flex-col bg-gray-950 border border-gray-800 rounded-2xl p-4 overflow-hidden space-y-3">
                    <div className="flex items-center justify-between bg-gray-900 p-2 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>معاينة واجهة المستخدم المبرمجة من Naje AI</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setUiDevice('desktop')}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                            uiDevice === 'desktop' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>شاشة حاسوب</span>
                        </button>
                        <button
                          onClick={() => setUiDevice('mobile')}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                            uiDevice === 'mobile' ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>هاتف</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden border border-gray-800/80 p-2">
                      <div className={`transition-all duration-300 h-full bg-white rounded-xl shadow-2xl overflow-hidden ${
                        uiDevice === 'mobile' ? 'w-[375px] max-h-[660px]' : 'w-full h-full'
                      }`}>
                        <iframe
                          srcDoc={wrapUiHtml(latestUiCode)}
                          title="UI Studio Live Preview"
                          className="w-full h-full border-none"
                          sandbox="allow-scripts"
                        />
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'code' && latestUiCode ? (
                  /* VIEW MODE 2: CODE VIEWER (FOR UI STUDIO CHATS) */
                  <div className="flex-1 flex flex-col bg-gray-950 border border-gray-800 rounded-2xl p-4 overflow-hidden space-y-3 dir-ltr">
                    <div className="flex items-center justify-between bg-gray-900 p-2 rounded-xl border border-gray-800 text-xs font-mono text-gray-300 dir-rtl">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-cyan-400" />
                        <span>كود المصدر المولد بالكامل (HTML / React / Tailwind)</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(latestUiCode, 'full-ui-code')}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-lg border border-gray-700 text-xs flex items-center gap-1.5 transition"
                      >
                        {copiedId === 'full-ui-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === 'full-ui-code' ? 'تم النسخ' : 'نسخ الكود'}</span>
                      </button>
                    </div>

                    <pre className="flex-1 overflow-auto bg-black/90 p-4 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 leading-relaxed scrollbar-thin scrollbar-thumb-gray-800">
                      <code>{latestUiCode}</code>
                    </pre>
                  </div>
                ) : (
                  /* VIEW MODE 3: FULL MESSAGES STREAM VIEWER */
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 pl-2 scrollbar-thin scrollbar-thumb-gray-800 dir-rtl">
                    {messagesLoading ? (
                      <div className="text-center py-16 text-xs text-gray-500">جاري جلب الرسائل...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 text-xs text-gray-500">لا توجد رسائل مسجلة في هذه المحادثة.</div>
                    ) : (
                      messages.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                          <MessageErrorBoundary key={msg.id}>
                            <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                              <div className="flex items-center gap-2 mb-1 text-[10px] text-gray-500 font-bold">
                                <span>{isUser ? selectedUser.displayName || 'المستخدم' : 'الذكاء الاصطناعي (Naje AI)'}</span>
                                <span>•</span>
                                <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              </div>

                              <div
                                className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed space-y-3.5 ${
                                  isUser
                                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-tr-none'
                                    : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none shadow-md'
                                }`}
                              >
                                {/* Text Content */}
                                {msg.content && (
                                  <p className="whitespace-pre-wrap font-sans text-sm">{msg.content}</p>
                                )}

                                {/* User Uploaded Reference Files */}
                                {isUser && Array.isArray(msg.files) && msg.files.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-amber-500/20">
                                    <p className="text-[10px] text-amber-300/80 mb-1.5 font-bold">ملفات مرفقة من المستخدم ({msg.files.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.files.map((f: any, i: number) => {
                                        if (!f?.data || !f?.mimeType) return null;
                                        const isImage = String(f.mimeType).startsWith('image/');
                                        const dataUri = `data:${f.mimeType};base64,${f.data}`;
                                        return isImage ? (
                                          <div key={i} className="relative group cursor-pointer" onClick={() => setZoomedImage({ url: dataUri, title: f.name })}>
                                            <img
                                              src={dataUri}
                                              alt={f.name || 'ملف مرفق'}
                                              className="h-20 w-20 object-cover rounded-lg border border-amber-500/30 shadow-sm"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white">
                                              <Maximize2 className="w-4 h-4" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            key={i}
                                            className="h-20 w-20 flex items-center justify-center rounded-lg border border-amber-500/30 bg-black/40 text-[10px] text-amber-200 px-1 text-center font-mono truncate"
                                          >
                                            {f.name || 'ملف'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Original Source Image for Image Edits (Side-by-side or comparison card) */}
                                {isUser && msg.isEdit && msg.sourceMediaUrl && (
                                  <div className="mt-2 pt-2 border-t border-amber-500/20">
                                    <p className="text-[10px] text-amber-300/80 mb-1 font-bold">الصورة الأصلية المراد تعديلها</p>
                                    <div
                                      className="relative group cursor-pointer inline-block"
                                      onClick={() => setZoomedImage({ url: msg.sourceMediaUrl!, title: 'الصورة الأصلية المراد تعديلها' })}
                                    >
                                      <img
                                        src={msg.sourceMediaUrl}
                                        alt="Original Source"
                                        className="h-24 w-24 object-cover rounded-lg border border-amber-500/30 shadow-sm"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center text-white">
                                        <Maximize2 className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Generated Media / Code Result (Type-Aware) */}
                                {msg.mediaUrl?.startsWith('local:') ? (
                                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-400 text-xs my-2">
                                    هذا المحتوى تم إنشاؤه قبل تفعيل الأرشفة السحابية وغير متاح للمراجعة من هنا.
                                  </div>
                                ) : (selectedChat.type === 'ui' || msg.uiCode) && (msg.uiCode || isUiDocument(msg.content)) ? (
                                  <div className="rounded-xl overflow-hidden border border-purple-900/40 mt-2 bg-slate-950 p-2 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-purple-300 px-1 dir-rtl">
                                      <span className="font-bold flex items-center gap-1">
                                        <Layers3 className="w-3.5 h-3.5 text-purple-400" />
                                        واجهة مستخدم مبرمجة (UI Studio)
                                      </span>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-gray-800 bg-white" style={{ height: 380 }}>
                                      <NajeUiPreview
                                        rawHtml={msg.uiCode || parseUiMessage(msg.content).html}
                                        isStreaming={false}
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                ) : (selectedChat.type === 'voice' || msg.audioUrl) && (msg.mediaUrl || msg.audioUrl) && !msg.mediaUrl?.startsWith('local:') ? (
                                  <div className="p-3 bg-black/80 rounded-xl border border-cyan-500/30 space-y-2 mt-2">
                                    <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold">
                                      <span className="flex items-center gap-1">
                                        <Mic className="w-3.5 h-3.5" />
                                        تسجيل صوتي (TTS Engine)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Volume2 className="w-5 h-5 text-cyan-400 shrink-0" />
                                      <audio src={msg.mediaUrl || msg.audioUrl} controls className="w-full h-8" />
                                    </div>
                                  </div>
                                ) : (selectedChat.type === 'video' || msg.videoUrl) && (msg.mediaUrl || msg.videoUrl) && !msg.mediaUrl?.startsWith('local:') ? (
                                  <div className="rounded-xl overflow-hidden border border-gray-800 mt-2 bg-black/80 p-2 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-amber-300 px-1">
                                      <span className="font-bold flex items-center gap-1">
                                        <Film className="w-3.5 h-3.5 text-amber-400" />
                                        فيديو سينمائي مولد من Veo / Omni Flash
                                      </span>
                                      <a
                                        href={msg.mediaUrl || msg.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="text-amber-400 hover:underline flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>تنزيل</span>
                                      </a>
                                    </div>
                                    <video
                                      src={msg.mediaUrl || msg.videoUrl}
                                      controls
                                      className="w-full max-h-80 rounded-lg shadow-xl"
                                    />
                                  </div>
                                ) : (selectedChat.type === 'image' || msg.imageUrl) && (msg.mediaUrl || msg.imageUrl) && !msg.mediaUrl?.startsWith('local:') ? (
                                  <div className="rounded-xl overflow-hidden border border-gray-800 mt-2 bg-black/60 p-2 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-pink-300 px-1">
                                      <span className="font-bold flex items-center gap-1">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        الصورة المولدَة من نموذج الصور
                                      </span>
                                      <button
                                        onClick={() => setZoomedImage({ url: msg.mediaUrl || msg.imageUrl!, title: 'الصورة المولدَة' })}
                                        className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                        <span>تكبير</span>
                                      </button>
                                    </div>
                                    <img
                                      src={msg.mediaUrl || msg.imageUrl}
                                      alt="Generated Result"
                                      className="max-h-80 w-auto object-contain mx-auto rounded-lg cursor-pointer hover:opacity-95 transition"
                                      onClick={() => setZoomedImage({ url: msg.mediaUrl || msg.imageUrl!, title: 'الصورة المولدَة' })}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </MessageErrorBoundary>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Zoom High Resolution Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-gray-950 border border-gray-800 rounded-3xl p-4 overflow-hidden flex flex-col items-center space-y-3">
            <div className="w-full flex items-center justify-between border-b border-gray-800 pb-2 text-xs font-bold text-white dir-rtl">
              <span>{zoomedImage.title || 'معاينة الصورة بدقة عالية'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="image-preview.png"
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-gray-950 rounded-xl font-bold flex items-center gap-1 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل</span>
                </a>
                <button
                  onClick={() => setZoomedImage(null)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-auto flex items-center justify-center w-full">
              <img
                src={zoomedImage.url}
                alt="High Resolution Zoom"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
