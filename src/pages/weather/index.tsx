import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useShoeStore } from '@/store/useShoeStore';
import { mockWeatherForecast } from '@/data/mock';
import {
  getWeatherIcon,
  getWeatherText,
  isMaterialSensitiveToRain,
  getRecommendedShoes,
  getMaterialText
} from '@/utils/weather';
import { resolveImagePath } from '@/utils/storage';
import WeatherCard from '@/components/WeatherCard';
import ShoeCard from '@/components/ShoeCard';
import styles from './index.module.scss';

const WeatherPage: React.FC = () => {
  const { shoes } = useShoeStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[WeatherPage] 下拉刷新');
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, [handleRefresh]);

  const selectedWeather = mockWeatherForecast[selectedDayIndex];
  const hasRainyDay = mockWeatherForecast.some(w => w.condition === 'rainy' || w.condition === 'snowy');
  const sensitiveShoes = useMemo(() => 
    shoes.filter(s => isMaterialSensitiveToRain(s.material)),
    [shoes]
  );
  const recommendedShoes = useMemo(() => 
    getRecommendedShoes(shoes, selectedWeather.condition, 'commute'),
    [shoes, selectedWeather.condition]
  );

  const suggestions = useMemo(() => {
    const items: { icon: string; text: string }[] = [];
    if (selectedWeather.condition === 'rainy' || selectedWeather.condition === 'snowy') {
      items.push(
        { icon: '🚫', text: '避免穿着麂皮、皮革材质的鞋款' },
        { icon: '☔', text: '建议携带雨伞，注意防水' },
        { icon: '🧽', text: '回家后及时清洁鞋面水渍' }
      );
    } else if (selectedWeather.condition === 'sunny') {
      items.push(
        { icon: '✨', text: '适合展示心爱的球鞋' },
        { icon: '🌡️', text: '高温天气注意透气，避免闷脚' },
        { icon: '🧴', text: '白色鞋款注意防晒，避免发黄' }
      );
    } else {
      items.push(
        { icon: '👟', text: '天气宜人，适合各种鞋款' },
        { icon: '🔄', text: '可以考虑轮换穿着' }
      );
    }
    return items;
  }, [selectedWeather.condition]);

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <ScrollView
      className={styles.pageContainer}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className="container">
        <View className={styles.weatherSection}>
          <WeatherCard weather={selectedWeather} shoes={shoes} />
        </View>

        {hasRainyDay && sensitiveShoes.length > 0 && (
          <View className={styles.warningBanner}>
            <Text className={styles.warningIcon}>⚠️</Text>
            <Text className={styles.warningText}>
              未来几天有雨，请注意保护 {sensitiveShoes.length} 双麂皮/皮革材质的鞋款
            </Text>
          </View>
        )}

        <View className={styles.forecastSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📅 未来7天预报</Text>
          </View>
          <View className={styles.forecastList}>
            {mockWeatherForecast.map((weather, index) => (
              <View
                key={index}
                className={classnames(
                  styles.forecastItem,
                  styles[weather.condition]
                )}
                onClick={() => setSelectedDayIndex(index)}
              >
                <View className={styles.forecastDate}>
                  <Text className={styles.forecastDay}>
                    {dayjs(weather.date).format('MM/DD')}
                  </Text>
                  <Text className={styles.forecastWeekday}>
                    {weekdays[dayjs(weather.date).day()]}
                  </Text>
                </View>
                <Text className={styles.forecastIcon}>
                  {getWeatherIcon(weather.condition)}
                </Text>
                <View className={styles.forecastInfo}>
                  <Text className={styles.forecastCondition}>
                    {getWeatherText(weather.condition)}
                  </Text>
                  <Text className={styles.forecastTemp}>
                    💧 {weather.humidity}% · 💨 {weather.windSpeed}km/h
                  </Text>
                </View>
                <Text className={styles.forecastTempRange}>
                  {weather.temperature}°C
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.suggestSection}>
          <Text className={styles.suggestTitle}>💡 今日建议</Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} className={styles.suggestItem}>
              <Text className={styles.suggestIcon}>{suggestion.icon}</Text>
              <Text className={styles.suggestText}>{suggestion.text}</Text>
            </View>
          ))}
        </View>

        {hasRainyDay && sensitiveShoes.length > 0 && (
          <View className={styles.sensitiveSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>🚫 雨天避免穿着</Text>
            </View>
            <View className={styles.sensitiveList}>
              {sensitiveShoes.map((shoe) => (
                <View
                  key={shoe.id}
                  className={styles.sensitiveItem}
                  onClick={() => Taro.navigateTo({ url: `/pages/shoe-detail/index?id=${shoe.id}` })}
                >
                  <Image
                    className={styles.sensitiveImage}
                    src={resolveImagePath(shoe.image)}
                    mode="aspectFill"
                  />
                  <View className={styles.sensitiveInfo}>
                    <Text className={styles.sensitiveName}>{shoe.name}</Text>
                    <Text className={styles.sensitiveMaterial}>
                      {getMaterialText(shoe.material)} · 遇水易变形
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.recommendSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>✅ 推荐穿着</Text>
          </View>
          <ScrollView
            className={styles.recommendScroll}
            scrollX
            enhanced
            showScrollbar={false}
          >
            {recommendedShoes.map((shoe) => (
              <View key={shoe.id} className={styles.recommendItem}>
                <ShoeCard shoe={shoe} showStats={false} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default WeatherPage;
