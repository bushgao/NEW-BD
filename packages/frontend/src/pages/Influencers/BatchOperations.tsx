import { useState } from 'react';
import { Button, Dropdown, Modal, Form, Select, Input, message, Space } from 'antd';
import { 
  DownOutlined, 
  TagsOutlined, 
  DownloadOutlined, 
  FolderOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface BatchOperationsProps {
  selectedCount: number;
  selectedIds: string[];
  allTags: string[];
  allGroups?: string[];
  onBatchTag: (tags: string[]) => Promise<void>;
  onBatchExport: () => Promise<void>;
  onBatchMoveToGroup?: (groupId: string) => Promise<void>;
  onClearSelection: () => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  selectedCount,
  selectedIds,
  allTags,
  allGroups = [],
  onBatchTag,
  onBatchExport,
  onBatchMoveToGroup,
  onClearSelection,
}) => {
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleBatchTag = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onBatchTag(values.tags);
      message.success(`已为 ${selectedCount} 个达人添加标签`);
      setTagModalVisible(false);
      form.resetFields();
      onClearSelection();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.response?.data?.error?.message || '批量打标签失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExport = async () => {
    try {
      setLoading(true);
      await onBatchExport();
      message.success(`已导出 ${selectedCount} 个达人`);
      onClearSelection();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '批量导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchMoveToGroup = async () => {
    if (!onBatchMoveToGroup) return;
    
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onBatchMoveToGroup(values.groupId);
      message.success(`已将 ${selectedCount} 个达人移动到分组`);
      setGroupModalVisible(false);
      form.resetFields();
      onClearSelection();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      message.error(error.response?.data?.error?.message || '批量移动失败');
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'tag',
      label: '批量打标签',
      icon: <TagsOutlined />,
      onClick: () => setTagModalVisible(true),
    },
    {
      key: 'export',
      label: '批量导出',
      icon: <DownloadOutlined />,
      onClick: handleBatchExport,
    },
  ];

  // Add group operation if available
  if (onBatchMoveToGroup && allGroups.length > 0) {
    menuItems.push({
      key: 'group',
      label: '移动到分组',
      icon: <FolderOutlined />,
      onClick: () => setGroupModalVisible(true),
    });
  }

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Space>
        <span style={{ color: '#1890ff', fontWeight: 500 }}>
          已选择 {selectedCount} 个达人
        </span>
        <Dropdown menu={{ items: menuItems }} placement="bottomLeft">
          <Button type="primary">
            批量操作 <DownOutlined />
          </Button>
        </Dropdown>
        <Button onClick={onClearSelection}>取消选择</Button>
      </Space>

      {/* Batch Tag Modal */}
      <Modal
        title="批量打标签"
        open={tagModalVisible}
        onOk={handleBatchTag}
        onCancel={() => {
          setTagModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tags"
            label={`为选中的 ${selectedCount} 个达人添加标签`}
            rules={[{ required: true, message: '请选择至少一个标签' }]}
          >
            <Select
              mode="tags"
              placeholder="选择或输入新标签"
              style={{ width: '100%' }}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Move to Group Modal */}
      {onBatchMoveToGroup && (
        <Modal
          title="移动到分组"
          open={groupModalVisible}
          onOk={handleBatchMoveToGroup}
          onCancel={() => {
            setGroupModalVisible(false);
            form.resetFields();
          }}
          confirmLoading={loading}
          okText="确定"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="groupId"
              label={`将选中的 ${selectedCount} 个达人移动到`}
              rules={[{ required: true, message: '请选择分组' }]}
            >
              <Select
                placeholder="选择分组"
                style={{ width: '100%' }}
                options={allGroups.map((group: any) => ({
                  value: group.id,
                  label: group.name,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default BatchOperations;
