import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  ShieldCheck, Search, Filter, Calendar, User, Eye, 
  Terminal, ShieldAlert, ArrowDownUp, RefreshCw, Key, Bell, Power
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  adminId: string;
  adminEmail: string;
  targetUserId?: string;
  chatId?: string;
  details?: Record<string, any>;
  timestamp: number;
}

export default function AdminAuditLogView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'admin_audit_log'),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched: AuditEntry[] = [];
      snap.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as AuditEntry);
      });
      setEntries(fetched);
      setLoading(false);
    }, (err) => {
      console.warn('Error listening to audit log:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredEntries = entries.filter(e => {
    const text = (e.action || '') + ' ' + (e.adminEmail || '') + ' ' + (e.targetUserId || '') + ' ' + (e.chatId || '');
    const matchesSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || e.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'view_user_chats':
        return <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[11px] font-bold">معاينة محادثات مستخدم</span>;
      case 'view_chat_messages':
        return <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[11px] font-bold">قراءة رسائل محادثة</span>;
      case 'send_notification':
        return <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] font-bold">بث إشعار جماعي</span>;
      case 'update_feature_flags':
        return <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold">تعديل مفاتيح الميزات</span>;
      case 'generate_voice_samples':
        return <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[11px] font-bold">توليد عينات أصوات</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-[11px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام الشفافية والمساءلة الإدارية الموثق (Audit Logging)</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            سجل النشاط والعمليات الإدارية
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            يُحفظ في هذا السجل غير القابل للتعديل كل إجراء إداري حساس (مثل الاطلاع على المحادثات، بث الإشعارات، تعديل الأسعار، ومفاتيح الميزات).
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث بالحساب الإداري، المعرف، أو نوع الإجراء..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'كافة الإجراءات' },
            { id: 'view_user_chats', label: 'معاينة المحادثات' },
            { id: 'view_chat_messages', label: 'قراءة الرسائل' },
            { id: 'send_notification', label: 'الإشعارات' },
            { id: 'update_feature_flags', label: 'مفاتيح الميزات' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                actionFilter === f.id
                  ? 'bg-amber-500 text-gray-950 font-black shadow-md'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table / Card List */}
      <div className="bg-[#0e1015] border border-gray-800 rounded-3xl p-6 shadow-xl space-y-3">
        {loading ? (
          <div className="text-center py-16 text-xs text-gray-500">جاري تحميل سجل الأنشطة...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 text-xs text-gray-500">لا توجد سجلات مطابقة للبحث.</div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div 
                key={entry.id}
                className="bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 transition shadow-md space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {getActionBadge(entry.action)}
                    <span className="font-bold text-white text-xs dir-ltr">{entry.adminEmail || entry.adminId}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    {entry.targetUserId && (
                      <span>المستهدف: <strong className="text-amber-400 font-mono">{entry.targetUserId}</strong></span>
                    )}
                    <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleString('ar-SA') : ''}</span>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      {isExpanded ? 'إخفاء التفاصيل' : 'التفاصيل'}
                    </button>
                  </div>
                </div>

                {isExpanded && entry.details && (
                  <div className="mt-3 p-3 bg-black/80 rounded-xl border border-gray-800 font-mono text-[11px] text-amber-200/90 overflow-x-auto dir-ltr">
                    <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
