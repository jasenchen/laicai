export interface AspectRatio {
  id: string;
  name: string;
  ratio: string;
  scene?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  icon?: string;
}

import { Asset } from 'expo-asset';

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: '1:1',
    name: '正方形',
    ratio: '1:1',
    dimensions: { width: 2048, height: 2048 },
    icon: Asset.fromModule(require('../assets/UI/icon-1-1.svg')).uri
  },
  {
    id: '3:2',
    name: '3:2',
    ratio: '3:2',
    dimensions: { width: 2496, height: 1664 },
    icon: Asset.fromModule(require('../assets/UI/icon-3-2.svg')).uri
  },
  {
    id: '3:4',
    name: '3:4',
    ratio: '3:4',
    dimensions: { width: 1728, height: 2304 },
    icon: Asset.fromModule(require('../assets/UI/icon-3-4.svg')).uri
  },
  {
    id: '4:3',
    name: '4:3',
    ratio: '4:3',
    dimensions: { width: 2304, height: 1728 },
    icon: Asset.fromModule(require('../assets/UI/icon-4-3.svg')).uri
  },
  {
    id: '2:3',
    name: '2:3',
    ratio: '2:3',
    dimensions: { width: 1664, height: 2496 },
    icon: Asset.fromModule(require('../assets/UI/icon-2-3.svg')).uri
  },
  {
    id: '9:16',
    name: '9:16',
    ratio: '9:16',
    dimensions: { width: 1440, height: 2560 },
    icon: Asset.fromModule(require('../assets/UI/icon-9-16.svg')).uri
  },
  {
    id: '16:9',
    name: '16:9',
    ratio: '16:9',
    dimensions: { width: 2560, height: 1440 },
    icon: Asset.fromModule(require('../assets/UI/icon-16-9.svg')).uri
  },
  {
    id: '21:9',
    name: '21:9',
    ratio: '21:9',
    dimensions: { width: 3024, height: 1296 },
    icon: Asset.fromModule(require('../assets/UI/icon-21-9.svg')).uri
  },
  {
    id: 'douyin',
    name: '抖音团购',
    ratio: '4:3',
    dimensions: { width: 1660, height: 1242 },
    scene: '1660 × 1242 px',
    icon: Asset.fromModule(require('../assets/UI/icon-TikTok.svg')).uri
  },
  {
    id: 'ecommerce',
    name: '电商通用',
    ratio: '1:1',
    dimensions: { width: 800, height: 800 },
    scene: '800 × 800 px',
    icon: Asset.fromModule(require('../assets/UI/icon-taobao.svg')).uri
  },
  {
    id: 'meituan',
    name: '美团',
    ratio: '4:3',
    dimensions: { width: 800, height: 600 },
    scene: '800 × 600 px',
    icon: Asset.fromModule(require('../assets/UI/icon-meituan.svg')).uri
  },
  {
    id: 'xiaohongshu',
    name: '小红书推荐',
    ratio: '3:4',
    dimensions: { width: 1242, height: 1660 },
    scene: '1242 × 1660 px',
    icon: Asset.fromModule(require('../assets/UI/icon-xiaohongshu.svg')).uri
  }
];
