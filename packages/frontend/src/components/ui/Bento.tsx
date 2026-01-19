import React from 'react';

interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
}

// 扩展网格系统以支持更密集的排版
export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-start ${className}`}>
            {children}
        </div>
    );
};

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    extra?: React.ReactNode;
    span?: 1 | 2 | 3 | 4 | 5 | 6; // 扩展 span 支持
    variant?: 'default' | 'deep'; // 支持 deep 主题变体
}

export const BentoCard: React.FC<BentoCardProps> = ({
    children,
    className = '',
    title,
    subtitle,
    extra,
    span = 1,
    variant = 'default',
}) => {
    const spanClass = {
        1: 'col-span-1',
        2: 'col-span-1 md:col-span-2',
        3: 'col-span-1 md:col-span-3',
        4: 'col-span-1 md:col-span-4',
        5: 'col-span-1 md:col-span-5',
        6: 'col-span-1 md:col-span-6', // 全宽
    }[span];

    // variant 样式
    const variantStyles = variant === 'deep'
        ? 'bg-slate-900/60 backdrop-blur-lg border border-slate-700/30 text-slate-200'
        : '';

    const titleClass = variant === 'deep'
        ? 'text-lg font-bold text-slate-100 tracking-tight leading-tight'
        : 'text-lg font-bold text-neutral-900 tracking-tight leading-tight';

    const subtitleClass = variant === 'deep'
        ? 'text-sm text-slate-400 mt-1'
        : 'text-sm text-neutral-500 mt-1';

    return (
        <div className={`bento-card flex flex-col ${spanClass} ${variantStyles} ${className}`}>
            {(title || extra) && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {title && (
                            <h3 className={titleClass}>
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className={subtitleClass}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {extra && <div className="flex items-center">{extra}</div>}
                </div>
            )}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};
