import { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Input,
  Space,
  Button,
  Typography,
  Spin,
  message,
  Badge,
  Segmented,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UserOutlined,
  ClockCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { PipelineStage } from '@ics/shared';
import {
  getPipelineView,
  getPipelineStats,
  updateStage,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  type PipelineView,
  type PipelineStats,
  type CollaborationCard,
} from '../../services/collaboration.service';
import { getInfluencers, type Influencer, PLATFORM_LABELS } from '../../services/influencer.service';
import { useTheme } from '../../theme/ThemeProvider';
import PipelineColumn from './PipelineColumn';
import CollaborationModal from './CollaborationModal';
import FollowUpModal from './FollowUpModal';
import DeadlineModal from './DeadlineModal';
import CreateCollaborationModal from './CreateCollaborationModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

type ViewMode = 'board' | 'table';

const PipelinePage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState<PipelineView | null>(null);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Modal states
  const [selectedCard, setSelectedCard] = useState<CollaborationCard | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [deadlineModalVisible, setDeadlineModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Influencers for creating new collaboration
  const [influencers, setInfluencers] = useState<Influencer[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [viewData, statsData] = await Promise.all([
        getPipelineView({ keyword: searchKeyword || undefined }),
        getPipelineStats(),
      ]);
      setPipelineData(viewData);
      setStats(statsData);
    } catch (error) {
      message.error('获取管道数据失败');
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  const fetchInfluencers = useCallback(async () => {
    try {
      // 获取所有达人（分页获取，每次100条）
      let allInfluencers: Influencer[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const result = await getInfluencers({ page, pageSize: 100 });
        allInfluencers = [...allInfluencers, ...result.data];
        hasMore = page < result.totalPages;
        page++;
      }
      
      setInfluencers(allInfluencers);
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);


  const handleSearch = () => {
    setSearchKeyword(keyword);
  };

  const handleDragEnd = async (
    cardId: string,
    sourceStage: PipelineStage,
    targetStage: PipelineStage
  ) => {
    if (sourceStage === targetStage) return;

    // Optimistic update
    if (pipelineData) {
      const newData = { ...pipelineData };
      const sourceStageData = newData.stages.find((s) => s.stage === sourceStage);
      const targetStageData = newData.stages.find((s) => s.stage === targetStage);

      if (sourceStageData && targetStageData) {
        const cardIndex = sourceStageData.collaborations.findIndex((c) => c.id === cardId);
        if (cardIndex !== -1) {
          const [card] = sourceStageData.collaborations.splice(cardIndex, 1);
          card.stage = targetStage;
          targetStageData.collaborations.unshift(card);
          sourceStageData.count--;
          targetStageData.count++;
          setPipelineData(newData);
        }
      }
    }

    try {
      await updateStage(cardId, targetStage);
      message.success(`已移动到「${STAGE_LABELS[targetStage]}」`);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '更新阶段失败');
      fetchData(); // Revert on error
    }
  };

  const handleCardClick = (card: CollaborationCard) => {
    setSelectedCard(card);
    setDetailModalVisible(true);
  };

  const handleFollowUpClick = (card: CollaborationCard) => {
    setSelectedCard(card);
    setFollowUpModalVisible(true);
  };

  const handleDeadlineClick = (card: CollaborationCard) => {
    setSelectedCard(card);
    setDeadlineModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setDetailModalVisible(false);
    setFollowUpModalVisible(false);
    setDeadlineModalVisible(false);
    setSelectedCard(null);
    if (refresh) {
      fetchData();
    }
  };

  const handleCreateClose = (refresh?: boolean) => {
    setCreateModalVisible(false);
    if (refresh) {
      fetchData();
    }
  };

  // 获取所有合作记录的扁平列表（用于表格视图）
  const getAllCollaborations = (): CollaborationCard[] => {
    if (!pipelineData) return [];
    return pipelineData.stages.flatMap((stage) => stage.collaborations);
  };

  // 表格列定义
  const tableColumns = [
    {
      title: '达人昵称',
      dataIndex: ['influencer', 'nickname'],
      key: 'nickname',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: CollaborationCard) => (
        <Space>
          <Text strong style={{ cursor: 'pointer' }} onClick={() => handleCardClick(record)}>
            {text}
          </Text>
          {record.isOverdue && (
            <Tag color="error" icon={<WarningOutlined />}>
              超期
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '平台',
      dataIndex: ['influencer', 'platform'],
      key: 'platform',
      width: 100,
      render: (platform: string) => (
        <Tag color={getPlatformColor(platform)}>
          {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
        </Tag>
      ),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (stage: PipelineStage) => (
        <Tag color={STAGE_COLORS[stage]}>{STAGE_LABELS[stage]}</Tag>
      ),
    },
    {
      title: '负责商务',
      dataIndex: ['businessStaff', 'name'],
      key: 'businessStaff',
      width: 100,
      render: (name: string) => (
        <Space size={4}>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 150,
      render: (deadline: string | null) => {
        if (!deadline) return <Text type="secondary">未设置</Text>;
        const deadlineInfo = formatDeadline(deadline);
        if (!deadlineInfo) return <Text type="secondary">未设置</Text>;
        return (
          <Tooltip title={dayjs(deadline).format('YYYY-MM-DD HH:mm')}>
            <Text style={{ color: deadlineInfo.color }}>
              <ClockCircleOutlined /> {deadlineInfo.text}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: '跟进',
      dataIndex: 'followUpCount',
      key: 'followUpCount',
      width: 80,
      align: 'center' as const,
      render: (count: number, record: CollaborationCard) => (
        <Button
          type="link"
          size="small"
          icon={<MessageOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleFollowUpClick(record);
          }}
        >
          {count > 0 ? count : ''}
        </Button>
      ),
    },
    {
      title: '寄样次数',
      dataIndex: 'dispatchCount',
      key: 'dispatchCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => (count > 0 ? `📦 ${count}` : '-'),
    },
    {
      title: '最近跟进',
      dataIndex: 'lastFollowUp',
      key: 'lastFollowUp',
      width: 120,
      render: (lastFollowUp: string | null) =>
        lastFollowUp ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(lastFollowUp).fromNow()}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      DOUYIN: 'magenta',
      KUAISHOU: 'orange',
      XIAOHONGSHU: 'red',
      WEIBO: 'gold',
      OTHER: 'default',
    };
    return colors[platform] || 'default';
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = dayjs(deadline);
    const now = dayjs();
    const diff = date.diff(now, 'day');

    if (diff < 0) {
      return { text: `超期 ${Math.abs(diff)} 天`, color: '#ff4d4f' };
    } else if (diff === 0) {
      return { text: '今天截止', color: '#fa8c16' };
    } else if (diff <= 3) {
      return { text: `${diff} 天后截止`, color: '#fa8c16' };
    } else {
      return { text: date.format('MM-DD'), color: '#8c8c8c' };
    }
  };

  return (
    <div 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
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
      
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>
              合作管道
            </Title>
            {stats && (
              <Space size="large" style={{ marginLeft: 24 }}>
                <Text type="secondary">
                  总计: <Text strong>{stats.total}</Text>
                </Text>
                {stats.overdueCount > 0 && (
                  <Badge count={stats.overdueCount} offset={[10, 0]}>
                    <Text type="danger">
                      <WarningOutlined /> 超期
                    </Text>
                  </Badge>
                )}
              </Space>
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              options={[
                {
                  label: '看板',
                  value: 'board',
                  icon: <AppstoreOutlined />,
                },
                {
                  label: '表格',
                  value: 'table',
                  icon: <UnorderedListOutlined />,
                },
              ]}
            />
            <Input
              placeholder="搜索达人昵称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              新建合作
            </Button>
          </Space>
        </Col>
      </Row>


      {/* Pipeline Board or Table */}
      <Spin spinning={loading}>
        {viewMode === 'board' ? (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flex: 1,
              paddingBottom: 16,
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {STAGE_ORDER.map((stage) => {
              const stageData = pipelineData?.stages.find((s) => s.stage === stage);
              return (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  stageName={STAGE_LABELS[stage]}
                  cards={stageData?.collaborations || []}
                  count={stageData?.count || 0}
                  onDragEnd={handleDragEnd}
                  onCardClick={handleCardClick}
                  onFollowUpClick={handleFollowUpClick}
                  onDeadlineClick={handleDeadlineClick}
                />
              );
            })}
          </div>
        ) : (
          <Table
            dataSource={getAllCollaborations()}
            columns={tableColumns}
            rowKey="id"
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
            onRow={(record) => ({
              onClick: () => handleCardClick(record),
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </Spin>

      {/* Modals */}
      <CollaborationModal
        visible={detailModalVisible}
        collaborationId={selectedCard?.id || null}
        onClose={handleModalClose}
      />

      <FollowUpModal
        visible={followUpModalVisible}
        collaboration={selectedCard}
        onClose={handleModalClose}
      />

      <DeadlineModal
        visible={deadlineModalVisible}
        collaboration={selectedCard}
        onClose={handleModalClose}
      />

      <CreateCollaborationModal
        visible={createModalVisible}
        influencers={influencers}
        onClose={handleCreateClose}
      />
      </div>
    </div>
  );
};

export default PipelinePage;
