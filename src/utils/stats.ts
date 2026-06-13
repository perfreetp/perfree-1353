import dayjs from 'dayjs';
import type { Shoe, OutfitRecord } from '@/types';

export const getIdleShoes = (shoes: Shoe[], thresholdDays: number = 7): Shoe[] => {
  return shoes.filter((shoe) => shoe.idleDays >= thresholdDays).sort((a, b) => b.idleDays - a.idleDays);
};

export const getMostWornShoes = (shoes: Shoe[], limit: number = 5): Shoe[] => {
  return [...shoes].sort((a, b) => b.totalWears - a.totalWears).slice(0, limit);
};

export const getLeastWornShoes = (shoes: Shoe[], limit: number = 5): Shoe[] => {
  return [...shoes].sort((a, b) => a.totalWears - b.totalWears).slice(0, limit);
};

export const getTotalWears = (shoes: Shoe[]): number => {
  return shoes.reduce((sum, shoe) => sum + shoe.totalWears, 0);
};

export const getShoesNeedingCleaning = (shoes: Shoe[], thresholdDays: number = 14): Shoe[] => {
  const today = dayjs();
  return shoes.filter((shoe) => {
    if (!shoe.lastCleaned) return true;
    const daysSinceCleaned = today.diff(dayjs(shoe.lastCleaned), 'day');
    return daysSinceCleaned >= thresholdDays && shoe.totalWears > 0;
  });
};

export const getWearFrequency = (shoe: Shoe): string => {
  if (shoe.totalWears === 0) return '从未穿着';
  const daysOwned = dayjs().diff(dayjs(shoe.purchaseDate), 'day');
  if (daysOwned === 0) return '刚入手';
  const frequency = shoe.totalWears / daysOwned;
  if (frequency >= 0.5) return '高频穿着';
  if (frequency >= 0.2) return '经常穿着';
  if (frequency >= 0.1) return '偶尔穿着';
  return '很少穿着';
};

export const getSceneStats = (records: OutfitRecord[]) => {
  const stats: Record<string, number> = {
    commute: 0,
    sport: 0,
    casual: 0
  };
  records.forEach((record) => {
    stats[record.scene] = (stats[record.scene] || 0) + 1;
  });
  return stats;
};

export const getWeeklyTrend = (records: OutfitRecord[], days: number = 7) => {
  const today = dayjs();
  const trend: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, 'day').format('YYYY-MM-DD');
    const count = records.filter((r) => r.date === date).length;
    trend.push({ date, count });
  }
  return trend;
};
