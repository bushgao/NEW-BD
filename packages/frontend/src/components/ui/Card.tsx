/**
 * Card Component
 * 卡片组件 - 现代化的容器组件
 */

import React, { CSSProperties } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    onClick,
    className = '',
    style = {},
}) => {
    const { theme } = useTheme();

    // 根据 variant 获取样式
    const getVariantStyles = (): CSSProperties => {
        const baseStyles: CSSProperties = {
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: theme.borderRadius.xl,
            transition: `all ${theme.transitions.base}`,
            border: '1px solid rgba(255, 255, 255, 0.6)',
        };

        switch (variant) {
            case 'elevated':
                return {
                    ...baseStyles,
                    boxShadow: theme.shadows.lg,
                    background: 'rgba(255, 255, 255, 0.75)',
                };
            case 'outlined':
                return {
                    ...baseStyles,
                    border: `1px solid ${theme.colors.neutral[200]}`,
                    boxShadow: 'none',
                    background: 'rgba(255, 255, 255, 0.55)',
                };
            case 'default':
            default:
                return {
                    ...baseStyles,
                    boxShadow: theme.shadows.md,
                };
        }
    };

    // 根据 padding 获取内边距
    const getPaddingStyles = (): CSSProperties => {
        switch (padding) {
            case 'none':
                return { padding: 0 };
            case 'sm':
                return { padding: theme.spacing[4] };
            case 'lg':
                return { padding: theme.spacing[8] };
            case 'md':
            default:
                return { padding: theme.spacing[6] };
        }
    };

    // 悬停样式
    const hoverStyles: CSSProperties = hoverable
        ? {
            cursor: 'pointer',
        }
        : {};

    const cardStyles: CSSProperties = {
        ...getVariantStyles(),
        ...getPaddingStyles(),
        ...hoverStyles,
        ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (hoverable) {
            e.currentTarget.style.boxShadow = theme.shadows.lg;
            e.currentTarget.style.transform = 'translateY(-4px)';
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        if (hoverable) {
            e.currentTarget.style.boxShadow = variant === 'elevated' ? theme.shadows.lg : theme.shadows.md;
            e.currentTarget.style.transform = 'translateY(0)';
        }
    };

    return (
        <div
            className={`ui-card ${className}`}
            style={cardStyles}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
};

// 卡片标题组件
export interface CardTitleProps {
    children: React.ReactNode;
    level?: 1 | 2 | 3 | 4 | 5;
    className?: string;
    style?: CSSProperties;
}

export const CardTitle: React.FC<CardTitleProps> = ({
    children,
    level = 3,
    className = '',
    style = {},
}) => {
    const { theme } = useTheme();

    const titleStyles: CSSProperties = {
        fontSize: level === 1 ? theme.typography.fontSize['2xl'] :
            level === 2 ? theme.typography.fontSize.xl :
                level === 3 ? theme.typography.fontSize.lg :
                    level === 4 ? theme.typography.fontSize.base :
                        theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.neutral[900],
        marginBottom: theme.spacing[4],
        lineHeight: theme.typography.lineHeight.tight,
        ...style,
    };

    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <Tag className={`ui-card-title ${className}`} style={titleStyles}>
            {children}
        </Tag>
    );
};

// 卡片内容组件
export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const CardContent: React.FC<CardContentProps> = ({
    children,
    className = '',
    style = {},
}) => {
    const { theme } = useTheme();

    const contentStyles: CSSProperties = {
        color: theme.colors.neutral[700],
        fontSize: theme.typography.fontSize.base,
        lineHeight: theme.typography.lineHeight.normal,
        ...style,
    };

    return (
        <div className={`ui-card-content ${className}`} style={contentStyles}>
            {children}
        </div>
    );
};

// 卡片底部组件
export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const CardFooter: React.FC<CardFooterProps> = ({
    children,
    className = '',
    style = {},
}) => {
    const { theme } = useTheme();

    const footerStyles: CSSProperties = {
        marginTop: theme.spacing[4],
        paddingTop: theme.spacing[4],
        borderTop: `1px solid ${theme.colors.neutral[200]}`,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing[2],
        ...style,
    };

    return (
        <div className={`ui-card-footer ${className}`} style={footerStyles}>
            {children}
        </div>
    );
};

// 导出所有组件
export default Card;
