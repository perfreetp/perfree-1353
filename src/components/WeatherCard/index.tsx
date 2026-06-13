import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { WeatherData, Shoe } from '@/types';
import { getWeatherIcon, getWeatherText, getWeatherWarnings } from '@/utils/weather';
import styles from './index.module.scss';

interface WeatherCardProps {
  weather: WeatherData;
  shoes: Shoe[];
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, shoes }) => {
  const formattedDate = dayjs(weather.date).format('YYYY年MM月DD日 dddd');
  const warnings = getWeatherWarnings(shoes, weather.condition);

  return (
    <View className={styles.weatherCard}>
      <View className={styles.currentWeather}>
        <View className={styles.leftSection}>
          <Text className={styles.dateText}>{formattedDate}</Text>
          <Text className={styles.weatherDesc}>{getWeatherText(weather.condition)}</Text>
          <View>
            <Text className={styles.temperature}>{weather.temperature}</Text>
            <Text className={styles.tempUnit}>°C</Text>
          </View>
        </View>
        <View className={styles.rightSection}>
          <Text className={styles.weatherIcon}>{getWeatherIcon(weather.condition)}</Text>
        </View>
      </View>

      <View className={styles.weatherDetails}>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>💧</Text>
          <Text className={styles.detailValue}>{weather.humidity}%</Text>
          <Text className={styles.detailLabel}>湿度</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>💨</Text>
          <Text className={styles.detailValue}>{weather.windSpeed}km/h</Text>
          <Text className={styles.detailLabel}>风速</Text>
        </View>
        <View className={styles.detailItem}>
          <Text className={styles.detailIcon}>👟</Text>
          <Text className={styles.detailValue}>{shoes.length}</Text>
          <Text className={styles.detailLabel}>鞋款</Text>
        </View>
      </View>

      {warnings.length > 0 && (
        <View className={styles.warningSection}>
          {warnings.map((warning, index) => (
            <View
              key={index}
              className={classnames(styles.warningItem, styles[warning.type])}
            >
              <Text className={styles.warningIcon}>
                {warning.type === 'warning' ? '⚠️' : 'ℹ️'}
              </Text>
              <Text className={styles.warningText}>{warning.message}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default WeatherCard;
