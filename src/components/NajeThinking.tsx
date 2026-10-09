import { useI18n } from '../i18n';

// Static mark. CSS transforms on the SVG pieces fly apart on Android Chrome.
export function NajeThinking({ size = 112, className = '' }: { size?: number; className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logo-boot.png"
      alt={t('shared.thinking')}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

export default NajeThinking;
