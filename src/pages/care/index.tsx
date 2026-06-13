import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useShoeStore } from '@/store/useShoeStore';
import { useCareStore } from '@/store/useCareStore';
import { getShoesNeedingCleaning, getIdleShoes } from '@/utils/stats';
import { getMaterialText } from '@/utils/weather';
import StatCard from '@/components/StatCard';
import CareCard from '@/components/CareCard';
import styles from './index.module.scss';

const CarePage: React.FC = () => {
  const { shoes } = useShoeStore();
  const { careRecords, rotationPlan, careProducts } = useCareStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shoesNeedingCleaning = useMemo(() => getShoesNeedingCleaning(shoes, 14), [shoes]);
  const idleShoes = useMemo(() => getIdleShoes(shoes, 7), [shoes]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[CarePage] 下拉刷新');
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

  const handleAddRecord = () => {
    Taro.navigateTo({ url: '/pages/care-record/index' });
  };

  const handleEditRotation = () => {
    Taro.showToast({ title: '轮换计划编辑功能开发中', icon: 'none' });
  };

  const productIcons: Record<string, string> = {
    cleaner: '🧴',
    waterproof: '💧',
    conditioner: '✨',
    repair: '🔧'
  };

  const rotationShoes = useMemo(() => {
    if (!rotationPlan) return [];
    return rotationPlan.shoeIds.map(id => shoes.find(s => s.id === id)).filter(Boolean);
  }, [rotationPlan, shoes]);

  const reminders = useMemo(() => {
    const items: { icon: string; text: string }[] = [];
    if (shoesNeedingCleaning.length > 0) {
      items.push({
        icon: '🧼',
        text: `${shoesNeedingCleaning.length} 双鞋超过14天未清洁`
      });
    }
    if (idleShoes.length > 0) {
      items.push({
        icon: '🔄',
        text: `${idleShoes.length} 双鞋闲置超过7天，建议轮换`
      });
    }
    const expiringProducts = careProducts.filter(p => 
      dayjs(p.expiryDate).diff(dayjs(), 'month') <= 3
    );
    if (expiringProducts.length > 0) {
      items.push({
        icon: '⚠️',
        text: `${expiringProducts.length} 个保养用品即将过期`
      });
    }
    return items;
  }, [shoesNeedingCleaning, idleShoes, careProducts]);

  return (
    <ScrollView
      className={styles.pageContainer}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className="container">
        <View className={styles.statsRow}>
          <StatCard
            icon="📅"
            value={careRecords.length}
            label="保养记录"
            variant="primary"
          />
          <StatCard
            icon="🎯"
            value={rotationPlan?.isActive ? '进行中' : '未设置'}
            label="轮换计划"
            variant={rotationPlan?.isActive ? 'success' : 'default'}
          />
        </View>

        {reminders.length > 0 && (
          <View className={styles.reminderCard}>
            <Text className={styles.reminderTitle}>🔔 保养提醒</Text>
            <View className={styles.reminderList}>
              {reminders.map((reminder, index) => (
                <View key={index} className={styles.reminderItem}>
                  <Text className={styles.reminderIcon}>{reminder.icon}</Text>
                  <Text>{reminder.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.rotationSection}>
          <View className={styles.rotationHeader}>
            <Text className={styles.rotationTitle}>🔄 轮换计划</Text>
            <Text className={styles.rotationSwitch} onClick={handleEditRotation}>
              编辑 →
            </Text>
          </View>
          {rotationPlan && rotationShoes.length > 0 ? (
            <View>
              <View style={{ marginBottom: '16rpx', fontSize: '24rpx', color: '#86909C' }}>
                {dayjs(rotationPlan.startDate).format('MM月DD日')} - {dayjs(rotationPlan.endDate).format('MM月DD日')}
                {' · '}每{rotationPlan.interval}天轮换
              </View>
              <View className={styles.rotationShoes}>
                {rotationShoes.map((shoe, index) => (
                  <Text key={index} className={styles.rotationShoeTag}>
                    {shoe?.name.slice(0, 10)}...
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <Text className={styles.rotationEmpty}>
              还没有设置轮换计划，点击编辑开始规划
            </Text>
          )}
        </View>

        {shoesNeedingCleaning.length > 0 && (
          <View style={{ marginBottom: '24rpx' }}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>🧼 需要清洁</Text>
            </View>
            {shoesNeedingCleaning.slice(0, 3).map((shoe) => (
              <View
                key={shoe.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16rpx',
                  padding: '16rpx',
                  background: '#fff',
                  borderRadius: '12rpx',
                  marginBottom: '12rpx',
                  boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)'
                }}
                onClick={() => Taro.navigateTo({ url: `/pages/shoe-detail/index?id=${shoe.id}` })}
              >
                <Image
                  src={shoe.image}
                  style={{ width: '80rpx', height: '80rpx', borderRadius: '8rpx' }}
                  mode="aspectFill"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '28rpx', fontWeight: 500, color: '#1D2129' }}>
                    {shoe.name}
                  </Text>
                  <Text style={{ fontSize: '24rpx', color: '#FF7D00', marginTop: '4rpx' }}>
                    上次清洁: {dayjs(shoe.lastCleaned).fromNow()}
                  </Text>
                </View>
                <Text style={{ fontSize: '24rpx', color: '#FF6B35' }}>去清洁 →</Text>
              </View>
            ))}
          </View>
        )}

        <View className={styles.productsSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🧴 保养用品</Text>
            <Text className={styles.sectionAction}>管理 →</Text>
          </View>
          <View className={styles.productsGrid}>
            {careProducts.map((product) => (
              <View key={product.id} className={styles.productCard}>
                <Text className={styles.productIcon}>
                  {productIcons[product.type] || '📦'}
                </Text>
                <Text className={styles.productName}>{product.name}</Text>
                <Text className={styles.productBrand}>{product.brand}</Text>
                <Text className={styles.productExpiry}>
                  有效期: {dayjs(product.expiryDate).format('YYYY-MM')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.recordsSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📝 保养记录</Text>
            <Text className={styles.sectionAction} onClick={handleAddRecord}>
              登记 →
            </Text>
          </View>
          {careRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📝</Text>
              <Text className={styles.emptyText}>还没有保养记录</Text>
              <Button className={styles.buttonPrimary} onClick={handleAddRecord}>
                登记保养
              </Button>
            </View>
          ) : (
            careRecords.map((record) => (
              <CareCard key={record.id} record={record} />
            ))
          )}
        </View>
      </View>

      <View className={styles.floatingButton} onClick={handleAddRecord}>
        +
      </View>
    </ScrollView>
  );
};

export default CarePage;
