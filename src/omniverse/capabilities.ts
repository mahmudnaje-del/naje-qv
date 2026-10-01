export interface StudioCapability {
  id: string;
  labelKey: string;
  hintKey: string;
  to: string;
  keywords: string[];
}

/** Real routes only. Nothing here points at a studio that does not exist. */
export const STUDIO_CAPABILITIES: StudioCapability[] = [
  { id: 'chat', labelKey: 'omni.cap.chat', hintKey: 'omni.cap.chatHint', to: 'chat', keywords: ['chat', 'محادثة', 'دردشة', 'اسأل'] },
  { id: 'agent', labelKey: 'omni.cap.agent', hintKey: 'omni.cap.agentHint', to: '/naje-agent-core', keywords: ['agent', 'وكيل', 'مهمة'] },
  { id: 'ad', labelKey: 'omni.cap.ad', hintKey: 'omni.cap.adHint', to: '/naje-ad', keywords: ['ad', 'إعلان', 'اعلان', 'فيديو إعلان'] },
  { id: 'creative', labelKey: 'omni.cap.creative', hintKey: 'omni.cap.creativeHint', to: '/creative-studio', keywords: ['creative', 'إبداع', 'تصميم', 'صورة'] },
  { id: 'prompt', labelKey: 'omni.cap.prompt', hintKey: 'omni.cap.promptHint', to: '/naje-prompt', keywords: ['prompt', 'برومبت', 'أمر'] },
  { id: 'ident', labelKey: 'omni.cap.ident', hintKey: 'omni.cap.identHint', to: '/naje-ident', keywords: ['motion', 'intro', 'هوية حركة', 'موشن'] },
  { id: 'cv', labelKey: 'omni.cap.cv', hintKey: 'omni.cap.cvHint', to: '/naje-cv', keywords: ['cv', 'سيرة', 'resume'] },
  { id: 'developer', labelKey: 'omni.cap.developer', hintKey: 'omni.cap.developerHint', to: '/naje-developer', keywords: ['code', 'موقع', 'مطور', 'developer'] },
  { id: 'source', labelKey: 'omni.cap.source', hintKey: 'omni.cap.sourceHint', to: '/naje-source', keywords: ['source', 'مصدر', 'pdf', 'ملف'] },
  { id: 'projects', labelKey: 'omni.cap.projects', hintKey: 'omni.cap.projectsHint', to: '/projects', keywords: ['project', 'مشروع'] },
  { id: 'store', labelKey: 'omni.cap.store', hintKey: 'omni.cap.storeHint', to: '/store', keywords: ['store', 'رصيد', 'شحن'] },
];

export function handoffTargets(kind: string): StudioCapability[] {
  const map: Record<string, string[]> = {
    text: ['creative', 'prompt', 'agent', 'cv'],
    image: ['ad', 'creative', 'ident'],
    video: ['ad', 'ident'],
    document: ['source', 'cv', 'agent'],
    code: ['developer', 'agent'],
    ad: ['ident', 'creative'],
    cv: ['agent'],
    prompt: ['creative', 'ad'],
    brand: ['ad', 'creative', 'cv'],
  };
  const ids = map[kind] || ['agent'];
  return STUDIO_CAPABILITIES.filter((item) => ids.includes(item.id));
}
