import React, { useState, useEffect } from 'react';
import { useSmartDownloadStore } from '../stores/smartDownloadStore';
import { sanitizeFilename } from '../utils/smartNamingGateway';
import { Sparkles, Download, X, FileText, Code, Image as ImageIcon, FileSpreadsheet, Check, RefreshCw, Wand2, ShieldCheck } from 'lucide-react';

export default function SmartDownloadGatewayModal() {
  const {
    isOpen,
    request,
    suggestedFilename,
    autoDownloadEnabled,
    closeGateway,
    confirmDownload,
    setAutoDownload,
    regenerateName,
  } = useSmartDownloadStore();

  const [filenameInput, setFilenameInput] = useState('');

  useEffect(() => {
    setFilenameInput(suggestedFilename);
  }, [suggestedFilename]);

  if (!isOpen || !request) return null;

  const ext = (request.ext || 'html').toLowerCase().replace(/^\./, '');
  const baseNameOnly = filenameInput.replace(new RegExp(`\\.${ext}$`, 'i'), '');

  const getFileIcon = () => {
    if (ext === 'html' || ext === 'htm' || ext === 'js' || ext === 'css') {
      return <Code className="w-6 h-6 text-indigo-500" />;
    }
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'pptx') {
      return <FileText className="w-6 h-6 text-rose-500" />;
    }
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'svg') {
      return <ImageIcon className="w-6 h-6 text-amber-500" />;
    }
    if (ext === 'csv' || ext === 'xlsx' || ext === 'json') {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
    }
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeBaseName = sanitizeFilename(baseNameOnly) || sanitizeFilename(suggestedFilename.replace(new RegExp(`\\.${ext}$`, 'i'), ''));
    confirmDownload(`${safeBaseName}.${ext}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#111520] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <span>بوابة التسمية الذكية للملفات</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-sans">
                  Smart Naje Gateway
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                تم تحليل محتوى الملف واقتراح اسم ذكي ومُعبر تلقائياً
              </p>
            </div>
          </div>

          <button
            onClick={closeGateway}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* File Card Summary */}
          <div className="p-4 bg-slate-50 dark:bg-[#161b26] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center gap-3.5">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
              {getFileIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  صيغة الملف:
                </span>
                <span className="uppercase text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-900/40">
                  .{ext}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-1">
                {request.prompt ? `الأمر: "${request.prompt.slice(0, 40)}..."` : 'محتوى معالج بذكاء اصطناعي عالِ الدقة'}
              </p>
            </div>
          </div>

          {/* Filename Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>الاسم المقترح للملف (قابل للتعديل):</span>
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">مبني على المحتوى</span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                value={baseNameOnly}
                onChange={(e) => setFilenameInput(e.target.value.replace(new RegExp(`\\.${ext}$`, 'i'), ''))}
                className="w-full px-4 py-3 bg-white dark:bg-[#0c0e14] border border-indigo-300 dark:border-indigo-900/60 rounded-2xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition pl-12 pr-16"
                dir="auto"
                autoFocus
              />
              {/* Fixed, non-editable extension suffix, always visible, never part of the editable value */}
              <span className="absolute right-4 text-sm font-mono font-bold text-gray-500 dark:text-gray-400 pointer-events-none select-none">
                .{ext}
              </span>
              <button
                type="button"
                onClick={() => setFilenameInput(suggestedFilename.replace(new RegExp(`\\.${ext}$`, 'i'), ''))}
                title="إعادة للعنوان الافتراضي"
                className="absolute left-3 p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick AI Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">اختصارات سريعة:</span>
            <button
              type="button"
              onClick={() => regenerateName('short')}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer"
            >
              اسم مختصر
            </button>
            <button
              type="button"
              onClick={() => regenerateName('date')}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer"
            >
              إضافة التاريخ
            </button>
            <button
              type="button"
              onClick={() => regenerateName('arabic')}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer"
            >
              بادئة تطبيق
            </button>
          </div>

          {/* Always Auto Download Preference Checkbox */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoDownloadEnabled}
                onChange={(e) => setAutoDownload(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>التنزيل الذكي المباشر دائماً (تجاوز النافذة مستقبلاً)</span>
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل الملف باسمه الذكي</span>
            </button>

            <button
              type="button"
              onClick={closeGateway}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition cursor-pointer text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
