import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastState {
  toasts: Toast[];
  confirm: ConfirmState;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

let confirmResolve: ((value: boolean) => void) | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  confirm: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  },
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  showConfirm: (title, message) => {
    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve;
      set({
        confirm: {
          isOpen: true,
          title,
          message,
          onConfirm: () => {
            set((state) => ({ confirm: { ...state.confirm, isOpen: false } }));
            if (confirmResolve) confirmResolve(true);
          },
          onCancel: () => {
            set((state) => ({ confirm: { ...state.confirm, isOpen: false } }));
            if (confirmResolve) confirmResolve(false);
          },
        },
      });
    });
  },
  closeConfirm: (result) => {
    set((state) => ({ confirm: { ...state.confirm, isOpen: false } }));
    if (confirmResolve) confirmResolve(result);
  },
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg: string) => useToastStore.getState().addToast(msg, 'info'),
};
