import { create } from 'zustand';
import dayjs from 'dayjs';
import type { OutfitRecord, WeatherCondition, ShoeScene, MonthlyReport } from '@/types';
import { mockOutfitRecords } from '@/data/mock';

interface OutfitStore {
  records: OutfitRecord[];
  addRecord: (record: Omit<OutfitRecord, 'id'>) => void;
  getTodayRecord: () => OutfitRecord | undefined;
  getRecordsByMonth: (yearMonth: string) => OutfitRecord[];
  generateMonthlyReport: (yearMonth: string) => MonthlyReport;
}

export const useOutfitStore = create<OutfitStore>((set, get) => ({
  records: mockOutfitRecords,

  addRecord: (recordData) => {
    const newRecord: OutfitRecord = {
      ...recordData,
      id: `outfit-${Date.now()}`
    };
    set((state) => ({
      records: [newRecord, ...state.records]
    }));
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

    records.forEach((record) => {
      shoeCountMap.set(record.shoeId, (shoeCountMap.get(record.shoeId) || 0) + 1);
      sceneCountMap.set(record.scene, (sceneCountMap.get(record.scene) || 0) + 1);
    });

    let mostWorn = null;
    let maxCount = 0;
    shoeCountMap.forEach((count, shoeId) => {
      if (count > maxCount) {
        maxCount = count;
        const record = records.find((r) => r.shoeId === shoeId);
        if (record) {
          mostWorn = {
            shoeId,
            shoeName: record.shoeName,
            count
          };
        }
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
