import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Row,
  Col,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Platform } from '@ics/shared';
import {
  getInfluencers,
  deleteInfluencer,
  getAllTags,
  getAllCategories,
  getSmartRecommendations,
  batchAddTags,
  exportInfluencers,
  PLATFORM_LABELS,
  type Influencer,
  type InfluencerFilter,
} from '../../services/influencer.service';
import {
  getSavedFilters,
  saveFilter,
  deleteFilter,
  toggleFilterFavorite,
} from '../../services/user-preferences.service';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import InfluencerModal from './InfluencerModal';
import ImportModal from './ImportModal';
import TagsModal from './TagsModal';
import QuickFilters, { type SavedFilter, type FilterConfig } from './QuickFilters';
import SmartRecommendations, { type RecommendedInfluencer } from './SmartRecommendations';
import BatchOperations from './BatchOperations';
import InfluencerDetailPanel from './InfluencerDetailPanel';
import InfluencerGroups from './InfluencerGroups';
// QuickAddModal 已废弃,改用 Chrome 浏览器插件实现达人采集
// import QuickAddModal, { type QuickAddData } from './QuickAddModal';
import { ExportButton } from '../Import';

const { Title, Text: AntText } = Typography;

const InfluencersPage = () => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { hasPermission, canViewOthersData } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Influencer[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filter, setFilter] = useState<InfluencerFilter>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedInfluencer[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [tagsInfluencer, setTagsInfluencer] = useState<Influencer | null>(null);
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [detailInfluencer, setDetailInfluencer] = useState<Influencer | null>(null);
  // const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);

  // 配额检查
  const influencerCount = user?.factory?._count?.influencers || 0;
  const influencerLimit = user?.factory?.influencerLimit || 0;
  const isQuotaReached = influencerCount >= influencerLimit;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInfluencers({
        ...filter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取达人列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [tags, categories, filters] = await Promise.all([
        getAllTags(), 
        getAllCategories(),
        getSavedFilters(),
      ]);
      setAllTags(tags);
      setAllCategories(categories);
      setSavedFilters(filters);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const recs = await getSmartRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMetadata();
    fetchRecommendations();
  }, [fetchMetadata, fetchRecommendations]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });
  };

  const handleSearch = (keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePlatformFilter = (platform: Platform | undefined) => {
    setFilter((prev) => ({ ...prev, platform }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (category: string | undefined) => {
    setFilter((prev) => ({ ...prev, category }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTagsFilter = (tags: string[] | undefined) => {
    setFilter((prev) => ({ ...prev, tags }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    setFilter((prev) => ({ ...prev, groupId }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInfluencer(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '删除失败');
    }
  };

  const handleEdit = (record: Influencer) => {
    setEditingInfluencer(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    if (isQuotaReached) {
      message.warning('已达到达人数量上限，请升级套餐');
      return;
    }
    setEditingInfluencer(null);
    setModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setEditingInfluencer(null);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  const handleImportClose = (refresh?: boolean) => {
    setImportModalVisible(false);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  const handleTagsClick = (record: Influencer) => {
    setTagsInfluencer(record);
    setTagsModalVisible(true);
  };

  const handleTagsClose = (refresh?: boolean) => {
    setTagsModalVisible(false);
    setTagsInfluencer(null);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  // Quick filter handlers
  const handleApplyQuickFilter = (filterConfig: FilterConfig) => {
    setFilter(filterConfig);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSaveQuickFilter = async (name: string, filterConfig: FilterConfig) => {
    try {
      const newFilter = await saveFilter(name, filterConfig);
      setSavedFilters((prev) => [...prev, newFilter]);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '保存筛选条件失败');
      throw error;
    }
  };

  const handleDeleteQuickFilter = async (filterId: string) => {
    try {
      await deleteFilter(filterId);
      setSavedFilters((prev) => prev.filter((f) => f.id !== filterId));
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '删除筛选条件失败');
      throw error;
    }
  };

  const handleToggleFilterFavorite = async (filterId: string) => {
    try {
      await toggleFilterFavorite(filterId);
      setSavedFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, isFavorite: !f.isFavorite } : f))
      );
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '更新收藏状态失败');
      throw error;
    }
  };

  const handleViewInfluencer = (influencer: Influencer) => {
    setDetailInfluencer(influencer);
    setDetailPanelVisible(true);
  };

  const handleDetailPanelClose = () => {
    setDetailPanelVisible(false);
    setDetailInfluencer(null);
  };

  // Batch operations handlers
  const handleBatchTag = async (tags: string[]) => {
    const ids = selectedRowKeys as string[];
    await batchAddTags(ids, tags);
    fetchData();
    fetchMetadata();
  };

  const handleBatchExport = async () => {
    const ids = selectedRowKeys as string[];
    const blob = await exportInfluencers(ids);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `influencers_${new Date().getTime()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  // 快速添加功能已废弃，改用 Chrome 浏览器插件
  // const handleQuickAdd = () => {
  //   if (isQuotaReached) {
  //     message.warning('已达到达人数量上限，请升级套餐');
  //     return;
  //   }
  //   setQuickAddModalVisible(true);
  // };

  // const handleQuickAddSuccess = async (data: QuickAddData) => {
  //   try {
  //     const { createInfluencer } = await import('../../services/influencer.service');
  //     await createInfluencer(data);
  //     message.success('达人添加成功');
  //     setQuickAddModalVisible(false);
  //     fetchData();
  //     fetchMetadata();
  //   } catch (error: any) {
  //     message.error(error.response?.data?.error?.message || '添加失败');
  //   }
  // };

  const columns: ColumnsType<Influencer> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
      ellipsis: true,
      render: (nickname: string, record: Influencer) => (
        <Button
          type="link"
          onClick={() => handleViewInfluencer(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {nickname}
        </Button>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => (
        <Tag color={getPlatformColor(platform)}>{PLATFORM_LABELS[platform]}</Tag>
      ),
    },
    {
      title: '平台账号ID',
      dataIndex: 'platformId',
      key: 'platformId',
      width: 150,
      ellipsis: true,
    },
    {
      title: '粉丝数',
      dataIndex: 'followers',
      key: 'followers',
      width: 120,
      render: (followers: string | null) => {
        if (!followers) return '-';
        // 格式化显示粉丝数
        const num = parseInt(followers);
        if (isNaN(num)) return followers;
        if (num >= 10000) {
          return (num / 10000).toFixed(1) + '万';
        }
        return num.toLocaleString();
      },
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      width: 130,
      render: (wechat: string | null) => wechat || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '类目',
      dataIndex: 'categories',
      key: 'categories',
      width: 150,
      render: (categories: string[]) =>
        categories.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {categories.slice(0, 2).map((cat) => (
              <Tag key={cat}>{cat}</Tag>
            ))}
            {categories.length > 2 && <Tag>+{categories.length - 2}</Tag>}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[], record: Influencer) => (
        <Space size={[0, 4]} wrap>
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && <Tag color="blue">+{tags.length - 2}</Tag>}
          <Tooltip title="管理标签">
            <TagsOutlined
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => handleTagsClick(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (notes: string | null) => notes || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            onClick={() => handleViewInfluencer(record)}
          >
            查看
          </Button>
          {hasPermission('operations.manageInfluencers') ? (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除该达人吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Tooltip title="您没有权限管理达人">
              <AntText type="secondary">-</AntText>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
      }}
    >
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 16 }}>
        {/* Left Sidebar - Groups */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <Card variant="elevated" style={{ height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
            <InfluencerGroups
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupSelect}
              onRefresh={fetchData}
            />
          </Card>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
      {/* 配额警告 */}
      {isQuotaReached && (
        <Alert
          message="达人数量已达上限"
          description={`当前已添加 ${influencerCount}/${influencerLimit} 个达人，请升级套餐以添加更多达人。`}
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 权限提示 */}
      {!canViewOthersData && (
        <Alert
          message="数据权限提示"
          description="您当前只能查看自己创建的达人信息。如需查看其他商务的达人，请联系管理员调整权限。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          {selectedRowKeys.length > 0 ? (
            <BatchOperations
              selectedCount={selectedRowKeys.length}
              selectedIds={selectedRowKeys as string[]}
              allTags={allTags}
              onBatchTag={handleBatchTag}
              onBatchExport={handleBatchExport}
              onClearSelection={handleClearSelection}
            />
          ) : (
            <>
              <Title level={4} style={{ margin: 0 }}>
                达人管理
              </Title>
              <AntText type="secondary" style={{ fontSize: 12 }}>
                已添加 {influencerCount}/{influencerLimit} 个达人
              </AntText>
            </>
          )}
        </Col>
        <Col>
          <Space>
            {hasPermission('operations.exportData') ? (
              <ExportButton types={['influencers']} buttonText="导出" showDateRange={false} />
            ) : (
              <Tooltip title="您没有权限导出数据">
                <Button icon={<DownloadOutlined />} disabled>
                  导出
                </Button>
              </Tooltip>
            )}
            {hasPermission('operations.batchOperations') ? (
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)} disabled={isQuotaReached}>
                批量导入
              </Button>
            ) : (
              <Tooltip title="您没有权限执行批量操作">
                <Button icon={<UploadOutlined />} disabled>
                  批量导入
                </Button>
              </Tooltip>
            )}
            {hasPermission('operations.manageInfluencers') ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={isQuotaReached}>
                添加达人
              </Button>
            ) : (
              <Tooltip title="您没有权限管理达人">
                <Button type="primary" icon={<PlusOutlined />} disabled>
                  添加达人
                </Button>
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>

      {/* Quick Filters */}
      <QuickFilters
        savedFilters={savedFilters}
        currentFilter={filter}
        allCategories={allCategories}
        allTags={allTags}
        onApplyFilter={handleApplyQuickFilter}
        onSaveFilter={handleSaveQuickFilter}
        onDeleteFilter={handleDeleteQuickFilter}
        onToggleFavorite={handleToggleFilterFavorite}
      />

      {/* Smart Recommendations */}
      <SmartRecommendations
        recommendations={recommendations}
        loading={recommendationsLoading}
        onRefresh={fetchRecommendations}
        onViewInfluencer={handleViewInfluencer}
      />

      <Card variant="elevated" style={{ marginBottom: 16 }}>
        <CardContent>
          <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="搜索达人昵称"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择平台"
              allowClear
              style={{ width: '100%' }}
              onChange={handlePlatformFilter}
              options={Object.entries(PLATFORM_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择类目"
              allowClear
              style={{ width: '100%' }}
              onChange={handleCategoryFilter}
              options={allCategories.map((cat) => ({ value: cat, label: cat }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTagsFilter}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              maxTagCount={2}
            />
          </Col>
        </Row>
        </CardContent>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowSelection={
          hasPermission('operations.batchOperations')
            ? {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                selections: [
                  Table.SELECTION_ALL,
                  Table.SELECTION_INVERT,
                  Table.SELECTION_NONE,
                ],
              }
            : undefined
        }
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <InfluencerModal
        visible={modalVisible}
        influencer={editingInfluencer}
        onClose={handleModalClose}
        allCategories={allCategories}
        allTags={allTags}
      />

      <ImportModal visible={importModalVisible} onClose={handleImportClose} />

      <TagsModal
        visible={tagsModalVisible}
        influencer={tagsInfluencer}
        onClose={handleTagsClose}
        allTags={allTags}
      />

      <InfluencerDetailPanel
        visible={detailPanelVisible}
        influencer={detailInfluencer}
        onClose={handleDetailPanelClose}
      />

      {/* QuickAddModal 已废弃，改用 Chrome 浏览器插件实现达人采集 */}
      {/* <QuickAddModal
        visible={quickAddModalVisible}
        onCancel={() => setQuickAddModalVisible(false)}
        onSuccess={handleQuickAddSuccess}
      /> */}
        </div>
      </div>
    </div>
  );
};

// Helper function for platform colors
function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    DOUYIN: 'magenta',
    KUAISHOU: 'orange',
    XIAOHONGSHU: 'red',
    WEIBO: 'gold',
    OTHER: 'default',
  };
  return colors[platform];
}

export default InfluencersPage;
