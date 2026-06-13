import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Input
} from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import type { ShoeScene, ShoeMaterial, CareRecord } from '@/types';
import { useShoeStore } from '@/store/useShoeStore';
import { useOutfitStore } from '@/store/useOutfitStore';
import { useCareStore } from '@/store/useCareStore';
import {
  getSceneText,
  getMaterialText,
  getStyleText,
  isMaterialSensitiveToRain
} from '@/utils/weather';
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

const CARE_TYPE_TEXT: Record<string, { text: string; icon: string }> = {
  clean: { text: '清洁', icon: '🧹' },
  waterproof: { text: '防水', icon: '🌧️' },
  condition: { text: '护理', icon: '✨' },
  repair: { text: '修补', icon: '🔧' }
};

const ShoeDetailPage: React.FC = () => {
  const router = Taro.useRouter();
  const shoeId = router.params?.id as string;

  const { shoes, updateShoe, deleteShoe } = useShoeStore();
  const { records: outfitRecords } = useOutfitStore();
  const { careRecords } = useCareStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBrand, setEditBrand] = useState('');
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editColors, setEditColors] = useState<string[]>([]);
  const [editStyle, setEditStyle] = useState('');
  const [editMaterial, setEditMaterial] = useState<ShoeMaterial | ''>('');
  const [editScenes, setEditScenes] = useState<ShoeScene[]>([]);
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const shoe = useMemo(() => shoes.find((s) => s.id === shoeId), [shoes, shoeId]);

  const shoeOutfitRecords = useMemo(() => {
    if (!shoe) return [];
    return outfitRecords
      .filter((r) => r.shoeId === shoeId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [outfitRecords, shoeId, shoe]);

  const shoeCareRecords = useMemo(() => {
    if (!shoe) return [];
    return careRecords
      .filter((r) => r.shoeId === shoeId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [careRecords, shoeId, shoe]);

  useEffect(() => {
    if (shoe && showEditModal) {
      setEditBrand(shoe.brand);
      setEditName(shoe.name);
      setEditImage(shoe.image);
      setEditColors([...shoe.colors]);
      setEditStyle(shoe.style);
      setEditMaterial(shoe.material);
      setEditScenes([...shoe.scene]);
      setEditPurchaseDate(shoe.purchaseDate);
      setEditNotes(shoe.notes || '');
    }
  }, [shoe, showEditModal]);

  if (!shoe) {
    return (
      <ScrollView className={styles.pageContainer} scrollY>
        <View className={styles.emptyState} style={{ marginTop: '200rpx' }}>
          <Text className={styles.emptyIcon}>👟</Text>
          <Text className={styles.emptyText}>未找到鞋款信息</Text>
        </View>
      </ScrollView>
    );
  }

  const handleBack = () => {
    Taro.navigateBack();
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths || res.tempFiles?.map(f => f.path);
        if (tempFilePaths && tempFilePaths.length > 0) {
          setEditImage(tempFilePaths[0]);
        }
      },
      fail: () => {
        const fallbackUrl = `https://picsum.photos/seed/shoe-${Date.now()}/400/400`;
        setEditImage(fallbackUrl);
      }
    });
  };

  const toggleColor = (color: string) => {
    setEditColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : prev.length < 3 ? [...prev, color] : prev
    );
    if (!editColors.includes(color) && editColors.length >= 3) {
      Taro.showToast({ title: '最多选3种颜色', icon: 'none' });
    }
  };

  const toggleScene = (scene: ShoeScene) => {
    setEditScenes((prev) =>
      prev.includes(scene)
        ? prev.filter((s) => s !== scene)
        : [...prev, scene]
    );
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Taro.showToast({ title: '请填写鞋款名称', icon: 'none' });
      return;
    }
    if (!editBrand.trim()) {
      Taro.showToast({ title: '请填写品牌', icon: 'none' });
      return;
    }
    if (!editMaterial) {
      Taro.showToast({ title: '请选择材质', icon: 'none' });
      return;
    }
    if (editScenes.length === 0) {
      Taro.showToast({ title: '请选择适用场景', icon: 'none' });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    Taro.showLoading({ title: '保存中...', mask: true });

    try {
      let savedImage = editImage;
      if (editImage && !editImage.startsWith('http://') && !editImage.startsWith('https://')) {
        savedImage = await saveImagePermanently(editImage);
      }

      const finalColors = editColors.length > 0 ? editColors : ['#FFFFFF'];
      const finalStyle = editStyle || 'casual';

      updateShoe(shoeId, {
        name: editName.trim(),
        brand: editBrand.trim(),
        image: savedImage,
        colors: finalColors,
        style: finalStyle,
        scene: editScenes,
        material: editMaterial as ShoeMaterial,
        purchaseDate: editPurchaseDate,
        notes: editNotes.trim()
      });

      Taro.hideLoading();
      Taro.showToast({ title: '修改成功', icon: 'success' });
      setShowEditModal(false);
    } catch (e) {
      Taro.hideLoading();
      console.error('[ShoeDetail] 保存失败:', e);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '删除鞋款',
      content: `确定要删除「${shoe.brand} ${shoe.name}」吗？\n\n删除后该鞋款的穿搭记录和保养记录仍会保留。`,
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          deleteShoe(shoeId);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 800);
        }
      }
    });
  };

  const handleRecordCare = () => {
    Taro.navigateTo({ url: '/pages/care-record/index' });
  };

  const isSensitive = isMaterialSensitiveToRain(shoe.material);
  const lastCleanedDays = shoe.lastCleaned
    ? dayjs().diff(dayjs(shoe.lastCleaned), 'day')
    : null;
  const needsCleaning = lastCleanedDays !== null && lastCleanedDays > 14;

  const getSceneTagClass = (scene: ShoeScene) => {
    const map = { commute: styles.recordTagCommute, sport: styles.recordTagSport, casual: styles.recordTagCasual };
    return map[scene];
  };

  const getCareTagClass = (type: string) => {
    const map = {
      clean: styles.recordTagClean,
      waterproof: styles.recordTagWaterproof,
      condition: styles.recordTagCondition,
      repair: styles.recordTagRepair
    };
    return map[type as keyof typeof map] || '';
  };

  return (
    <>
      <ScrollView className={styles.pageContainer} scrollY>
        {/* 头部渐变区域 */}
        <View className={styles.headerSection}>
          <View className={styles.backBtn} onClick={handleBack}>
            ‹
          </View>
          <View className={styles.editBtn} onClick={handleEdit}>
            编辑
          </View>

          <View className={styles.shoeImageSection}>
            <View className={styles.shoeImageWrap}>
              <Image
                className={styles.shoeImage}
                src={resolveImagePath(shoe.image)}
                mode="aspectFill"
                onError={(e) => console.error('[ShoeDetail] 图片加载失败:', e)}
              />
            </View>
          </View>

          <Text className={styles.shoeName}>{shoe.name}</Text>
          <Text className={styles.shoeBrand}>{shoe.brand}</Text>

          <View className={styles.colorTags}>
            {shoe.colors.map((color, index) => (
              <View
                key={index}
                className={styles.colorDot}
                style={{ backgroundColor: color }}
              />
            ))}
          </View>

          <View className={styles.sceneTags}>
            {shoe.scene.map((scene) => (
              <Text key={scene} className={styles.sceneTag}>
                {getSceneText(scene)}
              </Text>
            ))}
          </View>
        </View>

        {/* 内容区域 */}
        <View className={styles.contentSection}>
          {/* 统计卡片 */}
          <View className={styles.statsGrid}>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{shoe.totalWears}</Text>
              <Text className={styles.statLabel}>总穿着</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{shoe.idleDays}</Text>
              <Text className={styles.statLabel}>闲置天数</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statValue}>{shoeCareRecords.length}</Text>
              <Text className={styles.statLabel}>保养次数</Text>
            </View>
          </View>

          {/* 基本信息 */}
          <View className={styles.infoCard}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>🧵 材质</Text>
              <Text className={styles.infoValue}>
                {getMaterialText(shoe.material)}
                {isSensitive && (
                  <Text style={{ color: '#FF9800', marginLeft: '8rpx' }}>⚠️</Text>
                )}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>🎨 风格</Text>
              <Text className={styles.infoValue}>{getStyleText(shoe.style)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>📆 购入日期</Text>
              <Text className={styles.infoValue}>
                {shoe.purchaseDate
                  ? dayjs(shoe.purchaseDate).format('YYYY年M月D日')
                  : '未记录'}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>👕 上次穿着</Text>
              <Text className={classnames(styles.infoValue, {
                [styles.infoValueWarning]: shoe.isIdle
              })}>
                {shoe.lastWorn
                  ? dayjs(shoe.lastWorn).fromNow()
                  : '未穿'}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>🧼 上次清洁</Text>
              <Text className={classnames(styles.infoValue, {
                [styles.infoValueHighlight]: needsCleaning
              })}>
                {shoe.lastCleaned
                  ? `${dayjs(shoe.lastCleaned).format('YYYY年M月D日')} (${lastCleanedDays}天前)`
                  : '未清洁'}
              </Text>
            </View>
            {isSensitive && (
              <View className={styles.sensitiveHint}>
                ⚠️ {shoe.material === 'suede' ? '麂皮' : '该材质'}鞋款雨天穿着需注意防水，建议避免沾水
              </View>
            )}
            {shoe.notes && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>📝 备注</Text>
                <Text className={styles.infoValue} style={{ textAlign: 'left', flex: 1 }}>
                  {shoe.notes}
                </Text>
              </View>
            )}
          </View>

          {/* 最近穿搭记录 */}
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>👕 最近穿搭</Text>
            <Text className={styles.sectionAction}>{shoeOutfitRecords.length}条记录</Text>
          </View>
          {shoeOutfitRecords.length > 0 ? (
            shoeOutfitRecords.map((record) => {
              const d = dayjs(record.date);
              return (
                <View key={record.id} className={styles.recordItem}>
                  <View className={styles.recordDate}>
                    <Text className={styles.recordDay}>{d.format('D')}</Text>
                    <Text className={styles.recordMonth}>{d.format('M月')}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text className={styles.recordTitle}>
                      {getSceneText(record.scene)}
                      {record.notes && ` · ${record.notes.slice(0, 20)}`}
                    </Text>
                    <View className={styles.recordMeta}>
                      <Text className={classnames(styles.recordTag, getSceneTagClass(record.scene))}>
                        {getSceneText(record.scene)}
                      </Text>
                      <Text>🌡️ {record.temperature}°C</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>👟</Text>
              <Text className={styles.emptyText}>暂无穿搭记录<br/>快去今日穿搭记录吧！</Text>
            </View>
          )}

          {/* 保养记录 */}
          <View className={styles.sectionHeader} style={{ marginTop: '32rpx' }}>
            <Text className={styles.sectionTitle}>🧹 保养记录</Text>
            <Text className={styles.sectionAction} onClick={handleRecordCare}>
              + 登记
            </Text>
          </View>
          {shoeCareRecords.length > 0 ? (
            shoeCareRecords.map((record: CareRecord & { type: string }) => {
              const d = dayjs(record.date);
              const typeInfo = CARE_TYPE_TEXT[record.type] || { text: '保养', icon: '📦' };
              return (
                <View key={record.id} className={styles.recordItem}>
                  <View className={styles.recordDate}>
                    <Text className={styles.recordDay}>{d.format('D')}</Text>
                    <Text className={styles.recordMonth}>{d.format('M月')}</Text>
                  </View>
                  <View className={styles.recordInfo}>
                    <Text className={styles.recordTitle}>
                      {typeInfo.icon} {typeInfo.text}
                      {record.products && record.products.length > 0 && ` · ${record.products.slice(0, 2).join('、')}`}
                    </Text>
                    <View className={styles.recordMeta}>
                      <Text className={classnames(styles.recordTag, getCareTagClass(record.type))}>
                        {typeInfo.text}
                      </Text>
                      {record.notes && (
                        <Text style={{ color: '#86909C' }}>{record.notes.slice(0, 15)}</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🧹</Text>
              <Text className={styles.emptyText}>暂无保养记录<br/>点击「+登记」开始保养！</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className={styles.bottomBar}>
        <View className={styles.btnDelete} onClick={handleDelete}>
          删除鞋款
        </View>
        <View className={styles.btnPrimary} onClick={handleEdit}>
          编辑信息
        </View>
      </View>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <View className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>编辑鞋款</Text>
              <Text className={styles.modalClose} onClick={() => setShowEditModal(false)}>
                ×
              </Text>
            </View>

            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>鞋款照片</Text>
                <View
                  style={{
                    width: '100%',
                    height: '300rpx',
                    borderRadius: '16rpx',
                    overflow: 'hidden',
                    border: '2rpx dashed #C9CDD4'
                  }}
                  onClick={handleChooseImage}
                >
                  <Image
                    src={resolveImagePath(editImage)}
                    style={{ width: '100%', height: '100%' }}
                    mode="aspectFill"
                  />
                </View>
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>品牌</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入品牌"
                  placeholderStyle="color: #86909C"
                  value={editBrand}
                  onInput={(e) => setEditBrand(e.detail.value)}
                />
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>鞋款名称</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入鞋款名称"
                  placeholderStyle="color: #86909C"
                  value={editName}
                  onInput={(e) => setEditName(e.detail.value)}
                />
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>购入日期</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="请输入日期 (YYYY-MM-DD)"
                  placeholderStyle="color: #86909C"
                  value={editPurchaseDate}
                  onInput={(e) => setEditPurchaseDate(e.detail.value)}
                />
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>颜色（最多3种）</Text>
                <View className={styles.colorOptions}>
                  {COLOR_OPTIONS.map((color) => (
                    <View
                      key={color.value}
                      className={classnames(styles.colorItem, {
                        [styles.colorItemActive]: editColors.includes(color.value)
                      })}
                      style={{ background: color.value }}
                      onClick={() => toggleColor(color.value)}
                    >
                      {editColors.includes(color.value) && (
                        <Text
                          className={styles.colorCheck}
                          style={{
                            color: color.value === '#FFFFFF' || color.value === '#FFCC00' || color.value === '#F5E6CC'
                              ? '#333'
                              : '#FFF'
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>风格</Text>
                <ScrollView className={styles.optionsWrap} scrollX showScrollbar={false}>
                  <View className={styles.optionsRow}>
                    {STYLE_OPTIONS.map((opt) => (
                      <View
                        key={opt.value}
                        className={classnames(styles.optionItem, {
                          [styles.optionItemActive]: editStyle === opt.value
                        })}
                        onClick={() => setEditStyle(opt.value)}
                      >
                        {opt.name}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>材质</Text>
                <ScrollView className={styles.optionsWrap} scrollX showScrollbar={false}>
                  <View className={styles.optionsRow}>
                    {MATERIAL_OPTIONS.map((opt) => (
                      <View
                        key={opt.value}
                        className={classnames(styles.optionItem, {
                          [styles.optionItemActive]: editMaterial === opt.value
                        })}
                        onClick={() => setEditMaterial(opt.value)}
                      >
                        {opt.name}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>适用场景（可多选）</Text>
                <View className={styles.multiOptionsRow}>
                  {SCENE_OPTIONS.map((opt) => (
                    <View
                      key={opt.value}
                      className={classnames(styles.multiOptionItem, {
                        [styles.multiOptionItemActive]: editScenes.includes(opt.value)
                      })}
                      onClick={() => toggleScene(opt.value)}
                    >
                      {opt.name}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.modalFormItem}>
                <Text className={styles.modalFormLabel}>备注</Text>
                <Input
                  className={styles.modalInput}
                  placeholder="备注信息"
                  placeholderStyle="color: #86909C"
                  value={editNotes}
                  onInput={(e) => setEditNotes(e.detail.value)}
                />
              </View>
            </ScrollView>

            <View className={styles.modalFooter}>
              <View className={styles.modalBtnCancel} onClick={() => setShowEditModal(false)}>
                取消
              </View>
              <View className={styles.modalBtnSave} onClick={handleSaveEdit}>
                保存修改
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default ShoeDetailPage;
