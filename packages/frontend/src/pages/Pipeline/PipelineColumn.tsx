import { useRef } from 'react';
import { Badge, Typography } from 'antd';
import type { PipelineStage } from '@ics/shared';
import { STAGE_COLORS, type CollaborationCard } from '../../services/collaboration.service';
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
}: PipelineColumnProps) => {
  const columnRef = useRef<HTMLDivElement>(null);

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
    <div
      ref={columnRef}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `3px solid ${STAGE_COLORS[stage]}`,
          backgroundColor: '#fff',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            {stageName}
          </Text>
          <div>
            <Badge
              count={count}
              style={{ backgroundColor: STAGE_COLORS[stage] }}
              overflowCount={999}
            />
            {overdueCount > 0 && (
              <Badge
                count={overdueCount}
                style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }}
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
          padding: 8,
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
  );
};

export default PipelineColumn;
