import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function GroundingReportViewer({ report }: { report: any }) {
  const [expanded, setExpanded] = useState(false);
  if (!report) return null;
  
  const toArDigits = (n: number) => n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  
  if (report.mode === 'creative') {
    return (
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
        <span className="font-medium">محتوى إبداعي</span> — لم تُرفق مصادر، الأرقام توضيحية
      </div>
    );
  }
  
  // grounded mode
  const claimsAudited = report.claimsAudited || 0;
  const removed = report.claimsRemoved || [];
  const hasRemovals = removed.length > 0;
  
  if (!hasRemovals) {
    return (
      <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
        تم التحقق من {toArDigits(claimsAudited)} ادعاء — كلها مستندة لمصدرك
      </div>
    );
  }
  
  return (
    <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 overflow-hidden">
      <div 
        className="p-2 flex items-center justify-between cursor-pointer text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span>تم التحقق من {toArDigits(claimsAudited)} ادعاء · أزلنا {toArDigits(removed.length)} غير مستندة لمصدرك</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="p-2 pt-0 space-y-2 border-t border-amber-200/50 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10">
          {removed.map((r: any, idx: number) => (
            <div key={idx} className="flex gap-2 text-amber-800 dark:text-amber-300">
              <div className="font-semibold shrink-0">[{r.category}]</div>
              <div className="opacity-80 line-clamp-2">{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
