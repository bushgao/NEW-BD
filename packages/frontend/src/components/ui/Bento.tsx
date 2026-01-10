import React from 'react';

interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
}

// 扩展网格系统以支持更密集的排版
export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${className}`}>
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
}

export const BentoCard: React.FC<BentoCardProps> = ({
    children,
    className = '',
    title,
    subtitle,
    extra,
    span = 1,
}) => {
    const spanClass = {
        1: 'col-span-1',
        2: 'col-span-1 md:col-span-2',
        3: 'col-span-1 md:col-span-3',
        4: 'col-span-1 md:col-span-4',
        5: 'col-span-1 md:col-span-5',
        6: 'col-span-1 md:col-span-6', // 全宽
    }[span];

    return (
        <div className={`bento-card flex flex-col ${spanClass} ${className}`}>
            {(title || extra) && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {title && (
                            <h3 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-neutral-500 mt-1">
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
