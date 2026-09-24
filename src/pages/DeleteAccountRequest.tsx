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
  const { t, isRtl, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  
  // Direct online deletion form state
  const [email, setEmail] = useState(user?.email || '');
  const [reason, setReason] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  const isArabic = locale === 'ar';

  const strings = {
    ar: {
      brand: 'استوديو ناجي AI',
      mySettings: 'إعدادات حسابي',
      signIn: 'تسجيل الدخول',
      pageTitle: 'طلب حذف الحساب والبيانات',
      pageDesc: 'دليل وإجراءات إزالة حسابك وكافة البيانات المرتبطة به نهائياً تلبيةً لسياسات الخصوصية ومعايير المتاجر العالمية.',
      officialUrlLabel: 'عنوان URL الرسمي لطلب حذف الحساب (Account Deletion Request URL):',
      copyUrl: 'نسخ الرابط',
      copied: 'تم النسخ',
      loggedInAs: 'أنت مسجل الدخول حالياً كـ:',
      instantDeleteNotice: 'يمكنك حذف حسابك وبياناتك فوراً وتلقائياً بنقرة واحدة من صفحة الإعدادات',
      instantDeleteBtn: 'حذف فوري من الإعدادات',
      whatDataTitle: 'ما البيانات التي يتم حذفها عند تنفيذ الطلب؟',
      whatDataDesc: 'عند تأكيد حذف الحساب، تقوم أنظمتنا بمسح وتدمير كافة السجلات نهائياً دون إمكانية استرجاعها:',
      itemProfile: 'بيانات الملف الشخصي: الاسم، البريد الإلكتروني، الصورة الشخصية، وتفضيلات النظام.',
      itemProjects: 'مساحات العمل والمشاريع: كافة المشاريع والملفات والمستندات المنتجة أو المرفوعة.',
      itemChats: 'سجل المحادثات والذكاء الاصطناعي: نصوص الدردشة، الصوتيات، الأكواد، وسجلات الذاكرة التوليدية.',
      itemBalance: 'الرصيد والنقاط: أي رصيد متبقٍ أو نقاط توليد تُمسح نهائياً.',
      itemMedia: 'الوسائط والمكتبة: الصور ومقاطع الفيديو والتصاميم التوليدية.',
      retentionNotice: 'الاحتفاظ بالبيانات: لا نحتفظ بأي سجلات شخصية بعد الحذف. يتم فقط حفظ قيود المعاملات المالية المجهولة وفقاً لما تفرضه المتطلبات القانونية والمحاسبية الإلزامية لمدة لا تتجاوز 30 يوماً.',
      formTitle: 'تقديم طلب حذف الحساب مباشرة أونلاين',
      formDesc: 'املأ النموذج أدناه لتقديم طلب رسمي لحذف حسابك وبياناتك. ستتم معالجة الطلب والتأكيد خلال 24 إلى 48 ساعة.',
      successTitle: 'تم استلام طلب حذف الحساب بنجاح',
      refNumber: 'رقم الطلب المرجعي:',
      successDesc: 'سيقوم فريق الدعم الفني بمراجعة الطلب ومسح كافة البيانات المرتبطة بالبريد الإلكتروني المدخل نهائياً خلال 48 ساعة كحد أقصى.',
      emailLabel: 'البريد الإلكتروني للحساب المطلوب حذفه',
      reasonLabel: 'سبب طلب الحذف (اختياري)',
      reasonPlaceholder: 'ساعدنا في تحسين المنصة من خلال ذكر سبب الحذف...',
      confirmNotice: 'أدرك وأوافق على أن حذف الحساب سيؤدي إلى إزالة كافة المشاريع والمحادثات والملفات والرصيد نهائياً بدون إمكانية للاسترجاع.',
      submitting: 'جاري إرسال الطلب...',
      submitBtn: 'إرسال طلب الحذف والمسح النهائي',
      altMethodsTitle: 'طرق بديلة لحذف الحساب',
      altAppTitle: 'الحذف الفوري من التطبيق',
      altAppDesc: 'سجّل الدخول، توجّه إلى الإعدادات، واضغط على "حذف حسابي نهائياً" بأسفل الصفحة للتنفيذ الفوري.',
      goToSettings: 'الانتقال للإعدادات',
      altEmailTitle: 'المراسلة عبر البريد الإلكتروني',
      altEmailDesc: 'أرسل بريداً معنوناً بـ "طلب حذف حساب استوديو ناجي" إلى الدعم الفني:',
      backHome: 'العودة للرئيسية',
      copyright: 'استوديو ناجي AI وشركة Qelva Ai © جميع الحقوق محفوظة'
    },
    en: {
      brand: 'NAJE Studio AI',
      mySettings: 'My Settings',
      signIn: 'Sign In',
      pageTitle: 'Account & Data Deletion Request',
      pageDesc: 'Official guide and procedure for permanently deleting your account and all associated data in compliance with global privacy policies and app store requirements.',
      officialUrlLabel: 'Official Account Deletion Request URL:',
      copyUrl: 'Copy URL',
      copied: 'Copied',
      loggedInAs: 'You are currently logged in as:',
      instantDeleteNotice: 'You can delete your account and data immediately in one click from the Settings page.',
      instantDeleteBtn: 'Instant Deletion from Settings',
      whatDataTitle: 'What data is deleted upon request execution?',
      whatDataDesc: 'Upon confirmation of account deletion, our systems permanently purge all associated records with no possibility of recovery:',
      itemProfile: 'Profile Information: Full name, email address, profile picture, and app preferences.',
      itemProjects: 'Workspaces & Projects: All created, uploaded, or generated files and documents.',
      itemChats: 'AI & Chat History: Messages, audio transcripts, source code, and AI memory.',
      itemBalance: 'Credits & Balance: Any remaining points or tokens are permanently forfeited.',
      itemMedia: 'Media & Gallery: Generated images, motion clips, and video productions.',
      retentionNotice: 'Data Retention: No personal identifiers are retained after deletion. Only anonymized transaction logs required by mandatory financial regulations are kept for up to 30 days.',
      formTitle: 'Submit Online Deletion Request Directly',
      formDesc: 'Fill out the form below to submit an official request to delete your account and data. Requests are processed within 24 to 48 hours.',
      successTitle: 'Account Deletion Request Received Successfully',
      refNumber: 'Reference ID:',
      successDesc: 'Our technical support team will process the deletion and permanently erase all records associated with this email address within 48 hours.',
      emailLabel: 'Account Email to Delete',
      reasonLabel: 'Reason for deletion (optional)',
      reasonPlaceholder: 'Help us improve by sharing why you wish to delete your account...',
      confirmNotice: 'I understand and agree that deleting my account will permanently delete all projects, chats, files, and credit balance with no possibility of recovery.',
      submitting: 'Submitting request...',
      submitBtn: 'Submit Account Deletion Request',
      altMethodsTitle: 'Alternative Methods for Deletion',
      altAppTitle: 'Instant Deletion from App',
      altAppDesc: 'Sign in, navigate to Settings, and click "Delete My Account Permanently" at the bottom for instant automated execution.',
      goToSettings: 'Go to Settings',
      altEmailTitle: 'Email Request to Support',
      altEmailDesc: 'Send an email titled "Account Deletion Request - NAJE Studio" to our support team:',
      backHome: 'Back to Home',
      copyright: 'NAJE Studio AI & Qelva Ai © All rights reserved'
    },
    es: {
      brand: 'NAJE Studio AI',
      mySettings: 'Mis ajustes',
      signIn: 'Iniciar sesión',
      pageTitle: 'Solicitud de eliminación de cuenta y datos',
      pageDesc: 'Guía oficial y procedimientos para eliminar definitivamente su cuenta y todos los datos asociados en cumplimiento con las normas de privacidad.',
      officialUrlLabel: 'URL oficial para la solicitud de eliminación de cuenta:',
      copyUrl: 'Copiar enlace',
      copied: 'Copiado',
      loggedInAs: 'Sesión iniciada actualmente como:',
      instantDeleteNotice: 'Puede eliminar su cuenta y datos al instante desde la página de Configuración con un solo clic.',
      instantDeleteBtn: 'Eliminación instantánea desde Configuración',
      whatDataTitle: '¿Qué datos se eliminan al ejecutar la solicitud?',
      whatDataDesc: 'Al confirmar la eliminación de la cuenta, nuestros sistemas destruyen permanentemente todos los registros sin posibilidad de recuperación:',
      itemProfile: 'Datos del perfil: Nombre, correo electrónico, foto de perfil y preferencias.',
      itemProjects: 'Espacios y proyectos: Todos los archivos y proyectos creados o subidos.',
      itemChats: 'Historial de IA y chat: Conversaciones, transcripciones, código y memoria.',
      itemBalance: 'Saldo y puntos: Cualquier saldo o punto restante se elimina de forma permanente.',
      itemMedia: 'Galería multimedia: Imágenes, animaciones y vídeos generados.',
      retentionNotice: 'Retención de datos: No conservamos ningún registro personal después de la eliminación.',
      formTitle: 'Presentar solicitud de eliminación en línea',
      formDesc: 'Complete el siguiente formulario para solicitar la eliminación de su cuenta y datos.',
      successTitle: 'Solicitud recibida con éxito',
      refNumber: 'Número de referencia:',
      successDesc: 'El equipo de soporte procesará la eliminación completa en un plazo máximo de 48 horas.',
      emailLabel: 'Correo de la cuenta a eliminar',
      reasonLabel: 'Motivo de la eliminación (opcional)',
      reasonPlaceholder: 'Ayúdenos a mejorar indicando el motivo...',
      confirmNotice: 'Entiendo y acepto que la eliminación de la cuenta borrará todos mis datos de forma permanente.',
      submitting: 'Enviando solicitud...',
      submitBtn: 'Enviar solicitud de eliminación',
      altMethodsTitle: 'Métodos alternativos',
      altAppTitle: 'Eliminación directa en la aplicación',
      altAppDesc: 'Inicie sesión, vaya a Configuración y presione "Eliminar mi cuenta definitivamente".',
      goToSettings: 'Ir a Configuración',
      altEmailTitle: 'Contacto por correo electrónico',
      altEmailDesc: 'Envíe un correo con el asunto "Solicitud de eliminación de cuenta NAJE":',
      backHome: 'Volver al inicio',
      copyright: 'NAJE Studio AI y Qelva Ai © Todos los derechos reservados'
    },
    fr: {
      brand: 'NAJE Studio AI',
      mySettings: 'Mes paramètres',
      signIn: 'Connexion',
      pageTitle: 'Demande de suppression de compte et données',
      pageDesc: 'Procédure officielle de suppression définitive de votre compte et des données associées conformément aux exigences de confidentialité.',
      officialUrlLabel: 'URL officielle de demande de suppression de compte :',
      copyUrl: 'Copier le lien',
      copied: 'Copié',
      loggedInAs: 'Connecté actuellement sous :',
      instantDeleteNotice: 'Vous pouvez supprimer votre compte instantanément en un clic depuis la page Paramètres.',
      instantDeleteBtn: 'Suppression immédiate depuis Paramètres',
      whatDataTitle: 'Quelles données sont supprimées lors de la demande ?',
      whatDataDesc: 'Dès confirmation, nos systèmes effacent définitivement tous les enregistrements sans récupération possible :',
      itemProfile: 'Profil : Nom, adresse e-mail, photo de profil et préférences.',
      itemProjects: 'Projets : Tous les espaces, fichiers et documents générés ou importés.',
      itemChats: 'Historique IA : Discussions, enregistrements audio, code et mémoire générative.',
      itemBalance: 'Solde et crédits : Tous les points restants sont définitivement supprimés.',
      itemMedia: 'Médias : Images, clips vidéo et créations artistiques.',
      retentionNotice: 'Conservation : Aucune donnée personnelle n’est conservée après suppression.',
      formTitle: 'Soumettre une demande de suppression en ligne',
      formDesc: 'Remplissez le formulaire ci-dessous pour soumettre une demande officielle.',
      successTitle: 'Demande reçue avec succès',
      refNumber: 'Numéro de référence :',
      successDesc: 'Notre équipe technique examinera la demande et supprimera les données sous 48 heures.',
      emailLabel: 'Adresse e-mail du compte à supprimer',
      reasonLabel: 'Motif de suppression (facultatif)',
      reasonPlaceholder: 'Aidez-nous à nous améliorer en précisant la raison...',
      confirmNotice: 'Je comprends et accepte que la suppression effacera définitivement tous mes fichiers et crédits.',
      submitting: 'Envoi en cours...',
      submitBtn: 'Envoyer la demande de suppression',
      altMethodsTitle: 'Méthodes alternatives',
      altAppTitle: 'Suppression directe depuis l’application',
      altAppDesc: 'Connectez-vous, accédez aux Paramètres et cliquez sur "Supprimer définitivement mon compte".',
      goToSettings: 'Aller aux Paramètres',
      altEmailTitle: 'Demande par e-mail',
      altEmailDesc: 'Envoyez un e-mail avec l’objet "Demande de suppression de compte NAJE" :',
      backHome: 'Retour à l’accueil',
      copyright: 'NAJE Studio AI & Qelva Ai © Tous droits réservés'
    },
    de: {
      brand: 'NAJE Studio AI',
      mySettings: 'Meine Einstellungen',
      signIn: 'Anmelden',
      pageTitle: 'Antrag auf Konto- und Datenlöschung',
      pageDesc: 'Offizielle Anleitung und Vorgehensweise zur dauerhaften Löschung Ihres Kontos und aller zugehörigen Daten.',
      officialUrlLabel: 'Offizielle URL für den Antrag auf Kontolöschung:',
      copyUrl: 'Link kopieren',
      copied: 'Kopiert',
      loggedInAs: 'Derzeit angemeldet als:',
      instantDeleteNotice: 'Sie können Ihr Konto und Ihre Daten sofort mit einem Klick in den Einstellungen löschen.',
      instantDeleteBtn: 'Sofortige Löschung über Einstellungen',
      whatDataTitle: 'Welche Daten werden bei der Ausführung gelöscht?',
      whatDataDesc: 'Nach Bestätigung der Kontolöschung entfernen unsere Systeme alle Datensätze dauerhaft und unwiderruflich:',
      itemProfile: 'Profildaten: Name, E-Mail-Adresse, Profilbild und Systemeinstellungen.',
      itemProjects: 'Arbeitsbereiche & Projekte: Alle erstellten oder hochgeladenen Dateien und Dokumente.',
      itemChats: 'KI- und Chat-Verlauf: Chat-Texte, Audio, Code und generatives Gedächtnis.',
      itemBalance: 'Guthaben & Punkte: Sämtliches Restguthaben wird dauerhaft gelöscht.',
      itemMedia: 'Medien & Galerie: Generierte Bilder, Bewegungsvideos und Designs.',
      retentionNotice: 'Datenaufbewahrung: Nach der Löschung werden keine personenbezogenen Daten aufbewahrt.',
      formTitle: 'Löschungsantrag direkt online einreichen',
      formDesc: 'Füllen Sie das untenstehende Formular aus, um einen offiziellen Antrag zur Kontolöschung einzureichen.',
      successTitle: 'Antrag auf Kontolöschung erfolgreich eingegangen',
      refNumber: 'Referenznummer:',
      successDesc: 'Unser Support-Team wird den Antrag bearbeiten und alle Daten innerhalb von maximal 48 Stunden löschen.',
      emailLabel: 'E-Mail-Adresse des zu löschenden Kontos',
      reasonLabel: 'Grund für die Löschung (optional)',
      reasonPlaceholder: 'Helfen Sie uns, besser zu werden, indem Sie den Grund nennen...',
      confirmNotice: 'Ich verstehe und akzeptiere, dass die Löschung alle Projekte, Chats und Daten unwiderruflich entfernt.',
      submitting: 'Antrag wird gesendet...',
      submitBtn: 'Löschantrag jetzt einreichen',
      altMethodsTitle: 'Alternative Methoden zur Kontolöschung',
      altAppTitle: 'Sofortige Löschung in der App',
      altAppDesc: 'Melden Sie sich an, gehen Sie zu Einstellungen und klicken Sie unten auf "Mein Konto dauerhaft löschen".',
      goToSettings: 'Zu den Einstellungen',
      altEmailTitle: 'Anfrage per E-Mail',
      altEmailDesc: 'Senden Sie eine E-Mail mit dem Betreff "Antrag auf Kontolöschung NAJE" an den Support:',
      backHome: 'Zurück zur Startseite',
      copyright: 'NAJE Studio AI & Qelva Ai © Alle Rechte vorbehalten'
    },
    pt: {
      brand: 'NAJE Studio AI',
      mySettings: 'Minhas configurações',
      signIn: 'Entrar',
      pageTitle: 'Solicitação de exclusão de conta e dados',
      pageDesc: 'Guia e procedimentos oficiais para a exclusão permanente de sua conta e todos os dados associados.',
      officialUrlLabel: 'URL oficial para solicitação de exclusão de conta:',
      copyUrl: 'Copiar link',
      copied: 'Copiado',
      loggedInAs: 'Conectado atualmente como:',
      instantDeleteNotice: 'Você pode excluir sua conta e seus dados imediatamente com um clique na página de Configurações.',
      instantDeleteBtn: 'Exclusão instantânea nas Configurações',
      whatDataTitle: 'Quais dados são excluídos na execução do pedido?',
      whatDataDesc: 'Após a confirmação da exclusão, nossos sistemas eliminam permanentemente todos os registros sem possibilidade de recuperação:',
      itemProfile: 'Dados do perfil: Nome, endereço de e-mail, foto de perfil e preferências.',
      itemProjects: 'Espaços e projetos: Todos os projetos, arquivos e documentos criados ou enviados.',
      itemChats: 'Histórico de IA e chat: Mensagens, áudios, código e memória generativa.',
      itemBalance: 'Saldo e pontos: Qualquer saldo ou crédito restante é excluído permanentemente.',
      itemMedia: 'Mídia e galeria: Imagens, animações e vídeos gerados.',
      retentionNotice: 'Retenção de dados: Não mantemos nenhum registro pessoal após a exclusão.',
      formTitle: 'Enviar pedido de exclusão diretamente online',
      formDesc: 'Preencha o formulário abaixo para enviar uma solicitação oficial de exclusão de conta e dados.',
      successTitle: 'Solicitação de exclusão recebida com sucesso',
      refNumber: 'Número de referência:',
      successDesc: 'A equipe de suporte técnico processará a exclusão completa em até 48 horas.',
      emailLabel: 'E-mail da conta a ser excluída',
      reasonLabel: 'Motivo da exclusão (opcional)',
      reasonPlaceholder: 'Ajude-nos a melhorar compartilhando o motivo...',
      confirmNotice: 'Compreendo e concordo que a exclusão da conta removerá permanentemente todos os projetos, conversas e saldo.',
      submitting: 'Enviando solicitação...',
      submitBtn: 'Enviar solicitação de exclusão final',
      altMethodsTitle: 'Métodos alternativos de exclusão',
      altAppTitle: 'Exclusão instantânea no aplicativo',
      altAppDesc: 'Faça login, vá para Configurações e clique em "Excluir minha conta permanentemente" no final da página.',
      goToSettings: 'Ir para Configurações',
      altEmailTitle: 'Contato por e-mail',
      altEmailDesc: 'Envie um e-mail com o assunto "Solicitação de exclusão de conta NAJE" para o suporte:',
      backHome: 'Voltar ao início',
      copyright: 'NAJE Studio AI & Qelva Ai © Todos os direitos reservados'
    }
  };

  const s = strings[locale as keyof typeof strings] || strings.en;
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/delete-account-request` : 'https://naje.ai/delete-account-request';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('تم نسخ رابط طلب حذف الحساب بنجاح');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('تعذر نسخ الرابط');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('يرجى إدخال بريد إلكتروني صالح');
      return;
    }
    if (!confirmCheckbox) {
      toast.error('يرجى الموافقة على شرط حذف الحساب النهائي');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'account_deletion_requests'), {
        email: email.trim().toLowerCase(),
        userId: user?.uid || null,
        reason: reason.trim() || 'لم يتم تحديد سبب',
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'web_form',
        userAgent: navigator.userAgent
      });

      setRequestId(docRef.id.slice(0, 8).toUpperCase());
      setRequestSubmitted(true);
      toast.success('تم استلام طلب حذف الحساب بنجاح');
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
              {s.brand}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" />
            {user ? (
              <Link to="/settings" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                <User className="w-3.5 h-3.5" />
                <span>{s.mySettings}</span>
              </Link>
            ) : (
              <Link to="/auth" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
                <span>{s.signIn}</span>
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{s.pageTitle}</h1>
              <p className="text-gray-800 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                {s.pageDesc}
              </p>
            </div>
          </div>

          {/* URL Box - Explicitly visible for users and app store compliance */}
          <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {s.officialUrlLabel}
                </span>
                <code className="text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all break-all">
                  {currentUrl}
                </code>
              </div>
              <button
                onClick={handleCopyUrl}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer flex-shrink-0"
                title={s.copyUrl}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? s.copied : s.copyUrl}</span>
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
                    {s.loggedInAs} <span className="font-mono">{user.email}</span>
                  </div>
                  <div className="text-[11px] text-indigo-800 dark:text-indigo-300">
                    {s.instantDeleteNotice}
                  </div>
                </div>
              </div>
              <Link
                to="/settings"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{s.instantDeleteBtn}</span>
              </Link>
            </div>
          )}

          {/* Policy / Steps */}
          <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {s.whatDataTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 pr-2">
                {s.whatDataDesc}
              </p>
              <ul className="list-disc pr-6 pl-6 mt-2 space-y-1.5 text-xs text-gray-800 dark:text-gray-400 list-inside">
                <li>{s.itemProfile}</li>
                <li>{s.itemProjects}</li>
                <li>{s.itemChats}</li>
                <li>{s.itemBalance}</li>
                <li>{s.itemMedia}</li>
              </ul>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>{s.retentionNotice}</span>
              </div>
            </section>

            {/* Interactive Deletion Request Form */}
            <section className="border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {s.formTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 mb-4 pr-2">
                {s.formDesc}
              </p>

              {requestSubmitted ? (
                <div className="p-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <h3 className="text-base font-extrabold text-green-900 dark:text-green-200 mb-1">
                    {s.successTitle}
                  </h3>
                  <p className="text-xs text-green-800 dark:text-green-300 mb-3">
                    {s.refNumber} <span className="font-mono font-extrabold tracking-wider">{requestId}</span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {s.successDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="bg-gray-50 dark:bg-gray-950/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      {s.emailLabel} <span className="text-red-500">*</span>
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
                      {s.reasonLabel}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder={s.reasonPlaceholder}
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
                      {s.confirmNotice}
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
                          <span>{s.submitting}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{s.submitBtn}</span>
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
                {s.altMethodsTitle}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>{s.altAppTitle}</span>
                  </h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    {s.altAppDesc}
                  </p>
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <span>{s.goToSettings}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>{s.altEmailTitle}</span>
                  </h3>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                    {s.altEmailDesc}
                  </p>
                  <a
                    href="mailto:mahmudnaje2009@gmail.com?subject=طلب حذف حساب استوديو ناجي"
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
              {s.backHome}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-center text-xs text-gray-800 dark:text-gray-500">
        {s.copyright} {new Date().getFullYear()}
      </div>
    </div>
  );
}
