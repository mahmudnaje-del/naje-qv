import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-purple-200/50 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] select-text">
      {/* Code Block Header */}
      <div className="bg-[#fcfbfd] dark:bg-gray-950 px-4 py-2 flex items-center justify-between border-b border-purple-200/40 dark:border-gray-800 text-xs font-mono text-gray-800 dark:text-gray-400 select-none">
        <span className="uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-sans text-xs font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ الكود</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-5 bg-white dark:bg-gray-950/40 overflow-x-auto" dir="ltr">
        <pre className="text-xs sm:text-sm font-mono text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre scrollbar-none">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
