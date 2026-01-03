/**
 * Avatar 组件
 * 
 * 现代化头像组件，支持彩色圆圈装饰、不同尺寸和状态
 */

import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { useTheme } from '../../theme/ThemeProvider';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
  ringColor?: string;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: { size: 24, fontSize: 12, ring: 2 },
  sm: { size: 32, fontSize: 14, ring: 2 },
  md: { size: 40, fontSize: 16, ring: 3 },
  lg: { size: 48, fontSize: 18, ring: 3 },
  xl: { size: 64, fontSize: 24, ring: 4 },
};

const statusColorMap = {
  online: '#52c41a',
  offline: '#d9d9d9',
  busy: '#ff4d4f',
  away: '#faad14',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  showStatus = false,
  ringColor,
  className = '',
  onClick,
}) => {
  const { theme } = useTheme();
  const { size: avatarSize, fontSize, ring } = sizeMap[size];
  
  // 生成初始字母
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const hasRing = !!ringColor;
  const statusColor = status ? statusColorMap[status] : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{
        width: avatarSize + (hasRing ? ring * 2 : 0),
        height: avatarSize + (hasRing ? ring * 2 : 0),
      }}
    >
      {/* Ring decoration with gradient */}
      {hasRing && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${ringColor}, ${ringColor}dd)`,
            padding: ring,
            boxShadow: `0 0 12px ${ringColor}40`,
          }}
        />
      )}
      
      {/* Avatar */}
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: avatarSize,
          height: avatarSize,
          backgroundColor: src ? 'transparent' : theme.colors.primary[100],
          color: theme.colors.primary[600],
          fontSize,
          fontWeight: 600,
          border: hasRing ? `${ring}px solid ${theme.colors.background.primary}` : 'none',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : (
          <UserOutlined style={{ fontSize: fontSize * 0.8 }} />
        )}
      </div>

      {/* Status indicator */}
      {showStatus && statusColor && (
        <div
          className="absolute rounded-full border-2"
          style={{
            width: avatarSize * 0.25,
            height: avatarSize * 0.25,
            backgroundColor: statusColor,
            borderColor: theme.colors.background.primary,
            bottom: hasRing ? ring : 0,
            right: hasRing ? ring : 0,
          }}
        />
      )}
    </div>
  );
};
