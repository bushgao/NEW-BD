import { Tag, Typography, Space, Tooltip, Button } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  WarningOutlined,
  CalendarOutlined,
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
}

const CollaborationCardComponent = ({
  card,
  stage,
  onClick,
  onFollowUpClick,
  onDeadlineClick,
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
      hoverable
      style={{
        marginBottom: 8,
        cursor: 'grab',
        borderLeft: card.isOverdue ? '3px solid #ff4d4f' : undefined,
        backgroundColor: card.isOverdue ? 'rgba(255, 242, 240, 0.8)' : undefined,
      }}
      onClick={onClick}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        style={{ cursor: 'grab' }}
      >
        <CardContent style={{ padding: 12 }}>
          {/* Header: Nickname and Platform */}
          <div style={{ marginBottom: 8 }}>
            <Space size={4}>
              <Text strong ellipsis style={{ maxWidth: 150 }}>
                {card.influencer.nickname}
              </Text>
              <Tag color={getPlatformColor(card.influencer.platform)} style={{ marginRight: 0 }}>
                {PLATFORM_LABELS[card.influencer.platform as keyof typeof PLATFORM_LABELS] ||
                  card.influencer.platform}
              </Tag>
            </Space>
          </div>


      {/* Block Reason */}
      {card.blockReason && (
        <div style={{ marginBottom: 8 }}>
          <Tag color="error" icon={<WarningOutlined />}>
            {BLOCK_REASON_LABELS[card.blockReason]}
          </Tag>
        </div>
      )}

      {/* Info Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#8c8c8c',
          fontSize: 12,
        }}
      >
        <Space size={12}>
          <Tooltip title="负责商务">
            <span>
              <UserOutlined /> {card.businessStaff.name}
            </span>
          </Tooltip>
          {card.dispatchCount > 0 && (
            <Tooltip title="寄样次数">
              <span>📦 {card.dispatchCount}</span>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Footer: Deadline and Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid #f0f0f0',
        }}
      >
        {/* Deadline */}
        <div>
          {deadlineInfo ? (
            <Tooltip title={card.deadline ? dayjs(card.deadline).format('YYYY-MM-DD HH:mm') : ''}>
              <Text style={{ fontSize: 12, color: deadlineInfo.color }}>
                <ClockCircleOutlined /> {deadlineInfo.text}
              </Text>
            </Tooltip>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<CalendarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDeadlineClick();
              }}
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
            >
              设置截止时间
            </Button>
          )}
        </div>

        {/* Actions */}
        <Space size={4}>
          <Tooltip title="跟进记录">
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onFollowUpClick();
              }}
            >
              {card.followUpCount > 0 && card.followUpCount}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Last Follow Up */}
      {card.lastFollowUp && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#bfbfbf' }}>
          最近跟进: {dayjs(card.lastFollowUp).fromNow()}
        </div>
      )}
        </CardContent>
      </div>
    </Card>
  );
};

export default CollaborationCardComponent;
