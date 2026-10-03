import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  DollarSign, 
  Power, 
  ExternalLink,
  Info, 
  Check, 
  Layers, 
  Clock, 
  Film, 
  Bot, 
  Code2, 
  Wand2, 
  Palette, 
  FileBadge,
  ShieldAlert,
  Search,
  RotateCcw
} from 'lucide-react';
import { auth } from '../../firebase';
import { toast } from '../../toastStore';
import { useI18n } from '../../i18n';
import { POINT_USD_VALUE } from '../../lib/modelRegistry';
import { NajeAdIcon, NajeIdentIcon, NajeCvIcon, CreativeStudioIcon } from '../icons/SuiteIcons';

export interface StudioConfigItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'motion' | 'career' | 'ai' | 'creative';
  route: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accentColor: string;
  glowColor: string;
  descAr: string;
  descEn: string;
  config: Record<string, any>;
  fields: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    type: 'number' | 'boolean' | 'text' | 'select';
    step?: number;
    min?: number;
    max?: number;
    unit?: string;
    hintAr?: string;
    hintEn?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  calculateSamplePoints: (cfg: Record<string, any>) => { labelAr: string; points: number };
}

export const AdminStudiosControl: React.FC = () => {
  const { t, isRtl } = useI18n();
  const [loading, setLoading] = useState(true);
  const [savingStudioId, setSavingStudioId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'motion' | 'career' | 'ai' | 'creative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local editable state for each studio
  const [studiosState, setStudiosState] = useState<Record<string, Record<string, any>>>({
    naje_ident: {
      enabled: true,
      pointsRatePerSecond: 2.5,
      stingerBasePoints: 12,
      logoRevealBasePoints: 15,
      fullPackDiscountPercent: 15,
      res_1080p: 1.6,
      res_4k: 2.8,
      modelEndpointId: 'omni-1.1'
    },
    naje_cv: {
      enabled: true,
      baseDossierCost: 8,
      coverLetterCost: 4,
      linkedInOptimizationCost: 5,
      interviewPrepCost: 6,
      bilingualAddonCost: 3,
      portfolioWebCost: 5,
      docxExportCost: 1,
      maxRevisionsIncluded: 3
    },
    naje_prompt: {
      enabled: true,
      promptOptimizationCost: 2,
      fewShotDatasetCost: 5,
      multiModelAdapterCost: 3,
      chainOfThoughtCost: 4
    },
    creative_studio: {
      enabled: true,
      socialMediaPostCost: 4,
      marketingFlyerCost: 6,
      brandKitBundleCost: 12,
      bannerAdCost: 5,
      vectorExportAddon: 2
    },
    naje_developer: {
      enabled: true,
      codeProjectCost: 10,
      securityAuditCost: 4,
      repoAnalysisCost: 8,
      dockerCiGenCost: 3
    },
    naje_agent: {
      enabled: true,
      costPerStep: 1.0,
      toolSearchCost: 0.5,
      toolCodeExecutionCost: 1.0,
      maxAutonomousSteps: 15
    },
    naje_ad: {
      enabled: true,
      pointsRatePerSecond: 2.5,
      editMultiplier: 0.5,
      res_1080p: 1.5,
      res_4k: 3.0,
      maxShotsPerVideo: 4
    }
  });

  const [initialStudiosState, setInitialStudiosState] = useState<Record<string, Record<string, any>>>({});

  // Default backup specs
  const DEFAULT_STUDIO_SPECS: Record<string, Record<string, any>> = useMemo(() => ({
    naje_ident: {
      enabled: true,
      pointsRatePerSecond: 2.5,
      stingerBasePoints: 12,
      logoRevealBasePoints: 15,
      fullPackDiscountPercent: 15,
      res_1080p: 1.6,
      res_4k: 2.8,
      modelEndpointId: 'omni-1.1'
    },
    naje_cv: {
      enabled: true,
      baseDossierCost: 8,
      coverLetterCost: 4,
      linkedInOptimizationCost: 5,
      interviewPrepCost: 6,
      bilingualAddonCost: 3,
      portfolioWebCost: 5,
      docxExportCost: 1,
      maxRevisionsIncluded: 3
    },
    naje_prompt: {
      enabled: true,
      promptOptimizationCost: 2,
      fewShotDatasetCost: 5,
      multiModelAdapterCost: 3,
      chainOfThoughtCost: 4
    },
    creative_studio: {
      enabled: true,
      socialMediaPostCost: 4,
      marketingFlyerCost: 6,
      brandKitBundleCost: 12,
      bannerAdCost: 5,
      vectorExportAddon: 2
    },
    naje_developer: {
      enabled: true,
      codeProjectCost: 10,
      securityAuditCost: 4,
      repoAnalysisCost: 8,
      dockerCiGenCost: 3
    },
    naje_agent: {
      enabled: true,
      costPerStep: 1.0,
      toolSearchCost: 0.5,
      toolCodeExecutionCost: 1.0,
      maxAutonomousSteps: 15
    },
    naje_ad: {
      enabled: true,
      pointsRatePerSecond: 2.5,
      editMultiplier: 0.5,
      res_1080p: 1.5,
      res_4k: 3.0,
      maxShotsPerVideo: 4
    }
  }), []);

  const fetchStudiosConfig = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/studios-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.studios) {
          const merged: Record<string, Record<string, any>> = {};
          for (const key of Object.keys(DEFAULT_STUDIO_SPECS)) {
            const serverConfig = data.studios[key] || {};
            // Flatten resolutionMultiplier if nested
            const flattened: Record<string, any> = { ...DEFAULT_STUDIO_SPECS[key], ...serverConfig };
            if (serverConfig.resolutionMultiplier && typeof serverConfig.resolutionMultiplier === 'object') {
              if (serverConfig.resolutionMultiplier['1080p']) flattened.res_1080p = serverConfig.resolutionMultiplier['1080p'];
              if (serverConfig.resolutionMultiplier['4k']) flattened.res_4k = serverConfig.resolutionMultiplier['4k'];
            }
            merged[key] = flattened;
          }
          setStudiosState(merged);
          setInitialStudiosState(JSON.parse(JSON.stringify(merged)));
        }
      } else {
        toast.error('تعذر جلب إعدادات الاستوديوهات من الخادم');
      }
    } catch (err) {
      console.error('fetchStudiosConfig error:', err);
      toast.error('خطأ في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudiosConfig();
  }, []);

  const handleFieldChange = (studioId: string, fieldKey: string, value: any) => {
    setStudiosState(prev => ({
      ...prev,
      [studioId]: {
        ...(prev[studioId] || {}),
        [fieldKey]: value
      }
    }));
  };

  const handleToggleStudio = (studioId: string) => {
    setStudiosState(prev => {
      const current = prev[studioId]?.enabled !== false;
      return {
        ...prev,
        [studioId]: {
          ...(prev[studioId] || {}),
          enabled: !current
        }
      };
    });
  };

  const handleResetStudio = (studioId: string) => {
    if (DEFAULT_STUDIO_SPECS[studioId]) {
      setStudiosState(prev => ({
        ...prev,
        [studioId]: { ...DEFAULT_STUDIO_SPECS[studioId] }
      }));
      toast.info('تمت استعادة القيم الافتراضية الموصى بها لهذا الاستوديو');
    }
  };

  const handleSaveStudio = async (studioId: string) => {
    setSavingStudioId(studioId);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('مطلوب تسجيل الدخول بصلاحيات الإدارة.');

      const studioPayload = { ...(studiosState[studioId] || {}) };
      // Map res_1080p and res_4k back to resolutionMultiplier structure if applicable
      if ('res_1080p' in studioPayload || 'res_4k' in studioPayload) {
        studioPayload.resolutionMultiplier = {
          '720p': 1.0,
          '1080p': Number(studioPayload.res_1080p || 1.6),
          '4k': Number(studioPayload.res_4k || 2.8)
        };
      }

      const res = await fetch('/api/admin/studios-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studioId,
          config: studioPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في حفظ إعدادات الاستوديو.');
      }

      // Update initial state baseline for dirty check
      setInitialStudiosState(prev => ({
        ...prev,
        [studioId]: JSON.parse(JSON.stringify(studiosState[studioId]))
      }));

      toast.success(data.message || `تم حفظ إعدادات الاستوديو بنجاح!`);
    } catch (err: any) {
      console.error(`Save studio ${studioId} error:`, err);
      toast.error(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSavingStudioId(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('مطلوب تسجيل الدخول كمسؤول.');

      const studioKeys = Object.keys(studiosState);
      let successCount = 0;

      for (const studioId of studioKeys) {
        const studioPayload = { ...(studiosState[studioId] || {}) };
        if ('res_1080p' in studioPayload || 'res_4k' in studioPayload) {
          studioPayload.resolutionMultiplier = {
            '720p': 1.0,
            '1080p': Number(studioPayload.res_1080p || 1.6),
            '4k': Number(studioPayload.res_4k || 2.8)
          };
        }

        const res = await fetch('/api/admin/studios-config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ studioId, config: studioPayload })
        });
        if (res.ok) successCount++;
      }

      setInitialStudiosState(JSON.parse(JSON.stringify(studiosState)));
      toast.success(`تم حفظ جميع الاستوديوهات (${successCount} استوديو) وتطبيق الأسعار بنجاح!`);
    } catch (err: any) {
      console.error('Save all studios error:', err);
      toast.error(err.message || 'تعذر حفظ بعض الاستوديوهات.');
    } finally {
      setSavingAll(false);
    }
  };

  // Studios Definitions
  const studiosList: StudioConfigItem[] = useMemo(() => [
    {
      id: 'naje_ident',
      nameAr: 'ناجي أدنت (Naje Ident)',
      nameEn: 'Brand Motion & Ident Studio',
      category: 'motion',
      route: '/naje-ident',
      icon: NajeIdentIcon,
      accentColor: 'from-amber-500 to-orange-600',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      descAr: 'استوديو شارات البداية والنهاية، الهويات الحركية، كشف الشعار، وحزم الموشن ثلاثية الأبعاد الاحترافية.',
      descEn: 'Cinematic brand idents, stingers, logo reveals, and motion graphics suites.',
      config: studiosState.naje_ident || {},
      fields: [
        {
          key: 'pointsRatePerSecond',
          labelAr: 'معدل النقاط لكل ثانية (Points/Sec)',
          labelEn: 'Points Rate Per Second',
          type: 'number',
          step: 0.1,
          min: 0.5,
          max: 20,
          unit: 'نقطة/ثانية',
          hintAr: 'التكلفة الأساسية لكل ثانية رندرة موشن سينمائي.',
        },
        {
          key: 'stingerBasePoints',
          labelAr: 'تكلفة الستينغ الخاطف 5s (Stinger Base)',
          labelEn: '5s Stinger Base Points',
          type: 'number',
          step: 1,
          min: 1,
          max: 100,
          unit: 'نقطة',
          hintAr: 'التكلفة الثابتة لشارة البداية الخاطفة مدة 5 ثوانٍ.',
        },
        {
          key: 'logoRevealBasePoints',
          labelAr: 'تكلفة كشف الشعار 10s (Logo Reveal Base)',
          labelEn: '10s Logo Reveal Points',
          type: 'number',
          step: 1,
          min: 1,
          max: 100,
          unit: 'نقطة',
          hintAr: 'التكلفة الثابتة لشارة النهاية وإظهار الشعار الكاملة مدة 10 ثوانٍ.',
        },
        {
          key: 'fullPackDiscountPercent',
          labelAr: 'نسبة خصم الحزمة الكاملة (Full Pack %)',
          labelEn: 'Full Pack Discount %',
          type: 'number',
          step: 1,
          min: 0,
          max: 50,
          unit: '%',
          hintAr: 'نسبة الخصم التلقائي عند طلب شارة البداية وشارة النهاية معاً.',
        },
        {
          key: 'res_1080p',
          labelAr: 'مضاعف دقة Full HD (1080p Multiplier)',
          labelEn: '1080p Multiplier',
          type: 'number',
          step: 0.1,
          min: 1.0,
          max: 5.0,
          unit: 'x',
          hintAr: 'معامل مضاعفة التكلفة عند التوليد بدقة 1080p فائقة الوضوح.',
        },
        {
          key: 'res_4k',
          labelAr: 'مضاعف دقة Ultra 4K (4K Multiplier)',
          labelEn: '4K Multiplier',
          type: 'number',
          step: 0.1,
          min: 1.5,
          max: 10.0,
          unit: 'x',
          hintAr: 'معامل مضاعفة التكلفة للتصدير السينمائي بدقة 4K.',
        },
        {
          key: 'modelEndpointId',
          labelAr: 'معرف محرك الموشن الافتراضي',
          labelEn: 'Motion Engine Model ID',
          type: 'select',
          options: [
            { value: 'omni-1.1', label: 'Naje Omni Motion 1.1 Pro (افتراضي سينمائي)' },
            { value: 'veo-ident', label: 'Google Veo Cinematic Ident Engine' },
            { value: 'motion-fast', label: 'Naje Motion Flash (سريع واقتصادي)' }
          ],
          hintAr: 'النموذج المعتمد لتوليد مقاطع وفيديوهات الشارات.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const rate = Number(cfg.pointsRatePerSecond || 2.5);
        const mul = Number(cfg.res_1080p || 1.6);
        const pts = Math.round(10 * rate * mul);
        return { labelAr: 'شارة 10 ثوانٍ بدقة 1080p', points: pts };
      }
    },
    {
      id: 'naje_cv',
      nameAr: 'ناجي CV (Naje Intelligent Resume)',
      nameEn: 'AI Career Dossier Studio',
      category: 'career',
      route: '/naje-cv',
      icon: NajeCvIcon,
      accentColor: 'from-indigo-500 to-violet-600',
      glowColor: 'rgba(99, 102, 241, 0.25)',
      descAr: 'استوديو بناء السيرة الذاتية التنفيذية، تدقيق ATS، خطابات التقديم المخصصة، ومحاكي أسئلة المقابلات.',
      descEn: 'Executive CV builder, ATS scoring, custom cover letters, and AI interview simulation.',
      config: studiosState.naje_cv || {},
      fields: [
        {
          key: 'baseDossierCost',
          labelAr: 'تكلفة بناء السيرة الكاملة (Base Dossier)',
          labelEn: 'Full Resume Generation Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 50,
          unit: 'نقطة',
          hintAr: 'تكلفة توليد وصياغة ملف السيرة الذاتية المهني الشامل وتوافق ATS.',
        },
        {
          key: 'coverLetterCost',
          labelAr: 'تكلفة خطاب التقديم المخصص (Cover Letter)',
          labelEn: 'Cover Letter Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'تكلفة صياغة خطاب تقديم مستهدف لوظيفة أو جهة معينة.',
        },
        {
          key: 'linkedInOptimizationCost',
          labelAr: 'تكلفة تدقيق وتحسين لينكدإن (LinkedIn Audit)',
          labelEn: 'LinkedIn Optimization Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'إعادة صياغة العناوين والنبذة وتوزيع الكلمات المفتاحية للحساب.',
        },
        {
          key: 'interviewPrepCost',
          labelAr: 'تكلفة محاكي أسئلة المقابلات (Interview Prep)',
          labelEn: 'Interview Simulator Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 30,
          unit: 'نقطة',
          hintAr: 'توليد جلسة أسئلة مقابلة متوقعة مع نماذج الإجابة النموذجية.',
        },
        {
          key: 'bilingualAddonCost',
          labelAr: 'تكلفة النسخة ثنائية اللغة (عربي / إنجليزي)',
          labelEn: 'Bilingual Addon Cost',
          type: 'number',
          step: 1,
          min: 0,
          max: 20,
          unit: 'نقطة',
          hintAr: 'إضافة توليد النسخة المقابلة بلغة أخرى مع الحفاظ على المصطلحات.',
        },
        {
          key: 'portfolioWebCost',
          labelAr: 'تكلفة صفحة بورتفوليو الويب (Web Portfolio)',
          labelEn: 'Web Portfolio Generation Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 30,
          unit: 'نقطة',
          hintAr: 'تحويل السيرة الذاتية إلى صفحة ويب تفاعلية جاهزة للنشر.',
        },
        {
          key: 'docxExportCost',
          labelAr: 'تكلفة تصدير ملف Word / DOCX',
          labelEn: 'Word DOCX Export Fee',
          type: 'number',
          step: 0.5,
          min: 0,
          max: 10,
          unit: 'نقطة',
          hintAr: 'رسوم تنزيل الملف بصيغة Word قابلة للتعديل الحر.',
        },
        {
          key: 'maxRevisionsIncluded',
          labelAr: 'عدد المراجعات المجانية المضمنة',
          labelEn: 'Free Revisions Count',
          type: 'number',
          step: 1,
          min: 1,
          max: 10,
          unit: 'مراجعات',
          hintAr: 'عدد مرات إعادة الصياغة والتحسين المجانية بعد التوليد الأولي.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const base = Number(cfg.baseDossierCost || 8);
        const cover = Number(cfg.coverLetterCost || 4);
        return { labelAr: 'سيرة ذاتية كاملة + خطاب تقديم', points: base + cover };
      }
    },
    {
      id: 'naje_prompt',
      nameAr: 'ناجي برومبت (Naje Prompt Engineering)',
      nameEn: 'Prompt Architecture Studio',
      category: 'ai',
      route: '/naje-prompt',
      icon: Wand2,
      accentColor: 'from-purple-500 to-fuchsia-600',
      glowColor: 'rgba(168, 85, 247, 0.25)',
      descAr: 'استوديو هندسة الأوامر المتقدمة، نماذج سلاسل التفكير (CoT)، وتكييف الأوامر لمختلف نماذج الذكاء.',
      descEn: 'Chain-of-thought prompt engineering, multi-model adaptation, and few-shot datasets.',
      config: studiosState.naje_prompt || {},
      fields: [
        {
          key: 'promptOptimizationCost',
          labelAr: 'تكلفة تحسين وهندسة الأمر (Prompt Optimization)',
          labelEn: 'Prompt Refinement Cost',
          type: 'number',
          step: 0.5,
          min: 0.5,
          max: 15,
          unit: 'نقطة',
          hintAr: 'تكلفة تحويل فكرة عامة إلى برومبت هيكلي احترافي بمحددات دقيقة.',
        },
        {
          key: 'fewShotDatasetCost',
          labelAr: 'تكلفة توليد أمثلة Few-Shot المتخصصة',
          labelEn: 'Few-Shot Dataset Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'صياغة أزواج من المدخلات والمخرجات لتدريب النموذج في سياق الأمر.',
        },
        {
          key: 'multiModelAdapterCost',
          labelAr: 'تكلفة مواءمة النماذج المتعددة (Multi-Model Adapter)',
          labelEn: 'Multi-Model Adapter Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'توليد نسخ مخصصة لـ Gemini, Claude, GPT, Midjourney بنفس المعايير.',
        },
        {
          key: 'chainOfThoughtCost',
          labelAr: 'تكلفة سلاسل الاستدلال CoT (Chain-of-Thought)',
          labelEn: 'Chain-of-Thought Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'بناء شجرة منطقية متعددة المراحل للأوامر المعقدة والحسابية.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const opt = Number(cfg.promptOptimizationCost || 2);
        const adapter = Number(cfg.multiModelAdapterCost || 3);
        return { labelAr: 'هندسة أمر شامل + تكييف متعدد النماذج', points: opt + adapter };
      }
    },
    {
      id: 'creative_studio',
      nameAr: 'الاستوديو الإبداعي (Creative Studio)',
      nameEn: 'Visual Assets & Brand Studio',
      category: 'creative',
      route: '/creative-studio',
      icon: CreativeStudioIcon,
      accentColor: 'from-pink-500 to-rose-600',
      glowColor: 'rgba(236, 72, 153, 0.25)',
      descAr: 'استوديو توليد الهويات البصرية، منشورات السوشيال ميديا، الفلايرات التسويقية، وتصدير المتجهات.',
      descEn: 'Design visual identities, social campaigns, marketing flyers, and open vector assets.',
      config: studiosState.creative_studio || {},
      fields: [
        {
          key: 'socialMediaPostCost',
          labelAr: 'تكلفة تصميم منشور سوشيال ميديا (Social Post)',
          labelEn: 'Social Media Post Cost',
          type: 'number',
          step: 0.5,
          min: 1,
          max: 25,
          unit: 'نقطة',
          hintAr: 'توليد تصميم متكامل للمنشور بمقاس مخصص وكتابة إعلانية ملائمة.',
        },
        {
          key: 'marketingFlyerCost',
          labelAr: 'تكلفة تصميم الفلاير والمطبوعات (Marketing Flyer)',
          labelEn: 'Marketing Flyer Cost',
          type: 'number',
          step: 1,
          min: 2,
          max: 30,
          unit: 'نقطة',
          hintAr: 'تصميم فلاير أو بروشور إعلاني عالي الدقة جاهز للطباعة.',
        },
        {
          key: 'brandKitBundleCost',
          labelAr: 'تكلفة حزمة الهوية البصرية المتكاملة (Brand Kit)',
          labelEn: 'Brand Kit Bundle Cost',
          type: 'number',
          step: 1,
          min: 5,
          max: 50,
          unit: 'نقطة',
          hintAr: 'حزمة كاملة تشمل لوحة الألوان، الخطوط، نماذج الشعار، والأصول البصرية.',
        },
        {
          key: 'bannerAdCost',
          labelAr: 'تكلفة تصاميم إعلانات البانر الرقمية (Banner Ad)',
          labelEn: 'Banner Ad Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'تصميم بانرات إعلانية بقياسات Google Ads والمنصات الرقمية.',
        },
        {
          key: 'vectorExportAddon',
          labelAr: 'تكلفة تصدير الفيكتور SVG عالي النقاء',
          labelEn: 'Vector SVG Export Addon',
          type: 'number',
          step: 0.5,
          min: 0,
          max: 10,
          unit: 'نقطة',
          hintAr: 'رسوم استخراج الشعار أو التصميم بملف فيكتور قابل للتكبير اللانهائي.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const post = Number(cfg.socialMediaPostCost || 4);
        const vector = Number(cfg.vectorExportAddon || 2);
        return { labelAr: 'تصميم بوست إعلاني + تصدير فيكتور', points: post + vector };
      }
    },
    {
      id: 'naje_developer',
      nameAr: 'مطور ناجي (Naje Developer)',
      nameEn: 'Full-Stack Software Architecture',
      category: 'creative',
      route: '/naje-developer',
      icon: Code2,
      accentColor: 'from-emerald-500 to-teal-600',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      descAr: 'استوديو توليد المشاريع البرمجية، الفحص والتدقيق الأمني للكود، وتوليد بيئات Docker و CI/CD.',
      descEn: 'Full-stack software scaffold generation, security audits, repo analysis, and DevOps setups.',
      config: studiosState.naje_developer || {},
      fields: [
        {
          key: 'codeProjectCost',
          labelAr: 'تكلفة إنشاء مشروع كامل (Code Project Scaffold)',
          labelEn: 'Full Project Generation Cost',
          type: 'number',
          step: 1,
          min: 2,
          max: 50,
          unit: 'نقطة',
          hintAr: 'توليد هيكل مشروع متكامل مع ملفات الإعداد والمكونات الأساسية.',
        },
        {
          key: 'securityAuditCost',
          labelAr: 'تكلفة التدقيق الأمني وفحص الثغرات (Security Audit)',
          labelEn: 'Security Audit Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 30,
          unit: 'نقطة',
          hintAr: 'فحص الكود بحثاً عن الثغرات الأمنية مع تقرير المعالجة المباشر.',
        },
        {
          key: 'repoAnalysisCost',
          labelAr: 'تكلفة تحليل وفهرسة المستودع (Repo Analysis)',
          labelEn: 'Repository Analysis Cost',
          type: 'number',
          step: 1,
          min: 2,
          max: 40,
          unit: 'نقطة',
          hintAr: 'قراءة وفهرسة ملفات المستودع لتقديم توصيات معمارية دقيقة.',
        },
        {
          key: 'dockerCiGenCost',
          labelAr: 'تكلفة توليد ملفات Docker وخطوط CI/CD',
          labelEn: 'Docker & CI/CD Generator Cost',
          type: 'number',
          step: 1,
          min: 1,
          max: 20,
          unit: 'نقطة',
          hintAr: 'صياغة Dockerfile و Docker Compose و GitHub Actions جاهزة.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const proj = Number(cfg.codeProjectCost || 10);
        const audit = Number(cfg.securityAuditCost || 4);
        return { labelAr: 'توليد مشروع متكامل + تدقيق أمني', points: proj + audit };
      }
    },
    {
      id: 'naje_agent',
      nameAr: 'الوكيل الذكي والنساج (Naje Agent Core)',
      nameEn: 'Autonomous Reasoning & Tools Agent',
      category: 'ai',
      route: '/naje-agent-core',
      icon: Bot,
      accentColor: 'from-blue-500 to-indigo-600',
      glowColor: 'rgba(59, 130, 246, 0.25)',
      descAr: 'محرك الوكلاء المستقلين ذوي الاستدلال متعدد الخطوات، البحث المباشر في الويب، وتنفيذ الأكواد.',
      descEn: 'Autonomous agent missions, multi-step chain reasoning, live web search, and tool executions.',
      config: studiosState.naje_agent || {},
      fields: [
        {
          key: 'costPerStep',
          labelAr: 'تكلفة خطوة تفكير الوكيل (Cost Per Turn/Step)',
          labelEn: 'Agent Step Cost',
          type: 'number',
          step: 0.1,
          min: 0.2,
          max: 10,
          unit: 'نقطة/خطوة',
          hintAr: 'التكلفة المحتسبة لكل دورة استدلال وتنفيذ خطة من قبل الوكيل.',
        },
        {
          key: 'toolSearchCost',
          labelAr: 'تكلفة أداة البحث المباشر في الويب (Web Search Tool)',
          labelEn: 'Web Search Tool Cost',
          type: 'number',
          step: 0.1,
          min: 0,
          max: 5,
          unit: 'نقطة/بحث',
          hintAr: 'تكلفة تنفيذ استعلام بحث مباشر عبر Google Search لجلب مصادر حية.',
        },
        {
          key: 'toolCodeExecutionCost',
          labelAr: 'تكلفة أداة تنفيذ الكود في الساندبوكس (Sandbox Exec)',
          labelEn: 'Code Execution Sandbox Fee',
          type: 'number',
          step: 0.2,
          min: 0,
          max: 10,
          unit: 'نقطة/تنفيذ',
          hintAr: 'تكلفة تشغيل الحسابات البرمجية والأكواد واختبارها واقعياً.',
        },
        {
          key: 'maxAutonomousSteps',
          labelAr: 'الحد الأقصى لعدد الخطوات المتتالية للوكيل',
          labelEn: 'Max Autonomous Steps Limit',
          type: 'number',
          step: 1,
          min: 3,
          max: 50,
          unit: 'خطوات',
          hintAr: 'سقف الأمان لمنع تكرار الخطوات أو استنزاف الرصيد في المهام الطويلة.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const step = Number(cfg.costPerStep || 1.0);
        const search = Number(cfg.toolSearchCost || 0.5);
        return { labelAr: 'مهمة وكيل متوسطة (5 خطوات + بحثين)', points: Math.round(5 * step + 2 * search) };
      }
    },
    {
      id: 'naje_ad',
      nameAr: 'ناجي أد (Naje Ad Studio)',
      nameEn: 'Cinematic Commercials Engine',
      category: 'motion',
      route: '/naje-ad',
      icon: NajeAdIcon,
      accentColor: 'from-sky-500 to-blue-600',
      glowColor: 'rgba(14, 165, 233, 0.25)',
      descAr: 'استوديو الإعلانات السينمائية الكاملة متعددة المشاهد، الإخراج الصوتي، واستهداف المنصات الإعلانية.',
      descEn: 'Full commercial video ads generator with multi-shot direction, voice casting, and dynamic ratios.',
      config: studiosState.naje_ad || {},
      fields: [
        {
          key: 'pointsRatePerSecond',
          labelAr: 'معدل النقاط للثانية الإعلانية (Points Rate)',
          labelEn: 'Points Rate Per Second',
          type: 'number',
          step: 0.1,
          min: 0.5,
          max: 20,
          unit: 'نقطة/ثانية',
          hintAr: 'التكلفة الأساسية لكل ثانية فيديو إعلاني بدقة 720p.',
        },
        {
          key: 'editMultiplier',
          labelAr: 'مضاعف إعادة التعديل السريع (Edit Multiplier)',
          labelEn: 'Edit Multiplier',
          type: 'number',
          step: 0.05,
          min: 0.1,
          max: 1.0,
          unit: 'x',
          hintAr: 'نسبة التكلفة المخفضة عند طلب تعديل مشهد محدد بدلاً من إعادة الإنتاج الكاملة.',
        },
        {
          key: 'res_1080p',
          labelAr: 'مضاعف دقة 1080p (FHD Multiplier)',
          labelEn: '1080p Multiplier',
          type: 'number',
          step: 0.1,
          min: 1.0,
          max: 5.0,
          unit: 'x',
          hintAr: 'مضاعف السعر عند اختيار الجودة الفائقة 1080p.',
        },
        {
          key: 'res_4k',
          labelAr: 'مضاعف دقة 4K السينمائية (Cinema 4K Multiplier)',
          labelEn: '4K Cinema Multiplier',
          type: 'number',
          step: 0.1,
          min: 1.5,
          max: 10.0,
          unit: 'x',
          hintAr: 'مضاعف السعر للتصدير بجودة الشاشات الكبيرة 4K.',
        },
        {
          key: 'maxShotsPerVideo',
          labelAr: 'الحد الأقصى لعدد المشاهد في الفيديو الواحد',
          labelEn: 'Max Shots Per Video',
          type: 'number',
          step: 1,
          min: 1,
          max: 10,
          unit: 'مشاهد',
          hintAr: 'أقصى عدد من اللقطات المتتالية التي يمكن للمخرج دمجها في إعلان واحد.',
        }
      ],
      calculateSamplePoints: (cfg) => {
        const rate = Number(cfg.pointsRatePerSecond || 2.5);
        const mul = Number(cfg.res_1080p || 1.5);
        const pts = Math.round(20 * rate * mul);
        return { labelAr: 'إعلان 20 ثانية بدقة 1080p', points: pts };
      }
    }
  ], [studiosState]);

  // Filtering
  const filteredStudios = useMemo(() => {
    return studiosList.filter(s => {
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.descAr.toLowerCase().includes(q) ||
        s.descEn.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [studiosList, activeCategory, searchQuery]);

  const activeStudiosCount = useMemo(() => {
    return Object.values(studiosState).filter(s => s?.enabled !== false).length;
  }, [studiosState]);

  const isDirty = (studioId: string) => {
    return JSON.stringify(studiosState[studioId]) !== JSON.stringify(initialStudiosState[studioId]);
  };

  const hasAnyDirty = useMemo(() => {
    return Object.keys(studiosState).some(id => isDirty(id));
  }, [studiosState, initialStudiosState]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="text-sm font-bold">جاري تحميل إعدادات وتسعير استوديوهات ناجي...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-purple-950/60 to-slate-950 border border-purple-500/25 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة التحكم الاقتصادية والتسعيرية الشاملة</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              إدارة الاستوديوهات والأسعار (Naje Studios Suite)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحكم ديناميكي كامل في أسعار نقاط التوليد، معدلات الثواني، مضاعفات الدقة، وتفعيل أو تعطيل أي استوديو من استوديوهات منصة ناجي لحظياً دون الحاجة لإعادة نشر التطبيق.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStudiosConfig}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              onClick={handleSaveAll}
              disabled={savingAll || !hasAnyDirty}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 ${
                hasAnyDirty
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 ring-2 ring-purple-400/50'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
              }`}
            >
              {savingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ كل الاستوديوهات</span>
              {hasAnyDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الاستوديوهات</span>
              <span className="text-lg font-black text-white">{studiosList.length} استوديوهات</span>
            </div>
            <Layers className="w-5 h-5 text-purple-400 opacity-60" />
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">الاستوديوهات النشطة</span>
              <span className="text-lg font-black text-emerald-400">{activeStudiosCount} / {studiosList.length}</span>
            </div>
            <Power className="w-5 h-5 text-emerald-400 opacity-60" />
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">القيمة المرجعية للنقطة</span>
              <span className="text-lg font-black text-amber-300">${POINT_USD_VALUE.toFixed(2)} USD</span>
            </div>
            <DollarSign className="w-5 h-5 text-amber-400 opacity-60" />
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">حالة التعديلات</span>
              <span className={`text-xs font-black ${hasAnyDirty ? 'text-amber-400' : 'text-slate-400'}`}>
                {hasAnyDirty ? 'توجد تغييرات غير محفوظة' : 'متطابق مع السحابة'}
              </span>
            </div>
            {hasAnyDirty ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-60" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white dark:bg-[#0c0e14] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'كل الاستوديوهات', count: studiosList.length },
            { id: 'motion', label: 'الموشن والسينما', count: 2 },
            { id: 'career', label: 'السيرة والمهنة', count: 1 },
            { id: 'ai', label: 'الأوامر والوكلاء', count: 2 },
            { id: 'creative', label: 'الإبداع والمطور', count: 2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الاستوديوهات والمعايير..."
            className="w-full h-9 ps-8 pe-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Studios Grid */}
      <div className="space-y-6">
        {filteredStudios.map((studio) => {
          const cfg = studiosState[studio.id] || {};
          const isEnabled = cfg.enabled !== false;
          const dirty = isDirty(studio.id);
          const isSaving = savingStudioId === studio.id;
          const sample = studio.calculateSamplePoints(cfg);
          const sampleUsd = (sample.points * POINT_USD_VALUE).toFixed(2);
          const IconComp = studio.icon;

          return (
            <div
              key={studio.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                isEnabled
                  ? 'bg-white dark:bg-[#0c0e14] border-slate-200 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700'
                  : 'bg-slate-50/50 dark:bg-[#08090d]/60 border-slate-200 dark:border-slate-900 opacity-80'
              } ${dirty ? 'ring-2 ring-amber-500/40 border-amber-500/50' : ''}`}
            >
              {/* Studio Header Card */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/30">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 ${studio.id === 'naje_ad' || studio.id === 'naje_ident' || studio.id === 'naje_cv' || studio.id === 'creative_studio' ? '' : `p-2.5 bg-gradient-to-br ${studio.accentColor} text-white shadow-lg`}`}>
                    <IconComp className="w-full h-full" size={48} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {studio.nameAr}
                      </h2>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        ({studio.nameEn})
                      </span>
                      {dirty && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          تعديل غير محفوظ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {studio.descAr}
                    </p>
                  </div>
                </div>

                {/* Studio State & Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <a
                    href={studio.route}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="فتح صفحة الاستوديو للتجربة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Active / Disabled Switch */}
                  <button
                    onClick={() => handleToggleStudio(studio.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{isEnabled ? 'الاستوديو مفعّل (نشط)' : 'الاستوديو معطّل'}</span>
                  </button>

                  {/* Reset to Recommended */}
                  <button
                    onClick={() => handleResetStudio(studio.id)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="استعادة الإعدادات الموصى بها لهذا الاستوديو"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveStudio(studio.id)}
                    disabled={isSaving || !dirty}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                      dirty
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 active:scale-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>حفظ الاستوديو</span>
                  </button>
                </div>
              </div>

              {/* Studio Config Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Field Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studio.fields.map((field) => {
                    const val = cfg[field.key];

                    return (
                      <div
                        key={field.key}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between gap-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              {field.labelAr}
                            </label>
                            {field.unit && (
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30">
                                {field.unit}
                              </span>
                            )}
                          </div>
                          {field.hintAr && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                              {field.hintAr}
                            </p>
                          )}
                        </div>

                        {field.type === 'number' && (
                          <div className="relative">
                            <input
                              type="number"
                              step={field.step || 1}
                              min={field.min ?? 0}
                              max={field.max ?? 9999}
                              value={val !== undefined ? val : ''}
                              onChange={(e) => handleFieldChange(studio.id, field.key, parseFloat(e.target.value) || 0)}
                              className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono flex items-center justify-between">
                              <span>يعادل بالدولار:</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                ≈ ${(Number(val || 0) * POINT_USD_VALUE).toFixed(3)} USD
                              </span>
                            </div>
                          </div>
                        )}

                        {field.type === 'select' && field.options && (
                          <select
                            value={val || field.options[0]?.value}
                            onChange={(e) => handleFieldChange(studio.id, field.key, e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500"
                          >
                            {field.options.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Real-time Economic Cost Simulator */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-slate-950/20 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 dark:text-white block">
                        محاكي تسعير عملية نموذجية (Live Cost Preview):
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {sample.labelAr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-start sm:text-end">
                      <span className="text-base font-black text-purple-600 dark:text-purple-400">
                        {sample.points} نقطة
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono block">
                        ≈ ${sampleUsd} USD
                      </span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px]">
                      مباشر
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminStudiosControl;
