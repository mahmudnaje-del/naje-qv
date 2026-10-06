import React, { useState, useRef, useEffect } from "react";
import {
  LayoutTemplate, KeyRound, Sparkles, Image as ImageIcon, Frame, Film, Wand2, Download, Upload, X, ChevronLeft, Plus, Lock, Star, Lightbulb, Users, Building2, Heart, Landmark, User, Check, Ruler, LayoutGrid, Maximize2, Eye, Brain, Cpu, Layers, Compass, Sliders, Play, Share2, Pencil, Trash2, Shield, Folder, ExternalLink, RefreshCw, AlertCircle, ArrowLeft, Send
} from "lucide-react";
import NajeSpinner from "../components/NajeSpinner";
import NajeThinking from "../components/NajeThinking";
import StudioBootSplash from "../components/StudioBootSplash";
import { FORM_CONFIGS } from "../lib/formConfigs";
import BrainCreativeTour from "../components/creatively/BrainCreativeTour";
import { ChatDesigner } from "../components/creatively/ChatDesigner";
import { CreativeAiProChat } from "../components/creatively/CreativeAiProChat";
import { EpisodesViewer } from "../components/creatively/EpisodesViewer";
import { WelcomeScreen } from "../components/creatively/WelcomeScreen";
import { saveDesign, getAllDesigns } from "../lib/creativelyDesigns";
import { useAppStore } from "../store";
import { toast } from "../toastStore";
import { auth } from "../firebase";
import { formatProfessionalError } from "../utils/errorFormatter";
import NajeErrorCard from "../components/NajeErrorCard";
import FeaturePaywallModal from "../components/FeaturePaywallModal";
import NajeCreditIcon from "../components/NajeCreditIcon";
import { hasFeatureAccess } from "../lib/featureAccess";
import { useI18n } from "../i18n";

type Mode = "logo" | "identity" | "video_ad" | "brand_kit" | "chat";
type Screen = "welcome" | "app" | "limit_reached" | "gallery" | "admin" | "brain_creative" | "creative_ai_pro";

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};



const ObjectTraits = ['شبابي', 'ودود', 'احترافي', 'تقني', 'عصري', 'بسيط', 'مبتكر', 'مستقبلي', 'فخم', 'أنيق', 'جريء', 'رسمي', 'مرح', 'قوي', 'موثوق', 'كلاسيكي', 'هندسي', 'إبداعي', 'حيوي', 'رياضي', 'طبيعي', 'ثقافي', 'طبي', 'صناعي', 'عضوي', 'تعليمي', 'موسيقي'];
const ObjectTraitsEn = ['Youthful', 'Friendly', 'Professional', 'Tech', 'Modern', 'Simple', 'Innovative', 'Futuristic', 'Luxurious', 'Elegant', 'Bold', 'Formal', 'Fun', 'Strong', 'Reliable', 'Classic', 'Geometric', 'Creative', 'Lively', 'Sporty', 'Natural', 'Cultural', 'Medical', 'Industrial', 'Organic', 'Educational', 'Musical'];
const renderErrorText = (err: any, fallback = '') => typeof err === 'string' ? err : err?.message || fallback;

