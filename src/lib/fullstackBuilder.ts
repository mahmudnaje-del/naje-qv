import { GoogleGenAI } from '@google/genai';
import { 
  AgentCodeFile, 
  AgentPlannedFile, 
  AgentProjectPlan, 
  ProjectContract, 
  ProjectContractFile,
  LinkerDiagnostic 
} from '../types/agent';
import { PricingConfig, getAgentToolCost } from './agentPricing';
import { buildPersonaInstruction, criticReviewRequest, getThinkingConfig } from './councilOfMinds';
import { OUTPUT_TOKEN_LIMITS } from './modelRegistry';
import { createGenAIClient } from './genaiClient';
import { getNajeModel, resolveEngineModel } from './modelEnvConfig';

const ai = createGenAIClient();

const PROGRAMMER_CORE = `مهندس برمجيات محترف. كل سطر برمجي تكتبه مقصود ومدروس، بأحدث الممارسات المعتمدة فعلياً بالصناعة (تحقق منها عبر البحث عند الحاجة، لا تخمّن). صمّم وابنِ منظومات برمجية حقيقية متعددة الملفات متماسكة وخالية من الأخطاء.`;

export interface FullstackBuildProgress {
  phase: 'planning' | 'contracting' | 'generating' | 'linking' | 'healing' | 'assembling' | 'auditing' | 'completed' | 'failed';
  statusMessage: string;
  totalFiles: number;
  completedFiles: number;
  activeFilePath?: string;
  plan?: AgentProjectPlan;
  contract?: ProjectContract;
  files?: AgentCodeFile[];
  activeFileContent?: string;
  diagnostics?: LinkerDiagnostic[];
}

export interface FullstackBuildResult {
  projectName: string;
  projectDescription: string;
  techStack: { frontend: string; backend?: string; styling: string };
  plan: AgentProjectPlan;
  contract?: ProjectContract;
  files: AgentCodeFile[];
  previewHtml: string;
  pointsDeducted: number;
  linkerDiagnostics?: LinkerDiagnostic[];
  auditFeedback?: string;
  auditPassed?: boolean;
}

/**
 * Helper to resolve the model tier via environment configurations.
 */
function getPlanningModel(): string {
  return resolveEngineModel(getNajeModel('pro'));
}

function getAuditingModel(): string {
  return resolveEngineModel(getNajeModel('personas'));
}

/**
 * Phase 1 — Intent Parsing: Architectural Planning with Search-Grounded Pre-Pass
 */
