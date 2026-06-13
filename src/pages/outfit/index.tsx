import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Button,
  Textarea
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useShoeStore } from '@/store/useShoeStore';
import { useOutfitStore } from '@/store/useOutfitStore';
import { mockWeatherForecast } from '@/data/mock';
import { getRecommendedShoes, getSceneText, getMaterialText } from '@/utils/weather';
import { saveImagePermanently, resolveImagePath } from '@/utils/storage';
import WeatherCard from '@/components/WeatherCard';
import ShoeCard from '@/components/ShoeCard';
import OutfitCard from '@/components/OutfitCard';
import type { Shoe, ShoeScene } from '@/types';
import styles from './index.module.scss';

const OutfitPage: React.FC = () => {
  const { shoes } = useShoeStore();
  const { records, addRecord, getTodayRecord } = useOutfitStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedShoe, setSelectedShoe] = useState<Shoe | null>(null);
  const [selectedScene, setSelectedScene] = useState<ShoeScene>('commute');
  const [notes, setNotes] = useState('');
  const [outfitImage, setOutfitImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayWeather = mockWeatherForecast[0];
  const todayRecord = getTodayRecord();
  const recommendedShoes = getRecommendedShoes(shoes, todayWeather.condition, 'commute');
  const recentRecords = records.slice(0, 5);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log('[OutfitPage] 下拉刷新');
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

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths || res.tempFiles?.map(f => f.path);
        if (tempFilePaths && tempFilePaths.length > 0) {
          setOutfitImage(tempFilePaths[0]);
          console.log('[OutfitPage] 选择图片:', tempFilePaths[0]);
        }
      },
      fail: (err) => {
        console.error('[OutfitPage] 选择图片失败:', err);
        const fallbackUrl = `https://picsum.photos/seed/outfit-${Date.now()}/600/800`;
        setOutfitImage(fallbackUrl);
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedShoe) {
      Taro.showToast({ title: '请选择鞋款', icon: 'none' });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    Taro.showLoading({ title: '保存中...', mask: true });

    try {
      let savedOutfitImage: string | undefined;
      if (outfitImage) {
        savedOutfitImage = await saveImagePermanently(outfitImage);
        console.log('[OutfitPage] 穿搭照片已转存:', savedOutfitImage);
      }

      const resolvedShoeImage = resolveImagePath(selectedShoe.image);

      addRecord({
        date: dayjs().format('YYYY-MM-DD'),
        shoeId: selectedShoe.id,
        shoeName: `${selectedShoe.brand} ${selectedShoe.name}`,
        shoeImage: resolvedShoeImage,
        outfitImage: savedOutfitImage,
        weather: todayWeather.condition,
        temperature: todayWeather.temperature,
        scene: selectedScene,
        notes
      });

      if (!todayRecord) {
        useShoeStore.getState().markAsWorn(selectedShoe.id);
      }

      setShowModal(false);
      setSelectedShoe(null);
      setNotes('');
      setOutfitImage('');

      Taro.hideLoading();
      Taro.showToast({ title: '记录成功', icon: 'success' });
      console.log('[OutfitPage] 记录穿搭:', selectedShoe.name);
    } catch (e) {
      Taro.hideLoading();
      console.error('[OutfitPage] 保存失败:', e);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShoeSelect = (shoe: Shoe) => {
    setSelectedShoe(shoe);
  };

  const handleViewMonthly = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  const openRecordModal = () => {
    if (todayRecord) {
      Taro.showModal({
        title: '今日已有记录',
        content: '是否覆盖今日的穿搭记录？',
        confirmText: '覆盖记录',
        cancelText: '取消',
        confirmColor: '#FF6B35',
        success: (res) => {
          if (res.confirm) {
            setShowModal(true);
          }
        }
      });
    } else {
      setShowModal(true);
    }
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
        <View className={styles.weatherSection}>
          <WeatherCard weather={todayWeather} shoes={shoes} />
        </View>

        <View className={styles.todayOutfitSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>今日穿搭</Text>
            <Text className={styles.sectionAction} onClick={handleViewMonthly}>
              月度报告 →
            </Text>
          </View>

          {todayRecord ? (
            <View className={styles.recordedCard}>
              <View className={styles.recordedHeader}>
                <Text className={styles.recordedTitle}>✅ 今日已记录</Text>
                <Text className={styles.recordedShoe}>{todayRecord.shoeName}</Text>
                <Text className={styles.recordedTime}>
                  {getSceneText(todayRecord.scene)}
                </Text>
              </View>
              <View className={styles.recordedBody}>
                {todayRecord.outfitImage && (
                  <View className={styles.outfitImageContainer}>
                    <Image
                      className={styles.outfitImage}
                      src={resolveImagePath(todayRecord.outfitImage)}
                      mode="aspectFill"
                      onError={(e) => console.error('[OutfitPage] 图片加载失败:', e.detail)}
                    />
                  </View>
                )}
                {todayRecord.notes && (
                  <Text className={styles.notesText}>{todayRecord.notes}</Text>
                )}
              </View>
              <View className={styles.recordedActions}>
                <View className={styles.recordBtnOutline} onClick={openRecordModal}>
                  重新记录
                </View>
                <View className={styles.recordBtnSmall} onClick={handleViewMonthly}>
                  查看报告
                </View>
              </View>
            </View>
          ) : (
            <View className={styles.noRecordCard}>
              <Text className={styles.noRecordIcon}>👟</Text>
              <Text className={styles.noRecordText}>今天还没记录穿了哪双鞋哦</Text>
              <Button className={styles.recordBtn} onClick={openRecordModal}>
                记录今日穿搭
              </Button>
            </View>
          )}
        </View>

        <View className={styles.recommendSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>为你推荐</Text>
          </View>
          <ScrollView
            className={styles.recommendScroll}
            scrollX
            enhanced
            showScrollbar={false}
          >
            {recommendedShoes.map((shoe) => (
              <View key={shoe.id} className={styles.recommendItem}>
                <ShoeCard shoe={shoe} showStats={false} />
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.historySection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>近期穿搭</Text>
          </View>
          <View className={styles.historyList}>
            {recentRecords.map((record) => (
              <OutfitCard key={record.id} record={record} showOutfitImage={false} />
            ))}
          </View>
        </View>
      </View>

      {/* 悬浮按钮始终显示 */}
      <View className={styles.floatingButton} onClick={openRecordModal}>
        +
      </View>

      {showModal && (
        <View className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {todayRecord ? '覆盖今日穿搭' : '记录今日穿搭'}
              </Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>选择鞋款</Text>
                <ScrollView className={styles.shoeSelectList} scrollY style={{ maxHeight: '400rpx' }}>
                  {shoes.map((shoe) => (
                    <View
                      key={shoe.id}
                      className={classnames(
                        styles.shoeSelectItem,
                        selectedShoe?.id === shoe.id && styles.selected
                      )}
                      onClick={() => handleShoeSelect(shoe)}
                    >
                      <Image
                        className={styles.shoeSelectImage}
                        src={resolveImagePath(shoe.image)}
                        mode="aspectFill"
                        onError={(e) => console.error('[OutfitPage] 图片加载失败:', e)}
                      />
                      <View className={styles.shoeSelectInfo}>
                        <Text className={styles.shoeSelectName}>{shoe.brand} {shoe.name}</Text>
                        <Text className={styles.shoeSelectDesc}>
                          {getMaterialText(shoe.material)} · 已穿{shoe.totalWears}次
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>场景</Text>
                <View className={styles.sceneSelector}>
                  {(['commute', 'sport', 'casual'] as ShoeScene[]).map((scene) => (
                    <View
                      key={scene}
                      className={classnames(
                        styles.sceneOption,
                        selectedScene === scene && styles.selected
                      )}
                      onClick={() => setSelectedScene(scene)}
                    >
                      {getSceneText(scene)}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>搭配照片（可选）</Text>
                {outfitImage ? (
                  <Image
                    className={styles.uploadedImage}
                    src={outfitImage}
                    mode="aspectFill"
                    onClick={handleChooseImage}
                    onError={(e) => console.error('[OutfitPage] 图片加载失败:', e)}
                  />
                ) : (
                  <View className={styles.imageUploadArea} onClick={handleChooseImage}>
                    <Text className={styles.uploadIcon}>📷</Text>
                    <Text className={styles.uploadText}>点击上传搭配照片</Text>
                  </View>
                )}
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>备注（可选）</Text>
                <Textarea
                  className={styles.textarea}
                  placeholder="记录今天的穿搭心得..."
                  value={notes}
                  onInput={(e) => setNotes(e.detail.value)}
                  maxlength={200}
                />
              </View>
            </ScrollView>
            <View className={styles.modalFooter}>
              <Button
                className={styles.buttonSecondary}
                style={{ flex: 1 }}
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className={styles.buttonPrimary}
                style={{ flex: 2 }}
                onClick={handleSubmit}
                loading={isSaving}
                disabled={isSaving}
              >
                {todayRecord ? '覆盖今日记录' : '保存记录'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default OutfitPage;
