import React, { useState, useEffect } from 'react';
import { message, Modal, Input, ColorPicker, Spin, Empty, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import * as groupService from '../../services/influencer-group.service';
import type { InfluencerGroup } from '../../services/influencer-group.service';

const { TextArea } = Input;

interface InfluencerGroupsProps {
  onGroupSelect: (groupId: string | null) => void;
  selectedGroupId: string | null;
  onRefresh?: () => void;
}

const InfluencerGroups: React.FC<InfluencerGroupsProps> = ({
  onGroupSelect,
  selectedGroupId,
  onRefresh,
}) => {
  const [groups, setGroups] = useState<InfluencerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<InfluencerGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#1890ff',
    description: '',
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.listGroups();
      setGroups(data);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '加载分组失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      color: '#1890ff',
      description: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (group: InfluencerGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    setFormData({
      name: group.name,
      color: group.color,
      description: group.description || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (group: InfluencerGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分组"${group.name}"吗？分组中的达人不会被删除。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await groupService.deleteGroup(group.id);
          message.success('分组已删除');
          loadGroups();
          if (selectedGroupId === group.id) {
            onGroupSelect(null);
          }
          onRefresh?.();
        } catch (error: any) {
          message.error(error.response?.data?.error?.message || '删除分组失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      message.error('请输入分组名称');
      return;
    }

    try {
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.id, formData);
        message.success('分组已更新');
      } else {
        await groupService.createGroup(formData);
        message.success('分组已创建');
      }
      setModalVisible(false);
      loadGroups();
      onRefresh?.();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '操作失败');
    }
  };

  const handleViewStats = async (group: InfluencerGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const stats = await groupService.getGroupStats(group.id);
      
      Modal.info({
        title: `${group.name} - 统计数据`,
        width: 500,
        content: (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>达人数量：</strong>{stats.totalInfluencers}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>合作次数：</strong>{stats.totalCollaborations}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>平均ROI：</strong>{stats.avgROI.toFixed(2)}%
            </div>
            <div>
              <strong>总GMV：</strong>¥{(stats.totalGMV / 100).toFixed(2)}
            </div>
          </div>
        ),
      });
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '加载统计数据失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>达人分组</h3>
        <button
          onClick={handleCreate}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#1890ff',
            fontSize: 16,
          }}
        >
          <PlusOutlined />
        </button>
      </div>

      {/* All Influencers */}
      <div
        onClick={() => onGroupSelect(null)}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: selectedGroupId === null ? '#e6f7ff' : 'transparent',
          borderLeft: selectedGroupId === null ? '3px solid #1890ff' : '3px solid transparent',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (selectedGroupId !== null) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedGroupId !== null) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
          <span style={{ fontWeight: selectedGroupId === null ? 600 : 400 }}>
            全部达人
          </span>
        </div>
      </div>

      {/* Groups List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groups.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无分组"
            style={{ marginTop: 40 }}
          />
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => onGroupSelect(group.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: selectedGroupId === group.id ? '#e6f7ff' : 'transparent',
                borderLeft:
                  selectedGroupId === group.id ? '3px solid #1890ff' : '3px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedGroupId !== group.id) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
                const actions = e.currentTarget.querySelector('.group-actions') as HTMLElement;
                if (actions) actions.style.display = 'flex';
              }}
              onMouseLeave={(e) => {
                if (selectedGroupId !== group.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
                const actions = e.currentTarget.querySelector('.group-actions') as HTMLElement;
                if (actions) actions.style.display = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: group.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: selectedGroupId === group.id ? 600 : 400,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {group.name}
                </span>
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {group.influencerCount || 0}
                </span>
              </div>

              {/* Actions */}
              <div
                className="group-actions"
                style={{
                  display: 'none',
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  gap: 4,
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <Tooltip title="查看统计">
                  <button
                    onClick={(e) => handleViewStats(group, e)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#1890ff',
                      padding: '4px 8px',
                      fontSize: 14,
                    }}
                  >
                    <BarChartOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="编辑">
                  <button
                    onClick={(e) => handleEdit(group, e)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#1890ff',
                      padding: '4px 8px',
                      fontSize: 14,
                    }}
                  >
                    <EditOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="删除">
                  <button
                    onClick={(e) => handleDelete(group, e)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#ff4d4f',
                      padding: '4px 8px',
                      fontSize: 14,
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingGroup ? '编辑分组' : '创建分组'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            分组名称 <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入分组名称"
            maxLength={50}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>分组颜色</label>
          <ColorPicker
            value={formData.color}
            onChange={(_, hex) => setFormData({ ...formData, color: hex })}
            showText
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>描述</label>
          <TextArea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入分组描述（可选）"
            rows={3}
            maxLength={200}
          />
        </div>
      </Modal>
    </div>
  );
};

export default InfluencerGroups;
