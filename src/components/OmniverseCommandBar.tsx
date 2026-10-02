import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useI18n } from '../i18n';
import { STUDIO_CAPABILITIES } from '../omniverse/capabilities';
import { routeIntent } from '../omniverse/intent';
import { rememberJob } from '../omniverse/contracts';

type CreateChat = (type: 'text' | 'image' | 'video' | 'ui' | 'voice' | 'design' | 'najeDeveloper' | 'najeSource' | 'agent') => void;

export function OmniverseCommandBar({ onCreateChat }: { onCreateChat: CreateChat }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const decision = useMemo(() => routeIntent(query), [query]);
  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDIO_CAPABILITIES;
    return STUDIO_CAPABILITIES.filter((cap) =>
      cap.keywords.some((word) => word.toLowerCase().includes(q) || q.includes(word.toLowerCase()))
    );
  }, [query]);

  const go = (id: string, to: string) => {
    rememberJob({ title: query || id, phase: 'completed', studio: id, spentPoints: 0 });
    setOpen(false);
    setQuery('');
    if (id === 'chat') onCreateChat('text');
    else if (id === 'agent') onCreateChat('agent');
    else if (id === 'source') onCreateChat('najeSource');
    else if (id === 'developer') onCreateChat('najeDeveloper');
    else navigate(to);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-3 pt-[12vh]" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('omni.title')}
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-3 text-start shadow-2xl dark:border-gray-800 dark:bg-[#101218]"
            onClick={(event) => event.stopPropagation()}
          >
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 dark:border-gray-800">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('omni.placeholder')}
                className="h-11 w-full bg-transparent text-sm text-gray-900 outline-none dark:text-white"
              />
              <span className="hidden text-[10px] text-gray-400 sm:inline">Ctrl K</span>
            </label>
            {decision.confidence === 'medium' && decision.assumptionKey && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-2 text-[11px] text-amber-800 dark:text-amber-200">{t(decision.assumptionKey)}</p>
            )}
            {decision.confidence === 'low' && query.trim() && decision.clarifyKey && (
              <p className="mt-2 text-[11px] text-gray-500">{t(decision.clarifyKey)}</p>
            )}
            <ul className="mt-2 max-h-72 overflow-y-auto">
              {(decision.capability && !listed.some((item) => item.id === decision.capability?.id) ? [decision.capability, ...listed] : listed).map((cap) => (
                <li key={cap.id}>
                  <button
                    type="button"
                    onClick={() => go(cap.id, cap.to)}
                    className="flex w-full flex-col rounded-xl px-3 py-2 text-start hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{t(cap.labelKey)}</span>
                    <span className="text-[11px] text-gray-500">{t(cap.hintKey)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
