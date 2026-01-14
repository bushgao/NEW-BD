import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { PlanType } from '@ics/shared';
import {
  listPlanConfigs,
  createPlanConfig,
  updatePlanConfig,
  deletePlanConfig,
  formatMoney,
  getPlanTypeColor,
  getPlanTypeText,
  type PlanConfigData,
  type CreatePlanConfigInput,
  type UpdatePlanConfigInput,
} from '../../services/platform.service';

const { Option } = Select;
const { TextArea } = Input;

const PlanConfigList = () => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlanConfigData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfigData | null>(null);
  const [form] = Form.useForm();

  // 加载套餐配置列表
  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await listPlanConfigs();
      setPlans(data);
    } catch (error) {
      message.error('加载套餐配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // 打开新建弹窗
  const handleAdd = () => {
    setEditingPlan(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (plan: PlanConfigData) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      ...plan,
      price: plan.price / 100, // 转换为元
      features: plan.features.join('\n'),
    });
    setModalVisible(true);
  };

  // 保存套餐配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 处理功能列表
      const features = values.features
        ? values.features.split('\n').filter((f: string) => f.trim())
        : [];

      const data = {
        ...values,
        price: Math.round(values.price * 100), // 转换为分
        features,
      };

      if (editingPlan) {
        // 更新
        const updateData: UpdatePlanConfigInput = {
          name: data.name,
          staffLimit: data.staffLimit,
          influencerLimit: data.influencerLimit,
          dataRetentionDays: data.dataRetentionDays,
          price: data.price,
          features: data.features,
        };
        await updatePlanConfig(editingPlan.planType, updateData);
        message.success('更新成功');
      } else {
        // 新建
        const createData: CreatePlanConfigInput = {
          planType: data.planType,
          name: data.name,
          staffLimit: data.staffLimit,
          influencerLimit: data.influencerLimit,
          dataRetentionDays: data.dataRetentionDays,
          price: data.price,
          features: data.features,
        };
        await createPlanConfig(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadPlans();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 删除套餐配置
  const handleDelete = async (planType: PlanType) => {
    try {
      await deletePlanConfig(planType);
      message.success('删除成功');
      loadPlans();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<PlanConfigData> = [
    {
      title: '套餐类型',
      dataIndex: 'planType',
      key: 'planType',
      width: 120,
      render: (planType: PlanType) => (
        <Tag color={getPlanTypeColor(planType)}>{getPlanTypeText(planType)}</Tag>
      ),
    },
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '商务账号上限',
      dataIndex: 'staffLimit',
      key: 'staffLimit',
      width: 120,
      align: 'right',
    },
    {
      title: '达人数量上限',
      dataIndex: 'influencerLimit',
      key: 'influencerLimit',
      width: 120,
      align: 'right',
    },
    {
      title: '数据保留天数',
      dataIndex: 'dataRetentionDays',
      key: 'dataRetentionDays',
      width: 120,
      align: 'right',
      render: (days: number) => `${days} 天`,
    },
    {
      title: '价格（元/月）',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (price: number) => `¥${formatMoney(price)}`,
    },
    {
      title: '功能特性',
      dataIndex: 'features',
      key: 'features',
      ellipsis: true,
      render: (features: string[]) => features.join('、'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此套餐配置吗？"
            description="如果有品牌正在使用此套餐，将无法删除"
            onConfirm={() => handleDelete(record.planType)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建套餐
        </Button>
      </div>

      {/* 套餐列表表格 */}
      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={false}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingPlan ? '编辑套餐' : '新建套餐'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingPlan && (
            <Form.Item
              name="planType"
              label="套餐类型"
              rules={[{ required: true, message: '请选择套餐类型' }]}
            >
              <Select placeholder="请选择套餐类型">
                <Option value="FREE">免费版</Option>
                <Option value="PROFESSIONAL">专业版</Option>
                <Option value="ENTERPRISE">企业版</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="请输入套餐名称" />
          </Form.Item>
          <Form.Item
            name="staffLimit"
            label="商务账号上限"
            rules={[{ required: true, message: '请输入商务账号上限' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入商务账号上限" />
          </Form.Item>
          <Form.Item
            name="influencerLimit"
            label="达人数量上限"
            rules={[{ required: true, message: '请输入达人数量上限' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入达人数量上限" />
          </Form.Item>
          <Form.Item
            name="dataRetentionDays"
            label="数据保留天数"
            rules={[{ required: true, message: '请输入数据保留天数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数据保留天数" />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格（元/月）"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入价格"
              prefix="¥"
            />
          </Form.Item>
          <Form.Item
            name="features"
            label="功能特性"
            extra="每行一个功能特性"
          >
            <TextArea
              rows={4}
              placeholder="请输入功能特性，每行一个"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlanConfigList;
