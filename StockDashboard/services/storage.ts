import { Platform } from 'react-native';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const memoryStore = new Map<string, string>();
let mmkvInstance: any = null;

if (Platform.OS !== 'web') {
  try {
    const { createMMKV } = require('react-native-mmkv');
    mmkvInstance = createMMKV();
  } catch (error) {
    console.warn('MMKV native module not found (Expo Go / Web environment). Using fast in-memory fallback.');
  }
}

// Universal synchronous storage adapter (MMKV on native builds, localStorage on Web, Memory in Expo Go)
export const syncStorage = {
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {}
    } else if (mmkvInstance) {
      try {
        mmkvInstance.set(key, value);
      } catch (e) {
        memoryStore.set(key, value);
      }
    } else {
      memoryStore.set(key, value);
    }
  },
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    } else if (mmkvInstance) {
      try {
        return mmkvInstance.getString(key) ?? null;
      } catch (e) {
        return memoryStore.get(key) ?? null;
      }
    }
    return memoryStore.get(key) ?? null;
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    } else if (mmkvInstance) {
      try {
        mmkvInstance.remove(key);
      } catch (e) {
        memoryStore.delete(key);
      }
    } else {
      memoryStore.delete(key);
    }
  },
};

export const clientPersister = createSyncStoragePersister({
  storage: syncStorage,
  key: 'STOCK_DASHBOARD_QUERY_CACHE',
});
