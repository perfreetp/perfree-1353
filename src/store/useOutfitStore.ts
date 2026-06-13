import { create } from 'zustand';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { OutfitRecord, WeatherCondition, ShoeScene, MonthlyReport } from '@/types';
import { mockOutfitRecords } from '@/data/mock';
import { useShoeStore } from './useShoeStore';

const STORAGE_KEY = 'outfit_store_data';

interface OutfitStore {
  records: OutfitRecord[];
  isInitialized: boolean;
  initFromStorage: () => void;
  saveToStorage: () => void;
  addRecord: (record: Omit<OutfitRecord, 'id'>) => void;
  getTodayRecord: () => OutfitRecord | undefined;
  getRecordsByMonth: (yearMonth: string) => OutfitRecord[];
  generateMonthlyReport: (yearMonth: string) => MonthlyReport;
}

export const useOutfitStore = create<OutfitStore>((set, get) => ({
  records: mockOutfitRecords,
  isInitialized: false,

  initFromStorage: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored && Array.isArray(stored.records) && stored.records.length > 0) {
        set({
          records: stored.records,
          isInitialized: true
        });
        console.log('[OutfitStore] 从本地存储加载:', stored.records.length, '条记录');
      } else {
        set({ isInitialized: true });
        get().saveToStorage();
        console.log('[OutfitStore] 初始化完成，使用Mock数据');
      }
    } catch (e) {
      console.error('[OutfitStore] 读取本地存储失败:', e);
      set({ isInitialized: true });
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      Taro.setStorageSync(STORAGE_KEY, {
        records: state.records
      });
    } catch (e) {
      console.error('[OutfitStore] 保存本地存储失败:', e);
    }
  },

  addRecord: (recordData) => {
    const newRecord: OutfitRecord = {
      ...recordData,
      id: `outfit-${Date.now()}`
    };
    set((state) => {
      const sameDayIndex = state.records.findIndex((r) => r.date === newRecord.date);
      let updatedRecords = [...state.records];
      
      if (sameDayIndex !== -1) {
        const oldRecord = state.records[sameDayIndex];
        console.log('[OutfitStore] 同一天已有记录，替换旧记录:', oldRecord.date, oldRecord.shoeName, '→', newRecord.shoeName);
        
        if (oldRecord.shoeId !== newRecord.shoeId) {
          const shoeStore = useShoeStore.getState();
          const oldShoe = shoeStore.shoes.find((s) => s.id === oldRecord.shoeId);
          if (oldShoe && oldShoe.totalWears > 0) {
            shoeStore.updateShoe(oldRecord.shoeId, {
              totalWears: oldShoe.totalWears - 1
            });
            console.log('[OutfitStore] 旧鞋穿着次数-1:', oldShoe.name);
          }
        }
        
        updatedRecords = state.records.filter((r) => r.date !== newRecord.date);
      }
      
      return {
        records: [newRecord, ...updatedRecords]
      };
    });
    get().saveToStorage();
    console.log('[OutfitStore] 添加穿搭记录:', newRecord.date, newRecord.shoeName);
  },

  getTodayRecord: () => {
    const today = dayjs().format('YYYY-MM-DD');
    return get().records.find((r) => r.date === today);
  },

  getRecordsByMonth: (yearMonth) => {
    return get().records.filter((r) => r.date.startsWith(yearMonth));
  },

  generateMonthlyReport: (yearMonth) => {
    const records = get().getRecordsByMonth(yearMonth);
    const shoeCountMap = new Map<string, number>();
    const sceneCountMap = new Map<ShoeScene, number>();
    const shoeNameMap = new Map<string, string>();
    const shoeImageMap = new Map<string, string>();

    records.forEach((record) => {
      shoeCountMap.set(record.shoeId, (shoeCountMap.get(record.shoeId) || 0) + 1);
      sceneCountMap.set(record.scene, (sceneCountMap.get(record.scene) || 0) + 1);
      if (!shoeNameMap.has(record.shoeId)) {
        shoeNameMap.set(record.shoeId, record.shoeName);
      }
      if (record.shoeImage && !shoeImageMap.has(record.shoeId)) {
        shoeImageMap.set(record.shoeId, record.shoeImage);
      }
    });

    let mostWorn = null;
    let maxCount = 0;
    shoeCountMap.forEach((count, shoeId) => {
      if (count > maxCount) {
        maxCount = count;
        mostWorn = {
          shoeId,
          shoeName: shoeNameMap.get(shoeId) || '未知鞋款',
          shoeImage: shoeImageMap.get(shoeId),
          count
        };
      }
    });

    const byScene = Array.from(sceneCountMap.entries()).map(([scene, count]) => ({
      scene,
      count
    }));

    console.log('[OutfitStore] 生成月度报告:', yearMonth, '共', records.length, '条记录');

    return {
      month: yearMonth,
      totalWears: records.length,
      mostWorn,
      byScene,
      outfitRecords: records
    };
  }
}));
