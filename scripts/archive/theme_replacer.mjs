import fs from 'fs';
import path from 'path';

const map = {
  // Text
  'text-white': 'text-gray-900 dark:text-white',
  'text-gray-100': 'text-gray-800 dark:text-gray-100',
  'text-gray-200': 'text-gray-700 dark:text-gray-200',
  'text-gray-300': 'text-gray-600 dark:text-gray-300',
  'text-gray-400': 'text-gray-500 dark:text-gray-400',
  'text-gray-500': 'text-gray-400 dark:text-gray-500',
  'text-gray-600': 'text-gray-300 dark:text-gray-600',
  'text-indigo-400': 'text-indigo-600 dark:text-indigo-400',
  'text-indigo-300': 'text-indigo-700 dark:text-indigo-300',
  'text-purple-400': 'text-purple-600 dark:text-purple-400',
  'text-pink-400': 'text-pink-600 dark:text-pink-400',
  'text-emerald-400': 'text-emerald-600 dark:text-emerald-400',
  'text-red-400': 'text-red-600 dark:text-red-400',
  'text-yellow-400': 'text-yellow-600 dark:text-yellow-400',

  // Backgrounds
  'bg-gray-900': 'bg-white dark:bg-gray-900',
  'bg-gray-950': 'bg-gray-50 dark:bg-gray-950',
  'bg-gray-800': 'bg-gray-100 dark:bg-gray-800',
  'bg-gray-700': 'bg-gray-200 dark:bg-gray-700',
  'bg-[#0f1115]': 'bg-gray-50 dark:bg-[#0f1115]',
  'bg-[#0a0c0f]': 'bg-white dark:bg-[#0a0c0f]',
  'bg-[#0b0c10]': 'bg-white dark:bg-[#0b0c10]',
  'bg-[#0d0f12]': 'bg-white dark:bg-[#0d0f12]',
  'bg-black': 'bg-white dark:bg-black',
  'bg-indigo-600': 'bg-indigo-600 dark:bg-indigo-600', // Keep some same
  
  // Custom alpha backgrounds
  'bg-gray-900/50': 'bg-gray-100/80 dark:bg-gray-900/50',
  'bg-gray-900/60': 'bg-gray-100/90 dark:bg-gray-900/60',
  'bg-gray-900/40': 'bg-gray-100/60 dark:bg-gray-900/40',
  'bg-gray-950/50': 'bg-white/80 dark:bg-gray-950/50',
  'bg-gray-950/45': 'bg-white/90 dark:bg-gray-950/45',
  'bg-gray-800/60': 'bg-gray-200/80 dark:bg-gray-800/60',
  'bg-gray-800/40': 'bg-gray-200/60 dark:bg-gray-800/40',
  'bg-indigo-600/10': 'bg-indigo-50 dark:bg-indigo-600/10',
  'bg-indigo-600/20': 'bg-indigo-100 dark:bg-indigo-600/20',
  'bg-indigo-500/10': 'bg-indigo-50 dark:bg-indigo-500/10',
  'bg-indigo-500/20': 'bg-indigo-100 dark:bg-indigo-500/20',

  // Borders
  'border-gray-800': 'border-gray-200 dark:border-gray-800',
  'border-gray-900': 'border-gray-300 dark:border-gray-900',
  'border-gray-700': 'border-gray-300 dark:border-gray-700',
  'border-gray-800/60': 'border-gray-200 dark:border-gray-800/60',
  'border-gray-900/60': 'border-gray-300 dark:border-gray-900/60',
  'border-gray-900/50': 'border-gray-300 dark:border-gray-900/50',
  'border-gray-900/80': 'border-gray-300 dark:border-gray-900/80',
  'border-indigo-500/10': 'border-indigo-200 dark:border-indigo-500/10',
  'border-indigo-500/20': 'border-indigo-200 dark:border-indigo-500/20',
  'border-white/10': 'border-black/10 dark:border-white/10',

  // Hover States (Backgrounds)
  'hover:bg-gray-800': 'hover:bg-gray-100 dark:hover:bg-gray-800',
  'hover:bg-gray-900': 'hover:bg-gray-100 dark:hover:bg-gray-900',
  'hover:bg-gray-700': 'hover:bg-gray-200 dark:hover:bg-gray-700',
  'hover:bg-gray-900/60': 'hover:bg-gray-200 dark:hover:bg-gray-900/60',
  'hover:bg-indigo-600/20': 'hover:bg-indigo-100 dark:hover:bg-indigo-600/20',
  
  // Hover States (Text)
  'hover:text-white': 'hover:text-gray-900 dark:hover:text-white',
  'hover:text-gray-300': 'hover:text-gray-700 dark:hover:text-gray-300',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  // Ensure we don't double replace
  for (const [darkClass, combinedClass] of Object.entries(map)) {
    // Only replace if it's not already preceded by dark: or part of combined
    const regex = new RegExp(`(?<!dark:)(?<!-)\\b${darkClass.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'g');
    content = content.replace(regex, combinedClass);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('src/pages');
walkDir('src/components');
processFile('src/App.tsx');
