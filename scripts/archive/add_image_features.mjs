import fs from 'fs';

let content = fs.readFileSync('src/pages/Chat.tsx', 'utf-8');

const imageFeaturesBlock = `
        {chat.type === 'image' && messages.length === 0 && (
          <div className="mb-8 max-w-[760px] mx-auto text-right w-full">
            <h3 className="text-gray-800 dark:text-gray-400 text-sm font-semibold mb-4 pr-1">الميزات والإمكانات المتاحة لتوليد الصور:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {imageFeatures.map(feat => (
                <button
                  key={feat.id}
                  onClick={() => {
                    setInput(feat.prompt);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                  className="p-4 rounded-2xl text-right transition border bg-gray-50 dark:bg-gray-950/40 border-gray-500 dark:border-gray-900 hover:border-indigo-500/50 hover:bg-indigo-950/5 flex flex-col gap-1 cursor-pointer group w-full"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{feat.icon}</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">{feat.title}</span>
                  </div>
                  <div className="text-xs text-gray-800 dark:text-gray-400 leading-relaxed mt-1">{feat.desc}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400/80 font-semibold mt-2 border-t border-gray-600 dark:border-gray-800/40 pt-1.5 flex items-center gap-1">
                    <span>💡 تجربة سريعة:</span>
                    <span className="text-gray-800 dark:text-gray-400 font-normal truncate">"{feat.prompt}"</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
`;

content = content.replace("        <div className=\"max-w-[760px] mx-auto space-y-8\">", imageFeaturesBlock + "\n        <div className=\"max-w-[760px] mx-auto space-y-8\">");

fs.writeFileSync('src/pages/Chat.tsx', content);
