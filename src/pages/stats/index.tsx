import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useShoeStore } from '@/store/useShoeStore';
import { useOutfitStore } from '@/store/useOutfitStore';
import {
  getMostWornShoes,
  getIdleShoes,
  getTotalWears,
  getWeeklyTrend,
  getSceneStats,
  getWearFrequency
} from '@/utils/stats';
import { getSceneText } from '@/utils/weather';
import StatCard from '@/components/StatCard';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const { shoes } = useShoeStore();
  const { records, generateMonthlyReport } = useOutfitStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[StatsPage] 下拉刷新');
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

  const totalWears = useMemo(() => getTotalWears(shoes), [shoes]);
  const mostWornShoes = useMemo(() => getMostWornShoes(shoes, 5), [shoes]);
  const idleShoes = useMemo(() => getIdleShoes(shoes, 7), [shoes]);
  const weeklyTrend = useMemo(() => getWeeklyTrend(records, 7), [records]);
  const sceneStats = useMemo(() => getSceneStats(records), [records]);
  const monthlyReport = useMemo(() => 
    generateMonthlyReport(dayjs().format('YYYY-MM')),
    [generateMonthlyReport]
  );

  const maxTrendValue = Math.max(...weeklyTrend.map(t => t.count), 1);
  const maxSceneValue = Math.max(...Object.values(sceneStats), 1);

  const handleViewMonthly = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  return (
    <ScrollView
      className={styles.pageContainer}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className="container">
        <View className={styles.statsGrid}>
          <StatCard
            icon="👟"
            value={shoes.length}
            label="鞋款总数"
            variant="primary"
          />
          <StatCard
            icon="📊"
            value={totalWears}
            label="总穿着次数"
            variant="info"
          />
          <StatCard
            icon="🏆"
            value={monthlyReport.mostWorn?.count || 0}
            label="本月穿着最多"
            variant="success"
            subtitle={monthlyReport.mostWorn?.shoeName?.slice(0, 8) || '-'}
          />
          <StatCard
            icon="⏰"
            value={idleShoes.length}
            label="闲置鞋款"
            variant="warning"
            subtitle="超过7天"
          />
        </View>

        <View className={styles.monthlySection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📅 本月概览</Text>
            <Text className={styles.sectionAction} onClick={handleViewMonthly}>
              查看详情 →
            </Text>
          </View>
          <View className={styles.monthlyCard} onClick={handleViewMonthly}>
            <View className={styles.monthlyHeader}>
              <Text className={styles.monthlyTitle}>
                {dayjs().format('YYYY年MM月')}
              </Text>
              <Text>查看详情 →</Text>
            </View>
            <View className={styles.monthlyStats}>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>{monthlyReport.totalWears}</Text>
                <Text className={styles.monthlyStatLabel}>总穿着</Text>
              </View>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>
                  {monthlyReport.byScene.find(s => s.scene === 'commute')?.count || 0}
                </Text>
                <Text className={styles.monthlyStatLabel}>通勤</Text>
              </View>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>
                  {monthlyReport.byScene.find(s => s.scene === 'sport')?.count || 0}
                </Text>
                <Text className={styles.monthlyStatLabel}>运动</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.trendSection}>
          <Text className={styles.trendHeader}>📈 近7天穿着趋势</Text>
          <View className={styles.trendChart}>
            <View className={styles.trendBars}>
              {weeklyTrend.map((item, index) => (
                <View key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {item.count > 0 && (
                    <Text className={styles.trendValue}>{item.count}</Text>
                  )}
                  <View
                    className={styles.trendBar}
                    style={{ height: `${(item.count / maxTrendValue) * 160 + 8}rpx` }}
                  />
                  <Text className={styles.trendLabel}>
                    {dayjs(item.date).format('MM/DD')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.sceneSection}>
          <Text className={styles.sceneTitle}>🎯 场景分布</Text>
          <View className={styles.sceneChart}>
            {(['commute', 'sport', 'casual'] as const).map((scene) => (
              <View key={scene} className={styles.sceneItem}>
                <Text className={styles.sceneLabel}>{getSceneText(scene)}</Text>
                <View className={styles.sceneBarContainer}>
                  <View
                    className={classnames(styles.sceneBar, styles[scene])}
                    style={{ width: `${(sceneStats[scene] / maxSceneValue) * 100}%` }}
                  />
                </View>
                <Text className={styles.sceneValue}>{sceneStats[scene]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.mostWornSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🏆 穿着排行</Text>
          </View>
          <View className={styles.rankingList}>
            {mostWornShoes.map((shoe, index) => (
              <View
                key={shoe.id}
                className={styles.rankingItem}
                onClick={() => Taro.navigateTo({ url: `/pages/shoe-detail/index?id=${shoe.id}` })}
              >
                <Text
                  className={classnames(
                    styles.rankingNumber,
                    index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : index === 2 ? styles.rank3 : styles.other
                  )}
                >
                  {index + 1}
                </Text>
                <Image
                  className={styles.rankingImage}
                  src={shoe.image}
                  mode="aspectFill"
                />
                <View className={styles.rankingInfo}>
                  <Text className={styles.rankingName}>{shoe.name}</Text>
                  <Text className={styles.rankingDesc}>
                    {shoe.brand} · {getWearFrequency(shoe)}
                  </Text>
                </View>
                <Text className={styles.rankingCount}>
                  {shoe.totalWears}
                  <Text className={styles.rankingUnit}>次</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {idleShoes.length > 0 && (
          <View className={styles.idleSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>⏰ 闲置提醒</Text>
            </View>
            <View className={styles.idleList}>
              {idleShoes.slice(0, 3).map((shoe) => (
                <View
                  key={shoe.id}
                  className={styles.idleCard}
                  onClick={() => Taro.navigateTo({ url: `/pages/shoe-detail/index?id=${shoe.id}` })}
                >
                  <Image
                    className={styles.idleImage}
                    src={shoe.image}
                    mode="aspectFill"
                  />
                  <View className={styles.idleInfo}>
                    <Text className={styles.idleName}>{shoe.name}</Text>
                    <Text className={styles.idleDays}>
                      已闲置 {shoe.idleDays} 天
                    </Text>
                    <Text className={styles.idleWears}>
                      总穿着 {shoe.totalWears} 次 · 上次穿着 {dayjs(shoe.lastWorn).fromNow()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default StatsPage;
