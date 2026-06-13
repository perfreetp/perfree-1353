import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useShoeStore } from '@/store/useShoeStore';
import { useOutfitStore } from '@/store/useOutfitStore';
import { useCareStore } from '@/store/useCareStore';
// 全局样式
import './app.scss';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

function App(props) {
  const initShoeStore = useShoeStore((state) => state.initFromStorage);
  const initOutfitStore = useOutfitStore((state) => state.initFromStorage);
  const initCareStore = useCareStore((state) => state.initFromStorage);

  useEffect(() => {
    initShoeStore();
    initOutfitStore();
    initCareStore();
    console.log('[App] 所有Store初始化完成');
  }, [initShoeStore, initOutfitStore, initCareStore]);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
