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
  DatePicker,
  Switch,
  Divider,
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
  LockOutlined,
  UnlockOutlined,
  GiftOutlined,
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
import dayjs from 'dayjs';

const { Option } = Select;


// 套餐预设配置
// 核心原则：功能全开，只按团队规模区分
const PLAN_PRESETS: Record<string, { staffLimit: number; influencerLimit: number; days: number }> = {
  FREE: { staffLimit: 1, influencerLimit: 50, days: 30 },         // 免费版：30天试用
  PERSONAL: { staffLimit: 1, influencerLimit: 100, days: 365 },   // 个人版：1年，¥399
  PROFESSIONAL: { staffLimit: 5, influencerLimit: 500, days: 365 }, // 专业版：1年，¥699
  ENTERPRISE: { staffLimit: 20, influencerLimit: 2000, days: 365 }, // 企业版：1年，¥999
};

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

  // 赠送额度状态
  const [bonusStaff, setBonusStaff] = useState(0);
  const [bonusInfluencer, setBonusInfluencer] = useState(0);
  const [bonusDays, setBonusDays] = useState(0);

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

  // 切换套餐类型时自动填充预设值
  const handlePlanTypeChange = (planType: string) => {
    const preset = PLAN_PRESETS[planType];
    if (preset) {
      form.setFieldsValue({
        staffLimit: preset.staffLimit,
        influencerLimit: preset.influencerLimit,
      });
      // 计算到期时间
      if (preset.days > 0) {
        const expiresAt = dayjs().add(preset.days, 'day');
        form.setFieldsValue({ planExpiresAt: expiresAt });
      } else {
        form.setFieldsValue({ planExpiresAt: null });
      }
    }
    // 重置赠送额度
    setBonusStaff(0);
    setBonusInfluencer(0);
    setBonusDays(0);
  };

  // 打开编辑弹窗
  const handleEdit = (factory: FactoryWithOwner) => {
    setEditingFactory(factory);
    form.setFieldsValue({
      planType: factory.planType,
      staffLimit: factory.staffLimit,
      influencerLimit: factory.influencerLimit,
      planExpiresAt: factory.planExpiresAt ? dayjs(factory.planExpiresAt) : null,
      isPaid: factory.isPaid,
    });
    // 重置赠送额度
    setBonusStaff(0);
    setBonusInfluencer(0);
    setBonusDays(0);
    setEditModalVisible(true);
  };

  // 应用赠送额度
  const applyBonus = () => {
    const currentStaff = form.getFieldValue('staffLimit') || 0;
    const currentInfluencer = form.getFieldValue('influencerLimit') || 0;
    const currentExpires = form.getFieldValue('planExpiresAt');

    // 加上赠送的商务账号
    if (bonusStaff > 0) {
      form.setFieldsValue({ staffLimit: currentStaff + bonusStaff });
    }

    // 加上赠送的达人数量
    if (bonusInfluencer > 0) {
      form.setFieldsValue({ influencerLimit: currentInfluencer + bonusInfluencer });
    }

    // 加上赠送的天数
    if (bonusDays > 0 && currentExpires) {
      const newExpires = dayjs(currentExpires).add(bonusDays, 'day');
      form.setFieldsValue({ planExpiresAt: newExpires });
    } else if (bonusDays > 0 && !currentExpires) {
      // 如果原来没有到期时间，从今天开始计算
      const newExpires = dayjs().add(bonusDays, 'day');
      form.setFieldsValue({ planExpiresAt: newExpires });
    }

    message.success('已应用赠送额度');
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingFactory) return;

    try {
      const values = await form.validateFields();

      // 自动累加赠送额度
      let finalStaffLimit = values.staffLimit + bonusStaff;
      let finalInfluencerLimit = values.influencerLimit + bonusInfluencer;
      let finalExpiresAt = values.planExpiresAt;

      // 累加赠送天数
      if (bonusDays > 0) {
        if (finalExpiresAt) {
          finalExpiresAt = dayjs(finalExpiresAt).add(bonusDays, 'day');
        } else {
          // 如果没有设置到期时间，从今天开始计算
          finalExpiresAt = dayjs().add(bonusDays, 'day');
        }
      }

      // 构建提交数据 - 包含赠送额度以便记录到数据库
      const submitData = {
        ...values,
        staffLimit: finalStaffLimit,
        influencerLimit: finalInfluencerLimit,
        planExpiresAt: finalExpiresAt ? finalExpiresAt.toISOString() : null,
        // 记录赠送额度到数据库
        bonusStaff: (editingFactory.bonusStaff || 0) + bonusStaff,
        bonusInfluencer: (editingFactory.bonusInfluencer || 0) + bonusInfluencer,
        bonusDays: (editingFactory.bonusDays || 0) + bonusDays,
      };


      await updateFactory(editingFactory.id, submitData);

      // 如果有赠送额度，显示详细信息
      if (bonusStaff > 0 || bonusInfluencer > 0 || bonusDays > 0) {
        const bonusInfo = [];
        if (bonusStaff > 0) bonusInfo.push(`商务+${bonusStaff}`);
        if (bonusInfluencer > 0) bonusInfo.push(`达人+${bonusInfluencer}`);
        if (bonusDays > 0) bonusInfo.push(`天数+${bonusDays}`);
        message.success(`更新成功，已应用赠送：${bonusInfo.join('，')}`);
      } else {
        message.success('更新成功');
      }

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
      title: '手机号',
      dataIndex: ['owner', 'phone'],
      key: 'ownerPhone',
      width: 130,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: ['owner', 'email'],
      key: 'ownerEmail',
      width: 180,
      ellipsis: true,
      render: (email: string | null) => {
        if (!email) return '-';
        if (email.includes('@phone.local') || email.includes('@temp.local')) return '-';
        return email;
      },
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
      title: '剩余天数',
      key: 'daysRemaining',
      width: 100,
      render: (_, record) => {
        if (!record.planExpiresAt) return <span style={{ color: '#999' }}>未设置</span>;
        const days = Math.ceil((new Date(record.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days <= 0) return <Tag color="red">已到期</Tag>;
        if (days <= 5) return <Tag color="orange">{days} 天</Tag>;
        if (days <= 30) return <Tag color="gold">{days} 天</Tag>;
        return <span style={{ color: '#52c41a' }}>{days} 天</span>;
      },
    },
    {
      title: '锁定状态',
      dataIndex: 'isLocked',
      key: 'isLocked',
      width: 90,
      render: (isLocked: boolean) => (
        isLocked
          ? <Tag color="red" icon={<LockOutlined />}>已锁定</Tag>
          : <Tag color="green" icon={<UnlockOutlined />}>正常</Tag>
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
          <Option value="PERSONAL">个人版</Option>
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
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="planType"
            label="套餐类型"
            rules={[{ required: true, message: '请选择套餐类型' }]}
          >
            <Select onChange={handlePlanTypeChange}>
              <Option value="FREE">免费版</Option>
              <Option value="PERSONAL">个人版</Option>
              <Option value="PROFESSIONAL">专业版</Option>
              <Option value="ENTERPRISE">企业版</Option>
            </Select>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }}>配额设置</Divider>

          {/* 商务账号上限 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="staffLimit"
              label="商务账号上限"
              rules={[{ required: true, message: '请输入' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={<><GiftOutlined /> 赠送</>} style={{ width: 120 }}>
              <InputNumber
                min={0}
                value={bonusStaff}
                onChange={(v) => setBonusStaff(v || 0)}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          {/* 达人数量上限 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="influencerLimit"
              label="达人数量上限"
              rules={[{ required: true, message: '请输入' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={<><GiftOutlined /> 赠送</>} style={{ width: 120 }}>
              <InputNumber
                min={0}
                value={bonusInfluencer}
                onChange={(v) => setBonusInfluencer(v || 0)}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          {/* 套餐到期时间 */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="planExpiresAt"
              label="套餐到期时间"
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} placeholder="留空表示永不过期" />
            </Form.Item>
            <Form.Item label={<><GiftOutlined /> 赠送天数</>} style={{ width: 120 }}>
              <InputNumber
                min={0}
                value={bonusDays}
                onChange={(v) => setBonusDays(v || 0)}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          {(bonusStaff > 0 || bonusInfluencer > 0 || bonusDays > 0) && (
            <div style={{ marginBottom: 16 }}>
              <Button
                type="dashed"
                icon={<GiftOutlined />}
                onClick={applyBonus}
                block
              >
                应用赠送额度 (商务+{bonusStaff}, 达人+{bonusInfluencer}, 天数+{bonusDays})
              </Button>
            </div>
          )}

          <Divider style={{ margin: '12px 0' }}>付费状态</Divider>

          <Form.Item
            name="isPaid"
            label="是否付费用户"
            valuePropName="checked"
          >
            <Switch checkedChildren="已付费" unCheckedChildren="试用中" />
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

