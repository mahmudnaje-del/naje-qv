import fs from 'fs';

let content = fs.readFileSync('src/pages/Chat.tsx', 'utf-8');

const replacement = `      <div className="p-3 border-t border-gray-500 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto relative flex gap-3 items-end">
          {/* Sidebar Toggle Button in Empty Space */}
          <button 
            type="button"
            onClick={() => useAppStore.getState().setSidebarOpen(true)}
            className="hidden md:flex flex-shrink-0 mb-1.5 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm transition-all"
            title="إظهار القائمة الجانبية"
          >
            <PanelRight className="w-5 h-5" />
          </button>
          
          {/* Main Input Box */}
          <div className="flex-1 relative">
            {/* Badges placed on their own row at the far right */}`;

content = content.replace("      <div className=\"p-3 border-t border-gray-500 dark:border-gray-900 bg-gray-50 dark:bg-gray-950\">\n        <div className=\"max-w-4xl mx-auto relative\">\n            {/* Badges placed on their own row at the far right */}", replacement);
content = content.replace("      <div className=\"p-3 border-t border-gray-500 dark:border-gray-900 bg-gray-50 dark:bg-gray-950\">\n        <div className=\"max-w-4xl mx-auto relative\">\n            {/* E. Image Previews", replacement.replace("            {/* Badges", "            {/* E. Image Previews"));

fs.writeFileSync('src/pages/Chat.tsx', content);
