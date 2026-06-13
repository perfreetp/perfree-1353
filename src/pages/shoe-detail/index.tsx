import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

const ShoeDetailPage: React.FC = () => {
  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <Text className={styles.icon}>👟</Text>
      <Text className={styles.title}>鞋款详情</Text>
      <Text className={styles.description}>
        功能正在开发中...
        {'\n'}
        敬请期待鞋款详细信息、穿着记录、保养记录等功能
      </Text>
    </ScrollView>
  );
};

export default ShoeDetailPage;
