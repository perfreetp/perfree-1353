import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Image, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useShoeStore } from '@/store/useShoeStore';
import { getSceneText, getMaterialText } from '@/utils/weather';
import { getIdleShoes, getTotalWears } from '@/utils/stats';
import ShoeCard from '@/components/ShoeCard';
import StatCard from '@/components/StatCard';
import type { ShoeScene, ShoeMaterial } from '@/types';
import styles from './index.module.scss';

type SortType = 'recent' | 'wears' | 'idle';

const ShoesPage: React.FC = () => {
  const { shoes, selectedScene, setSelectedScene } = useShoeStore();
  const [sortType, setSortType] = useState<SortType>('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<ShoeMaterial | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'brand' | 'material' | null>(null);

  const idleShoes = useMemo(() => getIdleShoes(shoes, 7), [shoes]);
  const totalWears = useMemo(() => getTotalWears(shoes), [shoes]);
  const commuteCount = useMemo(() => shoes.filter(s => s.scene.includes('commute')).length, [shoes]);
  const sportCount = useMemo(() => shoes.filter(s => s.scene.includes('sport')).length, [shoes]);
  const casualCount = useMemo(() => shoes.filter(s => s.scene.includes('casual')).length, [shoes]);

  const availableBrands = useMemo(() => {
    const brands = [...new Set(shoes.map(s => s.brand))];
    return ['all', ...brands.sort()];
  }, [shoes]);

  const availableMaterials: (ShoeMaterial | 'all')[] = useMemo(() => {
    const materials = [...new Set(shoes.map(s => s.material))];
    return ['all', ...materials.sort()];
  }, [shoes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedBrand !== 'all') count++;
    if (selectedMaterial !== 'all') count++;
    if (selectedScene !== 'all') count++;
    return count;
  }, [searchQuery, selectedBrand, selectedMaterial, selectedScene]);

  const filteredShoes = useMemo(() => {
    let result = [...shoes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(shoe =>
        shoe.name.toLowerCase().includes(query) ||
        shoe.brand.toLowerCase().includes(query) ||
        shoe.colors.some(c => c.toLowerCase().includes(query)) ||
        shoe.style.toLowerCase().includes(query)
      );
    }

    if (selectedBrand !== 'all') {
      result = result.filter(shoe => shoe.brand === selectedBrand);
    }

    if (selectedMaterial !== 'all') {
      result = result.filter(shoe => shoe.material === selectedMaterial);
    }

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
  }, [shoes, searchQuery, selectedBrand, selectedMaterial, selectedScene, sortType]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedMaterial('all');
    setSelectedScene('all');
    setActiveFilterDropdown(null);
  }, [setSelectedScene]);

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

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setActiveFilterDropdown(null);
  };

  const handleMaterialSelect = (material: ShoeMaterial | 'all') => {
    setSelectedMaterial(material);
    setActiveFilterDropdown(null);
  };

  const toggleFilterDropdown = (type: 'brand' | 'material') => {
    setActiveFilterDropdown(activeFilterDropdown === type ? null : type);
  };

  const getFilterDisplayText = (value: string, type: 'brand' | 'material'): string => {
    if (value === 'all') return type === 'brand' ? '品牌' : '材质';
    if (type === 'material') return getMaterialText(value as ShoeMaterial);
    return value;
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

          <View className={styles.searchBar}>
            <View className={styles.searchInputContainer}>
              <Text className={styles.searchIcon}>🔍</Text>
              <Input
                className={styles.searchInput}
                placeholder="搜索鞋名、品牌、颜色、风格"
                placeholderStyle="color: #86909C"
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.detail.value)}
                confirmType="search"
              />
              {searchQuery && (
                <Text className={styles.searchClear} onClick={() => setSearchQuery('')}>×</Text>
              )}
            </View>
            <View
              className={classnames(styles.filterToggle, { [styles.filterActive]: activeFilterCount > 0 })}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Text>筛选</Text>
              {activeFilterCount > 0 && (
                <View className={styles.filterBadge}>{activeFilterCount}</View>
              )}
              <Text className={styles.filterArrow}>{showFilters ? '▲' : '▼'}</Text>
            </View>
          </View>

          {showFilters && (
            <View className={styles.filterPanel}>
              <View className={styles.filterRow}>
                <View className={styles.filterLabel}>筛选条件</View>
                {activeFilterCount > 0 && (
                  <Text className={styles.clearFilters} onClick={clearAllFilters}>
                    清空全部
                  </Text>
                )}
              </View>

              <View className={styles.filterButtonsRow}>
                <View
                  className={classnames(
                    styles.filterButton,
                    selectedBrand !== 'all' && styles.filterButtonActive
                  )}
                  onClick={() => toggleFilterDropdown('brand')}
                >
                  <Text>{getFilterDisplayText(selectedBrand, 'brand')}</Text>
                  <Text className={styles.filterButtonArrow}>
                    {activeFilterDropdown === 'brand' ? '▲' : '▼'}
                  </Text>
                </View>

                <View
                  className={classnames(
                    styles.filterButton,
                    selectedMaterial !== 'all' && styles.filterButtonActive
                  )}
                  onClick={() => toggleFilterDropdown('material')}
                >
                  <Text>{getFilterDisplayText(selectedMaterial, 'material')}</Text>
                  <Text className={styles.filterButtonArrow}>
                    {activeFilterDropdown === 'material' ? '▲' : '▼'}
                  </Text>
                </View>
              </View>

              {activeFilterDropdown === 'brand' && (
                <View className={styles.filterDropdown}>
                  {availableBrands.map((brand) => (
                    <View
                      key={brand}
                      className={classnames(
                        styles.filterDropdownItem,
                        selectedBrand === brand && styles.filterDropdownItemActive
                      )}
                      onClick={() => handleBrandSelect(brand)}
                    >
                      <Text>{brand === 'all' ? '全部品牌' : brand}</Text>
                      <Text className={styles.filterDropdownCount}>
                        ({brand === 'all'
                          ? shoes.length
                          : shoes.filter(s => s.brand === brand).length})
                      </Text>
                      {selectedBrand === brand && <Text className={styles.filterCheck}>✓</Text>}
                    </View>
                  ))}
                </View>
              )}

              {activeFilterDropdown === 'material' && (
                <View className={styles.filterDropdown}>
                  {availableMaterials.map((material) => (
                    <View
                      key={material}
                      className={classnames(
                        styles.filterDropdownItem,
                        selectedMaterial === material && styles.filterDropdownItemActive
                      )}
                      onClick={() => handleMaterialSelect(material)}
                    >
                      <Text>{material === 'all' ? '全部材质' : getMaterialText(material as ShoeMaterial)}</Text>
                      <Text className={styles.filterDropdownCount}>
                        ({material === 'all'
                          ? shoes.length
                          : shoes.filter(s => s.material === material).length})
                      </Text>
                      {selectedMaterial === material && <Text className={styles.filterCheck}>✓</Text>}
                    </View>
                  ))}
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
                      ({filter.value === 'all'
                        ? shoes.length
                        : shoes.filter(s => s.scene.includes(filter.value as ShoeScene)).length})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeFilterCount > 0 && !showFilters && (
            <View className={styles.activeFiltersRow}>
              {searchQuery && (
                <View className={styles.activeFilterTag} onClick={() => setSearchQuery('')}>
                  <Text>🔍 {searchQuery}</Text>
                  <Text className={styles.filterTagClose}>×</Text>
                </View>
              )}
              {selectedBrand !== 'all' && (
                <View className={styles.activeFilterTag} onClick={() => setSelectedBrand('all')}>
                  <Text>🏷️ {selectedBrand}</Text>
                  <Text className={styles.filterTagClose}>×</Text>
                </View>
              )}
              {selectedMaterial !== 'all' && (
                <View className={styles.activeFilterTag} onClick={() => setSelectedMaterial('all')}>
                  <Text>🧵 {getMaterialText(selectedMaterial as ShoeMaterial)}</Text>
                  <Text className={styles.filterTagClose}>×</Text>
                </View>
              )}
              {selectedScene !== 'all' && (
                <View className={styles.activeFilterTag} onClick={() => setSelectedScene('all')}>
                  <Text>📍 {getSceneText(selectedScene)}</Text>
                  <Text className={styles.filterTagClose}>×</Text>
                </View>
              )}
            </View>
          )}

          <View className={styles.sortSelector}>
            <View className={styles.resultCount}>
              共 <Text className={styles.resultCountNum}>{filteredShoes.length}</Text> 双
              {activeFilterCount > 0 && <Text className={styles.resultCountHint}>（已筛选）</Text>}
            </View>
            <View className={styles.sortButton} onClick={() => setShowSortMenu(!showSortMenu)}>
              <Text>排序：{sortOptions.find(o => o.value === sortType)?.label}</Text>
              <Text>▼</Text>
            </View>
          </View>

          {showSortMenu && (
            <View style={{
              position: 'absolute',
              right: '32rpx',
              top: '680rpx',
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
              {activeFilterCount > 0
                ? '没有符合筛选条件的鞋款，试试调整筛选条件吧'
                : '鞋柜空空如也，快去添加你的第一双鞋吧！'}
            </Text>
            {activeFilterCount > 0 ? (
              <Button className={styles.buttonPrimary} onClick={clearAllFilters}>
                清除筛选
              </Button>
            ) : (
              <Button className={styles.buttonPrimary} onClick={handleAddShoe}>
                添加鞋款
              </Button>
            )}
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
