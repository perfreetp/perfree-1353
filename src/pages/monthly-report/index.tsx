import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

const MonthlyReportPage: React.FC = () => {
  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <Text className={styles.icon}>📊</Text>
      <Text className={styles.title}>月度报告</Text>
      <Text className={styles.description}>
        功能正在开发中...
        {'\n'}
        敬请期待月度穿搭记录生成、数据可视化等功能
      </Text>
    </ScrollView>
  );
};

export default MonthlyReportPage;
