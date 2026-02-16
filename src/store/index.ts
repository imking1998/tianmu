/**
 * 天目应用 - 全局状态管理
 * 使用 Zustand 进行状态管理，轻量且高效
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ItemAnalysisResult, ARDetectionResult } from '../types';

// ==================== 用户状态 ====================

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      setProfile: (profile) => set({ profile, isOnboarded: true }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date() }
            : null,
        })),
      clearProfile: () => set({ profile: null, isOnboarded: false }),
      completeOnboarding: () => set({ isOnboarded: true }),
    }),
    {
      name: 'tianmu-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ==================== AR状态 ====================

interface ARState {
  isScanning: boolean;
  detectedItems: ARDetectionResult[];
  selectedItem: ARDetectionResult | null;
  cameraPermission: 'granted' | 'denied' | 'pending';
  setScanning: (isScanning: boolean) => void;
  addDetectedItem: (item: ARDetectionResult) => void;
  updateDetectedItem: (id: string, updates: Partial<ARDetectionResult>) => void;
  removeDetectedItem: (id: string) => void;
  selectItem: (item: ARDetectionResult | null) => void;
  clearDetectedItems: () => void;
  setCameraPermission: (status: 'granted' | 'denied' | 'pending') => void;
}

export const useARStore = create<ARState>()((set) => ({
  isScanning: false,
  detectedItems: [],
  selectedItem: null,
  cameraPermission: 'pending',
  setScanning: (isScanning) => set({ isScanning }),
  addDetectedItem: (item) =>
    set((state) => ({
      detectedItems: [...state.detectedItems, item],
    })),
  updateDetectedItem: (id, updates) =>
    set((state) => ({
      detectedItems: state.detectedItems.map((item) =>
        item.itemId === id ? { ...item, ...updates } : item
      ),
    })),
  removeDetectedItem: (id) =>
    set((state) => ({
      detectedItems: state.detectedItems.filter((item) => item.itemId !== id),
      selectedItem: state.selectedItem?.itemId === id ? null : state.selectedItem,
    })),
  selectItem: (item) => set({ selectedItem: item }),
  clearDetectedItems: () => set({ detectedItems: [], selectedItem: null }),
  setCameraPermission: (status) => set({ cameraPermission: status }),
}));

// ==================== UI状态 ====================

interface UIState {
  theme: 'dark' | 'light';
  showOnboarding: boolean;
  activeTab: 'scan' | 'profile' | 'history' | 'settings';
  toggleTheme: () => void;
  setShowOnboarding: (show: boolean) => void;
  setActiveTab: (tab: 'scan' | 'profile' | 'history' | 'settings') => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: 'dark',
  showOnboarding: true,
  activeTab: 'scan',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

// ==================== 历史记录状态 ====================

interface HistoryItem {
  id: string;
  timestamp: Date;
  items: ARDetectionResult[];
  location?: string;
}

interface HistoryState {
  records: HistoryItem[];
  maxRecords: number;
  addRecord: (record: HistoryItem) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      records: [],
      maxRecords: 100,
      addRecord: (record) =>
        set((state) => {
          const newRecords = [record, ...state.records].slice(0, state.maxRecords);
          return { records: newRecords };
        }),
      removeRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      clearRecords: () => set({ records: [] }),
    }),
    {
      name: 'tianmu-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
