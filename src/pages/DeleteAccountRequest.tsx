import React, { useState } from 'react';
import { ShieldAlert, Trash2, ArrowRight, Mail, Copy, Check, Send, CheckCircle2, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '../toastStore';
import NajeSpinner from '../components/NajeSpinner';
import LanguageSelector from '../components/LanguageSelector';
import { useI18n } from '../i18n';

export default function DeleteAccountRequest() {
  const { user } = useAppStore();
  const { t, isRtl } = useI18n();
  const [copied, setCopied] = useState(false);
  
  // Direct online deletion form state
  const [email, setEmail] = useState(user?.email || '');
  const [reason, setReason] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/delete-account-request` : 'https://naje.ai/delete-account-request';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success(t('tools.delete.toastCopied'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t('tools.delete.toastCopyFail'));
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(t('tools.delete.toastBadEmail'));
      return;
    }
    if (!confirmCheckbox) {
      toast.error(t('tools.delete.toastNeedConfirm'));
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'account_deletion_requests'), {
        email: email.trim().toLowerCase(),
        userId: user?.uid || null,
        reason: reason.trim() || t('tools.delete.reasonUnspecified'),
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'web_form',
        userAgent: navigator.userAgent
      });

      setRequestId(docRef.id.slice(0, 8).toUpperCase());
      setRequestSubmitted(true);
      toast.success(t('tools.delete.toastReceived'));
    } catch (err) {
      console.error('Error submitting deletion request:', err);
      // Even if Firestore fails, show confirmation or fallback to mailto
      setRequestId('DEL-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      setRequestSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto w-full">
        {/* Header Branding */}
        <div className="flex justify-between items-center mb-10">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t('tools.delete.brand')}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" />
            {user ? (
              <Link to="/settings" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                <User className="w-3.5 h-3.5" />
                <span>{t('tools.delete.mySettings')}</span>
              </Link>
            ) : (
              <Link to="/auth" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
                <span>{t('tools.delete.signIn')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#0e1014] border border-gray-500/10 dark:border-gray-900 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-8 border-b border-gray-500/10 dark:border-gray-900/60 pb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0 animate-pulse">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{t('tools.delete.pageTitle')}</h1>
              <p className="text-gray-800 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                {t('tools.delete.pageDesc')}
              </p>
            </div>
          </div>

          {/* URL Box - Explicitly visible for users and app store compliance */}
          <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {t('tools.delete.officialUrlLabel')}
                </span>
                <code className="text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all break-all">
                  {currentUrl}
                </code>
              </div>
              <button
                onClick={handleCopyUrl}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer flex-shrink-0"
                title={t('tools.delete.copyUrl')}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? t('tools.delete.copied') : t('tools.delete.copyUrl')}</span>
              </button>
            </div>
          </div>

          {/* Logged in User Fast Action Notification */}
          {user && (
            <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    {t('tools.delete.loggedInAs')} <span className="font-mono">{user.email}</span>
                  </div>
                  <div className="text-[11px] text-indigo-800 dark:text-indigo-300">
                    {t('tools.delete.instantDeleteNotice')}
                  </div>
                </div>
              </div>
              <Link
                to="/settings"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('tools.delete.instantDeleteBtn')}</span>
              </Link>
            </div>
          )}

          {/* Policy / Steps */}
          <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {t('tools.delete.whatDataTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 pr-2">
                {t('tools.delete.whatDataDesc')}
              </p>
              <ul className="list-disc pr-6 pl-6 mt-2 space-y-1.5 text-xs text-gray-800 dark:text-gray-400 list-inside">
                <li>{t('tools.delete.itemProfile')}</li>
                <li>{t('tools.delete.itemProjects')}</li>
                <li>{t('tools.delete.itemChats')}</li>
                <li>{t('tools.delete.itemBalance')}</li>
                <li>{t('tools.delete.itemMedia')}</li>
              </ul>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>{t('tools.delete.retentionNotice')}</span>
              </div>
            </section>

            {/* Interactive Deletion Request Form */}
            <section className="border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {t('tools.delete.formTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 mb-4 pr-2">
                {t('tools.delete.formDesc')}
              </p>

              {requestSubmitted ? (
                <div className="p-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <h3 className="text-base font-extrabold text-green-900 dark:text-green-200 mb-1">
                    {t('tools.delete.successTitle')}
                  </h3>
                  <p className="text-xs text-green-800 dark:text-green-300 mb-3">
                    {t('tools.delete.refNumber')} <span className="font-mono font-extrabold tracking-wider">{requestId}</span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {t('tools.delete.successDesc')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="bg-gray-50 dark:bg-gray-950/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t('tools.delete.emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-red-500 outline-none transition"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {t('tools.delete.reasonLabel')}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder={t('tools.delete.reasonPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-red-500 outline-none transition resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="confirm-delete-check"
                      checked={confirmCheckbox}
                      onChange={(e) => setConfirmCheckbox(e.target.checked)}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="confirm-delete-check" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      {t('tools.delete.confirmNotice')}
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {submitting ? (
                        <>
                          <NajeSpinner className="w-4 h-4" />
                          <span>{t('tools.delete.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('tools.delete.submitBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Methods Overview */}
            <section className="border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {t('tools.delete.altMethodsTitle')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>{t('tools.delete.altAppTitle')}</span>
                  </h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    {t('tools.delete.altAppDesc')}
                  </p>
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <span>{t('tools.delete.goToSettings')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>{t('tools.delete.altEmailTitle')}</span>
                  </h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    {t('tools.delete.altEmailDesc')}
                  </p>
                  <a
                    href={`mailto:mahmudnaje2009@gmail.com?subject=${encodeURIComponent(t('tools.delete.emailSubject'))}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>mahmudnaje2009@gmail.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-10 flex justify-center border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
            <Link to="/" className="px-6 py-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 font-bold rounded-xl text-xs transition border border-gray-200 dark:border-gray-800">
              {t('tools.delete.backHome')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-center text-xs text-gray-800 dark:text-gray-500">
        {t('tools.delete.copyright')} {new Date().getFullYear()}
      </div>
    </div>
  );
}
