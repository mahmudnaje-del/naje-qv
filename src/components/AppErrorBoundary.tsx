import React from 'react';

const COPY: Record<string, { title: string; body: string; reload: string }> = {
  ar: { title: 'حدث خطأ غير متوقع', body: 'نأسف على الإزعاج. أعد تحميل الصفحة للمتابعة.', reload: 'إعادة التحميل' },
  en: { title: 'Something went wrong', body: 'Sorry for the interruption. Reload the page to continue.', reload: 'Reload' },
  es: { title: 'Algo salió mal', body: 'Recarga la página para continuar.', reload: 'Recargar' },
  fr: { title: 'Une erreur est survenue', body: 'Rechargez la page pour continuer.', reload: 'Recharger' },
  de: { title: 'Etwas ist schiefgelaufen', body: 'Laden Sie die Seite neu, um fortzufahren.', reload: 'Neu laden' },
  pt: { title: 'Algo deu errado', body: 'Recarregue a página para continuar.', reload: 'Recarregar' },
  tr: { title: 'Beklenmeyen bir hata', body: 'Devam etmek için sayfayı yenileyin.', reload: 'Yenile' },
  id: { title: 'Terjadi kesalahan', body: 'Muat ulang halaman untuk lanjut.', reload: 'Muat ulang' },
  ja: { title: '予期しないエラー', body: '続行するにはページを再読み込みしてください。', reload: '再読み込み' },
  ru: { title: 'Произошла ошибка', body: 'Перезагрузите страницу, чтобы продолжить.', reload: 'Обновить' },
};

export default class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: unknown) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const lang =
        (typeof document !== 'undefined' && document.documentElement.lang) || 'ar';
      const copy = COPY[lang] || COPY.ar;
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      return (
        <div
          dir={dir}
          style={{
            padding: 24,
            textAlign: 'center',
            color: '#e5e7eb',
            background: '#0d0f12',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{copy.title}</h2>
          <p style={{ maxWidth: 360, color: '#9ca3af', margin: 0 }}>{copy.body}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '10px 22px',
              borderRadius: 12,
              background: '#7C3AED',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {copy.reload}
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactNode;
  }
}
