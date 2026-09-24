import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NajeSelect from '../components/NajeSelect';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, writeBatch, doc, updateDoc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { RedeemCode, UserData } from '../types';
import { 
  Shield, Plus, Key, Users, BarChart3, Settings, Download, UserPlus, ShieldAlert, 
  AlertTriangle, Ban, Send, Bell, Sparkles, CheckCircle, Gift, ThumbsUp, ThumbsDown, MessageSquare,
  Power, AlertOctagon, CheckCircle2, Search, UserCheck, Lock, Unlock, Copy, ArrowRight, UserX, Cpu, DollarSign, Layers, RefreshCw,
  Trash2, Filter, Activity, Mic2, Coins, X, Minus
} from 'lucide-react';
import NajeErrorCard from '../components/NajeErrorCard';
import { useAppStore } from '../store';
import { toast, useToastStore } from '../toastStore';
import { triggerSmartDownload } from '../stores/smartDownloadStore';
import AdminSidebar, { AdminTab } from '../components/admin/AdminSidebar';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUserChats from '../components/admin/AdminUserChats';
import AdminAuditLogView from '../components/admin/AdminAuditLogView';
import AdminFeatureFlags from '../components/admin/AdminFeatureFlags';
import { AdminModelPricing } from '../components/admin/AdminModelPricing';
import { AdminNajeAd } from '../components/admin/AdminNajeAd';
import { useI18n } from '../i18n';


