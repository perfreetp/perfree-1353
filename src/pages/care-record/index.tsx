import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

const CareRecordPage: React.FC = () => {
  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <Text className={styles.icon}>📝</Text>
      <Text className={styles.title}>登记保养</Text>
      <Text className={styles.description}>
        功能正在开发中...
        {'\n'}
        敬请期待清洁日期登记、保养用品管理等功能
      </Text>
    </ScrollView>
  );
};

export default CareRecordPage;
