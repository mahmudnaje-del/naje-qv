import React from 'react';
import { FileText } from 'lucide-react';
import {
  filePreviewSrc,
  type ImageIntent,
  type PromptAttachment,
} from '../../lib/najePromptEngine';

interface PromptBubbleProps {
  text: string;
  files?: PromptAttachment[];
  imageIntent?: ImageIntent;
}

export function PromptBubble({ text, files, imageIntent }: PromptBubbleProps) {
  const attachments = files || [];
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2 rounded-3xl rounded-tr-md bg-indigo-600 px-4 py-2.5 text-sm font-medium leading-relaxed text-white">
        {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((file) => (
              <span
                key={file.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-2 py-1 text-[11px] font-bold"
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
          <p className="text-[10px] font-bold text-white/80">
            {imageIntent === 'rebuild' ? 'أعد بناء هذا' : 'استلهام'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default PromptBubble;
