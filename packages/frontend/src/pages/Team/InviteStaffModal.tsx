/**
 * 邀请商务弹窗
 * 
 * 支持两种邀请方式：
 * 1. 生成邀请链接（新人注册）
 * 2. 定向邀请独立商务（通过手机号）
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, message, Tag, Spin, QRCode, Input, Divider, List, Popconfirm, Empty, Tabs, Form, Card, Alert } from 'antd';
import { CopyOutlined, ReloadOutlined, LinkOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, UserAddOutlined, PhoneOutlined, SendOutlined } from '@ant-design/icons';
import * as invitationService from '../../services/invitation.service';
import type { InvitationInfo } from '../../services/invitation.service';

const { Text, Paragraph, Title } = Typography;

interface InviteStaffModalProps {
    visible: boolean;
    onCancel: () => void;
}

interface TargetedInviteState {
    phone: string;
    searching: boolean;
    foundUser: { id: string; name: string; phone: string } | null;
    sending: boolean;
    sentInvite: any | null;
}

const InviteStaffModal = ({ visible, onCancel }: InviteStaffModalProps) => {
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [invitations, setInvitations] = useState<InvitationInfo[]>([]);
    const [currentInvite, setCurrentInvite] = useState<InvitationInfo | null>(null);
    const [activeTab, setActiveTab] = useState('link');

    // 定向邀请状态
    const [targeted, setTargeted] = useState<TargetedInviteState>({
        phone: '',
        searching: false,
        foundUser: null,
        sending: false,
        sentInvite: null,
    });

    // 加载邀请列表
    const loadInvitations = async () => {
        setLoading(true);
        try {
            const data = await invitationService.listInvitations();
            setInvitations(data);
            // 如果有待使用的邀请，显示最新的一个
            const pendingInvite = data.find((inv) => inv.status === 'PENDING');
            if (pendingInvite) {
                setCurrentInvite(pendingInvite);
            }
        } catch (error) {
            console.error('加载邀请列表失败', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadInvitations();
        } else {
            // 关闭时重置状态
            setCurrentInvite(null);
            setTargeted({
                phone: '',
                searching: false,
                foundUser: null,
                sending: false,
                sentInvite: null,
            });
        }
    }, [visible]);

    // 创建新邀请
    const handleCreateInvite = async () => {
        setCreating(true);
        try {
            const invite = await invitationService.createInvitation();
            setCurrentInvite(invite);
            setInvitations((prev) => [invite, ...prev]);
            message.success('邀请链接已生成');
        } catch (error: any) {
            message.error(error.message || '创建邀请失败');
        } finally {
            setCreating(false);
        }
    };

    // 撤销邀请
    const handleRevoke = async (id: string) => {
        try {
            await invitationService.revokeInvitation(id);
            message.success('邀请已撤销');
            loadInvitations();
            if (currentInvite?.id === id) {
                setCurrentInvite(null);
            }
        } catch (error: any) {
            message.error(error.message || '撤销失败');
        }
    };

    // 复制链接
    const handleCopy = (code: string) => {
        const link = `${window.location.origin}/invite/${code}`;
        navigator.clipboard.writeText(link);
        message.success('邀请链接已复制');
    };

    // 获取状态标签
    const getStatusTag = (status: InvitationInfo['status']) => {
        switch (status) {
            case 'PENDING':
                return <Tag color="processing" icon={<LinkOutlined />}>待使用</Tag>;
            case 'USED':
                return <Tag color="success" icon={<CheckCircleOutlined />}>已使用</Tag>;
            case 'REVOKED':
                return <Tag color="default" icon={<CloseCircleOutlined />}>已撤销</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    // 判断邀请是否过期
    const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

    // ============ 定向邀请相关方法 ============

    // 搜索独立商务
    const handleSearchBusiness = async () => {
        if (!targeted.phone || !/^1[3-9]\d{9}$/.test(targeted.phone)) {
            message.error('请输入正确的手机号');
            return;
        }

        setTargeted(prev => ({ ...prev, searching: true, foundUser: null, sentInvite: null }));
        try {
            const user = await invitationService.searchIndependentBusiness(targeted.phone);
            setTargeted(prev => ({ ...prev, foundUser: user, searching: false }));
        } catch (error: any) {
            message.error(error.message || '未找到该手机号对应的独立商务');
            setTargeted(prev => ({ ...prev, searching: false }));
        }
    };

    // 发送定向邀请
    const handleSendTargetedInvite = async () => {
        if (!targeted.foundUser) return;

        setTargeted(prev => ({ ...prev, sending: true }));
        try {
            const invite = await invitationService.createTargetedInvitation(targeted.phone);
            setTargeted(prev => ({ ...prev, sentInvite: invite, sending: false }));
            message.success('邀请已发送，请告知对方查看通知');
            loadInvitations();
        } catch (error: any) {
            message.error(error.message || '发送邀请失败');
            setTargeted(prev => ({ ...prev, sending: false }));
        }
    };

    // 重置定向邀请
    const handleResetTargeted = () => {
        setTargeted({
            phone: '',
            searching: false,
            foundUser: null,
            sending: false,
            sentInvite: null,
        });
    };

    // 链接邀请内容
    const renderLinkInvite = () => (
        <>
            {currentInvite ? (
                <div style={{ marginBottom: 24 }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <QRCode
                                value={`${window.location.origin}/invite/${currentInvite.code}`}
                                size={160}
                                style={{ margin: '0 auto' }}
                            />
                            <Paragraph type="secondary" style={{ marginTop: 8 }}>
                                扫描二维码或复制链接分享给商务人员
                            </Paragraph>
                        </div>

                        <Input.Group compact>
                            <Input
                                style={{ width: 'calc(100% - 100px)' }}
                                value={`${window.location.origin}/invite/${currentInvite.code}`}
                                readOnly
                            />
                            <Button
                                type="primary"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopy(currentInvite.code)}
                            >
                                复制链接
                            </Button>
                        </Input.Group>

                        <Space>
                            <Text type="secondary">
                                邀请码：<Text code copyable>{currentInvite.code}</Text>
                            </Text>
                            <Text type="secondary">
                                有效期至：{new Date(currentInvite.expiresAt).toLocaleDateString('zh-CN')}
                            </Text>
                        </Space>
                    </Space>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Title level={5}>生成邀请链接</Title>
                    <Paragraph type="secondary">
                        邀请链接有效期7天，商务人员通过链接可直接注册并加入您的品牌
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        icon={<LinkOutlined />}
                        loading={creating}
                        onClick={handleCreateInvite}
                    >
                        生成邀请链接
                    </Button>
                </div>
            )}
        </>
    );

    // 定向邀请内容
    const renderTargetedInvite = () => (
        <div style={{ padding: '16px 0' }}>
            {!targeted.sentInvite ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Alert
                        message="定向邀请独立商务"
                        description="输入独立商务的手机号，发送邀请后对方会收到通知，确认邀请码后即可加入您的品牌。"
                        type="info"
                        showIcon
                    />

                    <Form layout="vertical">
                        <Form.Item label="手机号码">
                            <Input.Search
                                placeholder="请输入独立商务的手机号"
                                prefix={<PhoneOutlined />}
                                value={targeted.phone}
                                onChange={(e) => setTargeted(prev => ({ ...prev, phone: e.target.value }))}
                                onSearch={handleSearchBusiness}
                                loading={targeted.searching}
                                enterButton="查找"
                                style={{ maxWidth: 400 }}
                            />
                        </Form.Item>
                    </Form>

                    {targeted.foundUser && (
                        <Card size="small" style={{ maxWidth: 400 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>找到用户：</Text>
                                    <Text>{targeted.foundUser.name}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">手机号：{targeted.foundUser.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    loading={targeted.sending}
                                    onClick={handleSendTargetedInvite}
                                    block
                                >
                                    发送邀请
                                </Button>
                            </Space>
                        </Card>
                    )}
                </Space>
            ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <Title level={4}>邀请已发送</Title>
                    <Paragraph>
                        已向 <Text strong>{targeted.foundUser?.name}</Text> 发送邀请
                    </Paragraph>
                    <Card size="small" style={{ maxWidth: 300, margin: '16px auto' }}>
                        <Space direction="vertical">
                            <Text type="secondary">邀请码</Text>
                            <Text code copyable style={{ fontSize: 20 }}>{targeted.sentInvite.code}</Text>
                        </Space>
                    </Card>
                    <Paragraph type="secondary">
                        请告知对方在"通知"中查看并确认加入
                    </Paragraph>
                    <Button onClick={handleResetTargeted}>
                        继续邀请
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <Modal
            title="邀请商务人员"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'link',
                            label: (
                                <span>
                                    <LinkOutlined />
                                    链接邀请
                                </span>
                            ),
                            children: renderLinkInvite(),
                        },
                        {
                            key: 'targeted',
                            label: (
                                <span>
                                    <UserAddOutlined />
                                    定向邀请
                                </span>
                            ),
                            children: renderTargetedInvite(),
                        },
                    ]}
                />

                <Divider>邀请历史</Divider>

                {/* 邀请历史列表 */}
                {invitations.length > 0 ? (
                    <List
                        size="small"
                        dataSource={invitations}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    item.status === 'PENDING' && !isExpired(item.expiresAt) && (
                                        <Button
                                            key="copy"
                                            type="link"
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => handleCopy(item.code)}
                                        >
                                            复制
                                        </Button>
                                    ),
                                    item.status === 'PENDING' && (
                                        <Popconfirm
                                            key="revoke"
                                            title="确定要撤销该邀请吗？"
                                            onConfirm={() => handleRevoke(item.id)}
                                            okText="确定"
                                            cancelText="取消"
                                        >
                                            <Button type="link" size="small" danger icon={<StopOutlined />}>
                                                撤销
                                            </Button>
                                        </Popconfirm>
                                    ),
                                ].filter(Boolean)}
                            >
                                <List.Item.Meta
                                    title={
                                        <Space>
                                            <Text code>{item.code}</Text>
                                            {getStatusTag(item.status)}
                                            {item.status === 'PENDING' && isExpired(item.expiresAt) && (
                                                <Tag color="red">已过期</Tag>
                                            )}
                                            {(item as any).inviteType === 'TARGETED' && (
                                                <Tag color="purple">定向</Tag>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <Space size="large">
                                            <Text type="secondary">
                                                创建于 {new Date(item.createdAt).toLocaleString('zh-CN')}
                                            </Text>
                                            {item.usedByName && (
                                                <Text>已被 {item.usedByName} 使用</Text>
                                            )}
                                            {(item as any).targetUserName && (
                                                <Text>邀请 {(item as any).targetUserName}</Text>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="暂无邀请记录" />
                )}

                {/* 创建新邀请按钮 */}
                {currentInvite && activeTab === 'link' && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={creating}
                            onClick={handleCreateInvite}
                        >
                            生成新的邀请链接
                        </Button>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default InviteStaffModal;
