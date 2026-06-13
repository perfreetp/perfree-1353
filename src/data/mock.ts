import dayjs from 'dayjs';
import type { Shoe, OutfitRecord, CareRecord, WeatherData, CareProduct, RotationPlan } from '@/types';

export const mockShoes: Shoe[] = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High OG',
    brand: 'Nike',
    image: 'https://picsum.photos/id/119/600/400',
    colors: ['#000000', '#FF0000', '#FFFFFF'],
    style: '复古篮球',
    scene: ['casual', 'commute'],
    material: 'leather',
    purchaseDate: '2024-01-15',
    totalWears: 28,
    lastWorn: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    notes: '经典禁穿配色，适合日常穿搭',
    isIdle: false,
    idleDays: 2
  },
  {
    id: '2',
    name: 'Ultraboost 22',
    brand: 'Adidas',
    image: 'https://picsum.photos/id/225/600/400',
    colors: ['#000000', '#FFFFFF'],
    style: '运动跑鞋',
    scene: ['sport', 'commute'],
    material: 'mesh',
    purchaseDate: '2024-03-20',
    totalWears: 45,
    lastWorn: dayjs().format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    notes: '舒适缓震，跑步通勤两相宜',
    isIdle: false,
    idleDays: 0
  },
  {
    id: '3',
    name: 'Chuck 70 Classic',
    brand: 'Converse',
    image: 'https://picsum.photos/id/230/600/400',
    colors: ['#8B4513', '#FFFFFF'],
    style: '休闲板鞋',
    scene: ['casual'],
    material: 'suede',
    purchaseDate: '2023-11-08',
    totalWears: 15,
    lastWorn: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    notes: '麂皮材质，雨天避免穿着',
    isIdle: true,
    idleDays: 15
  },
  {
    id: '4',
    name: 'New Balance 990v5',
    brand: 'New Balance',
    image: 'https://picsum.photos/id/103/600/400',
    colors: ['#808080', '#FFFFFF', '#FF0000'],
    style: '复古慢跑',
    scene: ['commute', 'casual'],
    material: 'synthetic',
    purchaseDate: '2024-02-10',
    totalWears: 32,
    lastWorn: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(12, 'day').format('YYYY-MM-DD'),
    notes: '美产做工，舒适百搭',
    isIdle: false,
    idleDays: 3
  },
  {
    id: '5',
    name: 'Yeezy Boost 350 V2',
    brand: 'Adidas',
    image: 'https://picsum.photos/id/220/600/400',
    colors: ['#F5F5DC', '#000000'],
    style: '潮流休闲',
    scene: ['casual'],
    material: 'mesh',
    purchaseDate: '2024-04-05',
    totalWears: 12,
    lastWorn: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(25, 'day').format('YYYY-MM-DD'),
    notes: '斑马配色，潮流必备',
    isIdle: true,
    idleDays: 20
  },
  {
    id: '6',
    name: 'Air Force 1 Low',
    brand: 'Nike',
    image: 'https://picsum.photos/id/250/600/400',
    colors: ['#FFFFFF'],
    style: '经典板鞋',
    scene: ['casual', 'commute'],
    material: 'leather',
    purchaseDate: '2023-12-01',
    totalWears: 52,
    lastWorn: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    notes: '全白经典，百搭之王',
    isIdle: false,
    idleDays: 1
  },
  {
    id: '7',
    name: 'Vans Old Skool',
    brand: 'Vans',
    image: 'https://picsum.photos/id/218/600/400',
    colors: ['#000000', '#FFFFFF'],
    style: '滑板休闲',
    scene: ['casual', 'sport'],
    material: 'canvas',
    purchaseDate: '2024-01-28',
    totalWears: 38,
    lastWorn: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
    notes: '经典黑白，滑板文化代表',
    isIdle: false,
    idleDays: 5
  },
  {
    id: '8',
    name: 'Clarks Desert Boot',
    brand: 'Clarks',
    image: 'https://picsum.photos/id/1080/600/400',
    colors: ['#D2691E'],
    style: '休闲靴',
    scene: ['casual', 'commute'],
    material: 'suede',
    purchaseDate: '2023-09-15',
    totalWears: 22,
    lastWorn: dayjs().subtract(8, 'day').format('YYYY-MM-DD'),
    lastCleaned: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    notes: '麂皮沙漠靴，秋冬必备',
    isIdle: false,
    idleDays: 8
  }
];

