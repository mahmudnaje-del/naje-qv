import React from 'react';
import { useI18n } from '../../i18n';
import { 
  BarChart3, Users, MessageSquare, Key, DollarSign, Cpu, AlertTriangle, 
  ThumbsUp, Sparkles, Bell, Power, ShieldCheck, ToggleLeft, Menu, X, ChevronLeft,
  Film
} from 'lucide-react';

export type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'user_chats' 
  | 'codes' 
  | 'model_pricing'
  | 'naje_ad'
  | 'flagged' 
  | 'feedback' 
  | 'skills' 
  | 'notifications' 
  | 'status' 
  | 'audit_log' 
  | 'feature_flags';


interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  counts: {
    usersCount: number;
    codesCount: number;
    flaggedCount: number;
    feedbackCount: number;
    skillsCount: number;
    isSystemAlert: boolean;
  };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  counts,
  mobileOpen,
  setMobileOpen
}: AdminSidebarProps) {
  const { t } = useI18n();

  const groups: Array<{
    title: string;
    items: Array<{
      id: AdminTab;
      label: string;
      icon: any;
      badge: string | number | null;
      color?: string;
    }>;
  }> = [
    {
      title: t('tools.admin.navHome'),
      items: [
        { id: 'overview' as AdminTab, label: t('tools.admin.overview'), icon: BarChart3, badge: null },
      ]
    },
    {
      title: t('tools.admin.groupUsers'),
      items: [
        { id: 'users' as AdminTab, label: t('tools.admin.users'), icon: Users, badge: counts.usersCount > 0 ? counts.usersCount : null },
        { id: 'user_chats' as AdminTab, label: t('tools.admin.userChats'), icon: MessageSquare, badge: t('tools.admin.badgeNew') },
        { id: 'codes' as AdminTab, label: t('tools.admin.codes'), icon: Key, badge: counts.codesCount > 0 ? counts.codesCount : null },
      ]
    },
    {
      title: t('tools.admin.groupEconomy'),
      items: [
        { id: 'model_pricing' as AdminTab, label: t('tools.admin.pricing'), icon: Cpu, badge: t('tools.admin.badgeUnified') },
        { id: 'naje_ad' as AdminTab, label: t('tools.admin.najeAd'), icon: Film, badge: t('tools.admin.badgeNew') },
      ]
    },
    {
      title: t('tools.admin.groupSafety'),
      items: [
        { id: 'flagged' as AdminTab, label: t('tools.admin.flagged'), icon: AlertTriangle, badge: counts.flaggedCount > 0 ? counts.flaggedCount : null, color: 'text-amber-400' },
        { id: 'feedback' as AdminTab, label: t('tools.admin.feedback'), icon: ThumbsUp, badge: counts.feedbackCount > 0 ? counts.feedbackCount : null },
      ]
    },
    {
      title: t('tools.admin.groupPlatform'),
      items: [
        { id: 'skills' as AdminTab, label: t('tools.admin.skills'), icon: Sparkles, badge: counts.skillsCount > 0 ? counts.skillsCount : null },
        { id: 'notifications' as AdminTab, label: t('tools.admin.notifications'), icon: Bell, badge: null },
        { id: 'status' as AdminTab, label: t('tools.admin.status'), icon: Power, badge: counts.isSystemAlert ? t('tools.admin.badgeAlert') : null, color: counts.isSystemAlert ? 'text-red-400' : '' },
      ]
    },
    {
      title: t('tools.admin.groupControl'),
      items: [
        { id: 'audit_log' as AdminTab, label: t('tools.admin.audit'), icon: ShieldCheck, badge: null },
        { id: 'feature_flags' as AdminTab, label: t('tools.admin.flags'), icon: ToggleLeft, badge: null },
      ]
    }
  ];

  const handleSelect = (id: AdminTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0d0f14] text-gray-200 border-l border-gray-800/80 p-4 font-sans select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wide">{t('tools.admin.consoleTitle')}</h2>
            <p className="text-[11px] text-amber-400/80 font-medium">Naje AI Executive Console</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg bg-gray-800/50 hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links Grouped */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pl-1 scrollbar-thin scrollbar-thumb-gray-800">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-start flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/10 text-white border border-amber-500/30 shadow-lg shadow-amber-500/5' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-400' : item.color || 'text-gray-400 group-hover:text-amber-300'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                      isActive 
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                        : item.badge === t('tools.admin.badgeNew') || item.badge === t('tools.admin.badgeAlert')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 mt-4 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          {t('tools.admin.systemsOk')}
        </span>
        <span className="font-mono text-[10px] text-gray-400">v3.8.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent Right Rail for RTL) */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-80px)] sticky top-20 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        {navContent}
      </aside>

      {/* Mobile Drawer Trigger Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#0d0f14] border border-gray-800 rounded-2xl mb-4 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold">{t('tools.admin.consoleTitle')}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
        >
          <Menu className="w-4 h-4 text-amber-400" />
          <span>{t('tools.admin.menu')}</span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop and Panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
