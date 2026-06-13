import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  icon: string;
  value: number | string;
  unit?: string;
  label: string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  unit,
  label,
  subtitle,
  variant = 'default',
  onClick
}) => {
  return (
    <View
      className={classnames(styles.statCard, variant !== 'default' && styles[variant])}
      onClick={onClick}
    >
      <Text className={styles.statIcon}>{icon}</Text>
      <View>
        <Text className={styles.statValue}>{value}</Text>
        {unit && <Text className={styles.statUnit}> {unit}</Text>}
      </View>
      <Text className={styles.statLabel}>{label}</Text>
      {subtitle && <Text className={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
};

export default StatCard;