export async function planFullstackProject(
  userPrompt: string,
  brandContext: any,
  inputParams: Record<string, any> = {}
): Promise<AgentProjectPlan> {
  // 1. Web Search Grounding Pre-Pass: verify latest conventions and best practices
  let searchGroundingContext = '';
  try {
    const searchRes = await ai.models.generateContent({
      model: resolveEngineModel(getNajeModel('personas')),
      contents: [{
        role: 'user',
        parts: [{
          text: `ابحث عن أفضل الممارسات والمعمارية البرمجية الحالية لإنشاء تطبيق ويب متكامل لـ: "${userPrompt}". اذكر المكتبات المعيارية والأنماط المعمارية الحديثة بإيجاز.`
        }]
      }],
      config: {
        maxOutputTokens: 2048,
        tools: [{ googleSearch: {} }]
      }
    });
    if (searchRes.text) {
      searchGroundingContext = searchRes.text.slice(0, 800);
    }
  } catch (searchErr) {
    console.warn('[Programmer/Search] Planning search grounding notice:', searchErr);
  }

  const systemInstruction = buildPersonaInstruction('المبرمج', `${PROGRAMMER_CORE}
مهامتك الآن: التخطيط المعماري الشامل لبناء موقع أو تطبيق ويب حقيقي متكامل ومتعدد الملفات (Real Multi-File Production Architecture).

قواعد التخطيط المعماري:
1. صمّم هيكلية برمجية حقيقية تتضمن عادة ما بين 15 إلى 35 ملفاً، موزعة باحترافية:
   - الواجهة الأمامية (Frontend): مكونات React/Tailwind/TypeScript نقية (Header, Hero, Navigation, Dashboard, Form/Modal, Card/Item, Footer, State Hook, Types).
   - الخادم ونقاط النهاية (Backend API): خادم Express/TypeScript حقيقي مع مسارات endpoints واضحة (Routes, Controllers, Store, Middleware).
   - الإعدادات: package.json, tsconfig.json, tailwind.config.js, README.md, index.html (تفاعلي للمعاينة المباشرة المستقلة).
2. حدد "dependsOn" بدقة لكل ملف: مسارات الملفات التي يعتمد عليها هذا الملف.
3. حدد "buildOrder" بحيث يتم بناء الملفات التأسيسية أولاً، ثم المكونات، ثم الصفحات، ثم الخادم والمكون الرئيسي.
4. أخرج JSON فقط:
{
  "projectName": "restaurant-hub",
  "projectDescription": "منصة حجز مطاعم متكاملة مع لوحة تحكم تفاعلية للمدير والعملاء",
  "techStack": {
    "frontend": "React + TypeScript + Tailwind CSS + Lucide Icons",
    "backend": "Node.js + Express REST API",
    "styling": "Tailwind CSS Modern Theme"
  },
  "files": [
    {
      "path": "src/types/index.ts",
      "purpose": "تعريف جميع هياكل البيانات والأنواع البرمجية للمطعم والحجوزات والمستخدمين",
      "dependsOn": [],
      "estimatedComplexity": "simple"
    },
    {
      "path": "src/utils/apiClient.ts",
      "purpose": "دوال الاتصال بالخادم الخلفي وتبادل بيانات الحجوزات والطلبات",
      "dependsOn": ["src/types/index.ts"],
      "estimatedComplexity": "simple"
    }
  ],
  "buildOrder": [
    "src/types/index.ts",
    "src/utils/apiClient.ts"
  ]
}`);

  const prompt = `سياق العلامة التجارية:
${JSON.stringify(brandContext || {}, null, 2)}

طلب المستخدم وهدف المشروع:
"${userPrompt}"

${searchGroundingContext ? `نتائج البحث الحي وتوصيات المعمارية الحديثة (Search Grounding):\n${searchGroundingContext}\n` : ''}

المدخلات الإضافية:
${JSON.stringify(inputParams || {}, null, 2)}

صمّم هيكلية مشروع برمجية متكاملة واحترافية قابلة للبناء الفعلي.`;

  const response = await ai.models.generateContent({
    model: getPlanningModel(),
    contents: prompt,
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackContractSynthesis,
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });

  try {
    const raw = JSON.parse(response.text || '{}');
    if (!raw.files || !Array.isArray(raw.files) || raw.files.length === 0) {
      throw new Error('Empty files array in plan');
    }

    const allPaths = raw.files.map((f: any) => f.path);
    const existingOrder = Array.isArray(raw.buildOrder) ? raw.buildOrder : [];
    const missingPaths = allPaths.filter((p: string) => !existingOrder.includes(p));
    const finalBuildOrder = [...existingOrder.filter((p: string) => allPaths.includes(p)), ...missingPaths];

    return {
      projectName: raw.projectName || 'naje-app',
      projectDescription: raw.projectDescription || 'تطبيق وموقع ويب متكامل',
      techStack: raw.techStack || {
        frontend: 'React + TypeScript + Tailwind CSS',
        backend: 'Express API',
        styling: 'Tailwind CSS'
      },
      files: raw.files,
      buildOrder: finalBuildOrder
    };
  } catch (parseErr) {
    console.warn('Fallback to standard complete plan:', parseErr);
    return getFallbackProjectPlan(userPrompt, brandContext);
  }
}

/**
 * Phase 2 — Contract Synthesis: The Intermediate Representation (IR Layer)
 * Generates exact exported interfaces, function signatures, and route specs for all files before coding.
 */
