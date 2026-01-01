import { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  List,
  Typography,
  Space,
  Button,
  message,
  Spin,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import {
  getFollowUps,
  addFollowUp,
  type CollaborationCard,
  type FollowUpRecord,
} from '../../services/collaboration.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

interface FollowUpModalProps {
  visible: boolean;
  collaboration: CollaborationCard | null;
  onClose: (refresh?: boolean) => void;
}

const FollowUpModal = ({ visible, collaboration, onClose }: FollowUpModalProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible && collaboration) {
      fetchFollowUps();
    }
  }, [visible, collaboration]);

  const fetchFollowUps = async () => {
    if (!collaboration) return;
    setLoading(true);
    try {
      const result = await getFollowUps(collaboration.id, 1, 100);
      setFollowUps(result.data);
    } catch (error) {
      message.error('获取跟进记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!collaboration || !content.trim()) {
      message.warning('请输入跟进内容');
      return;
    }

    setSubmitting(true);
    try {
      const newFollowUp = await addFollowUp(collaboration.id, content.trim());
      setFollowUps([newFollowUp, ...followUps]);
      setContent('');
      message.success('跟进记录已添加');
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    onClose(followUps.length > 0);
  };

  return (
    <Modal
      title={`跟进记录 - ${collaboration?.influencer.nickname || ''}`}
      open={visible}
      onCancel={handleClose}
      width={500}
      footer={null}
    >
      {/* Input Area */}
      <div style={{ marginBottom: 16 }}>
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入跟进内容..."
          rows={3}
          maxLength={500}
          showCount
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!content.trim()}
          >
            添加跟进
          </Button>
        </div>
      </div>

      {/* Follow Up List */}
      <Spin spinning={loading}>
        <List
          dataSource={followUps}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 0' }}>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{item.user?.name || '未知用户'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  </Space>
                }
                description={
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                    {item.content}
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无跟进记录' }}
          style={{ maxHeight: 400, overflowY: 'auto' }}
        />
      </Spin>
    </Modal>
  );
};

export default FollowUpModal;
