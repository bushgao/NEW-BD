/**
 * Design Tokens
 * 设计令牌 - 定义整个应用的视觉设计规范
 */

// 颜色系统 - 参考 Sugar CRM
export const colors = {
  // 品牌色 - 柔和的蓝色系
  primary: {
    50: '#f0f7ff',
    100: '#e0effe',
    200: '#b9ddfe',
    300: '#7cc4fd',
    400: '#36a9fa',
    500: '#0c8ce9', // 主色
    600: '#0070c9',
    700: '#005aa3',
    800: '#004a86',
    900: '#003d6f',
  },

  // 中性色 - 更柔和的灰色
  neutral: {
    50: '#fafbfc',
    100: '#f5f7fa',
    200: '#e8ecf1',
    300: '#d1d9e0',
    400: '#a8b4c0',
    500: '#7a8a9e',
    600: '#5a6c7d',
    700: '#3e4c59',
    800: '#2d3843',
    900: '#1a2332',
  },

  // 功能色 - 柔和明亮
  success: '#34c759',
  warning: '#ff9f0a',
  error: '#ff3b30',
  info: '#5ac8fa',

  // 头像装饰色 - 鲜艳的渐变色
  avatar: {
    blue: '#5ac8fa',
    red: '#ff6b6b',
    yellow: '#ffd93d',
    green: '#6bcf7f',
    purple: '#bf5af2',
    pink: '#ff2d92',
    orange: '#ff9f0a',
    teal: '#5fc9c9',
  },

  // 背景色 - 浅灰蓝色
  background: {
    primary: '#ffffff',
    secondary: '#f5f7fa',
    tertiary: '#eef2f6',
  },

  // 黑色按钮
  button: {
    primary: '#1a1a1a',
    primaryHover: '#2d2d2d',
  },
} as const;

// 字体系统
export const typography = {
  fontFamily: {
    sans: ['Inter', 'SF Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'].join(', '),
    mono: ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'].join(', '),
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// 间距系统
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const;

// 阴影系统 - Ant Design Pro 轻阴影风格
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
  md: '0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  lg: '0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 6px 12px -3px rgba(0, 0, 0, 0.06)',
  '2xl': '0 8px 16px -4px rgba(0, 0, 0, 0.08)',
} as const;

// 圆角系统 - Ant Design Pro 规整风格（较小圆角）
export const borderRadius = {
  none: '0',
  sm: '4px',     // 4px - 小元素
  base: '6px',   // 6px - 按钮、输入框
  lg: '8px',     // 8px - 卡片、容器
  xl: '10px',    // 10px - 模态框
  '2xl': '12px', // 12px - 大容器
  '3xl': '16px', // 16px - 特殊场景
  full: '9999px',  // 完全圆形
} as const;

// 过渡动画
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Z-index 层级
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// 断点系统（响应式）
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// 导出类型
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
