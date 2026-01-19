import { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Table, Button, message, Spin, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getFactoryById,
  getBrandStaff,
  getStatusColor,
  getStatusText,
  getPlanTypeColor,
  getPlanTypeText,
  type FactoryWithOwner,
  type BrandStaffMember,
} from '../../services/platform.service';
import StaffDetailModal from './StaffDetailModal';

interface FactoryDetailModalProps {
  brandId: string | null;
  visible: boolean;
  onClose: () => void;
}

const FactoryDetailModal = ({ brandId, visible, onClose }: FactoryDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [factory, setFactory] = useState<FactoryWithOwner | null>(null);
  const [staff, setStaff] = useState<BrandStaffMember[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [staffDetailVisible, setStaffDetailVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // 加载品牌详情
  const loadFactory = async () => {
    if (!brandId) return;

    setLoading(true);
    try {
      const data = await getFactoryById(brandId);
      setFactory(data);
    } catch (error) {
      message.error('加载品牌详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载商务列表
  const loadStaff = async () => {
    if (!brandId) return;

    setLoading(true);
    try {
      const data = await getBrandStaff(brandId);
      setStaff(data);
    } catch (error) {
      message.error('加载商务列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && brandId) {
      loadFactory();
      loadStaff();
    }
  }, [visible, brandId]);

  // 查看商务详情
  const handleViewStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setStaffDetailVisible(true);
  };

  // 商务列表列定义
  const staffColumns: ColumnsType<BrandStaffMember> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '添加达人',
      dataIndex: ['_count', 'influencers'],
      key: 'influencers',
      render: (count: number) => count || 0,
    },
    {
      title: '创建合作',
      dataIndex: ['_count', 'collaborations'],
      key: 'collaborations',
      render: (count: number) => count || 0,
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BrandStaffMember) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewStaff(record.id)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Spin spinning={loading}>
          {factory && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="品牌名称">{factory.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(factory.status)}>
                  {getStatusText(factory.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="套餐类型">
                <Tag color={getPlanTypeColor(factory.planType)}>
                  {getPlanTypeText(factory.planType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责人">{factory.owner.name}</Descriptions.Item>
              <Descriptions.Item label="负责人邮箱">{factory.owner.email}</Descriptions.Item>
              <Descriptions.Item label="商务账号">
                {factory._count?.staff || 0} / {factory.staffLimit}
                {factory.bonusStaff ? <Tag color="green" style={{ marginLeft: 8 }}>赠送 +{factory.bonusStaff}</Tag> : null}
              </Descriptions.Item>
              <Descriptions.Item label="达人数量">
                {factory._count?.influencers || 0} / {factory.influencerLimit}
                {factory.bonusInfluencer ? <Tag color="green" style={{ marginLeft: 8 }}>赠送 +{factory.bonusInfluencer}</Tag> : null}
              </Descriptions.Item>
              <Descriptions.Item label="合作数量">
                {factory._count?.collaborations || 0}
              </Descriptions.Item>
              <Descriptions.Item label="套餐到期">
                {factory.planExpiresAt
                  ? new Date(factory.planExpiresAt).toLocaleDateString('zh-CN')
                  : '永久'}
                {factory.bonusDays ? <Tag color="green" style={{ marginLeft: 8 }}>赠送 +{factory.bonusDays}天</Tag> : null}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(factory.createdAt).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(factory.updatedAt).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Spin>
      ),

    },
    {
      key: 'staff',
      label: `商务团队 (${staff.length})`,
      children: (
        <div>
          <Table
            columns={staffColumns}
            dataSource={staff}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={factory ? `品牌详情 - ${factory.name}` : '品牌详情'}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Modal>

      {/* 商务详情弹窗 */}
      <StaffDetailModal
        staffId={selectedStaffId}
        visible={staffDetailVisible}
        onClose={() => {
          setStaffDetailVisible(false);
          setSelectedStaffId(null);
        }}
      />
    </>
  );
};

export default FactoryDetailModal;
