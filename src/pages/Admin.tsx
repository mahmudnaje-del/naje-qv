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


export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAppStore();
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
  const [maxUsersMessage, setMaxUsersMessage] = useState<string>('نعتذر، وصل التطبيق إلى الحد الأقصى للمستخدمين المسموح بتسجيلهم حالياً. يرجى التواصل مع الإدارة.');
  const [limitSaving, setLimitSaving] = useState<boolean>(false);

  // Emergency Maintenance / System Status States
  const [maintIsActive, setMaintIsActive] = useState<boolean>(false);
  const [maintTitle, setMaintTitle] = useState<string>('إيقاف الخدمات مؤقتاً للتطوير والإصلاح');
  const [maintIntro, setMaintIntro] = useState<string>('تم إيقاف الخدمات من أجل التطوير والإصلاح، شكراً لكم.');
  const [maintExplanation, setMaintExplanation] = useState<string>('يقوم فريق المطورين حالياً بإجراء تحديثات هامة وتحسينات أمنية وشاملة للبنية التحتية لضمان تقديم أداء أفضل وأسرع لكافة المستخدمين. سينتهي العمل وتعود كافة الخدمات فور اكتمال التحديثات.');
  const [maintSolutions, setMaintSolutions] = useState<string>('يرجى الانتظار والعودة لاحقاً.\nتابع الإشعارات الرسمية لمعرفة فور عودة الخدمة للعمل.');
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
        toast.error("يرجى تسجيل الدخول أولاً.");
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
        throw new Error(data.error || "حدث خطأ أثناء طلب توليد الأصوات.");
      }
      setVoiceGenResult(data);
      toast.success(data.message || "تمت معالجة الأصوات بنجاح!");
    } catch (err: any) {
      console.error("handleGenerateVoiceSamples error:", err);
      toast.error(err.message || "فشلت عملية توليد الأصوات.");
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
      toast.success('تم حذف التقييم بنجاح');
    } catch (err) {
      toast.error('تعذر حذف التقييم');
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
      toast.error('يرجى إدخال عنوان الإشعار');
      return;
    }
    if (!notifMessage.trim()) {
      toast.error('يرجى إدخال نص الرسالة');
      return;
    }
    if (notifTarget === 'specific' && !notifTargetUid.trim()) {
      toast.error('يرجى إدخال معرف المستخدم المستهدف (UID)');
      return;
    }

    const confirmMsg = notifTarget === 'all' 
      ? 'هل أنت متأكد من رغبتك في إرسال هذا الإشعار لجميع المستخدمين؟' 
      : 'هل أنت متأكد من رغبتك في إرسال هذا الإشعار للمستخدم المحدد؟';

    const confirmed = await useToastStore.getState().showConfirm('تأكيد الإرسال', confirmMsg);
    if (!confirmed) return;

    setIsSendingNotif(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('لم يتم العثور على توكين الصلاحية. يرجى تسجيل الدخول مجدداً.');
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
        throw new Error(data.error || 'فشل إرسال الإشعار');
      }

      toast.success(data.message || 'تم إرسال الإشعار بنجاح!');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ غير متوقع أثناء إرسال الإشعار.');
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
        if (!resp.ok) throw new Error(data.error || 'فشل توليد الأكواد بالجملة');
        setCodes([...data.codes, ...codes]);
        toast.success(`تم توليد ${data.totalGenerated} كود بنجاح (معرف الدفعة: ${data.batchId})!`);
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
        toast.success(`تم توليد الكود بنجاح!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء التوليد: ' + err.message);
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const exportCSV = () => {
    const rawCsv = "الكود,النقاط,تاريخ التوليد\n"
      + codes.map(c => `${c.code},${c.points},${new Date(c.createdAt).toLocaleDateString('ar-EG')}`).join("\n");
    
    triggerSmartDownload({
      data: rawCsv,
      mimeType: 'text/csv',
      ext: 'csv',
      title: `سجل_أكواد_التفعيل_منصة_ناجي_${new Date().toISOString().slice(0, 10)}`,
      fallbackName: 'سجل_أكواد_التفعيل_ناجي',
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
        maxUsersMessage: maxUsersMessage.trim() || 'نعتذر، وصل التطبيق إلى الحد الأقصى للمستخدمين المسموح بتسجيلهم حالياً. يرجى التواصل مع الإدارة.',
        registeredUsersCount: users.length,
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      toast.success('تم حفظ وتحديث سقف عدد المستخدمين بنجاح!');
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ سقف المستخدمين: ' + err.message);
    } finally {
      setLimitSaving(false);
    }
  };

  const handleToggleMaintenance = async (enable: boolean) => {
    const confirmMsg = enable
      ? 'هل أنت متأكد من إيقاف خدمات ناجي بشكل كامل وتفعيل وضع الصيانة والتطوير لجميع المستخدمين؟'
      : 'هل أنت متأكد من إلغاء وضع الصيانة وإعادة تشغيل خدمات ناجي بنجاح؟';
    const confirmed = await useToastStore.getState().showConfirm('تنبيه حالة النظام', confirmMsg);
    if (!confirmed) return;

    setMaintSaving(true);
    try {
      const solList = maintSolutions.split('\n').map(s => s.trim()).filter(Boolean);
      await setDoc(doc(db, 'config', 'system_status'), {
        isMaintenance: enable,
        title: maintTitle.trim() || 'إيقاف الخدمات مؤقتاً للتطوير والإصلاح',
        intro: maintIntro.trim() || 'تم إيقاف الخدمات من أجل التطوير والإصلاح، شكراً لكم.',
        explanation: maintExplanation.trim() || 'يقوم فريق المطورين حالياً بإجراء تحديثات هامة وتحسينات أمنية وشاملة للبنية التحتية لضمان تقديم أداء أفضل وأسرع لكافة المستخدمين. سينتهي العمل وتعود كافة الخدمات فور اكتمال التحديثات.',
        solutions: solList.length > 0 ? solList : ['يرجى الانتظار والعودة لاحقاً.', 'تابع الإشعارات الرسمية لمعرفة فور عودة الخدمة للعمل.'],
        updatedAt: Date.now(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      setMaintIsActive(enable);
      if (enable) {
        toast.success('تم إيقاف ناجي عن العمل وإظهار بطاقة الصيانة لجميع المستخدمين');
      } else {
        toast.success('تم إعادة تشغيل ناجي وإلغاء وضع الصيانة بنجاح');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحديث حالة النظام: ' + err.message);
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
      toast.success('تم حفظ وتعديل نصوص بطاقة الصيانة بنجاح!');
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setMaintSaving(false);
    }
  };

  const handleGrantAdmin = async (targetUid: string, canAddAdmins: boolean) => {
    if (!user?.canAddAdmins) {
      toast.error('ليس لديك صلاحية لإضافة مدراء.');
      return;
    }
    const confirmed = await useToastStore.getState().showConfirm('تأكيد الإجراء', 'هل أنت متأكد من منح صلاحيات الإدارة لهذا المستخدم؟');
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isAdmin: true,
          canAddAdmins
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isAdmin: true, canAddAdmins } : u));
        toast.success('تم منح الصلاحيات بنجاح.');
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء ترقية المستخدم.');
      }
    }
  };

  const handleToggleBlock = async (targetUid: string, currentBlockStatus: boolean) => {
    if (!user?.isAdmin) return;
    if (targetUid === user.uid) {
      toast.error('لا يمكنك حظر نفسك.');
      return;
    }
    const msg = currentBlockStatus ? 'هل أنت متأكد من فك الحظر عن هذا المستخدم؟' : 'هل أنت متأكد من حظر هذا المستخدم؟';
    const confirmed = await useToastStore.getState().showConfirm('تأكيد الإجراء', msg);
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isBlocked: !currentBlockStatus
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isBlocked: !currentBlockStatus } : u));
        toast.success('تم تنفيذ العملية بنجاح.');
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء تنفيذ العملية.');
      }
    }
  };

  const handleRevokeAdmin = async (targetUid: string) => {
    if (!user?.canAddAdmins) {
      toast.error('ليس لديك صلاحية لإزالة المدراء.');
      return;
    }
    if (targetUid === user.uid) {
      toast.error('لا يمكنك إزالة صلاحياتك بنفسك.');
      return;
    }
    const confirmed = await useToastStore.getState().showConfirm('تأكيد الإجراء', 'هل أنت متأكد من سحب صلاحيات الإدارة من هذا المستخدم؟');
    if (confirmed) {
      try {
        await updateDoc(doc(db, 'users', targetUid), {
          isAdmin: false,
          canAddAdmins: false
        });
        setUsers(users.map(u => u.uid === targetUid ? { ...u, isAdmin: false, canAddAdmins: false } : u));
        toast.success('تم سحب الصلاحيات بنجاح.');
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء سحب الصلاحيات.');
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
      toast.error('يرجى إدخال قيمة عددية موجبة وصحيحة للنقاط.');
      return;
    }
    const finalReason = adjustReasonPreset === 'custom' 
      ? (adjustCustomReason.trim() || 'تعديل رصيد مخصص') 
      : adjustReasonPreset;

    setAdjustSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('يرجى تسجيل الدخول كمسؤول أولاً.');
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
        throw new Error(data.error || 'فشلت عملية تعديل الرصيد');
      }

      setUsers(users.map(u => u.uid === balanceModalUser.uid ? { ...u, balance: data.newBalance } : u));
      toast.success(`تم تحديث رصيد ${balanceModalUser.displayName || balanceModalUser.email} بنجاح! الرصيد الجديد: ${data.newBalance} نقطة`);
      handleCloseBalanceModal();
    } catch (err: any) {
      toast.error('خطأ في تعديل الرصيد: ' + err.message);
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
      toast.success('تم تحديث مزود الخدمة بنجاح!');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تحديث مزود الخدمة: ' + err.message);
    }
  };

  // Aggregate stats by model
  const aggregatedStats = () => {
    const categories: Record<string, { name: string, count: number, points: number, costUSD: number }> = {
      'lite': { name: 'Naje Imagen Lite (صورة)', count: 0, points: 0, costUSD: 0 },
      'spectra': { name: 'Naje Imagen (صورة)', count: 0, points: 0, costUSD: 0 },
      'nova': { name: 'Naje Imagen Pro (صورة)', count: 0, points: 0, costUSD: 0 },
      'veo': { name: 'Naje Video (فيديو)', count: 0, points: 0, costUSD: 0 },
      'veo-pro': { name: 'Naje Video Pro (فيديو)', count: 0, points: 0, costUSD: 0 },
      'omni': { name: 'Naje Video Pro (فيديو)', count: 0, points: 0, costUSD: 0 },
      'pdf': { name: 'PDF Documents (مستند)', count: 0, points: 0, costUSD: 0 },
      'docx': { name: 'Word Documents (مستند)', count: 0, points: 0, costUSD: 0 },
      'pptx': { name: 'PowerPoint (مستند)', count: 0, points: 0, costUSD: 0 },
      'text': { name: 'Standard Text (محادثة)', count: 0, points: 0, costUSD: 0 }
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Top Main Bar Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-md shadow-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-950/40 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-200/80 dark:border-gray-700/80 transition-all active:scale-95 shadow-sm cursor-pointer group"
            title="رجوع للصفحة السابقة"
          >
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 text-white rounded-2xl shadow-lg shadow-purple-500/20">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                لوحة التحكم والتطوير
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Naje Admin
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              إدارة المستخدمين، سقف التسجيل، أسعار النماذج الموحدة، والسياسات العامة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link 
            to="/" 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer border border-purple-500/20"
          >
            <span>العودة للاستوديو الرئيسي</span>
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
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">إجمالي المسجلين</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{users.length}</span>
              <span className="text-xs font-medium text-gray-500">حساب</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isLimitReached ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Lock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">سقف السعة المسموحة</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {isLimitClosedForNew ? 'مغلق (00)' : (limitNum > 0 ? `${limitNum}` : 'غير محدود (0)')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLimitClosedForNew ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                isLimitReached ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isLimitClosedForNew ? 'للمسجلين فقط' : (isLimitReached ? 'مكتفي' : (limitNum > 0 ? 'متاح' : 'مفتوح'))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-xl ${maintIsActive ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">حالة الخدمات العامة</span>
            <span className={`text-xs font-black inline-block mt-1 px-2.5 py-0.5 rounded-full ${
              maintIsActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {maintIsActive ? 'صيانة وتوقف' : 'يعمل كالمعتاد'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Key className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block truncate">الأكواد المصدرة</span>
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
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">سقف عدد المستخدمين المسموح به (User Limit)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    حدد الحد الأقصى للمستخدمين الجدد. عند الوصول للعدد المحدد يتم إيقاف تسجيل الحسابات الجديدة مع السماح للمستخدمين القدامى بالدخول والخروج بحرية.
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
                    ? 'مغلق للجدد (متاح للمسجلين فقط)'
                    : isLimitReached
                    ? 'تم اكتفاء العدد'
                    : 'متاح للتسجيل'}
                </span>
              </div>
            </div>

            {/* Capacity Meter */}
            <div className="bg-gray-50 dark:bg-gray-950 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-gray-700 dark:text-gray-300">وضع السعة الحالي:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                  {users.length} مستخدم مسجل / {isLimitClosedForNew ? '00 (مغلق للجدد)' : (limitNum > 0 ? `${limitNum} مستخدم` : '0 (بلا حد)')}
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
                  <span>تفاصيل القيمة المحددة:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">"{maxUsersLimit}"</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                  {isLimitClosedForNew
                    ? '(القيمة 00): التسجيل مغلق تماماً لأي شخص جديد. متاح فقط للأشخاص المسجلين سابقاً بروابط حساباتهم.'
                    : limitNum === 0
                    ? '(القيمة 0): التسجيل متاح للجميع وبلا حدود.'
                    : `(القيمة ${limitNum}): التسجيل متاح للجميع حتى يصل إجمالي الحسابات إلى ${limitNum} مستخدم.`}
                </p>
              </div>
            </div>

            {/* Quick Presets & Controls Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                  خيارات سريعة لضبط نظام التسجيل:
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
                    <span>القيمة 0 (مفتوح)</span>
                    <span className="text-[10px] font-normal">متاح للجميع (بلا حدود)</span>
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
                    <span>القيمة 00 (مغلق)</span>
                    <span className="text-[10px] font-normal">متاح للمسجلين سابقاً فقط</span>
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
                    <span>حد عددي أقصى</span>
                    <span className="text-[10px] font-normal">تحديد رقم مستخدمين معين</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    قيمة سقف المستخدمين (0 للجميع / 00 للمسجلين فقط / رقم للحد):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={maxUsersLimit}
                      onChange={(e) => setMaxUsersLimit(e.target.value)}
                      placeholder="0 أو 00 أو رقم مثلاً 50"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:border-purple-500 outline-none transition dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2">
                    رسالة الرفض التي تظهر للمستخدم الجديد عند الاكتفاء أو الإغلاق:
                  </label>
                  <input
                    type="text"
                    value={maxUsersMessage}
                    onChange={(e) => setMaxUsersMessage(e.target.value)}
                    placeholder="عذراً، التسجيل غير متاح حالياً..."
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
                {limitSaving ? 'جاري الحفظ...' : 'حفظ ونشر ضوابط التسجيل'}
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
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">توليد وفحص عينات أصوات استوديو ناجي (Voice Samples)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    توليد ملفات العينات الصوتية الـ 30 في استوديو الأصوات عبر محرك Gemini TTS على السيرفر الحي وحفظها كملفات WAV نقية غير فارغة.
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
                {voiceGenLoading ? 'جاري الفحص والتوليد...' : 'فحص وتوليد الأصوات المفقودة فقط'}
              </button>

              <button
                type="button"
                onClick={() => handleGenerateVoiceSamples(true)}
                disabled={voiceGenLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {voiceGenLoading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <RefreshCw className="w-4 h-4" />}
                إعادة توليد كافة الـ 30 صوت بالقوة
              </button>
            </div>

            {voiceGenResult && (
              <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs space-y-2">
                <p className="font-bold text-gray-900 dark:text-white">{voiceGenResult.message}</p>
                {voiceGenResult.summary && (
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span>توليد جديد: <b className="text-emerald-500">{voiceGenResult.summary.generatedCount}</b></span>
                    <span>تخطي (موجود سابقاً): <b className="text-indigo-500">{voiceGenResult.summary.skippedCount}</b></span>
                    <span>فشل: <b className="text-rose-500">{voiceGenResult.summary.failedCount}</b></span>
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
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">التحكم في حالة الخدمة والتوقف الطارئ</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    إيقاف خدمات التطبيق بشكل كامل في حالات الصيانة أو التحديثات الشاملة.
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
                {maintSaving ? 'جاري التنفيذ...' : (maintIsActive ? 'إعادة تشغيل ناجي (إلغاء الصيانة)' : 'إيقاف ناجي عن العمل فوراً')}
              </button>
            </div>

            {/* Customization Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                تخصيص نص بطاقة التوقف في نظام الأخطاء:
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    عنوان بطاقة الخطأ والصيانة:
                  </label>
                  <input
                    type="text"
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    placeholder="إيقاف الخدمات مؤقتاً للتطوير والإصلاح"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-red-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    رسالة التوضيح للمستخدمين:
                  </label>
                  <input
                    type="text"
                    value={maintIntro}
                    onChange={(e) => setMaintIntro(e.target.value)}
                    placeholder="تم إيقاف الخدمات من أجل التطوير والإصلاح، شكراً لكم."
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  التشخيص الفني التفصيلي:
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
                  {maintSaving ? 'جاري الحفظ...' : 'حفظ وتحديث نصوص الصيانة'}
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
              <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة وحسابات المستخدمين</h2>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="بحث بالبريد أو الاسم أو UID..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl pr-9 pl-3 py-2 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                />
              </div>

              {/* Type Filters */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
                <button 
                  onClick={() => setUserTypeFilter('regular')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'regular' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  المستخدمون ({users.filter(u => !u.isAdmin).length})
                </button>
                <button 
                  onClick={() => setUserTypeFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  المدراء ({users.filter(u => u.isAdmin).length})
                </button>
                <button 
                  onClick={() => setUserTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${userTypeFilter === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  الجميع ({users.length})
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card List (Visible on Phone Screens) */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">لا يوجد مستخدمون مطابقون لشروط البحث.</p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.uid} className="bg-gray-50 dark:bg-gray-950/70 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {u.displayName || u.email?.split('@')[0] || 'بدون اسم'}
                      </h4>
                      <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">{u.email}</p>
                      <p className="text-[9px] font-mono text-gray-400 truncate">UID: {u.uid}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                        {u.balance} نقطة
                      </span>
                      {u.isAdmin ? (
                        <span className="text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-md">
                          {u.canAddAdmins ? 'سوبر مدير' : 'مدير'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">مستخدم</span>
                      )}
                      {u.isBlocked && (
                        <span className="text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md">
                          محظور
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
                      <MessageSquare className="w-3.5 h-3.5" /> المحادثات
                    </button>

                    <button 
                      onClick={() => handleOpenBalanceModal(u)} 
                      className="text-[11px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" /> تعديل الرصيد
                    </button>

                    {user?.canAddAdmins && u.uid !== user.uid && (
                      !u.isAdmin ? (
                        <button onClick={() => handleGrantAdmin(u.uid, false)} className="text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-xl flex items-center gap-1 transition">
                          <UserPlus className="w-3.5 h-3.5" /> ترقية كمدير
                        </button>
                      ) : (
                        <button onClick={() => handleRevokeAdmin(u.uid)} className="text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl flex items-center gap-1 transition">
                          <ShieldAlert className="w-3.5 h-3.5" /> سحب الصلاحية
                        </button>
                      )
                    )}

                    {user?.isAdmin && u.uid !== user.uid && (
                      <button onClick={() => handleToggleBlock(u.uid, !!u.isBlocked)} className={`text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {u.isBlocked ? 'فك الحظر' : 'حظر الحساب'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-extrabold">المستخدم</th>
                  <th className="pb-3 font-extrabold">البريد الإلكتروني</th>
                  <th className="pb-3 font-extrabold">الرصيد</th>
                  <th className="pb-3 font-extrabold">الرتبة والحالة</th>
                  <th className="pb-3 font-extrabold text-center">إجراءات التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/40 transition">
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      {u.displayName || 'مستخدم بدون اسم'}
                    </td>
                    <td className="py-3.5 font-mono text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3.5 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {u.balance} <span className="text-[10px] font-medium text-gray-400">نقطة</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.isAdmin ? (
                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            {u.canAddAdmins ? 'سوبر مدير' : 'مدير'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">مستخدم عالي</span>
                        )}
                        {u.isBlocked && (
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            محظور
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
                          <MessageSquare className="w-3 h-3" /> المحادثات
                        </button>

                        <button 
                          onClick={() => handleOpenBalanceModal(u)} 
                          className="text-[11px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                          title="تعديل الرصيد (شحن / خصم / تعويض)"
                        >
                          <Coins className="w-3 h-3" /> الرصيد
                        </button>

                        {user?.canAddAdmins && u.uid !== user.uid && (
                          !u.isAdmin ? (
                            <button onClick={() => handleGrantAdmin(u.uid, false)} className="text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer">
                              <UserPlus className="w-3 h-3" /> ترقية كمدير
                            </button>
                          ) : (
                            <button onClick={() => handleRevokeAdmin(u.uid)} className="text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer">
                              <ShieldAlert className="w-3 h-3" /> سحب الإدارة
                            </button>
                          )
                        )}

                        {user?.isAdmin && u.uid !== user.uid && (
                          <button onClick={() => handleToggleBlock(u.uid, !!u.isBlocked)} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {u.isBlocked ? 'فك الحظر' : 'حظر'}
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
              <Key className="w-5 h-5 text-purple-500"/> إصدار رموز الرصيد
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">قيمة النقاط للرمز الواحد</label>
                <input type="number" min="1" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عدد الرموز المطلوبة (دفعة)</label>
                <input type="number" min="1" max="500" value={bulkCount} onChange={e => setBulkCount(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">حد الاستخدام للرمز الواحد</label>
                <input type="number" min="1" value={maxUsage} onChange={e => setMaxUsage(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition font-bold" />
              </div>
              <button onClick={handleCreateCode} disabled={isGeneratingCodes} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition shadow-lg shadow-purple-500/20 cursor-pointer">
                {isGeneratingCodes ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Plus className="w-4 h-4" />} 
                {isGeneratingCodes ? 'جاري الإصدار...' : 'إصدار الرموز الآن'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">أحدث الرموز المصدرة ({codes.length})</h2>
              <button onClick={exportCSV} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer font-bold">
                <Download className="w-3.5 h-3.5" /> تصدير CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="pb-3 font-bold">الرمز</th>
                    <th className="pb-3 font-bold">النقاط</th>
                    <th className="pb-3 font-bold">الحالة</th>
                    <th className="pb-3 font-bold">تاريخ الإصدار</th>
                    <th className="pb-3 font-bold text-center">نسخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {codes.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-3 font-mono font-bold text-gray-900 dark:text-gray-200">{c.code}</td>
                      <td className="py-3 font-black text-indigo-600 dark:text-indigo-400">{c.points} نقطة</td>
                      <td className="py-3">
                        {c.used ? (
                          <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md font-bold">مستخدم</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">متاح</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500 text-[11px]">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => { navigator.clipboard.writeText(c.code); toast.success('تم نسخ الكود!'); }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                          title="نسخ الكود"
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
            <h2 className="text-xl font-black text-gray-900 dark:text-white">سجل الطلبات المرفوضة لسلامة المحتوى</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="pb-3 font-bold">المستخدم ID</th>
                  <th className="pb-3 font-bold">النوع</th>
                  <th className="pb-3 font-bold">النص المُدخل (Prompt)</th>
                  <th className="pb-3 font-bold">سبب الرفض</th>
                  <th className="pb-3 font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {flaggedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">لا توجد طلبات محظورة في السجل.</td>
                  </tr>
                ) : (
                  flaggedRequests.map((req, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-mono text-gray-500 text-[11px]">{req.uid}</td>
                      <td className="py-3">
                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {req.type === 'image' ? 'صورة' : (req.type === 'video' ? 'فيديو' : 'نص/مستند')}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs truncate text-gray-900 dark:text-gray-200" title={req.prompt}>{req.prompt}</td>
                      <td className="py-3 text-amber-500 font-bold">{req.reason}</td>
                      <td className="py-3 text-gray-500 text-[11px]">
                        {new Date(req.createdAt).toLocaleString('ar-EG')}
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
            <h3 className="font-bold text-sm">{editingSkillId ? 'تعديل مهارة' : 'إضافة مهارة جديدة'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={skillDraft.name}
                onChange={e => setSkillDraft({ ...skillDraft, name: e.target.value })}
                placeholder="اسم المهارة (مثال: تنسيق العربية)"
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white font-bold"
              />
              <select
                value={skillDraft.appliesTo}
                onChange={e => setSkillDraft({ ...skillDraft, appliesTo: e.target.value })}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white font-bold"
              >
                <option value="all">كل المستندات</option>
                <option value="pptx">عروض تقديمية (PPTX)</option>
                <option value="docx">مستندات وورد (DOCX)</option>
                <option value="pdf">ملفات PDF</option>
              </select>
              <input
                type="number"
                value={skillDraft.priority}
                onChange={e => setSkillDraft({ ...skillDraft, priority: Number(e.target.value) })}
                placeholder="الأولوية"
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs outline-none text-gray-900 dark:text-white"
              />
            </div>

            <textarea
              value={skillDraft.instructions}
              onChange={e => setSkillDraft({ ...skillDraft, instructions: e.target.value })}
              rows={4}
              placeholder="تعليمات المهارة..."
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
                  toast.success('تم حفظ المهارة بنجاح!');
                } catch (e) {
                  toast.error('تعذر حفظ المهارة');
                } finally {
                  setSkillSaving(false);
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {skillSaving ? 'جاري الحفظ...' : (editingSkillId ? 'حفظ التعديل' : 'إضافة المهارة')}
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
                    <h3 className="font-black text-xl text-gray-900 dark:text-white">مركز متابعة التغذية الراجعة وتقييمات المستخدمين</h3>
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      بث مباشر منظم
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    قناة متزامنة فورياً مع Firebase لعرض وتحليل انطباعات المستخدمين وملاحظات الجودة بعد التوليد.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>إجمالي الإشارات: {feedbackSignals.length}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block">إجمالي التقييمات</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{feedbackSignals.length}</span>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">إشادة وإعجاب</span>
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
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 block">عدم إعجاب / ملاحظات</span>
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
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">أبرز الأسباب الشائعة</span>
                  <div className="flex flex-wrap gap-1">
                    {topReasons.length === 0 ? (
                      <span className="text-xs text-gray-400">لا توجد وسوم حتى الآن</span>
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
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={e => setFeedbackSearch(e.target.value)}
                    placeholder="ابحث بالنص، السبب، أو رمز المستخدم..."
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl pr-9 pl-4 py-2 text-xs outline-none text-gray-900 dark:text-white focus:border-purple-500 transition"
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
                    الكل ({feedbackSignals.length})
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('up')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      feedbackFilter === 'up' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>إيجابي ({upVotes.length})</span>
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('down')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      feedbackFilter === 'down' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>سلبي ({downVotes.length})</span>
                  </button>
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {filteredFeedback.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                    <p className="text-xs font-bold text-gray-500">لا توجد تقييمات مطابقة للفلاتر المحددة حالياً.</p>
                  </div>
                ) : (
                  filteredFeedback.map((fb) => {
                    const matchedUser = users.find(u => u.uid === (fb.ownerId || fb.userId));
                    const userDisplay = matchedUser?.email || fb.userEmail || matchedUser?.displayName || fb.ownerId || fb.userId || 'مستخدم غير معروف';
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
                                  نوع المحادثة: {fb.chatType}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-mono">
                                {fb.createdAt ? new Date(fb.createdAt).toLocaleString('ar-EG') : 'الآن'}
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
                            title="حذف التقييم من السجل"
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
              <span>إرسال إشعار للمستخدمين</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="مثال: ميزة جديدة متاحة الان"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نص الرسالة</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="اكتب التفاصيل هنا..."
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
                {isSendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>معاينة الإشعار للمستخدم</span>
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-950/50 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl">
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-[#0d0f12]">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{notifTitle || 'عنوان الإشعار التجريبي'}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{notifMessage || 'نص الإشعار التجريبي سيظهر هنا للمستخدم.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Balance Adjustment Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-right">
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
                <h3 className="text-base font-black text-gray-900 dark:text-white">تعديل رصيد المستخدم (دعم فني)</h3>
                <p className="text-xs text-gray-500">شحن، خصم أو ضبط رصيد النقاط مع توثيق السبب في سجل العمليات</p>
              </div>
            </div>

            {/* Target User Info Banner */}
            <div className="bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-gray-900 dark:text-white">{balanceModalUser.displayName || 'مستخدم بدون اسم'}</div>
                <div className="text-[11px] font-mono text-gray-500">{balanceModalUser.email}</div>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-400">الرصيد الحالي</div>
                <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {balanceModalUser.balance || 0} <span className="text-[10px] font-normal text-gray-400">نقطة</span>
                </div>
              </div>
            </div>

            {/* Action Type Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نوع العملية</label>
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
                  <Plus className="w-3.5 h-3.5" /> إضافة (شحن)
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
                  <Minus className="w-3.5 h-3.5" /> خصم نقاط
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
                  <RefreshCw className="w-3.5 h-3.5" /> تعيين مباشر
                </button>
              </div>
            </div>

            {/* Amount & Quick Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {adjustAction === 'set' ? 'الرصيد الإجمالي الجديد' : 'عدد النقاط المراد تطبيقها'}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="مثال: 10"
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
                    <span className="text-gray-600 dark:text-gray-300 font-medium">الرصيد الناتج بعد التنفيذ:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {simulated} نقطة {delta !== 0 && <span className={`text-[11px] ${delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>({delta > 0 ? `+${delta}` : delta})</span>}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Reason Selector */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">سبب التعديل (للتوثيق)</label>
              <NajeSelect
                value={adjustReasonPreset}
                onChange={(val) => setAdjustReasonPreset(val)}
                options={[
                  { value: 'تعويض عن عملية توليد متعثرة', label: 'تعويض عن عملية توليد متعثرة' },
                  { value: 'مكافأة / ترقية دعم فني', label: 'مكافأة / ترقية دعم فني' },
                  { value: 'شحن يدوي للعميل (دفع خارجي)', label: 'شحن يدوي للعميل (دفع خارجي)' },
                  { value: 'تصحيح رصيد خاطئ', label: 'تصحيح رصيد خاطئ' },
                  { value: 'خصم نقاط بسبب إساءة استخدام', label: 'خصم نقاط بسبب إساءة استخدام' },
                  { value: 'custom', label: 'سبب مخصص آخر...' }
                ]}
              />
            </div>

            {adjustReasonPreset === 'custom' && (
              <div className="mb-3">
                <input
                  type="text"
                  value={adjustCustomReason}
                  onChange={(e) => setAdjustCustomReason(e.target.value)}
                  placeholder="اكتب سبب التعديل هنا..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
            )}

            {/* Internal Notes */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات إدارية داخلية (اختياري)</label>
              <textarea
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="رقم تذكرة الدعم، سبب تفصيلي، إلخ..."
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
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitBalanceAdjustment}
                disabled={adjustSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {adjustSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <CheckCircle className="w-4 h-4" />}
                {adjustSubmitting ? 'جاري التنفيذ...' : 'تأكيد وحفظ التعديل'}
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
