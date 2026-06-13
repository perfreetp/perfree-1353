import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

const AddShoePage: React.FC = () => {
  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <Text className={styles.icon}>👟</Text>
      <Text className={styles.title}>添加鞋款</Text>
      <Text className={styles.description}>
        功能正在开发中...
        {'\n'}
        敬请期待上传照片、标记颜色风格等功能
      </Text>
    </ScrollView>
  );
};

export default AddShoePage;
