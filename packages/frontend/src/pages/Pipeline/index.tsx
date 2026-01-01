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
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { PipelineStage } from '@ics/shared';
import {
  getPipelineView,
  getPipelineStats,
  updateStage,
  STAGE_ORDER,
  STAGE_LABELS,
  type PipelineView,
  type PipelineStats,
  type CollaborationCard,
} from '../../services/collaboration.service';
import { getInfluencers, type Influencer } from '../../services/influencer.service';
import PipelineColumn from './PipelineColumn';
import CollaborationModal from './CollaborationModal';
import FollowUpModal from './FollowUpModal';
import DeadlineModal from './DeadlineModal';
import CreateCollaborationModal from './CreateCollaborationModal';

const { Title, Text } = Typography;

const PipelinePage = () => {
  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState<PipelineView | null>(null);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

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
      const result = await getInfluencers({ pageSize: 1000 });
      setInfluencers(result.data);
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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


      {/* Pipeline Board */}
      <Spin spinning={loading}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            flex: 1,
            paddingBottom: 16,
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
  );
};

export default PipelinePage;
