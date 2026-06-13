import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { Shoe } from '@/types';
import { getSceneText, getMaterialText, isMaterialSensitiveToRain } from '@/utils/weather';
import { getWearFrequency } from '@/utils/stats';
import { resolveImagePath } from '@/utils/storage';
import styles from './index.module.scss';

interface ShoeCardProps {
  shoe: Shoe;
  showStats?: boolean;
  onClick?: () => void;
}

const ShoeCard: React.FC<ShoeCardProps> = ({ shoe, showStats = true, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/shoe-detail/index?id=${shoe.id}`
      });
    }
  };

  const isSuede = isMaterialSensitiveToRain(shoe.material);

  return (
    <View className={styles.shoeCard} onClick={handleClick}>
      <View className={styles.imageContainer}>
        <Image
          className={styles.shoeImage}
          src={resolveImagePath(shoe.image)}
          mode="aspectFill"
          onError={(e) => console.error('[ShoeCard] 图片加载失败:', e.detail)}
        />
        {shoe.isIdle && shoe.idleDays >= 7 && (
          <View className={styles.idleBadge}>闲置{shoe.idleDays}天</View>
        )}
        {isSuede && (
          <View className={styles.suedeBadge}>⚠️ 注意防水</View>
        )}
      </View>
      <View className={styles.cardContent}>
        <Text className={styles.shoeName}>{shoe.name}</Text>
        <Text className={styles.shoeBrand}>{shoe.brand} · {getMaterialText(shoe.material)}</Text>
        
        <View className={styles.colorTags}>
          {shoe.colors.map((color, index) => (
            <View
              key={index}
              className={styles.colorDot}
              style={{ backgroundColor: color }}
            />
          ))}
        </View>

        <View className={styles.tagContainer}>
          {shoe.scene.map((s) => (
            <Text
              key={s}
              className={classnames(styles.sceneTag, styles[s])}
            >
              {getSceneText(s)}
            </Text>
          ))}
        </View>

        {showStats && (
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{shoe.totalWears}</Text>
              <Text className={styles.statLabel}>总穿着</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{shoe.idleDays}天</Text>
              <Text className={styles.statLabel}>未穿</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{getWearFrequency(shoe).slice(0, 2)}</Text>
              <Text className={styles.statLabel}>频率</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default ShoeCard;
