import React, { useState, useEffect } from 'react';
import NajeLogo from '../components/NajeLogo';
import { useAppStore } from '../store';
import { triggerSmartDownload } from '../stores/smartDownloadStore';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  updateProfile, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword, 
  linkWithCredential
} from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { RedeemCode } from '../types';
import { 
  CreditCard, History, BarChart2, Image as ImageIcon, Film, 
  FileText, Folder, LogOut, Shield, Sparkles, Code, Mail, ExternalLink, Info, User, Moon, Sun,
  Bell, Database, Download, Trash2, KeyRound, Lock, ShieldCheck
} from 'lucide-react';
import NajeSpinner from '../components/NajeSpinner';
import { safeVerifyBeforeUpdateEmail } from '../lib/authActionSettings';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



import { registerForPushNotifications, disablePushNotifications } from '../lib/pushNotifications';

export default function Profile() {
  const { user, updateBalance, themeMode, setThemeMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'about'>('settings');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Preferences toggles
  const [notifyRealtime, setNotifyRealtime] = useState(() => {
    return localStorage.getItem('pref_notify_realtime') !== 'false';
  });
  const [emailDigest, setEmailDigest] = useState(() => {
    return localStorage.getItem('pref_email_digest') === 'true';
  });
  const [autoBackup, setAutoBackup] = useState(() => {
    return localStorage.getItem('pref_auto_backup') === 'true';
  });
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleting, setDeleting] = useState(false);

  // Security Credentials state
  const hasPasswordProvider = auth.currentUser?.providerData.some(p => p.providerId === 'password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    if (newPassword.length < 6) {
      setMessage({ text: 'يجب ألا تقل كلمة المرور الجديدة عن 6 خانات.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'كلمتا المرور غير متطابقتين.', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (hasPasswordProvider) {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, newPassword);
        setMessage({ text: 'تم تغيير كلمة المرور بنجاح!', type: 'success' });
      } else {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, newPassword);
        await linkWithCredential(auth.currentUser, cred);
        setMessage({ text: 'تم ربط كلمة المرور بحسابك بنجاح!', type: 'success' });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setMessage({ text: 'كلمة المرور الحالية غير صحيحة.', type: 'error' });
      } else if (err.code === 'auth/requires-recent-login') {
        setMessage({ text: 'لأسباب أمنية، يرجى تسجيل الخروج والدخول مجدداً قبل تغيير كلمة المرور.', type: 'error' });
      } else if (err.code === 'auth/weak-password') {
        setMessage({ text: 'كلمة المرور الجديدة ضعيفة جداً.', type: 'error' });
      } else {
        setMessage({ text: err.message || 'حدث خطأ أثناء معالجة كلمة المرور.', type: 'error' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    const targetNewEmail = newEmail.trim().toLowerCase();
    if (!targetNewEmail || targetNewEmail === auth.currentUser.email.toLowerCase()) {
      setMessage({ text: 'يرجى إدخال بريد إلكتروني جديد ومختلف عن الحالي.', type: 'error' });
      return;
    }

    setEmailLoading(true);
    setMessage({ text: '', type: '' });
    try {
      if (hasPasswordProvider) {
        if (!emailCurrentPassword) {
          setMessage({ text: 'يرجى إدخال كلمة المرور الحالية لتأكيد الهوية.', type: 'error' });
          setEmailLoading(false);
          return;
        }
        const cred = EmailAuthProvider.credential(auth.currentUser.email, emailCurrentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
      }
      await safeVerifyBeforeUpdateEmail(auth.currentUser, targetNewEmail);
      setMessage({ 
        text: `تم إرسال رابط تأكيد إلى بريدك الجديد (${targetNewEmail}). لن يتغير بريدك الحالي حتى تؤكد الرابط عبر الرسالة.`, 
        type: 'success' 
      });
      setNewEmail('');
      setEmailCurrentPassword('');
      setShowEmailForm(false);
    } catch (err: any) {
      console.error('Email change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setMessage({ text: 'كلمة المرور الحالية غير صحيحة.', type: 'error' });
      } else if (err.code === 'auth/email-already-in-use') {
        setMessage({ text: 'هذا البريد الإلكتروني مستخدم بالفعل من حساب آخر.', type: 'error' });
      } else if (err.code === 'auth/requires-recent-login') {
        setMessage({ text: 'لأسباب أمنية، يرجى تسجيل الخروج والدخول مجدداً قبل تغيير البريد.', type: 'error' });
      } else if (err.code === 'auth/invalid-email') {
        setMessage({ text: 'صيغة البريد الإلكتروني غير صحيحة.', type: 'error' });
      } else {
        setMessage({ text: err.message || 'حدث خطأ أثناء إرسال طلب تغيير البريد.', type: 'error' });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleToggleNotify = async (val: boolean) => {
    setNotifyRealtime(val);
    localStorage.setItem('pref_notify_realtime', String(val));
    if (user?.uid) {
      if (val) {
        const res = await registerForPushNotifications(user.uid);
        if (res.success) {
          setMessage({ text: 'تم تفعيل إشعارات الجوال الفورية بنجاح!', type: 'success' });
        } else if (res.error) {
          setMessage({ text: res.error, type: 'error' });
        }
      } else {
        await disablePushNotifications(user.uid);
        setMessage({ text: 'تم إيقاف إشعارات الجوال الفورية.', type: 'success' });
      }
    }
  };

  const handleToggleEmail = (val: boolean) => {
    setEmailDigest(val);
    localStorage.setItem('pref_email_digest', String(val));
  };

  const handleToggleBackup = (val: boolean) => {
    setAutoBackup(val);
    localStorage.setItem('pref_auto_backup', String(val));
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      setExportingData(true);
      setMessage({ text: '', type: '' });
      
      // Query chats
      const chatsQ = query(collection(db, 'chats'), where('ownerId', '==', user.uid));
      const chatsSnap = await getDocs(chatsQ);
      const allChats = chatsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Query messages
      const msgsQ = query(collection(db, 'messages'), where('ownerId', '==', user.uid));
      const msgsSnap = await getDocs(msgsQ);
      const allMsgs = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const exportObj = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          balance: user.balance
        },
        chats: allChats,
        messages: allMsgs
      };

      const jsonStr = JSON.stringify(exportObj, null, 2);
      triggerSmartDownload({
        data: jsonStr,
        mimeType: 'application/json',
        ext: 'json',
        title: `نسخة_احتياطية_محادثات_ناجي_${user.displayName || user.uid.slice(0, 6)}`,
        fallbackName: 'نسخة_احتياطية_ناجي',
      });
      
      setMessage({ text: 'تم تصدير ملف المحادثات والبيانات بنجاح!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'حدث خطأ أثناء محاولة تصدير البيانات.', type: 'error' });
    } finally {
      setExportingData(false);
    }
  };
  
  const [stats, setStats] = useState({
    projects: 0,
    images: 0,
    videos: 0,
    docs: 0,
    pointsSpent: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const { setUser } = useAppStore();

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      let projectsCount = 0;
      let chatsCount = 0;
      let imgCount = 0;
      let vidCount = 0;
      let docCount = 0;
      let totalEstimatedPoints = 0;

      // 1. Projects count
      try {
        const pQuery = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
        const pSnap = await getCountFromServer(pQuery);
        projectsCount = pSnap.data().count;
      } catch (err) {
        console.warn('Could not fetch projects count:', err);
      }
      
      // 2. Chats count
      try {
        const cQuery = query(collection(db, 'chats'), where('ownerId', '==', user.uid));
        const cSnap = await getDocs(cQuery);
        chatsCount = cSnap.size;
      } catch (err) {
        console.warn('Could not fetch chats count:', err);
      }

      // 3. Messages with media
      // Setup last 7 days data for chart
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const last7DaysMap = new Map();
      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of today
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last7DaysMap.set(d.toISOString().split('T')[0], { name: days[d.getDay()], points: 0 });
      }

      try {
        const mQuery = query(collection(db, 'messages'), where('ownerId', '==', user.uid));
        const mSnap = await getDocs(mQuery);
        mSnap.docs.forEach(doc => {
          const data = doc.data();
          
          let itemPoints = 0;
          if (data.mediaType === 'image') { imgCount++; itemPoints = 1; }
          else if (data.mediaType === 'video') { vidCount++; itemPoints = 2; }
          else if (data.documentData) { docCount++; itemPoints = 1; }
          else if (data.role === 'assistant') { itemPoints = 0.1; } // Small cost for normal messages
          
          if (data.createdAt) {
            const dateStr = new Date(data.createdAt).toISOString().split('T')[0];
            if (last7DaysMap.has(dateStr)) {
              totalEstimatedPoints += itemPoints; // Only count points from the last 7 days for the chart total
              const dayData = last7DaysMap.get(dateStr);
              dayData.points += itemPoints;
            }
          }
        });
      } catch (err) {
        console.warn('Could not fetch messages stats:', err);
      }

      // Convert chart map to array and format points
      const finalChartData = Array.from(last7DaysMap.values()).map(item => ({
        name: item.name,
        points: Number(item.points.toFixed(1))
      }));

      setChartData(finalChartData);

      setStats({ 
        projects: projectsCount,
        images: imgCount,
        videos: vidCount,
        docs: docCount,
        pointsSpent: Number(totalEstimatedPoints.toFixed(1))
      });
    };
    fetchStats();
  }, [user]);

  
  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    try {
      setUpdatingName(true);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName.trim() });
      }
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName.trim() });
      setUser({ ...user, displayName: newName.trim() });
      setIsEditingName(false);
      setMessage({ text: 'تم تحديث الاسم بنجاح!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'حدث خطأ أثناء تحديث الاسم.', type: 'error' });
    } finally {
      setUpdatingName(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء محاولة استرداد الكود');
      }
      
      updateBalance(data.newBalance);
      setMessage({ text: `تم شحن ${data.addedPoints} نقطة بنجاح!`, type: 'success' });
      setCode('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء محاولة حذف الحساب');
      }
      
      setShowDeleteModal(false);
      auth.signOut();
    } catch (err: any) {
      setMessage({ text: err.message || 'حدث خطأ أثناء محاولة حذف الحساب', type: 'error' });
      setDeleteStep(1);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl mx-auto w-full font-sans scrollbar-thin">
      
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-500 dark:border-gray-900 pb-5 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">الإعدادات والملف الشخصي</h1>
          <p className="text-xs text-gray-800 dark:text-gray-400 mt-1">تحكم في حسابك، اشحن رصيد الإبداع، وتعرف على شروط استخدام منصة ناجي.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#f2f0f5] dark:bg-gray-950 p-1 rounded-xl border border-purple-200 dark:border-gray-900">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:text-white'}`}
          >
            <User className="w-3.5 h-3.5" />
            <span>الملف الشخصي والشحن</span>
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'about' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:text-white'}`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>حول منصة ناجي</span>
          </button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="space-y-8">
          {message.text && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              <span>{message.text}</span>
              <button 
                onClick={() => setMessage({ text: '', type: '' })}
                className="opacity-70 hover:opacity-100 px-2 py-0.5 text-xs rounded transition"
              >
                ×
              </button>
            </div>
          )}
          
          {/* Main profile row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Balance Card */}
            <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:hover:border-gray-900 rounded-2xl p-6 sm:p-8 hover:border-purple-300 dark:hover:border-gray-800 transition-colors shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/25">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">رصيد الإبداع المتاح</h2>
                  <p className="text-xs text-gray-800 dark:text-gray-400 ">اشحن نقاطك للمزيد من التصاميم والفيديوهات</p>
                </div>
              </div>
              
              <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 flex items-baseline gap-2">
                {Number((user?.balance || 0).toFixed(2))} <span className="text-lg text-indigo-600 dark:text-indigo-400 font-semibold">نقطة إبداع</span>
              </div>

              <form onSubmit={handleRedeem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-2">رمز شحن الرصيد (16 خانة)</label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:border-gray-900 rounded-xl px-4 py-2.5 text-center tracking-widest text-base font-mono focus:border-indigo-500 outline-none uppercase transition text-gray-900 dark:text-white placeholder-gray-800"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !code} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-700 dark:disabled:text-gray-500 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md flex justify-center items-center gap-2 cursor-pointer border border-transparent disabled:border-gray-900"
                >
                  {loading ? <NajeSpinner className="w-4 h-4" /> : 'شحن الكود'}
                </button>
                {message.text && (
                  <p className={`text-xs text-center font-bold mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {message.text}
                  </p>
                )}
              </form>

              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-gray-800/80 flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-400">أو شراء باقات إضافية:</span>
                <Link
                  to="/store"
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>زيارة متجر النقاط ←</span>
                </Link>
              </div>
            </div>

            {/* Account Info Details Card */}
            <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:hover:border-gray-900 rounded-2xl p-6 sm:p-8 hover:border-purple-300 dark:hover:border-gray-800 transition-colors shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">تفاصيل حساب الإبداع</h2>
                <div className="space-y-5">
                  
                    <div className="border-b border-gray-950 pb-3">
                      <p className="text-xs text-gray-800 dark:text-gray-400 mb-1">الاسم بالكامل</p>
                      {isEditingName ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-gray-600 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full"
                            placeholder="أدخل اسمك الجديد..."
                          />
                          <button
                            onClick={handleUpdateName}
                            disabled={updatingName}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 flex-shrink-0"
                          >
                            {updatingName ? 'جاري الحفظ...' : 'حفظ'}
                          </button>
                          <button
                            onClick={() => setIsEditingName(false)}
                            disabled={updatingName}
                            className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 flex-shrink-0"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 dark:text-white text-[15px]">{user.displayName || 'مبدع ناجي'}</p>
                          <button
                            onClick={() => {
                              setNewName(user.displayName || '');
                              setIsEditingName(true);
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition font-bold"
                          >
                            تعديل الاسم
                          </button>
                        </div>
                      )}
                    </div>
                  
                  <div className="border-b border-gray-950 pb-3">
                    <p className="text-xs text-gray-800 dark:text-gray-400 mb-1">البريد الإلكتروني للغرفة</p>
                    <p className="font-bold text-gray-900 dark:text-gray-300 text-[15px]">{user.email}</p>
                  </div>
                  <div className="border-b border-gray-500 dark:border-gray-900 pb-3">
                    <p className="text-xs text-gray-800 dark:text-gray-400 mb-2">المظهر</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setThemeMode('dark')}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs font-bold transition border ${themeMode === 'dark' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-gray-50 dark:bg-gray-900 border-gray-500 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'}`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>داكن</span>
                      </button>
                      <button
                        onClick={() => setThemeMode('light')}
                        className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs font-bold transition border ${themeMode === 'light' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-gray-50 dark:bg-gray-900 border-gray-500 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'}`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>فاتح</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-800 dark:text-gray-400 mb-1">حالة نشاط المنصة</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="font-bold text-xs text-green-400">متصل وآمن بنجاح</span>
                    </div>
                  </div>
                </div>
              </div>

              {user.isAdmin && (
                <div className="mt-6 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-2.5 rounded-xl text-xs font-bold border border-purple-500/20 text-center w-full shadow-sm">
                  حساب مدير المسؤول الأول (Full Administrator)
                </div>
              )}
            </div>

          </div>

          {/* Security & Credentials Card */}
          <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/25">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">الأمان وبيانات الدخول</h2>
                <p className="text-xs text-gray-800 dark:text-gray-400">إدارة كلمة المرور والبريد الإلكتروني المرتبط بحسابك</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Password Management */}
              <div className="p-4 rounded-xl bg-white dark:bg-gray-950/40 border border-purple-100 dark:border-[#121620]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {hasPasswordProvider ? 'كلمة المرور' : 'ربط كلمة مرور بالحساب'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-1 leading-relaxed">
                      {hasPasswordProvider 
                        ? 'تحديث كلمة المرور الخاصة بحسابك لحماية إضافية.' 
                        : 'حسابك مسجل حالياً عبر Google. يمكنك تعيين كلمة مرور لتسجيل الدخول بالبريد أيضاً.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      setShowEmailForm(false);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 flex-shrink-0 cursor-pointer"
                  >
                    {showPasswordForm ? 'إلغاء' : (hasPasswordProvider ? 'تغيير كلمة المرور' : 'ربط كلمة مرور')}
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900 space-y-3">
                    {hasPasswordProvider && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-1">كلمة المرور الحالية</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-1">كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-1">تأكيد كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {passwordLoading ? <NajeSpinner className="w-3.5 h-3.5" /> : null}
                      <span>{passwordLoading ? 'جاري الحفظ...' : (hasPasswordProvider ? 'تأكيد تغيير كلمة المرور' : 'حفظ وربط كلمة المرور')}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Email Change */}
              <div className="p-4 rounded-xl bg-white dark:bg-gray-950/40 border border-purple-100 dark:border-[#121620]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">البريد الإلكتروني للحساب</span>
                    </div>
                    <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-1 leading-relaxed">
                      البريد الحالي: <span className="font-semibold text-gray-900 dark:text-white">{user.email}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(!showEmailForm);
                      setShowPasswordForm(false);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 flex-shrink-0 cursor-pointer"
                  >
                    {showEmailForm ? 'إلغاء' : 'تغيير البريد الإلكتروني'}
                  </button>
                </div>

                {showEmailForm && (
                  <form onSubmit={handleChangeEmail} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-900 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-1">البريد الإلكتروني الجديد</label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="new-email@example.com"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    {hasPasswordProvider && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 dark:text-gray-400 mb-1">كلمة المرور الحالية (لتأكيد الهوية)</label>
                        <input
                          type="password"
                          required
                          value={emailCurrentPassword}
                          onChange={e => setEmailCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      سنرسل رابط تحقق إلى البريد الجديد. لن يتم تغيير بريدك الحالي حتى تؤكد الرابط عبر رسالة البريد.
                    </p>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {emailLoading ? <NajeSpinner className="w-3.5 h-3.5" /> : null}
                      <span>{emailLoading ? 'جاري الإرسال...' : 'إرسال رابط تأكيد التغيير'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Preferences & Data Portability Card */}
          <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/25">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">تفضيلات وإعدادات المنصة</h2>
                <p className="text-xs text-gray-800 dark:text-gray-400 ">تخصيص تنبيهاتك والتحكم في إمكانية نقل وتصدير بياناتك</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Toggles list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Toggle 1: Real-time Notifications */}
                <div className="p-4 rounded-xl bg-white dark:bg-gray-950/40 border border-purple-100 dark:border-[#121620] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">الإشعارات الفورية</span>
                      <button 
                        onClick={() => handleToggleNotify(!notifyRealtime)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${notifyRealtime ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-800'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifyRealtime ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed">
                      احصل على إشعارات حية فور اكتمال توليد الفيديوهات أو المستندات الطويلة.
                    </p>
                  </div>
                </div>

                {/* Toggle 2: Daily email digest */}
                <div className="p-4 rounded-xl bg-white dark:bg-gray-950/40 border border-purple-100 dark:border-[#121620] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">الملخص اليومي للبريد</span>
                      <button 
                        onClick={() => handleToggleEmail(!emailDigest)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${emailDigest ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-800'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${emailDigest ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed">
                      احصل على ملخص شامل عبر البريد الإلكتروني بنشاطاتك ونقاطك المستهلكة.
                    </p>
                  </div>
                </div>

                {/* Toggle 3: Automated backup */}
                <div className="p-4 rounded-xl bg-white dark:bg-gray-950/40 border border-purple-100 dark:border-[#121620] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">النسخ الاحتياطي التلقائي</span>
                      <button 
                        onClick={() => handleToggleBackup(!autoBackup)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${autoBackup ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-800'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoBackup ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed">
                      حفظ تلقائي لجميع مسوداتك ومشاريعك سحابياً لضمان عدم ضياع أي تقدم.
                    </p>
                  </div>
                </div>

              </div>

              {/* Data Portability Section */}
              <div className="border-t border-gray-100 dark:border-gray-900 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      <span>تصدير البيانات ونقلها (Data Portability)</span>
                    </h3>
                    <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed">
                      قم بتنزيل نسخة كاملة من جميع محادثاتك ورسائلك ومخرجاتك الفنية بصيغة JSON قابلة للنقل للاحتفاظ بها كنسخة احتياطية غير متصلة بالإنترنت.
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white text-gray-900 dark:text-gray-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 disabled:opacity-50"
                  >
                    {exportingData ? (
                      <NajeSpinner className="w-4 h-4" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>تصدير كافة المحادثات والبيانات (JSON)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Analytics Block */}
          <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/25">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">لوحة إحصائيات النشاط</h2>
                <p className="text-xs text-gray-800 dark:text-gray-400 ">مجموع الملفات والإنتاج عبر استوديو ناجي</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-950/40 border border-purple-100 dark:hover:border-gray-900 rounded-xl p-4 hover:border-purple-200 dark:hover:border-gray-800 transition-colors">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">مساحات العمل</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.projects}</div>
              </div>
              
              <div className="bg-white dark:bg-gray-950/40 border border-purple-100 dark:hover:border-gray-900 rounded-xl p-4 hover:border-purple-200 dark:hover:border-gray-800 transition-colors">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold">الصور المصممة</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.images}</div>
              </div>
              
              <div className="bg-white dark:bg-gray-950/40 border border-purple-100 dark:hover:border-gray-900 rounded-xl p-4 hover:border-purple-200 dark:hover:border-gray-800 transition-colors">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <Film className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-xs font-semibold">الفيديوهات</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.videos}</div>
              </div>
              
              <div className="bg-white dark:bg-gray-950/40 border border-purple-100 dark:hover:border-gray-900 rounded-xl p-4 hover:border-purple-200 dark:hover:border-gray-800 transition-colors">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold">المستندات</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.docs}</div>
              </div>
            </div>

            {/* Recharts Graphical Area */}
            <div className="bg-white dark:bg-gray-950/30 border border-purple-100 dark:border-gray-900 rounded-xl p-5 h-64 relative">
               <div className="absolute top-4 right-4 z-10">
                  <p className="text-[10px] text-gray-800 dark:text-gray-400 font-bold">الاستهلاك الكلي للأسبوع الحالي</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.pointsSpent} <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">نقطة</span></p>
               </div>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#12141c" vertical={false} />
                   <XAxis dataKey="name" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} axisLine={false} tickLine={false} />
                   <YAxis stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} axisLine={false} tickLine={false} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#090a0f', borderColor: '#1f2937', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                     itemStyle={{ color: '#818cf8' }}
                     cursor={{stroke: '#1e293b', strokeWidth: 1, strokeDasharray: '3 3'}}
                   />
                   <Area type="monotone" dataKey="points" name="استهلاك الرصيد" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPoints)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        /* Brand Info & About Tab */
        <div className="space-y-8 animate-fadeIn">
          
          <div className="flex flex-col items-center justify-center text-center py-10 bg-[#f2f0f5] dark:bg-[#0e1014] rounded-2xl border border-purple-200 dark:border-gray-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
            <NajeLogo size="lg" className="mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">منصة ناجي الذكية</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide">Naje Creative AI Studio</p>
            <div className="mt-4 bg-white dark:bg-gray-950 border border-purple-200 dark:border-gray-900 rounded-full px-4 py-1.5 text-[10px] font-bold text-gray-800 dark:text-gray-400 ">
               الإصدار المستقر v1.0.0
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:hover:border-gray-900 rounded-2xl p-6 hover:border-purple-300 dark:hover:border-gray-800 transition-colors shadow-lg">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold mb-2 text-gray-900 dark:text-white">مساعد إبداعي متكامل</h3>
              <p className="text-gray-800 dark:text-gray-400 text-xs leading-relaxed">
                منصة واحدة تجمع أقوى قدرات الذكاء الاصطناعي التوليدي، مصممة لتقديم حلول إبداعية متطورة. نوفر لك قدرات المحادثة الذكية، توليد الصور الفنية، وإنتاج الفيديو المتقدم بأسلوب احترافي لخدمة الأفراد والشركات.
              </p>
            </div>
            
            <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:hover:border-gray-900 rounded-2xl p-6 hover:border-purple-300 dark:hover:border-gray-800 transition-colors shadow-lg">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 ring-1 ring-purple-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold mb-2 text-gray-900 dark:text-white">الملكية والأمان</h3>
              <p className="text-gray-800 dark:text-gray-400 text-xs leading-relaxed">
                جميع أعمالك الفنية محفوظة ومؤمنة تماماً. المحتوى المولّد هو ملك لك لتستخدمه في أعمالك الشخصية أو التجارية بكل حرية، مع ضمان أعلى معايير حماية البيانات وسرية المعلومات الحساسة.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
              <Link to="/Terms-of-Service" className="flex items-center justify-between p-5 bg-[#f2f0f5] dark:bg-gray-900 border border-purple-200 dark:border-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center border border-purple-100 dark:border-gray-800/80 text-gray-800 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-300 group-hover:text-gray-900 dark:text-white transition-colors">شروط الخدمة</h4>
                    <span className="text-[10px] text-gray-800 dark:text-gray-400 ">سياسات وإرشادات الاستخدام</span>
                  </div>
                </div>
              </Link>
              <Link to="/Privacy-Policy" className="flex items-center justify-between p-5 bg-[#f2f0f5] dark:bg-gray-900 border border-purple-200 dark:border-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center border border-purple-100 dark:border-gray-800/80 text-gray-800 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-300 group-hover:text-gray-900 dark:text-white transition-colors">سياسة الخصوصية</h4>
                    <span className="text-[10px] text-gray-800 dark:text-gray-400 ">كيف نحمي بياناتك</span>
                  </div>
                </div>
              </Link>
              <Link to="/delete-account-request" className="flex items-center justify-between p-5 bg-[#f2f0f5] dark:bg-gray-900 border border-purple-200 dark:border-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center border border-purple-100 dark:border-gray-800/80 text-gray-800 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-300 group-hover:text-gray-900 dark:text-white text-xs font-bold transition-colors mb-0.5">طلب حذف الحساب</div>
                    <div className="text-[10px] text-gray-800 dark:text-gray-400">سياسات وإرشادات إزالة البيانات</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 transition-colors" />
              </Link>

              <a href="mailto:qelvaai@gmail.com" className="flex items-center justify-between p-5 bg-[#f2f0f5] dark:bg-gray-900 border border-purple-200 dark:border-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center border border-purple-100 dark:border-gray-800/80 text-gray-800 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-white text-xs font-semibold mb-0.5">الدعم الفني المباشر</div>
                    <div className="text-[10px] text-gray-800 dark:text-gray-400 ">تواصل مع فريق التطوير والمساعدة</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 transition-colors" />
              </a>
          </div>

        </div>
      )}

      {/* Logout Footer Row - Unified at the bottom of the page */}
      <div className="pt-8 border-t border-gray-500 dark:border-gray-900 mt-12 flex justify-between items-center gap-4 flex-wrap">
        <button 
          onClick={() => {
            setDeleteStep(1);
            setShowDeleteModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold py-3 px-6 rounded-xl transition border border-red-500/10 hover:border-red-500/20 shadow-md text-xs cursor-pointer"
        >
          <Shield className="w-4 h-4 animate-pulse" />
          <span>حذف حسابي نهائياً</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-gray-600/10 hover:bg-gray-600/20 text-gray-800 dark:text-gray-300 font-bold py-3 px-6 rounded-xl transition border border-gray-500/10 hover:border-gray-500/20 shadow-md text-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج الآمن من النظام</span>
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn animate-duration-200" style={{ direction: 'rtl' }}>
          <div className="bg-[#f2f0f5] dark:bg-[#0e1014] border border-purple-200 dark:border-gray-900 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-scaleIn animate-duration-200">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <Shield className="w-8 h-8" />
              <h3 className="text-lg font-extrabold">حذف حساب الإبداع نهائياً</h3>
            </div>

            {deleteStep === 1 ? (
              <>
                <p className="text-gray-800 dark:text-gray-300 text-xs leading-relaxed mb-6">
                  هل أنت متأكد تماماً من رغبتك في حذف حسابك؟ <strong className="text-red-500 font-bold">هذا الإجراء نهائي ولا يمكن التراجع عنه بأي شكل من الأشكال.</strong> سيتم مسح كافة بياناتك، محادثاتك، ملفاتك، ورصيد نقاطك المتبقي نهائياً من أنظمتنا.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setDeleteStep(2);
                    }}
                    className="flex-1 bg-red-650 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer shadow-md text-center"
                  >
                    نعم، تابع للخطوة التالية
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer border border-gray-200 dark:border-gray-800"
                  >
                    إلغاء وتراجع
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-800 dark:text-gray-300 text-xs leading-relaxed mb-6">
                  <strong className="text-red-500 font-bold">التحذير الأخير والنهائي:</strong> بمجرد تأكيد هذه الخطوة، سيتم تدمير الحساب فوراً. يرجى تأكيد حذف الحساب permanently.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 bg-red-650 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer shadow-md text-center flex justify-center items-center gap-2"
                  >
                    {deleting ? <NajeSpinner className="w-4 h-4" /> : 'تأكيد الحذف النهائي والتدمير'}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteStep(1);
                      setShowDeleteModal(false);
                    }}
                    disabled={deleting}
                    className="flex-1 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer border border-gray-200 dark:border-gray-800"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
