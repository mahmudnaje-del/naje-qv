export interface ProjectContractExport {
  name: string;
  kind: 'function' | 'type' | 'component' | 'route' | 'constant';
  signature: string;
}

export interface ProjectContractRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  path: string;
  requestShape?: string;
  responseShape: string;
}

export interface ProjectContractFile {
  exports: ProjectContractExport[];
  routes?: ProjectContractRoute[];
}

export interface ProjectContract {
  files: Record<string, ProjectContractFile>;
}

export interface LinkerDiagnostic {
  filePath: string;
  issueType: 'missing_export' | 'missing_route' | 'empty_body' | 'contains_todo' | 'unresolved_import';
  message: string;
  targetPath?: string;
  symbolName?: string;
}

export interface AgentPlannedFile {
  path: string;
  purpose: string;
  dependsOn: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  language?: string;
}

export interface AgentProjectPlan {
  projectName: string;
  projectDescription: string;
  techStack: { frontend: string; backend?: string; styling: string };
  files: AgentPlannedFile[];
  buildOrder: string[];
}

export interface AgentToolCall {
  id: string;
  name: 'brand_identity' | 'image_studio' | 'video_director' | 'document_architect' | 'voice_narration' | 'fullstack_engineer' | 'web_grounding' | 'infographic_designer';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  pointsCost: number;
}

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  toolCalls?: AgentToolCall[];
  thoughtSummary?: string;
}

export interface AgentCodeFile {
  path: string;
  content: string;
  language: string;
  description?: string;
  purpose?: string;
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  dependsOn?: string[];
  estimatedComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface AgentGroundingSource {
  title?: string;
  uri?: string;
}

export interface AgentArtifact {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'brand_palette' | 'audio' | 'code_project' | 'text' | 'grounding_search' | 'infographic';
  title: string;
  url?: string;
  data?: any;
  files?: AgentCodeFile[];
  sources?: AgentGroundingSource[];
  createdAt: number;
  previewUrl?: string;
  downloadFilename?: string;
  isFavorite?: boolean;
  pinned?: boolean;
}

export interface AgentAuditEntry {
  stepTitle: string;
  feedback: string;
  passed: boolean;
  timestamp: number;
}

export interface AgentMission {
  id: string;
  ownerId: string;
  projectId?: string;
  title: string;
  userPrompt: string;
  status: 'planning' | 'waiting_approval' | 'executing' | 'auditing' | 'completed' | 'failed';
  estimatedPoints: number;
  consumedPoints: number;
  planSummary: string;
  steps: AgentStep[];
  artifacts: AgentArtifact[];
  auditHistory?: AgentAuditEntry[];
  brandContext?: {
    brandName?: string;
    industry?: string;
    tone?: string;
    colors?: string[];
    slogan?: string;
    targetAudience?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AgentPlanProposal {
  missionTitle: string;
  brandContext: {
    brandName: string;
    industry: string;
    tone: string;
    colors: string[];
    slogan?: string;
    targetAudience?: string;
  };
  planSummary: string;
  steps: Array<{
    title: string;
    description: string;
    tools: Array<{
      name: 'brand_identity' | 'image_studio' | 'video_director' | 'document_architect' | 'voice_narration' | 'fullstack_engineer' | 'web_grounding';
      title: string;
      estimatedPoints: number;
      inputParams: Record<string, any>;
    }>;
  }>;
  totalEstimatedPoints: number;
}

export type AgentChatTurnResponse =
  | {
      type: 'reply';
      message: string;
    }
  | {
      type: 'clarification';
      question: string;
      suggestedQuickReplies?: string[];
    }
  | {
      type: 'proposal';
      proposal: AgentPlanProposal;
    };

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'model';
  content?: string;
  type?: 'reply' | 'clarification' | 'proposal';
  question?: string;
  suggestedQuickReplies?: string[];
  proposal?: AgentPlanProposal;
  timestamp: number;
}
