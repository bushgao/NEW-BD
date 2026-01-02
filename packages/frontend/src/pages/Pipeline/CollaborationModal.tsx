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
  Form,
  InputNumber,
  Input,
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { BlockReason } from '@ics/shared';
import {
  getCollaboration,
  deleteCollaboration,
  setBlockReason,
  updateStage,
  STAGE_LABELS,
  STAGE_COLORS,
  BLOCK_REASON_LABELS,
  type Collaboration,
} from '../../services/collaboration.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import { getSamples, createDispatch, type Sample } from '../../services/sample.service';
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
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [dispatchForm] = Form.useForm();

  useEffect(() => {
    if (visible && collaborationId) {
      fetchCollaboration();
      fetchSamples();
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

  const fetchSamples = async () => {
    try {
      const result = await getSamples({ page: 1, pageSize: 100 });
      setSamples(result.data);
    } catch (error) {
      console.error('获取样品列表失败:', error);
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

  const handleDispatchSample = () => {
    setDispatchModalVisible(true);
    dispatchForm.resetFields();
  };

  const handleDispatchSubmit = async () => {
    if (!collaborationId) return;
    try {
      const values = await dispatchForm.validateFields();
      // 将快递费从元转换为分
      const shippingCostInCents = Math.round(values.shippingCost * 100);
      await createDispatch({
        sampleId: values.sampleId,
        collaborationId,
        quantity: values.quantity,
        shippingCost: shippingCostInCents,
        trackingNumber: values.trackingNumber,
      });
      
      // 如果当前阶段在"已寄样"之前,自动推进到"已寄样"
      if (collaboration && ['LEAD', 'CONTACTED', 'QUOTED'].includes(collaboration.stage)) {
        try {
          await updateStage(collaborationId, 'SAMPLED', '添加寄样记录,自动推进到已寄样阶段');
        } catch (error) {
          console.error('自动更新阶段失败:', error);
          // 即使阶段更新失败,寄样记录也已经添加成功了
        }
      }
      
      message.success('寄样记录已添加');
      setDispatchModalVisible(false); // 先关闭模态框
      dispatchForm.resetFields(); // 重置表单
      
      // 延迟刷新,确保模态框已关闭
      setTimeout(() => {
        fetchCollaboration(); // 刷新当前详情数据
        onClose(true); // 通知父组件刷新列表
      }, 100);
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.response?.data?.error?.message || '添加寄样记录失败');
    }
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
      children: (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleDispatchSample}
            style={{ marginBottom: 16 }}
          >
            添加寄样
          </Button>
          {collaboration?.dispatches && (
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
                        {item.trackingNumber && (
                          <Text type="secondary">
                            快递单号: {item.trackingNumber}
                          </Text>
                        )}
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
          )}
        </div>
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

      {/* 添加寄样模态框 */}
      <Modal
        title="添加寄样记录"
        open={dispatchModalVisible}
        onOk={handleDispatchSubmit}
        onCancel={() => setDispatchModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={dispatchForm} layout="vertical">
          <Form.Item
            name="sampleId"
            label="选择样品"
            rules={[{ required: true, message: '请选择样品' }]}
          >
            <Select
              placeholder="请选择样品"
              showSearch
              optionFilterProp="children"
              options={samples.map((sample) => ({
                label: `${sample.name} (${sample.sku})`,
                value: sample.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="寄样数量"
            rules={[
              { required: true, message: '请输入寄样数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            name="shippingCost"
            label="快递费（元）"
            rules={[
              { required: true, message: '请输入快递费' },
              { type: 'number', min: 0, message: '快递费不能为负数' },
            ]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入快递费"
            />
          </Form.Item>
          <Form.Item name="trackingNumber" label="快递单号">
            <Input placeholder="请输入快递单号（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default CollaborationModal;
