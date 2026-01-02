/**
 * Badge 组件
 * 
 * 现代化徽章组件，支持不同颜色变体和尺寸
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { padding: '2px 8px', fontSize: 12, dotSize: 6 },
  md: { padding: '4px 12px', fontSize: 14, dotSize: 8 },
  lg: { padding: '6px 16px', fontSize: 14, dotSize: 10 },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const { padding, fontSize, dotSize } = sizeMap[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[100],
          color: theme.colors.primary[700],
        };
      case 'success':
        return {
          backgroundColor: '#f6ffed',
          color: '#52c41a',
        };
      case 'warning':
        return {
          backgroundColor: '#fffbe6',
          color: '#faad14',
        };
      case 'error':
        return {
          backgroundColor: '#fff2f0',
          color: theme.colors.error,
        };
      case 'info':
        return {
          backgroundColor: '#e6f7ff',
          color: '#1890ff',
        };
      case 'neutral':
      default:
        return {
          backgroundColor: theme.colors.neutral[100],
          color: theme.colors.neutral[700],
        };
    }
  };

  if (dot) {
    return (
      <span
        className={`inline-block rounded-full ${className}`}
        style={{
          width: dotSize,
          height: dotSize,
          ...getVariantStyles(),
        }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: theme.borderRadius.full,
        ...getVariantStyles(),
      }}
    >
      {children}
    </span>
  );
};
