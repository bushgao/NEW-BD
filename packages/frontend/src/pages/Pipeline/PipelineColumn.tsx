import { useRef } from 'react';
import { Badge, Typography } from 'antd';
import type { PipelineStage } from '@ics/shared';
import { STAGE_COLORS, type CollaborationCard } from '../../services/collaboration.service';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import CollaborationCardComponent from './CollaborationCard';

const { Text } = Typography;

interface PipelineColumnProps {
  stage: PipelineStage;
  stageName: string;
  cards: CollaborationCard[];
  count: number;
  onDragEnd: (cardId: string, sourceStage: PipelineStage, targetStage: PipelineStage) => void;
  onCardClick: (card: CollaborationCard) => void;
  onFollowUpClick: (card: CollaborationCard) => void;
  onDeadlineClick: (card: CollaborationCard) => void;
  onQuickFollowUpClick: (card: CollaborationCard) => void;
}

const PipelineColumn = ({
  stage,
  stageName,
  cards,
  count,
  onDragEnd,
  onCardClick,
  onFollowUpClick,
  onDeadlineClick,
  onQuickFollowUpClick,
}: PipelineColumnProps) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const { cardId, sourceStage } = JSON.parse(data);
        if (sourceStage !== stage) {
          onDragEnd(cardId, sourceStage, stage);
        }
      } catch (error) {
        console.error('Failed to parse drag data:', error);
      }
    }
  };

  const overdueCount = cards.filter((c) => c.isOverdue).length;

  return (
    <Card
      variant="elevated"
      padding="none"
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        border: '1px solid rgba(0,0,0,0.04)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        ref={columnRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Column Header */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `2.5px solid ${STAGE_COLORS[stage]}`,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: 13, color: theme.colors.neutral[800] }}>
              {stageName}
            </Text>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Badge
                count={count}
                style={{
                  backgroundColor: STAGE_COLORS[stage],
                  fontSize: '10px',
                  height: '18px',
                  lineHeight: '18px',
                  minWidth: '18px',
                  padding: '0 5px',
                  border: 'none',
                  boxShadow: 'none'
                }}
                overflowCount={999}
              />
              {overdueCount > 0 && (
                <Badge
                  count={overdueCount}
                  style={{
                    backgroundColor: '#ff4d4f',
                    fontSize: '10px',
                    height: '18px',
                    lineHeight: '18px',
                    minWidth: '18px',
                    padding: '0 5px',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                  title="超期数量"
                />
              )}
            </div>
          </div>
        </div>

        {/* Cards Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px',
            backgroundColor: `${theme.colors.background.secondary}`,
          }}
        >
          {cards.map((card) => (
            <CollaborationCardComponent
              key={card.id}
              card={card}
              stage={stage}
              onClick={() => onCardClick(card)}
              onFollowUpClick={() => onFollowUpClick(card)}
              onDeadlineClick={() => onDeadlineClick(card)}
              onQuickFollowUpClick={() => onQuickFollowUpClick(card)}
            />
          ))}
          {cards.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#999',
              }}
            >
              暂无数据
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PipelineColumn;
