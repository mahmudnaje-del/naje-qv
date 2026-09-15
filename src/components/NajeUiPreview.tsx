import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Monitor, Download, Copy, Maximize, RotateCw, Target, ExternalLink, BookmarkCheck, History, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from '../toastStore';
import { triggerSmartDownload } from '../stores/smartDownloadStore';

interface NajeUiPreviewProps {
  rawHtml: string;
  isStreaming?: boolean;
  readOnly?: boolean;
  onRegenerate?: () => void;
  onSelectElement?: (element: { desc: string; html: string }) => void;
  onSaveToProject?: () => void;
  onOpenHistory?: () => void;
  onAutoRepair?: (errorMessage: string, line: number) => void;
}

function wrapSafe(html: string): string {
  const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:;">`;
  
  const ERROR_SCRIPT = `<script>
(function(){
  function report(payload){
    try { parent.postMessage({type:'naje:runtime-error', ...payload}, '*'); } catch(e){}
  }
  window.addEventListener('error', function(e){
    report({ message: e.message || 'Script error', line: e.lineno || 0, col: e.colno || 0, stack: e.error ? e.error.stack : '' });
  });
  window.addEventListener('unhandledrejection', function(e){
    report({ message: 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || e.reason) : ''), line: 0, col: 0, stack: e.reason ? e.reason.stack : '' });
  });
})();
</script>`;
  
  const NAJE_DESIGN_KIT_CSS = `<style>
:root {
  --naje-radius-sm: 8px; --naje-radius-md: 14px; --naje-radius-lg: 24px;
  --naje-shadow-sm: 0 1px 3px rgba(0,0,0,.08);
  --naje-shadow-md: 0 4px 16px rgba(0,0,0,.12);
  --naje-shadow-lg: 0 12px 32px rgba(0,0,0,.18);
  --naje-space-1: 4px; --naje-space-2: 8px; --naje-space-3: 16px;
  --naje-space-4: 24px; --naje-space-5: 40px; --naje-space-6: 64px;
}
.naje-card { border-radius: var(--naje-radius-md); box-shadow: var(--naje-shadow-md); }
.naje-btn { border-radius: var(--naje-radius-sm); padding: 10px 20px; font-weight: 600; transition: transform .15s, box-shadow .15s; cursor: pointer; }
.naje-btn:active { transform: scale(0.97); }
.naje-btn-primary { background: var(--naje-primary, #8B5CF6); color: #fff; border: none; }
.naje-input { border-radius: var(--naje-radius-sm); border: 1px solid #e2e8f0; padding: 10px 14px; }

@keyframes najeFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes najeScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.naje-fade-in { animation: najeFadeIn 0.4s ease-out forwards; }
.naje-slide-up { animation: najeFadeIn 0.5s ease-out forwards; }
.naje-scale-in { animation: najeScaleIn 0.35s ease-out forwards; }
.naje-stagger > * { animation: najeFadeIn 0.4s ease-out forwards; }
.naje-stagger > *:nth-child(1) { animation-delay: 0.05s; }
.naje-stagger > *:nth-child(2) { animation-delay: 0.1s; }
.naje-stagger > *:nth-child(3) { animation-delay: 0.15s; }
.naje-stagger > *:nth-child(4) { animation-delay: 0.2s; }
</style>`;

  const ICON_SPRITE = `<svg style="display:none;" xmlns="http://www.w3.org/2000/svg">
<symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></symbol>
<symbol id="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
<symbol id="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
<symbol id="icon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></symbol>
<symbol id="icon-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></symbol>
<symbol id="icon-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></symbol>
<symbol id="icon-star" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></symbol>
<symbol id="icon-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>
<symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></symbol>
<symbol id="icon-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></symbol>
<symbol id="icon-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></symbol>
<symbol id="icon-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></symbol>
<symbol id="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
<symbol id="icon-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></symbol>
</svg>`;

  const CHART_SCRIPT = `<script>
window.najeChart = function(target, options) {
  var el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el || !options || !options.data) return;
  var type = options.type || 'bar';
  var data = options.data || [];
  var colors = options.colors || ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  var html = '';
  if (type === 'bar') {
    var max = Math.max.apply(Math, data.map(function(d){ return typeof d === 'number' ? d : d.value; }).concat([1]));
    html = '<div style="display:flex;align-items:flex-end;gap:8px;height:140px;padding:8px 0;">' +
      data.map(function(d, i) {
        var val = typeof d === 'number' ? d : d.value;
        var label = typeof d === 'number' ? '' : (d.label || '');
        var pct = Math.round((val / max) * 100);
        var col = colors[i % colors.length];
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">' +
          '<div style="width:100%;height:' + pct + '%;background:' + col + ';border-radius:4px 4px 0 0;transition:height 0.5s ease;"></div>' +
          (label ? '<span style="font-size:10px;margin-top:4px;color:#6b7280;white-space:nowrap;">' + label + '</span>' : '') +
          '</div>';
      }).join('') + '</div>';
  } else if (type === 'donut') {
    var total = data.reduce(function(a, b){ return a + (typeof b === 'number' ? b : b.value); }, 0) || 1;
    var cum = 0;
    var slices = data.map(function(d, i) {
      var val = typeof d === 'number' ? d : d.value;
      var label = typeof d === 'number' ? '' : (d.label || '');
      var pct = (val / total) * 100;
      var stroke = colors[i % colors.length];
      var dash = pct + ' ' + (100 - pct);
      var offset = 100 - cum + 25;
      cum += pct;
      return { stroke: stroke, dash: dash, offset: offset, label: label, val: val };
    });
    html = '<div style="display:flex;align-items:center;gap:16px;">' +
      '<svg viewBox="0 0 42 42" style="width:100px;height:100px;transform:rotate(-90deg);">' +
      slices.map(function(s){ return '<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="' + s.stroke + '" stroke-width="6" stroke-dasharray="' + s.dash + '" stroke-dashoffset="' + s.offset + '"/>'; }).join('') +
      '</svg>' +
      '<div style="display:flex;flex-direction:column;gap:4px;">' +
      slices.map(function(s){ return '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#374151;"><span style="width:8px;height:8px;border-radius:50%;background:' + s.stroke + ';"></span><span>' + s.label + ' (' + s.val + ')</span></div>'; }).join('') +
      '</div></div>';
  } else {
    var maxL = Math.max.apply(Math, data.map(function(d){ return typeof d === 'number' ? d : d.value; }).concat([1]));
    var pts = data.map(function(d, i) {
      var val = typeof d === 'number' ? d : d.value;
      var x = (i / Math.max(data.length - 1, 1)) * 280 + 10;
      var y = 110 - (val / maxL) * 90;
      return x + ',' + y;
    }).join(' ');
    html = '<svg viewBox="0 0 300 120" style="width:100%;height:140px;">' +
      '<polyline fill="none" stroke="' + colors[0] + '" stroke-width="3" stroke-linecap="round" points="' + pts + '"/>' +
      '</svg>';
  }
  el.innerHTML = html;
};
</script>`;

  const SELECT_SCRIPT = `<script>
(function(){
  let on=false, last=null;
  function scrollToBottom() {
    window.scrollTo(0, Math.max(document.body ? document.body.scrollHeight : 0, document.documentElement ? document.documentElement.scrollHeight : 0));
  }
  window.addEventListener('message', function(e){
    if(e.data==='naje:select-on') on=true;
    if(e.data==='naje:select-off'){ on=false; if(last) last.style.outline=''; }
    if(e.data==='naje:scroll-bottom'){ scrollToBottom(); }
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrollToBottom);
  } else {
    scrollToBottom();
  }
  document.addEventListener('mouseover', function(e){
    if(!on) return;
    if(last) last.style.outline='';
    last=e.target;
    last.style.outline='2px solid #D4AF37';
  }, true);
  document.addEventListener('click', function(e){
    if(!on) return;
    e.preventDefault();
    e.stopPropagation();
    const el=e.target;
    const desc = (el.tagName ? el.tagName.toLowerCase() : 'element') +
      (el.className ? (' .' + String(el.className).split(' ')[0]) : '') +
      (el.textContent ? (' — "' + el.textContent.trim().slice(0,30) + '"') : '');
    parent.postMessage({
      type: 'naje:selected',
      desc: desc,
      html: el.outerHTML ? el.outerHTML.slice(0,400) : ''
    }, '*');
    on=false;
    if(last) last.style.outline='';
  }, true);
})();
</script>`;

  let cleanHtml = html;
  const match = html.match(/(<!DOCTYPE\s+html[\s\S]*|<html[\s\S]*)/i);
  if (match) {
    cleanHtml = match[1];
    const endMatch = cleanHtml.match(/([\s\S]*?<\/html>)/i);
    if (endMatch) {
      cleanHtml = endMatch[1];
    }
  }

  let doc = cleanHtml.replace(/```html?/gi, '').replace(/```/g, '').trim();
  if (/<head[^>]*>/i.test(doc)) {
    doc = doc.replace(/<head([^>]*)>/i, `<head$1>\n  ${CSP}\n  ${NAJE_DESIGN_KIT_CSS}\n  ${CHART_SCRIPT}`);
  } else if (/<html[^>]*>/i.test(doc)) {
    doc = doc.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n  ${CSP}\n  ${NAJE_DESIGN_KIT_CSS}\n  ${CHART_SCRIPT}\n</head>`);
  } else {
    doc = `<!DOCTYPE html>\n<html>\n<head>\n  ${CSP}\n  ${NAJE_DESIGN_KIT_CSS}\n  ${CHART_SCRIPT}\n</head>\n<body>\n${doc}\n</body>\n</html>`;
  }

  const INJECTIONS = `${ICON_SPRITE}\n${SELECT_SCRIPT}\n${ERROR_SCRIPT}`;

  if (doc.includes('</body>')) {
    doc = doc.replace('</body>', `${INJECTIONS}\n</body>`);
  } else if (doc.includes('</html>')) {
    doc = doc.replace('</html>', `${INJECTIONS}\n</html>`);
  } else {
    doc += `\n${INJECTIONS}`;
  }

  return doc;
}

export default function NajeUiPreview({
  rawHtml,
  isStreaming,
  readOnly = false,
  onRegenerate,
  onSelectElement,
  onSaveToProject,
  onOpenHistory,
  onAutoRepair
}: NajeUiPreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [device, setDevice] = useState<'phone' | 'laptop'>(window.innerWidth < 768 ? 'phone' : 'laptop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDoneBadge, setShowDoneBadge] = useState(false);
  const [autoRepairNotice, setAutoRepairNotice] = useState<string | null>(null);
  const [autoRepairCount, setAutoRepairCount] = useState<number>(0);
  const autoRepairTimerRef = useRef<any>(null);
  const wasStreamingRef = useRef(false);

  const DEVICE_WIDTH = { phone: 390, laptop: 1280 } as const;
  const DEVICE_HEIGHT = { phone: 844, laptop: 800 } as const;

  useEffect(() => {
    if (!wrapperRef.current) return;
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const targetW = DEVICE_WIDTH[device];
        const targetH = DEVICE_HEIGHT[device];
        const availW = Math.max(100, rect.width - 24);
        const availH = Math.max(100, rect.height - 24);
        const computedScale = Math.min(1, availW / targetW, availH / targetH);
        setScale(computedScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [device, isFullscreen]);

  useEffect(() => {
    const handleResize = () => {
      if (!isFullscreen && window.innerWidth < 768) setDevice('phone');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRenderedHtml(wrapSafe(rawHtml));
    }, 250);
    return () => clearTimeout(t);
  }, [rawHtml]);

  // Status badge transition
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && rawHtml) {
      setShowDoneBadge(true);
      const timer = setTimeout(() => setShowDoneBadge(false), 2500);
      return () => clearTimeout(timer);
    }
    wasStreamingRef.current = !!isStreaming;
  }, [isStreaming, rawHtml]);

  // Selection mode & Runtime error postMessage listener
  useEffect(() => {
    if (readOnly) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'naje:selected') {
        setIsSelectMode(false);
        const { desc, html } = e.data;
        if (onSelectElement && desc) {
          onSelectElement({ desc, html });
          toast.success(`تم تحديد العنصر: ${desc}`);
        }
      } else if (e.data && e.data.type === 'naje:runtime-error') {
        const { message, line } = e.data;
        console.warn('[Naje UI Runtime Error]:', message, 'line:', line);
        if (onAutoRepair && !isStreaming) {
          if (autoRepairCount < 2) {
            setAutoRepairNotice('لوحظ خطأ أثناء التجربة — جاري الإصلاح التلقائي...');
            if (autoRepairTimerRef.current) clearTimeout(autoRepairTimerRef.current);
            autoRepairTimerRef.current = setTimeout(() => {
              setAutoRepairCount(c => c + 1);
              onAutoRepair(message, line || 0);
              setTimeout(() => setAutoRepairNotice(null), 4000);
            }, 600);
          } else {
            setAutoRepairNotice('تكرر الخطأ البرمجي في هذه الواجهة. يمكنك النقر على "أصلح" للإصلاح التلقائي.');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectElement, onAutoRepair, isStreaming, autoRepairCount]);

  const toggleSelectMode = () => {
    const nextState = !isSelectMode;
    setIsSelectMode(nextState);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(nextState ? 'naje:select-on' : 'naje:select-off', '*');
    }
    if (nextState) {
      toast.info('انقر على أي عنصر داخل الواجهة لتحديده للتعديل');
    }
  };

  useEffect(() => {
    // Auto-scroll iframe if streaming via postMessage
    if (isStreaming && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage('naje:scroll-bottom', '*');
      } catch (e) {
        // ignore cross-origin restrictions
      }
    }
  }, [renderedHtml, isStreaming]);

  const handleDownload = () => {
    triggerSmartDownload({
      data: renderedHtml,
      content: renderedHtml,
      mimeType: 'text/html',
      ext: 'html',
      fallbackName: 'واجهة_تطبيق_ناجي',
    });
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([renderedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedHtml).then(() => {
      setCopied(true);
      toast.success('تم نسخ كود HTML بنجاح');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('حدث خطأ أثناء النسخ');
    });
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full bg-slate-50 dark:bg-[#0c0e14] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all",
      isFullscreen ? "fixed inset-0 z-50 rounded-none m-0 p-4 pb-20 bg-slate-100 dark:bg-black/90" : "my-4"
    )}>
      {/* Top controls */}
      <div className="flex items-center justify-between w-full p-3 bg-white dark:bg-[#11141c] border-b border-slate-200 dark:border-slate-800">
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
          <button 
            onClick={() => setDevice('phone')}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer", device === 'phone' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>جوال</span>
          </button>
          <button 
            onClick={() => setDevice('laptop')}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer", device === 'laptop' ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>لابتوب</span>
          </button>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[11px] font-bold border border-indigo-200 dark:border-indigo-500/20"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>ناجي يبني واجهتك…</span>
              </motion.div>
            )}
            {showDoneBadge && !isStreaming && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>جاهزة</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Auto Repair Notice Banner */}
      {autoRepairNotice && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-2 text-xs font-medium flex items-center justify-between gap-2">
          <span>{autoRepairNotice}</span>
          {autoRepairCount >= 2 && onAutoRepair && (
            <button
              type="button"
              onClick={() => {
                setAutoRepairNotice('جاري طلب الإصلاح التلقائي...');
                onAutoRepair('طلب تصليح برمجيات من المستخدم', 0);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition shadow-sm"
            >
              أصلح الواجهة الآن
            </button>
          )}
        </div>
      )}

      {/* Frame wrapper */}
      <div 
        ref={wrapperRef}
        className={cn(
          "relative flex items-center justify-center bg-slate-100/50 dark:bg-black/20 overflow-hidden w-full transition-all duration-300 p-2",
          isFullscreen ? "h-full flex-1" : "min-h-[500px] h-[70vh]"
        )}
      >
        <div
          style={{
            width: DEVICE_WIDTH[device] * scale,
            height: DEVICE_HEIGHT[device] * scale,
            position: 'relative',
            overflow: 'hidden'
          }}
          className="flex items-center justify-center transition-all duration-300"
        >
          <div
            style={{
              width: DEVICE_WIDTH[device],
              height: DEVICE_HEIGHT[device],
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            className={cn(
              "relative flex flex-col overflow-hidden bg-white transition-all duration-300",
              device === 'phone' 
                ? "rounded-[40px] shadow-2xl border-[12px] border-slate-900" 
                : "rounded-lg shadow-2xl border border-slate-300 dark:border-slate-700"
            )}
          >
            {device === 'laptop' && (
              <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center px-3 gap-1.5 z-10 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={renderedHtml}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              title="معاينة الواجهة"
              style={{
                width: DEVICE_WIDTH[device],
                height: device === 'laptop' ? DEVICE_HEIGHT[device] - 32 : DEVICE_HEIGHT[device] - 24
              }}
              className="w-full border-0 bg-white flex-1"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {!isStreaming && (
        <div className="flex items-center justify-center gap-2 p-3 w-full bg-white dark:bg-[#11141c] border-t border-slate-200 dark:border-slate-800 flex-wrap">
          {onSelectElement && (
            <button 
              onClick={toggleSelectMode}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer border",
                isSelectMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-md animate-pulse"
                  : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100"
              )}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isSelectMode ? 'انقر عنصرًا للإنهاء' : 'اختر عنصر للتعديل'}</span>
            </button>
          )}

          {onOpenHistory && (
            <button onClick={onOpenHistory} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
              <History className="w-3.5 h-3.5" />
              <span>النسخ السابقة</span>
            </button>
          )}

          {onSaveToProject && (
            <button onClick={onSaveToProject} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition cursor-pointer">
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>حفظ في المشروع</span>
            </button>
          )}

          {onRegenerate && (
            <button onClick={onRegenerate} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة توليد</span>
            </button>
          )}

          <button onClick={handleOpenNewTab} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>تبويب جديد</span>
          </button>

          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>تنزيل HTML</span>
          </button>

          <button onClick={handleCopy} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer", copied ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <Maximize className="w-3.5 h-3.5" />
            <span>{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
