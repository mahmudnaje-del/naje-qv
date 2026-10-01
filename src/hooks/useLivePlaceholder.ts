import { useState, useEffect, useRef } from 'react';
import { getChatTypeConfig } from '../lib/chatTypeConfig';
import { ChatType } from '../types';

export const TEXT_CHAT_PHRASES = [
  'اسأل عن أي فكرة، لغة، تحليل، أو إبداع وسأجيبك فوراً…',
  'صياغة نصوص، تدقيق لغوي، واستخراج الأفكار بدقة…',
  'اكتب تقريراً أو خطاباً رسمياً أو بحثاً متكاملاً…',
  'توليد مستندات Word وعروض تقديمية بضغطة زر…'
];

export const IMAGE_CHAT_PHRASES = [
  'صف تفاصيل المشهد السينمائي، الإضاءة، والزوايا الفنية…',
  'صمم بوستر إعلاني، شعاراً فخماً، أو شخصية ثلاثية الأبعاد…',
  'حوّل خيالك إلى لوحة بصرية بدقة 4K وتفاصيل فائقة…',
  'اكتب وصف صورتك وسيقوم محرك الصور بابتكارها فوراً…'
];

export const VIDEO_CHAT_PHRASES = [
  'صف حركة الكاميرا، المشهد، والإضاءة لتوليد فيديو سينمائي…',
  'أنتج مقطع فيديو إعلاني أو سينمائي بدقة فائقة…',
  'تحريك الشخصيات وتجسيد المشاهد الخيالية في لقطات حية…',
  'اكتب سيناريو اللقطة وسيتولى مخرج الفيديو تنفيذها…'
];

export const VOICE_CHAT_PHRASES = [
  'اكتب نص الحوار الإذاعي أو البودكاست بصوت نقي…',
  'توليد تعليق صوتي احترافي بأصوات خليجية وعربية متنوعة…',
  'محاكاة نبرة الصوت والمشاعر لإنتاج محتوى مسموع مبهر…',
  'اكتب ما تود قوله وسأحوله إلى نبرة إذاعية ساحرة…'
];

export const UI_CHAT_PHRASES = [
  'صمم واجهة مستخدم تفاعلية لصفحة هبوط أو لوحة تحكم SaaS…',
  'اطلب تعديل الألوان، الخطوط، أو إضافة مكونات React حديثة…',
  'بناء نماذج أولية تفاعلية مع معاينة فورية للكود…',
  'حوّل فكرة مشروعك إلى واجهات شاشات جوال وتطبيقات ويب…'
];

export const MULTI_AGENT_PROMPT_PHRASES = [
  'يبني هويتك البصرية بينما يجهز موقعك…',
  'وكيل يحلل مصادرك ووكيل يبتكر حملتك الإعلانية…',
  'ينسق نصوصك التسويقية ويهندس كود مشروعك البرمجي…',
  'وكيل ينتج فيديوهاتك السينمائية ووكيل يصمم علامتك…',
  'يدير منظومة وكلائك الأذكياء في خط إنتاج متزامن…',
  'صف فكرتك وسيتولى فريق وكلائك التخطيط والتنفيذ خطوة بخطوة…'
];

export const CREATIVE_AI_PHRASES = [
  'اكتب فكرة تصميمك وسأبتكرها بأسلوب سينمائي مبهر…',
  'صمم بوستر، إعلان، أو هوية احترافية بلمسة فنية…',
  'حوّل خيالك إلى تصاميم بصرية خارقة للعادة مع التفكير العميق…',
  'ابتكار تصاميم إبداعية غير مسبوقة بدمج الذكاء الفائق…'
];

export const IMAGE_DESIGNER_PHRASES = [
  'صمم بوستر إعلاني أو هوية بصرية مذهلة بأسلوب فني خارق…',
  'حوّل وصفك إلى صورة خيالية بدقة سينمائية وتفاصيل ساحرة…',
  'اطلب تعديل أي عنصر أو تغيير زاوية الإضاءة والألوان…',
  'ابتكر شخصيات ثلاثية الأبعاد ومشاهد واقعية بلمسة واحدة…'
];

export const DEVELOPER_PHRASES = [
  'اطلب برمجة ميزة، إصلاح أخطاء، أو بناء تطبيق متكامل…',
  'هندسة برمجية متقدمة مع دعم React وTypeScript وقواعد البيانات…',
  'تحليل المستودعات البرمجية وفحص الكود واقتراح أفضل الممارسات…',
  'اكتب استفسارك البرمجي وسأقوم بهندسة الحل خطوة بخطوة…'
];

export const SOURCE_PHRASES = [
  'اسأل عن أي تفصيل دقيق داخل ملفاتك ومستنداتك المرفوعة…',
  'استخراج فوري للمعلومات وصياغة ملخصات ذكية بالاعتماد على مصادرك…',
  'مقارنة المستندات والتحقق من الحقائق بدقة متناهية…',
  'بحث دقيق في ملفات PDF والروابط والنصوص التي أضفتها…'
];

export const AD_STUDIO_PHRASES = [
  'اكتب فكرة إعلانك التجاري وسننتج حملة سينمائية متكاملة…',
  'اختيار الممثلين والأماكن وتحديد الإيقاع وتوليد الإعلان…',
  'إنتاج إعلانات فيديو تسويقية بهوية احترافية موجهة لجمهورك…',
  'صف منتجك وسيقوم استوديو الإعلانات بصياغة سيناريو ساحر…'
];

export const PROMPT_STUDIO_PHRASES = [
  'اكتب فكرة المشهد أو النص وسأهندسه إلى برومبت احترافي…',
  'تحليل الصياغة وتعزيز التفاصيل البصرية والسينمائية الدقيقة…',
  'هندسة أوامر لـ Midjourney وGemini وVeo بجودة خارقة…',
  'تحويل الأفكار البسيطة إلى برومبتات استثنائية محكمة…'
];

export function useLivePlaceholder(
  phrases: string[] = TEXT_CHAT_PHRASES,
  typingSpeed = 38,
  pauseTime = 2200,
  deletingSpeed = 18
) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const activePhrases = phrases.length > 0 ? phrases : TEXT_CHAT_PHRASES;
  const prevPhrasesRef = useRef(phrases);

  // If the phrases array changes (e.g. user toggled from text to image/video/voice), reset smoothly
  useEffect(() => {
    if (prevPhrasesRef.current !== phrases) {
      prevPhrasesRef.current = phrases;
      setIndex(0);
      setIsDeleting(false);
      setText('');
    }
  }, [phrases]);

  useEffect(() => {
    const current = activePhrases[index % activePhrases.length];
    let timer: number;

    if (!isDeleting) {
      if (text.length < current.length) {
        timer = window.setTimeout(() => {
          setText(current.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        timer = window.setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      }
    } else {
      if (text.length > 0) {
        timer = window.setTimeout(() => {
          setText(current.slice(0, text.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % activePhrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [text, index, isDeleting, activePhrases, typingSpeed, pauseTime, deletingSpeed]);

  return text;
}

/**
 * Returns dynamic live placeholder text tailored specifically for each chat type.
 * Automatically updates when the chat type changes.
 */
export function useChatTypePlaceholder(chatType?: string | ChatType) {
  const meta = getChatTypeConfig(chatType);
  return useLivePlaceholder(meta.phrases);
}

