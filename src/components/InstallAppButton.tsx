import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '../i18n';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallAppButton() {
  const { t } = useI18n();
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!promptEvent) return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(16px,env(safe-area-inset-bottom))] inset-x-0 z-[80] flex justify-center px-3">
      <button
        type="button"
        onClick={() => {
          const pending = promptEvent;
          setPromptEvent(null);
          pending.prompt().then(() => pending.userChoice).catch(() => null);
        }}
        className="pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-indigo-900/40 active:scale-95"
      >
        <Download className="h-4 w-4" />
        <span>{t('surface.install.action')}</span>
      </button>
    </div>
  );
}
