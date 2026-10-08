/**
 * Canonical Naje Agent capability registry.
 * Planner enums, fleet checks, executor admission, and billing all read this.
 * A tool is exposed to the model only when an executor exists.
 */

export type CapabilityKind = 'execute' | 'review' | 'plan';

export interface AgentCapability {
  id: string;
  kind: CapabilityKind;
  /** Mission steps may name this tool. */
  exposedToPlanner: boolean;
  /** Server will run it and may bill it. */
  executable: boolean;
  billable: boolean;
  fleetId?: string;
  titleAr: string;
  plannerHint: string;
}

export const AGENT_CAPABILITIES: readonly AgentCapability[] = [
  { id: 'brand_identity', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, titleAr: 'الهوية', plannerHint: 'تأسيس الهوية، الألوان، النبرة، وسيكولوجية البراند.' },
  { id: 'image_studio', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, titleAr: 'الصور', plannerHint: 'تصميم وتوليد الشعارات والصور الإعلانية والتصاميم البصرية.' },
  { id: 'video_director', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, titleAr: 'الفيديو', plannerHint: 'تأليف لقطة فيو 4 أو 6 أو 8 ثوانٍ. لا تطلب 20 ثانية في توليد واحد.' },
  { id: 'video_stitch', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'stitch', titleAr: 'دمج المقاطع', plannerHint: 'خطة دمج اللقطات عندما تتجاوز المدة لقطة واحدة. فيو لا يرجع 20 ثانية من طلب 10+10.' },
  { id: 'ui_director', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'ui', titleAr: 'الواجهات', plannerHint: 'واجهة موقع تستدعي وكيل الصور للخلفيات والأصول، مع خطوط عربية.' },
  { id: 'voice_narration', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'voice', titleAr: 'الصوت', plannerHint: 'توليد فويس أوفر وتعليق صوتي.' },
  { id: 'fullstack_engineer', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'fullstack', titleAr: 'التطوير', plannerHint: 'برمجة أنظمة ومواقع وتطبيقات ويب متكاملة مع المعاينة وتحميل ZIP.' },
  { id: 'document_architect', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'document', titleAr: 'المستندات', plannerHint: 'تأليف كتيبات PDF أو عروض تقديمية.' },
  { id: 'compose_artifact', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, titleAr: 'ملف', plannerHint: 'أنشئ الملف حتى لو لم يكن في القائمة القديمة: markdown أو csv أو json أو html أو txt أو deck. ضع format داخل inputParams، والطلب داخل prompt.' },
  { id: 'web_grounding', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, fleetId: 'source', titleAr: 'المصادر', plannerHint: 'البحث الحي لجمع حقائق الصناعة والمنافسين.' },
  { id: 'infographic_designer', kind: 'execute', exposedToPlanner: true, executable: true, billable: true, titleAr: 'إنفوجرافيك', plannerHint: 'إنفوجرافيك من مواصفة ثم رسم. ليس بديلاً عن image_studio.' },
  { id: 'critic_review', kind: 'review', exposedToPlanner: false, executable: false, billable: false, fleetId: 'critic', titleAr: 'الناقد', plannerHint: 'يفحص المخرج بعد التنفيذ عبر المدقق. ليس خطوة توليد ولا يُحاسب.' },
  { id: 'propose_mission', kind: 'plan', exposedToPlanner: false, executable: false, billable: false, fleetId: 'planner', titleAr: 'مخطط المهمة', plannerHint: 'يحوّل الطلب إلى خطة. ليس أداة تنفيذ.' },
];

export type ExecutableToolName = typeof EXECUTOR_TOOL_NAMES[number];

const byId = new Map(AGENT_CAPABILITIES.map((c) => [c.id, c]));

export function getAgentCapability(id: string): AgentCapability | undefined {
  return byId.get(id);
}

export function isExecutableAgentTool(id: string): boolean {
  return byId.get(id)?.executable === true;
}

export function plannerToolNames(): string[] {
  return AGENT_CAPABILITIES.filter((c) => c.exposedToPlanner).map((c) => c.id);
}

export function plannerToolGuide(): string {
  return AGENT_CAPABILITIES
    .filter((c) => c.exposedToPlanner)
    .map((c) => `     - '${c.id}': ${c.plannerHint}`)
    .join('\n');
}

/** Tools the executor switch actually implements. Kept beside the switch. */
export const EXECUTOR_TOOL_NAMES = [
  'brand_identity',
  'image_studio',
  'voice_narration',
  'fullstack_engineer',
  'video_stitch',
  'ui_director',
  'video_director',
  'document_architect',
  'infographic_designer',
  'compose_artifact',
  'web_grounding',
] as const;

export function registryConflicts(fleetTools: { id: string; tool: string }[]): string[] {
  const problems: string[] = [];
  const executable = AGENT_CAPABILITIES.filter((c) => c.executable).map((c) => c.id);
  const exposed = plannerToolNames();
  const implemented = new Set<string>(EXECUTOR_TOOL_NAMES);

  for (const id of executable) {
    if (!implemented.has(id)) problems.push(`executable without executor: ${id}`);
  }
  for (const id of implemented) {
    if (!isExecutableAgentTool(id)) problems.push(`executor tool missing from registry: ${id}`);
  }
  for (const id of exposed) {
    if (!isExecutableAgentTool(id)) problems.push(`planner exposes non-executable tool: ${id}`);
  }
  for (const spec of fleetTools) {
    const cap = getAgentCapability(spec.tool);
    if (!cap) problems.push(`fleet ${spec.id} points at unknown tool ${spec.tool}`);
    else if (cap.executable && !implemented.has(cap.id)) problems.push(`fleet ${spec.id} tool ${spec.tool} has no executor`);
  }
  const ids = AGENT_CAPABILITIES.map((c) => c.id);
  if (new Set(ids).size !== ids.length) problems.push('duplicate capability id');
  return problems;
}
