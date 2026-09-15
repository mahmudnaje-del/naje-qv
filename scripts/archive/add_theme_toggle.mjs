import fs from 'fs';
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf-8');

// Include Moon/Sun icons
if (!code.includes('Moon')) {
  code = code.replace(/ExternalLink, Info, User\n\} from 'lucide-react';/, "ExternalLink, Info, User, Moon, Sun\n} from 'lucide-react';");
}

const themeToggleStr = `
                {/* Theme Mode Toggle */}
                <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-5 rounded-2xl flex flex-col gap-3 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-5 h-5 text-yellow-500 dark:hidden" />
                    <Moon className="w-5 h-5 text-indigo-400 hidden dark:block" />
                    <h3 className="text-gray-900 dark:text-white font-bold">المظهر (Theme)</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                    اختر مظهر التطبيق المفضل لك. المظهر الفاتح هو الافتراضي.
                  </p>
                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={() => useAppStore.getState().setThemeMode('light')}
                      className={\`flex-1 py-2 rounded-xl text-sm font-bold border transition \${useAppStore.getState().themeMode === 'light' ? 'bg-indigo-600 dark:bg-indigo-600 text-gray-900 dark:text-white border-indigo-600 dark:border-indigo-600' : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-800 hover:border-indigo-500/50'}\`}
                    >
                      فاتح (Light)
                    </button>
                    <button 
                      onClick={() => useAppStore.getState().setThemeMode('dark')}
                      className={\`flex-1 py-2 rounded-xl text-sm font-bold border transition \${useAppStore.getState().themeMode === 'dark' ? 'bg-indigo-600 dark:bg-indigo-600 text-gray-900 dark:text-white border-indigo-600 dark:border-indigo-600' : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-800 hover:border-indigo-500/50'}\`}
                    >
                      داكن (Dark)
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-5 rounded-2xl flex flex-col gap-3 transition-colors shadow-sm dark:shadow-none">`;

code = code.replace(/<div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-5 rounded-2xl flex flex-col gap-3 transition-colors shadow-sm dark:shadow-none">/, themeToggleStr);

fs.writeFileSync('src/pages/Profile.tsx', code);
console.log("Added theme toggle to Profile.tsx");
