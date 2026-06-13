import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { CareRecord } from '@/types';
import { getCareTypeText } from '@/utils/weather';
import styles from './index.module.scss';

interface CareCardProps {
  record: CareRecord;
}

const CareCard: React.FC<CareCardProps> = ({ record }) => {
  const typeIcons: Record<string, string> = {
    clean: '🧼',
    waterproof: '💧',
    condition: '✨',
    repair: '🔧'
  };

  const formattedDate = dayjs(record.date).format('YYYY-MM-DD');

  return (
    <View className={styles.careCard}>
      <View className={styles.cardHeader}>
        <View className={classnames(styles.typeBadge, styles[record.type])}>
          <Text>{typeIcons[record.type]}</Text>
          <Text>{getCareTypeText(record.type)}</Text>
        </View>
        <Text className={styles.dateText}>{formattedDate}</Text>
      </View>
      <Text className={styles.shoeName}>{record.shoeName}</Text>
      <View className={styles.productsSection}>
        <Text className={styles.productsLabel}>使用用品：</Text>
        <View className={styles.productTags}>
          {record.products.map((product, index) => (
            <Text key={index} className={styles.productTag}>
              {product}
            </Text>
          ))}
        </View>
      </View>
      {record.notes && (
        <Text className={styles.notes}>{record.notes}</Text>
      )}
    </View>
  );
};

export default CareCard;
