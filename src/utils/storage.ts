import Taro from '@tarojs/taro';

const SAVED_IMAGES_KEY = 'saved_image_paths';

interface SavedImagesMap {
  [tempPath: string]: string;
}

const getSavedImagesMap = (): SavedImagesMap => {
  try {
    const data = Taro.getStorageSync(SAVED_IMAGES_KEY);
    if (data && typeof data === 'object') {
      return data as SavedImagesMap;
    }
  } catch (e) {
    console.error('[storage] 读取保存的图片映射失败:', e);
  }
  return {};
};

const saveImagesMap = (map: SavedImagesMap) => {
  try {
    Taro.setStorageSync(SAVED_IMAGES_KEY, map);
  } catch (e) {
    console.error('[storage] 保存图片映射失败:', e);
  }
};

/**
 * 将临时图片路径转存为持久化路径
 * 在微信小程序中使用 saveFile API，H5/其他平台保留原路径
 * @param tempPath 临时文件路径（如 wxfile://tmp/...）
 * @returns 持久化后的文件路径
 */
export const saveImagePermanently = async (tempPath: string): Promise<string> => {
  if (!tempPath) return tempPath;

  const savedMap = getSavedImagesMap();
  if (savedMap[tempPath]) {
    console.log('[storage] 图片已转存过，直接复用:', savedMap[tempPath]);
    return savedMap[tempPath];
  }

  if (tempPath.startsWith('http://') || tempPath.startsWith('https://')) {
    return tempPath;
  }

  try {
    const isWeapp = process.env.TARO_ENV === 'weapp';
    if (isWeapp && typeof Taro.saveFile === 'function') {
      const savedFile = await Taro.saveFile({ tempFilePath: tempPath });
      if (savedFile && savedFile.savedFilePath) {
        console.log('[storage] 微信小程序 saveFile 成功:', savedFile.savedFilePath);
        savedMap[tempPath] = savedFile.savedFilePath;
        saveImagesMap(savedMap);
        return savedFile.savedFilePath;
      }
    }

    if (typeof Taro.getFileSystemManager !== 'undefined') {
      try {
        const fs = Taro.getFileSystemManager();
        const savedFilePath = `${Taro.env.USER_DATA_PATH}/shoe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        await new Promise<void>((resolve, reject) => {
          fs.saveFile({
            tempFilePath: tempPath,
            filePath: savedFilePath,
            success: () => resolve(),
            fail: (err) => reject(err)
          });
        });
        console.log('[storage] FileSystemManager saveFile 成功:', savedFilePath);
        savedMap[tempPath] = savedFilePath;
        saveImagesMap(savedMap);
        return savedFilePath;
      } catch (fsErr) {
        console.warn('[storage] FileSystemManager 转存失败，使用回退方案:', fsErr);
      }
    }

    console.log('[storage] 当前平台不支持 saveFile，保留原路径:', tempPath);
    return tempPath;
  } catch (e) {
    console.error('[storage] 图片转存失败，保留原路径:', e);
    return tempPath;
  }
};

/**
 * 批量转存图片
 */
export const saveImagesPermanently = async (tempPaths: string[]): Promise<string[]> => {
  const results = await Promise.all(tempPaths.map((p) => saveImagePermanently(p)));
  return results;
};

/**
 * 解析持久化图片路径
 * 如果找不到，尝试从映射表查找
 */
export const resolveImagePath = (path: string): string => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const savedMap = getSavedImagesMap();
  if (savedMap[path]) {
    return savedMap[path];
  }
  return path;
};
