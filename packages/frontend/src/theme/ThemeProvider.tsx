/**
 * Theme Provider
 * 主题提供者 - 管理应用的主题状态和切换
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { lightTheme, darkTheme, type ThemeConfig } from './index';

// 用户偏好设置接口
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}

// 主题上下文接口
interface ThemeContextValue {
  theme: ThemeConfig;
  mode: 'light' | 'dark';
  preferences: UserPreferences;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// 本地存储键名
const STORAGE_KEY = 'ics-theme-preferences';

// 获取系统主题偏好
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 从本地存储加载偏好设置
const loadPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load theme preferences:', error);
  }
  
  return {
    theme: 'system',
    reducedMotion: false,
    fontSize: 'base',
  };
};

// 保存偏好设置到本地存储
const savePreferences = (preferences: UserPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save theme preferences:', error);
  }
};

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 计算当前主题模式
  const mode: 'light' | 'dark' = useMemo(() => {
    if (preferences.theme === 'system') {
      return systemTheme;
    }
    return preferences.theme;
  }, [preferences.theme, systemTheme]);

  // 获取当前主题配置
  const theme = useMemo(() => {
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [mode]);

  // 设置主题模式
  const setThemeMode = (newMode: 'light' | 'dark' | 'system') => {
    const newPreferences = { ...preferences, theme: newMode };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // 设置减少动画
  const setReducedMotion = (enabled: boolean) => {
    const newPreferences = { ...preferences, reducedMotion: enabled };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // 设置字体大小
  const setFontSize = (size: 'sm' | 'base' | 'lg') => {
    const newPreferences = { ...preferences, fontSize: size };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-reduced-motion', String(preferences.reducedMotion));
    document.documentElement.setAttribute('data-font-size', preferences.fontSize);
  }, [mode, preferences.reducedMotion, preferences.fontSize]);

  // Ant Design 主题配置
  const antdThemeConfig = useMemo(() => ({
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme.colors.primary[500],
      colorSuccess: theme.colors.success,
      colorWarning: theme.colors.warning,
      colorError: theme.colors.error,
      colorInfo: theme.colors.info,
      borderRadius: parseInt(theme.borderRadius.base),
      fontFamily: theme.typography.fontFamily.sans,
    },
  }), [mode, theme]);

  const contextValue: ThemeContextValue = {
    theme,
    mode,
    preferences,
    setThemeMode,
    setReducedMotion,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={antdThemeConfig} locale={zhCN}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// 使用主题的 Hook
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// 导出类型
export type { ThemeContextValue };
