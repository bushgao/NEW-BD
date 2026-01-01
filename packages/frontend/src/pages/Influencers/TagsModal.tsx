import { useState, useEffect } from 'react';
import { Modal, Tag, Input, Space, message, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { addTags, removeTags, type Influencer } from '../../services/influencer.service';

const { Text } = Typography;

interface TagsModalProps {
  visible: boolean;
  influencer: Influencer | null;
  onClose: (refresh?: boolean) => void;
  allTags: string[];
}

const TagsModal = ({ visible, influencer, onClose, allTags }: TagsModalProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [_loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (visible && influencer) {
      setTags([...influencer.tags]);
      setHasChanges(false);
    }
  }, [visible, influencer]);

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!influencer) return;

    setLoading(true);
    try {
      await removeTags(influencer.id, [tagToRemove]);
      setTags(tags.filter((tag) => tag !== tagToRemove));
      setHasChanges(true);
      message.success('标签已移除');
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '移除标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!influencer || !inputValue.trim()) return;

    const newTag = inputValue.trim();
    if (tags.includes(newTag)) {
      message.warning('标签已存在');
      setInputValue('');
      setInputVisible(false);
      return;
    }

    setLoading(true);
    try {
      await addTags(influencer.id, [newTag]);
      setTags([...tags, newTag]);
      setHasChanges(true);
      setInputValue('');
      setInputVisible(false);
      message.success('标签已添加');
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '添加标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (tag: string) => {
    if (!influencer || tags.includes(tag)) return;

    setLoading(true);
    try {
      await addTags(influencer.id, [tag]);
      setTags([...tags, tag]);
      setHasChanges(true);
      message.success('标签已添加');
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '添加标签失败');
    } finally {
      setLoading(false);
    }
  };

  const suggestedTags = allTags.filter((tag) => !tags.includes(tag));

  return (
    <Modal
      title={`管理标签 - ${influencer?.nickname || ''}`}
      open={visible}
      onCancel={() => onClose(hasChanges)}
      footer={null}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>当前标签:</Text>
        <div style={{ marginTop: 8 }}>
          <Space size={[0, 8]} wrap>
            {tags.map((tag) => (
              <Tag
                key={tag}
                color="blue"
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveTag(tag);
                }}
              >
                {tag}
              </Tag>
            ))}
            {inputVisible ? (
              <Input
                type="text"
                size="small"
                style={{ width: 100 }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleAddTag}
                onPressEnter={handleAddTag}
                autoFocus
              />
            ) : (
              <Tag
                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                onClick={() => setInputVisible(true)}
              >
                <PlusOutlined /> 新标签
              </Tag>
            )}
          </Space>
        </div>
      </div>

      {suggestedTags.length > 0 && (
        <div>
          <Text strong>可选标签:</Text>
          <div style={{ marginTop: 8 }}>
            <Space size={[0, 8]} wrap>
              {suggestedTags.map((tag) => (
                <Tag
                  key={tag}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSuggestionClick(tag)}
                >
                  <PlusOutlined /> {tag}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TagsModal;
