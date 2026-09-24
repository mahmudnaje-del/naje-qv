import React from 'react';
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function TermsOfService() {
  const { t, isRtl } = useI18n();
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full font-sans scrollbar-thin text-start"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>

      <div className="bg-white dark:bg-[#0e1014] border border-gray-200 dark:border-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-900 pb-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('legal.termsTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('legal.lastUpdated')}: 2026-07-15</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. مقدمة</h2>
            <p>
              مرحباً بكم في استوديو ناجي (Naje AI). باستخدامكم لمنصتنا وتطبيقنا، فإنكم توافقون صراحة على الامتثال لهذه الشروط والأحكام. إذا كنتم لا توافقون على أي جزء من هذه الشروط، يرجى الامتناع عن استخدام خدماتنا.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. استخدام الخدمات</h2>
            <p>
              تُوفر لك Naje AI وصولاً إلى أدوات تعتمد على الذكاء الاصطناعي لإنشاء محتوى نصي، مرئي، وإداري. يجب استخدام هذه الخدمات لأغراض قانونية ومشروعة فقط. يُحظر استخدام المنصة لتوليد محتوى مسيء، غير قانوني، أو ينتهك حقوق الملكية الفكرية للآخرين.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. الحسابات والأمان</h2>
            <p>
              أنت مسؤول بشكل كامل عن الحفاظ على سرية معلومات حسابك وأي نشاط يحدث تحته. نحتفظ بالحق في تعليق أو إنهاء الحسابات التي تنتهك شروط الخدمة أو تسيء استخدام النظام.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. الملكية الفكرية</h2>
            <p>
              جميع حقوق النشر، العلامات التجارية، والممتلكات الفكرية المرتبطة بمنصة Naje AI (بما في ذلك التصميم والنظام البرمجي) تعود لـ Naje AI. ومع ذلك، المحتوى الذي تقوم بتوليده عبر المنصة يعود لك بناءً على تراخيص النماذج المستخدمة، دون تحمل Naje AI مسؤولية قانونية عن كيفية استخدامه.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. التعديلات على الخدمة</h2>
            <p>
              نحتفظ بالحق في تعديل، تعليق، أو إيقاف الخدمة (أو أي جزء منها) في أي وقت دون إشعار مسبق. كما يحق لنا تحديث شروط الخدمة، وسيعتبر استمرارك في استخدام الخدمة موافقة على الشروط المُعدلة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. تحديد المسؤولية</h2>
            <p>
              لا تتحمل Naje AI تحت أي ظرف مسؤولية أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام أو عدم القدرة على استخدام الخدمات المُقدمة.
            </p>
          </section>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <BackArrow className="w-4 h-4" />
            <span>{t('legal.backHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
