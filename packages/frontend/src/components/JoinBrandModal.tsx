/**
 * 加入品牌弹窗（独立商务端）
 * 
 * 显示收到的品牌邀请，允许用户输入邀请码确认加入
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, message, Card, Input, Radio, Alert, Empty, Spin, Tag, Divider, Statistic, Row, Col } from 'antd';
import { TeamOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DownloadOutlined, UserOutlined, FileTextOutlined, SendOutlined, MessageOutlined } from '@ant-design/icons';
import * as invitationService from '../services/invitation.service';
import type { TargetedInvitationInfo, BackupSummary } from '../services/invitation.service';

const { Text, Title, Paragraph } = Typography;

interface JoinBrandModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const JoinBrandModal = ({ visible, onCancel, onSuccess }: JoinBrandModalProps) => {
    const [loading, setLoading] = useState(false);
    const [invitations, setInvitations] = useState<TargetedInvitationInfo[]>([]);
    const [selectedInvite, setSelectedInvite] = useState<TargetedInvitationInfo | null>(null);
    const [confirmCode, setConfirmCode] = useState('');
    const [migrateInfluencers, setMigrateInfluencers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'list' | 'confirm'>('list');
    const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // 加载收到的邀请
    const loadInvitations = async () => {
        setLoading(true);
        try {
            const data = await invitationService.getReceivedInvitations();
            setInvitations(data);
        } catch (error) {
            console.error('加载邀请失败', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadInvitations();
            setStep('list');
            setSelectedInvite(null);
            setConfirmCode('');
            setMigrateInfluencers(false);
            setBackupSummary(null);
        }
    }, [visible]);

    // 选择邀请进入确认步骤
    const handleSelectInvite = async (invite: TargetedInvitationInfo) => {
        setSelectedInvite(invite);
        setStep('confirm');

        // 加载备份汇总
        setLoadingBackup(true);
        try {
            const summary = await invitationService.getBackupSummary();
            setBackupSummary(summary);
        } catch (error) {
            console.error('加载备份汇总失败', error);
        } finally {
            setLoadingBackup(false);
        }
    };

    // 下载数据备份
    const handleDownloadBackup = async () => {
        setDownloading(true);
        try {
            await invitationService.downloadBackup();
            message.success('数据备份已开始下载');
        } catch (error: any) {
            message.error(error.message || '下载失败');
        } finally {
            setDownloading(false);
        }
    };

    // 接受邀请
    const handleAccept = async () => {
        if (!selectedInvite) return;

        // 验证邀请码
        if (confirmCode.toUpperCase() !== selectedInvite.code) {
            message.error('邀请码不正确');
            return;
        }

        setSubmitting(true);
        try {
            await invitationService.acceptTargetedInvitation(selectedInvite.code, migrateInfluencers);
            message.success('您已成功加入品牌！正在刷新页面...');

            // 刷新页面以获取最新的用户信息和品牌数据
            // 因为用户的 brandId、isIndependent 等都变了，需要完全重新加载
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            message.error(error.message || '加入失败');
            setSubmitting(false);
        }
    };

    // 拒绝邀请
    const handleReject = async (id: string) => {
        try {
            await invitationService.rejectTargetedInvitation(id);
            message.success('已拒绝该邀请');
            loadInvitations();
        } catch (error: any) {
            message.error(error.message || '操作失败');
        }
    };

    // 渲染邀请列表
    const renderInvitationList = () => (
        <Spin spinning={loading}>
            {invitations.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Alert
                        message="您收到了品牌邀请"
                        description="选择一个邀请并确认邀请码后即可加入对应品牌"
                        type="info"
                        showIcon
                    />
                    {invitations.map((invite) => (
                        <Card
                            key={invite.id}
                            size="small"
                            hoverable
                            onClick={() => handleSelectInvite(invite)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                    <TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                    <Title level={5} style={{ margin: 0 }}>
                                        {invite.brandName}
                                    </Title>
                                </Space>
                                <div>
                                    <Text type="secondary">邀请人：</Text>
                                    <Text>{invite.inviterName}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">有效期至：</Text>
                                    <Text>{new Date(invite.expiresAt).toLocaleDateString('zh-CN')}</Text>
                                    {new Date(invite.expiresAt) < new Date() ? (
                                        <Tag color="red" style={{ marginLeft: 8 }}>已过期</Tag>
                                    ) : (
                                        <Tag color="green" style={{ marginLeft: 8 }}>有效</Tag>
                                    )}
                                </div>
                                <Space style={{ marginTop: 8 }}>
                                    <Button type="primary" size="small">
                                        查看详情
                                    </Button>
                                    <Button
                                        size="small"
                                        danger
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReject(invite.id);
                                        }}
                                    >
                                        拒绝
                                    </Button>
                                </Space>
                            </Space>
                        </Card>
                    ))}
                </Space>
            ) : (
                <Empty
                    description="暂无收到的邀请"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}
        </Spin>
    );

    // 渲染确认步骤
    const renderConfirmStep = () => (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button type="link" onClick={() => setStep('list')} style={{ padding: 0 }}>
                ← 返回列表
            </Button>

            <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            {selectedInvite?.brandName}
                        </Title>
                    </Space>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                        <Text type="secondary">邀请人：</Text>
                        <Text strong>{selectedInvite?.inviterName}</Text>
                    </div>
                    <div>
                        <Text type="secondary">邀请时间：</Text>
                        <Text>{selectedInvite && new Date(selectedInvite.createdAt).toLocaleString('zh-CN')}</Text>
                    </div>
                </Space>
            </Card>

            <div>
                <Text strong>请输入邀请码确认加入：</Text>
                <Input
                    placeholder="请输入8位邀请码"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    style={{ marginTop: 8 }}
                    size="large"
                />
            </div>

            <Alert
                message="关于您的达人数据"
                description={
                    <div>
                        <Paragraph style={{ marginBottom: 8 }}>
                            加入品牌前，建议先下载您当前工作区的数据备份：
                        </Paragraph>

                        {loadingBackup ? (
                            <Spin size="small" />
                        ) : backupSummary && (
                            <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
                                <Row gutter={[8, 8]}>
                                    <Col span={6}>
                                        <Statistic
                                            title="样品"
                                            value={backupSummary.sampleCount}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="达人"
                                            value={backupSummary.influencerCount}
                                            prefix={<UserOutlined />}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="合作"
                                            value={backupSummary.collaborationCount}
                                            prefix={<FileTextOutlined />}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="合作结果"
                                            value={backupSummary.resultCount}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                    <Col span={6}>
                                        <Statistic
                                            title="分组"
                                            value={backupSummary.groupCount}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="寄样"
                                            value={backupSummary.dispatchCount}
                                            prefix={<SendOutlined />}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="跟进"
                                            value={backupSummary.followUpCount}
                                            prefix={<MessageOutlined />}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={6} />
                                </Row>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownloadBackup}
                                    loading={downloading}
                                    style={{ marginTop: 12, width: '100%' }}
                                    ghost
                                >
                                    下载完整数据备份 (8个Sheet)
                                </Button>
                            </Card>
                        )}

                        <Divider style={{ margin: '12px 0' }} />

                        <Paragraph style={{ marginBottom: 8 }}>
                            您可以选择如何处理当前个人工作区的达人数据：
                        </Paragraph>
                        <Radio.Group
                            value={migrateInfluencers}
                            onChange={(e) => setMigrateInfluencers(e.target.value)}
                        >
                            <Space direction="vertical">
                                <Radio value={true}>
                                    迁移到新品牌（推荐）
                                    <Text type="secondary" style={{ marginLeft: 8 }}>
                                        您的达人数据将转移到新品牌
                                    </Text>
                                </Radio>
                                <Radio value={false}>
                                    不迁移
                                    <Text type="secondary" style={{ marginLeft: 8 }}>
                                        保留在个人工作区
                                    </Text>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                }
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
            />

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setStep('list')}>取消</Button>
                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={submitting}
                    onClick={handleAccept}
                    disabled={confirmCode.length !== 8}
                >
                    确认加入
                </Button>
            </Space>
        </Space>
    );

    return (
        <Modal
            title={
                <Space>
                    <TeamOutlined />
                    加入品牌
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
        >
            {step === 'list' ? renderInvitationList() : renderConfirmStep()}
        </Modal>
    );
};

export default JoinBrandModal;
