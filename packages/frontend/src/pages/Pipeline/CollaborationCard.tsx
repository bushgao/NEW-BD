import { Tag, Typography, Tooltip, Button } from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { PipelineStage } from '@ics/shared';
import {
  BLOCK_REASON_LABELS,
  type CollaborationCard,
} from '../../services/collaboration.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import { Card, CardContent } from '../../components/ui/Card';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

interface CollaborationCardProps {
  card: CollaborationCard;
  stage: PipelineStage;
  onClick: () => void;
  onFollowUpClick: () => void;
  onDeadlineClick: () => void;
  onQuickFollowUpClick: () => void;
}

const CollaborationCardComponent = ({
  card,
  stage,
  onClick,
  onFollowUpClick,
  onQuickFollowUpClick,
}: CollaborationCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ cardId: card.id, sourceStage: stage })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

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

  const deadlineInfo = formatDeadline(card.deadline);

  return (
    <Card
      variant="elevated"
      padding="none"
      hoverable
      style={{
        marginBottom: 4,
        cursor: 'grab',
        borderLeft: card.isOverdue ? '3px solid #ff4d4f' : undefined,
        backgroundColor: card.isOverdue ? 'rgba(255, 242, 240, 0.4)' : undefined,
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
      onClick={onClick}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        style={{ cursor: 'grab' }}
      >
        <CardContent style={{ padding: '10px 12px' }}>
          {/* Header Row: Nickname and Platform */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 4 }}>
            <Text strong ellipsis style={{ fontSize: 12, lineHeight: '16px', flex: 1 }}>
              {card.influencer.nickname}
            </Text>
            <Tag
              color={getPlatformColor(card.influencer.platform)}
              style={{
                marginRight: 0,
                fontSize: 10,
                lineHeight: '13px',
                height: '14px',
                padding: '0 3px',
                borderRadius: '2px',
                border: 'none',
                opacity: 0.8,
                flexShrink: 0
              }}
            >
              {PLATFORM_LABELS[card.influencer.platform as keyof typeof PLATFORM_LABELS] ||
                card.influencer.platform}
            </Tag>
          </div>

          {/* Block Reason - Single line if present */}
          {card.blockReason && (
            <div style={{ marginBottom: 2 }}>
              <Tag
                color="error"
                icon={<WarningOutlined style={{ fontSize: 9 }} />}
                style={{ fontSize: 9, borderRadius: '2px', border: 'none', padding: '0 3px', lineHeight: '14px', height: '14px' }}
              >
                {BLOCK_REASON_LABELS[card.blockReason]}
              </Tag>
            </div>
          )}

          {/* Info Row: Staff and Deadline combined */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, color: '#8c8c8c', fontSize: 10, marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0 }}>
              <UserOutlined style={{ fontSize: 9, opacity: 0.7 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.businessStaff.name}
              </span>
            </div>

            {deadlineInfo ? (
              <Tooltip title={card.deadline ? dayjs(card.deadline).format('YYYY-MM-DD HH:mm') : ''}>
                <Text style={{ fontSize: 10, color: deadlineInfo.color, flexShrink: 0 }}>
                  {deadlineInfo.text}
                </Text>
              </Tooltip>
            ) : (
              <span style={{ fontSize: 10, color: '#bfbfbf', flexShrink: 0 }}>待定</span>
            )}
          </div>

          {/* Dispatch Count - only show if > 0, very small */}
          {card.dispatchCount > 0 && (
            <div style={{ fontSize: 9, color: '#8c8c8c', marginBottom: 2 }}>
              📦 {card.dispatchCount}
            </div>
          )}

          {/* Actions Bar - Compacted */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '2px',
            marginTop: 2,
            paddingTop: 2,
            borderTop: '1px solid rgba(0,0,0,0.02)'
          }}>
            <Tooltip title="快速跟进">
              <Button
                type="text"
                size="small"
                icon={<ThunderboltOutlined style={{ fontSize: 12, color: '#faad14' }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickFollowUpClick();
                }}
                style={{ width: 20, height: 20, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              />
            </Tooltip>
            <Tooltip title="跟进记录">
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined style={{ fontSize: 11 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowUpClick();
                }}
                style={{
                  height: 20,
                  minWidth: 20,
                  padding: '0 2px',
                  fontSize: 9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1px'
                }}
              >
                {card.followUpCount > 0 ? card.followUpCount : ''}
              </Button>
            </Tooltip>
          </div>

          {/* Last Follow Up - optional/compact */}
          {card.lastFollowUp && (
            <div style={{ marginTop: 2, fontSize: 9, color: '#bfbfbf', textAlign: 'right' }}>
              {dayjs(card.lastFollowUp).fromNow()}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default CollaborationCardComponent;
