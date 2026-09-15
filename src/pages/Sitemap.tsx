import React from 'react';
import { Map, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sitemap() {
  const routes = [
    { path: '/', name: 'الرئيسية (لوحة القيادة)' },
    { path: '/projects', name: 'مساحات العمل والمشاريع' },
    { path: '/profile', name: 'الملف الشخصي' },
    { path: '/favorites', name: 'المفضلة' },
    { path: '/Terms-of-Service', name: 'شروط الخدمة' },
    { path: '/Privacy-Policy', name: 'سياسة الخصوصية' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full font-sans scrollbar-thin">
      <div className="bg-white dark:bg-[#0e1014] border border-gray-500 dark:border-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-500 dark:border-gray-900 pb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Map className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">خريطة الموقع (Sitemap)</h1>
            <p className="text-gray-800 dark:text-gray-400 mt-2">دليلك للوصول إلى كافة أقسام استوديو ناجي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routes.map((route, i) => (
            <Link 
              key={i} 
              to={route.path}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-500 dark:hover:border-gray-900 hover:border-emerald-500/50 rounded-xl transition group"
            >
              <LinkIcon className="w-5 h-5 text-gray-800 dark:text-gray-400 group-hover:text-emerald-600 dark:text-emerald-400 transition" />
              <span className="text-gray-900 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:text-white transition">{route.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
