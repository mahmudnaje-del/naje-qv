import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, CheckCircle2, XCircle, AlertTriangle, 
  Save, RefreshCw, Search, ChevronDown, ChevronUp,
  MessageSquare, Image, Video, Layout, FileText, Mic, Info,
  Layers, Database, Sparkles, Filter, Sliders, DollarSign, ArrowUpDown
} from 'lucide-react';
import { ModelEndpoint } from '../../types';
import { calculateMarginPercentage, POINT_USD_VALUE, SEED_ENDPOINTS } from '../../lib/modelRegistry';
import { auth } from '../../firebase';

interface AdminModelPricingProps {}

const FEATURE_GROUPS: { key: ModelEndpoint['featureGroup']; labelAr: string; icon: any; color: string; bg: string }[] = [
  { key: 'text', labelAr: 'المحادثات والنصوص (Text Models)', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'image', labelAr: 'استوديو الصور (Image Studio)', icon: Image, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { key: 'video', labelAr: 'استوديو الفيديو (Video Studio)', icon: Video, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'ui', labelAr: 'توليد الواجهات والبرمجة (UI & Fullstack)', icon: Layout, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'document', labelAr: 'العروض والمستندات (Documents & Slides)', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'voice', labelAr: 'استوديو الصوتيات (Voice TTS)', icon: Mic, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
];

export const AdminModelPricing: React.FC<AdminModelPricingProps> = () => {
  const [endpoints, setEndpoints] = useState<ModelEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'user' | 'background'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Local state for inline edits
  interface EndpointEditForm {
    modelId: string;
    fallbackModelId?: string;
    isEnabled: boolean;
    pricingType: 'per_token' | 'per_generation';
    pointsPrice: number;
    inputPointsPer1k: number;
    outputPointsPer1k: number;
    inputPointsPerBlock?: number;
    inputTokenBlockSize?: number;
    outputPointsPerBlock?: number;
    outputTokenBlockSize?: number;
    realCostUsd: number;
    paramNotes: string;
    labelAr: string;
    maxOutputTokens: number;
    isBackground: boolean;
  }

  const [editForms, setEditForms] = useState<Record<string, EndpointEditForm>>({});

  const [savingId, setSavingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      let list: ModelEndpoint[] = [];
      const token = await auth.currentUser?.getIdToken();

      if (token) {
        try {
          const res = await fetch('/api/admin/model-endpoints', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.endpoints && Array.isArray(data.endpoints) && data.endpoints.length > 0) {
              list = data.endpoints;
            }
          }
        } catch (fetchErr) {
          console.warn("[AdminModelPricing] Backend fetch failed, falling back to local registry:", fetchErr);
        }
      }

      // If backend was unreachable or returned empty, merge with SEED_ENDPOINTS
      if (list.length === 0) {
        list = SEED_ENDPOINTS;
      } else {
        // Ensure any seed items missing from DB are still included
        const existingIds = new Set(list.map(e => e.id));
        for (const seed of SEED_ENDPOINTS) {
          if (!existingIds.has(seed.id)) {
            list.push(seed);
          }
        }
      }

      setEndpoints(list);

      // Initialize edit forms state
      const initialForms: Record<string, any> = {};
      list.forEach(ep => {
        initialForms[ep.id] = {
          modelId: ep.modelId || '',
          fallbackModelId: ep.fallbackModelId || '',
          isEnabled: ep.isEnabled !== false,
          pricingType: ep.pricingType || (ep.featureGroup === 'text' || ep.id.startsWith('tier_') || ep.id.includes('writer') || ep.id.includes('auditor') || ep.id.includes('planner') || ep.id.includes('critic') ? 'per_token' : 'per_generation'),
          pointsPrice: ep.pointsPrice ?? 0,
          inputPointsPer1k: ep.inputPointsPerBlock ?? ep.inputPointsPer1k ?? 0.1,
          inputPointsPerBlock: ep.inputPointsPerBlock ?? ep.inputPointsPer1k ?? 0.1,
          inputTokenBlockSize: ep.inputTokenBlockSize ?? 1000,
          outputPointsPer1k: ep.outputPointsPerBlock ?? ep.outputPointsPer1k ?? 0.1,
          outputPointsPerBlock: ep.outputPointsPerBlock ?? ep.outputPointsPer1k ?? 0.1,
          outputTokenBlockSize: ep.outputTokenBlockSize ?? 1000,
          realCostUsd: ep.realCostPer?.usd ?? 0,
          paramNotes: ep.paramNotes || '',
          labelAr: ep.labelAr || '',
          maxOutputTokens: ep.maxOutputTokens ?? 8192,
          isBackground: ep.isBackground ?? false
        };
      });
      setEditForms(initialForms);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
      setEndpoints(SEED_ENDPOINTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleInputChange = (id: string, field: string, value: any) => {
    setEditForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  // Instant toggle for model enabled / disabled state
  const handleToggleEnabled = async (endpoint: ModelEndpoint) => {
    const currentForm = editForms[endpoint.id];
    const newEnabledState = currentForm ? !currentForm.isEnabled : !(endpoint.isEnabled !== false);
    
    // Update local form state immediately
    handleInputChange(endpoint.id, 'isEnabled', newEnabledState);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/update-model-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpointId: endpoint.id,
          modelId: currentForm?.modelId || endpoint.modelId,
          fallbackModelId: currentForm?.fallbackModelId || endpoint.fallbackModelId,
          isEnabled: newEnabledState,
          skipValidation: true
        })
      });
      if (res.ok) {
        setEndpoints(prev => prev.map(ep => ep.id === endpoint.id ? { ...ep, isEnabled: newEnabledState } : ep));
        setFeedbackMsg({ 
          id: endpoint.id, 
          type: 'success', 
          text: newEnabledState ? 'تم تفعيل النموذج بنجاح.' : 'تم تعطيل النموذج بنجاح (سيتم حظر طلباته تلقائياً ومنع استهلاكه).' 
        });
      } else {
        throw new Error('فشل تحديث حالة النموذج على الخادم');
      }
    } catch (e: any) {
      setFeedbackMsg({ id: endpoint.id, type: 'error', text: e.message || 'فشل تغيير حالة التفعيل' });
    }
  };

  // Test validation on single endpoint without saving
  const handleTestValidation = async (endpoint: ModelEndpoint) => {
    setValidatingId(endpoint.id);
    setFeedbackMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const form = editForms[endpoint.id] || { modelId: endpoint.modelId };

      const res = await fetch('/api/admin/validate-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modelId: form.modelId,
          featureGroup: endpoint.featureGroup
        })
      });

      const data = await res.json();
      if (data.ok) {
        setEndpoints(prev => prev.map(e => e.id === endpoint.id ? { ...e, lastValidatedOk: true, lastValidatedAt: Date.now(), lastFailureAt: undefined, lastFailureReason: undefined } : e));
        setFeedbackMsg({ id: endpoint.id, type: 'success', text: 'تم اختبار الاتصال بالنموذج بنجاح!' });
      } else {
        setEndpoints(prev => prev.map(e => e.id === endpoint.id ? { ...e, lastValidatedOk: false, lastValidatedAt: Date.now(), lastFailureAt: Date.now(), lastFailureReason: data.error } : e));
        setFeedbackMsg({ id: endpoint.id, type: 'error', text: `فشل الاتصال: ${data.error || 'النموذج غير متجاوب'}` });
      }
    } catch (err: any) {
      setFeedbackMsg({ id: endpoint.id, type: 'error', text: `فشل الفحص: ${err.message}` });
    } finally {
      setValidatingId(null);
    }
  };

  // Save single endpoint with mandatory validation
  const handleSaveEndpoint = async (endpoint: ModelEndpoint) => {
    setSavingId(endpoint.id);
    setFeedbackMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const form: EndpointEditForm = editForms[endpoint.id] || {
        modelId: endpoint.modelId,
        fallbackModelId: endpoint.fallbackModelId,
        isEnabled: endpoint.isEnabled !== false,
        pricingType: endpoint.pricingType || 'per_token',
        pointsPrice: endpoint.pointsPrice ?? 0,
        inputPointsPer1k: endpoint.inputPointsPerBlock ?? endpoint.inputPointsPer1k ?? 0.1,
        inputPointsPerBlock: endpoint.inputPointsPerBlock ?? endpoint.inputPointsPer1k ?? 0.1,
        inputTokenBlockSize: endpoint.inputTokenBlockSize ?? 1000,
        outputPointsPer1k: endpoint.outputPointsPerBlock ?? endpoint.outputPointsPer1k ?? 0.1,
        outputPointsPerBlock: endpoint.outputPointsPerBlock ?? endpoint.outputPointsPer1k ?? 0.1,
        outputTokenBlockSize: endpoint.outputTokenBlockSize ?? 1000,
        realCostUsd: endpoint.realCostPer?.usd ?? 0,
        paramNotes: endpoint.paramNotes || '',
        labelAr: endpoint.labelAr || '',
        maxOutputTokens: endpoint.maxOutputTokens ?? 8192,
        isBackground: endpoint.isBackground ?? false
      };

      const res = await fetch('/api/admin/update-model-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpointId: endpoint.id,
          modelId: form.modelId,
          fallbackModelId: form.fallbackModelId,
          isEnabled: form.isEnabled !== false,
          pricingType: form.pricingType,
          pointsPrice: Number(form.pointsPrice),
          inputPointsPer1k: Number(form.inputPointsPerBlock ?? form.inputPointsPer1k),
          outputPointsPer1k: Number(form.outputPointsPerBlock ?? form.outputPointsPer1k),
          inputPointsPerBlock: Number(form.inputPointsPerBlock ?? form.inputPointsPer1k),
          inputTokenBlockSize: Number(form.inputTokenBlockSize) || 1000,
          outputPointsPerBlock: Number(form.outputPointsPerBlock ?? form.outputPointsPer1k),
          outputTokenBlockSize: Number(form.outputTokenBlockSize) || 1000,
          realCostUsd: Number(form.realCostUsd),
          paramNotes: form.paramNotes,
          labelAr: form.labelAr,
          maxOutputTokens: Number(form.maxOutputTokens) || 8192,
          isBackground: form.isBackground
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ البيانات');
      }

      setFeedbackMsg({ id: endpoint.id, type: 'success', text: 'تم التحقق والحفظ بنجاح!' });
      await fetchEndpoints();
    } catch (err: any) {
      setFeedbackMsg({ id: endpoint.id, type: 'error', text: err.message });
    } finally {
      setSavingId(null);
    }
  };

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      // Scope filter
      if (scopeFilter === 'user' && ep.isBackground) return false;
      if (scopeFilter === 'background' && !ep.isBackground) return false;

      // Group filter
      if (selectedGroup !== 'all' && ep.featureGroup !== selectedGroup) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = (ep.labelAr || '').toLowerCase().includes(q);
        const matchId = (ep.id || '').toLowerCase().includes(q);
        const matchModel = (ep.modelId || '').toLowerCase().includes(q);
        const matchNotes = (ep.paramNotes || '').toLowerCase().includes(q);
        if (!matchLabel && !matchId && !matchModel && !matchNotes) return false;
      }

      return true;
    });
  }, [endpoints, scopeFilter, selectedGroup, searchQuery]);

  // Grouped results for rendering
  const groupedData = useMemo(() => {
    const map = new Map<string, ModelEndpoint[]>();
    FEATURE_GROUPS.forEach(g => map.set(g.key, []));

    filteredEndpoints.forEach(ep => {
      const gKey = ep.featureGroup || 'text';
      if (!map.has(gKey)) {
        map.set(gKey, []);
      }
      map.get(gKey)!.push(ep);
    });

    return map;
  }, [filteredEndpoints]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalCount = endpoints.length;
    const backgroundCount = endpoints.filter(e => e.isBackground).length;
    const userFacingCount = totalCount - backgroundCount;
    const tokenMeteredCount = endpoints.filter(e => e.pricingType === 'per_token').length;
    const total30dUsage = endpoints.reduce((acc, curr) => acc + (curr.total30dCostInPoints || 0), 0);
    return { totalCount, backgroundCount, userFacingCount, tokenMeteredCount, total30dUsage };
  }, [endpoints]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center shadow-xl space-y-4" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">جاري تحميل سجل المنافذ والنماذج وإحصائيات الاستهلاك...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-purple-950 border border-purple-800/50 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Cpu className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">مركز التحكم الموحد بالنماذج والتسعير</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 rounded-md font-mono text-purple-200">
                    نظام الفوترة بالتوكن الحقيقي (Per-Token Real Billing)
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-md font-bold text-emerald-200">
                    استهلاك آخر 30 يوم: {stats.total30dUsage.toFixed(1)} نقطة
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-xs font-medium max-w-3xl leading-relaxed">
              إدارة شاملة لجميع منافذ النماذج المرئية والخدمات الإدراكية في الخلفية (الناقد، مجلس العقول، مخطط الوكلاء، والمدقق) مع إمكانية ضبط معدل استهلاك التوكن لكل 1,000 توكن مدخلات ومخرجات.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchEndpoints}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث السجل</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Scope Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                scopeFilter === 'all' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              الكل ({stats.totalCount})
            </button>
            <button
              onClick={() => setScopeFilter('user')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                scopeFilter === 'user' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              واجهة المستخدم ({stats.userFacingCount})
            </button>
            <button
              onClick={() => setScopeFilter('background')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                scopeFilter === 'background' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              خدمات الخلفية والناقد ({stats.backgroundCount})
            </button>
          </div>

          {/* Group and Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              aria-label="تصفية حسب نوع الخدمة"
              className="w-full sm:w-auto bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">جميع المجموعات ({filteredEndpoints.length})</option>
              {FEATURE_GROUPS.map(g => (
                <option key={g.key} value={g.key}>{g.labelAr}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في المنافذ أو النماذج..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Groups Table Sections */}
      <div className="space-y-6">
        {FEATURE_GROUPS.map((group) => {
          const groupEndpoints = groupedData.get(group.key) || [];
          if (groupEndpoints.length === 0 && selectedGroup !== 'all' && selectedGroup !== group.key) {
            return null;
          }
          if (groupEndpoints.length === 0 && searchQuery.trim()) {
            return null;
          }

          const isCollapsed = collapsedGroups[group.key];
          const GroupIcon = group.icon;

          return (
            <div key={group.key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full p-4 sm:p-5 bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${group.bg} ${group.color}`}>
                    <GroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-base">
                      {group.labelAr}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 font-medium">
                      {groupEndpoints.length} منفذ مهيأ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full font-mono">
                    {group.key.toUpperCase()}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Group Table Body */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-gray-100/60 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold">
                        <th className="p-3.5 sm:p-4 min-w-[190px]">الميزة والنطاق</th>
                        <th className="p-3.5 sm:p-4 min-w-[230px]">النموذج الرئيسي والاحتياطي</th>
                        <th className="p-3.5 sm:p-4 min-w-[120px] text-center">التفعيل / الإيقاف</th>
                        <th className="p-3.5 sm:p-4 min-w-[120px]">نوع التسعير</th>
                        <th className="p-3.5 sm:p-4 min-w-[200px]">التسعير بالنقاط</th>
                        <th className="p-3.5 sm:p-4 min-w-[120px]">استهلاك 30 يوم</th>
                        <th className="p-3.5 sm:p-4 min-w-[140px]">التكلفة (USD)</th>
                        <th className="p-3.5 sm:p-4 min-w-[90px]">الهامش</th>
                        <th className="p-3.5 sm:p-4 min-w-[140px]">الحالة الصحية</th>
                        <th className="p-3.5 sm:p-4 text-center min-w-[150px]">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {groupEndpoints.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-6 text-center text-gray-400 font-bold">
                            لا توجد منافذ مطابقة لشروط التصفية في هذه المجموعة.
                          </td>
                        </tr>
                      ) : (
                        groupEndpoints.map((ep) => {
                          const form: EndpointEditForm = editForms[ep.id] || {
                            modelId: ep.modelId,
                            fallbackModelId: ep.fallbackModelId,
                            isEnabled: ep.isEnabled !== false,
                            pricingType: ep.pricingType || 'per_token',
                            pointsPrice: ep.pointsPrice ?? 0,
                            inputPointsPer1k: ep.inputPointsPerBlock ?? ep.inputPointsPer1k ?? 0.1,
                            inputPointsPerBlock: ep.inputPointsPerBlock ?? ep.inputPointsPer1k ?? 0.1,
                            inputTokenBlockSize: ep.inputTokenBlockSize ?? 1000,
                            outputPointsPer1k: ep.outputPointsPerBlock ?? ep.outputPointsPer1k ?? 0.1,
                            outputPointsPerBlock: ep.outputPointsPerBlock ?? ep.outputPointsPer1k ?? 0.1,
                            outputTokenBlockSize: ep.outputTokenBlockSize ?? 1000,
                            realCostUsd: ep.realCostPer?.usd ?? 0,
                            paramNotes: ep.paramNotes || '',
                            labelAr: ep.labelAr,
                            maxOutputTokens: ep.maxOutputTokens ?? 8192,
                            isBackground: ep.isBackground ?? false
                          };

                          const isTokenPricing = form.pricingType === 'per_token';
                          const isEnabled = form.isEnabled !== false;

                          // Real-time margin calculation
                          const tempEpObj: ModelEndpoint = {
                            ...ep,
                            pricingType: form.pricingType,
                            pointsPrice: Number(form.pointsPrice) || 0,
                            inputPointsPer1k: Number(form.inputPointsPer1k) || 0.1,
                            outputPointsPer1k: Number(form.outputPointsPer1k) || 0.1,
                            realCostPer: {
                              ...ep.realCostPer,
                              usd: Number(form.realCostUsd) || 0
                            }
                          };
                          const marginPercent = calculateMarginPercentage(tempEpObj);

                          const isSaving = savingId === ep.id;
                          const isValidating = validatingId === ep.id;
                          const msg = feedbackMsg?.id === ep.id ? feedbackMsg : null;

                          return (
                            <React.Fragment key={ep.id}>
                              <tr className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition ${!isEnabled ? 'opacity-65 bg-gray-50/40 dark:bg-gray-900/40' : ''}`}>
                                {/* Label / Scope */}
                                <td className="p-3.5 sm:p-4 font-bold text-gray-900 dark:text-white">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{ep.labelAr}</span>
                                    {ep.isBackground && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                                        خدمة خلفية
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>{ep.id}</span>
                                    {ep.envVarKey && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-semibold">
                                        {ep.envVarKey}
                                      </span>
                                    )}
                                    {ep.paramNotes && <span className="text-gray-500">({ep.paramNotes})</span>}
                                  </div>
                                </td>

                                {/* Editable Model ID & Fallback */}
                                <td className="p-3.5 sm:p-4 space-y-1.5">
                                  <div>
                                    <div className="text-[10px] text-gray-500 font-medium mb-0.5 flex items-center justify-between">
                                      <span>الأساسي (Primary):</span>
                                    </div>
                                    <input
                                      type="text"
                                      value={form.modelId}
                                      onChange={(e) => handleInputChange(ep.id, 'modelId', e.target.value)}
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 font-mono text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      placeholder="Model ID..."
                                    />
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-0.5 flex items-center justify-between">
                                      <span>الاحتياطي (Fallback):</span>
                                    </div>
                                    <input
                                      type="text"
                                      value={form.fallbackModelId || ''}
                                      onChange={(e) => handleInputChange(ep.id, 'fallbackModelId', e.target.value)}
                                      className="w-full bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg px-2.5 py-1 font-mono text-xs text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                      placeholder="Fallback Model ID..."
                                    />
                                  </div>
                                </td>

                                {/* Enable / Disable Toggle */}
                                <td className="p-3.5 sm:p-4 text-center">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleEnabled(ep)}
                                      role="switch"
                                      aria-checked={isEnabled}
                                      title={isEnabled ? 'انقر لتعطيل النموذج' : 'انقر لتفعيل النموذج'}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                        isEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isEnabled ? '-translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[10px] font-extrabold ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                      {isEnabled ? 'مفعّل' : 'معطّل'}
                                    </span>
                                  </div>
                                </td>

                                {/* Pricing Type */}
                                <td className="p-3.5 sm:p-4">
                                  <select
                                    value={form.pricingType}
                                    onChange={(e) => handleInputChange(ep.id, 'pricingType', e.target.value)}
                                    aria-label="نوع التسعير"
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-2 py-1 text-xs font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  >
                                    <option value="per_token">لكل توكن</option>
                                    <option value="per_generation">لكل توليد</option>
                                  </select>
                                </td>

                                {/* Points Pricing */}
                                <td className="p-3.5 sm:p-4">
                                  {isTokenPricing ? (
                                    <div className="space-y-2">
                                      {/* Input tokens row */}
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <span className="text-gray-500 font-medium w-10 shrink-0">مدخلات:</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={form.inputPointsPerBlock ?? form.inputPointsPer1k}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            handleInputChange(ep.id, 'inputPointsPerBlock', val);
                                            handleInputChange(ep.id, 'inputPointsPer1k', val);
                                          }}
                                          className="w-14 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                                          title="النقاط لكل حزمة"
                                        />
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">نقطة /</span>
                                        <input
                                          type="number"
                                          step="100"
                                          min="1"
                                          value={form.inputTokenBlockSize || 1000}
                                          onChange={(e) => handleInputChange(ep.id, 'inputTokenBlockSize', parseInt(e.target.value) || 1000)}
                                          className="w-14 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-0.5 text-xs font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                                          title="حجم حزمة توكنز المدخلات"
                                        />
                                        <span className="text-gray-500 text-[9px]">T</span>
                                      </div>

                                      {/* Output tokens row */}
                                      <div className="flex items-center gap-1 text-[10px]">
                                        <span className="text-gray-500 font-medium w-10 shrink-0">مخرجات:</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={form.outputPointsPerBlock ?? form.outputPointsPer1k}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            handleInputChange(ep.id, 'outputPointsPerBlock', val);
                                            handleInputChange(ep.id, 'outputPointsPer1k', val);
                                          }}
                                          className="w-14 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                                          title="النقاط لكل حزمة"
                                        />
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">نقطة /</span>
                                        <input
                                          type="number"
                                          step="100"
                                          min="1"
                                          value={form.outputTokenBlockSize || 1000}
                                          onChange={(e) => handleInputChange(ep.id, 'outputTokenBlockSize', parseInt(e.target.value) || 1000)}
                                          className="w-14 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-1.5 py-0.5 text-xs font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                                          title="حجم حزمة توكنز المخرجات"
                                        />
                                        <span className="text-gray-500 text-[9px]">T</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        value={form.pointsPrice}
                                        onChange={(e) => handleInputChange(ep.id, 'pointsPrice', parseInt(e.target.value) || 0)}
                                        className="w-20 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      />
                                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">نقطة</span>
                                    </div>
                                  )}
                                </td>

                                {/* 30-Day Usage */}
                                <td className="p-3.5 sm:p-4">
                                  <div className="space-y-1">
                                    <div className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xs">
                                      {ep.total30dCostInPoints ? `${ep.total30dCostInPoints.toFixed(2)} نقطة` : '0 نقطة'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      ≈ ${((ep.total30dCostInPoints || 0) * POINT_USD_VALUE).toFixed(2)}
                                    </div>
                                  </div>
                                </td>

                                {/* Real Cost USD */}
                                <td className="p-3.5 sm:p-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400 font-mono">$</span>
                                      <input
                                        type="number"
                                        step="0.001"
                                        value={form.realCostUsd}
                                        onChange={(e) => handleInputChange(ep.id, 'realCostUsd', parseFloat(e.target.value) || 0)}
                                        className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      />
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {ep.realCostPer?.unit || 'per_call'}
                                    </div>
                                  </div>
                                </td>

                                {/* Margin */}
                                <td className="p-3.5 sm:p-4 font-mono font-black">
                                  <span className={`inline-block px-2.5 py-1 rounded-xl text-xs ${
                                    marginPercent >= 40 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                      : marginPercent >= 0 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                  }`}>
                                    {marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                                  </span>
                                </td>

                                {/* Health Status */}
                                <td className="p-3.5 sm:p-4">
                                  {ep.lastFailureAt && (!ep.lastValidatedAt || ep.lastFailureAt >= ep.lastValidatedAt) ? (
                                    <div className="space-y-1" title={ep.lastFailureReason || 'تعطل النموذج'}>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                                        <XCircle className="w-3 h-3 shrink-0" /> ⚠️ فشل مؤخراً
                                      </span>
                                      <div className="text-[9px] text-red-500 font-mono line-clamp-2 max-w-[140px]">
                                        {ep.lastFailureReason || 'خطأ غير محدد'}
                                      </div>
                                    </div>
                                  ) : (ep.lastValidatedOk || ep.lastKnownGoodModelId) ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" /> ✓ سليم
                                      </span>
                                      {ep.lastKnownGoodModelId && (
                                        <div className="text-[9px] text-gray-400 font-mono truncate max-w-[130px]" title={ep.lastKnownGoodModelId}>
                                          {ep.lastKnownGoodModelId}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-xl">
                                      — لم يختبر
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 sm:p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleTestValidation(ep)}
                                      disabled={isValidating || isSaving}
                                      title="اختبار الاتصال بالنموذج بدون حفظ"
                                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold transition disabled:opacity-50 cursor-pointer"
                                    >
                                      {isValidating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                                      ) : (
                                        <Search className="w-4 h-4 text-indigo-500" />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => handleSaveEndpoint(ep)}
                                      disabled={isSaving || isValidating}
                                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/20"
                                    >
                                      {isSaving ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Save className="w-3.5 h-3.5" />
                                      )}
                                      <span>حفظ</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Inline Feedback Banner */}
                              {msg && (
                                <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                                  <td colSpan={10} className="p-3 text-xs">
                                    <div className={`p-2.5 rounded-xl flex items-center gap-2 font-bold ${
                                      msg.type === 'success' 
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                                    }`}>
                                      {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                      <span>{msg.text}</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Card */}
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-4 flex items-start gap-3 text-purple-800 dark:text-purple-300 text-xs leading-relaxed">
        <Info className="w-5 h-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
        <div>
          <span className="font-bold">ملاحظة أمان وتكامل التسعير: </span>
          يتم احتساب استهلاك النماذج النصية (Lite / Core / Max ومجلس العقول) بالتوكنات الفعلية مباشرة فور اكتمال الاستجابة، بينما تحافظ نماذج الصور والفيديو على تسعيرها الثابت لكل عملية توليد. يقوم زر "حفظ" بإجراء فحص حي للنموذج قبل تثبيته لضمان سلامة واستقرار النظام.
        </div>
      </div>
    </div>
  );
};