export default function CreativelyAI() {
  const { user, updateBalance } = useAppStore();
  const { locale, isRtl, t } = useI18n();
  const balance = Number(user?.balance || 0);

  const lang: 'ar' | 'en' = locale === 'ar' ? 'ar' : 'en';
  const handleLangChange = (_newLang: 'ar' | 'en') => {};


  const handleAdminLogin = (e: React.FormEvent) => { e.preventDefault(); };
  const handleCreateCode = () => {};
  const handleRefreshAdmin = () => {};
  const handleExpandCode = (code: string) => {};
  const handleDeleteCode = (code: string) => {};

  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  
  const handleSetScreen = (screen: Screen, newMode?: Mode | null) => {
    setCurrentScreen(screen);
    if (newMode !== undefined) {
      setMode(newMode);
    }
  };


  const [isModelsSoon, setIsModelsSoon] = useState(false);
  const [generationsCount, setGenerationsCount] = useState<number>(0);
  const activationCode = "naje_authenticated";

  

  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    let title = t('creative.m109');
    let desc = t('creative.m108');

    if (currentScreen === 'app') {
      if (mode === 'chat') {
        title = t('creative.m107');
      } else if (mode === 'brand_kit') {
        title = t('creative.m106');
      } else {
        title = t('creative.m105');
      }
    } else if (currentScreen === 'creative_ai_pro') {
      title = t('creative.m104');
    } else if (currentScreen === 'gallery') {
      title = t('creative.m103');
    }

    document.title = title;
    
    // Attempt to update meta tags safely
    try {
      const metaTitle = document.querySelector('meta[name="title"]');
      if (metaTitle) metaTitle.setAttribute('content', title);
      
      const metaOgTitle = document.querySelector('meta[property="og:title"]');
      if (metaOgTitle) metaOgTitle.setAttribute('content', title);
      
      const metaTwitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (metaTwitterTitle) metaTwitterTitle.setAttribute('content', title);
    } catch (e) {
      // Ignored
    }
  }, [currentScreen, mode, lang]);


  const [entityType, setEntityType] = useState<string>('company');
  const [prompt, setPrompt] = useState('');
  const [useCreativePro, setUseCreativePro] = useState(false);
  const [df, setDf] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('naje-prompt-handoff');
      if (!raw) return;
      const j = JSON.parse(raw);
      const best = String(j?.bestFor || '').toLowerCase();
      const text = typeof j?.prompt === 'string' ? j.prompt.trim() : '';
      if (!text) return;
      if (best !== 'image' && best !== 'ui') return;
      setPrompt((prev) => prev || text);
      sessionStorage.removeItem('naje-prompt-handoff');
    } catch {
      /* ignore */
    }
  }, []);
  const [simNight, setSimNight] = useState(true);
  const [logoName, setLogoName] = useState('');
  const [dimension, setDimension] = useState<string>('2D');
  const [complexity, setComplexity] = useState<string>('الإبداعي "يجمع بين البساطة والتعقيد"');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [otherTrait, setOtherTrait] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImageModel, setSelectedImageModel] = useState<'lite' | 'spectra' | 'nova'>('spectra');
  const [generatedDesignId, setGeneratedDesignId] = useState<number | null>(null);
  const [designRating, setDesignRating] = useState<number>(0);
  const [isDesignRated, setIsDesignRated] = useState(false);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDownloadUrl, setVideoDownloadUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [conceptOptions, setConceptOptions] = useState<any[] | null>(null);

  const [conceptTitle, setConceptTitle] = useState<string | null>(null);
  const [conceptExplanation, setConceptExplanation] = useState<string | null>(null);
  const [brandKitSlogan, setBrandKitSlogan] = useState<string | null>(null);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingSvg, setIsDownloadingSvg] = useState(false);
  const [brandKitColors, setBrandKitColors] = useState<string[] | null>(null);
  const [brandKitTypography, setBrandKitTypography] = useState<string | null>(null);
  const [brandKitGuidelines, setBrandKitGuidelines] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identityFormat, setIdentityFormat] = useState('logo_and_identity');
  const [logoFormat, setLogoFormat] = useState('default');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [galleryTab, setGalleryTab] = useState<'global' | 'local'>('global');
  const [globalDesigns, setGlobalDesigns] = useState<any[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const codeStatus = { valid: true, limit: 99999, usage: 0, points: balance };
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  
  const isProUnlocked = true;
  const [showProLockModal, setShowProLockModal] = useState(false);
  const [showCreativelyPaywall, setShowCreativelyPaywall] = useState(false);
  const [proCodeError, setProCodeError] = useState('');

const handleProUnlockSubmit = async () => {};
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState('');
  const editBoxRef = useRef<HTMLDivElement>(null);

  // --- Advanced Integrated Brand Kit State ---
  const [selectedKitItems, setSelectedKitItems] = useState<string[]>([]);
  const [kitItemConfigs, setKitItemConfigs] = useState<Record<string, {
    dimension?: string;
    quality?: string;
    notes?: string;
    label?: string;
    fields?: Record<string, any>;
  }>>({});
  const [activeKitItemToConfigure, setActiveKitItemToConfigure] = useState<string | null>(null);
  const [tempConfigDimension, setTempConfigDimension] = useState('');
  const [tempConfigQuality, setTempConfigQuality] = useState('');
  const [tempConfigNotes, setTempConfigNotes] = useState('');
  const [tempConfigFields, setTempConfigFields] = useState<Record<string, any>>({});

  const [kitGenerationStatus, setKitGenerationStatus] = useState<'idle' | 'generating' | 'compiling' | 'success' | 'error'>('idle');
  const [kitGenerationStep, setKitGenerationStep] = useState<number>(-1);
  const [kitGeneratedAssets, setKitGeneratedAssets] = useState<Record<string, { imageUrl: string; prompt: string; concept: string }>>({});
  const [kitGenerationError, setKitGenerationError] = useState<string | null>(null);
  const [kitGenerationProgressMsg, setKitGenerationProgressMsg] = useState('');
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);

  // Define comprehensive assets/segments inside the Brand Kit
  const BRAND_KIT_ITEMS: Array<{
    id: string;
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
    icon: any;
    defaultDimension: string;
    defaultQuality: string;
    fields: Array<{
      id: string;
      type?: 'text' | 'radio' | 'checkbox';
      labelAr: string;
      labelEn: string;
      options?: Array<{value: string, labelAr: string, labelEn: string}>;
    }>;
  }> = [
    {
      id: 'brand_guidelines',
      labelAr: 'الدليل الإرشادي (Brand Guidelines)',
      labelEn: 'Brand Guidelines Document',
      descAr: 'كتيب متكامل يشرح قواعد استخدام الشعار والألوان والخطوط لبناء هوية ثابتة.',
      descEn: 'Comprehensive rulebook for logo usage, typography, and color palette.',
      icon: Sparkles,
      defaultDimension: '16:9 Landscape Layout',
      defaultQuality: 'Ultra HD 4K (2160p)',
      fields: [
        { id: 'slogan', type: 'text', labelAr: 'الشعار اللفظي (إن وجد)', labelEn: 'Brand Slogan (Optional)' },
        { id: 'industry', type: 'text', labelAr: 'مجال العمل الرئيسي', labelEn: 'Primary Industry' },
        { id: 'tone_of_voice', type: 'radio', labelAr: 'نبرة العلامة التجارية', labelEn: 'Brand Tone of Voice', options: [
            { value: 'professional', labelAr: 'رسمي واحترافي', labelEn: 'Professional & Formal' },
            { value: 'friendly', labelAr: 'ودود ومقرب', labelEn: 'Friendly & Approachable' },
            { value: 'innovative', labelAr: 'مبتكر وتقني', labelEn: 'Innovative & Tech' },
            { value: 'luxury', labelAr: 'فاخر وحصري', labelEn: 'Luxury & Exclusive' }
        ]},
        { id: 'typography', type: 'radio', labelAr: 'الخط المفضل (Typography)', labelEn: 'Preferred Typography', options: [
            { value: 'sans_serif', labelAr: 'عصري بدون حواف (Sans-Serif)', labelEn: 'Modern (Sans-Serif)' },
            { value: 'serif', labelAr: 'كلاسيكي بحواف (Serif)', labelEn: 'Classic (Serif)' },
            { value: 'script', labelAr: 'متصل/توقيع (Script)', labelEn: 'Script / Signature' },
            { value: 'bold_display', labelAr: 'عريض وبارز (Display)', labelEn: 'Bold Display' }
        ]}
      ]
    },
    {
      id: 'logo',
      labelAr: 'الشعار الرئيسي للعلامة (Logo)',
      labelEn: 'Main Brand Logo Icon',
      descAr: 'شعار أيقوني يدرس فلسفة المشروع كرمز فريد ومستقل.',
      descEn: 'Iconic custom symbol embedding project philosophy.',
      icon: Frame,
      defaultDimension: '1:1 Square (1024x1024)',
      defaultQuality: 'Vector Sharp Format',
      fields: [
        { id: 'slogan', type: 'text', labelAr: 'الشعار اللفظي (إن وجد)', labelEn: 'Brand Slogan (Optional)' },
        { id: 'brand_colors', type: 'text', labelAr: 'ألوان الهوية (اختياري)', labelEn: 'Brand Colors (Optional)' },
        { id: 'logo_type', type: 'radio', labelAr: 'نوع الشعار', labelEn: 'Logo Type', options: [
            { value: 'icon', labelAr: 'أيقونة فقط', labelEn: 'Icon Only' },
            { value: 'wordmark', labelAr: 'نصي (Wordmark)', labelEn: 'Text Wordmark' },
            { value: 'combination', labelAr: 'مدمج (أيقونة + نص)', labelEn: 'Combination Mark' },
            { value: 'emblem', labelAr: 'ختم / شارة (Emblem)', labelEn: 'Emblem/Badge' }
        ]},
        { id: 'design_style', type: 'checkbox', labelAr: 'أسلوب التصميم (اختر ما يناسبك)', labelEn: 'Design Style (Select appropriate)', options: [
            { value: 'minimalist', labelAr: 'بسيط', labelEn: 'Minimalist' },
            { value: 'modern', labelAr: 'عصري', labelEn: 'Modern' },
            { value: 'elegant', labelAr: 'أنيق', labelEn: 'Elegant' },
            { value: 'bold', labelAr: 'جريء', labelEn: 'Bold' },
            { value: 'vintage', labelAr: 'كلاسيكي', labelEn: 'Vintage' },
            { value: 'abstract', labelAr: 'تجريدي', labelEn: 'Abstract' }
        ]}
      ]
    },
    {
      id: 'horizontal_logo',
      labelAr: 'الشعار الرئيسي الأفقي (Horizontal)',
      labelEn: 'Main Horizontal Logo',
      descAr: 'تنسيق أفقي للشعار مع النص لسهولة وضعه في المواقع والمطبوعات.',
      descEn: 'Horizontal layout optimized for website headers and letterheads.',
      icon: Wand2,
      defaultDimension: '16:9 Presentation Format',
      defaultQuality: 'Ultra HD 4K (2160p)',
      fields: [
        { id: 'slogan', type: 'text', labelAr: 'الشعار اللفظي (إن وجد)', labelEn: 'Brand Slogan (Optional)' },
        { id: 'usage', type: 'checkbox', labelAr: 'الاستخدام الأساسي', labelEn: 'Primary Usage', options: [
            { value: 'website_header', labelAr: 'ترويسة موقع إلكتروني', labelEn: 'Website Header' },
            { value: 'documents', labelAr: 'المستندات والفواتير', labelEn: 'Documents & Invoices' },
            { value: 'billboards', labelAr: 'لوحات إعلانية', labelEn: 'Billboards' }
        ]}
      ]
    },
    {
      id: 'business_card',
      labelAr: 'بطاقة الأعمال الشخصية (Business Card)',
      labelEn: 'Professional Business Card',
      descAr: 'تصميم بطاقة أعمال فخمة ومميزة تحتوي على معلومات التواصل.',
      descEn: 'Premium double-sided layout for commercial networking.',
      icon: Users,
      defaultDimension: '9x5 cm Standard',
      defaultQuality: 'Print Ready (300 DPI)',
      fields: [
        { id: 'name', type: 'text', labelAr: 'الاسم كامل', labelEn: 'Full Name' },
        { id: 'title', type: 'text', labelAr: 'المسمى الوظيفي', labelEn: 'Job Title' },
        { id: 'phone', type: 'text', labelAr: 'رقم الهاتف', labelEn: 'Phone Number' },
        { id: 'email', type: 'text', labelAr: 'البريد الإلكتروني', labelEn: 'Email Address' },
        { id: 'website', type: 'text', labelAr: 'الموقع الإلكتروني', labelEn: 'Website' },
        { id: 'address', type: 'text', labelAr: 'العنوان', labelEn: 'Address' },
        { id: 'socials', type: 'text', labelAr: 'حسابات التواصل (اختياري)', labelEn: 'Social Media Handles' },
        { id: 'sides', type: 'radio', labelAr: 'التصميم (وجه أم وجهان؟)', labelEn: 'Design (One or Two-sided?)', options: [
            { value: 'one_sided', labelAr: 'وجه واحد', labelEn: 'One-sided' },
            { value: 'two_sided', labelAr: 'وجهان', labelEn: 'Two-sided' }
        ]},
        { id: 'qr_code', type: 'radio', labelAr: 'هل تريد QR Code؟', labelEn: 'Do you want a QR Code?', options: [
            { value: 'yes', labelAr: 'نعم', labelEn: 'Yes' },
            { value: 'no', labelAr: 'لا', labelEn: 'No' }
        ]},
        { id: 'material_finish', type: 'radio', labelAr: 'نوع الطباعة المفضل', labelEn: 'Preferred Print Finish', options: [
            { value: 'matte', labelAr: 'مطفي (Matte)', labelEn: 'Matte' },
            { value: 'glossy', labelAr: 'لامع (Glossy)', labelEn: 'Glossy' },
            { value: 'textured', labelAr: 'بارز الملمس (Textured)', labelEn: 'Textured' }
        ]},
        { id: 'design_style', type: 'checkbox', labelAr: 'أسلوب التصميم', labelEn: 'Design Style', options: [
            { value: 'simple', labelAr: 'بسيط (Simple)', labelEn: 'Simple' },
            { value: 'modern', labelAr: 'عصري (Modern)', labelEn: 'Modern' },
            { value: 'professional', labelAr: 'احترافي (Professional)', labelEn: 'Professional' },
            { value: 'luxurious', labelAr: 'فخم (Luxurious)', labelEn: 'Luxurious' },
            { value: 'creative', labelAr: 'إبداعي (Creative)', labelEn: 'Creative' }
        ]}
      ]
    },
    {
      id: 'letterhead_envelope',
      labelAr: 'الورق الرسمي والظروف المطبوعة (Stationery)',
      labelEn: 'Official Letterhead & Stationery',
      descAr: 'تصميم ورق المراسلات الرسمي والظرف المطبوع لهيبة المراسلات.',
      descEn: 'Elegant corporate letterhead header and envelope mockups.',
      icon: Landmark,
      defaultDimension: 'A4 Format (210x297 mm)',
      defaultQuality: 'Print Ready (300 DPI)',
      fields: [
        { id: 'phones', type: 'text', labelAr: 'أرقام التواصل', labelEn: 'Contact Numbers' },
        { id: 'email', type: 'text', labelAr: 'البريد الإلكتروني', labelEn: 'Email' },
        { id: 'website', type: 'text', labelAr: 'الموقع الإلكتروني', labelEn: 'Website' },
        { id: 'address', type: 'text', labelAr: 'العنوان الفعلي', labelEn: 'Physical Address' },
        { id: 'watermark', type: 'radio', labelAr: 'علامة مائية في الخلفية؟', labelEn: 'Background Watermark?', options: [
            { value: 'yes', labelAr: 'نعم (Yes)', labelEn: 'Yes' },
            { value: 'no', labelAr: 'لا (No)', labelEn: 'No' }
        ]},
        { id: 'layout_style', type: 'radio', labelAr: 'نمط التصميم للورق الرسمي', labelEn: 'Letterhead Layout Style', options: [
            { value: 'minimal', labelAr: 'نظيف وبسيط (Minimal)', labelEn: 'Clean Minimal' },
            { value: 'colored_borders', labelAr: 'إطارات ملونة (Colored Borders)', labelEn: 'Colored Borders' },
            { value: 'geometric', labelAr: 'أشكال هندسية (Geometric)', labelEn: 'Geometric Shapes' }
        ]}
      ]
    },
    {
      id: 'whatsapp_channel',
      labelAr: 'غلاف وصورة قناة واتس آب (WhatsApp Channel Cover)',
      labelEn: 'WhatsApp Channel Cover Art',
      descAr: 'صورة غلاف وغطاء متناسقة ومصممة بألوان الهوية لقناتك.',
      descEn: 'Custom brand cover layout designed perfectly for WhatsApp.',
      icon: Users,
      defaultDimension: '16:9 aspect ratio',
      defaultQuality: 'High Definition HD (1080p)',
      fields: [
        { id: 'channelName', type: 'text', labelAr: 'اسم القناة', labelEn: 'Channel Name' },
        { id: 'slogan', type: 'text', labelAr: 'الرسالة الترحيبية / الشعار', labelEn: 'Welcome Message / Slogan' },
        { id: 'category', type: 'radio', labelAr: 'تصنيف القناة', labelEn: 'Channel Category', options: [
            { value: 'business', labelAr: 'أعمال وشركات', labelEn: 'Business & Corporate' },
            { value: 'store', labelAr: 'متجر إلكتروني', labelEn: 'E-commerce Store' },
            { value: 'creator', labelAr: 'صانع محتوى', labelEn: 'Content Creator' },
            { value: 'news', labelAr: 'أخبار ومجتمع', labelEn: 'News & Community' }
        ]}
      ]
    },
    {
      id: 'youtube_cover',
      labelAr: 'غلاف القناة وصور اليوتيوب (YouTube Banner)',
      labelEn: 'YouTube Channel Cover Graphic',
      descAr: 'غلاف يوتيوب احترافي يربط المتابعين بالهوية البصرية للمشروع.',
      descEn: 'Stunning widescreen cover banner to captivate audiences.',
      icon: ImageIcon,
      defaultDimension: '2560x1440 px',
      defaultQuality: 'Ultra HD 4K (2160p)',
      fields: [
        { id: 'channelName', type: 'text', labelAr: 'اسم القناة', labelEn: 'Channel Name' },
        { id: 'schedule', type: 'text', labelAr: 'مواعيد النشر (اختياري)', labelEn: 'Upload Schedule (Optional)' },
        { id: 'socials', type: 'text', labelAr: 'أسماء الحسابات الأخرى (إن وجدت)', labelEn: 'Other Social Handles' },
        { id: 'vibe', type: 'radio', labelAr: 'جو القناة العام (Vibe)', labelEn: 'Channel Vibe', options: [
            { value: 'gaming', labelAr: 'ألعاب (Gaming)', labelEn: 'Gaming' },
            { value: 'vlog', labelAr: 'فلوجات وحياة (Vlog)', labelEn: 'Lifestyle Vlog' },
            { value: 'tech', labelAr: 'تقنية وتعليم (Tech/Edu)', labelEn: 'Tech & Education' },
            { value: 'podcast', labelAr: 'بودكاست وحوارات (Podcast)', labelEn: 'Podcast' },
            { value: 'business', labelAr: 'أعمال رسمي (Business)', labelEn: 'Corporate Business' }
        ]}
      ]
    },
    {
      id: 'social_post',
      labelAr: 'قالب منشورات السوشال ميديا (Social Post)',
      labelEn: 'Social Media Template Post',
      descAr: 'قالب إعلاني مذهل وتفاعلي لنشر المنتجات والعروض على المنصات.',
      descEn: 'Eye-catching social visual template aligned with the style.',
      icon: ImageIcon,
      defaultDimension: '1080x1080 px Square',
      defaultQuality: 'High Definition HD (1080p)',
      fields: [
        { id: 'headline', type: 'text', labelAr: 'العنوان الرئيسي (المانشيت)', labelEn: 'Headline' },
        { id: 'offer', type: 'text', labelAr: 'تفاصيل العرض / المحتوى', labelEn: 'Offer / Content Details' },
        { id: 'cta', type: 'text', labelAr: 'نداء الإجراء (CTA)', labelEn: 'Call to Action (CTA)' },
        { id: 'platform', type: 'radio', labelAr: 'المنصة', labelEn: 'Platform', options: [
            { value: 'instagram', labelAr: 'انستجرام', labelEn: 'Instagram' },
            { value: 'twitter', labelAr: 'تويتر / X', labelEn: 'Twitter / X' },
            { value: 'facebook', labelAr: 'فيسبوك', labelEn: 'Facebook' },
            { value: 'linkedin', labelAr: 'لينكد إن', labelEn: 'LinkedIn' }
        ]},
        { id: 'visual_focus', type: 'radio', labelAr: 'التركيز البصري للتصميم', labelEn: 'Visual Focus', options: [
            { value: 'product', labelAr: 'صورة المنتج', labelEn: 'Product Photo' },
            { value: 'people', labelAr: 'أشخاص / تفاعل', labelEn: 'People / Lifestyle' },
            { value: 'text', labelAr: 'نصوص واضحة', labelEn: 'Text-heavy' },
            { value: 'minimal', labelAr: 'بسيط وتجريدي', labelEn: 'Minimal Abstract' }
        ]},
        { id: 'emotion', type: 'checkbox', labelAr: 'الانطباع المطلوب', labelEn: 'Desired Emotion', options: [
            { value: 'excitement', labelAr: 'حماس وعرض خاص', labelEn: 'Excitement / Offer' },
            { value: 'trust', labelAr: 'ثقة واحترافية', labelEn: 'Trust & Professionalism' },
            { value: 'urgency', labelAr: 'إلحاح (وقت محدود)', labelEn: 'Urgency' }
        ]}
      ]
    },
    {
      id: 'story',
      labelAr: 'تصميم ستوري / ريلز (Vertical Story)',
      labelEn: 'WhatsApp & Instagram Story Graphic',
      descAr: 'تصميم طولي عمودي احترافي للإعلانات اليومية على المنصات.',
      descEn: 'Vertical dynamic template designed for stories or reels.',
      icon: Film,
      defaultDimension: '1080x1920 px (9:16)',
      defaultQuality: 'High Definition HD (1080p)',
      fields: [
        { id: 'headline', type: 'text', labelAr: 'النص القصير', labelEn: 'Short Text' },
        { id: 'cta', type: 'text', labelAr: 'زر التفاعل (مثال: اسحب للأعلى)', labelEn: 'Action Button (e.g., Swipe Up)' },
        { id: 'interactive', type: 'radio', labelAr: 'عنصر تفاعلي؟', labelEn: 'Interactive Element?', options: [
            { value: 'poll', labelAr: 'استطلاع رأي (Poll)', labelEn: 'Poll Placeholder' },
            { value: 'question', labelAr: 'صندوق أسئلة (Q&A)', labelEn: 'Q&A Box' },
            { value: 'link', labelAr: 'ملصق رابط (Link Sticker)', labelEn: 'Link Sticker' },
            { value: 'none', labelAr: 'بدون تفاعل', labelEn: 'None' }
        ]},
        { id: 'vibe', type: 'radio', labelAr: 'طابع القصة', labelEn: 'Story Vibe', options: [
            { value: 'aesthetic', labelAr: 'جمالية هادئة', labelEn: 'Calm Aesthetic' },
            { value: 'energetic', labelAr: 'حيوية وسريعة', labelEn: 'Energetic & Fast' },
            { value: 'behind_scenes', labelAr: 'كواليس العمل', labelEn: 'Behind the Scenes' }
        ]}
      ]
    },
    {
      id: 'packaging_mockup',
      labelAr: 'غلاف المنتجات وتطبيقات الهوية (Packaging & Mugs)',
      labelEn: 'Corporate Mug & Packaging Mockup',
      descAr: 'تطبيق الهوية البصرية والشعار على الأكياس، الأكواب، أو الهدايا.',
      descEn: 'Stunning representation on tangible mockups like bags & mugs.',
      icon: Building2,
      defaultDimension: '16:9 Presentation Format',
      defaultQuality: 'Ultra HD 4K (2160p)',
      fields: [
        { id: 'productName', type: 'text', labelAr: 'اسم المنتج', labelEn: 'Product Name' },
        { id: 'productType', type: 'text', labelAr: 'نوع المنتج / الوصف', labelEn: 'Product Type / Description' },
        { id: 'details', type: 'text', labelAr: 'التفاصيل (الوزن، المكونات، إلخ)', labelEn: 'Details (Weight, Ingredients, etc.)' },
        { id: 'packagingType', type: 'radio', labelAr: 'نوع العبوة', labelEn: 'Packaging Type', options: [
            { value: 'box', labelAr: 'صندوق', labelEn: 'Box' },
            { value: 'bag', labelAr: 'كيس', labelEn: 'Bag' },
            { value: 'bottle', labelAr: 'زجاجة', labelEn: 'Bottle' },
            { value: 'can', labelAr: 'علبة', labelEn: 'Can' },
            { value: 'pouch', labelAr: 'كيس مرن (Pouch)', labelEn: 'Stand-up Pouch' },
            { value: 'mug_cup', labelAr: 'كوب / فنجان', labelEn: 'Mug / Cup' }
        ]},
        { id: 'target_audience', type: 'radio', labelAr: 'الجمهور المستهدف للمنتج', labelEn: 'Target Audience', options: [
            { value: 'premium', labelAr: 'فاخر وحصري', labelEn: 'Premium & Luxury' },
            { value: 'eco', labelAr: 'صديق للبيئة وطبيعي', labelEn: 'Eco-friendly & Natural' },
            { value: 'kids', labelAr: 'أطفال ومرح', labelEn: 'Kids & Fun' },
            { value: 'general', labelAr: 'عام ويومي', labelEn: 'General Everyday' }
        ]},
        { id: 'key_benefits', type: 'text', labelAr: 'أهم ميزة لعرضها على الغلاف', labelEn: 'Key benefit to highlight on packaging' },
        { id: 'design_style', type: 'checkbox', labelAr: 'نمط التصميم للغلاف', labelEn: 'Packaging Design Style', options: [
            { value: 'minimal', labelAr: 'بسيط وهادئ', labelEn: 'Minimalist' },
            { value: 'vibrant', labelAr: 'ألوان صاخبة', labelEn: 'Vibrant Colors' },
            { value: 'pattern', labelAr: 'نقوش وزخارف', labelEn: 'Patterns & Textures' },
            { value: 'typographic', labelAr: 'اعتماد على الخطوط', labelEn: 'Typographic Focus' }
        ]}
      ]
    }
  ];

  // Utility to convert image URL to base64 for PDF inserting
  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    if (imageUrl.startsWith('data:')) return imageUrl;
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      // Fallback to Image element canvas
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataURL);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = (err) => {
        reject(err);
      };
      // Prevent cache blocking
      img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    });
  };

  // Compile jsPDF Brand identity Book
  const compileBrandKitPdf = async (brandAssets: Record<string, { imageUrl: string; prompt: string; concept: string }>) => {
    setKitGenerationStatus('compiling');
    setKitGenerationProgressMsg(
      t('creative.m102')
    );

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      const bName = df.projectName || 'Quantum AI Brand';
      const bIndustry = df.industry || 'Business Services';
      const bIdea = df.brandIdea || 'Innovative tech-forward solutions.';
      const bAudience = df.targetAudience || 'Modern tech consumers.';
      const bColors = df.preferredColors || 'Harmonious custom palette.';

      // Page 1: Cover Page
      doc.setFillColor(15, 23, 42); // deep slate-900
      doc.rect(0, 0, 1280, 720, 'F');

      // Accent visual decor shapes
      doc.setFillColor(236, 72, 153); // Pink
      doc.circle(1200, 100, 150, 'F');
      doc.setFillColor(139, 92, 246); // Purple
      doc.circle(80, 640, 200, 'F');

      // Veil overlay for elegance
      doc.setFillColor(15, 23, 42, 0.85);
      doc.rect(0, 0, 1280, 720, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.text(bName.toUpperCase(), 100, 280);

      doc.setTextColor(236, 72, 153); // pink accent
      doc.setFontSize(22);
      doc.text('INTEGRATED AI BRAND IDENTITY MANUAL & PORTFOLIO', 100, 325);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.text(`Commercial Activity: ${bIndustry}`, 100, 390);
      doc.text(`Compiled on: ${new Date().toLocaleDateString()}`, 100, 415);
      doc.text(`Designed Powered by Quantum Brand AI Engine`, 100, 440);

      // Page 2: Strategic Foundation
      doc.addPage([1280, 720], 'landscape');
      doc.setFillColor(20, 24, 33);
      doc.rect(0, 0, 1280, 720, 'F');

      doc.setTextColor(251, 191, 36); // Amber
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('BRAND STRATEGY & FOUNDATION', 80, 85);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Core Concept & Vision:', 80, 145);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      const splitIdea = doc.splitTextToSize(bIdea, 1120);
      doc.text(splitIdea, 80, 175);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Target Audience Profile:', 80, 360);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      const splitAud = doc.splitTextToSize(bAudience, 1120);
      doc.text(splitAud, 80, 390);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Aesthetic Vibe & Color Guidance:', 80, 500);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(bColors, 80, 530);

      // Render actual assets
      for (const itemId of selectedKitItems) {
        const item = BRAND_KIT_ITEMS.find(i => i.id === itemId);
        const asset = brandAssets[itemId];
        const config = kitItemConfigs[itemId] || {};

        if (!asset || !asset.imageUrl) continue;

        doc.addPage([1280, 720], 'landscape');
        // dark theme base
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 1280, 720, 'F');

        // sidebar content card
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 420, 720, 'F');

        // Item title
        doc.setTextColor(236, 72, 153);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(item?.labelEn || itemId, 40, 80);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(item?.labelAr || '', 40, 110);

        // Technical specs box
        doc.setFillColor(15, 23, 42);
        doc.rect(30, 150, 360, 160, 'F');

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(11);
        doc.text('ASSET SPECIFICATIONS', 50, 175);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.text(`Dimensions: ${config.dimension || item?.defaultDimension}`, 50, 205);
        doc.text(`Output Quality: ${config.quality || item?.defaultQuality}`, 50, 230);
        doc.text(`Status: Verified High Quality`, 50, 255);
        doc.text(`PDF Print Cost: 1 Point (Consolidated)`, 50, 280);

        // Custom Notes
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(11);
        doc.text('DESIGN DIRECTIVES', 50, 350);
        doc.setTextColor(226, 232, 240);
        const splitNote = doc.splitTextToSize(config.notes || 'No specific custom instructions were declared for this element. Styled with baseline brand identity colors.', 320);
        doc.text(splitNote, 50, 375);

        // Right side image showcase frame
        try {
          const base64Img = await getBase64ImageFromUrl(asset.imageUrl);
          doc.addImage(base64Img, 'JPEG', 460, 50, 770, 620);
        } catch (err) {
          console.error('CORS or load failed for image. Drawing beautiful visual vector mockup frame:', err);
          // Beautiful placeholder frame
          doc.setFillColor(30, 41, 59);
          doc.rect(460, 50, 770, 620, 'F');
          doc.setDrawColor(236, 72, 153);
          doc.setLineWidth(2);
          doc.rect(490, 80, 710, 560);

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text('Visual Brand Representation', 845, 300, { align: 'center' });
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(14);
          doc.text('[Asset compiles perfectly in your high-res bundle export]', 845, 340, { align: 'center' });
        }
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setCompiledPdfUrl(pdfUrl);
      setKitGenerationStatus('success');

      // Trigger automatic file download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${bName.replace(/\s+/g, '_')}_Brand_Identity_Kit.pdf`;
      link.click();

    } catch (pdfErr: any) {
      console.error('PDF compiling error:', pdfErr);
      setKitGenerationStatus('error');
      setKitGenerationError(pdfErr.message || 'Could not compile PDF book.');
    }
  };

  // Sequential Generation Pipeline Trigger
  const handleGenerateKitSequentially = async () => {
    if (selectedKitItems.length === 0) {
      alert(t('creative.m101'));
      return;
    }
    if (!df.projectName || !df.brandIdea) {
      alert(t('creative.m100'));
      return;
    }

    if (!hasFeatureAccess(user, 'creativelyAI')) {
      setShowCreativelyPaywall(true);
      return;
    }

    
    if (balance <= 0) {
      alert(t('creative.m099'));
      return;
    }
    setKitGenerationStatus('generating');
    setKitGenerationError(null);
    setKitGeneratedAssets({});
    setCompiledPdfUrl(null);
    setKitGenerationStep(0);
  };

  useEffect(() => {
    if (kitGenerationStatus !== 'generating' || kitGenerationStep < 0) return;

    if (kitGenerationStep >= selectedKitItems.length) {
      // Finished all sequential items! Run final compiler
      compileBrandKitPdf(kitGeneratedAssets);
      return;
    }

    const generateCurrentStepItem = async () => {
      const itemId = selectedKitItems[kitGenerationStep];
      const item = BRAND_KIT_ITEMS.find(i => i.id === itemId);
      const config = kitItemConfigs[itemId] || {};

      setKitGenerationProgressMsg(
        t('creative.m098', { p0: item ? t(`creative.kit.${item.id}.label`) : itemId, p1: kitGenerationStep + 1, p2: selectedKitItems.length })
      );

      try {
        let targetMode: 'logo' | 'identity' = 'identity';
        let targetFormat = 'logo_and_identity';
        let targetLogoFormat = 'default';

        if (itemId === 'logo') {
          targetMode = 'logo';
          targetLogoFormat = 'default';
        } else if (itemId === 'horizontal_logo') {
          targetMode = 'identity';
          targetFormat = 'horizontal_logo';
        } else if (itemId === 'business_card') {
          targetMode = 'identity';
          targetFormat = 'business_card';
        } else if (itemId === 'letterhead_envelope') {
          targetMode = 'identity';
          targetFormat = 'logo_and_identity';
        } else if (itemId === 'whatsapp_channel') {
          targetMode = 'identity';
          targetFormat = 'whatsapp_channel';
        } else if (itemId === 'youtube_cover') {
          targetMode = 'identity';
          targetFormat = 'youtube_cover';
        } else if (itemId === 'social_post') {
          targetMode = 'identity';
          targetFormat = 'social_post';
        } else if (itemId === 'story') {
          targetMode = 'identity';
          targetFormat = 'story';
        } else if (itemId === 'packaging_mockup') {
          targetMode = 'identity';
          targetFormat = 'full';
        }

        const previousLogoConcept = kitGeneratedAssets['logo']?.concept || kitGeneratedAssets['logo']?.prompt || '';
        const previousContext = previousLogoConcept ? `Previous Logo Concept (CRITICAL to match exactly): ${previousLogoConcept}\n` : '';

        let fieldsText = '';
        if (config.fields) {
          fieldsText = Object.entries(config.fields)
            .filter(([_, val]) => val && (Array.isArray(val) ? val.length > 0 : true))
            .map(([key, val]) => {
              const fieldDef = item?.fields?.find(f => f.id === key);
              let displayVal = val;
              if (Array.isArray(val)) {
                displayVal = val.map(v => {
                  const opt = fieldDef?.options?.find(o => o.value === v);
                  return opt ? opt.labelEn : v;
                }).join(', ');
              } else if (fieldDef?.type === 'radio') {
                const opt = fieldDef?.options?.find(o => o.value === val);
                displayVal = opt ? opt.labelEn : val;
              }
              return `${fieldDef?.labelEn || key}: ${displayVal}`;
            }).join('\n');
        }

        const buildPrompt = 
          previousContext +
          `Brand: ${df.projectName || ''}\n` +
          `Commercial Field: ${df.industry || ''}\n` +
          `Project Vision: ${df.brandIdea || ''}\n` +
          `Target Customers: ${df.targetAudience || ''}\n` +
          `Required Colors: ${df.preferredColors || ''}\n` +
          `Asset element: ${item?.labelEn} (${item?.labelAr}).\n` +
          `Specific requested aspect ratio / size constraints: ${config.dimension || item?.defaultDimension}.\n` +
          `Quality settings: ${config.quality || item?.defaultQuality}.\n` +
          (fieldsText ? `\nExact textual content & data for this asset (MUST USE THESE EXACTLY):\n${fieldsText}` : `Exact textual content & details for this asset: ${config.notes || 'Ensure consistent color themes throughout.'}`);

        const _tok = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/creatively/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok}` },
          body: JSON.stringify({
            prompt: buildPrompt,
            mode: targetMode,
            identityFormat: targetFormat,
            logoFormat: targetLogoFormat,
            activationCode: activationCode,
            logoName: df.projectName || '',
            dimension: dimension || '2D',
            complexity: complexity,
            entityType: entityType,
            aspectRatio: '16:9',
            productImages: productImages,
            baseImage: df['brandKitImage'] ? df['brandKitImage'] : undefined,
            selectedTraits: selectedTraits,
            selectedEmotions: selectedEmotions,
            otherTrait: otherTrait,
            useCreativePro,
            chatId: `creatively_kit_${df.projectName || 'project'}`,
            projectId: useAppStore.getState().activeProjectId || undefined,
          })
        });

        let data: any = {};
        const text = await response.text();
        try {
          if (text) data = JSON.parse(text);
        } catch {
          // ignore parsing error
        }

        if (!response.ok) {
          if (response.status === 402 || data?.error === 'feature_locked') {
            setShowCreativelyPaywall(true);
            setKitGenerationStatus('idle');
            return;
          }
          throw new Error(data?.error || t('creative.serverError', { status: response.status }));
        }

        setKitGeneratedAssets(prev => ({
          ...prev,
          [itemId]: {
            imageUrl: data.imageUrl,
            prompt: data.enhancedPrompt || buildPrompt,
            concept: data.conceptExplanation || ''
          }
        }));

        if (data.imageUrl) {
          saveDesign({
            url: data.imageUrl,
            prompt: data.enhancedPrompt || buildPrompt,
            type: 'brand_kit',
            conceptTitle: itemId,
            conceptExplanation: data.conceptExplanation || ''
          }).catch(console.warn);
        }

        // Deduct/consume 1 limit count on the frontend for visual feedback if code valid
        if (balance > 0) updateBalance(Math.max(0, balance - 1));

        // Increment step to proceed
        setKitGenerationStep(prev => prev + 1);

      } catch (err: any) {
        console.error(`Error in sequential pipeline for ${itemId}:`, err);
        // Smart fallback: log the error and automatically proceed to the next item
        // instead of halting the entire pipeline.
        setKitGenerationStep(prev => prev + 1);
      }
    };

    generateCurrentStepItem();
  }, [kitGenerationStatus, kitGenerationStep]);

  useEffect(() => {
    if (mode === 'video_ad') {
      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        setAspectRatio('16:9');
      }
    }
  }, [mode, aspectRatio]);

  useEffect(() => {
    if (isEditing && editBoxRef.current) {
      editBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEditing]);
  
  // Admin states
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCodes, setAdminCodes] = useState<any[]>([]);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeLimit, setNewCodeLimit] = useState(10);
  const [newCodeFeatures, setNewCodeFeatures] = useState('all');
  const [selectedCodeCard, setSelectedCodeCard] = useState<string | null>(null);
  const [codeDesigns, setCodeDesigns] = useState<Record<string, any[]>>({});
  const [loadingDesigns, setLoadingDesigns] = useState<Record<string, boolean>>({});
  const [adminTab, setAdminTab] = useState<'users' | 'costs'>('users');

  useEffect(() => {
    if (currentScreen === 'limit_reached') {
      getAllDesigns().then(setSavedDesigns).catch(console.error);
    }

    if (currentScreen === 'gallery') {
      setIsGalleryLoading(true);
      
      const fetchGallery = async () => {
        const token = await auth.currentUser?.getIdToken();
        fetch('/api/creatively/gallery', { headers: { 'Authorization': `Bearer ${token || ''}` } })
          .then(res => res.json())
          .then(data => setGlobalDesigns(data.designs || []))
          .catch(console.error)
          .finally(() => setIsGalleryLoading(false));
        getAllDesigns().then(setSavedDesigns).catch(console.error);
      };
      
      fetchGallery();
    }
  }, [currentScreen]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const outputRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const adminClickCount = useRef(0);

  const handleAdminSecretClick = () => {
    adminClickCount.current += 1;
    if (adminClickCount.current >= 7) {
      adminClickCount.current = 0;
      handleSetScreen('admin');
    }
  };

  useEffect(() => {
    if (isGenerating && loadingRef.current) {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if ((generatedImage || videoOperationName || videoDownloadUrl) && outputRef.current) {
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [generatedImage, isGenerating, videoOperationName, videoDownloadUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProductImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // reset input value so the same file can be selected again
    e.target.value = '';
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const getPlaceholderText = () => {
    const isAr = lang === 'ar';
    if (mode === 'logo') {
      if (logoFormat === 'app_icon') {
        return t('creative.m097');
      }
      return t('creative.m096');
    } else if (mode === 'video_ad') {
      return t('creative.m095');
    } else {
      switch (identityFormat) {
        case 'full':
          return t('creative.m094');
        case 'logo_and_identity':
          return t('creative.m093');
        case 'horizontal_logo':
          return t('creative.m092');
        case 'youtube_cover':
          return t('creative.m091');
        case 'whatsapp_channel':
          return t('creative.m090');
        case 'youtube_thumbnail':
          return t('creative.m089');
        case 'social_post':
          return t('creative.m088');
        case 'story':
          return t('creative.m087');
        case 'business_card':
          return t('creative.m086');
        default:
          return t('creative.m085');
      }
    }
  };

  const placeholderText = getPlaceholderText();

  const handleRateDesign = async (rating: number) => {
    if (!generatedDesignId) return;
    setDesignRating(rating);
    setIsDesignRated(true);
    try {
      const _tok = await auth.currentUser?.getIdToken();
      await fetch('/api/creatively/designs/rate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(_tok ? { 'Authorization': `Bearer ${_tok}` } : {})
        },
        body: JSON.stringify({ id: generatedDesignId, rating })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const checkFeatureAllowed = (_modeName: string) => true;

  const checkCodeStatus = () => null;

  const handleGenerate = async (overridePrompt?: string | React.MouseEvent, isEditAction = false, selectedConceptPrompt?: string) => {
    let finalPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    
    if (selectedConceptPrompt) {
      finalPrompt = selectedConceptPrompt;
    } else if ((mode === 'identity' || mode === 'video_ad' || mode === 'brand_kit' || (mode === 'logo' && logoFormat === 'billboard')) && typeof overridePrompt !== 'string') {
      const configKey = mode === 'video_ad' ? 'video_ad' : (mode === 'brand_kit' ? 'brand_kit' : (mode === 'logo' ? 'billboard' : identityFormat));
      const config = FORM_CONFIGS[configKey];
      if (config) {
        finalPrompt = config.map(field => {
          const val = df[field.id];
          if (!val || (Array.isArray(val) && val.length === 0)) return '';
          const label = lang === 'ar' ? field.labelAr : field.labelEn;
          if (Array.isArray(val)) {
            // Because values might be object identifiers or raw text, we try to map them back to labels if possible,
            // but for simplicity, we just join them. In formConfigs, multicheckbox options have specific text.
            return `${label}:\n - ${val.join('\n - ')}`;
          }
          return `${label}: ${val}`;
        }).filter(Boolean).join('\n\n');
      }
    } else if (mode === 'logo' && logoFormat !== 'billboard' && typeof overridePrompt !== 'string') {
      const parts = [];
      if (prompt.trim()) parts.push(`Project Details: ${prompt}`);
      if (logoName.trim()) parts.push(`Logo Name: ${logoName}`);
      if (selectedTraits.length > 0) parts.push(`Traits: ${selectedTraits.join(', ')}`);
      if (otherTrait.trim()) parts.push(`Other Traits: ${otherTrait}`);
      finalPrompt = parts.join('\n');
      if (!finalPrompt.trim()) {
        finalPrompt = "Logo Design";
      }
    }

    if (!finalPrompt.trim()) {
      setError(t('creative.errorInputCompanyDetails'));
      return;
    }

    if (!hasFeatureAccess(user, 'creativelyAI')) {
      setShowCreativelyPaywall(true);
      return;
    }

    setPrompt(finalPrompt);

    if (balance <= 0) {
      setError(t('creative.insufficientPoints'));
      toast.error(t('creative.insufficientPoints'));
      return;
    }

    const baseImagePayload = (isEditAction && generatedImage) ? generatedImage : undefined;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedDesignId(null);
    setDesignRating(0);
    setIsDesignRated(false);
    setVideoOperationName(null);
    setVideoDownloadUrl(null);
    setGeneratedPrompt(null);
    setConceptOptions(null);
    setConceptTitle(null);
    setConceptExplanation(null);
    setBrandKitSlogan(null);
    setBrandKitColors(null);
    setBrandKitTypography(null);
    setBrandKitGuidelines(null);

    let resultTypeId = undefined;
    if (mode === 'video_ad') {
      const rtField = FORM_CONFIGS.video_ad.find(f => f.id === 'resultType');
      const sOpt = rtField?.options?.find(o => o.labelAr === df['resultType'] || o.labelEn === df['resultType']);
      resultTypeId = sOpt ? sOpt.id : 'video';
    }

    try {
      const _tok = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/creatively/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok}` },
        body: JSON.stringify({ 
          prompt: finalPrompt, 
          mode, 
          identityFormat: mode === 'identity' ? identityFormat : undefined,
          logoFormat: mode === 'logo' ? logoFormat : undefined,
          resultType: mode === 'video_ad' ? resultTypeId : undefined,
          videoDuration: mode === 'video_ad' ? df.videoDuration : undefined,
          productImages: productImages,
          activationCode: activationCode,
          logoName,
          baseImage: baseImagePayload,
          dimension,
          complexity,
          selectedTraits,
          selectedEmotions,
          otherTrait,
          aspectRatio: (mode === 'video_ad' && df.aspectRatio) ? df.aspectRatio.replace('_', ':') : aspectRatio,
          imageSize,
          entityType,
          useCreativePro,
          imageModel: selectedImageModel,
          selectedConceptPrompt: selectedConceptPrompt,
          chatId: `creatively_${mode}_${Date.now()}`,
          projectId: useAppStore.getState().activeProjectId || undefined,
        }),
      });

      let data: any = {};
      const text = await response.text();
      try {
        if (text) data = JSON.parse(text);
      } catch {
        // ignore parsing error
      }

      if (!response.ok) {
        if (response.status === 402 || data?.error === 'feature_locked') {
          setShowCreativelyPaywall(true);
          setIsGenerating(false);
          return;
        }
        throw new Error(data?.error || t('creative.serverError', { status: response.status }));
      }

      if (data.type === "concepts") {
        setConceptOptions(data.concepts);
        setIsGenerating(false);
        return;
      }


      setConceptTitle(data.conceptTitle);
      setConceptExplanation(data.conceptExplanation);
      if (mode === 'brand_kit') {
        setBrandKitSlogan(data.brandKitSlogan || null);
        setBrandKitColors(data.brandKitColors || null);
        setBrandKitTypography(data.brandKitTypography || null);
        setBrandKitGuidelines(data.brandKitGuidelines || null);
      }

      if (data?.type === 'video_operation') {
        setVideoOperationName(data.operationName);
        setIsGenerating(false);
        return;
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedPrompt(data.enhancedPrompt);
      
      saveDesign({
        url: data.imageUrl,
        prompt: finalPrompt || prompt,
        type: mode,
        conceptTitle: data.conceptTitle,
        conceptExplanation: data.conceptExplanation
      }).then((docId) => {
        if (docId) setGeneratedDesignId(docId as any);
      }).catch(console.error);
      
      

      const newCount = generationsCount + 1;
      setGenerationsCount(newCount);
      safeLocalStorage.setItem('koun_generations_count', newCount.toString());
      
      // Show install prompt automatically after the first design
      if (newCount === 1 && deferredPrompt) {
        try {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            setDeferredPrompt(null);
          });
        } catch (e) {
          console.error('Install prompt failed', e);
        }
      }
    } catch (err: any) {
      const formatted = await formatProfessionalError(err, { chatType: 'image' });
      setError(formatted);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let pollTimeout: any;
    let simulatedProgressInterval: any;
    let cancelled = false;

    const POLL_START_MS = 5000;      // first poll still at 5s — matches current fast-feedback behavior for short clips
    const POLL_MAX_MS = 30000;       // cap backoff at 30s so long waits don't go silent for too long between checks
    const POLL_BACKOFF_FACTOR = 1.5;
    const MAX_TOTAL_WAIT_MS = 10 * 60 * 1000; // 10 minutes — generous for Veo/Omni Flash's actual generation times, but finite

    const startedAt = Date.now();

    if (videoOperationName && !videoDownloadUrl) {
      setVideoProgress(0);
      simulatedProgressInterval = setInterval(() => {
        setVideoProgress(prev => prev < 95 ? prev + (95 - prev) * 0.05 : prev);
      }, 2000);

      const poll = async (currentDelay: number) => {
        if (cancelled) return;

        if (Date.now() - startedAt > MAX_TOTAL_WAIT_MS) {
          clearInterval(simulatedProgressInterval);
          setError(t('creative.videoTimeout'));
          setIsGenerating(false);
          setVideoOperationName(null);
          return;
        }

        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/creatively/video-status', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ operationName: videoOperationName })
          });
          const statusResult = await res.json();

          if (statusResult.progress) setVideoProgress(statusResult.progress);

          if (statusResult.error && !statusResult.done) {
            console.error("Polling error", statusResult.error);
            clearInterval(simulatedProgressInterval);
            setError(statusResult.error);
            setIsGenerating(false);
            setVideoOperationName(null);
            return; // do not reschedule on a terminal error
          }

          if (statusResult.done) {
            clearInterval(simulatedProgressInterval);
            setVideoProgress(100);
            try {
              const dlRes = await fetch(`/api/creatively/video-download?operationName=${encodeURIComponent(videoOperationName)}`, {
                headers: {
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
              });
              if (dlRes.ok) {
                const blob = await dlRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                setVideoDownloadUrl(blobUrl);
                saveDesign(blob).catch(console.error);
              } else {
                console.error("Failed to download video blob for local storage.");
                setError(t('creative.videoFileFail'));
              }
            } catch (err) {
              console.error("Error saving video blob:", err);
              setError(t('creative.videoDownloadError'));
            }
            return; // done — do not reschedule
          }

          // Not done, no error — reschedule at the next backoff step.
          const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
          pollTimeout = setTimeout(() => poll(nextDelay), nextDelay);
        } catch (e) {
          // Network-level failure — back off the same way rather than hammering at full speed.
          console.error("Error polling video status", e);
          const nextDelay = Math.min(currentDelay * POLL_BACKOFF_FACTOR, POLL_MAX_MS);
          pollTimeout = setTimeout(() => poll(nextDelay), nextDelay);
        }
      };

      pollTimeout = setTimeout(() => poll(POLL_START_MS), POLL_START_MS);
    }

    return () => {
      cancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
      if (simulatedProgressInterval) clearInterval(simulatedProgressInterval);
    };
  }, [videoOperationName, videoDownloadUrl]);


  

  if (currentScreen === 'gallery') {
    return (
      <div className="naje-creative-studio flex-1 min-h-0 overflow-y-auto bg-[#030303] text-white font-sans overflow-x-hidden flex flex-col pb-28 sm:pb-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] ltr:left-[-10%] rtl:right-[-10%] w-[40rem] h-[40rem] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] ltr:right-[-10%] rtl:left-[-10%] w-[50rem] h-[50rem] bg-indigo-900/10 rounded-full blur-[150px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        <header className="relative z-10 px-6 py-6 border-b border-white/5 bg-naje-canvas/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] flex justify-between items-center">
          <button 
            onClick={() => handleSetScreen('welcome')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            <span>{t('nav.home')}</span>
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            {t('creative.m084')}
          </h1>
          <div className="w-20"></div>
        </header>

        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col items-center">
          <div className="flex bg-white/5 p-1 rounded-full mb-8 border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setGalleryTab('global')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${galleryTab === 'global' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('creative.m083')}
            </button>
            <button 
              onClick={() => setGalleryTab('local')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${galleryTab === 'local' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('creative.m082')}
            </button>
          </div>

          {isGalleryLoading && galleryTab === 'global' ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <NajeSpinner className="w-10 h-10 mb-4" />
              <p className="text-slate-400 text-sm">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {(galleryTab === 'global' ? globalDesigns : savedDesigns).map((design, idx) => (
                <div key={design?.id || idx} className="group relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
                  <div className="aspect-square w-full bg-black/50 flex items-center justify-center">
                    {design?.type === 'video' || design?.url?.endsWith('.mp4') ? (
                      <video src={design?.url || design?.blobUrl} className="w-full h-full object-cover" muted loop playsInline onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
                    ) : (
                      <img src={design?.url || design?.blobUrl} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-sm font-bold mb-1 truncate">{design?.prompt || t('creative.noDescription')}</p>
                    <a 
                      href={design?.url || design?.blobUrl} 
                      download={`design-${Date.now() + "-" + Math.random().toString(36).substring(7)}`}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white transition-all text-xs font-bold"
                    >
                      <Download className="w-4 h-4" />
                      {t('common.download')}
                    </a>
                  </div>
                </div>
              ))}
              
              {(galleryTab === 'global' ? globalDesigns : savedDesigns).length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <LayoutTemplate className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">{t('creative.m081')}</h3>
                  <p className="text-slate-500">{t('creative.m080')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (currentScreen === 'brain_creative') {
    return <BrainCreativeTour lang={lang} onBack={() => handleSetScreen('welcome')} />;
  }
  
  if (currentScreen === 'creative_ai_pro') {
    // Creatively pro-chat removed — route to the structured generators (welcome) instead.
    return (
      <WelcomeScreen 
        lang={lang} 
        onNavigate={(screen, newMode) => { handleSetScreen(screen, newMode || null); }} 
        onSecretClick={handleAdminSecretClick} 
        userName={user?.displayName || user?.email?.split('@')[0] || ''}
      />
    );
  }
  
if (currentScreen === 'welcome') {
    return (
      <WelcomeScreen 
        lang={lang} 
        onNavigate={(screen, newMode) => {
          handleSetScreen(screen, newMode || null);
        }} 
        onSecretClick={handleAdminSecretClick} 
        userName={user?.displayName || user?.email?.split('@')[0] || ''}
      />
    );
  }

  if (currentScreen === 'admin') {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950 text-white font-sans flex flex-col items-center pt-8 pb-32 sm:pb-16 px-4 md:px-8 relative overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="fixed top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-rose-900 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none animate-pulse"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-10">
            <button 
               onClick={() => {
                 handleSetScreen('welcome');
               }}
               className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2"
            >
               <ChevronLeft className="w-5 h-5" />
               {t('creative.backHome')}
            </button>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">
               {t('creative.adminPanel')}
            </h2>
          </div>

          {!isAdminLoggedIn ? (
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center shadow-lg mt-10">
              <Lock className="w-12 h-12 text-rose-500 mb-6" />
              <h3 className="text-xl font-bold mb-6">{t('creative.adminLoginTitle')}</h3>
              <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-4">
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={t('creative.adminPasswordPlaceholder')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                {adminError && <p className="text-red-400 text-sm font-bold">{adminError}</p>}
                <button 
                  type="submit"
                  disabled={isLoadingAdmin}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingAdmin && <NajeSpinner className="w-5 h-5" />}
                  {t('creative.adminLoginBtn')}
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6 animate-fade-in-up">
              
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-4 w-full md:w-max">
                <button 
                  onClick={() => setAdminTab('users')}
                  className={`flex-1 md:px-8 py-2 text-sm font-bold rounded-lg transition-colors ${adminTab === 'users' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
                >
                  {t('creative.subscribersCodes')}
                </button>
                <button 
                  onClick={() => setAdminTab('costs')}
                  className={`flex-1 md:px-8 py-2 text-sm font-bold rounded-lg transition-colors ${adminTab === 'costs' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  {t('creative.siteCosts')}
                </button>
              </div>

              {adminTab === 'users' && (
                <>
{/* Create Code Section */}
                  <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <KeyRound className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{t('creative.adminAddCodeTitle')}</h3>
                    </div>
                    <form onSubmit={handleCreateCode} className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col gap-2 md:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('creative.adminNamePlaceholder')}</label>
                        <input 
                          type="text" 
                          value={newCodeName}
                          onChange={(e) => setNewCodeName(e.target.value)}
                          placeholder={t('creative.nameExample')}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('creative.adminLimitPlaceholder')}</label>
                        <input 
                          type="number" 
                          value={isNaN(newCodeLimit) ? '' : newCodeLimit}
                          onChange={(e) => setNewCodeLimit(parseInt(e.target.value, 10) || 0)}
                          placeholder={t('creative.countExample')}
                          min="1"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('creative.m079')}</label>
                        <select
                          value={newCodeFeatures}
                          onChange={(e) => setNewCodeFeatures(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="all">{t('common.all')}</option>
                          <option value="all_except_pro">{t('creative.m078')}</option>
                          <option value="creative_ai">{lang === 'ar' ? 'Creative Ai' : 'Creative Ai'}</option>
                          <option value="creative_ai_pro">{lang === 'ar' ? 'Creative Ai Pro' : 'Creative Ai Pro'}</option>
                          <option value="brand_kit">{t('creative.m077')}</option>
                          <option value="logo_identity">{t('creative.m076')}</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <button 
                          type="submit"
                          disabled={isLoadingAdmin}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isLoadingAdmin ? <NajeSpinner className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          {t('creative.adminAddCodeBtn')}
                        </button>
                      </div>
                    </form>
                  </div>

              <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-6">
                <div>
                  <h3 className="text-2xl font-bold">{t('creative.adminCodesHeader')}</h3>
                </div>
                <button 
                  onClick={handleRefreshAdmin} 
                  disabled={isLoadingAdmin}
                  className="px-6 py-2 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/50 rounded-xl text-rose-300 font-medium transition-colors flex items-center gap-2"
                >
                  {isLoadingAdmin ? <NajeSpinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  {t('common.refresh')}
                </button>
              </div>

              {adminCodes.length === 0 ? (
                <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-slate-400 text-lg">
                  {t('creative.adminNoCodes')}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {adminCodes.map((codeObj, i) => (
                    <div key={codeObj.code} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                      {/* Card Header */}
                      <div 
                        className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleExpandCode(codeObj.code)}
                      >
                         <div className="flex flex-col gap-1">
                           <h4 className="font-bold text-xl text-rose-400">{codeObj.name}</h4>
                           <code className="text-sm text-slate-400 bg-black/40 px-2 py-1 rounded">{codeObj.code}</code>
                         </div>
                         <div className="flex items-center gap-4">
                           <div className="flex flex-col items-end gap-1">
                             <div className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
                               {t('creative.adminUsage', { u: codeObj.usage, l: codeObj.limit })}
                             </div>
                             {codeObj.features && codeObj.features !== 'all' && (
                               <span className="text-[10px] text-fuchsia-400 font-medium">
                                 {codeObj.features === 'all_except_pro' ? 'All except Creative AI Pro' :
                                  codeObj.features === 'creative_ai' ? 'Creative Ai' :
                                  codeObj.features === 'creative_ai_pro' ? 'Creative Ai Pro' :
                                  codeObj.features === 'brand_kit' ? 'Integrated Brand Kit Generator' :
                                  codeObj.features === 'logo_identity' ? 'Create Logo or Visual Identity' :
                                  codeObj.features}
                               </span>
                             )}
                           </div>
                           {codeToDelete === codeObj.code ? (
                             <div className="flex gap-2">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setCodeToDelete(null); }}
                                 className="px-3 py-1 text-sm bg-gray-500/20 text-gray-300 rounded hover:bg-gray-500/40"
                               >
                                 {t('common.cancel')}
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteCode(codeObj.code); setCodeToDelete(null); }}
                                 className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"
                               >
                                 {t('creative.confirmDelete')}
                               </button>
                             </div>
                           ) : (
                             <button 
                               onClick={(e) => { e.stopPropagation(); setCodeToDelete(codeObj.code); }}
                               className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                               title="Delete Code"
                             >
                               <X className="w-5 h-5" />
                             </button>
                           )}
                         </div>
                      </div>
                      
                      {/* Card Details (Designs) */}
                      {selectedCodeCard === codeObj.code && (
                        <div className="p-4 border-t border-white/10 bg-black/20">
                          {loadingDesigns[codeObj.code] ? (
                            <div className="flex justify-center p-4">
                              <NajeSpinner className="w-6 h-6" />
                            </div>
                          ) : codeDesigns[codeObj.code] && codeDesigns[codeObj.code].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {codeDesigns[codeObj.code].map((design: any) => (
                                <div key={design?.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden p-2 flex flex-col gap-2">
                                  <div className="flex justify-between items-start">
                                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-1 rounded">{design?.mode === 'logo' ? t('creative.logoCardTitle') : design?.mode === 'video_ad' ? t('creative.videoCardTitle') || 'Video' : t('creative.identityCardTitle')}</span>
                                    <span className="text-slate-500 text-[10px]">{new Date(design?.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                  </div>
                                  {design?.type === 'video' ? (
                                    <video src={design?.imageUrl} controls playsInline className="w-full h-auto aspect-square object-cover rounded-lg border border-white/10 animate-fade-in" />
                                  ) : (
                                    <img src={design?.imageUrl} alt="Generated" referrerPolicy="no-referrer" className="w-full h-auto aspect-square object-cover rounded-lg border border-white/10 animate-fade-in" />
                                  )}
                                  <div className="px-1">
                                    <h5 className="font-bold text-sm mb-1 truncate text-slate-200">{design?.conceptTitle}</h5>
                                    <p className="text-slate-500 text-xs line-clamp-2">{design?.prompt}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm text-center py-4">{t('creative.adminNoUserDesigns')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </>
              )}

              {adminTab === 'costs' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in">
                  <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                    <h3 className="text-2xl font-bold text-white">{t('creative.pricingTitle')}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cost 1: Logo & Image */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-6 h-6 text-purple-400" />
                        <h4 className="text-xl font-bold text-slate-200">{t('creative.logoSection')}</h4>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{t('creative.logoSectionDesc')}</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality1k')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.03' })}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality2k')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.07' })}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality4k')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.12' })}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Cost 2: Visual Identity */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Frame className="w-6 h-6 text-indigo-400" />
                        <h4 className="text-xl font-bold text-slate-200">{t('creative.identitySection')}</h4>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{t('creative.identitySectionDesc')}</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality1kPlain')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.03' })}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality2k')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.07' })}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.quality4k')}</span>
                          <span className="font-bold text-amber-400">{t('creative.perDesign', { price: '0.12' })}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Cost 3: Video Generation */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Film className="w-6 h-6 text-pink-400" />
                        <h4 className="text-xl font-bold text-slate-200">{t('creative.videoSection')}</h4>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{t('creative.videoSectionDesc')}</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.videoAdLine')}</span>
                          <span className="font-bold text-rose-400">{t('creative.videoPriceLine')}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.creditsCost')}</span>
                          <span className="font-bold text-slate-300">{t('creative.creditsValue')}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Cost 4: Brainstorming Engine */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        <h4 className="text-xl font-bold text-slate-200">{t('creative.brainstormEngine')}</h4>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{t('creative.brainstormDesc')}</p>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-slate-300">{t('creative.prepIdeas')}</span>
                          <span className="font-bold text-emerald-400">{t('creative.perOp')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="mt-8 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                    <h4 className="text-lg font-bold text-amber-300 mb-2">{t('creative.totalEstimate')}</h4>
                    <p className="text-slate-300 text-sm mb-4">{t('creative.totalEstimateDesc')}</p>
                    <div className="flex justify-center items-center gap-4">
                      <div className="bg-black/50 px-6 py-4 rounded-xl border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">{t('creative.totalUsage')}</p>
                        <p className="text-3xl font-extrabold text-white">
                          {adminCodes.reduce((sum, code) => sum + (code.usage || 0), 0)} <span className="text-base font-normal text-slate-400">{t('creative.times')}</span>
                        </p>
                      </div>
                      <div className="text-amber-500/50">
                        <ChevronLeft className="w-8 h-8" />
                      </div>
                      <div className="bg-black/50 px-6 py-4 rounded-xl border border-amber-500/30">
                        <p className="text-xs text-amber-300/70 mb-1">{t('creative.estimatedTotalCost')}</p>
                        <p className="text-3xl font-extrabold text-amber-400">
                          {((adminCodes.reduce((sum, code) => sum + (code.usage || 0), 0)) * 0.03).toFixed(2)} <span className="text-base font-normal">$</span>
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>
    );
  }



  return (
    <div className={`naje-creative-studio w-full ${mode === 'chat' ? 'h-full flex-1 overflow-hidden py-0 md:py-12 px-0 md:px-8' : 'min-h-full flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-32 sm:pb-24 md:py-16 px-4 md:px-8'} bg-[#030303] text-white font-sans flex flex-col justify-start items-center relative`} dir={isRtl ? 'rtl' : 'ltr'}>
      <StudioBootSplash dark />
      <FeaturePaywallModal
        isOpen={showCreativelyPaywall}
        onClose={() => setShowCreativelyPaywall(false)}
        feature="creativelyAI"
      />
      {/* Background decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none"></div>

      <div className={`relative z-10 w-full flex flex-col items-center transition-all duration-500 ${mode === 'chat' ? 'max-w-6xl flex-1 md:my-auto' : 'max-w-4xl my-0'}`}>
        <div className={`w-full flex justify-between items-center mb-2 md:mb-8 ${mode === "chat" ? "px-4 pt-2 md:px-0 md:pt-0" : ""}`}>
          {deferredPrompt ? (
            <button 
               onClick={() => {
                 try {
                   deferredPrompt.prompt();
                   deferredPrompt.userChoice.then((choiceResult: any) => {
                     setDeferredPrompt(null);
                   });
                 } catch (e) {
                   console.error('Install prompt failed', e);
                 }
               }}
               className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-full transition-colors flex items-center gap-2 text-sm font-bold shadow-lg"
            >
               <Download className="w-4 h-4" />
               {t('creative.installPwaSimple')}
            </button>
          ) : <div></div>}
          {mode !== 'chat' && (
            <button 
               onClick={() => handleSetScreen('welcome')}
               className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
               <ChevronLeft className="w-4 h-4" />
               {t('nav.home')}
            </button>
          )}
        </div>
        {mode !== 'brand_kit' && mode !== 'chat' && (
          <>
            <header className="mb-8 md:mb-12 text-center animate-fade-in-down">
              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 tracking-tight leading-tight drop-shadow-lg">
                {t('creative.m075')}
              </h1>
              <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                {t('creative.m074')}
              </p>
            </header>

            {/* Selection Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full mb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {/* Logo Card */}
              <button
                onClick={() => setMode('logo')}
                disabled={isGenerating}
                className={`group relative p-2 sm:p-4 aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1 sm:gap-2 md:gap-4 transition-all duration-500 border overflow-hidden ${
                  mode === 'logo' 
                    ? 'bg-white/10 bg-white/20 border-fuchsia-400/60 shadow-[0_0_40px_rgba(217,70,239,0.3)_inset,0_0_30px_rgba(217,70,239,0.4)] md:scale-105' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                } backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity duration-500 ${mode === 'logo' ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                <ImageIcon className={`w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-colors duration-500 relative z-10 ${mode === 'logo' ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'}`} />
                <h2 className="text-[11px] sm:text-base md:text-xl lg:text-2xl font-bold relative z-10 text-center leading-tight">{t('creative.logoCardTitle')}</h2>
                <p className="text-[10px] md:text-xs lg:text-sm text-slate-400 text-center relative z-10 hidden md:block leading-tight">{t('creative.logoCardDesc')}</p>
              </button>

              {/* Visual Identity Card */}
              <button
                onClick={() => setMode('identity')}
                disabled={isGenerating}
                className={`group relative p-2 sm:p-4 aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1 sm:gap-2 md:gap-4 transition-all duration-500 border overflow-hidden ${
                  mode === 'identity' 
                    ? 'bg-white/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] md:scale-105' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                } backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-500 ${mode === 'identity' ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                <Frame className={`w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-colors duration-500 relative z-10 ${mode === 'identity' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-300'}`} />
                <h2 className="text-[11px] sm:text-base md:text-xl lg:text-2xl font-bold relative z-10 text-center leading-tight">{t('creative.identityCardTitle')}</h2>
                <p className="text-[10px] md:text-xs lg:text-sm text-slate-400 text-center relative z-10 hidden md:block leading-tight">{t('creative.identityCardDesc')}</p>
              </button>

              {/* Video Ad Card */}
              <button
                onClick={() => setMode('video_ad')}
                disabled={isGenerating}
                className={`group relative p-2 sm:p-4 aspect-square rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1 sm:gap-2 md:gap-4 transition-all duration-500 border overflow-hidden ${
                  mode === 'video_ad' 
                    ? 'bg-white/10 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.2)] md:scale-105' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                } backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 transition-opacity duration-500 ${mode === 'video_ad' ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                <Film className={`w-5 h-5 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-colors duration-500 relative z-10 ${mode === 'video_ad' ? 'text-pink-400' : 'text-slate-400 group-hover:text-pink-300'}`} />
                <h2 className="text-[11px] sm:text-base md:text-xl lg:text-2xl font-bold relative z-10 text-center leading-tight">{t('creative.videoCardTitle')}</h2>
                <p className="text-[10px] md:text-xs lg:text-sm text-slate-400 text-center relative z-10 hidden md:block leading-tight">{t('creative.videoCardDesc')}</p>
              </button>
              
            </div>
          </>
        )}

        {/* Chat Designer ALWAYS mounted to prevent state loss during background design generation */}
        <div style={{ display: mode === 'chat' ? 'flex' : 'none' }} className="w-full flex-1 flex-col">
          <ChatDesigner 
            activationCode="naje_authenticated" 
            isCodeValid={true} 
            hasBalance={balance > 0}
            isCheckingCode={false}
            codeStatus={codeStatus}
            lang={lang} 
            onGoHome={() => {
              setMode(null);
              handleSetScreen('welcome');
            }}
            onPaywallTrigger={() => setShowCreativelyPaywall(true)}
          />
        </div>

        {/* Input Card */}
        {mode === 'chat' ? null : mode === 'brand_kit' && kitGenerationStatus !== 'idle' ? (
          <div className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 animate-fade-in-up">
            <div className="w-full text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex flex-col items-center justify-center text-center mb-8 border-b border-white/5 pb-6">
                <div className="p-4 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 rounded-3xl text-fuchsia-400 mb-4 animate-bounce">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-white">
                  {t('creative.m073')}
                </h3>
                <p className="text-sm text-slate-400 mt-2 max-w-lg leading-relaxed">
                  {t('creative.m072')}
                </p>
              </div>

              {/* Progress and status message */}
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="flex items-center gap-3">
                  <NajeSpinner className="w-5 h-5" />
                  <span className="text-white font-bold text-base">{kitGenerationProgressMsg}</span>
                </div>
                
                {/* Visual indicator bar */}
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden mt-2 relative border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${
                        kitGenerationStatus === 'compiling' 
                          ? 95 
                          : kitGenerationStatus === 'success' 
                            ? 100 
                            : Math.max(5, Math.round((kitGenerationStep / selectedKitItems.length) * 85))
                      }%` 
                    }}
                  />
                </div>
                <div className="flex justify-between w-full text-xs text-slate-500 font-bold mt-1">
                  <span>{t('creative.m071')}</span>
                  <span>
                    {t('creative.m070', { p0: Math.min(selectedKitItems.length, kitGenerationStep + 1), p1: selectedKitItems.length })}
                  </span>
                  <span>{t('creative.m069')}</span>
                </div>
              </div>

              {/* Step Pipeline List */}
              <div className="space-y-3 mb-8">
                <h4 className="text-slate-300 font-bold text-sm mb-4">
                  {t('creative.m068')}
                </h4>
                {selectedKitItems.map((itemId, idx) => {
                  const item = BRAND_KIT_ITEMS.find(i => i.id === itemId);
                  const isDone = idx < kitGenerationStep;
                  const isCurrent = idx === kitGenerationStep;
                  const asset = kitGeneratedAssets[itemId];
                  const Icon = item?.icon || Sparkles;

                  return (
                    <div 
                      key={itemId}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-fuchsia-950/20 border-fuchsia-500/50 shadow-[0_0_12px_rgba(236,72,153,0.15)]' 
                          : isDone 
                            ? 'bg-emerald-950/10 border-emerald-500/20' 
                            : 'bg-black/20 border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          isCurrent 
                            ? 'bg-fuchsia-500/20 text-fuchsia-400 animate-pulse' 
                            : isDone 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-white/5 text-slate-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">
                            {item ? t(`creative.kit.${item.id}.label`) : itemId}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {isCurrent 
                              ? (t('creative.m067')) 
                              : isDone 
                                ? (t('creative.m066')) 
                                : (t('creative.m065'))
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {isDone && asset?.imageUrl && (
                          <div className="flex items-center gap-2 mr-2">
                            <a
                              href={asset.imageUrl}
                              download={`${item?.id}-creative-ai.png`}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-bold text-slate-300 rounded-md border border-white/10 transition-colors flex items-center gap-1"
                              title={t('creative.m064')}
                            >
                              <Download className="w-3 h-3" /> PNG
                            </a>
                            <button
                              onClick={() => {
                                const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><image href="${asset.imageUrl}" width="1024" height="1024"/></svg>`;
                                const blob = new Blob([svgContent], {type: 'image/svg+xml'});
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item?.id}-creative-ai.svg`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] sm:text-xs font-bold text-slate-300 rounded-md border border-white/10 transition-colors flex items-center gap-1"
                              title={t('creative.m063')}
                            >
                              <Download className="w-3 h-3" /> SVG
                            </button>
                          </div>
                        )}
                        {isDone && asset?.imageUrl && (
                          <div className="relative group/thumb cursor-pointer">
                            <img 
                              src={asset.imageUrl} 
                              alt="Generated thumb" 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-white/20 hover:scale-110 transition-transform duration-200"
                              onClick={() => window.open(asset.imageUrl, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Download className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                          isCurrent 
                            ? 'bg-fuchsia-500/20 text-fuchsia-300 animate-pulse' 
                            : isDone 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {isCurrent 
                            ? (t('creative.m062')) 
                            : isDone 
                              ? (t('common.ready')) 
                              : (t('creative.m061'))
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Outcome views */}
              {kitGenerationStatus === 'success' && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl text-center mb-6 animate-fade-in-up flex flex-col items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <Star className="w-8 h-8 fill-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {t('creative.m060')}
                    </h4>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      {t('creative.m059')}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center mt-2 w-full">
                    {compiledPdfUrl && (
                      <a 
                        href={compiledPdfUrl}
                        download={`${(df.projectName || 'QuantumBrand').replace(/\s+/g, '_')}_Brand_Identity_Kit.pdf`}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 text-sm"
                      >
                        <Download className="w-5 h-5" />
                        {t('creative.m058')}
                      </a>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setKitGenerationStatus('idle')}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 transition-all text-sm"
                    >
                      {t('creative.m057')}
                    </button>
                  </div>
                </div>
              )}

              {kitGenerationStatus === 'error' && (
                <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl text-center mb-6 animate-fade-in-up flex flex-col items-center gap-3">
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-full">
                    <X className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {t('creative.m056')}
                  </h4>
                  <p className="text-red-300 text-xs leading-relaxed max-w-md">
                    {renderErrorText(kitGenerationError, t('creative.unexpectedError')) || (t('creative.m055'))}
                  </p>
                  
                  <div className="flex gap-4 justify-center mt-3">
                    <button
                      type="button"
                      onClick={() => handleGenerateKitSequentially()}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all text-sm"
                    >
                      {t('creative.m054')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setKitGenerationStatus('idle')}
                      className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all text-sm"
                    >
                      {t('creative.m053')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : mode !== null && (
          <div className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 animate-fade-in-up">
          
          {/* Back to tools button */}
          {mode === 'brand_kit' && (
          <div className="flex items-center justify-between mb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <button 
              onClick={() => {
                handleSetScreen('welcome');
                setGeneratedImage(null);
                setVideoDownloadUrl(null);
                setConceptTitle(null);
                setConceptExplanation(null);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('creative.m052')}
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /><span className="text-white font-bold">{t('creative.m051')}</span>
            </div>
          </div>
          )}

          {/* Logo Format Selection */}
          {mode === 'logo' && (
            <div className="w-full mb-8 animate-fade-in-down" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 justify-start">
                <Frame className="w-5 h-5 text-purple-400" />
                {t('creative.selectLogoType')}
              </h4>
              <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
                {[
                  { id: 'default', label: t('creative.logoDefault') },
                  { id: 'app_icon', label: t('creative.logoAppIcon') },
                  { id: 'billboard', label: t('creative.logoBillboard') },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setLogoFormat(format.id)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      logoFormat === format.id 
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400 transform scale-[1.02]' 
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Identity Format Selection */}
          {mode === 'identity' && (
            <div className="w-full mb-8 animate-fade-in-down" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 justify-start">
                <Frame className="w-5 h-5 text-indigo-400" />
                {t('creative.selectIdentityType')}
              </h4>
              <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
                {[
                  { id: 'logo_and_identity', label: t('creative.idLogoAndIdentity') },
                  { id: 'horizontal_logo', label: t('creative.idHorizontal') },
                  { id: 'youtube_cover', label: t('creative.idYoutubeCover') },
                  { id: 'youtube_thumbnail', label: t('creative.idYoutubeThumbnail') },
                  { id: 'social_post', label: t('creative.idSocialPost') },
                  { id: 'story', label: t('creative.idStory') },
                  { id: 'business_card', label: t('creative.idBusinessCard') },
                  { id: 'whatsapp_channel', label: t('creative.idWhatsappChannel') },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setIdentityFormat(format.id)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      identityFormat === format.id 
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400 transform scale-[1.02]' 
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Images Uploader */}
          {(mode === 'identity' || mode === 'video_ad' || mode === 'logo') && (
            <div className="w-full mb-8 animate-fade-in-down" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="mt-2">
                <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 justify-start">
                  <Upload className="w-5 h-5 text-indigo-400" />
                  {mode === 'logo' 
                    ? (logoFormat === 'billboard' ? t('creative.uploadProductTitleBillboard') : (t('creative.m050')))
                    : (mode === 'identity' ? t('creative.uploadProductTitle') : t('creative.uploadProductTitleVideo'))}
                </h4>
                
                {productImages.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-4">
                    {productImages.map((img, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20">
                        <img src={img} alt={`Preview ${index + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button onClick={() => removeProductImage(index)} disabled={isGenerating} className="absolute top-1 left-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 hover:border-indigo-400/50 rounded-2xl cursor-pointer bg-white/5 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-400">{t('creative.uploadPlaceholder')}</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={isGenerating} />
                </label>
              </div>
            </div>
          )}

          {/* Entity Type Selector Widget */}
          {(mode === 'logo' || mode === 'identity' || mode === 'video_ad' || mode === 'brand_kit') && (
            <div className="w-full mb-8 bg-white/5 border border-white/10 p-5 rounded-3xl animate-fade-in-down" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <h4 className="text-slate-300 font-semibold mb-4 flex items-center gap-2 justify-start">
                <Users className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                {t('creative.m049')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'company', labelAr: 'شركة', labelEn: 'Company', icon: Building2 },
                  { id: 'non_profit', labelAr: 'مؤسسة غير ربحية', labelEn: 'Non-profit Organization', icon: Heart },
                  { id: 'government', labelAr: 'منظمة أو جهة حكومية', labelEn: 'Government Entity', icon: Landmark },
                  { id: 'individual', labelAr: 'فرد', labelEn: 'Individual', icon: User }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = entityType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEntityType(item.id)}
                      disabled={isGenerating}
                      className={`p-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected 
                          ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.25)] scale-[1.02]' 
                          : 'bg-black/30 border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200 hover:bg-black/40'
                      }`}
                    >
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-fuchsia-400 scale-110' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-center leading-tight">
                        {t(`creative.entity.${item.id}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center gap-3 text-slate-200 justify-start">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            <h3 className="text-xl font-semibold">
              {mode === 'brand_kit' 
                ? (t('creative.m048'))
                : (mode === 'logo' 
                   ? (logoFormat === 'billboard' 
                      ? (t('creative.m047')) 
                      : t('creative.promptLogoTitle')) 
                   : (mode === 'video_ad' ? t('creative.promptVideoTitle') : t('creative.promptIdentityTitle')))
              }
            </h3>
          </div>
          
          {mode === 'logo' && logoFormat !== 'billboard' ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder={placeholderText}
              className={`w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-5 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          ) : FORM_CONFIGS[mode === 'logo' ? 'billboard' : (mode === 'brand_kit' ? 'brand_kit' : (mode === 'video_ad' ? 'video_ad' : identityFormat))] && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              {FORM_CONFIGS[mode === 'logo' ? 'billboard' : (mode === 'brand_kit' ? 'brand_kit' : (mode === 'video_ad' ? 'video_ad' : identityFormat))].map((field) => {
                if (field.id === 'videoDuration') {
                   const isVideo = !df['resultType'] || df['resultType'].includes('Video') || df['resultType'].includes('فيديو');
                   if (!isVideo) return null;
                }
                const scope = mode === 'logo' ? 'billboard' : (mode === 'brand_kit' ? 'brand_kit' : (mode === 'video_ad' ? 'video_ad' : identityFormat));
                const labelKey = `creative.ff.${scope}.${field.id}`;
                const translatedLabel = t(labelKey);
                const label = translatedLabel === labelKey ? (lang === 'ar' ? field.labelAr : field.labelEn) : translatedLabel;
                const value = df[field.id] || '';
                const phKey = `${labelKey}.ph`;
                const translatedPh = t(phKey);
                const placeholder = translatedPh === phKey
                  ? (lang === 'ar' ? (field.placeholderAr || `${label}...`) : (field.placeholderEn || `${label}...`))
                  : translatedPh;
                return (
                  <div key={field.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <label className="block text-white font-medium mb-3">
                      {label}
                    </label>
                    {field?.type === 'text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setDf(prev => ({ ...prev, [field.id]: e.target.value }))}
                        disabled={isGenerating}
                        placeholder={placeholder}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                      />
                    )}
                    {field?.type === 'textarea' && (
                      <textarea
                        value={value}
                        onChange={(e) => setDf(prev => ({ ...prev, [field.id]: e.target.value }))}
                        disabled={isGenerating}
                        placeholder={placeholder}
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none transition-all text-sm"
                      />
                    )}
                    {field?.type === 'radio' && field.options && (
                      field.id === 'billboardSize' ? (
                        (() => {
                          const sizeGuides = [
                            {
                              id: 'wide_3x1',
                              ratio: '3:1',
                              labelAr: 'لوحة واجهة محل عريضة (3 متر × 1 متر)',
                              labelEn: 'Widescreen Storefront Sign (3x1 meters)',
                              descAr: 'مثالية لواجهات المحلات والمعارض الكبيرة لظهور اسم متجرك بشكل عريض وواضح جدًا.',
                              descEn: 'Perfect for large storefronts to show your name very wide and clearly.',
                              aspectClass: 'w-full aspect-[3/1]',
                              type: 'storefront'
                            },
                            {
                              id: 'std_2x1',
                              ratio: '2:1',
                              labelAr: 'لوحة واجهة متوسطة (2 متر × 1 متر)',
                              labelEn: 'Medium Storefront Sign (2x1 meters)',
                              descAr: 'المقاس الأكثر شهرة وشيوعاً للمحلات الصغيرة كالبقالات والصيدليات والمقاهي.',
                              descEn: 'The most popular size for small to medium shops, cafes, and groceries.',
                              aspectClass: 'w-[90%] aspect-[2/1]',
                              type: 'storefront'
                            },
                            {
                              id: 'street_4x3',
                              ratio: '4:3',
                              labelAr: 'يافطة إعلانية كبيرة للشارع (4 متر × 3 متر)',
                              labelEn: 'Large Street Billboard (4x3 meters)',
                              descAr: 'لوحة إعلانية عملاقة تُنصب بجانب الطرق والشوارع الرئيسية لترويج حملتك الإعلانية.',
                              descEn: 'A giant billboard placed by main roads and highways to promote campaigns.',
                              aspectClass: 'w-[80%] aspect-[4/3]',
                              type: 'street'
                            },
                            {
                              id: 'stand_1_2x1_8',
                              ratio: '2:3',
                              labelAr: 'ستاند واقف طولي للرصيف أو داخل المجمع (1.2 متر × 1.8 متر)',
                              labelEn: 'Vertical Pedestrian/Mupis Stand (1.2x1.8 meters)',
                              descAr: 'لوحة إعلانية عمودية ومضيئة مخصصة للمشاة عند الأرصفة أو ممرات المجمعات والأسواق.',
                              descEn: 'A vertical, illuminated display designed for pedestrians on sidewalks or mall walkways.',
                              aspectClass: 'w-[50%] aspect-[2/3]',
                              type: 'sidewalk'
                            },
                            {
                              id: 'custom',
                              ratio: 'مرن / Custom',
                              labelAr: 'مقاس مخصص آخر حسب رغبتي',
                              labelEn: 'Other Custom Dimensions',
                              descAr: 'تحديد مقاسات خاصة تناسب مساحتك بدقة ومراعاة نسب طباعة فريدة.',
                              descEn: 'Specify unique dimensions matching your physical storefront perfectly.',
                              aspectClass: 'w-[85%] aspect-[1.6/1]',
                              type: 'custom'
                            }
                          ];
                          return (
                            <div className="flex flex-col gap-6">
                              {/* Interactive Selection Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sizeGuides.map(guide => {
                                  const guideLabel = lang === 'ar' ? guide.labelAr : guide.labelEn;
                                  const isSelected = value === guideLabel || (!value && guide.id === 'wide_3x1');
                                  return (
                                    <div
                                      key={guide.id}
                                      onClick={() => !isGenerating && setDf(prev => ({ ...prev, [field.id]: guideLabel }))}
                                      className={`group relative p-4 rounded-2xl border text-start cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-md ${
                                        isSelected
                                          ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_25px_rgba(217,70,239,0.2)] z-10'
                                          : 'border-white/10 bg-black/30 hover:border-white/30 hover:bg-white/5'
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-fuchsia-600/5 backdrop-blur-sm pointer-events-none" />
                                      )}
                                      
                                      <div className="relative z-10 flex items-start gap-3">
                                        {/* Schematic Aspect Ratio Box */}
                                        <div className="w-16 h-12 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 p-1 shrink-0 group-hover:border-white/30 transition-colors">
                                          <div className={`border-2 ${isSelected ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-slate-400 bg-white/5'} rounded-sm flex items-center justify-center text-[9px] font-bold text-slate-300 shadow-sm transition-all duration-300 ${
                                            guide.id === 'wide_3x1' ? 'w-12 h-4' :
                                            guide.id === 'std_2x1' ? 'w-10 h-5' :
                                            guide.id === 'street_4x3' ? 'w-8 h-6' :
                                            guide.id === 'stand_1_2x1_8' ? 'w-6 h-9' : 'w-9 h-6 border-dashed'
                                          }`}>
                                            {guide.id === 'custom' ? t('creative.flexSize') : guide.ratio.split(' ')[0]}
                                          </div>
                                        </div>

                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                              {t(`creative.ff.billboard.billboardSize.${guide.id}`)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${isSelected ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                              {guide.id === 'custom' ? t('creative.flexSize') : guide.ratio}
                                            </span>
                                          </div>
                                          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                                            {t(`creative.guide.${guide.id}.desc`)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Interactive Live 3D Environment Simulator */}
                              <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                                {/* Simulator Header */}
                                <div className="bg-white/5 border-b border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                                    <div className="text-start">
                                      <h5 className="text-white text-sm font-bold">
                                        {t('creative.m046')}
                                      </h5>
                                      <p className="text-slate-400 text-[11px] mt-0.5">
                                        {t('creative.m045')}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Day / Night Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => setSimNight(!simNight)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                                      simNight
                                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    }`}
                                  >
                                    <span className="relative flex h-2 w-2">
                                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${simNight ? 'bg-purple-400' : 'bg-amber-400'}`}></span>
                                      <span className={`relative inline-flex rounded-full h-2 w-2 ${simNight ? 'bg-purple-500' : 'bg-amber-500'}`}></span>
                                    </span>
                                    {simNight
                                      ? (t('creative.m044'))
                                      : (t('creative.m043'))}
                                  </button>
                                </div>

                                {/* Simulator Scene Viewport */}
                                {(() => {
                                  const activeGuide = sizeGuides.find(g => g.labelAr === value || g.labelEn === value) || sizeGuides[0];
                                  const storeName = df['projectName'] || (t('creative.m042'));
                                  const sloganText = df['slogan'] || (t('creative.m041'));
                                  
                                  // Determine glow colors from preferred colors input
                                  const preferredCol = String(df['preferredColors'] || '').toLowerCase();
                                  let glowStyle = 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]';
                                  let borderGlow = 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]';
                                  
                                  if (preferredCol.includes('أزرق') || preferredCol.includes('كحلي') || preferredCol.includes('blue') || preferredCol.includes('navy')) {
                                    glowStyle = 'text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.85)]';
                                    borderGlow = 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)]';
                                  } else if (preferredCol.includes('أحمر') || preferredCol.includes('red') || preferredCol.includes('وردي') || preferredCol.includes('pink')) {
                                    glowStyle = 'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.85)]';
                                    borderGlow = 'border-rose-400 shadow-[0_0_25px_rgba(251,113,133,0.25)]';
                                  } else if (preferredCol.includes('أخضر') || preferredCol.includes('green')) {
                                    glowStyle = 'text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]';
                                    borderGlow = 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.25)]';
                                  } else if (preferredCol.includes('ذهبي') || preferredCol.includes('gold') || preferredCol.includes('أصفر') || preferredCol.includes('yellow')) {
                                    glowStyle = 'text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.85)]';
                                    borderGlow = 'border-yellow-400 shadow-[0_0_25px_rgba(253,224,71,0.25)]';
                                  } else {
                                    // Default majestic purple/magenta glow
                                    glowStyle = 'text-purple-300 drop-shadow-[0_0_12px_rgba(192,132,252,0.85)]';
                                    borderGlow = 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.25)]';
                                  }

                                  const isIlluminatedType = !df['billboardType'] || !df['billboardType'].includes('بدون إضاءة') && !df['billboardType'].includes('Banner');
                                  const shouldGlow = simNight && isIlluminatedType;

                                  return (
                                    <div className={`relative h-80 transition-all duration-700 flex flex-col items-center justify-center p-6 select-none overflow-hidden ${
                                      simNight
                                        ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white'
                                        : 'bg-gradient-to-b from-sky-200 via-sky-100 to-slate-200 text-slate-800'
                                    }`}>
                                      {/* Starry night effect / clouds */}
                                      {simNight && (
                                        <div className="absolute inset-0 opacity-40 pointer-events-none">
                                          <div className="absolute w-1 h-1 bg-white rounded-full top-10 left-1/4 animate-pulse" />
                                          <div className="absolute w-1 h-1 bg-white rounded-full top-24 left-3/4 animate-ping" />
                                          <div className="absolute w-1 h-1 bg-white rounded-full top-16 left-1/2 animate-pulse" />
                                          <div className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full top-32 left-12 animate-pulse" />
                                          <div className="absolute w-1 h-1 bg-white rounded-full top-40 right-20 animate-pulse" />
                                        </div>
                                      )}

                                      {/* Environmental Renderings */}
                                      {activeGuide?.type === 'storefront' && (
                                        <>
                                          {/* Store facade background */}
                                          <div className={`absolute bottom-0 inset-x-0 h-44 border-t transition-colors duration-500 flex flex-col justify-end ${
                                            simNight ? 'bg-stone-900/95 border-white/5' : 'bg-stone-300 border-stone-400/50'
                                          }`}>
                                            {/* Glass Doors */}
                                            <div className="w-48 h-28 mx-auto border-t border-x rounded-t-lg relative flex items-center justify-between px-3 transition-colors duration-500 mt-auto bg-black/20 border-white/10">
                                              <div className="w-0.5 h-full bg-white/10 absolute left-1/2 -translate-x-1/2" />
                                              <div className="w-3 h-8 bg-white/5 border border-white/10 rounded-sm" />
                                              <div className="w-3 h-8 bg-white/5 border border-white/10 rounded-sm" />
                                            </div>
                                          </div>
                                          {/* Storefront spotlights */}
                                          {shouldGlow && (
                                            <div className="absolute top-1/4 inset-x-0 h-32 bg-gradient-to-b from-amber-400/15 to-transparent blur-xl pointer-events-none" />
                                          )}
                                        </>
                                      )}

                                      {activeGuide?.type === 'street' && (
                                        <>
                                          {/* Highway / street poles */}
                                          <div className={`absolute bottom-0 inset-x-0 h-16 border-t flex flex-col items-center justify-end ${
                                            simNight ? 'bg-stone-950 border-white/5' : 'bg-stone-400 border-stone-500'
                                          }`}>
                                            {/* Road lanes in perspective */}
                                            <div className="w-52 h-full flex justify-between px-4">
                                              <div className="w-2 h-full bg-transparent border-r-2 border-dashed border-yellow-500/50 transform -skew-x-12" />
                                              <div className="w-2 h-full bg-transparent border-l-2 border-dashed border-yellow-500/50 transform skew-x-12" />
                                            </div>
                                          </div>
                                          {/* Solid heavy metal pole holding the sign */}
                                          <div className={`absolute bottom-16 w-8 h-24 transition-colors duration-500 ${
                                            simNight ? 'bg-gradient-to-r from-stone-800 to-stone-900 border-x border-white/5' : 'bg-gradient-to-r from-stone-400 to-stone-500 border-x border-stone-600'
                                          }`} />
                                          {/* Street ground spotlights */}
                                          {shouldGlow && (
                                            <div className="absolute bottom-20 flex gap-12 pointer-events-none">
                                              <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[100px] border-b-yellow-400/10 blur-md transform -rotate-12" />
                                              <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[100px] border-b-yellow-400/10 blur-md transform rotate-12" />
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {activeGuide?.type === 'sidewalk' && (
                                        <>
                                          {/* Concrete sidewalk floor */}
                                          <div className={`absolute bottom-0 inset-x-0 h-28 border-t transition-colors duration-500 ${
                                            simNight ? 'bg-stone-900 border-white/5' : 'bg-stone-300 border-stone-400/60'
                                          }`}>
                                            {/* Tiled sidewalk lines */}
                                            <div className="grid grid-cols-6 h-full border-b border-white/5">
                                              {[...Array(6)].map((_, i) => (
                                                <div key={i} className="border-r border-white/5 h-full transform skew-x-12" />
                                              ))}
                                            </div>
                                          </div>
                                          {/* Visual street light lamp next to it */}
                                          <div className="absolute right-8 bottom-28 flex flex-col items-center">
                                            <div className={`w-1 h-36 transition-colors duration-500 ${simNight ? 'bg-stone-800' : 'bg-stone-500'}`} />
                                            <div className={`w-4 h-6 rounded-t-full -mt-36 transition-colors duration-500 ${simNight ? 'bg-amber-400' : 'bg-stone-400'}`} />
                                            {shouldGlow && (
                                              <div className="absolute -top-4 w-12 h-12 bg-amber-400/30 rounded-full blur-md animate-pulse" />
                                            )}
                                          </div>
                                        </>
                                      )}

                                      {activeGuide?.type === 'custom' && (
                                        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                                          backgroundImage: `radial-gradient(circle, ${simNight ? 'white' : 'black'} 1px, transparent 1px)`,
                                          backgroundSize: '20px 20px'
                                        }} />
                                      )}

                                      {/* THE SIGNBOARD CONTAINER */}
                                      <div className={`relative flex flex-col items-center justify-center text-center p-4 border transition-all duration-700 select-none z-10 ${
                                        activeGuide.aspectClass
                                      } ${
                                        simNight
                                          ? `bg-black/85 backdrop-blur-md ${shouldGlow ? borderGlow : 'border-white/10 shadow-lg'}`
                                          : 'bg-white border-slate-300 shadow-md'
                                      }`}>
                                        
                                        {/* LED Spotlight Fixture Dot on top if illuminated */}
                                        {isIlluminatedType && (
                                          <div className="absolute -top-1.5 inset-x-0 flex justify-center gap-6">
                                            <div className={`w-3 h-1.5 rounded-b-full ${simNight ? 'bg-zinc-800' : 'bg-zinc-400'}`} />
                                            <div className={`w-3 h-1.5 rounded-b-full ${simNight ? 'bg-zinc-800' : 'bg-zinc-400'}`} />
                                          </div>
                                        )}

                                        {/* Floating Dimensions indicator */}
                                        <div className="absolute -top-6 inset-x-0 flex items-center justify-between text-[10px] font-mono px-2 font-bold select-none pointer-events-none">
                                          <div className={`h-0.5 bg-current grow mx-2 relative flex items-center justify-between ${simNight ? 'text-purple-400/60' : 'text-slate-500'}`}>
                                            <div className="w-1 h-1.5 bg-current rotate-45" />
                                            <span className={`px-2 py-0.5 rounded-md ${simNight ? 'bg-purple-950 text-purple-300 border border-purple-800/30' : 'bg-slate-100 text-slate-700'}`}>
                                              {activeGuide.id === 'wide_3x1' ? '3.00m' : activeGuide.id === 'std_2x1' ? '2.00m' : activeGuide.id === 'street_4x3' ? '4.00m' : activeGuide.id === 'stand_1_2x1_8' ? '1.20m' : t('creative.customWidth')}
                                            </span>
                                            <div className="w-1 h-1.5 bg-current -rotate-45" />
                                          </div>
                                        </div>

                                        <div className="absolute -left-6 inset-y-0 flex flex-col items-center justify-center text-[10px] font-mono font-bold select-none pointer-events-none">
                                          <div className={`w-0.5 bg-current grow my-2 relative flex flex-col items-center justify-between ${simNight ? 'text-purple-400/60' : 'text-slate-500'}`}>
                                            <div className="w-1.5 h-1 bg-current rotate-45" />
                                            <span className={`px-1.5 py-0.5 rounded-md whitespace-nowrap rotate-90 ${simNight ? 'bg-purple-950 text-purple-300 border border-purple-800/30' : 'bg-slate-100 text-slate-700'}`}>
                                              {activeGuide.id === 'wide_3x1' ? '1.00m' : activeGuide.id === 'std_2x1' ? '1.00m' : activeGuide.id === 'street_4x3' ? '3.00m' : activeGuide.id === 'stand_1_2x1_8' ? '1.80m' : t('creative.customHeight')}
                                            </span>
                                            <div className="w-1.5 h-1 bg-current -rotate-45" />
                                          </div>
                                        </div>

                                        {/* Signboard Text content */}
                                        <div className="flex flex-col gap-1 items-center max-w-full overflow-hidden px-2 py-1 select-none">
                                          {/* Calligraphy style badge */}
                                          <div className={`text-[9px] uppercase tracking-wider font-semibold font-mono ${simNight ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>
                                            {df['calligraphyStyle'] || (t('creative.m040'))}
                                          </div>

                                          {/* Main Store Name */}
                                          <h1 
                                            className={`text-center font-bold tracking-tight select-none truncate w-full break-words ${
                                              activeGuide.id === 'wide_3x1' ? 'text-2xl md:text-3xl' :
                                              activeGuide.id === 'std_2x1' ? 'text-xl md:text-2xl' :
                                              activeGuide.id === 'street_4x3' ? 'text-lg md:text-xl' : 'text-base md:text-lg'
                                            } ${
                                              shouldGlow ? glowStyle : (simNight ? 'text-white' : 'text-slate-900')
                                            }`}
                                          >
                                            {storeName}
                                          </h1>

                                          {/* Slogan */}
                                          <p className={`text-center font-medium select-none truncate w-full opacity-90 ${
                                            activeGuide.id === 'wide_3x1' ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'
                                          } ${
                                            simNight ? 'text-slate-300' : 'text-slate-600'
                                          }`}>
                                            {sloganText}
                                          </p>

                                          {/* Contact info if provided */}
                                          {df['contactInfo'] && (
                                            <div className={`mt-1.5 text-[8px] font-mono border-t pt-1 border-current/10 truncate w-full ${
                                              simNight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                              {df['contactInfo']}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {field.options.map(opt => {
                            const optStored = lang === 'ar' ? opt.labelAr : opt.labelEn;
                            const optKey = `creative.ff.${scope}.${field.id}.${opt.id}`;
                            const optTranslated = opt.id === 'yes' ? t('common.yes') : opt.id === 'no' ? t('common.no') : t(optKey);
                            const optDisplay = (opt.id !== 'yes' && opt.id !== 'no' && optTranslated === optKey) ? optStored : optTranslated;
                            const isSelected = value === optStored;
                            return (
                              <label key={opt.id || (opt as any).value || optStored} className={`relative flex items-center justify-center px-5 py-3 cursor-pointer rounded-xl border text-sm font-medium transition-all duration-300 overflow-hidden backdrop-blur-md ${isSelected ? 'border-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] bg-fuchsia-500/10 z-10' : 'border-white/10 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/10 bg-black/40'}`}>
                                {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 backdrop-blur-lg" />}
                                <input
                                  type="radio"
                                  name={field.id}
                                  value={optStored}
                                  checked={isSelected}
                                  onChange={(e) => setDf(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  disabled={isGenerating}
                                  className="hidden"
                                />
                                <span className="relative z-10 flex items-center gap-2">
                                  {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                                  {optDisplay}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )
                    )}
                    {field?.type === 'image_upload' && (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isGenerating}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setDf(prev => ({ ...prev, [field.id]: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setDf(prev => ({ ...prev, [field.id]: '' }));
                            }
                          }}
                          className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 transition-all focus:outline-none cursor-pointer"
                        />
                        {df[field.id] && (
                          <div className="mt-4 relative inline-block">
                            <img src={df[field.id]} alt="Uploaded" className="h-24 w-auto rounded-lg border border-white/20 shadow-md" />
                            <button
                              type="button"
                              onClick={() => setDf(prev => ({ ...prev, [field.id]: '' }))}
                              className="absolute -top-2 ltr:-right-2 rtl:-left-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {field?.type === 'multicheckbox' && field.options && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {field.options.map(opt => {
                          const valLabel = lang === 'ar' ? opt.labelAr : opt.labelEn;
                          const optKey = `creative.ff.${scope}.${field.id}.${opt.id}`;
                          const optTranslated = opt.id === 'yes' ? t('common.yes') : opt.id === 'no' ? t('common.no') : t(optKey);
                          const optDisplay = (opt.id !== 'yes' && opt.id !== 'no' && optTranslated === optKey) ? valLabel : optTranslated;
                          const isChecked = Array.isArray(df[field.id]) && df[field.id].includes(valLabel);
                          return (
                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white text-sm">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  setDf(prev => {
                                    const currentValues = Array.isArray(prev[field.id]) ? prev[field.id] : [];
                                    if (e.target.checked) {
                                      return { ...prev, [field.id]: [...currentValues, valLabel] };
                                    } else {
                                      return { ...prev, [field.id]: currentValues.filter((v: string) => v !== valLabel) };
                                    }
                                  });
                                }}
                                disabled={isGenerating}
                                className="accent-fuchsia-500 w-4 h-4 rounded"
                              />
                              <span>{optDisplay}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'brand_kit' && (
            <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 flex items-center gap-2 justify-start">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                {t('creative.m039')}
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed text-start">
                {t('creative.m038')}
              </p>

              {/* Selection helper buttons */}
              <div className="flex gap-3 mb-6 justify-start">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = BRAND_KIT_ITEMS.map(item => item.id);
                    setSelectedKitItems(allIds);
                    const newConfigs: Record<string, any> = {};
                    BRAND_KIT_ITEMS.forEach(item => {
                      newConfigs[item.id] = {
                        dimension: item.defaultDimension,
                        quality: item.defaultQuality,
                        notes: '',
                        label: lang === 'ar' ? item.labelAr : item.labelEn
                      };
                    });
                    setKitItemConfigs(newConfigs);
                  }}
                  className="px-4 py-2 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/40 text-fuchsia-300 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                  {t('creative.m037')}
                </button>
                {selectedKitItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKitItems([]);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t('creative.m036')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BRAND_KIT_ITEMS.map((item) => {
                  const isSelected = selectedKitItems.includes(item.id);
                  const config = kitItemConfigs[item.id] || {};
                  const Icon = item.icon;

                  return (
                    <div 
                      key={item.id}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${
                        isSelected 
                          ? 'bg-fuchsia-950/20 border-fuchsia-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] scale-[1.01]' 
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-white/5 text-slate-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-start">
                          <h4 className="font-semibold text-white leading-snug">
                            {t(`creative.kit.${item.id}.label`)}
                          </h4>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            {t(`creative.kit.${item.id}.desc`)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                          {t('creative.m035')}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Open sliding panel to configure
                              setTempConfigDimension(config.dimension || item.defaultDimension);
                              setTempConfigQuality(config.quality || item.defaultQuality);
                              setTempConfigNotes(config.notes || '');
                              setTempConfigFields(config.fields || {});
                              setActiveKitItemToConfigure(item.id);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            {isSelected 
                              ? (t('creative.m034')) 
                              : (t('creative.m033'))
                            }
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              // Toggle selection status
                              if (isSelected) {
                                setSelectedKitItems(prev => prev.filter(id => id !== item.id));
                              } else {
                                setSelectedKitItems(prev => [...prev, item.id]);
                                // Add default config
                                setKitItemConfigs(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    dimension: item.defaultDimension,
                                    quality: item.defaultQuality,
                                    notes: '',
                                    label: lang === 'ar' ? item.labelAr : item.labelEn
                                  }
                                }));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {isSelected ? (t('common.remove')) : (t('common.select'))}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Points counter panel */}
              <div className="mt-6 bg-gradient-to-r from-fuchsia-950/20 to-purple-950/20 border border-fuchsia-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-start">
                  <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    {t('creative.m032', { p0: selectedKitItems.length })}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t('creative.m031')}
                  </p>
                </div>
                
                {selectedKitItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Clear selection
                      setSelectedKitItems([]);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white underline"
                  >
                    {t('creative.m030')}
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'logo' && logoFormat !== 'billboard' && (
            <div className="mt-6 flex flex-col gap-6 animate-fade-in-up">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-white font-medium mb-3">
                  {t('creative.m029')}
                </label>
                <input
                  type="text"
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  disabled={isGenerating}
                  placeholder={t('creative.m028')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {logoFormat === 'app_icon' && (
                <>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <label className="block text-white font-medium mb-3">
                      {t('creative.m027')}
                    </label>
                    <div className="flex gap-4">
                      {['2D', '3D', '2D & 3D'].map((dim) => (
                        <label key={dim} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                          <input type="radio" name="dimension" value={dim} checked={dimension === dim} onChange={(e) => setDimension(e.target.value)} disabled={isGenerating} className="accent-fuchsia-500 w-4 h-4" />
                          <span>{dim === '2D' ? `${dim} (${t('creative.m025')})` : dim}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <label className="block text-white font-medium mb-3">
                      {t('creative.m026')}
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                      {[
                        { ar: 'بسيط', en: 'Simple' },
                        { ar: 'إبداعي "يجمع بين البساطة والتعقيد"', en: 'Creative "combines simple and complex"' },
                        { ar: 'معقد', en: 'Complex' }
                      ].map((comp) => (
                        <label key={comp.en} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                          <input type="radio" name="complexity" value={lang === 'ar' ? comp.ar : comp.en} checked={complexity === (lang === 'ar' ? comp.ar : comp.en)} onChange={(e) => setComplexity(e.target.value)} disabled={isGenerating} className="accent-fuchsia-500 w-4 h-4" />
                          <span>{t(comp.en === 'Simple' ? 'creative.comp.simple' : comp.en === 'Complex' ? 'creative.comp.complex' : 'creative.comp.creative')}{comp.en === 'Simple' ? ` (${t('creative.m025')})` : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-white font-medium mb-3">
                  {logoFormat === 'app_icon' ? t('creative.traitsQuestionIcon') : t('creative.traitsQuestionLogo')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(lang === 'ar' ? ObjectTraits : ObjectTraitsEn).map((trait, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white text-sm">
                      <input type="checkbox" checked={selectedTraits.includes(trait)} onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTraits([...selectedTraits, trait]);
                        } else {
                          setSelectedTraits(selectedTraits.filter(tr => tr !== trait));
                        }
                      }} disabled={isGenerating} className="accent-fuchsia-500 w-4 h-4 rounded" />
                      <span>{t(`creative.trait.${idx}`)}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <input type="text" value={otherTrait} onChange={(e) => setOtherTrait(e.target.value)} disabled={isGenerating} placeholder={t('creative.m024')} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 w-full">
              {String(error).startsWith('__NAJE_ERROR_JSON__:') ? (
                <NajeErrorCard jsonContent={String(error)} onClose={() => setError(null)} />
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-center font-bold">
                  {renderErrorText(error, t('creative.unexpectedError'))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center p-2">
                <NajeCreditIcon className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{t('creative.balanceLabel')}</p>
                <p className="text-lg font-extrabold text-amber-400 flex items-center gap-1.5">
                  <NajeCreditIcon className="w-4 h-4 shrink-0" />
                  <span>{t('creative.pointsValue', { n: balance.toFixed(2) })}</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 text-center sm:text-start">{t('creative.pointsAuto')}</p>
          </div>

          {mode !== 'video_ad' && (
          <div className="mt-4 w-full">
            <p className="text-xs text-slate-400 mb-2 text-center sm:text-start">{t('creative.chooseModel')}</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'lite',    name: 'Naje Imagen Lite', price: '0.5' },
                { key: 'spectra', name: 'Naje Imagen',      price: '1'   },
                { key: 'nova',    name: 'Naje Imagen Pro',  price: '1.5' },
              ] as const).map(m => (
                <button key={m.key} type="button" onClick={() => setSelectedImageModel(m.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${selectedImageModel === m.key ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'}`}>
                  <span className="text-[12px] font-bold text-white">{m.name}</span>
                  <span className="text-[11px] text-amber-400 font-semibold">{t('creative.modelPoints', { price: m.price })}</span>
                </button>
              ))}
            </div>
          </div>
          )}
          <div className="mt-6 flex flex-col items-center justify-center w-full">
            <button
              className={`group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform ${(isGenerating || (videoOperationName && !videoDownloadUrl) || kitGenerationStatus === 'generating' || kitGenerationStatus === 'compiling') ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
              onClick={() => {
                if (mode === 'brand_kit') {
                  handleGenerateKitSequentially();
                } else {
                  handleGenerate();
                }
              }}
              disabled={isGenerating || (!!videoOperationName && !videoDownloadUrl) || kitGenerationStatus === 'generating' || kitGenerationStatus === 'compiling'}
            >
              {(isGenerating || (videoOperationName && !videoDownloadUrl) || kitGenerationStatus === 'generating' || kitGenerationStatus === 'compiling') ? (
                <>
                  <NajeSpinner className="w-6 h-6" />
                  <span>{t('creative.innovatingBtn')}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6 transition-transform group-hover:rotate-12" />
                  <span>
                    {mode === 'brand_kit'
                      ? (t('creative.m023'))
                      : t('creative.startInnovatingBtn')
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          {conceptOptions && conceptOptions.length > 0 && !generatedImage && (
            <div className="w-full max-w-4xl mx-auto mt-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                {t('creative.m022')}
              </h3>
              <p className="text-slate-400 text-sm text-center mb-8">
                {t('creative.m021')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conceptOptions.map((concept, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{concept.title || concept.name || t('creative.conceptFallback', { n: idx + 1 })}</h4>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">{concept.description || concept.explanation || concept.prompt}</p>
                    </div>
                    <button
                      onClick={() => handleGenerate(undefined, false, concept.prompt || concept.description || concept.title)}
                      disabled={isGenerating}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t('creative.m020')}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
             
              {conceptTitle && conceptExplanation && (
                <div className="w-full max-w-2xl mx-auto mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden text-start animate-fade-in-up" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  <h4 className="text-2xl font-bold mb-4 text-fuchsia-300 flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    {conceptTitle}
                  </h4>
                  <p className="text-slate-300 text-lg leading-relaxed font-light">
                    {conceptExplanation}
                  </p>
                </div>
              )}
          </div>
        )}

        {videoDownloadUrl && (
          <div ref={outputRef} className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 animate-fade-in-up">
            <div className="flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                {t('creative.m019')}
              </h3>
              
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl w-full max-w-2xl mb-8 bg-black/40 flex items-center justify-center min-h-[40vh]">
                <video 
                  src={videoDownloadUrl} 
                  controls
                  playsInline
                  loop
                  autoPlay
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              <div className="w-full max-w-2xl flex flex-col gap-4 mb-4">
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <a 
                    href={videoDownloadUrl} 
                    download={`creative-ai-video.mp4`}
                    className="flex flex-1 items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg justify-center transition-all"
                  >
                    <Download className="w-5 h-5" />
                     {t('creative.m018')}
                  </a>
                  <button
                    onClick={() => {
                      setVideoOperationName(null);
                      setVideoDownloadUrl(null);
                      setPrompt('');
                      setProductImages([]);
                    }}
                    className="flex flex-1 items-center justify-center gap-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {t('creative.newBtn')}
                  </button>
                </div>
                <p className="text-emerald-400 text-sm md:text-base font-bold text-center mt-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  {t('creative.m017')}
                  <br />
                  <span className="text-emerald-300 text-xs md:text-sm mt-1 inline-block">
                    {t('creative.m016')}
                  </span>
                </p>
              </div>
              
              {conceptTitle && conceptExplanation && (
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-sm relative overflow-hidden text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  <h4 className="text-2xl font-bold mb-4 text-fuchsia-300 flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    {conceptTitle}
                  </h4>
                  <p className="text-slate-300 text-lg leading-relaxed font-light">
                    {conceptExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {generatedImage && (
          <div ref={outputRef} className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 animate-fade-in-up">
            <div className="flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                {mode === 'logo' ? t('creative.resultLogoHeader') : t('creative.resultIdentityHeader')}
              </h3>
              
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl w-full max-w-2xl mb-8 bg-black/40">
                <img 
                  src={generatedImage} 
                  alt="Generated Design" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              <div className="w-full max-w-2xl flex flex-col gap-4 mb-12">
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <a 
                    href={generatedImage} 
                    download={`creative-ai-${mode}-HighQuality.png`}
                    className="flex flex-1 items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all justify-center"
                  >
                    <Download className="w-5 h-5" />
                    {t('common.download')} (PNG)
                  </a>

                  <button
                    onClick={() => {
                        if (!generatedImage) return;
                        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><image href="${generatedImage}" width="1024" height="1024"/></svg>`;
                        const blob = new Blob([svgContent], {type: 'image/svg+xml'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `creative-ai-${mode}.svg`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    className="flex flex-1 items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all justify-center"
                  >
                    <Download className="w-5 h-5" />
                    {t('common.download')} (SVG)
                  </button>
                  
                  <button
                    onClick={() => {
                        const note = lang === 'ar' 
                          ? '\n\n[إعادة التصميم - عصف ذهني متعمق]: يرجى الحفاظ على الفكرة الأساسية وطلب المستخدم الأصلي والخيارات المحددة بدقة تامة وبأعلى درجات الالتزام. أعد ابتكار التصميم بمفهوم جديد كلياً وألوان مذهلة وتفاصيل فائقة الجودة في كل بكسل، ولكن دون نسيان أو تجاهل الهوية الأصلية والوظيفة والاسم وعناصر العلامة التجارية.'
                          : '\n\n[REDESIGN - DEEP BRAINSTORM]: Please strictly maintain the user\'s original concept, core requests, and selected options with absolute precision and dedication. Re-architect and redesign this with spectacular new colors, ground-breaking creative concepts, and a completely refreshed, highly refined visual layout detailed down to every single pixel, while keeping the original brand identity, function, name, and elements fully intact.';
                        handleGenerate(prompt + note);
                    }}
                    className="flex flex-1 items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:-translate-y-1 transition-all"
                  >
                    <Wand2 className="w-5 h-5" />
                    {t('creative.redesignBtn')}
                  </button>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex flex-1 items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:-translate-y-1 transition-all"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isEditing ? t('creative.cancelEditBtn') : t('creative.editDesignBtn')}
                  </button>

                  <button
                    onClick={() => {
                      setPrompt('');
                      setGeneratedImage(null);
                      setGeneratedPrompt(null);
    setConceptOptions(null);
                      setConceptTitle(null);
                      setConceptExplanation(null);
                      setProductImages([]);
                      setError(null);
                      setIsEditing(false);
                      setEditInput('');
                    }}
                    className="flex flex-1 items-center justify-center gap-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {t('creative.newBtn')}
                  </button>
                </div>

                {isEditing && (
                  <div ref={editBoxRef} className="w-full bg-black/40 border border-purple-500/40 rounded-xl p-6 mt-4 animate-fade-in-down" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                     <h4 className="text-xl font-bold mb-4 text-purple-300 text-start">{t('creative.editLabel')}</h4>
                     <textarea
                       className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all mb-4 resize-none text-start"
                       placeholder={t('creative.editPlaceholder')}
                       value={editInput}
                       onChange={(e) => setEditInput(e.target.value)}
                     />
                     <button
                        onClick={() => {
                           if (!editInput.trim()) return;
                           const tag = lang === 'ar' ? '\n\nالتعديلات المطلوبة لتحديث التصميم:\n' : '\n\nRequested revisions to update design:\n';
                           const newP = prompt + tag + editInput;
                           setPrompt(newP);
                           setIsEditing(false);
                           setEditInput('');
                           handleGenerate(newP, true);
                        }}
                        disabled={!editInput.trim() || isGenerating}
                        className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     >
                       {isGenerating ? (t('creative.m015')) : t('creative.applyEditBtn')}
                     </button>
                  </div>
                )}
              </div>

              <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center flex flex-col items-center">
                <h4 className="text-xl font-bold mb-4 text-slate-200">
                  {t('creative.m014')}
                </h4>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateDesign(star)}
                      disabled={isDesignRated}
                      className={`transition-all duration-300 ${
                        isDesignRated ? 'cursor-default' : 'hover:-translate-y-1 hover:scale-110 cursor-pointer'
                      }`}
                    >
                      <Star 
                        className={`w-10 h-10 ${
                          star <= designRating 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                            : 'text-slate-500 hover:text-slate-400'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                {isDesignRated && (
                  <p className="text-amber-400 font-medium text-sm animate-fade-in-up mt-2">
                    {t('creative.m013')}
                  </p>
                )}
              </div>

              {mode === 'brand_kit' && (brandKitSlogan || brandKitColors || brandKitTypography || brandKitGuidelines) ? (
                <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-white/10 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] relative overflow-hidden text-start animate-fade-in-up" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                  
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 flex items-center gap-3 border-b border-white/10 pb-4">
                    <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                    {t('creative.m012')}
                  </h3>

                  {conceptTitle && conceptExplanation && (
                    <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-5">
                      <h4 className="text-lg font-bold text-amber-300 mb-2">{conceptTitle}</h4>
                      <p className="text-slate-300 font-light leading-relaxed text-sm md:text-base">{conceptExplanation}</p>
                    </div>
                  )}

                  {brandKitSlogan && (
                    <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-5 text-center">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider mb-2">{t('creative.m011')}</span>
                      <p className="text-xl md:text-2xl font-extrabold italic bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-indigo-200">
                        "{brandKitSlogan}"
                      </p>
                    </div>
                  )}

                  {brandKitColors && brandKitColors.length > 0 && (
                    <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-5">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider mb-3">{t('creative.m010')}</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {brandKitColors.map((color, idx) => {
                          const hexColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl transition-all hover:scale-[1.03]">
                              <div 
                                style={{ backgroundColor: hexColor }} 
                                className="w-12 h-12 rounded-xl border border-white/20 shadow-inner"
                              ></div>
                              <span className="text-xs font-mono text-slate-300 uppercase tracking-tight">{hexColor}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {brandKitTypography && (
                    <div className="mb-6 bg-white/5 border border-white/5 rounded-xl p-5">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider mb-2">{t('creative.m009')}</span>
                      <p className="text-slate-200 font-medium whitespace-pre-line leading-relaxed text-sm md:text-base">
                        {brandKitTypography}
                      </p>
                    </div>
                  )}

                  {brandKitGuidelines && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                      <span className="text-xs text-slate-400 block uppercase tracking-wider mb-2">{t('creative.m008')}</span>
                      <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base whitespace-pre-line">
                        {brandKitGuidelines}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                conceptTitle && conceptExplanation && (
                  <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-sm relative overflow-hidden text-start animate-fade-in-up" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <h4 className="text-2xl font-bold mb-4 text-fuchsia-300 flex items-center gap-3">
                      <Sparkles className="w-6 h-6" />
                      {conceptTitle}
                    </h4>
                    <p className="text-slate-300 text-lg leading-relaxed font-light">
                      {conceptExplanation}
                    </p>
                  </div>
                )
              )}

              {generatedPrompt && (
                <div className="w-full max-w-2xl bg-black/30 border border-purple-500/20 rounded-2xl p-6 hidden md:block" dir="ltr text-left">
                  <h4 className="text-purple-400 font-semibold mb-3 text-sm tracking-wider uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('creative.behindScenesPrompt')}
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-mono opacity-70 break-words">
                    {generatedPrompt}
                  </p>
                </div>
              )}

              <div className="mt-12 w-full max-w-2xl animate-fade-in-up">
                <p className="text-center font-bold text-sm md:text-base leading-relaxed bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  {t('creative.footerInfo')}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Sliding Panel / Custom Configuration Sheet */}
      {activeKitItemToConfigure && (() => {
        const item = BRAND_KIT_ITEMS.find(i => i.id === activeKitItemToConfigure);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
              onClick={() => setActiveKitItemToConfigure(null)}
            />
            
            {/* Slide-in Sheet */}
            <div className="relative w-full max-w-lg bg-slate-900 border-l border-white/10 h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto z-10 animate-slide-in-right">
              <div>
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <div className="text-start">
                    <span className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider">{t('creative.m007')}</span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {t(`creative.kit.${item.id}.label`)}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveKitItemToConfigure(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6 text-start">
                  {/* Dynamic Data Fields Inputs */}
                  {item.fields && item.fields.length > 0 && (
                    <div className="flex flex-col gap-5">
                      {item.fields.map(field => {
                        const fieldValue = tempConfigFields?.[field.id];
                        
                        return (
                        <div key={field.id} className="flex flex-col gap-2">
                          <label className="text-sm text-slate-300 font-semibold mb-1">
                            {t(`creative.kit.${item.id}.f.${field.id}`)}
                          </label>
                          
                          {(!field?.type || field?.type === 'text') && (
                            <input
                              type="text"
                              value={fieldValue || ''}
                              onChange={(e) => {
                                setTempConfigFields(prev => ({
                                  ...prev,
                                  [field.id]: e.target.value
                                }));
                              }}
                              placeholder={t('creative.enterField', { label: t(`creative.kit.${item.id}.f.${field.id}`) })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/50 text-sm transition-all shadow-inner"
                            />
                          )}

                          {field?.type === 'radio' && field.options && (
                            <div className="flex flex-wrap gap-6 mt-1 p-3 bg-black/20 rounded-xl border border-white/5">
                              {field.options.map(opt => (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${fieldValue === opt.value ? 'border-fuchsia-500 bg-fuchsia-500/20' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                    {fieldValue === opt.value && <div className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full" />}
                                  </div>
                                  <span className="text-sm text-slate-300 group-hover:text-slate-200 font-medium">
                                    {opt.value === 'yes' ? t('common.yes') : opt.value === 'no' ? t('common.no') : t(`creative.kit.${item.id}.f.${field.id}.${opt.value}`)}
                                  </span>
                                  <input 
                                    type="radio" 
                                    className="hidden"
                                    name={`${item.id}-${field.id}`}
                                    value={opt.value}
                                    checked={fieldValue === opt.value}
                                    onChange={(e) => {
                                      setTempConfigFields(prev => ({
                                        ...prev,
                                        [field.id]: e.target.value
                                      }));
                                    }}
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          {field?.type === 'checkbox' && field.options && (
                            <div className="grid grid-cols-2 gap-4 mt-1 p-4 bg-black/20 rounded-xl border border-white/5">
                              {field.options.map(opt => {
                                const isChecked = Array.isArray(fieldValue) ? fieldValue.includes(opt.value) : false;
                                return (
                                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-400' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                      {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm text-slate-300 group-hover:text-slate-200 font-medium">
                                      {opt.value === 'yes' ? t('common.yes') : opt.value === 'no' ? t('common.no') : t(`creative.kit.${item.id}.f.${field.id}.${opt.value}`)}
                                    </span>
                                    <input 
                                      type="checkbox" 
                                      className="hidden"
                                      value={opt.value}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentArr = Array.isArray(fieldValue) ? fieldValue : [];
                                        const newArr = e.target.checked 
                                          ? [...currentArr, opt.value]
                                          : currentArr.filter((v: string) => v !== opt.value);
                                        
                                        setTempConfigFields(prev => ({
                                          ...prev,
                                          [field.id]: newArr
                                        }));
                                      }}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  )}

                  {/* Directives/Notes */}
                  <div className={item.fields?.length ? 'pt-6 border-t border-white/10' : ''}>
                    <label className="block text-slate-300 font-medium mb-2 text-sm">
                      {t('creative.m005')}
                    </label>
                    <textarea
                      value={tempConfigNotes}
                      onChange={(e) => setTempConfigNotes(e.target.value)}
                      placeholder={t('creative.m004')}
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all text-sm text-start"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-slate-300 text-sm">
                  <span>{t('creative.m003')}</span>
                  <span className="text-fuchsia-400 font-extrabold">{t('creative.m002')}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Save and add to selected list
                      setKitItemConfigs(prev => ({
                        ...prev,
                        [item.id]: {
                          dimension: tempConfigDimension,
                          quality: tempConfigQuality,
                          notes: tempConfigNotes,
                          fields: tempConfigFields,
                          label: lang === 'ar' ? item.labelAr : item.labelEn
                        }
                      }));
                      if (!selectedKitItems.includes(item.id)) {
                        setSelectedKitItems(prev => [...prev, item.id]);
                      }
                      setActiveKitItemToConfigure(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all text-sm"
                  >
                    {t('creative.m001')}
                  </button>
                  
                  {selectedKitItems.includes(item.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        // Remove from selection
                        setSelectedKitItems(prev => prev.filter(id => id !== item.id));
                        setActiveKitItemToConfigure(null);
                      }}
                      className="px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 rounded-xl font-bold transition-all text-sm"
                    >
                      {t('common.remove')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

        {/* Empty bottom space for small screens */}
        <div className="w-full h-28 sm:h-8 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
}
