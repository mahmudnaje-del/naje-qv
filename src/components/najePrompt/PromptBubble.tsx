import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import {
  filePreviewSrc,
  type ImageIntent,
  type PromptAttachment,
} from '../../lib/najePromptEngine';
import { useI18n } from '../../i18n';

interface PromptBubbleProps {
  text: string;
  files?: PromptAttachment[];
  imageIntent?: ImageIntent;
  editable?: boolean;
  onEdit?: (text: string) => void;
}

export function PromptBubble({ text, files, imageIntent, editable, onEdit }: PromptBubbleProps) {
  const { t, isRtl } = useI18n();
  const attachments = files || [];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  const save = () => {
    const next = draft.trim();
    if (!next || !onEdit) {
      setEditing(false);
      setDraft(text);
      return;
    }
    setEditing(false);
    if (next !== text.trim()) onEdit(next);
  };

  return (
    <div className="flex justify-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-[85%] space-y-2 rounded-3xl rounded-ss-md bg-indigo-600 px-4 py-2.5 text-sm font-medium leading-relaxed text-white">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              dir={isRtl ? 'rtl' : 'ltr'}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="min-h-11 w-full rounded-xl bg-white/15 px-2 py-1.5 text-start text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={save}
                className="min-h-11 rounded-lg bg-white px-3 py-1 text-[11px] font-black text-indigo-700"
              >
                {t('prompt.bubble.update')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(text);
                }}
                className="min-h-11 rounded-lg bg-white/15 px-3 py-1 text-[11px] font-black text-white"
              >
                {t('prompt.bubble.cancel')}
              </button>
            </div>
          </div>
        ) : text ? (
          <p className="whitespace-pre-wrap text-start" dir="auto">{text}</p>
        ) : null}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((file) => (
              <span
                key={file.id}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/15 px-2 py-1 text-[11px] font-bold"
              >
                {file.kind === 'image' ? (
                  <img
                    src={filePreviewSrc(file)}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span className="max-w-[120px] truncate" dir="auto">
                  {file.name}
                </span>
              </span>
            ))}
          </div>
        )}
        {attachments.some((f) => f.kind === 'image') && imageIntent ? (
          <p className="text-start text-[10px] font-bold text-white/80">
            {t(imageIntent === 'rebuild' ? 'prompt.intent.rebuild' : 'prompt.intent.inspire')}
          </p>
        ) : null}
        {editable && onEdit && !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(text);
              setEditing(true);
            }}
            className="min-h-11 text-start text-[10px] font-black text-white/80 underline-offset-2 hover:underline"
          >
            {t('prompt.bubble.edit')}
          </button>
        )}
      </div>
    </div>
  );
}

export default PromptBubble;
