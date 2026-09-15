import React from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full font-sans scrollbar-thin">
      <div className="bg-white dark:bg-[#0e1014] border border-gray-500 dark:border-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-500 dark:border-gray-900 pb-6">
          <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">سياسة الخصوصية</h1>
            <p className="text-gray-800 dark:text-gray-400 mt-2">تاريخ آخر تحديث: 15 يوليو 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. البيانات التي نجمعها</h2>
            <p>
              نحن في Naje AI نحترم خصوصيتك. نقوم بجمع بيانات أساسية عند التسجيل مثل البريد الإلكتروني، اسم المستخدم، وصورة الملف الشخصي. كما يتم جمع نصوص المحادثات والمطالبات (Prompts) لتحسين التجربة وتقديم مخرجات الذكاء الاصطناعي.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. كيف نستخدم بياناتك؟</h2>
            <p>
              تُستخدم بياناتك لإدارة حسابك، وتوفير خدمات توليد المحتوى. قد نستخدم البيانات التشغيلية لتحليل أداء المنصة وتطوير نماذجنا. نحن لا نبيع بياناتك الشخصية لأي طرف ثالث.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. الأطراف الثالثة</h2>
            <p>
              نعتمد على مزودي خدمات موثوقين (مثل Google Cloud و Firebase) لاستضافة البيانات والمصادقة وتوفير خدمات نماذج الذكاء الاصطناعي الأساسية. تخضع مشاركة البيانات لهذه الأطراف لسياسات الخصوصية الخاصة بهم.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. أمان البيانات</h2>
            <p>
              نطبق إجراءات أمنية صارمة وتشفير متقدم لحماية بياناتك من الوصول غير المصرح به، التغيير، أو التدمير. ومع ذلك، لا يوجد نقل عبر الإنترنت آمن بنسبة 100%.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. حقوقك</h2>
            <p>
              لديك الحق في طلب الوصول إلى بياناتك، وتعديلها، أو طلب حذف حسابك نهائياً من أنظمتنا عبر قسم إعدادات الحساب أو بالتواصل معنا.
            </p>
          </section>

          <section className="p-5 bg-pink-500/5 dark:bg-pink-500/10 border border-pink-500/20 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-pink-600 dark:text-pink-400">6. الوصول الإداري إلى المحتوى</h2>
            <p className="mb-3">
              قد يقوم أفراد مخوّلون ضمن فريق ناجي AI ("الموظفون المخوّلون") بالاطلاع على محتوى المحادثات والمواد المرتبطة بحساب المستخدم، وذلك حصراً للأغراض التالية:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm md:text-base mr-2 mb-3">
              <li>تقديم الدعم الفني عند طلب المستخدم صراحة مساعدة تتعلق بمحادثة أو نتيجة توليد محددة.</li>
              <li>التحقق من الإبلاغات المتعلقة بمخالفة سياسة الاستخدام أو إساءة استخدام المنصة.</li>
              <li>تشخيص الأعطال التقنية وضمان جودة الخدمة.</li>
              <li>الامتثال لأي التزام قانوني ساري.</li>
            </ol>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 border-t border-pink-500/20 pt-3 mt-2">
              يقتصر هذا الوصول على الموظفين المخوّلين ضمن نطاق مهامهم، ولا يُستخدم المحتوى لأي غرض تسويقي أو يُشارك مع أي طرف ثالث خارج ما هو منصوص عليه في هذه السياسة. يحتفظ ناجي AI بسجل داخلي لعمليات الوصول الإداري للمحادثات لأغراض المساءلة.
            </p>
          </section>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link to="/" className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition">العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
