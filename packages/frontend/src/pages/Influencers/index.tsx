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
  Avatar,
  Collapse,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
  BulbOutlined,
  WechatOutlined,
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
import AddWeChatModal from './AddWeChatModal';
// QuickAddModal 已废弃,改用 Chrome 浏览器插件实现达人采集
// import QuickAddModal, { type QuickAddData } from './QuickAddModal';
import { ExportButton } from '../Import';

const { Title, Text: AntText } = Typography;

// Premium Soft Colors for Avatars
const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; border: string }> = {
  DOUYIN: { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },     // Pink (Soft)
  KUAISHOU: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },   // Orange (Soft)
  XIAOHONGSHU: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }, // Red (Soft)
  WEIBO: { bg: '#fefce8', text: '#a16207', border: '#fef08a' },      // Yellow (Soft)
  OTHER: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },      // Slate (Soft)
};

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
  const [addWeChatModalVisible, setAddWeChatModalVisible] = useState(false);
  const [addWeChatTarget, setAddWeChatTarget] = useState<Influencer | null>(null);
  // const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);

  // 配额检查
  const influencerCount = user?.brand?._count?.influencers || 0;
  const influencerLimit = user?.brand?.influencerLimit || 0;
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

  // WeChat modal handlers
  const handleAddWeChat = (influencer: Influencer) => {
    setAddWeChatTarget(influencer);
    setAddWeChatModalVisible(true);
  };

  const handleAddWeChatClose = (refresh?: boolean) => {
    setAddWeChatModalVisible(false);
    setAddWeChatTarget(null);
    if (refresh) {
      fetchData();
    }
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

  // Helper functions for column rendering
  const formatFollowers = (followers: string | null) => {
    if (!followers) return '-';
    const num = parseInt(followers);
    if (isNaN(num)) return followers;
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toLocaleString();
  };

  const columns: ColumnsType<Influencer> = [
    {
      title: '达人信息',
      key: 'influencer',
      width: 220,
      fixed: 'left',
      render: (_, record: Influencer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            shape="square"
            size={42}
            className="flex-shrink-0"
            style={{
              backgroundColor: PLATFORM_COLORS[record.platform].bg, // Use soft background
              color: PLATFORM_COLORS[record.platform].text, // Use darker text
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
              borderRadius: '10px', // Squircle
              border: `1px solid ${PLATFORM_COLORS[record.platform].border}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            {record.nickname.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Button
              type="link"
              onClick={() => handleViewInfluencer(record)}
              style={{
                padding: 0,
                height: 'auto',
                fontSize: '15px',
                fontWeight: 700,
                color: '#1e293b',
                display: 'block',
                marginBottom: '2px'
              }}
              className="hover:text-brand-600 transition-colors"
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.nickname}
              </div>
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag
                color={getPlatformColor(record.platform)}
                style={{
                  margin: 0,
                  fontSize: '10px',
                  padding: '0 6px',
                  borderRadius: '4px',
                  border: 'none',
                  fontWeight: 600,
                  lineHeight: '18px',
                  height: '18px'
                }}
              >
                {PLATFORM_LABELS[record.platform]}
              </Tag>
              <AntText
                type="secondary"
                style={{
                  fontSize: '11px',
                  display: 'block',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                ID: {record.platformId}
              </AntText>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '基础数据',
      key: 'data',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            {formatFollowers(record.followers)}
          </div>
          <AntText type="secondary" style={{ fontSize: '12px' }}>粉丝数</AntText>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 160,
      render: (_, record) => (
        <div style={{ fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', minWidth: '28px' }}>手机</span>
            <AntText style={{ fontWeight: 500, color: record.phone ? '#334155' : '#94a3b8' }}>
              {record.phone || '-'}
            </AntText>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', minWidth: '28px' }}>微信</span>
            <AntText style={{ fontWeight: 500, color: record.wechat ? '#334155' : '#94a3b8' }}>
              {record.wechat || '-'}
            </AntText>
          </div>
        </div>
      ),
    },
    {
      title: '分类 & 标签',
      key: 'classification',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {record.categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {record.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: '11px',
                    color: '#6366f1',
                    background: 'rgba(99, 102, 241, 0.08)',
                    padding: '1px 8px',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
            {record.tags.slice(0, 2).map((tag) => (
              <Tag
                key={tag}
                style={{
                  margin: 0,
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '1px 8px'
                }}
              >
                {tag}
              </Tag>
            ))}
            {record.tags.length > 2 && <AntText type="secondary" style={{ fontSize: '11px' }}>+{record.tags.length - 2}</AntText>}
            <TagsOutlined
              style={{ cursor: 'pointer', color: '#6366f1', fontSize: '14px', marginLeft: '6px' }}
              onClick={() => handleTagsClick(record)}
            />
          </div>
        </div>
      ),
    },
    {
      title: '备注信息',
      dataIndex: 'notes',
      key: 'notes',
      width: 180,
      ellipsis: true,
      render: (notes: string | null) => (
        <AntText type="secondary" style={{ fontSize: '13px' }}>
          {notes || '-'}
        </AntText>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              className="rounded-lg"
              icon={<SearchOutlined style={{ color: '#6366f1' }} />}
              onClick={() => handleViewInfluencer(record)}
            />
          </Tooltip>
          <Tooltip title="添加微信">
            <Button
              type="text"
              size="small"
              className="rounded-lg"
              icon={<WechatOutlined style={{ color: '#07C160' }} />}
              onClick={() => handleAddWeChat(record)}
            />
          </Tooltip>
          {hasPermission('operations.manageInfluencers') ? (
            <>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  className="rounded-lg"
                  icon={<EditOutlined style={{ color: '#64748b' }} />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="确定删除该达人吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    className="rounded-lg"
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            <AntText type="secondary" style={{ fontSize: '12px' }}>-</AntText>
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
        margin: '-24px',
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

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20 }}>
        {/* Left Sidebar - Groups - Updated styling */}
        <div style={{
          width: 200,
          flexShrink: 0,
          position: 'sticky',
          top: 80,
          alignSelf: 'flex-start',
          height: 'calc(100vh - 100px)' // Adjusted height to account for top offset
        }}>
          <Card
            variant="elevated"
            style={{
              height: '100%',
              overflow: 'hidden',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            <InfluencerGroups
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupSelect}
              onRefresh={fetchData}
            />
          </Card>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top Glassmorphism Header */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '6px',
            padding: '20px 24px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                达人库
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <AntText type="secondary" style={{ fontSize: '13px' }}>
                  库容使用: {influencerCount} / {influencerLimit}
                </AntText>
                <div style={{
                  width: '60px',
                  height: '4px',
                  background: '#f1f5f9',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, (influencerCount / influencerLimit) * 100)}%`,
                    height: '100%',
                    background: isQuotaReached ? '#ef4444' : '#6366f1'
                  }} />
                </div>
              </div>
            </div>

            <Space size="middle">
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
                <Space size="small">
                  {hasPermission('operations.exportData') && (
                    <ExportButton types={['influencers']} buttonText="导出数据" showDateRange={false} />
                  )}
                  {hasPermission('operations.batchOperations') && (
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => setImportModalVisible(true)}
                      disabled={isQuotaReached}
                      className="rounded-xl border-neutral-200"
                    >
                      批量导入
                    </Button>
                  )}
                  {hasPermission('operations.manageInfluencers') && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      disabled={isQuotaReached}
                      className="rounded-xl shadow-indigo"
                      style={{ height: '40px', fontWeight: 600 }}
                    >
                      添加达人
                    </Button>
                  )}
                </Space>
              )}
            </Space>
          </div>

          {/* Quota/Permission Alerts - More compact */}
          <div style={{ marginBottom: 16 }}>
            {isQuotaReached && (
              <Alert
                message="库容已满：请升级套餐以继续添加达人"
                type="warning"
                showIcon
                closable
                style={{ borderRadius: '12px' }}
              />
            )}
            {!canViewOthersData && (
              <Alert
                message="隐私模式：您目前只能查看自己建档的达人"
                type="info"
                showIcon
                closable
                style={{ borderRadius: '12px', marginTop: 8 }}
              />
            )}
          </div>

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
          {/* Smart Recommendations - Collapsible */}
          <Collapse
            ghost
            expandIconPosition="end"
            style={{ marginBottom: 16 }}
            items={[{
              key: 'recommendations',
              label: (
                <Space size="small">
                  <BulbOutlined style={{ color: '#6366f1', fontSize: '16px' }} />
                  <AntText strong style={{ fontSize: '14px' }}>智能推荐与分析</AntText>
                  <Badge count="New" style={{ backgroundColor: '#6366f1', fontSize: '10px' }} />
                </Space>
              ),
              children: (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.03)',
                  borderRadius: '16px',
                  padding: '4px',
                  border: '1px solid rgba(99, 102, 241, 0.1)'
                }}>
                  <SmartRecommendations
                    recommendations={recommendations}
                    loading={recommendationsLoading}
                    onRefresh={fetchRecommendations}
                    onViewInfluencer={handleViewInfluencer}
                  />
                </div>
              )
            }]}
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

          {addWeChatTarget && (
            <AddWeChatModal
              visible={addWeChatModalVisible}
              influencerId={addWeChatTarget.id}
              wechatId={addWeChatTarget.wechat || ''}
              nickname={addWeChatTarget.nickname}
              platform={addWeChatTarget.platform}
              onClose={() => handleAddWeChatClose()}
              onSuccess={() => handleAddWeChatClose(true)}
            />
          )}

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
