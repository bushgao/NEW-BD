import { useState } from 'react';
import { Space, Tag, Button, Modal, Form, Input, Select, message, Popconfirm, Tooltip } from 'antd';
import { FilterOutlined, PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import type { Platform } from '@ics/shared';
import { PLATFORM_LABELS } from '../../services/influencer.service';

export interface FilterConfig {
  keyword?: string;
  platform?: Platform;
  category?: string;
  tags?: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: FilterConfig;
  createdAt: Date;
  isFavorite?: boolean;
}

interface QuickFiltersProps {
  savedFilters: SavedFilter[];
  currentFilter: FilterConfig;
  allCategories: string[];
  allTags: string[];
  onApplyFilter: (filter: FilterConfig) => void;
  onSaveFilter: (name: string, filter: FilterConfig) => void;
  onDeleteFilter: (filterId: string) => void;
  onToggleFavorite?: (filterId: string) => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  savedFilters,
  currentFilter,
  allCategories,
  allTags,
  onApplyFilter,
  onSaveFilter,
  onDeleteFilter,
  onToggleFavorite,
}) => {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleApplyFilter = (filter: FilterConfig) => {
    onApplyFilter(filter);
    message.success('筛选条件已应用');
  };

  const handleSaveCurrentFilter = () => {
    // 检查当前筛选条件是否为空
    const hasFilter = currentFilter.keyword || 
                      currentFilter.platform || 
                      currentFilter.category || 
                      (currentFilter.tags && currentFilter.tags.length > 0);
    
    if (!hasFilter) {
      message.warning('请先设置筛选条件');
      return;
    }
    
    setSaveModalVisible(true);
  };

  const handleSaveSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSaveFilter(values.name, currentFilter);
      message.success('筛选条件已保存');
      setSaveModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (filterId: string) => {
    onDeleteFilter(filterId);
    message.success('筛选条件已删除');
  };

  const handleToggleFavorite = (filterId: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(filterId);
    }
  };

  const getFilterDescription = (filter: FilterConfig): string => {
    const parts: string[] = [];
    
    if (filter.keyword) {
      parts.push(`关键词: ${filter.keyword}`);
    }
    if (filter.platform) {
      parts.push(`平台: ${PLATFORM_LABELS[filter.platform]}`);
    }
    if (filter.category) {
      parts.push(`类目: ${filter.category}`);
    }
    if (filter.tags && filter.tags.length > 0) {
      parts.push(`标签: ${filter.tags.join(', ')}`);
    }
    
    return parts.join(' | ') || '无筛选条件';
  };

  // 按收藏状态排序
  const sortedFilters = [...savedFilters].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 快速筛选标题和保存按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <FilterOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            <span style={{ fontWeight: 500, fontSize: 14 }}>快速筛选</span>
            {savedFilters.length > 0 && (
              <Tag color="blue">{savedFilters.length} 个已保存</Tag>
            )}
          </Space>
          <Button 
            type="link" 
            icon={<PlusOutlined />} 
            onClick={handleSaveCurrentFilter}
            size="small"
          >
            保存当前筛选
          </Button>
        </div>

        {/* 已保存的筛选条件 */}
        {sortedFilters.length > 0 ? (
          <Space size={[8, 8]} wrap>
            {sortedFilters.map((savedFilter) => (
              <Tag
                key={savedFilter.id}
                color="blue"
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  border: savedFilter.isFavorite ? '1px solid #1890ff' : undefined,
                }}
                onClick={() => handleApplyFilter(savedFilter.filter)}
              >
                <Tooltip title={savedFilter.isFavorite ? '取消收藏' : '收藏'}>
                  {savedFilter.isFavorite ? (
                    <StarFilled 
                      style={{ color: '#faad14', fontSize: 12 }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(savedFilter.id);
                      }}
                    />
                  ) : (
                    <StarOutlined 
                      style={{ fontSize: 12 }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(savedFilter.id);
                      }}
                    />
                  )}
                </Tooltip>
                <span>{savedFilter.name}</span>
                <Popconfirm
                  title="确定删除此筛选条件吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDelete(savedFilter.id);
                  }}
                  okText="确定"
                  cancelText="取消"
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <DeleteOutlined
                    style={{ fontSize: 12 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tag>
            ))}
          </Space>
        ) : (
          <div style={{ 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: 4,
            textAlign: 'center',
            color: '#999',
            fontSize: 13,
          }}>
            暂无保存的筛选条件，设置筛选后点击"保存当前筛选"即可快速使用
          </div>
        )}
      </Space>

      {/* 保存筛选条件弹窗 */}
      <Modal
        title="保存筛选条件"
        open={saveModalVisible}
        onOk={handleSaveSubmit}
        onCancel={() => {
          setSaveModalVisible(false);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="筛选名称"
            rules={[
              { required: true, message: '请输入筛选名称' },
              { max: 20, message: '名称不能超过20个字符' },
            ]}
          >
            <Input placeholder="例如：高粉丝抖音达人" maxLength={20} />
          </Form.Item>
          
          <Form.Item label="当前筛选条件">
            <div style={{ 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: 4,
              fontSize: 13,
            }}>
              {getFilterDescription(currentFilter)}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuickFilters;
