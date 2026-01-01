import { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Timeline,
  Tabs,
  List,
  Typography,
  Space,
  Spin,
  Button,
  Popconfirm,
  message,
  Select,
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { BlockReason } from '@ics/shared';
import {
  getCollaboration,
  deleteCollaboration,
  setBlockReason,
  STAGE_LABELS,
  STAGE_COLORS,
  BLOCK_REASON_LABELS,
  type Collaboration,
} from '../../services/collaboration.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import dayjs from 'dayjs';

const { Text } = Typography;

interface CollaborationModalProps {
  visible: boolean;
  collaborationId: string | null;
  onClose: (refresh?: boolean) => void;
}

const CollaborationModal = ({ visible, collaborationId, onClose }: CollaborationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [blockReason, setBlockReasonState] = useState<BlockReason | null>(null);

  useEffect(() => {
    if (visible && collaborationId) {
      fetchCollaboration();
    }
  }, [visible, collaborationId]);

  const fetchCollaboration = async () => {
    if (!collaborationId) return;
    setLoading(true);
    try {
      const data = await getCollaboration(collaborationId);
      setCollaboration(data);
      setBlockReasonState(data.blockReason);
    } catch (error) {
      message.error('获取合作详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!collaborationId) return;
    try {
      await deleteCollaboration(collaborationId);
      message.success('删除成功');
      onClose(true);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '删除失败');
    }
  };

  const handleBlockReasonChange = async (value: BlockReason | null) => {
    if (!collaborationId) return;
    try {
      await setBlockReason(collaborationId, value);
      setBlockReasonState(value);
      message.success('卡点原因已更新');
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '更新失败');
    }
  };

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      DOUYIN: 'magenta',
      KUAISHOU: 'orange',
      XIAOHONGSHU: 'red',
      WEIBO: 'gold',
      OTHER: 'default',
    };
    return colors[platform] || 'default';
  };


  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: collaboration && (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="达人昵称">
            {collaboration.influencer.nickname}
          </Descriptions.Item>
          <Descriptions.Item label="平台">
            <Tag color={getPlatformColor(collaboration.influencer.platform)}>
              {PLATFORM_LABELS[collaboration.influencer.platform as keyof typeof PLATFORM_LABELS]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="平台账号ID">
            {collaboration.influencer.platformId}
          </Descriptions.Item>
          <Descriptions.Item label="负责商务">
            <UserOutlined /> {collaboration.businessStaff.name}
          </Descriptions.Item>
          <Descriptions.Item label="当前阶段">
            <Tag color={STAGE_COLORS[collaboration.stage]}>
              {STAGE_LABELS[collaboration.stage]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否超期">
            {collaboration.isOverdue ? (
              <Tag color="error" icon={<WarningOutlined />}>
                已超期
              </Tag>
            ) : (
              <Tag color="success">正常</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="截止时间">
            {collaboration.deadline ? (
              <Space>
                <ClockCircleOutlined />
                {dayjs(collaboration.deadline).format('YYYY-MM-DD HH:mm')}
              </Space>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="卡点原因">
            <Select
              value={blockReason}
              onChange={handleBlockReasonChange}
              allowClear
              placeholder="选择卡点原因"
              style={{ width: 150 }}
              options={[
                { value: 'PRICE_HIGH', label: BLOCK_REASON_LABELS.PRICE_HIGH },
                { value: 'DELAYED', label: BLOCK_REASON_LABELS.DELAYED },
                { value: 'UNCOOPERATIVE', label: BLOCK_REASON_LABELS.UNCOOPERATIVE },
                { value: 'OTHER', label: BLOCK_REASON_LABELS.OTHER },
              ]}
            />
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(collaboration.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(collaboration.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'history',
      label: '阶段历史',
      children: collaboration?.stageHistory && (
        <Timeline
          items={collaboration.stageHistory.map((h) => ({
            color: STAGE_COLORS[h.toStage],
            children: (
              <div>
                <Text strong>
                  {h.fromStage ? `${STAGE_LABELS[h.fromStage]} → ` : ''}
                  {STAGE_LABELS[h.toStage]}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(h.changedAt).format('YYYY-MM-DD HH:mm')}
                </Text>
                {h.notes && (
                  <>
                    <br />
                    <Text style={{ fontSize: 12 }}>{h.notes}</Text>
                  </>
                )}
              </div>
            ),
          }))}
        />
      ),
    },

    {
      key: 'followups',
      label: `跟进记录 (${collaboration?.followUps?.length || 0})`,
      children: collaboration?.followUps && (
        <List
          dataSource={collaboration.followUps}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{item.user?.name || '未知用户'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={item.content}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无跟进记录' }}
        />
      ),
    },
    {
      key: 'dispatches',
      label: `寄样记录 (${collaboration?.dispatches?.length || 0})`,
      children: collaboration?.dispatches && (
        <List
          dataSource={collaboration.dispatches}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.sample?.name || '未知样品'}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">
                      SKU: {item.sample?.sku} | 数量: {item.quantity}
                    </Text>
                    <Text type="secondary">
                      成本: ¥{(item.totalCost / 100).toFixed(2)} | 
                      寄出时间: {dayjs(item.dispatchedAt).format('YYYY-MM-DD')}
                    </Text>
                  </Space>
                }
              />
              <Tag color={item.receivedStatus === 'RECEIVED' ? 'success' : 'default'}>
                {item.receivedStatus === 'RECEIVED' ? '已签收' : 
                 item.receivedStatus === 'LOST' ? '已丢失' : '待签收'}
              </Tag>
            </List.Item>
          )}
          locale={{ emptyText: '暂无寄样记录' }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>合作详情</span>
          {collaboration && (
            <Tag color={STAGE_COLORS[collaboration.stage]}>
              {STAGE_LABELS[collaboration.stage]}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={() => onClose()}
      width={700}
      footer={[
        <Popconfirm
          key="delete"
          title="确定删除该合作记录吗？"
          description="删除后无法恢复"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
        <Button key="close" onClick={() => onClose()}>
          关闭
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {collaboration && <Tabs items={tabItems} />}
      </Spin>
    </Modal>
  );
};

export default CollaborationModal;
