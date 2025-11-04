import { create } from 'zustand';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface SSEStoreState {
    status: SSEStatus;
    setStatus: (status: SSEStatus) => void;
}

export const useSSEStore = create<SSEStoreState>((set) => ({
    status: 'disconnected',
    setStatus: (status) => set({ status }),
}));