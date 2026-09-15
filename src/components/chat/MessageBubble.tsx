import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { 
  Check, Copy, Eye, Code2, FileText, Wand2, Paintbrush, Download, 
  History as HistoryIcon, Star, ThumbsUp, ThumbsDown, Image as ImageIcon, Video 
} from 'lucide-react';
import NajeSpinner from '../NajeSpinner';
import { parseUiMessage, AssistantTextMessage } from '../../pages/Chat';
import NajeErrorCard from '../NajeErrorCard';
import NajeThinking from '../NajeThinking';
import GroundingReportViewer from '../GroundingReportViewer';
import NajePreviewRenderer from '../NajePreviewRenderer';
import LocalMediaRenderer from '../LocalMediaRenderer';
import ImageZoomModal from '../ImageZoomModal';
import { Message, Chat } from '../../types';
import { toast } from '../../toastStore';

interface MessageBubbleProps {
  msg: Message;
  messages: Message[];
  chat: Chat | null;
  loading: boolean;
  setActiveUiTab: (tab: 'preview' | 'code') => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editInstruction: string;
  setEditInstruction: (val: string) => void;
  executeSubmission: (prompt: string) => void;
  selectedCoord: { msgId: string; x: number; y: number } | null;
  setSelectedCoord: (val: { msgId: string; x: number; y: number } | null) => void;
  setInpaintImageUrl: (url: string | null) => void;
  setInpaintMsgId: (id: string | null) => void;
  handleDownloadPNG: (msg: any) => void;
  exportingMsgPDFId: string | null;
  setActiveHistoryDocId: (id: string | null) => void;
  setActiveHistoryContent: (content: string | null) => void;
  handleFavorite: (id: string) => void;
  favorites: string[];
  openFeedback: (id: string, type: 'up' | 'down') => void;
  votedMessages: Record<string, 'up' | 'down'>;
  getLocalDoc: (id: string) => Promise<string | null>;
  downloadBase64File: (b64: string, filename: string, mimeType: string, options?: any) => void;
}

