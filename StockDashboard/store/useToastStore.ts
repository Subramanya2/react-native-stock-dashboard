import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastStoreState {
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toast: null,
  showToast: (message, type = 'success') => {
    const id = Date.now().toString();
    set({ toast: { id, type, message } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 3500);
  },
  hideToast: () => set({ toast: null }),
}));
