import { create } from 'zustand';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type MarketSession = 'REGULAR_HOURS' | 'PRE_MARKET' | 'AFTER_HOURS' | 'DEMO_LIVE';

interface SSEStoreState {
    status: SSEStatus;
    setStatus: (status: SSEStatus) => void;
    session: MarketSession;
    setSession: (session: MarketSession) => void;
}

export const useSSEStore = create<SSEStoreState>((set) => ({
    status: 'disconnected',
    setStatus: (status) => set({ status }),
    session: 'REGULAR_HOURS',
    setSession: (session) => set({ session }),
}));