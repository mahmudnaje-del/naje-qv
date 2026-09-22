import React from 'react';
import { motion } from 'motion/react';
import { Download, ExternalLink, RotateCcw } from 'lucide-react';

export interface FinalCutPanelProps {
  videoUrl: string;
  onReset: () => void;
}

export const FinalCutPanel: React.FC<FinalCutPanelProps> = ({ videoUrl, onReset }) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Network response was not ok");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'naje-ad-commercial.mp4';
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Failed to download video:", err);
      // Fallback: open in new tab if cors fetch fails
      window.open(videoUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex justify-center items-center gap-1.5 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{downloading ? 'جاري التحميل...' : 'تحميل الفيديو النهائي'}</span>
      </button>
      
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-xl bg-[#1c2230] hover:bg-[#252c3d] text-gray-200 border border-gray-700 text-xs font-bold transition flex justify-center items-center gap-1.5"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>فتح بنافذة خارجية</span>
      </a>
      
      <button
        type="button"
        onClick={onReset}
        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex justify-center items-center gap-1.5 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>إنتاج نسخة أخرى</span>
      </button>
    </div>
  );
};
