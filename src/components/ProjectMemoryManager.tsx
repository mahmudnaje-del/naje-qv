import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAppStore } from '../store';
import { MemoryItem, MemoryItemType, getClassificationLabel, Project } from '../types';
import { 
  Database, Plus, Trash2, FileText, Link as LinkIcon, File, 
  AlertCircle, HardDrive, CheckCircle2, Globe, FileCode, Image as ImageIcon
} from 'lucide-react';
import NajeSpinner from './NajeSpinner';
import { toast } from '../toastStore';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectMemoryManagerProps {
  project: Project;
  onClose?: () => void;
}

const MAX_MEMORY_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ProjectMemoryManager({ project, onClose }: ProjectMemoryManagerProps) {
  const { user } = useAppStore();
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Item State
  const [activeTab, setActiveTab] = useState<MemoryItemType>('text');
  const [label, setLabel] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!project.id) return;
    const q = query(
      collection(db, 'projects', project.id, 'memory_items'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MemoryItem));
      setMemoryItems(items);
      setLoading(false);
    }, (err) => {
      console.warn('Memory items listen error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [project.id]);

  const totalBytesUsed = memoryItems.reduce((acc, item) => acc + (item.rawSizeBytes || 0), 0);
  const usagePercentage = Math.min(100, (totalBytesUsed / MAX_MEMORY_BYTES) * 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بكت';
    if (bytes < 1024) return `${bytes} بكت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} م.ب`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Separate base filename from extension for clean label display
      const lastDotIndex = file.name.lastIndexOf('.');
      const baseName = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
      
      if (!label.trim()) {
        setLabel(baseName);
      }
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!label.trim()) {
      toast.error('يرجى كتابة عنوان/وسم لهذه الذاكرة');
      return;
    }

    if (activeTab === 'text' && !textContent.trim()) {
      toast.error('يرجى كتابة النص المطلوب حفظه');
      return;
    }
    if (activeTab === 'url' && !urlInput.trim()) {
      toast.error('يرجى إدخال رابط الحفظ');
      return;
    }
    if (activeTab === 'file' && !selectedFile) {
      toast.error('يرجى اختيار ملف');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error('يرجى تسجيل الدخول أولاً');
        return;
      }

      let payload: any = {
        type: activeTab,
        label: label.trim(),
      };

      if (activeTab === 'text') {
        payload.content = textContent;
      } else if (activeTab === 'url') {
        payload.url = urlInput.trim();
      } else if (activeTab === 'file' && selectedFile) {
        // Convert file to base64
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            // Strip data:*;base64, prefix if present
            const base64Data = res.includes(',') ? res.split(',')[1] : res;
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        payload.fileData = fileBase64;
        payload.mimeType = selectedFile.type || 'application/octet-stream';
        payload.fileName = selectedFile.name;
        payload.fileSize = selectedFile.size;
      }

      const res = await fetch(`/api/projects/${project.id}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إضافة الذاكرة');
      }

      toast.success('تمت إضافة الذاكرة واستخلاص الملخص الذكي بنجاح');
      setShowAddModal(false);
      setLabel('');
      setTextContent('');
      setUrlInput('');
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء إضافة الذاكرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    try {
      setDeletingId(itemId);
      await deleteDoc(doc(db, 'projects', project.id, 'memory_items', itemId));
      toast.success('تم حذف عنصر الذاكرة');
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف عنصر الذاكرة');
    } finally {
      setDeletingId(null);
    }
  };

  const getItemIcon = (type: MemoryItemType, mimeType?: string) => {
    if (type === 'url') return <Globe className="w-4 h-4 text-sky-400" />;
    if (type === 'file') {
      if (mimeType?.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-purple-400" />;
      return <FileText className="w-4 h-4 text-amber-400" />;
    }
    return <FileCode className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="bg-[#0f172a] text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl dir-rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              ذاكرة المشروع الحية
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                {getClassificationLabel(project.classification, project.classificationOther)}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              المشروع: <span className="text-slate-200 font-semibold">{project.name}</span> • المالك: <span className="text-slate-200">{project.ownerDisplayName || 'المستخدم'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          إضافة ذاكرة جديدة
        </button>
      </div>

      {/* Storage Gauge */}
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            السعة التخزينية المطبقة (السقف الإجمالي 10 ميغابايت)
          </span>
          <span className="font-mono text-slate-200 font-semibold">
            {formatBytes(totalBytesUsed)} / 10.0 MB ({usagePercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 pt-1">
          يتم تضمين موجز مضغوط تلقائياً في كل محادثة، ويمكنك استدعاء النص/الملف الأصلي كاملاً عند الحاجة عبر السؤال المباشر.
        </p>
      </div>

      {/* Memory Items List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          العناصر المخزنة ({memoryItems.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <NajeSpinner className="w-5 h-5" />
            <span className="text-xs">جاري تحميل عناصر الذاكرة...</span>
          </div>
        ) : memoryItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 p-6">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">لا توجد عناصر ذاكرة مضافة بعد لهذا المشروع</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              أضف نصوصاً، مستندات، أو روابط لتعزيز فهم "ناجي" لسياق مشروعك بشكل دائم وملخص تلقائياً.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-3.5 py-1.5 text-xs rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition-all"
            >
              + إضافة أول ذاكرة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
            {memoryItems.map((item) => (
              <div 
                key={item.id}
                className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0 mt-0.5">
                    {getItemIcon(item.type, item.mimeType)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{item.label}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.type === 'text' ? 'نص' : item.type === 'url' ? 'رابط' : 'ملف'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatBytes(item.rawSizeBytes)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                      {item.summary || 'جاري معالجة الملخص...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/50 transition-all"
                    title="حذف هذا العنصر"
                  >
                    {deletingId === item.id ? (
                      <NajeSpinner className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  إضافة عنصر إلى ذاكرة المشروع
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm px-2 py-1"
                >
                  إغلاق
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'text' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  نص مباشر
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'file' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  رفع ملف
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'url' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  رابط موقع
                </button>
              </div>

              <form onSubmit={handleAddMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    عنوان/وسم الذاكرة <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="مثال: دليل هوية العلامة التجارية، شروط الخدمة..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {activeTab === 'text' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      محتوى النص <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="الصق هنا النص أو الملاحظات الهامة التي تريد حفظها في ذاكرة المشروع..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                )}

                {activeTab === 'file' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      اختر ملفاً (PDF, Word, TXT, Markdown, JSON, CSV, صور, كود) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.png,.jpg,.jpeg,.webp,text/*,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                          {selectedFile.name.split('.').pop() || 'FILE'}
                        </span>
                        <span>{selectedFile.name}</span>
                        <span>•</span>
                        <span>{formatBytes(selectedFile.size)}</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'url' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      رابط الصفحة أو الموقع (HTTP/HTTPS) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/about"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-left dir-ltr"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      سيتم جلب الصفحة واستخراج محتواها النصي بآمان وتلخيصه فورياً.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <NajeSpinner className="w-3.5 h-3.5" />
                        جاري الحفظ والمعالجة الذكية...
                      </>
                    ) : (
                      'حفظ الذاكرة'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
