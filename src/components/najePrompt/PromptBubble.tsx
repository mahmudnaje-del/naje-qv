import React from 'react';

export function PromptBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-3xl rounded-tr-md bg-indigo-600 px-4 py-2.5 text-sm font-medium leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}

export default PromptBubble;
