import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const COPY: Record<string, { title: string; body: string; reload: string }> = {
  ar: { title: 'حدث خطأ غير متوقع', body: 'نأسف لذلك، حدثت مشكلة أثناء عرض الصفحة. يمكنك إعادة التحميل لمتابعة العمل.', reload: 'إعادة تحميل الصفحة' },
  en: { title: 'Something went wrong', body: 'Sorry — something went wrong while showing this page. Reload to continue.', reload: 'Reload page' },
  es: { title: 'Algo salió mal', body: 'Hubo un problema al mostrar la página. Recarga para continuar.', reload: 'Recargar página' },
  fr: { title: 'Une erreur est survenue', body: 'Un problème est survenu pendant l’affichage. Rechargez pour continuer.', reload: 'Recharger' },
  de: { title: 'Etwas ist schiefgelaufen', body: 'Beim Anzeigen der Seite ist ein Problem aufgetreten. Neu laden, um fortzufahren.', reload: 'Seite neu laden' },
  pt: { title: 'Algo deu errado', body: 'Ocorreu um problema ao mostrar a página. Recarregue para continuar.', reload: 'Recarregar' },
  tr: { title: 'Beklenmeyen bir hata', body: 'Sayfa gösterilirken bir sorun oluştu. Devam etmek için yenileyin.', reload: 'Sayfayı yenile' },
  id: { title: 'Terjadi kesalahan', body: 'Terjadi masalah saat menampilkan halaman. Muat ulang untuk lanjut.', reload: 'Muat ulang' },
  ja: { title: '予期しないエラー', body: 'ページの表示中に問題が起きました。続行するには再読み込みしてください。', reload: '再読み込み' },
  ru: { title: 'Произошла ошибка', body: 'При показе страницы возникла проблема. Обновите страницу, чтобы продолжить.', reload: 'Обновить' },
};

function crashCopy() {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'ar';
  return { lang, copy: COPY[lang] || COPY.en, dir: lang === 'ar' ? 'rtl' as const : 'ltr' as const };
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const { copy, dir } = crashCopy();
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-[#0d0f12] p-4" dir={dir}>
          <div className="max-w-md w-full bg-white dark:bg-[#16181d] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl">
              
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {copy.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {copy.body}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-bold shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              {copy.reload}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
