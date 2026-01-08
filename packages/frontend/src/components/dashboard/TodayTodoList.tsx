import { useState } from 'react';
import { Card, List, Button, Badge, Space, Typography, Empty, Tag, Progress, Tooltip, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  SendOutlined,
  FileTextOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Title } = Typography;

export interface TodoItem {
  id: string;
  type: 'followup' | 'deadline' | 'dispatch' | 'result';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueTime?: Date;
  relatedId: string;
  completed?: boolean;
  snoozedUntil?: Date;
}

export interface TodayGoal {
  type: 'followup' | 'dispatch' | 'deal';
  target: number;
  current: number;
  label: string;
}

interface TodayTodoListProps {
  todos: TodoItem[];
  goals?: TodayGoal[];
  onComplete: (todoId: string) => Promise<void>;
  onSnooze: (todoId: string, until: Date) => Promise<void>;
  onNavigate?: (todoId: string, relatedId: string) => void;
  loading?: boolean;
}

const TodayTodoList: React.FC<TodayTodoListProps> = ({
  todos,
  goals = [],
  onComplete,
  onSnooze,
  onNavigate,
  loading = false,
}) => {
  const navigate = useNavigate();
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [snoozingIds, setSnoozingIds] = useState<Set<string>>(new Set());

  // 图标映射
  const typeIcons = {
    followup: <MessageOutlined style={{ color: '#1890ff' }} />,
    deadline: <ClockCircleOutlined style={{ color: '#ff4d4f' }} />,
    dispatch: <SendOutlined style={{ color: '#faad14' }} />,
    result: <FileTextOutlined style={{ color: '#722ed1' }} />,
  };

  // 优先级颜色
  const priorityColors = {
    high: '#ff4d4f',
    medium: '#faad14',
    low: '#52c41a',
  };

  // 优先级标签
  const priorityLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  // 处理完成待办
  const handleComplete = async (todoId: string) => {
    setCompletingIds(prev => new Set(prev).add(todoId));
    try {
      await onComplete(todoId);
      message.success('已完成');
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    } finally {
      setCompletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoId);
        return newSet;
      });
    }
  };

  // 处理暂停待办（暂停1小时）
  const handleSnooze = async (todoId: string) => {
    setSnoozingIds(prev => new Set(prev).add(todoId));
    try {
      const until = dayjs().add(1, 'hour').toDate();
      await onSnooze(todoId, until);
      message.success('已暂停1小时');
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    } finally {
      setSnoozingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoId);
        return newSet;
      });
    }
  };

  // 处理点击待办
  const handleTodoClick = (todo: TodoItem) => {
    if (onNavigate) {
      onNavigate(todo.id, todo.relatedId);
    } else {
      // 默认导航逻辑
      switch (todo.type) {
        case 'followup':
        case 'deadline':
          navigate(`/app/pipeline?highlight=${todo.relatedId}`);
          break;
        case 'dispatch':
          navigate(`/app/samples?highlight=${todo.relatedId}`);
          break;
        case 'result':
          navigate(`/app/results?highlight=${todo.relatedId}`);
          break;
      }
    }
  };

  // 过滤未完成和未暂停的待办
  const activeTodos = todos.filter(
    todo => !todo.completed && (!todo.snoozedUntil || dayjs(todo.snoozedUntil).isBefore(dayjs()))
  );

  // 按优先级排序
  const sortedTodos = [...activeTodos].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 计算今日进度
  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const progressPercent = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined />
          <span>今日工作清单</span>
          <Badge count={activeTodos.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      }
      extra={
        <Text type="secondary">
          {completedTodos}/{totalTodos} 已完成
        </Text>
      }
      loading={loading}
    >
      {/* 今日目标 */}
      {goals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>今日目标</Text>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {goals.map((goal, index) => {
              const percent = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{goal.label}</Text>
                    <Text type="secondary">
                      {goal.current}/{goal.target}
                    </Text>
                  </div>
                  <Progress
                    percent={percent}
                    strokeColor={percent >= 100 ? '#52c41a' : '#1890ff'}
                    showInfo={false}
                    size="small"
                  />
                </div>
              );
            })}
          </Space>
        </div>
      )}

      {/* 今日进度 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>今日进度</Text>
          <Text type="secondary">{progressPercent.toFixed(0)}%</Text>
        </div>
        <Progress
          percent={progressPercent}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
        />
      </div>

      {/* 待办事项列表 */}
      {sortedTodos.length > 0 ? (
        <List
          dataSource={sortedTodos}
          renderItem={(todo) => {
            const isCompleting = completingIds.has(todo.id);
            const isSnoozing = snoozingIds.has(todo.id);
            const isOverdue = todo.dueTime && dayjs(todo.dueTime).isBefore(dayjs());

            return (
              <List.Item
                actions={[
                  <Tooltip title="暂停1小时">
                    <Button
                      type="text"
                      size="small"
                      icon={<PauseCircleOutlined />}
                      onClick={() => handleSnooze(todo.id)}
                      loading={isSnoozing}
                      disabled={isCompleting}
                    />
                  </Tooltip>,
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleComplete(todo.id)}
                    loading={isCompleting}
                    disabled={isSnoozing}
                  >
                    完成
                  </Button>,
                ]}
                style={{
                  cursor: 'pointer',
                  borderLeft: `3px solid ${priorityColors[todo.priority]}`,
                  paddingLeft: 12,
                }}
                onClick={() => !isCompleting && !isSnoozing && handleTodoClick(todo)}
              >
                <List.Item.Meta
                  avatar={typeIcons[todo.type]}
                  title={
                    <Space>
                      <Text strong>{todo.title}</Text>
                      <Tag color={priorityColors[todo.priority]} style={{ margin: 0 }}>
                        {priorityLabels[todo.priority]}
                      </Tag>
                      {isOverdue && (
                        <Tag color="error" icon={<WarningOutlined />}>
                          已超期
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {todo.description}
                      </Text>
                      {todo.dueTime && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {isOverdue ? '超期 ' : ''}
                            {dayjs(todo.dueTime).fromNow()}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty
          description="暂无待办事项"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '24px 0' }}
        >
          <Text type="secondary">太棒了！今天的任务都完成了 🎉</Text>
        </Empty>
      )}
    </Card>
  );
};

export default TodayTodoList;
