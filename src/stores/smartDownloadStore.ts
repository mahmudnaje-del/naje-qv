import { create } from 'zustand';
import {
  DownloadRequest,
  generateSmartFilename,
  executeDirectDownload,
  sanitizeFilename,
} from '../utils/smartNamingGateway';
import { toast } from '../toastStore';

export interface SmartDownloadState {
  isOpen: boolean;
  request: DownloadRequest | null;
  suggestedFilename: string;
  autoDownloadEnabled: boolean;
  
  // Actions
  triggerDownload: (req: DownloadRequest) => void;
  closeGateway: () => void;
  confirmDownload: (customFilename?: string) => void;
  setAutoDownload: (enabled: boolean) => void;
  regenerateName: (mode?: 'arabic' | 'english' | 'short' | 'date') => void;
}

const STORAGE_KEY = 'naje_smart_download_auto';

export const useSmartDownloadStore = create<SmartDownloadState>((set, get) => ({
  isOpen: false,
  request: null,
  suggestedFilename: '',
  autoDownloadEnabled: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false,

  triggerDownload: (req: DownloadRequest) => {
    const smartName = generateSmartFilename(req);
    const state = get();

    if (state.autoDownloadEnabled || req.skipModal) {
      executeDirectDownload(req.data, smartName, req.mimeType);
      toast.success(`تم التنزيل باسم ذكي: ${smartName}`);
      return;
    }

    set({
      isOpen: true,
      request: req,
      suggestedFilename: smartName,
    });
  },

  closeGateway: () => {
    set({ isOpen: false, request: null });
  },

  confirmDownload: (customFilename?: string) => {
    const { request, suggestedFilename } = get();
    if (!request) return;

    let finalName = customFilename || suggestedFilename;
    const ext = (request.ext || 'html').replace(/^\./, '');
    
    // Ensure correct extension
    if (!finalName.endsWith(`.${ext}`)) {
      finalName = `${finalName}.${ext}`;
    }

    executeDirectDownload(request.data, finalName, request.mimeType);
    toast.success(`تم تنزيل الملف: ${finalName}`);
    set({ isOpen: false, request: null });
  },

  setAutoDownload: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    }
    set({ autoDownloadEnabled: enabled });
    if (enabled) {
      toast.info('تم تفعيل التنزيل الذكي المباشر دائماً');
    } else {
      toast.info('سيتم إظهار بوابة التسمية الذكية عند كل تنزيل');
    }
  },

  regenerateName: (mode = 'short') => {
    const { request, suggestedFilename } = get();
    if (!request) return;

    const ext = (request.ext || 'html').replace(/^\./, '');
    let currentBase = suggestedFilename.replace(new RegExp(`\\.${ext}$`), '');

    if (mode === 'date') {
      const today = new Date().toISOString().slice(0, 10);
      currentBase = `${currentBase}_${today}`;
    } else if (mode === 'short') {
      currentBase = currentBase.split('_').slice(0, 3).join('_');
    } else if (mode === 'arabic') {
      currentBase = `تطبيق_${currentBase}`;
    }

    const clean = sanitizeFilename(currentBase);
    set({ suggestedFilename: `${clean}.${ext}` });
  },
}));

/**
 * Convenience export function for trigger
 */
export function triggerSmartDownload(req: DownloadRequest) {
  useSmartDownloadStore.getState().triggerDownload(req);
}
