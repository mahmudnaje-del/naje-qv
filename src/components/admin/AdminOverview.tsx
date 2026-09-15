import React from 'react';
import { 
  Users, Activity, Key, DollarSign, AlertTriangle, MessageSquare, 
  Sparkles, CheckCircle2, ArrowUpRight, TrendingUp, Cpu, Power, ShieldAlert,
  Flame, Film, Image as ImageIcon, FileText, Mic, Layers
} from 'lucide-react';
import { UserData, RedeemCode } from '../../types';

interface AdminOverviewProps {
  users: UserData[];
  codes: RedeemCode[];
  flaggedRequests: any[];
  maintIsActive: boolean;
  isLimitReached: boolean;
  onNavigate: (tab: any) => void;
}

export default function AdminOverview({
  users,
  codes,
  flaggedRequests,
  maintIsActive,
  isLimitReached,
  onNavigate
}: AdminOverviewProps) {
  // Compute user metrics
  const totalUsers = users.length;
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const activeToday = users.filter(u => u.createdAt && u.createdAt > oneDayAgo).length;
  const activeThisWeek = users.filter(u => u.createdAt && u.createdAt > sevenDaysAgo).length;

  const totalPointsBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalRedeemedCodes = codes.filter(c => (c.usageCount && c.usageCount > 0) || c.used).length;
  const totalPointsFromCodes = codes.reduce((acc, c) => acc + (((c.usageCount && c.usageCount > 0) ? c.usageCount : (c.used ? 1 : 0)) * (c.points || 0)), 0);

  const recentFlagged = flaggedRequests.slice(0, 5);

  const generationCategories = [
    { name: 'محادثات نصوص', type: 'text', count: 1420, icon: MessageSquare, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'تصاميم وصور', type: 'image', count: 860, icon: ImageIcon, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    { name: 'استوديو الواجهات UI', type: 'ui', count: 410, icon: Layers, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { name: 'مقاطع فيديو سينمائية', type: 'video', count: 230, icon: Film, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { name: 'مستندات وعروض PDF', type: 'document', count: 320, icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'محادثات صوتية', type: 'voice', count: 190, icon: Mic, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  ];

  const maxGenCount = Math.max(...generationCategories.map(c => c.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome / System Status Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-[#111319] to-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مرحباً بك في لوحة تحكم ناجي AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              نظرة عامة على أداء المنصة
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              استعراض فوري وشامل لإحصائيات المستخدمين، الاستهلاك، الطلبات المرفوضة، وحالة النظام التشغيلية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('user_chats')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>تصفح المحادثات</span>
            </button>
            <button
              onClick={() => onNavigate('feature_flags')}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition flex items-center gap-2 cursor-pointer"
            >
              <Power className="w-4 h-4 text-emerald-400" />
              <span>مفاتيح الميزات</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        {(maintIsActive || isLimitReached) && (
          <div className="mt-6 pt-6 border-t border-gray-800/80 flex flex-wrap gap-4">
            {maintIsActive && (
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                <span>وضع الصيانة مفعّل حالياً في المنصة</span>
              </div>
            )}
            {isLimitReached && (
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                <ShieldAlert className="w-4 h-4" />
                <span>تم الوصول إلى الحد الأقصى للمستخدمين المسموح بهم</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0e1015] border border-gray-800/80 rounded-2xl p-5 shadow-xl hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">إجمالي المستخدمين المسجلين</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">{totalUsers}</span>
            <span className="text-xs text-gray-400 mr-2">مستخدم</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-800/60 pt-2.5">
            <span>نشطوا هذا الأسبوع: <strong className="text-indigo-400">{activeThisWeek}</strong></span>
            <span>اليوم: <strong className="text-emerald-400">{activeToday}</strong></span>
          </div>
        </div>

        <div className="bg-[#0e1015] border border-gray-800/80 rounded-2xl p-5 shadow-xl hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">إجمالي النقاط المتاحة بالحسابات</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-amber-400">{totalPointsBalance.toLocaleString()}</span>
            <span className="text-xs text-gray-400 mr-2">نقطة</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-800/60 pt-2.5">
            <span>تم شحنها كلياً:</span>
            <span className="text-amber-300 font-bold">{totalPointsFromCodes.toLocaleString()} نقطة</span>
          </div>
        </div>

        <div className="bg-[#0e1015] border border-gray-800/80 rounded-2xl p-5 shadow-xl hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">الأكواد المستعملة</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-white">{totalRedeemedCodes}</span>
            <span className="text-xs text-gray-400 mr-2">من أصل {codes.length} كود</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-800/60 pt-2.5">
            <span>معدل الشحن الناجح:</span>
            <span className="text-emerald-400 font-bold">
              {codes.length > 0 ? Math.round((totalRedeemedCodes / codes.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-[#0e1015] border border-gray-800/80 rounded-2xl p-5 shadow-xl hover:border-gray-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">الطلبات المرفوضة أمنياً</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-rose-400">{flaggedRequests.length}</span>
            <span className="text-xs text-gray-400 mr-2">محاولة مرفوضة</span>
          </div>
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-800/60 pt-2.5">
            <span>أنظمة الحماية:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              نشطة ومحمية
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & Flagged Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Types Distribution Chart */}
        <div className="lg:col-span-2 bg-[#0e1015] border border-gray-800/80 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>توزيع التوليد حسب نوع الخدمة (آخر 7 أيام)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">استهلاك النماذج والتوليدات عبر شتى المسارات الذكية</p>
            </div>
            <button
              onClick={() => onNavigate('pricing')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>تفاصيل التسعير</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {generationCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const percentage = Math.round((cat.count / maxGenCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-gray-300">
                      <span className={`p-1.5 rounded-lg border ${cat.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {cat.name}
                    </span>
                    <span className="text-gray-400">{cat.count.toLocaleString()} عمليات</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-800/70 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Flagged Requests Card */}
        <div className="bg-[#0e1015] border border-gray-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>أحدث الطلبات المرفوضة</span>
              </h3>
              <button
                onClick={() => onNavigate('flagged')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                عرض الكل ({flaggedRequests.length})
              </button>
            </div>

            {recentFlagged.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                لا توجد طلبات مرفوضة مؤخراً.
              </div>
            ) : (
              <div className="space-y-3">
                {recentFlagged.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-mono text-amber-400 truncate max-w-[140px]">
                        {item.uid ? item.uid.slice(0, 10) + '...' : 'زائر'}
                      </span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}</span>
                    </div>
                    <p className="text-gray-300 font-medium line-clamp-2 dir-rtl">
                      "{item.prompt || item.reason || 'محتوى مرفوض من فلتر الأمان'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-800/80 text-center">
            <button
              onClick={() => onNavigate('audit_log')}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>استعراض سجل النشاط الإداري</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
