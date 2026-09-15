import React from 'react';
import { ShieldAlert, Trash2, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeleteAccountRequest() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8" style={{ direction: 'rtl' }}>
      <div className="max-w-3xl mx-auto w-full">
        {/* Header Branding */}
        <div className="flex justify-between items-center mb-10">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-xl text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">استوديو ناجي AI</span>
          </Link>
          <Link to="/auth" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
            <span>تسجيل الدخول</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">طلب حذف الحساب والبيانات</h1>
              <p className="text-gray-800 dark:text-gray-400 mt-1 text-xs sm:text-sm">دليل وإجراءات إزالة حسابك نهائياً تلبيةً لسياسات الأمان وقوانين الحماية</p>
            </div>
          </div>

          {/* Policy / Steps */}
          <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                ماذا يحدث عند حذف حسابك؟
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 pr-4">
                عند تأكيد حذف الحساب، نقوم بتدمير كافة بياناتك نهائياً خلال دقائق من تقديم الطلب. يشمل هذا الإجراء حذف:
              </p>
              <ul className="list-disc pr-8 mt-2 space-y-1 text-xs text-gray-800 dark:text-gray-400 list-inside">
                <li>كافة المشاريع ومساحات العمل الإبداعية التي قمت بإنشائها.</li>
                <li>سجل المحادثات والدردشة النصية، الصوتية والمشاريع التوليدية.</li>
                <li>الملفات والوسائط والمستندات المنتجة أو المرفوعة.</li>
                <li>رصيد نقاط التوليد المتبقي ونقاط المكافآت.</li>
                <li>سجل المفضلة وعلامات المرجعية والملف الشخصي.</li>
              </ul>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-bold pr-4 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>ملاحظة هامة: هذا الإجراء نهائي بالكامل ولا يمكن التراجع عنه أو استعادة أي ملف تحت أي ظرف.</span>
              </p>
            </section>

            <section className="border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                الطريقة الأولى: الحذف الفوري والمباشر (من داخل التطبيق)
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 pr-4">
                إذا كنت تستطيع تسجيل الدخول إلى حسابك، فهذه هي الطريقة الأسرع والأكثر أماناً:
              </p>
              <ol className="list-decimal pr-8 mt-2 space-y-1 text-xs text-gray-800 dark:text-gray-400 list-inside">
                <li>قم بتسجيل الدخول إلى حسابك في المنصة.</li>
                <li>توجه إلى صفحة <strong className="text-gray-950 dark:text-white">الملف الشخصي (Settings)</strong> من القائمة الجانبية أو العلوية.</li>
                <li>انزل إلى أسفل الصفحة وستجد زراً باللون الأحمر يحمل اسم <strong className="text-red-500 font-bold">"حذف حسابي نهائياً"</strong>.</li>
                <li>قم بتأكيد خطوات الأمان والتأكيد النهائي وسيتم مسح الحساب وبياناته فوراً وتسجيل خروجك بأمان.</li>
              </ol>
            </section>

            <section className="border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                الطريقة الثانية: طلب حذف يدوي (إذا كنت لا تستطيع الوصول للحساب)
              </h2>
              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-400 pr-4">
                إذا واجهت مشكلة في تسجيل الدخول أو فقدت الوصول إلى بريدك الإلكتروني، يمكنك تقديم طلب حذف يدوي وسيقوم فريق الدعم الفني بالتحقق ومعالجة طلبك خلال 48 ساعة كحد أقصى:
              </p>
              
              <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-950/50 border border-gray-500/10 dark:border-gray-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">أرسل طلبك عبر البريد الفني</h4>
                    <p className="text-[11px] text-gray-800 dark:text-gray-400 mt-0.5">يرجى كتابة "طلب حذف حساب استوديو ناجي" في عنوان الرسالة</p>
                  </div>
                </div>
                <a 
                  href="mailto:mahmudnaje2009@gmail.com?subject=طلب حذف حساب استوديو ناجي" 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>راسل الدعم الفني</span>
                </a>
              </div>
            </section>
          </div>

          <div className="mt-10 flex justify-center border-t border-gray-500/10 dark:border-gray-900/60 pt-6">
            <Link to="/" className="px-6 py-2.5 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-300 font-bold rounded-xl text-xs transition border border-gray-200 dark:border-gray-800">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-center text-xs text-gray-800 dark:text-gray-500">
        استوديو ناجي AI وشركة Qelva Ai © جميع الحقوق محفوظة {new Date().getFullYear()}
      </div>
    </div>
  );
}
