import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Upload,
  Tag,
  Divider,
  Typography,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  PictureOutlined,
  CloseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { CollaborationCard } from '../../services/collaboration.service';

const { TextArea } = Input;
const { Text } = Typography;

interface QuickFollowUpModalProps {
  visible: boolean;
  collaboration: CollaborationCard | null;
  onClose: (refresh?: boolean) => void;
}

interface FollowUpTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

const QuickFollowUpModal = ({ visible, collaboration, onClose }: QuickFollowUpModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<FollowUpTemplate[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Fetch templates when modal opens
  useEffect(() => {
    if (visible) {
      fetchTemplates();
    } else {
      // Reset form when modal closes
      form.resetFields();
      setFileList([]);
      setIsListening(false);
    }
  }, [visible, form]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/collaborations/follow-up-templates', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const result = await response.json();
      setTemplates(result.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      // Set default templates if API fails
      setTemplates([
        {
          id: '1',
          name: '初次联系',
          content: '您好，我是{公司名称}的商务，看到您的账号内容很不错，想和您聊聊合作的事情。',
          category: '初次接触',
        },
        {
          id: '2',
          name: '报价跟进',
          content: '您好，关于上次的合作报价，不知道您考虑得怎么样了？如果有任何问题，欢迎随时沟通。',
          category: '报价阶段',
        },
        {
          id: '3',
          name: '样品确认',
          content: '您好，样品已经寄出，预计{天数}天内送达。收到后请及时确认，有任何问题随时联系我。',
          category: '寄样阶段',
        },
        {
          id: '4',
          name: '排期提醒',
          content: '您好，想确认一下视频的发布时间，我们这边需要提前做好准备工作。',
          category: '排期阶段',
        },
        {
          id: '5',
          name: '发布确认',
          content: '您好，看到视频已经发布了，效果很不错！麻烦您把视频链接和数据发给我，方便我们这边统计。',
          category: '发布阶段',
        },
      ]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateClick = (template: FollowUpTemplate) => {
    const currentContent = form.getFieldValue('content') || '';
    const newContent = currentContent ? `${currentContent}\n\n${template.content}` : template.content;
    form.setFieldsValue({ content: newContent });
  };

  const handleVoiceInput = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      message.warning('您的浏览器不支持语音输入功能，请使用 Chrome 浏览器');
      return;
    }

    if (isListening) {
      // Stop listening
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      message.info('正在录音，请说话...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const currentContent = form.getFieldValue('content') || '';
      const newContent = currentContent ? `${currentContent}\n${transcript}` : transcript;
      form.setFieldsValue({ content: newContent });
      message.success('语音识别成功');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      message.error('语音识别失败，请重试');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (!collaboration) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('content', values.content);

      // Add images if any
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      const response = await fetch(`/api/collaborations/${collaboration.id}/follow-up/quick`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '添加跟进记录失败');
      }

      message.success('跟进记录已添加');
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.message || '添加跟进记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const handleRemoveFile = (file: UploadFile) => {
    setFileList(fileList.filter((f) => f.uid !== file.uid));
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, FollowUpTemplate[]>);

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          快速跟进
          {collaboration && (
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              - {collaboration.influencer.nickname}
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={() => onClose()}
      width={800}
      footer={[
        <Button key="cancel" onClick={() => onClose()}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleSubmit}
        >
          发送跟进
        </Button>,
      ]}
    >
      <Spin spinning={templatesLoading}>
        {/* Templates Section */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>快速模板</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            点击模板快速填充内容
          </Text>
          <div style={{ marginTop: 8 }}>
            {Object.keys(groupedTemplates).length > 0 ? (
              Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {category}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Space size={[8, 8]} wrap>
                      {categoryTemplates.map((template) => (
                        <Tag
                          key={template.id}
                          color="blue"
                          style={{ cursor: 'pointer', margin: 0 }}
                          onClick={() => handleTemplateClick(template)}
                        >
                          {template.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                暂无模板
              </Text>
            )}
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Follow-up Form */}
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入跟进内容..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* Action Buttons */}
          <Row gutter={8}>
            <Col>
              <Button
                icon={<AudioOutlined />}
                onClick={handleVoiceInput}
                type={isListening ? 'primary' : 'default'}
                danger={isListening}
              >
                {isListening ? '正在录音...' : '语音输入'}
              </Button>
            </Col>
            <Col>
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept="image/*"
                multiple
                showUploadList={false}
              >
                <Button icon={<PictureOutlined />}>上传图片</Button>
              </Upload>
            </Col>
          </Row>

          {/* Image Preview */}
          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已选择图片 ({fileList.length})</Text>
              <div style={{ marginTop: 8 }}>
                <Space size={[8, 8]} wrap>
                  {fileList.map((file) => (
                    <div
                      key={file.uid}
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={file.thumbUrl || URL.createObjectURL(file.originFileObj as Blob)}
                        alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveFile(file)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          border: 'none',
                        }}
                      />
                    </div>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </Form>

        {/* Tips */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#f0f5ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#595959',
          }}
        >
          <Text strong style={{ fontSize: 12 }}>
            💡 小提示：
          </Text>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
            <li>点击模板可以快速填充常用话术</li>
            <li>支持语音输入，点击"语音输入"按钮开始录音（需要 Chrome 浏览器）</li>
            <li>可以上传图片作为跟进记录的附件</li>
            <li>跟进记录会自动记录时间</li>
          </ul>
        </div>
      </Spin>
    </Modal>
  );
};

export default QuickFollowUpModal;
