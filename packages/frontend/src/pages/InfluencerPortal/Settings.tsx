/**
 * 达人账号设置页
 * 
 * 显示账号信息和联系人管理
 */

import { useEffect, useState } from 'react';
import { Card, Descriptions, Table, Button, Modal, Form, Input, Select, Space, message, Typography, Spin, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, MobileOutlined } from '@ant-design/icons';
import * as influencerPortalService from '../../services/influencer-portal.service';
import type { InfluencerAccountInfo, InfluencerContact, AddContactInput } from '../../services/influencer-portal.service';
import { useInfluencerPortalStore, getContactTypeName } from '../../stores/influencerPortalStore';

const { Title, Text } = Typography;

const contactTypeOptions = [
  { label: '本人', value: 'SELF' },
  { label: '助理', value: 'ASSISTANT' },
  { label: '经纪人', value: 'AGENT' },
  { label: '其他', value: 'OTHER' },
];

const InfluencerSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<InfluencerAccountInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { contact: currentContact } = useInfluencerPortalStore();

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const response = await influencerPortalService.getAccount();
      if (response.success && response.data) {
        setAccount(response.data);
      } else {
        message.error(response.error?.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (values: AddContactInput) => {
    setSubmitting(true);
    try {
      const response = await influencerPortalService.addContact(values);
      if (response.success) {
        message.success('联系人添加成功');
        setModalVisible(false);
        form.resetFields();
        loadAccount();
      } else {
        message.error(response.error?.message || '添加失败');
      }
    } catch (error) {
      message.error('添加失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      const response = await influencerPortalService.removeContact(contactId);
      if (response.success) {
        message.success('联系人已移除');
        loadAccount();
      } else {
        message.error(response.error?.message || '移除失败');
      }
    } catch (error) {
      message.error('移除失败，请稍后重试');
    }
  };

  const getContactTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      SELF: 'purple',
      ASSISTANT: 'blue',
      AGENT: 'green',
      OTHER: 'default',
    };
    return <Tag color={colors[type] || 'default'}>{getContactTypeName(type)}</Tag>;
  };

  const columns = [
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => (
        <Space>
          <MobileOutlined />
          <span>{phone}</span>
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name || <Text type="secondary">未设置</Text>,
    },
    {
      title: '类型',
      dataIndex: 'contactType',
      key: 'contactType',
      render: (type: string) => getContactTypeTag(type),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string | null) =>
        date ? new Date(date).toLocaleString('zh-CN') : <Text type="secondary">从未登录</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InfluencerContact) => {
        // 不能删除自己
        if (record.id === currentContact?.id) {
          return <Text type="secondary">当前登录</Text>;
        }
        // 不能删除主账号的本人联系人
        if (record.contactType === 'SELF' && record.phone === account?.primaryPhone) {
          return <Text type="secondary">主账号</Text>;
        }
        return (
          <Popconfirm
            title="确定要移除该联系人吗？"
            description="移除后该联系人将无法再登录查看数据"
            onConfirm={() => handleRemoveContact(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              移除
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        账号设置
      </Title>

      {/* 账号信息 */}
      <Card title="账号信息" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="主手机号">
            <Space>
              <MobileOutlined />
              {account?.primaryPhone}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {account?.createdAt ? new Date(account.createdAt).toLocaleDateString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 联系人管理 */}
      <Card
        title="联系人管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            添加联系人
          </Button>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          您可以添加助理或经纪人的手机号，让他们也能登录查看您的样品和合作信息。
        </Text>
        <Table
          dataSource={account?.contacts || []}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 添加联系人弹窗 */}
      <Modal
        title="添加联系人"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddContact}
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input
              prefix={<MobileOutlined />}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入姓名（选填）"
            />
          </Form.Item>
          <Form.Item
            name="contactType"
            label="联系人类型"
            rules={[{ required: true, message: '请选择联系人类型' }]}
          >
            <Select
              placeholder="请选择联系人类型"
              options={contactTypeOptions}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InfluencerSettingsPage;
