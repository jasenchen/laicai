// 类型定义统一导出
export * from './upload';
export * from './volcano';
export * from './jimeng';
export * from './auth';
export * from './userGeneration';

// SafeAreaContainer 相关类型
export interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: any;
  excludeEdges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

// StatusBarHeightProvider 相关类型
export interface StatusBarHeightProviderProps {
  children: React.ReactNode;
}