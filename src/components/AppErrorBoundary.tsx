import React from 'react';
export default class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error('App crashed:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" style={{ padding: 24, textAlign: 'center', color: '#e5e7eb', background: '#0d0f12', minHeight: '100vh' }}>
          <h2>حدث خطأ غير متوقع</h2>
          <p>نأسف على الإزعاج. أعد تحميل الصفحة للمتابعة.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer' }}>إعادة التحميل</button>
        </div>
      );
    }
    return this.props.children as any;
  }
}
