import { useI18n } from '../i18n';
import { useOnline } from '../lib/offline';

export default function OfflineBanner() {
  const online = useOnline();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div className="pointer-events-none fixed top-2 inset-x-0 z-[80] flex justify-center px-3">
      <div className="pointer-events-auto max-w-lg rounded-full border border-amber-400/40 bg-[#1a1408]/95 px-3 py-1.5 text-center text-[11px] font-bold leading-snug text-amber-100 shadow-lg shadow-black/30">
        {t('surface.offline.banner')}
      </div>
    </div>
  );
}
