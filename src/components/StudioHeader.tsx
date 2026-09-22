import React from 'react';
import { PanelRight, LucideIcon } from 'lucide-react';
import { useAppStore } from '../store';
import NotificationDropdown from './NotificationDropdown';
import BalanceTopDropdown from './BalanceTopDropdown';
import { cn } from '../lib/utils';

export interface StudioHeaderProps {
  title: string;
  badge?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  badgeClass?: string;
  theme?: 'dark' | 'canvas' | 'cinema' | 'navy' | 'purple';
  actions?: React.ReactNode;
  showBalance?: boolean;
  showNotifications?: boolean;
  className?: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  title,
  badge,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-indigo-600 dark:text-indigo-400',
  iconBgClass = 'bg-indigo-500/10 border-indigo-500/20',
  badgeClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  theme = 'canvas',
  actions,
  showBalance = true,
  showNotifications = true,
  className,
}) => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const themeStyles = {
    canvas: 'bg-white/85 dark:bg-zinc-950/85 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-white',
    dark: 'bg-[#0b0c10]/95 border-white/10 text-white',
    cinema: 'bg-[#0d0f14]/95 border-amber-500/20 text-white',
    navy: 'bg-[#0c1322]/95 border-[#c4a35a]/25 text-white',
    purple: 'bg-[#05030a]/95 border-purple-500/20 text-white',
  };

  const isDarkMode = theme !== 'canvas';

  return (
    <header
      className={cn(
        'h-14 min-h-[56px] px-3 sm:px-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 z-30 sticky top-0 w-full transition-colors',
        themeStyles[theme] || themeStyles.canvas,
        className
      )}
      dir="rtl"
    >
      {/* Right: Toggle + Studio Icon + Title & Badge */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'p-1.5 sm:p-2 rounded-xl transition cursor-pointer flex items-center justify-center active:scale-95 shrink-0',
            isDarkMode
              ? 'text-zinc-300 hover:text-white hover:bg-white/10'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
          title="توسيع/طي القائمة"
          aria-label="توسيع أو طي القائمة الجانبية"
        >
          <PanelRight className="w-5 h-5" />
        </button>

        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform shadow-xs',
            iconBgClass,
            iconColorClass
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="min-w-0 max-w-[140px] xs:max-w-[200px] sm:max-w-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-xs sm:text-sm font-black truncate leading-tight">
              {title}
            </h1>
            {badge && (
              <span
                className={cn(
                  'hidden sm:inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0',
                  badgeClass
                )}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={cn(
                'text-[10px] truncate hidden md:block mt-0.5 font-medium',
                isDarkMode ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Left: Custom Actions + Notifications + Balance */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions && <div className="flex items-center gap-1 sm:gap-1.5">{actions}</div>}

        {showNotifications && <NotificationDropdown />}

        {showBalance && (
          <BalanceTopDropdown isCreativeMode={isDarkMode} />
        )}
      </div>
    </header>
  );
};

export default StudioHeader;