export const mockOutfitRecords: OutfitRecord[] = Array.from({ length: 30 }, (_, i) => {
  const shoe = mockShoes[i % mockShoes.length];
  const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
  const weathers: Array<'sunny' | 'cloudy' | 'rainy' | 'windy'> = ['sunny', 'cloudy', 'rainy', 'windy'];
  const scenes: Array<'commute' | 'sport' | 'casual'> = ['commute', 'sport', 'casual'];
  return {
    id: `outfit-${i}`,
    date,
    shoeId: shoe.id,
    shoeName: shoe.name,
    shoeImage: shoe.image,
    weather: weathers[Math.floor(Math.random() * weathers.length)],
    temperature: 15 + Math.floor(Math.random() * 20),
    scene: scenes[Math.floor(Math.random() * scenes.length)],
    notes: i % 5 === 0 ? '今天搭配牛仔裤，很帅气' : ''
  };
});

export const mockCareRecords: CareRecord[] = [
  {
    id: 'care-1',
    shoeId: '1',
    shoeName: 'Air Jordan 1 Retro High OG',
    type: 'clean',
    date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    products: ['Jason Markk 清洁液', '软毛刷'],
    notes: '深度清洁鞋面污渍'
  },
  {
    id: 'care-2',
    shoeId: '2',
    shoeName: 'Ultraboost 22',
    type: 'waterproof',
    date: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
    products: ['Crep Protect 防水喷雾'],
    notes: '鞋面做防水处理'
  },
  {
    id: 'care-3',
    shoeId: '6',
    shoeName: 'Air Force 1 Low',
    type: 'clean',
    date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    products: ['小白鞋清洁膏', '魔术擦'],
    notes: '中底氧化部分清洁'
  },
  {
    id: 'care-4',
    shoeId: '3',
    shoeName: 'Chuck 70 Classic',
    type: 'condition',
    date: dayjs().subtract(20, 'day').format('YYYY-MM-DD'),
    products: ['麂皮护理剂', '软毛刷'],
    notes: '麂皮材质护理保养'
  },
  {
    id: 'care-5',
    shoeId: '8',
    shoeName: 'Clarks Desert Boot',
    type: 'condition',
    date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    products: ['麂皮清洁胶', '防水喷雾'],
    notes: '秋季保养准备'
  }
];

export const mockWeatherForecast: WeatherData[] = [
  {
    date: dayjs().format('YYYY-MM-DD'),
    condition: 'sunny',
    temperature: 26,
    humidity: 45,
    windSpeed: 12
  },
  {
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    condition: 'cloudy',
    temperature: 24,
    humidity: 55,
    windSpeed: 15
  },
  {
    date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    condition: 'rainy',
    temperature: 20,
    humidity: 80,
    windSpeed: 20
  },
  {
    date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    condition: 'rainy',
    temperature: 18,
    humidity: 85,
    windSpeed: 18
  },
  {
    date: dayjs().add(4, 'day').format('YYYY-MM-DD'),
    condition: 'cloudy',
    temperature: 22,
    humidity: 60,
    windSpeed: 10
  },
  {
    date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
    condition: 'sunny',
    temperature: 25,
    humidity: 40,
    windSpeed: 8
  },
  {
    date: dayjs().add(6, 'day').format('YYYY-MM-DD'),
    condition: 'sunny',
    temperature: 27,
    humidity: 35,
    windSpeed: 6
  }
];

export const mockCareProducts: CareProduct[] = [
  {
    id: 'prod-1',
    name: 'Jason Markk 清洁液',
    type: 'cleaner',
    brand: 'Jason Markk',
    expiryDate: '2026-12-31'
  },
  {
    id: 'prod-2',
    name: 'Crep Protect 防水喷雾',
    type: 'waterproof',
    brand: 'Crep Protect',
    expiryDate: '2025-06-30'
  },
  {
    id: 'prod-3',
    name: '麂皮护理剂',
    type: 'conditioner',
    brand: 'Collonil',
    expiryDate: '2026-03-15'
  },
  {
    id: 'prod-4',
    name: '小白鞋清洁膏',
    type: 'cleaner',
    brand: '无名',
    expiryDate: '2025-12-01'
  }
];

export const mockRotationPlan: RotationPlan = {
  id: 'plan-1',
  shoeIds: ['1', '2', '4', '6'],
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  interval: 1,
  isActive: true
};
