import React, { useEffect, useRef } from 'react';
import { ArrowUp, FileText, Paperclip, X } from 'lucide-react';
import { toast } from '../../toastStore';
import { cn } from '../../lib/utils';
import {
  IMAGE_INTENT_OPTIONS,
  MAX_ATTACH_FILES,
  attachmentKind,
  attachmentRejectReason,
  filePreviewSrc,
  resolveAttachMime,
  uid,
  type ImageIntent,
  type PromptAttachment,
} from '../../lib/najePromptEngine';

interface PromptComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  attachments: PromptAttachment[];
  onAttachmentsChange: (files: PromptAttachment[]) => void;
  imageIntent: ImageIntent;
  onImageIntentChange: (intent: ImageIntent) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
    reader.readAsText(file);
  });
}

async function toAttachment(file: File): Promise<PromptAttachment> {
  const mime = resolveAttachMime(file);
  const kind = attachmentKind(mime, file.name);
  const data = await readAsDataUrl(file);
  const textContent = kind === 'text' ? await readAsText(file) : undefined;
  return {
    id: uid('f'),
    name: file.name,
    mimeType: mime === 'image/jpg' ? 'image/jpeg' : mime,
    size: file.size,
    data,
    kind,
    textContent,
  };
}

export function PromptComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'احكيلي شو بدك تعمل...',
  attachments,
  onAttachmentsChange,
  imageIntent,
  onImageIntentChange,
}: PromptComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  const canSend = !disabled && Boolean(value.trim() || attachments.length);
  const hasImage = attachments.some((f) => f.kind === 'image');

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const room = MAX_ATTACH_FILES - attachments.length;
    if (room <= 0) {
      toast.error('الحد 3 ملفات.');
      return;
    }
    const next: PromptAttachment[] = [...attachments];
    for (const file of incoming.slice(0, room)) {
      const reason = attachmentRejectReason(file);
      if (reason) {
        toast.error(reason);
        continue;
      }
      try {
        next.push(await toAttachment(file));
      } catch {
        toast.error('تعذر قراءة الملف.');
      }
    }
    if (incoming.length > room) toast.error('الحد 3 ملفات.');
    onAttachmentsChange(next);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (id: string) => {
    onAttachmentsChange(attachments.filter((f) => f.id !== id));
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-1.5">
          {attachments.map((file) => (
            <span
              key={file.id}
              className="relative inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 py-1 pl-7 pr-2 text-[11px] font-bold text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
            >
              {file.kind === 'image' ? (
                <img
                  src={filePreviewSrc(file)}
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <FileText className="h-4 w-4 text-indigo-500" />
              )}
              <span className="max-w-[120px] truncate" dir="auto">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                aria-label={`إزالة ${file.name}`}
                className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-naje-muted hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {hasImage && (
        <div className="mt-1.5 flex gap-1 px-2">
          {IMAGE_INTENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onImageIntentChange(opt.id)}
              className={cn(
                'min-h-8 rounded-full px-3 py-1 text-[11px] font-black transition',
                imageIntent === opt.id
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <textarea
          ref={ref}
          dir="rtl"
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="فكرتك"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-naje-ink placeholder:text-zinc-400 focus:outline-none disabled:opacity-60"
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,.png,.jpg,.jpeg,.webp,.pdf,.txt"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          aria-label="إرفاق ملف"
          className={cn(
            'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 text-naje-muted transition',
            'hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700',
          )}
        >
          <Paperclip className="h-4 w-4" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          disabled={!canSend}
          onClick={onSend}
          aria-label="إرسال"
          className={cn(
            'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition',
            'hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

export default PromptComposer;
