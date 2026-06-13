import type { Shoe, WeatherCondition, ShoeMaterial } from '@/types';

export const getWeatherIcon = (condition: WeatherCondition): string => {
  const icons: Record<WeatherCondition, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    windy: '💨'
  };
  return icons[condition];
};

export const getWeatherText = (condition: WeatherCondition): string => {
  const texts: Record<WeatherCondition, string> = {
    sunny: '晴天',
    cloudy: '多云',
    rainy: '雨天',
    snowy: '雪天',
    windy: '大风'
  };
  return texts[condition];
};

export const isMaterialSensitiveToRain = (material: ShoeMaterial): boolean => {
  return material === 'suede' || material === 'leather';
};

export const getRecommendedShoes = (
  shoes: Shoe[],
  condition: WeatherCondition,
  scene?: string
): Shoe[] => {
  let filtered = [...shoes];

  if (condition === 'rainy' || condition === 'snowy') {
    filtered = filtered.filter((shoe) => !isMaterialSensitiveToRain(shoe.material));
  }

  if (scene && scene !== 'all') {
    filtered = filtered.filter((shoe) => shoe.scene.includes(scene as any));
  }

  filtered.sort((a, b) => a.idleDays - b.idleDays);

  return filtered;
};

export const getWeatherWarnings = (
  shoes: Shoe[],
  condition: WeatherCondition
): { type: 'warning' | 'info'; message: string; shoeName?: string }[] => {
  const warnings: { type: 'warning' | 'info'; message: string; shoeName?: string }[] = [];

  if (condition === 'rainy' || condition === 'snowy') {
    const sensitiveShoes = shoes.filter((s) => isMaterialSensitiveToRain(s.material));
    if (sensitiveShoes.length > 0) {
      warnings.push({
        type: 'warning',
        message: '今日有雨/雪，建议避开麂皮、皮革材质的鞋款'
      });
      sensitiveShoes.forEach((shoe) => {
        warnings.push({
          type: 'warning',
          message: `${shoe.name}（${getMaterialText(shoe.material)}）需注意防水`,
          shoeName: shoe.name
        });
      });
    }
  }

  if (condition === 'sunny') {
    warnings.push({
      type: 'info',
      message: '天气晴朗，适合穿着各种鞋款'
    });
  }

  return warnings;
};

export const getMaterialText = (material: ShoeMaterial): string => {
  const texts: Record<ShoeMaterial, string> = {
    leather: '皮革',
    suede: '麂皮',
    canvas: '帆布',
    mesh: '网面',
    rubber: '橡胶',
    synthetic: '合成材料'
  };
  return texts[material];
};

export const getSceneText = (scene: string): string => {
  const texts: Record<string, string> = {
    commute: '通勤',
    sport: '运动',
    casual: '休闲',
    all: '全部'
  };
  return texts[scene] || scene;
};

export const getCareTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    clean: '清洁',
    waterproof: '防水',
    condition: '护理',
    repair: '修复'
  };
  return texts[type] || type;
};
