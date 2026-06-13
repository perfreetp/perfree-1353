import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { ShoeScene, OutfitRecord } from '@/types';
import { useOutfitStore } from '@/store/useOutfitStore';
import { useShoeStore } from '@/store/useShoeStore';
import { getSceneText, getWeatherIcon } from '@/utils/weather';
import { resolveImagePath } from '@/utils/storage';
import styles from './index.module.scss';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const SCENE_STYLES: Record<ShoeScene, { bg: string; color: string }> = {
  commute: { bg: 'rgba(68, 136, 255, 0.12)', color: '#4488FF' },
  sport: { bg: 'rgba(68, 204, 136, 0.12)', color: '#44CC88' },
  casual: { bg: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35' }
};

const SCENE_BAR_COLORS: Record<ShoeScene, string> = {
  commute: 'linear-gradient(90deg, #4488FF, #66AAFF)',
  sport: 'linear-gradient(90deg, #44CC88, #66DD99)',
  casual: 'linear-gradient(90deg, #FF6B35, #FF8A5B)'
};

const MonthlyReportPage: React.FC = () => {
  const records = useOutfitStore((state) => state.records);
  const shoes = useShoeStore((state) => state.shoes);

  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));

  const reportData = useMemo(() => {
    const monthRecords = records
      .filter((r) => r.date.startsWith(currentMonth))
      .sort((a, b) => b.date.localeCompare(a.date));

    const uniqueShoeCount = new Set(monthRecords.map((r) => r.shoeId)).size;
    const uniqueDays = new Set(monthRecords.map((r) => r.date)).size;

    const shoeCountMap = new Map<string, { count: number; name: string; image: string }>();
    const sceneCountMap = new Map<ShoeScene, number>();

    monthRecords.forEach((record) => {
      const existing = shoeCountMap.get(record.shoeId);
      if (existing) {
        existing.count += 1;
      } else {
        const shoe = shoes.find((s) => s.id === record.shoeId);
        shoeCountMap.set(record.shoeId, {
          count: 1,
          name: record.shoeName,
          image: record.shoeImage || shoe?.image || ''
        });
      }
      sceneCountMap.set(record.scene, (sceneCountMap.get(record.scene) || 0) + 1);
    });

    let mostWorn = null;
    let maxCount = 0;
    shoeCountMap.forEach((data) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostWorn = data;
      }
    });

    const sceneStats = Array.from(sceneCountMap.entries())
      .map(([scene, count]) => ({
        scene,
        count,
        percent: monthRecords.length > 0 ? Math.round((count / monthRecords.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      monthRecords,
      totalWears: monthRecords.length,
      uniqueShoeCount,
      uniqueDays,
      mostWorn,
      sceneStats
    };
  }, [records, shoes, currentMonth]);

  const goPrevMonth = () => {
    setCurrentMonth((prev) => dayjs(prev + '-01').subtract(1, 'month').format('YYYY-MM'));
  };

  const goNextMonth = () => {
    const nextMonth = dayjs(currentMonth + '-01').add(1, 'month');
    if (nextMonth.isAfter(dayjs().startOf('month'))) {
      return;
    }
    setCurrentMonth((prev) => nextMonth.format('YYYY-MM'));
  };

  const formatDailyRecords = (records: OutfitRecord[]) => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const grouped: { [key: string]: OutfitRecord } = {};
    sorted.forEach((record) => {
      if (!grouped[record.date]) {
        grouped[record.date] = record;
      }
    });
    return Object.entries(grouped).map(([date, record]) => ({
      date,
      record
    }));
  };

  const dailyList = formatDailyRecords(reportData.monthRecords);

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.headerCard}>
        <View className={styles.headerTop}>
          <Text className={styles.monthLabel}>
            {dayjs(currentMonth + '-01').format('YYYY年M月')}
          </Text>
          <View className={styles.navBtns}>
            <View className={styles.navBtn} onClick={goPrevMonth}>
              ‹
            </View>
            <View className={styles.navBtn} onClick={goNextMonth}>
              ›
            </View>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{reportData.totalWears}</Text>
            <Text className={styles.statLabel}>次穿着</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{reportData.uniqueDays}</Text>
            <Text className={styles.statLabel}>天记录</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{reportData.uniqueShoeCount}</Text>
            <Text className={styles.statLabel}>双鞋款</Text>
          </View>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        🏆 本月穿着最多
      </View>
      <View className={styles.sectionCard}>
        {reportData.mostWorn ? (
          <View className={styles.mostWornCard}>
            <Image
              className={styles.mostWornImage}
              src={resolveImagePath(reportData.mostWorn.image)}
              mode="aspectFill"
              onError={(e) => console.error('图片加载失败:', e)}
            />
            <View className={styles.mostWornInfo}>
              <View className={styles.mostWornBadge}>👑 本月MVP</View>
              <Text className={styles.mostWornName}>{reportData.mostWorn.name}</Text>
              <Text className={styles.mostWornCount}>
                共穿着 <Text className={styles.mostWornHighlight}>{reportData.mostWorn.count}</Text> 次
              </Text>
            </View>
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>👟</Text>
            <Text className={styles.emptyText}>本月暂无穿着记录</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionTitle}>
        📊 场景分布
      </View>
      <View className={styles.sectionCard}>
        {reportData.sceneStats.length > 0 ? (
          <View className={styles.sceneStats}>
            {reportData.sceneStats.map((item) => (
              <View key={item.scene} className={styles.sceneItem}>
                <Text className={styles.sceneLabel}>{getSceneText(item.scene)}</Text>
                <View className={styles.sceneBarWrap}>
                  <View
                    className={styles.sceneBar}
                    style={{
                      width: `${item.percent}%`,
                      background: SCENE_BAR_COLORS[item.scene]
                    }}
                  />
                </View>
                <Text className={styles.sceneCount}>
                  {item.count}次 · {item.percent}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无场景数据</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionTitle}>
        📅 每日穿搭记录
      </View>
      <View className={styles.sectionCard}>
        {dailyList.length > 0 ? (
          <View className={styles.dailyList}>
            {dailyList.map(({ date, record }) => {
              const d = dayjs(date);
              const sceneStyle = SCENE_STYLES[record.scene];
              return (
                <View key={date} className={styles.dailyItem}>
                  <View className={styles.dailyDate}>
                    <Text className={styles.dailyDay}>{d.format('D')}</Text>
                    <Text className={styles.dailyWeekday}>周{WEEKDAYS[d.day()]}</Text>
                  </View>
                  <Image
                    className={styles.dailyImage}
                    src={resolveImagePath(record.shoeImage)}
                    mode="aspectFill"
                    onError={(e) => console.error('图片加载失败:', e)}
                  />
                  <View className={styles.dailyInfo}>
                    <Text className={styles.dailyName}>{record.shoeName}</Text>
                    <View className={styles.dailyMeta}>
                      <View
                        className={styles.dailySceneTag}
                        style={{ background: sceneStyle.bg, color: sceneStyle.color }}
                      >
                        {getSceneText(record.scene)}
                      </View>
                      <Text className={styles.dailyWeather}>
                        {getWeatherIcon(record.weather)} {record.temperature}°C
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>
              本月还没有穿搭记录
              {'\n'}
              快去记录今天穿了什么鞋吧！
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MonthlyReportPage;
