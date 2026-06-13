import { create } from 'zustand';
import type { CareRecord, RotationPlan, CareProduct, CareType } from '@/types';
import { mockCareRecords, mockRotationPlan, mockCareProducts } from '@/data/mock';

interface CareStore {
  careRecords: CareRecord[];
  rotationPlan: RotationPlan | null;
  careProducts: CareProduct[];
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

  addCareRecord: (recordData) => {
    const newRecord: CareRecord = {
      ...recordData,
      id: `care-${Date.now()}`
    };
    set((state) => ({
      careRecords: [newRecord, ...state.careRecords]
    }));
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
    console.log('[CareStore] 添加保养用品:', newProduct.name);
  },

  setRotationPlan: (plan) => {
    set({ rotationPlan: plan });
    console.log('[CareStore] 设置轮换计划:', plan.shoeIds.length, '双鞋');
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
