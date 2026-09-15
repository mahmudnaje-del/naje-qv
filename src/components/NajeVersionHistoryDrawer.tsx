import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Clock, ArrowRight, Eye, Layers, FileText, Check, X } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppStore } from '../store';

export interface EditHistoryEntry {
  id: string;
  docId: string;
  ownerId: string;
  version: number;
  changeSummary: string;
  content: string;
  timestamp: any;
}

interface NajeVersionHistoryDrawerProps {
  docId: string;
  currentContent: string;
  onRestoreVersion: (content: string, versionNumber: number) => void;
  onClose: () => void;
}

export default function NajeVersionHistoryDrawer({
  docId,
  currentContent,
  onRestoreVersion,
  onClose
}: NajeVersionHistoryDrawerProps) {
  const { user } = useAppStore();
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVersion, setSelectedVersion] = useState<EditHistoryEntry | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50);

  useEffect(() => {
    if (!docId || !user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'edit_history'),
          where('docId', '==', docId),
          where('ownerId', '==', user.uid),
          orderBy('version', 'desc')
        );
        const snap = await getDocs(q);
        const entries: EditHistoryEntry[] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EditHistoryEntry[];

        setHistory(entries);
        if (entries.length > 0) {
          setSelectedVersion(entries[0]);
        }
      } catch (err) {
        console.error('Error fetching edit_history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [docId, user]);

  const handleSaveSnapshot = async () => {
    if (!docId || !user || !currentContent) return;
    try {
      const nextVersion = (history.length > 0 ? history[0].version : 0) + 1;
      const newEntry = {
        docId,
        ownerId: user.uid,
        version: nextVersion,
        changeSummary: `نسخة محفوظة يدويًا v${nextVersion}`,
        content: currentContent,
        timestamp: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'edit_history'), newEntry);
      const created: EditHistoryEntry = {
        id: docRef.id,
        ...newEntry,
        timestamp: new Date()
      };
      setHistory(prev => [created, ...prev]);
      setSelectedVersion(created);
    } catch (err) {
      console.error('Failed to save snapshot:', err);
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full max-w-2xl bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">سجل التعديلات والنسخ (Version History)</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">استعرض النسخ السابقة، قارن المحتوى، أو استرجع نسخة حتمية</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Timeline Version List */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-4 space-y-3 overflow-y-auto bg-gray-50/40 dark:bg-gray-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">قائمة الإصدارات</span>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              + حفظ نسخة الآن
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-700 dark:text-gray-300">جاري تحميل سجل النسخ...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
              <p className="text-xs text-gray-700 dark:text-gray-300">لا توجد نسخ محفوظة حالياً</p>
              <button
                type="button"
                onClick={handleSaveSnapshot}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-500 transition"
              >
                حفظ النسخة الحالية
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full text-right p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                        إصدار v{ver.version}
                      </span>
                      <span className="text-[10px] text-gray-700 dark:text-gray-300">
                        {ver.timestamp?.toDate ? ver.timestamp.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-1">{ver.changeSummary || 'تعديل على المستند'}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Viewer / Comparison */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-gray-950">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {selectedVersion ? `معاينة إصدار v${selectedVersion.version}` : 'معاينة المحتوى'}
              </span>
              <button
                type="button"
                onClick={() => setCompareMode(!compareMode)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  compareMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                }`}
              >
                {compareMode ? 'إلغاء المقارنة' : 'مقارنة مع الحالية'}
              </button>
            </div>

            {selectedVersion && (
              <button
                type="button"
                onClick={() => {
                  onRestoreVersion(selectedVersion.content, selectedVersion.version);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استرجاع هذا الإصدار</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50 font-mono text-xs leading-relaxed text-gray-800 dark:text-gray-200">
            {compareMode ? (
              <div className="flex flex-col h-full gap-3">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">شريط التمرير للمقارنة (قبل / بعد)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">إصدار v{selectedVersion?.version || 1}</span>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPos}
                      onChange={(e) => setSliderPos(Number(e.target.value))}
                      className="w-28 sm:w-40 accent-indigo-600 cursor-pointer h-2 bg-gray-300 dark:bg-gray-700 rounded-lg touch-none"
                      dir="rtl"
                    />
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">الحالية</span>
                  </div>
                </div>

                {/* Before/After Overlay Stack with Clip-Path */}
                <div className="relative flex-1 w-full h-full min-h-[280px] rounded-xl overflow-hidden select-none bg-gray-900 border border-gray-800">
                  {/* Bottom Layer: Current Live Version */}
                  <div className="absolute inset-0 w-full h-full p-4 overflow-auto bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed">
                    <div className="sticky top-0 z-10 px-2.5 py-1 bg-rose-950/80 backdrop-blur text-[11px] font-bold text-rose-300 rounded w-fit mb-2 border border-rose-800/50">
                      النسخة الحالية الحية
                    </div>
                    {currentContent.startsWith('data:image') || currentContent.startsWith('http') ? (
                      <img src={currentContent} alt="Current Version" className="max-w-full max-h-[50vh] object-contain rounded mx-auto" />
                    ) : (
                      <pre className="whitespace-pre-wrap">{currentContent}</pre>
                    )}
                  </div>

                  {/* Top Layer: Selected Version (Clipped based on sliderPos RTL) */}
                  <div 
                    className="absolute inset-0 w-full h-full p-4 overflow-auto bg-gray-950 text-emerald-300 font-mono text-xs leading-relaxed"
                    style={{ clipPath: `inset(0 ${sliderPos}% 0 0)` }}
                  >
                    <div className="sticky top-0 z-10 px-2.5 py-1 bg-emerald-950/80 backdrop-blur text-[11px] font-bold text-emerald-300 rounded w-fit mb-2 border border-emerald-800/50">
                      إصدار v{selectedVersion?.version || 1}
                    </div>
                    {(selectedVersion?.content || currentContent).startsWith('data:image') || (selectedVersion?.content || currentContent).startsWith('http') ? (
                      <img src={selectedVersion?.content || currentContent} alt="Selected Version" className="max-w-full max-h-[50vh] object-contain rounded mx-auto" />
                    ) : (
                      <pre className="whitespace-pre-wrap">{selectedVersion?.content || currentContent}</pre>
                    )}
                  </div>

                  {/* Vertical Divider & Touch-Friendly Handle (44x44px) */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)] pointer-events-none z-20"
                    style={{ right: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white dark:border-gray-900 text-xs font-bold pointer-events-auto cursor-ew-resize">
                      ↔
                    </div>
                  </div>

                  {/* Touch & Scrub Overlay Input */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 touch-none"
                    dir="rtl"
                  />
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{selectedVersion?.content || currentContent}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