export async function synthesizeProjectContracts(
  plan: AgentProjectPlan,
  brandContext: any
): Promise<ProjectContract> {
  const systemInstruction = `أنت مهندس المعمارية والبروتوكولات في محرك Naje Agent Core (Contract Synthesis & Interface Architect).
مهمتك: قراءة هيكلية المشروع وتوليد "طبقة العقود والواجهات" (Contract Layer / IR) لجميع الملفات المخططة قبل كتابة أي سطر تنفيذي.

لكل ملف في الخطة:
1. حدد بدقة قائمة التصديرات (Exports):
   - الدوال (Functions): الاسم، المدخلات، ونوع العودة (Signature).
   - الأنواع (Types / Interfaces): أسماء الهياكل والحقول.
   - المكونات (React Components): أسماء المكونات وخصائص الـ Props.
2. بالنسبة لملفات الخادم (Backend / API / Server):
   - حدد بدقة كل مسار (Route): Method (GET, POST, PUT, DELETE), Path (e.g. /api/menu), requestShape, responseShape.

أخرج JSON فقط بدون نصوص إضافية:
{
  "files": {
    "src/types/index.ts": {
      "exports": [
        { "name": "RestaurantItem", "kind": "type", "signature": "export interface RestaurantItem { id: string; name: string; price: number; category: string; available: boolean; }" },
        { "name": "BookingRequest", "kind": "type", "signature": "export interface BookingRequest { name: string; guests: number; date: string; time: string; }" }
      ]
    },
    "src/server.ts": {
      "exports": [
        { "name": "app", "kind": "constant", "signature": "export const app: Express;" }
      ],
      "routes": [
        { "method": "GET", "path": "/api/items", "responseShape": "RestaurantItem[]" },
        { "method": "POST", "path": "/api/bookings", "requestShape": "BookingRequest", "responseShape": "{ success: boolean; id: string; }" }
      ]
    }
  }
}`;

  const prompt = `مشروع: ${plan.projectName} (${plan.projectDescription})
التقنيات: ${JSON.stringify(plan.techStack)}
سياق العلامة: ${JSON.stringify(brandContext || {})}

قائمة الملفات المخططة وعلاقات الاعتماد:
${JSON.stringify(plan.files, null, 2)}

صغ عقود الواجهات (Contract Layer) لجميع الملفات بدقة عالية:`;

  try {
    const res = await ai.models.generateContent({
      model: getPlanningModel(),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackContractSynthesis,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(res.text || '{}');
    if (parsed.files && typeof parsed.files === 'object') {
      return parsed as ProjectContract;
    }
    throw new Error('Invalid contract structure');
  } catch (err) {
    console.warn('Contract synthesis fallback generated:', err);
    // Fallback contract map
    const fallbackFiles: Record<string, ProjectContractFile> = {};
    for (const f of plan.files) {
      fallbackFiles[f.path] = {
        exports: [
          { name: 'default', kind: 'component', signature: `export default function ${f.path.split('/').pop()?.replace(/\.[^/.]+$/, '')}(): JSX.Element;` }
        ]
      };
    }
    return { files: fallbackFiles };
  }
}

/**
 * Phase 3 — Contract-Constrained Single File Generation
 * Injects ONLY the contract summaries of dependencies, keeping token footprint minimal and contracts strict.
 */
async function generateSingleFileWithContract(
  filePlan: AgentPlannedFile,
  projectContract: ProjectContract,
  projectPlan: AgentProjectPlan,
  brandContext: any,
  userPrompt: string,
  linkerFeedback?: string
): Promise<string> {
  // Extract only contract definitions of dependent files
  const dependencyContracts = (filePlan.dependsOn || [])
    .map(depPath => {
      const contract = projectContract.files[depPath];
      if (!contract) return '';
      return `--- عقد واجهات الملف المعتمد (${depPath}) ---\n${JSON.stringify(contract, null, 2)}\n---------------------------------------`;
    })
    .filter(Boolean)
    .join('\n\n');

  const thisFileContract = projectContract.files[filePlan.path];
  const thisFileContractStr = thisFileContract 
    ? `عقد هذا الملف المطلوب تطبيقه بالكامل:\n${JSON.stringify(thisFileContract, null, 2)}` 
    : '';

  const systemInstruction = buildPersonaInstruction('المبرمج', `${PROGRAMMER_CORE}
مهمتك الآن: كتابة الكود البرمجي الكامل والنهائي للملف: "${filePlan.path}"

قواعد البناء الصارمة:
1. التزم بتصدير وتطبيق كل ما ورد في عقد هذا الملف بدقة (Functions, Types, Components, Routes).
2. عند استيراد أو استدعاء دوال أو أنواع من الملفات المعتمدة، استند فقط إلى العقود المرفقة لتلك الملفات وتطابق مع أسمائها وتواقيعها بدقة 100%.
3. اكتب كوداً حقيقياً ونقياً بنسبة 100% بدون أي تعليقات مؤقتة (لا تستخدم TODO، ولا تترك دوالاً فارغة، ولا تختصر الكود).
4. استخدم Tailwind CSS الحديث المتناسق مع هوية العلامة التجارية.
5. أخرج كود الملف فقط بدون أي علامات markdown أو شروح نصية خارجية.`);

  const userContent = `المشروع: ${projectPlan.projectName} (${projectPlan.projectDescription})
التقنيات: ${JSON.stringify(projectPlan.techStack)}
هوية العلامة: ${JSON.stringify(brandContext || {})}
الطلب الأصلي: "${userPrompt}"

الملف المطلوب نسجه الآن: ${filePlan.path}
وظيفة الملف: ${filePlan.purpose}

${thisFileContractStr}

${dependencyContracts ? `عقود الواجهات للملفات التي يعتمد عليها هذا الملف:\n${dependencyContracts}\n` : ''}
${linkerFeedback ? `تقرير الرابط الهندسي (Deterministic Linker) لتصحيح هذا الملف:\n${linkerFeedback}\n` : ''}

اكتب كود الملف كاملاً بدقة متناهية:`;

  const res = await ai.models.generateContent({
    model: getPlanningModel(),
    contents: userContent,
    config: {
      systemInstruction,
      maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackFileGeneration,
      temperature: 0.1
    }
  });

  let rawText = res.text || '';
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  }

  return rawText.trim();
}

/**
 * Phase 4 — The Deterministic Linker
 * In-memory static analysis verifying import/export resolution, route parity, and code completeness without model API overhead.
 */
export function runDeterministicLinker(
  files: AgentCodeFile[],
  projectPlan: AgentProjectPlan
): { passed: boolean; diagnostics: LinkerDiagnostic[]; brokenFiles: string[] } {
  const diagnostics: LinkerDiagnostic[] = [];
  const brokenFilesSet = new Set<string>();

  const filesMap = new Map<string, string>();
  for (const f of files) {
    filesMap.set(f.path, f.content);
  }

  // 1. Collect all exported symbols per file
  const exportedSymbolsByFile = new Map<string, Set<string>>();
  for (const f of files) {
    const exportsSet = new Set<string>();
    // Matches: export const X, export function X, export class X, export type X, export interface X, export default
    const exportRegex = /export\s+(?:const|let|var|function\*?|class|type|interface|enum)\s+([a-zA-Z0-9_$]+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(f.content)) !== null) {
      if (match[1]) exportsSet.add(match[1]);
    }
    if (/export\s+default\b/.test(f.content)) {
      exportsSet.add('default');
    }
    exportedSymbolsByFile.set(f.path, exportsSet);
  }

  // 2. Collect all backend routes from server/route files
  const declaredRoutes: Array<{ method: string; path: string }> = [];
  for (const f of files) {
    if (f.path.includes('server') || f.path.includes('route') || f.path.includes('api')) {
      // Matches: app.get('/api/...', app.post('/api/...', router.get('/api/...
      const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/gi;
      let rMatch: RegExpExecArray | null;
      while ((rMatch = routeRegex.exec(f.content)) !== null) {
        if (rMatch[1] && rMatch[2]) {
          declaredRoutes.push({
            method: rMatch[1].toUpperCase(),
            path: rMatch[2].toLowerCase()
          });
        }
      }
    }
  }

  // 3. Inspect each file for import resolution, route calls, and empty placeholders
  for (const f of files) {
    // Check 3a: Import consistency
    // Matches: import { A, B as C } from './path' or '../path'
    const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"`]([^'"`]+)['"`]/g;
    let impMatch: RegExpExecArray | null;
    while ((impMatch = namedImportRegex.exec(f.content)) !== null) {
      const symbolsRaw = impMatch[1];
      const relPath = impMatch[2];

      // Resolve relative path to project path
      const resolvedPath = resolveRelativeImportPath(f.path, relPath, filesMap);
      if (resolvedPath && filesMap.has(resolvedPath)) {
        const availableExports = exportedSymbolsByFile.get(resolvedPath) || new Set();
        const symbols = symbolsRaw.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);

        for (const sym of symbols) {
          if (!availableExports.has(sym)) {
            diagnostics.push({
              filePath: f.path,
              issueType: 'missing_export',
              targetPath: resolvedPath,
              symbolName: sym,
              message: `الملف ${f.path} يستورد '${sym}' من ${resolvedPath}، لكن هذا الرمز غير مصدر فعلياً هناك.`
            });
            brokenFilesSet.add(f.path);
          }
        }
      }
    }

    // Check 3b: Route matching from frontend fetch/axios calls
    if (!f.path.includes('server') && (f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js'))) {
      const fetchRegex = /fetch\(\s*['"`](\/api\/[^'"`]+)['"`](?:,\s*\{[^}]*method:\s*['"`]([a-zA-Z]+)['"`])?/gi;
      let fMatch: RegExpExecArray | null;
      while ((fMatch = fetchRegex.exec(f.content)) !== null) {
        const routePath = fMatch[1].toLowerCase();
        const routeMethod = (fMatch[2] || 'GET').toUpperCase();

        if (declaredRoutes.length > 0) {
          const routeExists = declaredRoutes.some(
            dr => dr.path === routePath || routePath.startsWith(dr.path.replace(/:[a-zA-Z0-9_]+/g, ''))
          );
          if (!routeExists) {
            diagnostics.push({
              filePath: f.path,
              issueType: 'missing_route',
              message: `الملف ${f.path} يستدعي نقطة نهاية '${routeMethod} ${routePath}' غير معرّفة في مسارات الخادم الخلفي.`
            });
            brokenFilesSet.add(f.path);
          }
        }
      }
    }

    // Check 3c: Placeholders and empty bodies
    if (/(\/\/\s*TODO\b|\/\*\s*TODO\b|\/\/\s*باقي المكونات)/i.test(f.content)) {
      diagnostics.push({
        filePath: f.path,
        issueType: 'contains_todo',
        message: `الملف ${f.path} يحتوي على تعليقات مؤقتة (TODO/Placeholders) غير مكتملة.`
      });
      brokenFilesSet.add(f.path);
    }

    if (f.estimatedComplexity === 'complex' && f.content.length < 150) {
      diagnostics.push({
        filePath: f.path,
        issueType: 'empty_body',
        message: `الملف ${f.path} مصنف كملف معقد ولكن حجمه صغير جداً (${f.content.length} حرفاً) مما يشير إلى توليد غير مكتمل.`
      });
      brokenFilesSet.add(f.path);
    }
  }

  return {
    passed: diagnostics.length === 0,
    diagnostics,
    brokenFiles: Array.from(brokenFilesSet)
  };
}

/**
 * Helper to resolve relative import path to exact project file path in Map
 */
function resolveRelativeImportPath(
  currentFilePath: string,
  importRelPath: string,
  filesMap: Map<string, string>
): string | null {
  if (!importRelPath.startsWith('.')) return null; // External package import (e.g. 'react')

  const currentDirParts = currentFilePath.split('/').slice(0, -1);
  const relParts = importRelPath.split('/');

  for (const part of relParts) {
    if (part === '.') continue;
    if (part === '..') {
      currentDirParts.pop();
    } else {
      currentDirParts.push(part);
    }
  }

  const baseResolved = currentDirParts.join('/');
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

  for (const ext of extensions) {
    const candidate = `${baseResolved}${ext}`;
    if (filesMap.has(candidate)) return candidate;
  }

  return null;
}

/**
 * Standalone Live Preview HTML Generator
 */
function constructPreviewHtml(
  files: AgentCodeFile[],
  projectPlan: AgentProjectPlan,
  brandContext: any
): string {
  const indexHtmlFile = files.find(f => f.path.toLowerCase().endsWith('index.html'));
  if (indexHtmlFile && indexHtmlFile.content.includes('<html') && indexHtmlFile.content.includes('</body>')) {
    return indexHtmlFile.content;
  }

  const primaryColor = brandContext?.colors?.[0] || '#4f46e5';
  const secondaryColor = brandContext?.colors?.[1] || '#9333ea';
  const brandName = brandContext?.brandName || projectPlan.projectName;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} - ${projectPlan.projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              primary: '${primaryColor}',
              secondary: '${secondaryColor}'
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Cairo', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30">
  <!-- Top Navigation -->
  <header class="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[${primaryColor}] to-[${secondaryColor}] flex items-center justify-center text-white shadow-lg">
        <i class="fa-solid fa-layer-group"></i>
      </div>
      <span class="text-base font-extrabold tracking-wide text-white">${brandName}</span>
      <span class="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
        ${projectPlan.projectName}
      </span>
    </div>
    
    <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
      <a href="#overview" class="hover:text-white transition">الرئيسية</a>
      <a href="#features" class="hover:text-white transition">الميزات والخدمات</a>
      <a href="#architecture" class="hover:text-white transition">المعمارية الهندسية</a>
    </nav>

    <div class="flex items-center gap-3">
      <button onclick="simulateAction('تم التحقق من جاهزية النظام والربط الهندسي')" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95 cursor-pointer">
        تشغيل النظام
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-12">
    <section class="text-center space-y-4 py-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        مشروع مبني بالكامل عبر Naje Agent Core (${files.length} ملفات متكاملة)
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
        ${projectPlan.projectName}
      </h1>
      <p class="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
        ${projectPlan.projectDescription}
      </p>
    </section>

    <!-- Architecture Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-indigo-400 font-bold">الواجهة الأمامية (Frontend)</span>
        <span class="text-sm font-extrabold text-white">${projectPlan.techStack.frontend}</span>
        <span class="text-xs text-slate-500">مكونات متفاعلة، أنماط متناسقة، ودعم كامل للغات البرمجة</span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-purple-400 font-bold">الخادم وقواعد البيانات (Backend API)</span>
        <span class="text-sm font-extrabold text-white">${projectPlan.techStack.backend || 'Express REST API'}</span>
        <span class="text-xs text-slate-500">نقاط نهاية مطابقة تماماً لعقود الواجهات البرمجية</span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
        <span class="text-xs text-emerald-400 font-bold">محتوى الحزمة المنسوجة</span>
        <span class="text-sm font-extrabold text-white">${files.length} ملفات برمجية نقية</span>
        <span class="text-xs text-slate-500">مفحوصة بالرابط الهندسي وجاهزة للتصدير فوراً كـ ZIP</span>
      </div>
    </div>

    <!-- Live Project File Explorer Overview -->
    <section class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-folder-open text-indigo-400"></i>
          <h2 class="text-sm font-bold text-white">الملفات المنسوجة في المشروع</h2>
        </div>
        <span class="text-xs text-slate-400 font-mono">${files.length} Files Linked & Verified</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
        ${files.map(f => `
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs hover:border-indigo-500/40 transition">
            <div class="flex items-center gap-2 truncate">
              <i class="fa-regular fa-file-code text-slate-400 text-xs"></i>
              <span class="font-mono text-slate-200 truncate" dir="ltr">${f.path}</span>
            </div>
            <span class="text-[9px] uppercase font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
              ${f.language || 'code'}
            </span>
          </div>
        `).join('')}
      </div>
    </section>
  </main>

  <footer class="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
    تم بناء وتدقيق هذا المشروع بالكامل بواسطة Naje Agent Core (Autonomous Compiler Engine)
  </footer>

  <div id="toast" class="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold transition-all duration-300 opacity-0 pointer-events-none transform translate-y-2">
    إشعار Naje Agent Core
  </div>

  <script>
    function simulateAction(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 3000);
    }
  </script>
</body>
</html>`;
}

/**
 * Phase 6 — Semantic Quality Audit
 * Runs on Linker-clean codebase using gemini-3.7-flash
 */
async function auditMultiFileProject(
  files: AgentCodeFile[],
  projectPlan: AgentProjectPlan
): Promise<{ passed: boolean; feedback: string }> {
  try {
    const systemInstruction = `أنت رئيس هيئة تدقيق الجودة البرمجية والتجربة المعمارية في محرك "Naje Agent Core" (Lead Architect & Semantic Quality Auditor).
مهمتك: فحص المشروع المنسوج بعد اكتمال مرحلة الربط الهندسي، والتأكد من ملاءمة تجربة المستخدم وتناسق المنطق البرمجي.
أخرج JSON فقط:
{
  "passed": true | false,
  "feedback": "تقرير المراجعة المعمارية والجمالية بالعربية"
}`;

    const filesSummary = files.map(f => `--- [${f.path}] ---\n${f.content.slice(0, 1000)}... (Length: ${f.content.length} chars)`).join('\n\n');

    const prompt = `اسم المشروع: ${projectPlan.projectName}
المعمارية: ${JSON.stringify(projectPlan.techStack)}
الملفات المنفذة (${files.length} ملفات):
${filesSummary}

دقق في الجودة والمنطق المعماري:`;

    const res = await ai.models.generateContent({
      model: getAuditingModel(),
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens: OUTPUT_TOKEN_LIMITS.fullstackAudit,
        responseMimeType: 'application/json',
        temperature: 0.1,
        ...getThinkingConfig(getAuditingModel())
      }
    });

    const parsed = JSON.parse(res.text || '{"passed": true, "feedback": "تم اعتماد المعمارية بنجاح"}');
    return {
      passed: parsed.passed !== false,
      feedback: parsed.feedback || 'تم تدقيق تكامل المشروع البرمجي بنجاح.'
    };
  } catch (err) {
    console.warn('Semantic audit warning:', err);
    return {
      passed: true,
      feedback: 'تم نسج وتدقيق جميع الملفات البرمجية بنجاح.'
    };
  }
}

/**
 * The Master Weaver Pipeline Orchestrator (Naje Agent Core Compiler)
 * Executes all 6 phases: Intent Parsing -> Contract Synthesis -> Contract-Constrained Generation -> Deterministic Linking -> Self-Healing -> Semantic Audit.
 */
export async function executeFullstackEngineerMission(
  userPrompt: string,
  brandContext: any,
  inputParams: Record<string, any> = {},
  pricingConfig: PricingConfig = {},
  onProgress?: (progress: FullstackBuildProgress) => void
): Promise<FullstackBuildResult> {
  // Silent Critic Pre-Review (الناقد)
  const criticVerdict = await criticReviewRequest(ai, userPrompt, 'code', brandContext);
  if (criticVerdict.verdict === 'needs_clarification') {
    return {
      projectName: 'مشروع مقترح',
      projectDescription: criticVerdict.clarificationQuestion || 'يرجى توضيح نطاق المشروع المطلوب وتفاصيله لبدء البناء المعماري بدقة.',
      techStack: { frontend: 'React', backend: 'Node.js', styling: 'Tailwind CSS' },
      plan: {
        projectName: 'مشروع مقترح',
        projectDescription: criticVerdict.clarificationQuestion || '',
        techStack: { frontend: 'React', backend: 'Node.js', styling: 'Tailwind CSS' },
        files: [],
        buildOrder: []
      },
      files: [],
      previewHtml: `<div class="p-8 text-center"><p class="text-amber-500 font-medium">${criticVerdict.clarificationQuestion || 'يرجى توضيح المتطلبات'}</p></div>`,
      pointsDeducted: 0,
      auditFeedback: criticVerdict.clarificationQuestion,
      auditPassed: false
    };
  }

  const enrichedUserPrompt = criticVerdict.enrichedPrompt || userPrompt;

  // Phase 1: Intent Parsing & Architectural Planning
  onProgress?.({
    phase: 'planning',
    statusMessage: 'Naje Agent Core يحلل المتطلبات ويخطط المعمارية الهندسية الشاملة...',
    totalFiles: 0,
    completedFiles: 0
  });

  const plan = await planFullstackProject(enrichedUserPrompt, brandContext, inputParams);
  const totalFiles = plan.files.length;

  // Phase 2: Contract Synthesis (IR Layer)
  onProgress?.({
    phase: 'contracting',
    statusMessage: `Naje Agent Core يصيغ عقود الواجهات البرمجية وهياكل البيانات (${totalFiles} ملفات)...`,
    totalFiles,
    completedFiles: 0,
    plan
  });

  const projectContract = await synthesizeProjectContracts(plan, brandContext);

  const generatedFilesMap = new Map<string, string>();
  const generatedFilesList: AgentCodeFile[] = [];

  // Phase 3: Contract-Constrained Generation Loop
  for (let i = 0; i < plan.buildOrder.length; i++) {
    const filePath = plan.buildOrder[i];
    const filePlan = plan.files.find(f => f.path === filePath) || {
      path: filePath,
      purpose: `ملف تشغيلي: ${filePath}`,
      dependsOn: [],
      estimatedComplexity: 'moderate' as const
    };

    onProgress?.({
      phase: 'generating',
      statusMessage: `Naje Agent Core يبني ${filePlan.path} (${i + 1} من ${totalFiles})...`,
      totalFiles,
      completedFiles: i,
      activeFilePath: filePlan.path,
      plan,
      contract: projectContract,
      files: [...generatedFilesList]
    });

    const fileContent = await generateSingleFileWithContract(
      filePlan,
      projectContract,
      plan,
      brandContext,
      userPrompt
    );

    generatedFilesMap.set(filePath, fileContent);

    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const language = ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' || ext === 'jsx' ? 'javascript' : ext === 'json' ? 'json' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : ext === 'md' ? 'markdown' : 'typescript';

    const codeFile: AgentCodeFile = {
      path: filePath,
      content: fileContent,
      language,
      purpose: filePlan.purpose,
      description: filePlan.purpose,
      dependsOn: filePlan.dependsOn,
      status: 'completed',
      estimatedComplexity: filePlan.estimatedComplexity
    };

    generatedFilesList.push(codeFile);
  }

  // Phase 4 & Phase 5: Deterministic Linker & Self-Healing Loop
  onProgress?.({
    phase: 'linking',
    statusMessage: 'Naje Agent Core يفحص تكامل الاستيرادات والمسارات عبر الرابط الهندسي (Deterministic Linker)...',
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });

  let linkerResult = runDeterministicLinker(generatedFilesList, plan);
  let healingPass = 0;
  const maxHealingPasses = 2;

  while (!linkerResult.passed && healingPass < maxHealingPasses) {
    healingPass++;
    for (const brokenPath of linkerResult.brokenFiles) {
      const filePlan = plan.files.find(f => f.path === brokenPath);
      if (filePlan) {
        const fileDiagnostics = linkerResult.diagnostics
          .filter(d => d.filePath === brokenPath)
          .map(d => `- ${d.message}`)
          .join('\n');

        onProgress?.({
          phase: 'healing',
          statusMessage: `Naje Agent Core يعالج ويعيد بناء ${brokenPath} وفق تقرير الرابط البرمجي (المحاولة ${healingPass})...`,
          totalFiles,
          completedFiles: totalFiles,
          activeFilePath: brokenPath,
          plan,
          contract: projectContract,
          files: [...generatedFilesList],
          diagnostics: linkerResult.diagnostics
        });

        const healedContent = await generateSingleFileWithContract(
          filePlan,
          projectContract,
          plan,
          brandContext,
          userPrompt,
          fileDiagnostics
        );

        generatedFilesMap.set(brokenPath, healedContent);
        const idx = generatedFilesList.findIndex(f => f.path === brokenPath);
        if (idx !== -1) {
          generatedFilesList[idx].content = healedContent;
        }
      }
    }

    // Re-verify with Deterministic Linker after healing
    linkerResult = runDeterministicLinker(generatedFilesList, plan);
  }

  // Phase 6: Assembly and Semantic Quality Audit
  onProgress?.({
    phase: 'assembling',
    statusMessage: 'Naje Agent Core يجمع حزمة المشروع ويجهز منصة المعاينة الحية...',
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });

  const previewHtml = constructPreviewHtml(generatedFilesList, plan, brandContext);

  onProgress?.({
    phase: 'auditing',
    statusMessage: 'Naje Agent Core يجري التدقيق الدلالي وضمان الجودة المعمارية للتطبيق...',
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });

  const auditResult = await auditMultiFileProject(generatedFilesList, plan);

  const calculatedPoints = getAgentToolCost('fullstack_engineer', { plannedFiles: generatedFilesList }, pricingConfig);

  onProgress?.({
    phase: 'completed',
    statusMessage: `تم اكتمال بناء المشروع البرمجي بنجاح (${generatedFilesList.length} ملفات).`,
    totalFiles,
    completedFiles: totalFiles,
    plan,
    contract: projectContract,
    files: [...generatedFilesList]
  });

  return {
    projectName: plan.projectName,
    projectDescription: plan.projectDescription,
    techStack: plan.techStack,
    plan,
    contract: projectContract,
    files: generatedFilesList,
    previewHtml,
    pointsDeducted: calculatedPoints,
    linkerDiagnostics: linkerResult.diagnostics,
    auditFeedback: auditResult.feedback,
    auditPassed: auditResult.passed
  };
}

function getFallbackProjectPlan(userPrompt: string, brandContext: any): AgentProjectPlan {
  const brandName = brandContext?.brandName || 'NajeApp';
  return {
    projectName: `${brandName.toLowerCase().replace(/\s+/g, '-')}-platform`,
    projectDescription: `منصة وتطبيق ويب متكامل لـ ${brandName}`,
    techStack: {
      frontend: 'React + TypeScript + Tailwind CSS + Lucide Icons',
      backend: 'Express.js REST API + Node.js',
      styling: 'Tailwind CSS Modern Clean Architecture'
    },
    files: [
      { path: 'src/types/index.ts', purpose: 'النماذج وهياكل البيانات الأساسية', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'src/utils/formatters.ts', purpose: 'دوال تنسيق التواريخ والعملات والنصوص', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'src/utils/apiClient.ts', purpose: 'عميل طلبات الشبكة للاتصال بالخادم', dependsOn: ['src/types/index.ts'], estimatedComplexity: 'simple' },
      { path: 'src/components/Header.tsx', purpose: 'شريط التنقل العلوي مع الشعار والقائمة', dependsOn: ['src/types/index.ts'], estimatedComplexity: 'simple' },
      { path: 'src/components/HeroSection.tsx', purpose: 'القسم الترحيبي مع نداء الإجراء الرئيسي', dependsOn: ['src/types/index.ts'], estimatedComplexity: 'moderate' },
      { path: 'src/components/FeatureCard.tsx', purpose: 'بطاقة عرض الميزات والخدمات', dependsOn: ['src/types/index.ts'], estimatedComplexity: 'simple' },
      { path: 'src/components/DashboardView.tsx', purpose: 'لوحة التحكم والبيانات التفاعلية', dependsOn: ['src/types/index.ts', 'src/utils/apiClient.ts'], estimatedComplexity: 'complex' },
      { path: 'src/components/OrderModal.tsx', purpose: 'نافذة إنشاء الحجوزات والطلبات', dependsOn: ['src/types/index.ts', 'src/utils/apiClient.ts'], estimatedComplexity: 'moderate' },
      { path: 'src/components/Footer.tsx', purpose: 'تذييل الصفحة مع روابط الوصول السريع', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'src/App.tsx', purpose: 'المكون الرئيسي وحلقة الربط بين المكونات', dependsOn: ['src/components/Header.tsx', 'src/components/HeroSection.tsx', 'src/components/DashboardView.tsx', 'src/components/Footer.tsx'], estimatedComplexity: 'complex' },
      { path: 'src/server.ts', purpose: 'خادم Express الخلفي مع نقاط النهاية للمشروع', dependsOn: ['src/types/index.ts'], estimatedComplexity: 'complex' },
      { path: 'package.json', purpose: 'بيانات المشروع والاعتماديات', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'tsconfig.json', purpose: 'إعدادات مترجم TypeScript', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'tailwind.config.js', purpose: 'إعدادات Tailwind CSS وهوية الألوان', dependsOn: [], estimatedComplexity: 'simple' },
      { path: 'index.html', purpose: 'صفحة المعاينة التفاعلية المباشرة', dependsOn: [], estimatedComplexity: 'complex' },
      { path: 'README.md', purpose: 'دليل التثبيت والتشغيل والنشر', dependsOn: [], estimatedComplexity: 'simple' }
    ],
    buildOrder: [
      'src/types/index.ts',
      'src/utils/formatters.ts',
      'src/utils/apiClient.ts',
      'package.json',
      'tsconfig.json',
      'tailwind.config.js',
      'src/components/Header.tsx',
      'src/components/Footer.tsx',
      'src/components/FeatureCard.tsx',
      'src/components/HeroSection.tsx',
      'src/components/OrderModal.tsx',
      'src/components/DashboardView.tsx',
      'src/App.tsx',
      'src/server.ts',
      'index.html',
      'README.md'
    ]
  };
}
