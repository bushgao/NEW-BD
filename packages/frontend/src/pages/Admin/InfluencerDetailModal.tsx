import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Tag, Timeline, Spin, Empty, message } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { Platform, InfluencerSourceType, VerificationStatus } from '@ics/shared';
import * as platformInfluencerService from '../../services/platform-influencer.service';

interface Props {
  open: boolean;
  onClose: () => void;
  influencerId: string;
}

const platformLabels: Record<Platform, string> = {
  DOUYIN: '抖音',
  KUAISHOU: '快手',
  XIAOHONGSHU: '小红书',
  WEIBO: '微博',
  OTHER: '其他',
};

const sourceTypeLabels: Record<InfluencerSourceType, string> = {
  PLATFORM: '平台添加',
  FACTORY: '品牌添加',
  STAFF: '商务添加',
};

const verificationStatusLabels: Record<VerificationStatus, string> = {
  UNVERIFIED: '未认证',
  VERIFIED: '已认证',
  REJECTED: '认证失败',
};

const verificationStatusColors: Record<VerificationStatus, string> = {
  UNVERIFIED: 'default',
  VERIFIED: 'success',
  REJECTED: 'error',
};

export default function InfluencerDetailModal({ open, onClose, influencerId }: Props) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [influencer, setInfluencer] = useState<any>(null);

  useEffect(() => {
    if (open && influencerId) {
      loadInfluencerDetail();
    }
  }, [open, influencerId]);

  const loadInfluencerDetail = async () => {
    setLoading(true);
    try {
      const data = await platformInfluencerService.getInfluencerDetail(influencerId);
      setInfluencer(data);
    } catch (error: any) {
      message.error(error.message || '加载达人详情失败');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="昵称">{influencer.nickname}</Descriptions.Item>
      <Descriptions.Item label="平台">{platformLabels[influencer.platform]}</Descriptions.Item>
      <Descriptions.Item label="账号ID">{influencer.platformId}</Descriptions.Item>
      <Descriptions.Item label="粉丝数">{influencer.followers || '-'}</Descriptions.Item>
      <Descriptions.Item label="手机号">{influencer.phone || '-'}</Descriptions.Item>
      <Descriptions.Item label="微信号">{influencer.wechat || '-'}</Descriptions.Item>
      <Descriptions.Item label="分类" span={2}>
        {influencer.categories?.length > 0
          ? influencer.categories.map((cat: string) => (
            <Tag key={cat}>{cat}</Tag>
          ))
          : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="标签" span={2}>
        {influencer.tags?.length > 0
          ? influencer.tags.map((tag: string) => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))
          : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="备注" span={2}>
        {influencer.notes || '-'}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderSourceInfo = () => (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="所属品牌">
        {influencer.brand?.name || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="来源类型">
        <Tag color="blue">{sourceTypeLabels[influencer.sourceType]}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="添加人">
        {influencer.creator?.name || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="添加人角色">
        {influencer.creator?.role === 'BRAND' ? '品牌' :
          influencer.creator?.role === 'BUSINESS' ? '商务' :
            influencer.creator?.role === 'PLATFORM_ADMIN' ? '平台管理员' : '-'}
      </Descriptions.Item>
      <Descriptions.Item label="添加时间" span={2}>
        {new Date(influencer.createdAt).toLocaleString('zh-CN')}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderVerificationInfo = () => {
    const history = influencer.verificationHistory?.entries || [];

    return (
      <div>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="认证状态">
            <Tag color={verificationStatusColors[influencer.verificationStatus]}>
              {verificationStatusLabels[influencer.verificationStatus]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="认证时间">
            {influencer.verifiedAt
              ? new Date(influencer.verifiedAt).toLocaleString('zh-CN')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="认证人">
            {influencer.verifier?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="认证备注">
            {influencer.verificationNote || '-'}
          </Descriptions.Item>
        </Descriptions>

        {history.length > 0 && (
          <div>
            <h4 style={{ marginBottom: 16 }}>认证历史</h4>
            <Timeline>
              {history.map((entry: any, index: number) => (
                <Timeline.Item
                  key={index}
                  dot={
                    entry.action === 'VERIFIED' ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : entry.action === 'REJECTED' ? (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    ) : (
                      <ClockCircleOutlined />
                    )
                  }
                  color={
                    entry.action === 'VERIFIED'
                      ? 'green'
                      : entry.action === 'REJECTED'
                        ? 'red'
                        : 'blue'
                  }
                >
                  <p>
                    <strong>
                      {entry.action === 'VERIFIED' ? '认证通过' : '认证拒绝'}
                    </strong>
                  </p>
                  <p>操作人：{entry.verifiedByName}</p>
                  <p>时间：{new Date(entry.verifiedAt).toLocaleString('zh-CN')}</p>
                  {entry.note && <p>备注：{entry.note}</p>}
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </div>
    );
  };

  const renderCollaborations = () => {
    const collaborations = influencer.collaborations || [];

    if (collaborations.length === 0) {
      return <Empty description="暂无合作记录" />;
    }

    return (
      <div>
        {collaborations.map((collab: any) => (
          <div
            key={collab.id}
            style={{
              padding: 16,
              marginBottom: 16,
              border: '1px solid #f0f0f0',
              borderRadius: 4,
            }}
          >
            <p><strong>阶段：</strong>{collab.stage}</p>
            <p><strong>商务人员：</strong>{collab.businessStaff?.name || '-'}</p>
            <p><strong>创建时间：</strong>{new Date(collab.createdAt).toLocaleString('zh-CN')}</p>
            <p><strong>状态：</strong>{collab.hasResult ? '已完成' : '进行中'}</p>
          </div>
        ))}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: influencer && renderBasicInfo(),
    },
    {
      key: 'source',
      label: '来源信息',
      children: influencer && renderSourceInfo(),
    },
    {
      key: 'verification',
      label: '认证信息',
      children: influencer && renderVerificationInfo(),
    },
    {
      key: 'collaborations',
      label: '合作记录',
      children: influencer && renderCollaborations(),
    },
  ];

  return (
    <Modal
      title="达人详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : influencer ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      ) : null}
    </Modal>
  );
}
