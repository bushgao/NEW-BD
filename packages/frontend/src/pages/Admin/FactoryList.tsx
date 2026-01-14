import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  message,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BrandStatus, PlanType } from '@ics/shared';
import {
  listFactories,
  reviewFactory,
  updateFactory,
  deleteBrand,
  toggleBrandStatus,
  getStatusColor,
  getStatusText,
  getPlanTypeColor,
  getPlanTypeText,
  type FactoryWithOwner,
  type FactoryFilter,
} from '../../services/platform.service';
import FactoryDetailModal from './FactoryDetailModal';

const { Option } = Select;

interface FactoryListProps {
  onRefresh?: () => void;
}

const FactoryList = ({ onRefresh }: FactoryListProps) => {
  const [loading, setLoading] = useState(false);
  const [factories, setFactories] = useState<FactoryWithOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FactoryFilter>({
    page: 1,
    pageSize: 10,
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFactory, setEditingFactory] = useState<FactoryWithOwner | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // 加载品牌列表
  const loadFactories = async () => {
    setLoading(true);
    try {
      const result = await listFactories(filter);
      setFactories(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('加载品牌列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactories();
  }, [filter]);

  // 审核品牌
  const handleReview = async (brandId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewFactory(brandId, status);
      message.success(status === 'APPROVED' ? '已通过审核' : '已拒绝申请');
      loadFactories();
      onRefresh?.();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 暂停/恢复品牌
  const handleToggleStatus = async (brandId: string, suspend: boolean) => {
    try {
      await toggleBrandStatus(brandId, suspend);
      message.success(suspend ? '已暂停品牌' : '已恢复品牌');
      loadFactories();
      onRefresh?.();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 打开详情弹窗
  const handleViewDetail = (brandId: string) => {
    setSelectedFactoryId(brandId);
    setDetailModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (factory: FactoryWithOwner) => {
    setEditingFactory(factory);
    form.setFieldsValue({
      planType: factory.planType,
      staffLimit: factory.staffLimit,
      influencerLimit: factory.influencerLimit,
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingFactory) return;

    try {
      const values = await form.validateFields();
      await updateFactory(editingFactory.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      loadFactories();
      onRefresh?.();
    } catch (error) {
      message.error('更新失败');
      console.error(error);
    }
  };

  // 删除品牌
  const handleDelete = async (brandId: string) => {
    try {
      await deleteBrand(brandId);
      message.success('删除成功');
      loadFactories();
      onRefresh?.();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<FactoryWithOwner> = [
    {
      title: '品牌名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '负责人',
      dataIndex: ['owner', 'name'],
      key: 'ownerName',
      width: 100,
    },
    {
      title: '邮箱',
      dataIndex: ['owner', 'email'],
      key: 'ownerEmail',
      width: 180,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BrandStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '套餐',
      dataIndex: 'planType',
      key: 'planType',
      width: 100,
      render: (planType: PlanType) => (
        <Tag color={getPlanTypeColor(planType)}>{getPlanTypeText(planType)}</Tag>
      ),
    },
    {
      title: '商务/上限',
      key: 'staffCount',
      width: 100,
      render: (_, record) => (
        <span>
          {record._count?.staff || 0} / {record.staffLimit}
        </span>
      ),
    },
    {
      title: '达人/上限',
      key: 'influencerCount',
      width: 100,
      render: (_, record) => (
        <span>
          {record._count?.influencers || 0} / {record.influencerLimit}
        </span>
      ),
    },
    {
      title: '合作数',
      dataIndex: ['_count', 'collaborations'],
      key: 'collaborations',
      width: 80,
      render: (count: number) => count || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="通过">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleReview(record.id, 'APPROVED')}
                />
              </Tooltip>
              <Popconfirm
                title="确定拒绝此品牌的入驻申请吗？"
                onConfirm={() => handleReview(record.id, 'REJECTED')}
              >
                <Tooltip title="拒绝">
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Popconfirm
              title="确定暂停此品牌吗？"
              onConfirm={() => handleToggleStatus(record.id, true)}
            >
              <Tooltip title="暂停">
                <Button size="small" icon={<PauseOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'SUSPENDED' && (
            <Tooltip title="恢复">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleToggleStatus(record.id, false)}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此品牌吗？"
            description="删除后无法恢复，相关数据也会被清除"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选栏 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="搜索品牌名称/负责人"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          allowClear
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, keyword: e.target.value, page: 1 }))
          }
        />
        <Select
          placeholder="状态"
          style={{ width: 120 }}
          allowClear
          onChange={(value) =>
            setFilter((prev) => ({ ...prev, status: value, page: 1 }))
          }
        >
          <Option value="PENDING">待审核</Option>
          <Option value="APPROVED">已通过</Option>
          <Option value="REJECTED">已拒绝</Option>
          <Option value="SUSPENDED">已暂停</Option>
        </Select>
        <Select
          placeholder="套餐"
          style={{ width: 120 }}
          allowClear
          onChange={(value) =>
            setFilter((prev) => ({ ...prev, planType: value, page: 1 }))
          }
        >
          <Option value="FREE">免费版</Option>
          <Option value="PROFESSIONAL">专业版</Option>
          <Option value="ENTERPRISE">企业版</Option>
        </Select>
      </Space>

      {/* 品牌列表表格 */}
      <Table
        columns={columns}
        dataSource={factories}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          current: filter.page,
          pageSize: filter.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) =>
            setFilter((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      {/* 编辑弹窗 */}
      <Modal
        title="编辑品牌"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="planType"
            label="套餐类型"
            rules={[{ required: true, message: '请选择套餐类型' }]}
          >
            <Select>
              <Option value="FREE">免费版</Option>
              <Option value="PROFESSIONAL">专业版</Option>
              <Option value="ENTERPRISE">企业版</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="staffLimit"
            label="商务账号上限"
            rules={[{ required: true, message: '请输入商务账号上限' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="influencerLimit"
            label="达人数量上限"
            rules={[{ required: true, message: '请输入达人数量上限' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 品牌详情弹窗 */}
      <FactoryDetailModal
        brandId={selectedFactoryId}
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedFactoryId(null);
        }}
      />
    </div>
  );
};

export default FactoryList;
