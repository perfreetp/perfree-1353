import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
// 全局样式
import './app.scss';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {});

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
