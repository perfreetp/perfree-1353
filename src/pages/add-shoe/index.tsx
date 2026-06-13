import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Input,
  Textarea
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { ShoeScene, ShoeMaterial } from '@/types';
import { useShoeStore } from '@/store/useShoeStore';
import { saveImagePermanently, resolveImagePath } from '@/utils/storage';
import styles from './index.module.scss';

const COLOR_OPTIONS = [
  { name: '白色', value: '#FFFFFF', textColor: '#333' },
  { name: '黑色', value: '#1A1A1A', textColor: '#FFF' },
  { name: '红色', value: '#FF4444', textColor: '#FFF' },
  { name: '蓝色', value: '#4488FF', textColor: '#FFF' },
  { name: '绿色', value: '#44CC88', textColor: '#FFF' },
  { name: '黄色', value: '#FFCC00', textColor: '#333' },
  { name: '橙色', value: '#FF8844', textColor: '#FFF' },
  { name: '紫色', value: '#AA66CC', textColor: '#FFF' },
  { name: '粉色', value: '#FF99BB', textColor: '#FFF' },
  { name: '灰色', value: '#888888', textColor: '#FFF' },
  { name: '棕色', value: '#8B5A2B', textColor: '#FFF' },
  { name: '米色', value: '#F5E6CC', textColor: '#333' }
];

const STYLE_OPTIONS = [
  { name: '街头', value: 'street' },
  { name: '复古', value: 'retro' },
  { name: '极简', value: 'minimal' },
  { name: '机能', value: 'tech' },
  { name: '运动', value: 'sporty' },
  { name: '潮流', value: 'fashion' },
  { name: '商务', value: 'business' },
  { name: '休闲', value: 'casual' }
];

const MATERIAL_OPTIONS: { name: string; value: ShoeMaterial }[] = [
  { name: '皮革', value: 'leather' },
  { name: '麂皮', value: 'suede' },
  { name: '帆布', value: 'canvas' },
  { name: '网布', value: 'mesh' },
  { name: '橡胶', value: 'rubber' },
  { name: '合成', value: 'synthetic' }
];

const SCENE_OPTIONS: { name: string; value: ShoeScene }[] = [
  { name: '通勤', value: 'commute' },
  { name: '运动', value: 'sport' },
  { name: '休闲', value: 'casual' }
];

