/**
 * Theme Configuration
 * 主题配置 - 导出完整的主题系统
 */

import {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
  type Colors,
  type Typography,
  type Spacing,
  type Shadows,
  type BorderRadius,
  type Transitions,
  type ZIndex,
  type Breakpoints,
} from './tokens';

// 主题配置接口
export interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  borderRadius: BorderRadius;
  transitions: Transitions;
  zIndex: ZIndex;
  breakpoints: Breakpoints;
}

// 浅色主题
export const lightTheme: ThemeConfig = {
  mode: 'light',
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
};

// 暗色主题（预留）
export const darkTheme: ThemeConfig = {
  mode: 'dark',
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
};

// 默认主题
export const defaultTheme = lightTheme;

// 导出所有令牌
export {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
};

// 导出类型
export type {
  Colors,
  Typography,
  Spacing,
  Shadows,
  BorderRadius,
  Transitions,
  ZIndex,
  Breakpoints,
};
