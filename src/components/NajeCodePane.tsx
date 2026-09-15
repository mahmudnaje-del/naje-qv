import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Check, Code2 } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { toast } from '../toastStore';
import { triggerSmartDownload } from '../stores/smartDownloadStore';

interface NajeCodePaneProps {
  code: string;
  isStreaming?: boolean;
  language?: string;
  fileName?: string;
  title?: string;
  onDownload?: () => void;
}

export default function NajeCodePane({ 
  code, 
  isStreaming, 
  language = 'xml', 
  fileName = 'index.html',
  title = 'كود HTML المصدري',
  onDownload
}: NajeCodePaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);

  const formattedLines = code ? code.split('\n') : [''];
  const lineCount = formattedLines.length;

  useEffect(() => {
    if (isStreaming && !userScrolled && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [code, isStreaming, userScrolled]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (!isAtBottom) {
      setUserScrolled(true);
    } else {
      setUserScrolled(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('تم نسخ الكود بنجاح');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('تعذّر نسخ الكود');
    });
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const ext = fileName.includes('.') ? fileName.split('.').pop() || 'txt' : 'html';
    const mimeType = ext === 'html' ? 'text/html' : ext === 'json' ? 'application/json' : ext === 'ts' || ext === 'tsx' ? 'text/plain' : 'text/plain';
    
    triggerSmartDownload({
      data: code,
      content: code,
      mimeType,
      ext,
      fallbackName: fileName.replace(/\.[^/.]+$/, "") || 'code_file',
    });
  };

  const sanitizeHighlightHtml = (html: string): string => {
    if (!html) return '';
    // Strip script, style, iframe tags and contents
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove any on* event handler attributes and javascript: URIs
    cleaned = cleaned
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, '')
      .replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, '');

    // Allow only span, code, pre, br tags (optionally with class attribute)
    // Replace any other tag with escaped or stripped version
    cleaned = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
      const lowerTag = tag.toLowerCase();
      if (['span', 'code', 'pre', 'br'].includes(lowerTag)) {
        if (match.startsWith('</')) {
          return `</${lowerTag}>`;
        }
        // Extract only class attribute if present
        const classMatch = attrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const classAttr = classMatch ? ` class="${(classMatch[1] || classMatch[2] || classMatch[3] || '').replace(/"/g, '&quot;')}"` : '';
        return `<${lowerTag}${classAttr}>`;
      }
      return '';
    });

    return cleaned;
  };

  const highlightedCode = React.useMemo(() => {
    if (!code) return '';
    let result = '';
    try {
      if (language && hljs.getLanguage(language)) {
        result = hljs.highlight(code, { language }).value;
      } else {
        result = hljs.highlightAuto(code).value;
      }
    } catch {
      result = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    return sanitizeHighlightHtml(result);
  }, [code, language]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] text-[#c9d1d9] rounded-2xl border border-gray-800 overflow-hidden font-mono text-xs shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-sans font-bold text-gray-200 truncate">{fileName || title}</span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-sans shrink-0">
            {lineCount} سطر
          </span>
          {language && (
            <span className="text-[9px] uppercase font-bold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded shrink-0 font-mono">
              {language}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-sans animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              جاري البث…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-lg transition active:scale-[0.97] cursor-pointer"
            title="نسخ الكود"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans font-medium text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-lg transition active:scale-[0.97] cursor-pointer"
            title="تنزيل الملف"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تنزيل</span>
          </button>
        </div>
      </div>

      {/* Code Container with line numbers */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4 flex gap-4 leading-relaxed"
        dir="ltr"
      >
        {/* Line Numbers */}
        <div className="select-none text-right text-gray-600 font-mono text-[11px] pr-2 border-r border-gray-800/60 shrink-0">
          {formattedLines.map((_, i) => (
            <div key={i} className="h-5 flex items-center justify-end">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Highlighted Code Content */}
        <pre className="flex-1 font-mono text-[12px] whitespace-pre overflow-x-auto selection:bg-indigo-500/30">
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
}
