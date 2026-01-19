/**
 * 订阅到期提醒横幅组件
 * 在 Dashboard 顶部显示套餐到期提醒
 */

import { useState, useEffect } from 'react';
import { Alert, Button, Space } from 'antd';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { request } from '../services/api';

interface SubscriptionStatus {
    brandId: string;
    planType: string;
    isPaid: boolean;
    isLocked: boolean;
    daysRemaining: number | null;
    shouldShowReminder: boolean;
    reminderMessage: string | null;
}

export default function SubscriptionBanner() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [visible, setVisible] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await request<SubscriptionStatus>('get', '/subscription/status');
            if (response.success && response.data) {
                setStatus(response.data);
            }
        } catch (error) {
            console.error('获取订阅状态失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        setVisible(false);
        // 标记提醒已查看
        try {
            await request('post', '/subscription/reminder-seen');
        } catch (error) {
            console.error('标记提醒失败:', error);
        }
    };

    const handleRenew = () => {
        // 预留续费入口
        window.open('/renew', '_blank');
    };

    // 不显示的情况
    if (loading || !status || !status.shouldShowReminder || !visible) {
        return null;
    }

    // 已锁定（到期）
    if (status.isLocked) {
        return (
            <Alert
                type="error"
                icon={<WarningOutlined />}
                message="账户已锁定"
                description={status.reminderMessage || '您的套餐已到期，账户已锁定。请续费以恢复使用。'}
                showIcon
                closable={false}
                action={
                    <Button type="primary" danger onClick={handleRenew}>
                        立即续费
                    </Button>
                }
                style={{ marginBottom: 16 }}
            />
        );
    }

    // 即将到期提醒
    const daysRemaining = status.daysRemaining || 0;
    const isUrgent = daysRemaining <= 3;

    return (
        <Alert
            type={isUrgent ? 'error' : 'warning'}
            icon={<ClockCircleOutlined />}
            message={`套餐即将到期`}
            description={status.reminderMessage}
            showIcon
            closable
            onClose={handleClose}
            action={
                <Space>
                    <Button type="primary" onClick={handleRenew}>
                        {isUrgent ? '立即续费' : '去续费'}
                    </Button>
                </Space>
            }
            style={{ marginBottom: 16 }}
        />
    );
}
