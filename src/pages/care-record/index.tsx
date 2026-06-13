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
import type { CareType } from '@/types';
import { useShoeStore } from '@/store/useShoeStore';
import { useCareStore } from '@/store/useCareStore';
import { resolveImagePath } from '@/utils/storage';
import styles from './index.module.scss';

const TYPE_OPTIONS: { name: string; value: CareType; icon: string; desc: string }[] = [
  { name: '清洁', value: 'clean', icon: '🧹', desc: '鞋面清洁、去污处理' },
  { name: '防水', value: 'waterproof', icon: '🌧️', desc: '防水喷雾、涂层处理' },
  { name: '护理', value: 'condition', icon: '✨', desc: '皮革护理、油膏保养' },
  { name: '修补', value: 'repair', icon: '🔧', desc: '开胶修复、换底等' }
];

const CareRecordPage: React.FC = () => {
  const shoes = useShoeStore((state) => state.shoes);
  const addCareRecord = useCareStore((state) => state.addCareRecord);
  const careProducts = useCareStore((state) => state.careProducts);
  const markAsCleaned = useShoeStore((state) => state.markAsCleaned);

  const [selectedShoeId, setSelectedShoeId] = useState('');
  const [careType, setCareType] = useState<CareType | ''>('');
  const [careDate, setCareDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customProduct, setCustomProduct] = useState('');
  const [notes, setNotes] = useState('');

  const selectedShoe = shoes.find((s) => s.id === selectedShoeId);

  const toggleProduct = (productName: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productName)
        ? prev.filter((p) => p !== productName)
        : [...prev, productName]
    );
  };

  const handleAddCustomProduct = () => {
    if (!customProduct.trim()) return;
    if (selectedProducts.includes(customProduct.trim())) {
      setCustomProduct('');
      return;
    }
    setSelectedProducts((prev) => [...prev, customProduct.trim()]);
    setCustomProduct('');
  };

  const handleSave = () => {
    if (!selectedShoeId) {
      Taro.showToast({ title: '请选择鞋款', icon: 'none' });
      return;
    }
    if (!careType) {
      Taro.showToast({ title: '请选择保养类型', icon: 'none' });
      return;
    }
    if (!careDate) {
      Taro.showToast({ title: '请选择保养日期', icon: 'none' });
      return;
    }

    if (!selectedShoe) return;

    addCareRecord({
      shoeId: selectedShoe.id,
      shoeName: `${selectedShoe.brand} ${selectedShoe.name}`,
      type: careType as CareType,
      date: careDate,
      products: selectedProducts,
      notes: notes.trim()
    });

    if (careType === 'clean') {
      markAsCleaned(selectedShoe.id, careDate);
    }

    Taro.showToast({ title: '登记成功！', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 800);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <>
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.sectionTitle}>选择鞋款 *</View>
        <View className={styles.formCard}>
          {shoes.length === 0 ? (
            <View className={styles.emptyHint}>暂无鞋款，请先添加鞋款</View>
          ) : (
            <ScrollView className={styles.shoeList} scrollY>
              {shoes.map((shoe) => (
                <View
                  key={shoe.id}
                  className={styles.shoeOption}
                  onClick={() => setSelectedShoeId(shoe.id)}
                >
                  <Image
                    className={styles.shoeOptionImage}
                    src={resolveImagePath(shoe.image)}
                    mode="aspectFill"
                    onError={(e) => console.error('图片加载失败:', e)}
                  />
                  <View className={styles.shoeOptionInfo}>
                    <Text className={styles.shoeOptionName}>
                      {shoe.brand} {shoe.name}
                    </Text>
                    <Text className={styles.shoeOptionBrand}>
                      {shoe.lastCleaned
                        ? `上次清洁: ${dayjs(shoe.lastCleaned).fromNow()}`
                        : '暂无清洁记录'}
                    </Text>
                  </View>
                  <View
                    className={classnames(styles.shoeOptionCheck, {
                      [styles.shoeOptionCheckActive]: selectedShoeId === shoe.id
                    })}
                  >
                    {selectedShoeId === shoe.id && (
                      <Text className={styles.shoeOptionCheckIcon}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View className={styles.sectionTitle}>保养类型 *</View>
        <View className={styles.formCard}>
          <ScrollView className={styles.optionsWrap} scrollX showScrollbar={false}>
            <View className={styles.optionsRow}>
              {TYPE_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={classnames(styles.optionItem, {
                    [styles.optionItemActive]: careType === opt.value
                  })}
                  onClick={() => setCareType(opt.value)}
                >
                  <Text className={styles.typeIcon}>{opt.icon}</Text>
                  {opt.name}
                </View>
              ))}
            </View>
          </ScrollView>
          {careType && (
            <Text
              style={{
                fontSize: '24rpx',
                color: '#86909C',
                marginTop: '24rpx',
                lineHeight: '1.6'
              }}
            >
              💡 {TYPE_OPTIONS.find((t) => t.value === careType)?.desc}
            </Text>
          )}
        </View>

        <View className={styles.sectionTitle}>保养信息</View>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>保养日期</Text>
            <Input
              className={styles.formInput}
              placeholder="选择日期"
              placeholderStyle="color: #86909C"
              value={careDate}
              onInput={(e) => setCareDate(e.detail.value)}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>使用用品（可多选）</Text>
            <View className={styles.productsWrap}>
              {careProducts.map((product) => (
                <View
                  key={product.id}
                  className={classnames(styles.productTag, {
                    [styles.productTagActive]: selectedProducts.includes(product.name)
                  })}
                  onClick={() => toggleProduct(product.name)}
                >
                  {selectedProducts.includes(product.name) && <Text>✓</Text>}
                  {product.name}
                </View>
              ))}
              <View
                className={styles.productTagAdd}
                onClick={() => {
                  if (customProduct.trim()) {
                    handleAddCustomProduct();
                  }
                }}
              >
                + 添加用品
              </View>
            </View>
            {selectedProducts.length > 0 && (
              <View
                style={{
                  marginTop: '24rpx',
                  padding: '16rpx 24rpx',
                  background: '#F2F3F5',
                  borderRadius: '12rpx',
                  fontSize: '24rpx',
                  color: '#4E5969'
                }}
              >
                已选: {selectedProducts.join('、')}
              </View>
            )}
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>自定义用品名称</Text>
            <Input
              className={styles.formInput}
              placeholder="输入后点击上方+添加"
              placeholderStyle="color: #86909C"
              value={customProduct}
              onInput={(e) => setCustomProduct(e.detail.value)}
              confirmType="done"
              onConfirm={handleAddCustomProduct}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="记录保养步骤、注意事项、下次保养提醒等..."
              placeholderStyle="color: #86909C"
              value={notes}
              onInput={(e) => setNotes(e.detail.value)}
              maxlength={300}
            />
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.btnCancel} onClick={handleCancel}>
          取消
        </View>
        <View className={styles.btnSave} onClick={handleSave}>
          登记保养
        </View>
      </View>
    </>
  );
};

export default CareRecordPage;
