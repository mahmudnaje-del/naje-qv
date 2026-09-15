import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// Add import
if (!content.includes("import NajeSelect")) {
  content = content.replace("import { Link, useNavigate, useLocation } from 'react-router-dom';", "import { Link, useNavigate, useLocation } from 'react-router-dom';\nimport NajeSelect from '../components/NajeSelect';");
}

let newSelect = `<NajeSelect
                    value={selectedProjectForNewChat}
                    onChange={(val) => setSelectedProjectForNewChat(val)}
                    options={[
                      { value: 'none', label: 'بدون مشروع (غير تصنيفي)' },
                      ...projects.map(p => ({ value: p.id, label: \`📁 \${p.name}\` }))
                    ]}
                    className="w-full text-gray-900 dark:text-gray-300"
                  />`;

content = content.replace(/<select\s+value=\{selectedProjectForNewChat\}[\s\S]*?<\/select>/, newSelect);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
