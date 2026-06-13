export type ShoeScene = 'commute' | 'sport' | 'casual';
export type ShoeMaterial = 'leather' | 'suede' | 'canvas' | 'mesh' | 'rubber' | 'synthetic';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
export type CareType = 'clean' | 'waterproof' | 'condition' | 'repair';

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  image: string;
  colors: string[];
  style: string;
  scene: ShoeScene[];
  material: ShoeMaterial;
  purchaseDate: string;
  totalWears: number;
  lastWorn: string;
  lastCleaned: string;
  notes: string;
  isIdle: boolean;
  idleDays: number;
}

export interface OutfitRecord {
  id: string;
  date: string;
  shoeId: string;
  shoeName: string;
  shoeImage: string;
  outfitImage?: string;
  weather: WeatherCondition;
  temperature: number;
  scene: ShoeScene;
  notes: string;
}

export interface CareRecord {
  id: string;
  shoeId: string;
  shoeName: string;
  type: CareType;
  date: string;
  products: string[];
  notes: string;
}

export interface RotationPlan {
  id: string;
  shoeIds: string[];
  startDate: string;
  endDate: string;
  interval: number;
  isActive: boolean;
}

export interface WeatherData {
  date: string;
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface MonthlyReport {
  month: string;
  totalWears: number;
  mostWorn: {
    shoeId: string;
    shoeName: string;
    shoeImage?: string;
    count: number;
  } | null;
  byScene: {
    scene: ShoeScene;
    count: number;
  }[];
  outfitRecords: OutfitRecord[];
}

export interface CareProduct {
  id: string;
  name: string;
  type: string;
  brand: string;
  expiryDate: string;
}
