/**
 * AvatarGroup 组件
 * 
 * 头像组，支持重叠布局和显示更多数量
 */

import React from 'react';
import { Avatar, AvatarProps } from './Avatar';
import { useTheme } from '../../theme/ThemeProvider';

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: { size: 24, overlap: -8 },
  sm: { size: 32, overlap: -10 },
  md: { size: 40, overlap: -12 },
  lg: { size: 48, overlap: -14 },
  xl: { size: 64, overlap: -18 },
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  className = '',
}) => {
  const { theme } = useTheme();
  const { overlap } = sizeMap[size];
  
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`inline-flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          style={{
            marginLeft: index > 0 ? overlap : 0,
            zIndex: displayAvatars.length - index,
          }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: sizeMap[size].size,
            height: sizeMap[size].size,
            marginLeft: overlap,
            backgroundColor: theme.colors.neutral[200],
            color: theme.colors.neutral[600],
            fontSize: sizeMap[size].size * 0.4,
            fontWeight: 600,
            border: `2px solid ${theme.colors.background.primary}`,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