export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { t, isRtl, formatDate } = useI18n();
  const [points, setPoints] = useState<number>(10);
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [maxUsage, setMaxUsage] = useState<number>(1);
  const [codePrefix, setCodePrefix] = useState<string>('NAJE');
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [userTypeFilter, setUserTypeFilter] = useState<'regular' | 'admin' | 'all'>('regular');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [pricingData, setPricingData] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingMessage, setPricingMessage] = useState('');

  // User Capacity Limit States
  const [maxUsersLimit, setMaxUsersLimit] = useState<string>('0');
  const [maxUsersMessage, setMaxUsersMessage] = useState<string>(t('tools.admin.capDeniedDefault'));
  const [limitSaving, setLimitSaving] = useState<boolean>(false);

  // Emergency Maintenance / System Status States
  const [maintIsActive, setMaintIsActive] = useState<boolean>(false);
  const [maintTitle, setMaintTitle] = useState<string>(t('tools.admin.maintTitleDefault'));
  const [maintIntro, setMaintIntro] = useState<string>(t('tools.admin.maintIntroDefault'));
  const [maintExplanation, setMaintExplanation] = useState<string>(t('tools.admin.maintExplainDefault'));
  const [maintSolutions, setMaintSolutions] = useState<string>(t('tools.admin.maintSolutionsDefault'));
  const [maintSaving, setMaintSaving] = useState<boolean>(false);

  // Skills Library States
  const [skills, setSkills] = useState<any[]>([]);
  const [skillDraft, setSkillDraft] = useState<any>({ name: '', appliesTo: 'all', priority: 10, instructions: '', enabled: true });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillSaving, setSkillSaving] = useState(false);

  // Notification Composer States
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'system' | 'billing' | 'feature' | 'alert'>('system');
  const [notifTarget, setNotifTarget] = useState<'specific' | 'all'>('all');
  const [notifTargetUid, setNotifTargetUid] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const [voiceGenLoading, setVoiceGenLoading] = useState(false);
  const [voiceGenResult, setVoiceGenResult] = useState<any>(null);

  // User Balance Adjustment Modal States (Admin Support Tool)
  const [balanceModalUser, setBalanceModalUser] = useState<UserData | null>(null);
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct' | 'set'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number | string>(10);
  const [adjustReasonPreset, setAdjustReasonPreset] = useState<string>('تعويض عن عملية توليد متعثرة');
  const [adjustCustomReason, setAdjustCustomReason] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);

  const handleGenerateVoiceSamples = async (force: boolean = false) => {
    setVoiceGenLoading(true);
    setVoiceGenResult(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error(t('tools.admin.voiceNeedLogin'));
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/generate-voice-samples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('tools.admin.voiceReqError'));
      }
      setVoiceGenResult(data);
      toast.success(data.message || t('tools.admin.voiceOk'));
    } catch (err: any) {
      console.error("handleGenerateVoiceSamples error:", err);
      toast.error(err.message || t('tools.admin.voiceFail'));
    } finally {
      setVoiceGenLoading(false);
    }
  };

  const [logs, setLogs] = useState<any[]>([]);
  const [flaggedRequests, setFlaggedRequests] = useState<any[]>([]);
  const [feedbackSignals, setFeedbackSignals] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'up' | 'down'>('all');
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');

  const handleDeleteFeedback = async (fbId: string) => {
    try {
      await deleteDoc(doc(db, 'feedback_signals', fbId));
      toast.success(t('tools.admin.fbDeleted'));
    } catch (err) {
      toast.error(t('tools.admin.fbDeleteFail'));
    }
  };
  const [providers, setProviders] = useState({
    spectra_flash: 'gemini',
    nova_canvas: 'gemini',
    veo_lite: 'google',
    omni_flash: 'google'
  });

  const handleSendNotification = async () => {
    if (!notifTitle.trim()) {
      toast.error(t('tools.admin.notifNeedTitle'));
      return;
    }
    if (!notifMessage.trim()) {
      toast.error(t('tools.admin.notifNeedBody'));
      return;
    }
    if (notifTarget === 'specific' && !notifTargetUid.trim()) {
      toast.error(t('tools.admin.notifNeedUid'));
      return;
    }

    const confirmMsg = notifTarget === 'all' 
      ? t('tools.admin.notifConfirmAll') 
      : t('tools.admin.notifConfirmOne');

    const confirmed = await useToastStore.getState().showConfirm(t('tools.admin.notifConfirmTitle'), confirmMsg);
    if (!confirmed) return;

    setIsSendingNotif(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(t('tools.admin.noToken'));
      }

      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          target: notifTarget,
          targetUid: notifTarget === 'specific' ? notifTargetUid.trim() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('tools.admin.notifSendFail'));
      }

      toast.success(data.message || t('tools.admin.notifSent'));
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t('tools.admin.notifUnexpected'));
    } finally {
      setIsSendingNotif(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  const handleCreateCode = async () => {
    setIsGeneratingCodes(true);
    try {
      if (bulkCount > 1) {
        const token = await auth.currentUser?.getIdToken();
        const resp = await fetch('/api/admin/bulk-codes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            count: bulkCount,
            points,
            maxUsage,
            prefix: codePrefix || 'NAJE'
          })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || t('tools.admin.codesBulkFail'));
        setCodes([...data.codes, ...codes]);
        toast.success(t('tools.admin.codesBulkOk', { count: data.totalGenerated, batch: data.batchId }));
      } else {
        const newCode = generateCode();
        const docRef = await addDoc(collection(db, 'redeem_codes'), {
          code: newCode,
          points,
          used: false,
          maxUsage: maxUsage,
          usageCount: 0,
          usedByArray: [],
          createdAt: Date.now()
        });
        setCodes([{ id: docRef.id, code: newCode, points, used: false, maxUsage, usageCount: 0, usedByArray: [], createdAt: Date.now() }, ...codes]);
        toast.success(t('tools.admin.codeOneOk'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('tools.admin.genError', { message: err.message }));
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const exportCSV = () => {
    const rawCsv = t('tools.admin.csvHeader') + '\n'
      + codes.map(c => `${c.code},${c.points},${formatDate(c.createdAt, { dateStyle: 'medium' })}`).join("\n");
    
    triggerSmartDownload({
      data: rawCsv,
      mimeType: 'text/csv',
      ext: 'csv',
      title: t('tools.admin.codesExportTitle') + '_' + new Date().toISOString().slice(0, 10),
      fallbackName: t('tools.admin.codesExportFallback'),
    });
  };

  useEffect(() => {
    if (!user?.isAdmin) return;

    // Real-time live listener for feedback_signals channel
    const qFbRealtime = query(collection(db, 'feedback_signals'), orderBy('createdAt', 'desc'), limit(250));
    const unsubFeedback = onSnapshot(qFbRealtime, (snapshot) => {
      setFeedbackSignals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Feedback live stream error", err);
    });

    const fetchAdminData = async () => {
      // Fetch recent codes
      const qCodes = query(collection(db, 'redeem_codes'), orderBy('createdAt', 'desc'), limit(100));
      const codesSnap = await getDocs(qCodes);
      setCodes(codesSnap.docs.map(d => ({ id: d.id, ...d.data() } as RedeemCode)));

      // Fetch users
      const qUsers = query(collection(db, 'users'), limit(500));
      const usersSnap = await getDocs(qUsers);
      const fetchedUsers = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserData));
      setUsers(fetchedUsers);

      // Sync registered users count
      await setDoc(doc(db, 'config', 'system_status'), {
        registeredUsersCount: fetchedUsers.length
      }, { merge: true }).catch(() => null);

      // Fetch API logs
      try {
        const qLogs = query(collection(db, 'api_cost_log'), orderBy('createdAt', 'desc'), limit(200));
        const logsSnap = await getDocs(qLogs);
        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }

      // Fetch flagged requests
      try {
        const qFlagged = query(collection(db, 'flagged_requests'), orderBy('createdAt', 'desc'), limit(200));
        const flaggedSnap = await getDocs(qFlagged);
        setFlaggedRequests(flaggedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch flagged requests", err);
      }

      // Fetch skills library
      try {
        const skillsSnap = await getDocs(collection(db, 'skills'));
        setSkills(skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch skills", err);
      }

      // Fetch feedback signals
      try {
        const qFb = query(collection(db, 'feedback_signals'), orderBy('createdAt', 'desc'), limit(200));
        const fbSnap = await getDocs(qFb);
        setFeedbackSignals(fbSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch feedback signals", err);
      }

      // Fetch system status / emergency maintenance mode & user capacity limit
      try {
        const statusSnap = await getDoc(doc(db, 'config', 'system_status'));
        if (statusSnap.exists()) {
          const data = statusSnap.data();
          setMaintIsActive(!!data.isMaintenance);
          if (data.title) setMaintTitle(data.title);
          if (data.intro) setMaintIntro(data.intro);
          if (data.explanation) setMaintExplanation(data.explanation);
          if (Array.isArray(data.solutions)) setMaintSolutions(data.solutions.join('\n'));
          if (data.maxUsersLimit !== undefined) setMaxUsersLimit(String(data.maxUsersLimit).trim());
          if (data.maxUsersMessage) setMaxUsersMessage(data.maxUsersMessage);
        }
      } catch (err) {
        console.error("Failed to fetch system_status:", err);
      }

      // Fetch provider settings
      try {
        const provSnap = await getDoc(doc(db, 'config', 'providers_settings'));
        if (provSnap.exists()) {
          setProviders(provSnap.data() as any);
        }
      } catch (err) {
        console.error("Failed to fetch provider settings", err);
      }
    };
    fetchAdminData();

    return () => {
      unsubFeedback();
    };
  }, [user]);

  const handleSaveUserLimit = async () => {
    setLimitSaving(true);
    const cleanLimit = maxUsersLimit.trim();
    const finalLimitVal = cleanLimit === '00' ? '00' : (parseInt(cleanLimit) || 0);

    try {
      await setDoc(doc(db, 'config', 'system_status'), {
        maxUsersLimit: finalLimitVal,
        maxUsersMessage: maxUsersMessage.trim() || t('tools.admin.capDeniedDefault'),
        registeredUsersCount: users.length,
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      toast.success(t('tools.admin.capSaved'));
    } catch (err: any) {
      console.error(err);
      toast.error(t('tools.admin.capSaveError', { message: err.message }));
    } finally {
      setLimitSaving(false);
    }
  };

  const handleToggleMaintenance = async (enable: boolean) => {
    const confirmMsg = enable
      ? t('tools.admin.maintConfirmOff')
      : t('tools.admin.maintConfirmOn');
    const confirmed = await useToastStore.getState().showConfirm(t('tools.admin.systemAlertTitle'), confirmMsg);
    if (!confirmed) return;

    setMaintSaving(true);
    try {
      const solList = maintSolutions.split('\n').map(s => s.trim()).filter(Boolean);
      await setDoc(doc(db, 'config', 'system_status'), {
        isMaintenance: enable,
        title: maintTitle.trim() || t('tools.admin.maintTitleDefault'),
        intro: maintIntro.trim() || t('tools.admin.maintIntroDefault'),
        explanation: maintExplanation.trim() || t('tools.admin.maintExplainDefault'),
        solutions: solList.length > 0 ? solList : [t('tools.admin.maintSolWait'), t('tools.admin.maintSolFollow')],
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      setMaintIsActive(enable);
      if (enable) {
        toast.success(t('tools.admin.maintStopped'));
      } else {
        toast.success(t('tools.admin.maintResumed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t('tools.admin.systemUpdateError', { message: err.message }));
    } finally {
      setMaintSaving(false);
    }
  };

  const handleSaveMaintenanceText = async () => {
    setMaintSaving(true);
    try {
      const solList = maintSolutions.split('\n').map(s => s.trim()).filter(Boolean);
      await setDoc(doc(db, 'config', 'system_status'), {
        isMaintenance: maintIsActive,
        title: maintTitle.trim(),
        intro: maintIntro.trim(),
        explanation: maintExplanation.trim(),
        solutions: solList,
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      toast.success(t('tools.admin.maintTextSaved'));
    } catch (err: any) {
      console.error(err);
      toast.error(t('tools.admin.saveErrorMsg', { message: err.message }));
    } finally {
      setMaintSaving(false);
    }
  };

  const handleGrantAdmin = async (targetUid: string, canAddAdmins: boolean) => {
    if (!user?.canAddAdmins) {
      toast.error(t('tools.admin.noPermAddAdmin'));
      return;
    }
    const confirmed = await useToastStore.getState().showConfirm(t('tools.admin.confirmActionTitle'), t('tools.admin.confirmGrantAdmin'));
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isAdmin: true,
          canAddAdmins
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isAdmin: true, canAddAdmins } : u));
        toast.success(t('tools.admin.grantOk'));
      } catch (err) {
        console.error(err);
        toast.error(t('tools.admin.grantFail'));
      }
    }
  };

  const handleToggleBlock = async (targetUid: string, currentBlockStatus: boolean) => {
    if (!user?.isAdmin) return;
    if (targetUid === user.uid) {
      toast.error(t('tools.admin.cantBlockSelf'));
      return;
    }
    const msg = currentBlockStatus ? t('tools.admin.confirmUnblock') : t('tools.admin.confirmBlock');
    const confirmed = await useToastStore.getState().showConfirm(t('tools.admin.confirmActionTitle'), msg);
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isBlocked: !currentBlockStatus
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isBlocked: !currentBlockStatus } : u));
        toast.success(t('tools.admin.actionOk'));
      } catch (err) {
        console.error(err);
        toast.error(t('tools.admin.actionFail'));
      }
    }
  };

  const handleRevokeAdmin = async (targetUid: string) => {
    if (!user?.canAddAdmins) {
      toast.error(t('tools.admin.noPermRemoveAdmin'));
      return;
    }
    if (targetUid === user.uid) {
      toast.error(t('tools.admin.cantRemoveSelf'));
      return;
    }
    const confirmed = await useToastStore.getState().showConfirm(t('tools.admin.confirmActionTitle'), t('tools.admin.confirmRevoke'));
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isAdmin: false,
          canAddAdmins: false
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isAdmin: false, canAddAdmins: false } : u));
        toast.success(t('tools.admin.revokeOk'));
      } catch (err) {
        console.error(err);
        toast.error(t('tools.admin.revokeFail'));
      }
    }
  };

  const handleOpenBalanceModal = (targetUser: UserData) => {
    setBalanceModalUser(targetUser);
    setAdjustAction('add');
    setAdjustAmount(10);
    setAdjustReasonPreset('تعويض عن عملية توليد متعثرة');
    setAdjustCustomReason('');
    setAdjustNotes('');
  };

  const handleCloseBalanceModal = () => {
    setBalanceModalUser(null);
    setAdjustSubmitting(false);
  };

  const handleSubmitBalanceAdjustment = async () => {
    if (!balanceModalUser) return;
    const numAmount = Number(adjustAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error(t('tools.admin.needPositivePoints'));
      return;
    }
    const finalReason = adjustReasonPreset === 'custom' 
      ? (adjustCustomReason.trim() || 'تعديل رصيد مخصص') 
      : adjustReasonPreset;

    setAdjustSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error(t('tools.admin.needAdminLogin'));
        setAdjustSubmitting(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid: balanceModalUser.uid,
          amount: numAmount,
          action: adjustAction,
          reason: finalReason,
          notes: adjustNotes.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('tools.admin.balanceAdjustFail'));
      }

      setUsers(users.map(u => u.uid === balanceModalUser.uid ? { ...u, balance: data.newBalance } : u));
      toast.success(t('tools.admin.balanceUpdated', { name: balanceModalUser.displayName || balanceModalUser.email, balance: data.newBalance }));
      handleCloseBalanceModal();
    } catch (err: any) {
      toast.error(t('tools.admin.balanceAdjustError', { message: err.message }));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleAddPointsToUser = async (targetUid: string, currentBalance: number) => {
    const target = users.find(u => u.uid === targetUid);
    if (target) {
      handleOpenBalanceModal(target);
    }
  };

  const handleUpdateProvider = async (key: string, val: string) => {
    const updated = { ...providers, [key]: val };
    setProviders(updated);
    try {
      await setDoc(doc(db, 'config', 'providers_settings'), updated);
      toast.success(t('tools.admin.providerUpdated'));
    } catch (err: any) {
      toast.error(t('tools.admin.providerUpdateError', { message: err.message }));
    }
  };

  // Aggregate stats by model
  const aggregatedStats = () => {
    const categories: Record<string, { name: string, count: number, points: number, costUSD: number }> = {
      'lite': { name: `Naje Imagen Lite (${t('tools.admin.kindImage')})`, count: 0, points: 0, costUSD: 0 },
      'spectra': { name: `Naje Imagen (${t('tools.admin.kindImage')})`, count: 0, points: 0, costUSD: 0 },
      'nova': { name: `Naje Imagen Pro (${t('tools.admin.kindImage')})`, count: 0, points: 0, costUSD: 0 },
      'veo': { name: `Naje Video (${t('tools.admin.kindVideo')})`, count: 0, points: 0, costUSD: 0 },
      'veo-pro': { name: `Naje Video Pro (${t('tools.admin.kindVideo')})`, count: 0, points: 0, costUSD: 0 },
      'omni': { name: `Naje Video Pro (${t('tools.admin.kindVideo')})`, count: 0, points: 0, costUSD: 0 },
      'pdf': { name: `PDF Documents (${t('tools.admin.kindDoc')})`, count: 0, points: 0, costUSD: 0 },
      'docx': { name: `Word Documents (${t('tools.admin.kindDoc')})`, count: 0, points: 0, costUSD: 0 },
      'pptx': { name: `PowerPoint (${t('tools.admin.kindDoc')})`, count: 0, points: 0, costUSD: 0 },
      'text': { name: `Standard Text (${t('tools.admin.kindChat')})`, count: 0, points: 0, costUSD: 0 }
    };

    logs.forEach(log => {
      const model = log.model || 'text';
      if (!categories[model]) {
        categories[model] = { name: model, count: 0, points: 0, costUSD: 0 };
      }
      categories[model].count += 1;
      categories[model].points += log.costInPoints || 0;
      categories[model].costUSD += log.estimatedCostUSD || 0;
    });

    return Object.values(categories);
  };

  const totalPointsEarned = logs.reduce((sum, item) => sum + (item.costInPoints || 0), 0);
  const totalCostUSD = logs.reduce((sum, item) => sum + (item.estimatedCostUSD || 0), 0);
  const totalCostNIS = totalCostUSD * 3.65;
  const totalRevenueNIS = totalPointsEarned * 0.5;
  const netMargin = totalRevenueNIS > 0 ? ((totalRevenueNIS - totalCostNIS) / totalRevenueNIS * 100) : 0;

  // Filtered users search
  const filteredUsers = users.filter(u => {
    if (userTypeFilter === 'regular' && u.isAdmin) return false;
    if (userTypeFilter === 'admin' && !u.isAdmin) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchName = u.displayName?.toLowerCase().includes(q);
      const matchUid = u.uid?.toLowerCase().includes(q);
      return matchEmail || matchName || matchUid;
    }
    return true;
  });

  const cleanLimitStr = String(maxUsersLimit ?? '').trim();
  const isLimitClosedForNew = cleanLimitStr === '00';
  const limitNum = Number(cleanLimitStr) || 0;
  const isLimitReached = isLimitClosedForNew || (limitNum > 0 && users.length >= limitNum);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Main Bar Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-md shadow-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-950/40 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-200/80 dark:border-gray-700/80 transition-all active:scale-95 shadow-sm cursor-pointer group"
            title={t('tools.admin.back')}
          >
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 text-white rounded-2xl shadow-lg shadow-purple-500/20">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('tools.admin.pageTitle')}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Naje Admin
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              {t('tools.admin.pageSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link 
            to="/" 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer border border-purple-500/20"
          >
            <span>{t('tools.admin.backStudio')}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">{t('tools.admin.metricUsers')}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{users.length}</span>
              <span className="text-xs font-medium text-gray-500">{t('tools.admin.accountUnit')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isLimitReached ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Lock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">{t('tools.admin.metricCap')}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {isLimitClosedForNew ? t('tools.admin.capClosed') : (limitNum > 0 ? `${limitNum}` : t('tools.admin.capUnlimited'))}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLimitClosedForNew ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                isLimitReached ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isLimitClosedForNew ? t('tools.admin.capRegisteredOnly') : (isLimitReached ? t('tools.admin.capFull') : (limitNum > 0 ? t('tools.admin.capOpenLimited') : t('tools.admin.capOpen')))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-xl ${maintIsActive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">{t('tools.admin.metricServices')}</span>
            <span className={`text-xs font-black inline-block mt-1 px-2.5 py-0.5 rounded-full ${
              maintIsActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {maintIsActive ? t('tools.admin.maintenance') : t('tools.admin.servicesOk')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Key className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">{t('tools.admin.metricCodes')}</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block mt-0.5">{codes.length}</span>
          </div>
        </div>
      </div>

      {/* Main Admin Flex Layout with Sidebar & Content Panel */}
      <div className="flex flex-col md:flex-row gap-6 items-start mt-6">
        {/* Right Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            usersCount: users.length,
            codesCount: codes.length,
            flaggedCount: flaggedRequests.length,
            feedbackCount: feedbackSignals.length,
            skillsCount: skills.length,
            isSystemAlert: maintIsActive || isLimitReached
          }}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Pane */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB: OVERVIEW LANDING DASHBOARD */}
          {activeTab === 'overview' && (
            <AdminOverview
              users={users}
              codes={codes}
              flaggedRequests={flaggedRequests}
              maintIsActive={maintIsActive}
              isLimitReached={isLimitReached}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB: USER CHATS BROWSER */}
          {activeTab === 'user_chats' && (
            <AdminUserChats
              users={users}
              initialUserId={selectedChatUserId}
              onClearInitialUser={() => setSelectedChatUserId(null)}
            />
          )}

          {/* TAB: AUDIT LOG VIEWER */}
          {activeTab === 'audit_log' && (
            <AdminAuditLogView />
          )}

          {/* TAB: FEATURE FLAGS KILL SWITCHES */}
          {activeTab === 'feature_flags' && (
            <AdminFeatureFlags />
          )}

          {/* TAB 1: STATUS & CAPACITY LIMITS */}
          {activeTab === 'status' && (
        <div className="space-y-6">
          {/* USER CAPACITY LIMIT CONTROL CARD */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isLimitReached ? 'bg-red-500/20 text-red-500' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.capSectionTitle')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('tools.admin.capSectionDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <span className={`w-full sm:w-auto text-center px-4 py-2 rounded-xl text-xs font-black border ${
                  isLimitClosedForNew
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : isLimitReached
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isLimitClosedForNew
                    ? t('tools.admin.capClosedNew')
                    : isLimitReached
                    ? t('tools.admin.capFullShort')
                    : t('tools.admin.capOpenReg')}
                </span>
              </div>
            </div>

            {/* Capacity Meter */}
            <div className="bg-gray-50 dark:bg-gray-950 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-gray-700 dark:text-gray-300">{t('tools.admin.capModeLabel')}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                  {t('tools.admin.capRatio', { count: users.length })} / {isLimitClosedForNew ? t('tools.admin.capClosed00') : (limitNum > 0 ? t('tools.admin.capUserCount', { count: limitNum }) : t('tools.admin.capNoLimit'))}
                </span>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLimitClosedForNew
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : isLimitReached
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  }`}
                  style={{ width: isLimitClosedForNew ? '100%' : (limitNum > 0 ? `${Math.min(100, (users.length / limitNum) * 100)}%` : '10%') }}
                />
              </div>

              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs space-y-1">
                <div className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>{t('tools.admin.capValueDetails')}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">"{maxUsersLimit}"</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                  {isLimitClosedForNew
                    ? t('tools.admin.capExplain00')
                    : limitNum === 0
                    ? t('tools.admin.capExplain0')
                    : t('tools.admin.capExplainN', { count: limitNum })}
                </p>
              </div>
            </div>

            {/* Quick Presets & Controls Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  {t('tools.admin.capQuick')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxUsersLimit('0')}
                    className={`p-3 rounded-xl border text-xs font-black transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                      maxUsersLimit === '0'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span>{t('tools.admin.opt0Title')}</span>
                    <span className="text-[10px] font-normal">{t('tools.admin.opt0Desc')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaxUsersLimit('00')}
                    className={`p-3 rounded-xl border text-xs font-black transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                      maxUsersLimit === '00'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span>{t('tools.admin.opt00Title')}</span>
                    <span className="text-[10px] font-normal">{t('tools.admin.opt00Desc')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaxUsersLimit('50')}
                    className={`p-3 rounded-xl border text-xs font-black transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                      maxUsersLimit !== '0' && maxUsersLimit !== '00'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span>{t('tools.admin.optNumTitle')}</span>
                    <span className="text-[10px] font-normal">{t('tools.admin.optNumDesc')}</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    {t('tools.admin.capValueLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={maxUsersLimit}
                      onChange={(e) => setMaxUsersLimit(e.target.value)}
                      placeholder={t('tools.admin.capPlaceholder')}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:border-purple-500 outline-none transition dir-ltr text-start"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    {t('tools.admin.capRejectLabel')}
                  </label>
                  <input
                    type="text"
                    value={maxUsersMessage}
                    onChange={(e) => setMaxUsersMessage(e.target.value)}
                    placeholder={t('tools.admin.capMsgPlaceholder')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveUserLimit}
                disabled={limitSaving}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {limitSaving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Lock className="w-4 h-4" />}
                {limitSaving ? t('common.saving') : t('tools.admin.capSaveBtn')}
              </button>
            </div>
          </div>

          {/* VOICE SAMPLES GENERATION CARD */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Mic2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.voiceSectionTitle')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('tools.admin.voiceSectionDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleGenerateVoiceSamples(false)}
                disabled={voiceGenLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {voiceGenLoading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Mic2 className="w-4 h-4" />}
                {voiceGenLoading ? t('tools.admin.voiceChecking') : t('tools.admin.voiceCheckMissing')}
              </button>

              <button
                type="button"
                onClick={() => handleGenerateVoiceSamples(true)}
                disabled={voiceGenLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {voiceGenLoading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <RefreshCw className="w-4 h-4" />}
                {t('tools.admin.voiceForce')}
              </button>
            </div>

            {voiceGenResult && (
              <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs space-y-2">
                <p className="font-bold text-gray-900 dark:text-white">{voiceGenResult.message}</p>
                {voiceGenResult.summary && (
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span>{t('tools.admin.voiceNewLabel')} <b className="text-emerald-500">{voiceGenResult.summary.generatedCount}</b></span>
                    <span>{t('tools.admin.voiceSkipLabel')} <b className="text-indigo-500">{voiceGenResult.summary.skippedCount}</b></span>
                    <span>{t('tools.admin.voiceFailLabel')} <b className="text-rose-500">{voiceGenResult.summary.failedCount}</b></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EMERGENCY MAINTENANCE CARD */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${maintIsActive ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  <Power className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.maintSectionTitle')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('tools.admin.maintSectionDesc')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleMaintenance(!maintIsActive)}
                disabled={maintSaving}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer ${
                  maintIsActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white'
                }`}
              >
                <Power className="w-4 h-4" />
                {maintSaving ? t('tools.admin.applying') : (maintIsActive ? t('tools.admin.maintResumeBtn') : t('tools.admin.maintStopBtn'))}
              </button>
            </div>

            {/* Customization Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                {t('tools.admin.maintCardLabel')}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('tools.admin.maintCardTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    placeholder={t('tools.admin.maintTitleDefault')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-red-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('tools.admin.maintIntroLabel')}
                  </label>
                  <input
                    type="text"
                    value={maintIntro}
                    onChange={(e) => setMaintIntro(e.target.value)}
                    placeholder={t('tools.admin.maintIntroDefault')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('tools.admin.maintExplainLabel')}
                </label>
                <textarea
                  rows={2}
                  value={maintExplanation}
                  onChange={(e) => setMaintExplanation(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:border-red-500 outline-none transition leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveMaintenanceText}
                  disabled={maintSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {maintSaving ? t('common.saving') : t('tools.admin.maintSaveTexts')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.usersSectionTitle')}</h2>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute end-3 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={t('tools.admin.userSearchPh')}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl pe-9 ps-3 py-2 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                />
              </div>

              {/* Type Filters */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
                <button 
                  onClick={() => setUserTypeFilter('regular')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'regular' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {t('tools.admin.filterRegular', { count: users.filter(u => !u.isAdmin).length })}
                </button>
                <button 
                  onClick={() => setUserTypeFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {t('tools.admin.filterAdmins', { count: users.filter(u => u.isAdmin).length })}
                </button>
                <button 
                  onClick={() => setUserTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {t('tools.admin.filterAllUsers', { count: users.length })}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card List (Visible on Phone Screens) */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">{t('tools.admin.usersEmpty')}</p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.uid} className="bg-gray-50 dark:bg-gray-950/70 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {u.displayName || u.email?.split('@')[0] || t('tools.admin.noName')}
                      </h4>
                      <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{u.email}</p>
                      <p className="text-[9px] font-mono text-gray-400 truncate">UID: {u.uid}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                        {u.balance} {t('tools.admin.point')}
                      </span>
                      {u.isAdmin ? (
                        <span className="text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-md">
                          {u.canAddAdmins ? t('tools.admin.superAdmin') : t('tools.admin.adminRole')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">{t('tools.admin.roleUser')}</span>
                      )}
                      {u.isBlocked && (
                        <span className="text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                          {t('tools.admin.blocked')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Action Controls */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800/80 flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setSelectedChatUserId(u.uid);
                        setActiveTab('user_chats');
                      }}
                      className="text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> {t('tools.admin.chatsBtn')}
                    </button>

                    <button 
                      onClick={() => handleOpenBalanceModal(u)} 
                      className="text-[11px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" /> {t('tools.admin.adjustBalance')}
                    </button>

                    {user?.canAddAdmins && u.uid !== user.uid && (
                      !u.isAdmin ? (
                        <button onClick={() => handleGrantAdmin(u.uid, false)} className="text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-xl flex items-center gap-1 transition">
                          <UserPlus className="w-3.5 h-3.5" /> {t('tools.admin.promoteAdmin')}
                        </button>
                      ) : (
                        <button onClick={() => handleRevokeAdmin(u.uid)} className="text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl flex items-center gap-1 transition">
                          <ShieldAlert className="w-3.5 h-3.5" /> {t('tools.admin.revokePerm')}
                        </button>
                      )
                    )}

                    {user?.isAdmin && u.uid !== user.uid && (
                      <button onClick={() => handleToggleBlock(u.uid, !!u.isBlocked)} className={`text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {u.isBlocked ? t('tools.admin.unblock') : t('tools.admin.blockAccount')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-extrabold">{t('tools.admin.colUser')}</th>
                  <th className="pb-3 font-extrabold">{t('tools.admin.colEmail')}</th>
                  <th className="pb-3 font-extrabold">{t('tools.admin.colBalance')}</th>
                  <th className="pb-3 font-extrabold">{t('tools.admin.colRank')}</th>
                  <th className="pb-3 font-extrabold text-center">{t('tools.admin.colControls')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/40 transition">
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      {u.displayName || t('tools.admin.unnamed')}
                    </td>
                    <td className="py-3.5 font-mono text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3.5 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {u.balance} <span className="text-[10px] font-medium text-gray-400">{t('tools.admin.point')}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.isAdmin ? (
                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            {u.canAddAdmins ? t('tools.admin.superAdmin') : t('tools.admin.adminRole')}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">{t('tools.admin.roleRegular')}</span>
                        )}
                        {u.isBlocked && (
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {t('tools.admin.blocked')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedChatUserId(u.uid);
                            setActiveTab('user_chats');
                          }}
                          className="text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> {t('tools.admin.chatsBtn')}
                        </button>

                        <button 
                          onClick={() => handleOpenBalanceModal(u)} 
                          className="text-[11px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title={t('tools.admin.adjustBalanceTitle')}
                        >
                          <Coins className="w-3 h-3" /> {t('tools.admin.balanceShort')}
                        </button>

                        {user?.canAddAdmins && u.uid !== user.uid && (
                          !u.isAdmin ? (
                            <button onClick={() => handleGrantAdmin(u.uid, false)} className="text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer">
                              <UserPlus className="w-3 h-3" /> {t('tools.admin.promoteAdmin')}
                            </button>
                          ) : (
                            <button onClick={() => handleRevokeAdmin(u.uid)} className="text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer">
                              <ShieldAlert className="w-3 h-3" /> {t('tools.admin.revokeAdmin')}
                            </button>
                          )
                        )}

                        {user?.isAdmin && u.uid !== user.uid && (
                          <button onClick={() => handleToggleBlock(u.uid, !!u.isBlocked)} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {u.isBlocked ? t('tools.admin.unblock') : t('tools.admin.blockShort')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REDEEM CODES */}
      {activeTab === 'codes' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl h-fit space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2 text-gray-900 dark:text-white">
              <Key className="w-5 h-5 text-purple-500"/> {t('tools.admin.issueCodesTitle')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.pointsPerCode')}</label>
                <input type="number" min="1" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.codesCountLabel')}</label>
                <input type="number" min="1" max="500" value={bulkCount} onChange={e => setBulkCount(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.usageLimitLabel')}</label>
                <input type="number" min="1" value={maxUsage} onChange={e => setMaxUsage(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <button onClick={handleCreateCode} disabled={isGeneratingCodes} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition shadow-lg shadow-purple-500/20 cursor-pointer">
                {isGeneratingCodes ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Plus className="w-4 h-4" />} 
                {isGeneratingCodes ? t('tools.admin.issuing') : t('tools.admin.issueNow')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">{t('tools.admin.latestCodes', { count: codes.length })}</h2>
              <button onClick={exportCSV} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer font-bold">
                <Download className="w-3.5 h-3.5" /> {t('tools.admin.exportCsv')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="pb-3 font-bold">{t('tools.admin.colCode')}</th>
                    <th className="pb-3 font-bold">{t('common.points')}</th>
                    <th className="pb-3 font-bold">{t('common.status')}</th>
                    <th className="pb-3 font-bold">{t('tools.admin.colIssued')}</th>
                    <th className="pb-3 font-bold text-center">{t('common.copy')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {codes.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-3 font-mono font-bold text-gray-900 dark:text-gray-200">{c.code}</td>
                      <td className="py-3 font-black text-indigo-600 dark:text-indigo-400">{c.points} {t('tools.admin.point')}</td>
                      <td className="py-3">
                        {c.used ? (
                          <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md font-bold">{t('tools.admin.codeUsed')}</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">{t('tools.admin.codeAvailable')}</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500 text-[11px]">{formatDate(c.createdAt, { dateStyle: 'medium' })}</td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => { navigator.clipboard.writeText(c.code); toast.success(t('tools.admin.codeCopiedBang')); }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                          title={t('tools.admin.copyCodeTitle')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: UNIFIED MODEL & PRICING CONTROL CENTER */}
      {activeTab === 'model_pricing' && (
        <AdminModelPricing />
      )}

      {/* TAB: NAJE AD MULTI-SHOT ENGINE MANAGEMENT */}
      {activeTab === 'naje_ad' && (
        <AdminNajeAd />
      )}


      {/* TAB 7: FLAGGED REQUESTS */}
      {activeTab === 'flagged' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('tools.admin.flaggedTitle')}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-bold">{t('tools.admin.colUserId')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.colType')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.colPrompt')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.colReason')}</th>
                  <th className="pb-3 font-bold">{t('tools.admin.colDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {flaggedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">{t('tools.admin.noFlaggedLog')}</td>
                  </tr>
                ) : (
                  flaggedRequests.map((req, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-mono text-gray-500 text-[11px]">{req.uid}</td>
                      <td className="py-3">
                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {req.type === 'image' ? t('tools.admin.typeImage') : (req.type === 'video' ? t('tools.admin.typeVideo') : t('tools.admin.typeDoc'))}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs truncate text-gray-900 dark:text-gray-200" title={req.prompt}>{req.prompt}</td>
                      <td className="py-3 text-amber-500 font-bold">{req.reason}</td>
                      <td className="py-3 text-gray-500 text-[11px]">
                        {formatDate(req.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: SKILLS LIBRARY */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
            <h3 className="font-bold text-sm">{editingSkillId ? t('tools.admin.skillEdit') : t('tools.admin.skillAdd')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={skillDraft.name}
                onChange={e => setSkillDraft({ ...skillDraft, name: e.target.value })}
                placeholder={t('tools.admin.skillNamePh')}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white font-bold"
              />
              <select
                value={skillDraft.appliesTo}
                onChange={e => setSkillDraft({ ...skillDraft, appliesTo: e.target.value })}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white font-bold"
              >
                <option value="all">{t('tools.admin.skillsAll')}</option>
                <option value="pptx">{t('tools.admin.skillsPptx')}</option>
                <option value="docx">{t('tools.admin.skillsDocx')}</option>
                <option value="pdf">{t('tools.admin.skillsPdf')}</option>
              </select>
              <input
                type="number"
                value={skillDraft.priority}
                onChange={e => setSkillDraft({ ...skillDraft, priority: Number(e.target.value) })}
                placeholder={t('tools.admin.skillPriorityPh')}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white"
              />
            </div>

            <textarea
              value={skillDraft.instructions}
              onChange={e => setSkillDraft({ ...skillDraft, instructions: e.target.value })}
              rows={4}
              placeholder={t('tools.admin.skillInstrPh')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white"
            />

            <button
              disabled={skillSaving || !skillDraft.name.trim()}
              onClick={async () => {
                setSkillSaving(true);
                try {
                  const payload = {
                    name: skillDraft.name.trim(),
                    appliesTo: [skillDraft.appliesTo],
                    priority: skillDraft.priority || 10,
                    instructions: skillDraft.instructions.trim(),
                    enabled: skillDraft.enabled !== false,
                    updatedAt: Date.now()
                  };
                  if (editingSkillId) {
                    await updateDoc(doc(db, 'skills', editingSkillId), payload);
                    setSkills(prev => prev.map(s => s.id === editingSkillId ? { id: editingSkillId, ...payload } : s));
                  } else {
                    const ref = await addDoc(collection(db, 'skills'), { ...payload, createdAt: Date.now() });
                    setSkills(prev => [...prev, { id: ref.id, ...payload }]);
                  }
                  setSkillDraft({ name: '', appliesTo: 'all', priority: 10, instructions: '', enabled: true });
                  setEditingSkillId(null);
                  toast.success(t('tools.admin.skillSaved'));
                } catch (e) {
                  toast.error(t('tools.admin.skillSaveFail'));
                } finally {
                  setSkillSaving(false);
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {skillSaving ? t('common.saving') : (editingSkillId ? t('tools.admin.skillSaveEdit') : t('tools.admin.skillAddBtn'))}
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: FEEDBACK */}
      {activeTab === 'feedback' && (() => {
        const upVotes = feedbackSignals.filter(f => f.signal === 'up');
        const downVotes = feedbackSignals.filter(f => f.signal === 'down');
        const upPercent = feedbackSignals.length ? Math.round((upVotes.length / feedbackSignals.length) * 100) : 0;
        const downPercent = feedbackSignals.length ? Math.round((downVotes.length / feedbackSignals.length) * 100) : 0;

        // Top reasons frequency calculation
        const reasonCounts: Record<string, number> = {};
        feedbackSignals.forEach(f => {
          if (Array.isArray(f.reasons)) {
            f.reasons.forEach((r: string) => {
              reasonCounts[r] = (reasonCounts[r] || 0) + 1;
            });
          }
        });
        const topReasons = Object.entries(reasonCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Filtering logic
        const filteredFeedback = feedbackSignals.filter(f => {
          if (feedbackFilter === 'up' && f.signal !== 'up') return false;
          if (feedbackFilter === 'down' && f.signal !== 'down') return false;
          if (feedbackSearch.trim()) {
            const q = feedbackSearch.toLowerCase();
            const noteMatch = f.note?.toLowerCase().includes(q);
            const userMatch = f.ownerId?.toLowerCase().includes(q) || f.userId?.toLowerCase().includes(q) || f.userEmail?.toLowerCase().includes(q);
            const reasonsMatch = Array.isArray(f.reasons) && f.reasons.some((r: string) => r.toLowerCase().includes(q));
            return noteMatch || userMatch || reasonsMatch;
          }
          return true;
        });

        return (
          <div className="space-y-6">
            {/* Header Box */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('tools.admin.fbCenterTitle')}</h3>
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {t('tools.admin.fbLive')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('tools.admin.fbCenterDesc')}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>{t('tools.admin.fbTotalSignals', { count: feedbackSignals.length })}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block">{t('tools.admin.fbTotalLabel')}</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{feedbackSignals.length}</span>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">{t('tools.admin.fbUpLabel')}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{upVotes.length}</span>
                      <span className="text-xs font-bold text-emerald-500">({upPercent}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">{t('tools.admin.fbDownLabel')}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-red-600 dark:text-red-400">{downVotes.length}</span>
                      <span className="text-xs font-bold text-red-500">({downPercent}%)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-red-500/20 text-red-500 rounded-xl">
                    <ThumbsDown className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">{t('tools.admin.fbTopReasons')}</span>
                  <div className="flex flex-wrap gap-1">
                    {topReasons.length === 0 ? (
                      <span className="text-xs text-gray-400">{t('tools.admin.fbNoTags')}</span>
                    ) : (
                      topReasons.slice(0, 3).map(([reason, count]) => (
                        <span key={reason} className="text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                          {reason} ({count})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar & List */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute end-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={e => setFeedbackSearch(e.target.value)}
                    placeholder={t('tools.admin.fbSearchPh')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pe-9 ps-4 py-2 text-xs outline-none text-gray-900 dark:text-white focus:border-purple-500 transition"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800 self-start md:self-auto">
                  <button
                    onClick={() => setFeedbackFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      feedbackFilter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('tools.admin.fbAll', { count: feedbackSignals.length })}
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('up')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      feedbackFilter === 'up' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{t('tools.admin.fbUp', { count: upVotes.length })}</span>
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('down')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      feedbackFilter === 'down' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{t('tools.admin.fbDown', { count: downVotes.length })}</span>
                  </button>
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {filteredFeedback.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                    <p className="text-xs font-bold text-gray-500">{t('tools.admin.fbEmpty')}</p>
                  </div>
                ) : (
                  filteredFeedback.map((fb) => {
                    const matchedUser = users.find(u => u.uid === (fb.ownerId || fb.userId));
                    const userDisplay = matchedUser?.email || fb.userEmail || matchedUser?.displayName || fb.ownerId || fb.userId || t('tools.admin.unknownUser');
                    const isUp = fb.signal === 'up';

                    return (
                      <div 
                        key={fb.id} 
                        className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          isUp 
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40' 
                            : 'bg-red-500/5 dark:bg-red-500/[0.03] border-red-500/20 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isUp ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                            {isUp ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs text-gray-900 dark:text-white truncate" title={userDisplay}>
                                {userDisplay}
                              </span>
                              {fb.chatType && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  {t('tools.admin.fbChatType', { type: fb.chatType })}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-mono">
                                {fb.createdAt ? formatDate(fb.createdAt, { dateStyle: 'medium', timeStyle: 'short' }) : t('tools.admin.now')}
                              </span>
                            </div>

                            {/* Reasons list */}
                            {Array.isArray(fb.reasons) && fb.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {fb.reasons.map((r: string, idx: number) => (
                                  <span 
                                    key={idx} 
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      isUp 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                                        : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* User note */}
                            {fb.note && (
                              <p className="text-xs text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-950/60 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 leading-relaxed font-sans">
                                "{fb.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => handleDeleteFeedback(fb.id)}
                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                            title={t('tools.admin.fbDeleteTitle')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 10: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="w-5 h-5 text-purple-500" />
              <span>{t('tools.admin.notifSendTitle')}</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.notifTitleLabel')}</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder={t('tools.admin.notifTitlePh')}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.notifBodyLabel')}</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder={t('tools.admin.notifBodyPh')}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition resize-none"
                />
              </div>

              <button
                onClick={handleSendNotification}
                disabled={isSendingNotif}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSendingNotif ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Send className="w-4 h-4" />}
                {isSendingNotif ? t('tools.admin.notifSending') : t('tools.admin.notifSendNow')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>{t('tools.admin.notifPreviewHeading')}</span>
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-950/50 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl">
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-[#0d0f12]">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{notifTitle || t('tools.admin.notifPreviewTitle')}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{notifMessage || t('tools.admin.notifPreviewBody')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Balance Adjustment Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-start">
            <button 
              onClick={handleCloseBalanceModal}
              className="absolute top-4 left-4 p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">{t('tools.admin.balanceTitle')}</h3>
                <p className="text-xs text-gray-500">{t('tools.admin.balanceDesc')}</p>
              </div>
            </div>

            {/* Target User Info Banner */}
            <div className="bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">{balanceModalUser.displayName || t('tools.admin.unnamed')}</div>
                <div className="text-[11px] font-mono text-gray-500">{balanceModalUser.email}</div>
              </div>
              <div className="text-end">
                <div className="text-[10px] text-gray-400">{t('tools.admin.currentBalance')}</div>
                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {balanceModalUser.balance || 0} <span className="text-[10px] font-normal text-gray-400">{t('common.points')}</span>
                </div>
              </div>
            </div>

            {/* Action Type Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t('tools.admin.opType')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAction('add')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustAction === 'add'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> {t('tools.admin.opAdd')}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('deduct')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustAction === 'deduct'
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> {t('tools.admin.opDeduct')}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('set')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustAction === 'set'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {t('tools.admin.opSet')}
                </button>
              </div>
            </div>

            {/* Amount & Quick Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {adjustAction === 'set' ? t('tools.admin.amountNew') : t('tools.admin.amountApply')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder={t('tools.admin.amountPh')}
                  className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white font-mono outline-none focus:border-indigo-500 transition"
                />
                <div className="flex gap-1">
                  {[5, 10, 25, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAdjustAmount(val)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time simulation preview */}
              {(() => {
                const cur = Number(balanceModalUser.balance) || 0;
                const amt = Number(adjustAmount) || 0;
                let simulated = cur;
                if (adjustAction === 'add') simulated = cur + amt;
                else if (adjustAction === 'deduct') simulated = Math.max(0, cur - amt);
                else if (adjustAction === 'set') simulated = amt;
                simulated = parseFloat(simulated.toFixed(4));
                const delta = parseFloat((simulated - cur).toFixed(4));

                return (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{t('tools.admin.resultBalance')}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t('tools.agent.pointsBadge', { count: simulated })} {delta !== 0 && <span className={`text-[11px] ${delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>({delta > 0 ? `+${delta}` : delta})</span>}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Reason Selector */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.reasonLabel')}</label>
              <NajeSelect
                value={adjustReasonPreset}
                onChange={(val) => setAdjustReasonPreset(val)}
                options={[
                  { value: 'تعويض عن عملية توليد متعثرة', label: t('tools.admin.reasonFail') },
                  { value: 'مكافأة / ترقية دعم فني', label: t('tools.admin.reasonReward') },
                  { value: 'شحن يدوي للعميل (دفع خارجي)', label: t('tools.admin.reasonManual') },
                  { value: 'تصحيح رصيد خاطئ', label: t('tools.admin.reasonFix') },
                  { value: 'خصم نقاط بسبب إساءة استخدام', label: t('tools.admin.reasonAbuse') },
                  { value: 'custom', label: t('tools.admin.reasonCustom') }
                ]}
              />
            </div>

            {adjustReasonPreset === 'custom' && (
              <div className="mb-3">
                <input
                  type="text"
                  value={adjustCustomReason}
                  onChange={(e) => setAdjustCustomReason(e.target.value)}
                  placeholder={t('tools.admin.reasonPh')}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
            )}

            {/* Internal Notes */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t('tools.admin.notesLabel')}</label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder={t('tools.admin.notesPh')}
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCloseBalanceModal}
                disabled={adjustSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitBalanceAdjustment}
                disabled={adjustSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {adjustSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <CheckCircle className="w-4 h-4" />}
                {adjustSubmitting ? t('tools.admin.applying') : t('tools.admin.confirmSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
);
}