export default function MessageBubble({
  msg,
  messages,
  chat,
  loading,
  setActiveUiTab,
  editingMessageId,
  setEditingMessageId,
  editInstruction,
  setEditInstruction,
  executeSubmission,
  selectedCoord,
  setSelectedCoord,
  setInpaintImageUrl,
  setInpaintMsgId,
  handleDownloadPNG,
  exportingMsgPDFId,
  setActiveHistoryDocId,
  setActiveHistoryContent,
  handleFavorite,
  favorites,
  openFeedback,
  votedMessages,
  getLocalDoc,
  downloadBase64File
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [previewModalSrc, setPreviewModalSrc] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      toast.success('تم نسخ النص بنجاح');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`${msg.role === 'user' ? 'max-w-[85%] naje-glass-card py-3 px-5' : 'max-w-full sm:max-w-[95%] text-gray-900 dark:text-gray-200 py-1 w-full min-w-0'}`}>
        {msg.role === 'assistant' ? (
          chat?.type === 'ui' ? (
            (() => {
              const parsed = parseUiMessage(msg.content);
              if (parsed.hasHtml) {
                return (
                  <div className="space-y-3 w-full">
                    {parsed.chatText && (
                      <div className="p-3 bg-white/70 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-800 rounded-2xl text-xs leading-relaxed text-gray-800 dark:text-gray-200 shadow-sm">
                        <AssistantTextMessage content={parsed.chatText} isStreaming={loading && msg.id === messages[messages.length - 1]?.id} searchSources={(msg as any).searchSources} />
                      </div>
                    )}
                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm relative overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-gray-900 dark:text-white truncate">تم تحديث واجهة المستخدم بنجاح</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <NajeThinking size={18} className="shrink-0 animate-pulse" />
                        <button
                          type="button"
                          onClick={() => setActiveUiTab('preview')}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>المعاينة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveUiTab('code')}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>الكود</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else if (msg.content?.startsWith('__NAJE_ERROR_JSON__:')) {
                return <NajeErrorCard jsonContent={msg.content} />;
              } else {
                return <AssistantTextMessage content={msg.content} isStreaming={loading && msg.id === messages[messages.length - 1]?.id} searchSources={(msg as any).searchSources} />;
              }
            })()
          ) : msg.content?.startsWith('__NAJE_ERROR_JSON__:') ? (
            <NajeErrorCard jsonContent={msg.content} />
          ) : (
            <AssistantTextMessage content={msg.content} isStreaming={loading && msg.id === messages[messages.length - 1]?.id} searchSources={(msg as any).searchSources} />
          )
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
            {(msg as any).templateName && (
              <div className="inline-flex items-center gap-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold mb-1.5 border border-indigo-500/20">
                القالب: {(msg as any).templateName}
              </div>
            )}
            {msg.content && <div>{msg.content}</div>}
            {msg.files && msg.files.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {msg.files.map((f, i) => {
                  const fileSrc = (f as any).url || (f as any).storageUrl || (f.data ? (f.data.startsWith('data:') ? f.data : `data:${f.mimeType};base64,${f.data}`) : '');
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (fileSrc) {
                          setPreviewModalSrc(fileSrc);
                          setPreviewModalOpen(true);
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 w-20 h-20 shrink-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-2 select-none",
                        fileSrc ? "cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition active:scale-95" : ""
                      )}
                      title={f.name || 'ملف'}
                    >
                      {f.mimeType?.startsWith('video/') ? (
                        <Video className="w-6 h-6 text-indigo-500" />
                      ) : f.mimeType?.startsWith('image/') ? (
                        <ImageIcon className="w-6 h-6 text-amber-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-500" />
                      )}
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate w-full text-center">
                        {f.name || 'ملف'}
                      </span>
                      <span className="text-[9px] uppercase font-mono text-gray-400">
                        {f.mimeType?.split('/')[1] || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(msg as any).documentData && msg.role === 'assistant' && (
          <div className="mt-4 p-3 sm:p-4 naje-glass-card flex flex-wrap items-center justify-between gap-3 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <div className="font-semibold text-sm text-gray-900 dark:text-white truncate" dir="ltr">
                  {(msg as any).documentData.title || (msg as any).documentData.filename || (msg as any).documentData.name || "إنفوجرافيك بيانات"}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {(msg as any).documentData.spec ? 'إنفوجرافيك المصمم عالي الدقة' : `${((msg as any).documentData.extension || (msg as any).documentData.type || "DOC").toUpperCase()} Format`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(msg as any).documentData.pdfBase64 && (
                <button 
                  type="button"
                  onClick={() => {
                    downloadBase64File(
                      (msg as any).documentData.pdfBase64,
                      `${(msg as any).documentData.title || 'إنفوجرافيك'}.pdf`,
                      'application/pdf',
                      { prompt: (msg as any).documentData.title }
                    );
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:text-white bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-500 dark:hover:bg-amber-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 cursor-pointer whitespace-nowrap"
                >
                  تحميل PDF
                </button>
              )}
              <button 
                type="button"
                onClick={async () => {
                  let b64: string | null = null;
                  // 1) Prefer the server-verified permanent Storage URL (byte-perfect PDF/DOCX);
                  //    this bypasses the idb/base64 round-trip that produced invalid files.
                  const permUrl = (msg as any).documentData.url;
                  if (permUrl && (permUrl.startsWith('http://') || permUrl.startsWith('https://'))) {
                    b64 = permUrl;
                  }
                  if (!b64) {
                    const docId = (msg as any).documentData.id;
                    if (docId) {
                      try { b64 = await getLocalDoc(docId); }
                      catch(e) { console.error('Failed getLocalDoc by id:', e); }
                    }
                  }
                  if (!b64) {
                    b64 = (msg as any).documentData.base64 || (msg as any).mediaUrl || null;
                  }
                  if (b64 && b64.startsWith('local:')) {
                    const localId = b64.split('local:')[1];
                    try { b64 = await getLocalDoc(localId); }
                    catch(e) { console.error('Failed getLocalDoc by local prefix:', e); }
                  }
                  if (!b64) {
                    toast.error('الملف غير متوفر حالياً، يرجى إعادة التوليد.');
                    return;
                  }
                  const mimeType = (msg as any).documentData.mimeType || ((msg as any).documentData.type === 'pdf' ? 'application/pdf' : ((msg as any).documentData.type === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : (msg as any).documentData.spec ? 'image/png' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
                  const filename = (msg as any).documentData.filename || `${(msg as any).documentData.title || (msg as any).documentData.name || 'document'}.${(msg as any).documentData.extension || ((msg as any).documentData.spec ? 'png' : 'docx')}`;
                  const docTitle = (msg as any).documentData.title || (msg as any).documentData.name || msg.content;
                  downloadBase64File(b64, filename, mimeType, { prompt: docTitle });
                }} 
                className="text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-500 dark:hover:bg-indigo-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex-shrink-0 cursor-pointer whitespace-nowrap"
              >
                {(msg as any).documentData.spec ? 'تحميل PNG' : 'تحميل الملف'}
              </button>
            </div>
          </div>
        )}

        {(msg as any).documentData?.sources && Array.isArray((msg as any).documentData.sources) && (msg as any).documentData.sources.length > 0 && (
          <div className="mt-3">
            <AssistantTextMessage content="" searchSources={(msg as any).documentData.sources} />
          </div>
        )}

        {(msg as any).documentData?.groundingReport && (
          <GroundingReportViewer report={(msg as any).documentData.groundingReport} />
        )}

        {(msg as any).documentData?.slides && (
          <div className="mt-4">
            <NajePreviewRenderer slides={(msg as any).documentData.slides} />
          </div>
        )}

        {msg.mediaUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm max-w-xl bg-black/5 dark:bg-black/30">
            <LocalMediaRenderer 
              msg={msg} 
              chatType={chat?.type || ''} 
              onImageClick={editingMessageId === msg.id && chat?.type === 'image' ? (x, y) => setSelectedCoord({msgId: msg.id, x, y}) : undefined}
              selectedCoord={selectedCoord?.msgId === msg.id ? {x: selectedCoord.x, y: selectedCoord.y} : null}
            />
          </div>
        )}

        {msg.role === 'assistant' && (
          <div className="mt-3 flex items-center gap-1.5 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-sm max-w-fit flex-wrap">
            {msg.mediaUrl && chat?.type !== 'text' && msg.mediaType !== 'audio' && (
              <button
                type="button"
                onClick={() => setEditingMessageId(editingMessageId === msg.id ? null : msg.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95",
                  editingMessageId === msg.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
                title="تعديل أو إعادة تصميم هذه الصورة"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            )}

            {msg.mediaUrl && msg.mediaType !== 'video' && msg.mediaType !== 'audio' && (
              <button
                type="button"
                onClick={async () => {
                  let b64 = msg.mediaUrl;
                  if (b64 && b64.startsWith('local:')) {
                    const id = b64.split('local:')[1];
                    const doc = await getLocalDoc(id);
                    b64 = doc || undefined;
                  }
                  if (b64) {
                    const fullUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
                    setInpaintImageUrl(fullUrl);
                    setInpaintMsgId(msg.id);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                title="أداة الفرشاة والممحاة (Inpaint) لتعديل جزء محدد"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>الفرشاة</span>
              </button>
            )}

            {msg.mediaUrl && (
              <button
                type="button"
                onClick={() => handleDownloadPNG(msg)}
                disabled={exportingMsgPDFId === msg.id}
                className="p-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50 active:scale-95"
                title={msg.mediaType === 'audio' ? 'تحميل التسجيل الصوتي (WAV)' : 'تحميل الملف'}
              >
                {exportingMsgPDFId === msg.id ? (
                  <NajeSpinner className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyMessage}
              className={cn(
                "p-1.5 rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1",
                copied ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={copied ? "تم النسخ" : "نسخ النص"}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveHistoryDocId(msg.id);
                setActiveHistoryContent(msg.content);
              }}
              className="p-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition cursor-pointer active:scale-95"
              title="سجل التغييرات والإصدارات"
            >
              <HistoryIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleFavorite(msg.id)}
              className={cn(
                "p-1.5 rounded-xl transition cursor-pointer active:scale-95",
                favorites.includes(msg.id) ? "text-amber-500 bg-amber-500/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={favorites.includes(msg.id) ? "محفوظة" : "حفظ في المفضلة"}
            >
              <Star className={cn("w-4 h-4", favorites.includes(msg.id) && "fill-current")} />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 my-auto mx-0.5" />

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => openFeedback(msg.id, 'up')}
                title="مفيد"
                className={cn(
                  "p-1.5 rounded-xl transition cursor-pointer active:scale-95",
                  votedMessages[msg.id] === 'up' ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" : "text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ThumbsUp className={cn("w-3.5 h-3.5", votedMessages[msg.id] === 'up' && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={() => openFeedback(msg.id, 'down')}
                title="غير مفيد"
                className={cn(
                  "p-1.5 rounded-xl transition cursor-pointer active:scale-95",
                  votedMessages[msg.id] === 'down' ? "text-rose-500 bg-rose-500/10" : "text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ThumbsDown className={cn("w-3.5 h-3.5", votedMessages[msg.id] === 'down' && "fill-current")} />
              </button>
            </div>
          </div>
        )}

        {editingMessageId === msg.id && (
          <div className="flex gap-2 mt-2">
            <input 
              value={editInstruction}
              onChange={e => setEditInstruction(e.target.value)}
              placeholder="اكتب تعديلك هنا..."
              onKeyDown={e => {
                if (e.key === 'Enter' && editInstruction.trim()) {
                  e.preventDefault();
                  executeSubmission(editInstruction);
                  setEditInstruction('');
                }
              }}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-gray-900 dark:white"
            />
            <button 
              type="button"
              onClick={() => {
                if (!editInstruction.trim()) return;
                executeSubmission(editInstruction);
                setEditInstruction('');
              }} 
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium text-white transition active:scale-95 cursor-pointer shadow-sm"
            >
              تطبيق
            </button>
            <button 
              type="button"
              onClick={() => setEditingMessageId(null)} 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        )}

        {previewModalOpen && previewModalSrc && (
          <ImageZoomModal
            isOpen={previewModalOpen}
            src={previewModalSrc}
            onClose={() => {
              setPreviewModalOpen(false);
              setPreviewModalSrc(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
