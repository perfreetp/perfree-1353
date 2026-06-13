import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { CareRecord, RotationPlan, CareProduct, CareType } from '@/types';
import { mockCareRecords, mockRotationPlan, mockCareProducts } from '@/data/mock';

const STORAGE_KEY = 'care_store_data';

interface CareStore {
  careRecords: CareRecord[];
  rotationPlan: RotationPlan | null;
  careProducts: CareProduct[];
  isInitialized: boolean;
  initFromStorage: () => void;
  saveToStorage: () => void;
  addCareRecord: (record: Omit<CareRecord, 'id'>) => void;
  addCareProduct: (product: Omit<CareProduct, 'id'>) => void;
  setRotationPlan: (plan: RotationPlan) => void;
  getCareRecordsByShoe: (shoeId: string) => CareRecord[];
  getNextRotationShoe: () => string | undefined;
}

export const useCareStore = create<CareStore>((set, get) => ({
  careRecords: mockCareRecords,
  rotationPlan: mockRotationPlan,
  careProducts: mockCareProducts,
  isInitialized: false,

  initFromStorage: () => {
    try {
      const stored = Taro.getStorageSync(STORAGE_KEY);
      if (stored) {
        set({
          careRecords: Array.isArray(stored.careRecords) ? stored.careRecords : mockCareRecords,
          rotationPlan: stored.rotationPlan || mockRotationPlan,
          careProducts: Array.isArray(stored.careProducts) ? stored.careProducts : mockCareProducts,
          isInitialized: true
        });
        console.log('[CareStore] 从本地存储加载:', 
          (stored.careRecords || []).length, '条保养记录,',
          stored.rotationPlan ? '有轮换计划' : '无轮换计划');
      } else {
        set({ isInitialized: true });
        get().saveToStorage();
        console.log('[CareStore] 初始化完成，使用Mock数据');
      }
    } catch (e) {
      console.error('[CareStore] 读取本地存储失败:', e);
      set({ isInitialized: true });
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      Taro.setStorageSync(STORAGE_KEY, {
        careRecords: state.careRecords,
        rotationPlan: state.rotationPlan,
        careProducts: state.careProducts
      });
    } catch (e) {
      console.error('[CareStore] 保存本地存储失败:', e);
    }
  },

  addCareRecord: (recordData) => {
    const newRecord: CareRecord = {
      ...recordData,
      id: `care-${Date.now()}`
    };
    set((state) => ({
      careRecords: [newRecord, ...state.careRecords]
    }));
    get().saveToStorage();
    console.log('[CareStore] 添加保养记录:', newRecord.shoeName, newRecord.type);
  },

  addCareProduct: (productData) => {
    const newProduct: CareProduct = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    set((state) => ({
      careProducts: [...state.careProducts, newProduct]
    }));
    get().saveToStorage();
    console.log('[CareStore] 添加保养用品:', newProduct.name);
  },

  setRotationPlan: (plan) => {
    set({ rotationPlan: plan });
    get().saveToStorage();
    console.log('[CareStore] 设置轮换计划:', plan.shoeIds.length, '双鞋,', plan.intervalDays, '天间隔');
  },

  getCareRecordsByShoe: (shoeId) => {
    return get().careRecords.filter((r) => r.shoeId === shoeId);
  },

  getNextRotationShoe: () => {
    const plan = get().rotationPlan;
    if (!plan || !plan.isActive || plan.shoeIds.length === 0) return undefined;
    return plan.shoeIds[0];
  }
}));
