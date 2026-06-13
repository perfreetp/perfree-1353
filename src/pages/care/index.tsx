import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { Shoe } from '@/types';
import { useShoeStore } from '@/store/useShoeStore';
import { useCareStore } from '@/store/useCareStore';
import { getShoesNeedingCleaning, getIdleShoes } from '@/utils/stats';
import { resolveImagePath } from '@/utils/storage';
import StatCard from '@/components/StatCard';
import CareCard from '@/components/CareCard';
import styles from './index.module.scss';

const INTERVAL_OPTIONS = [
  { label: '每天', value: 1 },
  { label: '2天', value: 2 },
  { label: '3天', value: 3 },
  { label: '5天', value: 5 },
  { label: '每周', value: 7 }
];

const CarePage: React.FC = () => {
  const { shoes } = useShoeStore();
  const { careRecords, rotationPlan, careProducts, setRotationPlan } = useCareStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 轮换计划弹窗状态
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [editShoeIds, setEditShoeIds] = useState<string[]>([]);
  const [editStartDate, setEditStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [editEndDate, setEditEndDate] = useState(dayjs().add(1, 'month').format('YYYY-MM-DD'));
  const [editInterval, setEditInterval] = useState(3);

  const shoesNeedingCleaning = useMemo(() => getShoesNeedingCleaning(shoes, 14), [shoes]);
  const idleShoes = useMemo(() => getIdleShoes(shoes, 7), [shoes]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
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

  // 打开轮换计划编辑弹窗
  const handleEditRotation = () => {
    if (rotationPlan) {
      setEditShoeIds([...rotationPlan.shoeIds]);
      setEditStartDate(rotationPlan.startDate);
      setEditEndDate(rotationPlan.endDate);
      setEditInterval(rotationPlan.interval);
    } else {
      setEditShoeIds([]);
      setEditStartDate(dayjs().format('YYYY-MM-DD'));
      setEditEndDate(dayjs().add(1, 'month').format('YYYY-MM-DD'));
      setEditInterval(3);
    }
    setShowRotationModal(true);
  };

  const closeRotationModal = () => {
    setShowRotationModal(false);
  };

  const toggleShoeSelection = (shoeId: string) => {
    setEditShoeIds((prev) =>
      prev.includes(shoeId)
        ? prev.filter((id) => id !== shoeId)
        : [...prev, shoeId]
    );
  };

  const handleSaveRotation = () => {
    if (editShoeIds.length === 0) {
      Taro.showToast({ title: '请至少选择一双鞋', icon: 'none' });
      return;
    }
    if (!editStartDate || !editEndDate) {
      Taro.showToast({ title: '请选择起止日期', icon: 'none' });
      return;
    }
    if (dayjs(editEndDate).isBefore(dayjs(editStartDate))) {
      Taro.showToast({ title: '结束日期不能早于开始日期', icon: 'none' });
      return;
    }

    const today = dayjs().startOf('day');
    const isActive = today.isAfter(dayjs(editStartDate).subtract(1, 'day')) &&
                    today.isBefore(dayjs(editEndDate).add(1, 'day'));

    setRotationPlan({
      id: rotationPlan?.id || `rotation-${Date.now()}`,
      shoeIds: [...editShoeIds],
      startDate: editStartDate,
      endDate: editEndDate,
      interval: editInterval,
      isActive
    });

    Taro.showToast({ title: '轮换计划已保存', icon: 'success' });
    setShowRotationModal(false);
  };

  const productIcons: Record<string, string> = {
    cleaner: '🧴',
    waterproof: '💧',
    conditioner: '✨',
    repair: '🔧'
  };

  const rotationShoes = useMemo(() => {
    if (!rotationPlan) return [];
    return rotationPlan.shoeIds
      .map((id) => shoes.find((s) => s.id === id))
      .filter(Boolean) as Shoe[];
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
    const expiringProducts = careProducts.filter(
      (p) => dayjs(p.expiryDate).diff(dayjs(), 'month') <= 3
    );
    if (expiringProducts.length > 0) {
      items.push({
        icon: '⚠️',
        text: `${expiringProducts.length} 个保养用品即将过期`
      });
    }
    return items;
  }, [shoesNeedingCleaning, idleShoes, careProducts]);

  const totalDays = useMemo(() => {
    if (!rotationPlan) return 0;
    return dayjs(rotationPlan.endDate).diff(dayjs(rotationPlan.startDate), 'day') + 1;
  }, [rotationPlan]);

  return (
    <>
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
              value={rotationPlan?.isActive ? '进行中' : rotationPlan ? '未激活' : '未设置'}
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

          {/* 轮换计划区域 */}
          <View className={styles.rotationSection}>
            <View className={styles.rotationHeader}>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text className={styles.rotationTitle}>🔄 轮换计划</Text>
                {rotationPlan && (
                  <Text
                    className={classnames(styles.rotationStatus, {
                      [styles.statusActive]: rotationPlan.isActive,
                      [styles.statusInactive]: !rotationPlan.isActive
                    })}
                  >
                    {rotationPlan.isActive ? '进行中' : '未激活'}
                  </Text>
                )}
              </View>
              <Text className={styles.rotationSwitch} onClick={handleEditRotation}>
                {rotationPlan ? '编辑 →' : '+ 创建'}
              </Text>
            </View>

            {rotationPlan && rotationShoes.length > 0 ? (
              <View>
                <View className={styles.rotationInfo}>
                  <View className={styles.rotationDateRow}>
                    <Text>📆</Text>
                    <Text>
                      {dayjs(rotationPlan.startDate).format('YYYY年M月D日')} —{' '}
                      {dayjs(rotationPlan.endDate).format('M月D日')}
                      <Text style={{ color: '#86909C', marginLeft: '8rpx' }}>
                        （共{totalDays}天）
                      </Text>
                    </Text>
                  </View>
                  <View className={styles.rotationDateRow}>
                    <Text>⏱️</Text>
                    <Text>
                      每 <Text className={styles.rotationInterval}>{rotationPlan.interval}</Text> 天轮换
                      <Text style={{ color: '#86909C', marginLeft: '8rpx' }}>
                        · 共{rotationShoes.length}双参与
                      </Text>
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: '24rpx',
                    color: '#86909C',
                    marginBottom: '16rpx',
                    display: 'block'
                  }}
                >
                  参与轮换的鞋款：
                </Text>
                <View className={styles.rotationShoes}>
                  {rotationShoes.map((shoe, index) => (
                    <View key={shoe.id} className={styles.rotationShoeTag}>
                      {`${shoe.brand} ${shoe.name}`.length > 12
                        ? `${shoe.brand} ${shoe.name}`.slice(0, 12) + '...'
                        : `${shoe.brand} ${shoe.name}`}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className={styles.rotationEmpty}>
                还没有设置轮换计划
                <Text className={styles.rotationEmptyHint} onClick={handleEditRotation}>
                  点击「创建」开始规划 👆
                </Text>
              </View>
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
                  onClick={() => handleAddRecord()}
                >
                  <Image
                    src={resolveImagePath(shoe.image)}
                    style={{ width: '80rpx', height: '80rpx', borderRadius: '8rpx' }}
                    mode="aspectFill"
                    onError={(e) => console.error('图片加载失败:', e)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: '28rpx', fontWeight: 500, color: '#1D2129' }}>
                      {shoe.brand} {shoe.name}
                    </Text>
                    <Text style={{ fontSize: '24rpx', color: '#FF7D00', marginTop: '4rpx' }}>
                      上次清洁: {shoe.lastCleaned ? dayjs(shoe.lastCleaned).fromNow() : '从未清洁'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: '24rpx', color: '#FF6B35', fontWeight: 500 }}>
                    去清洁 →
                  </Text>
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
                + 登记
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
              careRecords.map((record) => <CareCard key={record.id} record={record} />)
            )}
          </View>
        </View>

        <View className={styles.floatingButton} onClick={handleAddRecord}>
          +
        </View>
      </ScrollView>

      {/* 轮换计划编辑弹窗 */}
      {showRotationModal && (
        <View className={styles.modalOverlay} onClick={closeRotationModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {rotationPlan ? '编辑轮换计划' : '创建轮换计划'}
              </Text>
              <Text className={styles.modalClose} onClick={closeRotationModal}>
                ×
              </Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>
                  选择参与轮换的鞋款（{editShoeIds.length} 已选）
                </Text>
                {shoes.length === 0 ? (
                  <View
                    style={{
                      padding: '32rpx',
                      textAlign: 'center',
                      color: '#86909C',
                      fontSize: '24rpx',
                      background: '#F2F3F5',
                      borderRadius: '12rpx'
                    }}
                  >
                    暂无鞋款，请先到鞋柜添加
                  </View>
                ) : (
                  <View className={styles.modalShoeList}>
                    {shoes.map((shoe) => (
                      <View
                        key={shoe.id}
                        className={classnames(styles.modalShoeItem, {
                          [styles.modalShoeItemSelected]: editShoeIds.includes(shoe.id)
                        })}
                        onClick={() => toggleShoeSelection(shoe.id)}
                      >
                        <Image
                          className={styles.modalShoeItemImage}
                          src={resolveImagePath(shoe.image)}
                          mode="aspectFill"
                          onError={(e) => console.error('图片加载失败:', e)}
                        />
                        <View className={styles.modalShoeItemInfo}>
                          <Text className={styles.modalShoeItemName}>
                            {shoe.brand} {shoe.name}
                          </Text>
                          <Text className={styles.modalShoeItemBrand}>
                            已穿{shoe.totalWears}次 ·{' '}
                            {shoe.lastWorn ? `${dayjs(shoe.lastWorn).fromNow()}穿` : '未穿'}
                          </Text>
                        </View>
                        <View
                          className={classnames(styles.modalShoeCheckbox, {
                            [styles.modalShoeCheckboxChecked]: editShoeIds.includes(shoe.id)
                          })}
                        >
                          {editShoeIds.includes(shoe.id) && '✓'}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>开始日期</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="选择开始日期"
                  placeholderStyle="color: #86909C"
                  value={editStartDate}
                  onInput={(e) => setEditStartDate(e.detail.value)}
                />
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>结束日期</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="选择结束日期"
                  placeholderStyle="color: #86909C"
                  value={editEndDate}
                  onInput={(e) => setEditEndDate(e.detail.value)}
                />
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>轮换间隔</Text>
                <View className={styles.intervalOptions}>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <View
                      key={opt.value}
                      className={classnames(styles.intervalOption, {
                        [styles.intervalOptionActive]: editInterval === opt.value
                      })}
                      onClick={() => setEditInterval(opt.value)}
                    >
                      {opt.label}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <View className={styles.modalBtnCancel} onClick={closeRotationModal}>
                取消
              </View>
              <View className={styles.modalBtnSave} onClick={handleSaveRotation}>
                保存计划
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default CarePage;