const AddShoePage: React.FC = () => {
  const addShoe = useShoeStore((state) => state.addShoe);

  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [style, setStyle] = useState('');
  const [material, setMaterial] = useState<ShoeMaterial | ''>('');
  const [selectedScenes, setSelectedScenes] = useState<ShoeScene[]>([]);
  const [notes, setNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isSaving, setIsSaving] = useState(false);

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths || res.tempFiles?.map(f => f.path);
        if (tempFilePaths && tempFilePaths.length > 0) {
          setImage(tempFilePaths[0]);
        }
      },
      fail: () => {
        const fallbackUrl = `https://picsum.photos/seed/shoe-${Date.now()}/400/400`;
        setImage(fallbackUrl);
        Taro.showToast({
          title: '使用示例图片',
          icon: 'none'
        });
      }
    });
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < 3 ? [...prev, color] : prev
    );
    if (!selectedColors.includes(color) && selectedColors.length >= 3) {
      Taro.showToast({ title: '最多选3种颜色', icon: 'none' });
    }
  };

  const toggleScene = (scene: ShoeScene) => {
    setSelectedScenes((prev) =>
      prev.includes(scene)
        ? prev.filter((s) => s !== scene)
        : [...prev, scene]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请填写鞋款名称', icon: 'none' });
      return;
    }
    if (!brand.trim()) {
      Taro.showToast({ title: '请填写品牌', icon: 'none' });
      return;
    }
    if (!image) {
      Taro.showToast({ title: '请上传鞋款照片', icon: 'none' });
      return;
    }
    if (!material) {
      Taro.showToast({ title: '请选择材质', icon: 'none' });
      return;
    }
    if (selectedScenes.length === 0) {
      Taro.showToast({ title: '请选择适用场景', icon: 'none' });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    Taro.showLoading({ title: '保存中...', mask: true });

    try {
      let savedImage = image;
      if (image && !image.startsWith('http://') && !image.startsWith('https://')) {
        savedImage = await saveImagePermanently(image);
        console.log('[AddShoe] 鞋款照片已转存:', savedImage);
      }

      const finalImage = savedImage || `https://picsum.photos/seed/${Date.now()}/400/400`;
      const finalColors = selectedColors.length > 0 ? selectedColors : ['#FFFFFF'];
      const finalStyle = style || 'casual';

      addShoe({
        name: name.trim(),
        brand: brand.trim(),
        image: finalImage,
        colors: finalColors,
        style: finalStyle,
        scene: selectedScenes,
        material: material as ShoeMaterial,
        purchaseDate,
        notes: notes.trim()
      });

      Taro.hideLoading();
      Taro.showToast({ title: '添加成功！', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 800);
    } catch (e) {
      Taro.hideLoading();
      console.error('[AddShoe] 保存失败:', e);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <>
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.sectionTitle}>鞋款照片</View>
        <View className={styles.formCard}>
          <View className={styles.imageUploader} onClick={handleChooseImage}>
            {image ? (
              <Image className={styles.uploadedImage} src={resolveImagePath(image)} mode="aspectFill" />
            ) : (
              <>
                <Text className={styles.uploadIcon}>📷</Text>
                <Text className={styles.uploadText}>点击上传照片</Text>
              </>
            )}
          </View>
        </View>

        <View className={styles.sectionTitle}>基本信息</View>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>品牌 *</Text>
            <Input
              className={styles.formInput}
              placeholder="如：Nike、Adidas、李宁"
              placeholderStyle="color: #86909C"
              value={brand}
              onInput={(e) => setBrand(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>鞋款名称 *</Text>
            <Input
              className={styles.formInput}
              placeholder="如：Air Jordan 1 High"
              placeholderStyle="color: #86909C"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>购入日期</Text>
            <Input
              className={styles.formInput}
              type="text"
              placeholder="选择日期"
              placeholderStyle="color: #86909C"
              value={purchaseDate}
              onInput={(e) => setPurchaseDate(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.sectionTitle}>颜色（最多3种）</View>
        <View className={styles.formCard}>
          <View className={styles.colorOptions}>
            {COLOR_OPTIONS.map((color) => (
              <View
                key={color.value}
                className={classnames(styles.colorItem, {
                  [styles.colorItemActive]: selectedColors.includes(color.value)
                })}
                style={{ background: color.value }}
                onClick={() => toggleColor(color.value)}
              >
                {selectedColors.includes(color.value) && (
                  <Text
                    className={styles.colorCheck}
                    style={{ color: color.value === '#FFFFFF' || color.value === '#FFCC00' || color.value === '#F5E6CC' ? '#333' : '#FFF' }}
                  >
                    ✓
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionTitle}>风格</View>
        <View className={styles.formCard}>
          <ScrollView className={styles.optionsWrap} scrollX showScrollbar={false}>
            <View className={styles.optionsRow}>
              {STYLE_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={classnames(styles.optionItem, {
                    [styles.optionItemActive]: style === opt.value
                  })}
                  onClick={() => setStyle(opt.value)}
                >
                  {opt.name}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={styles.sectionTitle}>材质 *</View>
        <View className={styles.formCard}>
          <ScrollView className={styles.optionsWrap} scrollX showScrollbar={false}>
            <View className={styles.optionsRow}>
              {MATERIAL_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={classnames(styles.optionItem, {
                    [styles.optionItemActive]: material === opt.value
                  })}
                  onClick={() => setMaterial(opt.value)}
                >
                  {opt.name}
                </View>
              ))}
            </View>
          </ScrollView>
          {material === 'suede' && (
            <Text style={{ fontSize: '24rpx', color: '#FF9500', marginTop: '24rpx' }}>
              ⚠️ 麂皮鞋款雨天穿着需注意防水
            </Text>
          )}
        </View>

        <View className={styles.sectionTitle}>适用场景 *（可多选）</View>
        <View className={styles.formCard}>
          <View className={styles.optionsRow} style={{ padding: 0, margin: 0 }}>
            {SCENE_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                className={classnames(styles.optionItem, {
                  [styles.optionItemActive]: selectedScenes.includes(opt.value)
                })}
                onClick={() => toggleScene(opt.value)}
              >
                {opt.name}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionTitle}>备注</View>
        <View className={styles.formCard}>
          <Textarea
            className={styles.formTextarea}
            placeholder="可记录鞋款故事、购买渠道、特殊注意事项等..."
            placeholderStyle="color: #86909C"
            value={notes}
            onInput={(e) => setNotes(e.detail.value)}
            maxlength={200}
          />
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.btnCancel} onClick={handleCancel}>
          取消
        </View>
        <View className={styles.btnSave} onClick={handleSave}>
          保存鞋款
        </View>
      </View>
    </>
  );
};

export default AddShoePage;
