import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useShoeStore } from '@/store/useShoeStore';
import { getSceneText } from '@/utils/weather';
import { getIdleShoes, getTotalWears } from '@/utils/stats';
import ShoeCard from '@/components/ShoeCard';
import StatCard from '@/components/StatCard';
import type { ShoeScene } from '@/types';
import styles from './index.module.scss';

type SortType = 'recent' | 'wears' | 'idle';

const ShoesPage: React.FC = () => {
  const { shoes, selectedScene, setSelectedScene } = useShoeStore();
  const [sortType, setSortType] = useState<SortType>('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const idleShoes = useMemo(() => getIdleShoes(shoes, 7), [shoes]);
  const totalWears = useMemo(() => getTotalWears(shoes), [shoes]);
  const commuteCount = useMemo(() => shoes.filter(s => s.scene.includes('commute')).length, [shoes]);
  const sportCount = useMemo(() => shoes.filter(s => s.scene.includes('sport')).length, [shoes]);
  const casualCount = useMemo(() => shoes.filter(s => s.scene.includes('casual')).length, [shoes]);

  const filteredShoes = useMemo(() => {
    let result = [...shoes];

    if (selectedScene !== 'all') {
      result = result.filter(shoe => shoe.scene.includes(selectedScene));
    }

    switch (sortType) {
      case 'recent':
        result.sort((a, b) => new Date(b.lastWorn || '').getTime() - new Date(a.lastWorn || '').getTime());
        break;
      case 'wears':
        result.sort((a, b) => b.totalWears - a.totalWears);
        break;
      case 'idle':
        result.sort((a, b) => b.idleDays - a.idleDays);
        break;
    }

    return result;
  }, [shoes, selectedScene, sortType]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[ShoesPage] 下拉刷新');
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

  const handleAddShoe = () => {
    Taro.navigateTo({ url: '/pages/add-shoe/index' });
  };

  const handleSortChange = (sort: SortType) => {
    setSortType(sort);
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: 'recent' as SortType, label: '最近穿着' },
    { value: 'wears' as SortType, label: '穿着次数' },
    { value: 'idle' as SortType, label: '闲置时间' }
  ];

  const sceneFilters: { value: ShoeScene | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'commute', label: '通勤' },
    { value: 'sport', label: '运动' },
    { value: 'casual', label: '休闲' }
  ];

  return (
    <ScrollView
      className={styles.pageContainer}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className="container">
        <View className={styles.headerSection}>
          <View className={styles.statsRow}>
            <StatCard
              icon="👟"
              value={shoes.length}
              label="鞋款总数"
              variant="primary"
            />
            <StatCard
              icon="📊"
              value={totalWears}
              label="总穿着数"
              variant="info"
            />
            <StatCard
              icon="⏰"
              value={idleShoes.length}
              label="闲置鞋款"
              variant="warning"
              subtitle="超过7天"
            />
          </View>

          {idleShoes.length > 0 && (
            <View className={styles.idleAlert}>
              <Text className={styles.idleAlertText}>⚠️ 有 {idleShoes.length} 双鞋闲置超过7天</Text>
              <Text className={styles.idleAlertCount}>{idleShoes.length}</Text>
            </View>
          )}

          <View className={styles.filterTabs}>
            {sceneFilters.map((filter) => (
              <View
                key={filter.value}
                className={classnames(
                  styles.filterTab,
                  selectedScene === filter.value && styles.active
                )}
                onClick={() => setSelectedScene(filter.value)}
              >
                {filter.label}
                <Text style={{ marginLeft: '4rpx', opacity: 0.8, fontSize: '22rpx' }}>
                  ({filter.value === 'all' ? shoes.length : shoes.filter(s => s.scene.includes(filter.value as ShoeScene)).length})
                </Text>
              </View>
            ))}
          </View>

          <View className={styles.sortSelector}>
            <View className={styles.sortButton} onClick={() => setShowSortMenu(!showSortMenu)}>
              <Text>排序：{sortOptions.find(o => o.value === sortType)?.label}</Text>
              <Text>▼</Text>
            </View>
          </View>

          {showSortMenu && (
            <View style={{
              position: 'absolute',
              right: '32rpx',
              top: '520rpx',
              background: '#fff',
              borderRadius: '12rpx',
              boxShadow: '0 4rpx 16rpx rgba(0,0,0,0.1)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              {sortOptions.map((option) => (
                <View
                  key={option.value}
                  style={{
                    padding: '24rpx 32rpx',
                    fontSize: '28rpx',
                    color: sortType === option.value ? '#FF6B35' : '#1D2129',
                    background: sortType === option.value ? '#FFF5F0' : '#fff',
                    borderBottom: '1rpx solid #F2F3F5'
                  }}
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </View>
              ))}
            </View>
          )}
        </View>

        {filteredShoes.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📦</Text>
            <Text className={styles.emptyText}>
              {selectedScene === 'all' ? '鞋柜空空如也，快去添加你的第一双鞋吧！' : `没有${getSceneText(selectedScene)}场景的鞋款`}
            </Text>
            <Button className={styles.buttonPrimary} onClick={handleAddShoe}>
              添加鞋款
            </Button>
          </View>
        ) : (
          <View className={styles.shoeGrid}>
            {filteredShoes.map((shoe) => (
              <ShoeCard key={shoe.id} shoe={shoe} />
            ))}
          </View>
        )}
      </View>

      <View className={styles.floatingButton} onClick={handleAddShoe}>
        +
      </View>
    </ScrollView>
  );
};

export default ShoesPage;
