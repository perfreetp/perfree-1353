import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Shoe, ShoeScene, ShoeMaterial } from '@/types';
import { mockShoes } from '@/data/mock';

const STORAGE_KEY = 'shoe_store_data';

export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  brand: string;
  material: ShoeMaterial | 'all';
  scene: ShoeScene | 'all';
  searchQuery: string;
}

interface ShoeStore {
  shoes: Shoe[];
  selectedScene: ShoeScene | 'all';
  filterPresets: FilterPreset[];
  isInitialized: boolean;
  initFromStorage: () => void;
  saveToStorage: () => void;
  addShoe: (shoe: Omit<Shoe, 'id' | 'totalWears' | 'lastWorn' | 'lastCleaned' | 'isIdle' | 'idleDays'>) => void;
  updateShoe: (id: string, updates: Partial<Shoe>) => void;
  deleteShoe: (id: string) => void;
  setSelectedScene: (scene: ShoeScene | 'all') => void;
  getShoeById: (id: string) => Shoe | undefined;
  markAsWorn: (id: string) => void;
  markAsCleaned: (id: string, date?: string) => void;
  addFilterPreset: (preset: Omit<FilterPreset, 'id'>) => void;
  deleteFilterPreset: (id: string) => void;
}

export const useShoeStore = create<ShoeStore>((set, get) => ({
  shoes: mockShoes,
  selectedScene: 'all',
  filterPresets: [],
  isInitialized: false,

  initFromStorage: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored && Array.isArray(stored.shoes) && stored.shoes.length > 0) {
        set({
          shoes: stored.shoes,
          selectedScene: stored.selectedScene || 'all',
          filterPresets: stored.filterPresets || [],
          isInitialized: true
        });
        console.log('[ShoeStore] 从本地存储加载:', stored.shoes.length, '双鞋');
      } else {
        set({ isInitialized: true });
        get().saveToStorage();
        console.log('[ShoeStore] 初始化完成，使用Mock数据');
      }
    } catch (e) {
      console.error('[ShoeStore] 读取本地存储失败:', e);
      set({ isInitialized: true });
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      Taro.setStorageSync(STORAGE_KEY, {
        shoes: state.shoes,
        selectedScene: state.selectedScene,
        filterPresets: state.filterPresets
      });
    } catch (e) {
      console.error('[ShoeStore] 保存本地存储失败:', e);
    }
  },

  addShoe: (shoeData) => {
    const newShoe: Shoe = {
      ...shoeData,
      id: `shoe-${Date.now()}`,
      totalWears: 0,
      lastWorn: '',
      lastCleaned: '',
      isIdle: false,
      idleDays: 0
    };
    set((state) => ({
      shoes: [...state.shoes, newShoe]
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 添加鞋款:', newShoe.name);
  },

  updateShoe: (id, updates) => {
    set((state) => ({
      shoes: state.shoes.map((shoe) =>
        shoe.id === id ? { ...shoe, ...updates } : shoe
      )
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 更新鞋款:', id);
  },

  deleteShoe: (id) => {
    set((state) => ({
      shoes: state.shoes.filter((shoe) => shoe.id !== id)
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 删除鞋款:', id);
  },

  setSelectedScene: (scene) => {
    set({ selectedScene: scene });
    get().saveToStorage();
    console.log('[ShoeStore] 切换场景:', scene);
  },

  getShoeById: (id) => {
    return get().shoes.find((shoe) => shoe.id === id);
  },

  markAsWorn: (id) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      shoes: state.shoes.map((shoe) =>
        shoe.id === id
          ? {
              ...shoe,
              totalWears: shoe.totalWears + 1,
              lastWorn: today,
              isIdle: false,
              idleDays: 0
            }
          : shoe
      )
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 标记穿着:', id);
  },

  markAsCleaned: (id, date) => {
    const cleanedDate = date || new Date().toISOString().split('T')[0];
    set((state) => ({
      shoes: state.shoes.map((shoe) => {
        if (shoe.id !== id) return shoe;
        
        if (!shoe.lastCleaned) {
          console.log('[ShoeStore] 首次标记清洁:', id, '日期:', cleanedDate);
          return { ...shoe, lastCleaned: cleanedDate };
        }
        
        if (cleanedDate >= shoe.lastCleaned) {
          console.log('[ShoeStore] 更新清洁日期:', id, shoe.lastCleaned, '→', cleanedDate);
          return { ...shoe, lastCleaned: cleanedDate };
        }
        
        console.log('[ShoeStore] 补录历史清洁记录，不更新 lastCleaned:', id, '已有:', shoe.lastCleaned, '新记录:', cleanedDate);
        return shoe;
      })
    }));
    get().saveToStorage();
  },

  addFilterPreset: (preset) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: `preset-${Date.now()}`
    };
    set((state) => ({
      filterPresets: [...state.filterPresets, newPreset]
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 添加筛选方案:', newPreset.name);
  },

  deleteFilterPreset: (id) => {
    set((state) => ({
      filterPresets: state.filterPresets.filter((p) => p.id !== id)
    }));
    get().saveToStorage();
    console.log('[ShoeStore] 删除筛选方案:', id);
  }
}));
