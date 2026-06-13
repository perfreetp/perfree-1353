import { create } from 'zustand';
import type { Shoe, ShoeScene } from '@/types';
import { mockShoes } from '@/data/mock';

interface ShoeStore {
  shoes: Shoe[];
  selectedScene: ShoeScene | 'all';
  addShoe: (shoe: Omit<Shoe, 'id' | 'totalWears' | 'lastWorn' | 'lastCleaned' | 'isIdle' | 'idleDays'>) => void;
  updateShoe: (id: string, updates: Partial<Shoe>) => void;
  deleteShoe: (id: string) => void;
  setSelectedScene: (scene: ShoeScene | 'all') => void;
  getShoeById: (id: string) => Shoe | undefined;
  markAsWorn: (id: string) => void;
  markAsCleaned: (id: string) => void;
}

export const useShoeStore = create<ShoeStore>((set, get) => ({
  shoes: mockShoes,
  selectedScene: 'all',

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
    console.log('[ShoeStore] 添加鞋款:', newShoe.name);
  },

  updateShoe: (id, updates) => {
    set((state) => ({
      shoes: state.shoes.map((shoe) =>
        shoe.id === id ? { ...shoe, ...updates } : shoe
      )
    }));
    console.log('[ShoeStore] 更新鞋款:', id);
  },

  deleteShoe: (id) => {
    set((state) => ({
      shoes: state.shoes.filter((shoe) => shoe.id !== id)
    }));
    console.log('[ShoeStore] 删除鞋款:', id);
  },

  setSelectedScene: (scene) => {
    set({ selectedScene: scene });
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
    console.log('[ShoeStore] 标记穿着:', id);
  },

  markAsCleaned: (id) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      shoes: state.shoes.map((shoe) =>
        shoe.id === id ? { ...shoe, lastCleaned: today } : shoe
      )
    }));
    console.log('[ShoeStore] 标记清洁:', id);
  }
}));
