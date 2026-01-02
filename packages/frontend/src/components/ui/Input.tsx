/**
 * Input 组件
 * 
 * 现代化输入框组件，支持聚焦和错误状态、前缀和后缀图标
 */

import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const sizeMap = {
  sm: { height: 32, padding: '0 12px', fontSize: 14 },
  md: { height: 40, padding: '0 16px', fontSize: 14 },
  lg: { height: 48, padding: '0 20px', fontSize: 16 },
};

export const Input: React.FC<InputProps> = ({
  value,
  defaultValue,
  placeholder,
  type = 'text',
  size = 'md',
  disabled = false,
  error = false,
  errorMessage,
  prefix,
  suffix,
  fullWidth = false,
  className = '',
  onChange,
  onFocus,
  onBlur,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { height, padding, fontSize } = sizeMap[size];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary[600];
    return theme.colors.neutral[300];
  };

  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height,
    padding,
    fontSize,
    borderRadius: theme.borderRadius.base,
    border: `1px solid ${getBorderColor()}`,
    backgroundColor: disabled ? theme.colors.neutral[50] : '#ffffff',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    boxShadow: isFocused && !error ? `0 0 0 3px ${theme.colors.primary[100]}` : 'none',
  };

  const inputStyles: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize,
    color: theme.colors.neutral[900],
    padding: 0,
  };

  return (
    <div className={className}>
      <div style={containerStyles}>
        {prefix && (
          <span style={{ color: theme.colors.neutral[500], display: 'flex', alignItems: 'center' }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyles}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {suffix && (
          <span style={{ color: theme.colors.neutral[500], display: 'flex', alignItems: 'center' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && errorMessage && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: theme.colors.error,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};
