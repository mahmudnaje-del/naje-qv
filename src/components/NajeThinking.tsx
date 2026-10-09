import { useI18n } from '../i18n';

// Whole-mark pulse only. Transforms on the inner SVG pieces fly apart on Android Chrome.
export function NajeThinking({ size = 112, className = '' }: { size?: number; className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src="/logo-mark.svg"
      alt={t('shared.thinking')}
      width={size}
      height={size}
      draggable={false}
      className={`naje-think ${className}`.trim()}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}

export default NajeThinking;
