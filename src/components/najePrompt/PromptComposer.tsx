import React, { useEffect, useRef } from 'react';
import { ArrowUp, FileText, Paperclip, Square, X } from 'lucide-react';
import { toast } from '../../toastStore';
import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n';
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
import { engineMessageKey } from './promptLabels';
import SmokeChatWrapper from '../chat/SmokeChatWrapper';
import { useLivePlaceholder, PROMPT_STUDIO_PHRASES } from '../../hooks/useLivePlaceholder';
import NajeModelTierSelector, { ModelTier } from '../NajeModelTierSelector';

interface PromptComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  attachments: PromptAttachment[];
  onAttachmentsChange: (files: PromptAttachment[]) => void;
  imageIntent: ImageIntent;
  onImageIntentChange: (intent: ImageIntent) => void;
  modelTier?: ModelTier;
  onModelTierChange?: (tier: ModelTier) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read'));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read'));
    reader.readAsText(file);
  });
}

async function extractDocxText(file: File): Promise<string> {
  const mod = await import('mammoth');
  const mammoth = (mod as { default?: unknown } & Record<string, unknown>).default || mod;
  const extract = (mammoth as { extractRawText?: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> }).extractRawText;
  if (!extract) throw new Error('docx');
  const result = await extract({ arrayBuffer: await file.arrayBuffer() });
  return String(result?.value || '').trim();
}
async function toAttachment(file: File): Promise<PromptAttachment> {
  const mime = resolveAttachMime(file);
  const kind = attachmentKind(mime, file.name);
  const data = kind === 'docx' ? '' : await readAsDataUrl(file);
  let textContent: string | undefined;
  if (kind === 'text') textContent = await readAsText(file);
  if (kind === 'docx') textContent = await extractDocxText(file);
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
  onStop,
  disabled,
  busy,
  placeholder,
  attachments,
  onAttachmentsChange,
  imageIntent,
  onImageIntentChange,
  modelTier,
  onModelTierChange,
}: PromptComposerProps) {
  const { t, isRtl } = useI18n();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dynamicPlaceholder = useLivePlaceholder(PROMPT_STUDIO_PHRASES);
  const hint = placeholder || dynamicPlaceholder || t('prompt.composer.placeholder');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  const canSend = !disabled && !busy && Boolean(value.trim() || attachments.length);
  const hasImage = attachments.some((f) => f.kind === 'image');

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    const room = MAX_ATTACH_FILES - attachments.length;
    if (room <= 0) {
      toast.error(t('prompt.composer.fileLimit'));
      return;
    }
    const next: PromptAttachment[] = [...attachments];
    for (const file of incoming.slice(0, room)) {
      const reason = attachmentRejectReason(file);
      if (reason) {
        const key = engineMessageKey(reason);
        toast.error(key ? t(key) : reason);
        continue;
      }
      try {
        next.push(await toAttachment(file));
      } catch {
        toast.error(t('prompt.composer.fileRead'));
      }
    }
    if (incoming.length > room) toast.error(t('prompt.composer.fileLimit'));
    onAttachmentsChange(next);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (id: string) => {
    onAttachmentsChange(attachments.filter((f) => f.id !== id));
  };

  return (
    <SmokeChatWrapper className="w-full" chatType="najePrompt">
      <div
        className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-1"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Badges placed on their own row - fitted naturally on a single line with smooth scroll */}
        {modelTier && onModelTierChange && (
          <div className="flex items-center justify-between gap-1 sm:gap-2 px-1.5 pt-0.5 empty:hidden relative z-30 max-w-full overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
              <NajeModelTierSelector
                value={modelTier}
                onChange={onModelTierChange}
                disabled={disabled || busy}
                className="shrink-0"
              />
            </div>
          </div>
        )}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-1.5">
          {attachments.map((file) => (
            <span
              key={file.id}
              className="relative inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 py-1 ps-2 pe-12 text-[11px] font-bold text-naje-ink dark:border-zinc-700 dark:bg-zinc-950"
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
                aria-label={t('prompt.composer.removeFile', { name: file.name })}
                className="absolute end-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-naje-muted hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
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
                'min-h-11 rounded-full px-3 py-1 text-[11px] font-black transition',
                imageIntent === opt.id
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-200 text-naje-muted hover:text-naje-ink dark:border-zinc-700',
              )}
            >
              {t(opt.id === 'rebuild' ? 'prompt.intent.rebuild' : 'prompt.intent.inspire')}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <textarea
          ref={ref}
          dir={isRtl ? 'rtl' : 'ltr'}
          rows={1}
          value={value}
          disabled={disabled || busy}
          placeholder={hint}
          aria-label={t('prompt.composer.ideaAria')}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-start text-sm leading-relaxed text-naje-ink placeholder:text-zinc-400 focus:outline-none disabled:opacity-60"
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,.png,.jpg,.jpeg,.webp,.pdf,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
          }}
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
          aria-label={t('prompt.composer.attach')}
          className={cn(
            'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 text-naje-muted transition',
            'hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700',
          )}
        >
          <Paperclip className="h-4 w-4" strokeWidth={2.4} />
        </button>
        {busy && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t('prompt.composer.stop')}
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white transition hover:bg-rose-500"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={2.6} />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canSend}
            onClick={onSend}
            aria-label={t('prompt.composer.send')}
            className={cn(
              'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition',
              'hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </div>
    </SmokeChatWrapper>
  );
}

export default PromptComposer;
