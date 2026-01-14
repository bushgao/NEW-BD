import { useState, useEffect } from 'react';
import { Tag, Tooltip, Button, Popover, Space, Spin, message } from 'antd';
import {
    WechatOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
    PlusCircleOutlined,
} from '@ant-design/icons';
import { getInfluencerWeChatStatus, WeChatAddStatus } from '../../services/wechat';

interface WeChatStatusTagProps {
    influencerId: string;
    wechatId?: string | null;
    nickname?: string;
    platform?: string;
    onAddClick?: (influencerId: string, wechatId: string, nickname: string, platform: string) => void;
    compact?: boolean; // 紧凑模式，只显示图标
}

// 状态配�?
const STATUS_CONFIG: Record<WeChatAddStatus, {
    color: string;
    icon: React.ReactNode;
    text: string;
    bgColor: string;
}> = {
    PENDING: {
        color: '#1890ff',
        icon: <ClockCircleOutlined />,
        text: '待通过',
        bgColor: 'rgba(24, 144, 255, 0.1)',
    },
    ACCEPTED: {
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: '已通过',
        bgColor: 'rgba(82, 196, 26, 0.1)',
    },
    REJECTED: {
        color: '#ff4d4f',
        icon: <CloseCircleOutlined />,
        text: '已拒�?,
        bgColor: 'rgba(255, 77, 79, 0.1)',
    },
    EXPIRED: {
        color: '#faad14',
        icon: <ClockCircleOutlined />,
        text: '已过�?,
        bgColor: 'rgba(250, 173, 20, 0.1)',
    },
    FAILED: {
        color: '#ff4d4f',
        icon: <CloseCircleOutlined />,
        text: '添加失败',
        bgColor: 'rgba(255, 77, 79, 0.1)',
    },
};

const WeChatStatusTag = ({
    influencerId,
    wechatId,
    nickname = '',
    platform = '',
    onAddClick,
    compact = false,
}: WeChatStatusTagProps) => {
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState<{
        status: WeChatAddStatus | null;
        canAdd: boolean;
        message: string;
        staffName?: string;
    } | null>(null);

    // 加载微信添加状�?
    const loadStatus = async () => {
        if (!influencerId) return;

        setLoading(true);
        try {
            const res = await getInfluencerWeChatStatus(influencerId);
            if (res.success) {
                setStatusData(res.data);
            }
        } catch (error) {
            console.error('获取微信状态失�?', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, [influencerId]);

    // 处理添加点击
    const handleAddClick = () => {
        if (!wechatId) {
            message.warning('该达人暂无微信号');
            return;
        }
        if (onAddClick) {
            onAddClick(influencerId, wechatId, nickname, platform);
        }
    };

    // 加载中状�?
    if (loading) {
        return <Spin size="small" />;
    }

    // 没有状态数据，显示"添加微信"按钮
    if (!statusData || statusData.status === null) {
        if (!wechatId) {
            return (
                <Tooltip title="暂无微信�?>
                    <Tag
                        icon={<QuestionCircleOutlined />}
                        style={{
                            borderRadius: 6,
                            border: 'none',
                            background: '#f5f5f5',
                            color: '#999',
                        }}
                    >
                        {compact ? '' : '无微�?}
                    </Tag>
                </Tooltip>
            );
        }

        return (
            <Tooltip title={statusData?.canAdd ? '点击添加微信好友' : statusData?.message}>
                <Tag
                    icon={<PlusCircleOutlined />}
                    color="processing"
                    style={{
                        cursor: statusData?.canAdd !== false ? 'pointer' : 'not-allowed',
                        borderRadius: 6,
                    }}
                    onClick={statusData?.canAdd !== false ? handleAddClick : undefined}
                >
                    {compact ? '' : '添加微信'}
                </Tag>
            </Tooltip>
        );
    }

    const config = STATUS_CONFIG[statusData.status];

    // 紧凑模式
    if (compact) {
        return (
            <Tooltip title={`${config.text}${statusData.staffName ? ` (${statusData.staffName})` : ''}`}>
                <span
                    style={{
                        color: config.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                    }}
                >
                    {config.icon}
                </span>
            </Tooltip>
        );
    }

    // 完整标签
    const tagContent = (
        <Tag
            icon={config.icon}
            style={{
                color: config.color,
                background: config.bgColor,
                border: 'none',
                borderRadius: 6,
                cursor: statusData.canAdd ? 'pointer' : 'default',
            }}
            onClick={statusData.canAdd ? handleAddClick : undefined}
        >
            {config.text}
        </Tag>
    );

    // 如果有额外信息，使用 Popover
    if (statusData.staffName || statusData.message) {
        return (
            <Popover
                content={
                    <Space direction="vertical" size="small">
                        {statusData.staffName && (
                            <div style={{ fontSize: 12, color: '#666' }}>
                                操作人：{statusData.staffName}
                            </div>
                        )}
                        <div style={{ fontSize: 12, color: '#999' }}>
                            {statusData.message}
                        </div>
                        {statusData.canAdd && (
                            <Button
                                type="primary"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={handleAddClick}
                            >
                                重新添加
                            </Button>
                        )}
                    </Space>
                }
                trigger="hover"
            >
                {tagContent}
            </Popover>
        );
    }

    return tagContent;
};

export default WeChatStatusTag;
