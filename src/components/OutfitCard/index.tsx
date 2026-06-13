import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { OutfitRecord } from '@/types';
import { getWeatherIcon, getSceneText } from '@/utils/weather';
import styles from './index.module.scss';

interface OutfitCardProps {
  record: OutfitRecord;
  showOutfitImage?: boolean;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ record, showOutfitImage = true }) => {
  const formattedDate = dayjs(record.date).format('YYYY年MM月DD日 dddd');

  return (
    <View className={styles.outfitCard}>
      <View className={styles.cardHeader}>
        <Text className={styles.dateText}>{formattedDate}</Text>
        <View className={styles.weatherInfo}>
          <Text className={styles.weatherIcon}>{getWeatherIcon(record.weather)}</Text>
          <Text className={styles.temperature}>{record.temperature}°C</Text>
        </View>
      </View>
      <View className={styles.cardBody}>
        <View className={styles.shoeInfo}>
          <View className={styles.shoeThumbnail}>
            <Image
              className={styles.shoeImage}
              src={record.shoeImage}
              mode="aspectFill"
              onError={(e) => console.error('[OutfitCard] 图片加载失败:', e.detail)}
            />
          </View>
          <View className={styles.shoeDetails}>
            <Text className={styles.shoeName}>{record.shoeName}</Text>
            <Text
              className={classnames(styles.sceneTag, styles[record.scene])}
            >
              {getSceneText(record.scene)}
            </Text>
          </View>
        </View>
        {record.notes && (
          <Text className={styles.notes}>{record.notes}</Text>
        )}
        {showOutfitImage && record.outfitImage && (
          <View className={styles.outfitImageContainer}>
            <Image
              className={styles.outfitImage}
              src={record.outfitImage}
              mode="aspectFill"
              onError={(e) => console.error('[OutfitCard] 搭配图加载失败:', e.detail)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default OutfitCard;
