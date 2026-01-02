/**
 * Button 组件
 * 
 * 现代化按钮组件，支持不同变体、尺寸、加载和禁用状态
 */

import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { useTheme } from '../../theme/ThemeProvider';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const sizeMap = {
  sm: { height: 32, padding: '0 12px', fontSize: 14 },
  md: { height: 40, padding: '0 16px', fontSize: 14 },
  lg: { height: 48, padding: '0 24px', fontSize: 16 },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
}) => {
  const { theme } = useTheme();
  const { height, padding, fontSize } = sizeMap[size];
  
  const isDisabled = disabled || loading;

  // 获取按钮样式
  const getButtonStyles = () => {
    const baseStyles = {
      height,
      padding,
      fontSize,
      fontWeight: 500,
      borderRadius: theme.borderRadius.lg,
      border: 'none',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.primary[600],
          color: '#ffffff',
          boxShadow: theme.shadows.sm,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          color: theme.colors.neutral[900],
          border: `1px solid ${theme.colors.neutral[300]}`,
          boxShadow: theme.shadows.sm,
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: theme.colors.primary[600],
          border: `1px solid ${theme.colors.primary[600]}`,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: theme.colors.neutral[700],
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.error,
          color: '#ffffff',
          boxShadow: theme.shadows.sm,
        };
      default:
        return baseStyles;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`${className}`}
      style={getButtonStyles()}
      onClick={handleClick}
      disabled={isDisabled}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const target = e.currentTarget;
          if (variant === 'primary') {
            target.style.backgroundColor = theme.colors.primary[700];
          } else if (variant === 'secondary') {
            target.style.backgroundColor = theme.colors.neutral[50];
          } else if (variant === 'danger') {
            target.style.opacity = '0.9';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          const target = e.currentTarget;
          if (variant === 'primary') {
            target.style.backgroundColor = theme.colors.primary[600];
          } else if (variant === 'secondary') {
            target.style.backgroundColor = '#ffffff';
          } else if (variant === 'danger') {
            target.style.opacity = '1';
          }
        }
      }}
    >
      {loading && <LoadingOutlined spin />}
      {!loading && icon && iconPosition === 'left' && icon}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};
