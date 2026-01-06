import { useState } from 'react';
import { Modal, Input, Form, message, Steps, Button, Space, Typography, Alert } from 'antd';
import { LinkOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { Platform } from '@ics/shared';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface QuickAddModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: QuickAddData) => void;
}

export interface QuickAddData {
  nickname: string;
  platform: Platform;
  platformId: string;
  phone?: string;
  categories?: string[];
  tags?: string[];
}

/**
 * 从抖音精选联盟链接中提取 UID
 */
function extractDouyinUID(url: string): string | null {
  try {
    // 匹配 uid= 后面的参数值
    const match = url.match(/[?&]uid=([^&]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 快速添加达人模态框
 * 支持通过抖音精选联盟链接快速添加达人
 */
const QuickAddModal: React.FC<QuickAddModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [extractedUID, setExtractedUID] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUrlParse = () => {
    if (!urlInput.trim()) {
      message.warning('请粘贴达人链接');
      return;
    }

    // 提取 UID
    const uid = extractDouyinUID(urlInput);
    
    if (!uid) {
      message.error('无法从链接中提取达人信息，请检查链接格式');
      return;
    }

    setExtractedUID(uid);
    
    // 预填充表单
    form.setFieldsValue({
      platform: 'DOUYIN',
      platformId: uid,
    });

    message.success('链接解析成功！请补充达人信息');
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 构造数据
      const data: QuickAddData = {
        nickname: values.nickname,
        platform: values.platform || 'DOUYIN',
        platformId: values.platformId || extractedUID || '',
        phone: values.phone,
        categories: values.categories ? values.categories.split(',').map((c: string) => c.trim()) : [],
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
      };

      onSuccess(data);
      handleReset();
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setUrlInput('');
    setExtractedUID(null);
    form.resetFields();
  };

  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  return (
    <Modal
      title="通过链接快速添加达人"
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={null}
    >
      <Steps
        current={currentStep}
        items={[
          {
            title: '粘贴链接',
            icon: <LinkOutlined />,
          },
          {
            title: '补充信息',
            icon: <UserOutlined />,
          },
          {
            title: '完成',
            icon: <CheckCircleOutlined />,
          },
        ]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 && (
        <div>
          <Alert
            message="使用说明"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  1. 打开抖音精选联盟，找到目标达人的详情页
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  2. 复制浏览器地址栏中的完整链接
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  3. 粘贴到下方输入框，点击"解析链接"
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <TextArea
            placeholder="粘贴抖音精选联盟达人链接，例如：https://buyin.jinritemai.com/dashboard/servicehall/daren-profile?uid=..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            rows={4}
            style={{ marginBottom: 16 }}
          />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleUrlParse} icon={<LinkOutlined />}>
              解析链接
            </Button>
          </Space>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message="链接解析成功"
            description={
              <div>
                <Text>已提取达人 UID：</Text>
                <Text code copyable style={{ marginLeft: 8 }}>
                  {extractedUID}
                </Text>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item
              label="达人昵称"
              name="nickname"
              rules={[{ required: true, message: '请输入达人昵称' }]}
            >
              <Input placeholder="请输入达人昵称" />
            </Form.Item>

            <Form.Item label="平台" name="platform" initialValue="DOUYIN">
              <Input disabled value="抖音" />
            </Form.Item>

            <Form.Item label="平台 ID" name="platformId">
              <Input disabled />
            </Form.Item>

            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入有效的手机号码',
                },
              ]}
            >
              <Input placeholder="请输入联系电话（选填）" />
            </Form.Item>

            <Form.Item label="类目" name="categories">
              <Input placeholder="请输入类目，多个类目用逗号分隔（选填）" />
            </Form.Item>

            <Form.Item label="标签" name="tags">
              <Input placeholder="请输入标签，多个标签用逗号分隔（选填）" />
            </Form.Item>
          </Form>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              添加达人
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default QuickAddModal;
