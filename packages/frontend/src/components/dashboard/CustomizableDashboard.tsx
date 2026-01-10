import { useState, useCallback, useEffect } from 'react';
import { Button, Space, Switch, Typography, message, Spin } from 'antd';
import { SettingOutlined, SaveOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent } from '../ui/Card';
import api from '../../services/api';
import { BentoGrid, BentoCard } from '../ui/Bento';

const { Text } = Typography;

// 卡片类型定义
export interface DashboardCard {
  id: string;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
  component: React.ReactNode;
  span?: 1 | 2 | 3 | 4;
}

// 布局配置定义
export interface DashboardLayout {
  cards: Array<{
    id: string;
    visible: boolean;
    order: number;
  }>;
}

interface CustomizableDashboardProps {
  cards: DashboardCard[];
  onLayoutChange?: (layout: DashboardLayout) => void;
  autoSave?: boolean;
}

// 拖拽项类型
const ItemType = 'DASHBOARD_CARD';

interface DragItem {
  id: string;
  index: number;
}

// 可拖拽的卡片组件
interface DraggableCardProps {
  card: DashboardCard;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  toggleVisibility: (id: string) => void;
  isEditMode: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  index,
  moveCard,
  toggleVisibility,
  isEditMode,
}) => {
  const spanClass = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-3',
    4: 'col-span-1 md:col-span-4',
  }[card.span || 1];

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: card.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditMode,
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: DragItem) => {
      if (!isEditMode) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  if (!card.visible && !isEditMode) {
    return null;
  }

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`${spanClass} ${isDragging ? 'opacity-50' : ''}`}
      style={{
        cursor: isEditMode ? 'move' : 'default',
        position: 'relative',
        minHeight: isEditMode ? '100px' : 'auto',
      }}
    >
      {isEditMode && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '4px 8px',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {card.visible ? '显示' : '隐藏'}
            </Text>
            <Switch
              size="small"
              checked={card.visible}
              onChange={() => toggleVisibility(card.id)}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
            />
          </Space>
        </div>
      )}
      <BentoCard
        span={card.span || 1}
        title={card.title}
        subtitle={card.subtitle}
        className={!card.visible ? 'opacity-50' : 'h-full'}
      >
        <div
          style={{
            pointerEvents: card.visible || isEditMode ? 'auto' : 'none',
          }}
        >
          {card.component}
        </div>
      </BentoCard>
    </div>
  );
};

// 主组件
const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  cards: initialCards,
  onLayoutChange,
  autoSave = true,
}) => {
  const [cards, setCards] = useState<DashboardCard[]>(initialCards);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载用户的布局配置
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const response = await api.get('/users/dashboard-layout');
        if (response.data?.success && response.data?.data?.layout) {
          const savedLayout = response.data.data.layout as DashboardLayout;

          // 应用保存的布局
          const updatedCards = [...initialCards];
          savedLayout.cards.forEach((savedCard) => {
            const cardIndex = updatedCards.findIndex((c) => c.id === savedCard.id);
            if (cardIndex !== -1) {
              updatedCards[cardIndex] = {
                ...updatedCards[cardIndex],
                visible: savedCard.visible,
                order: savedCard.order,
              };
            }
          });

          // 按 order 排序
          updatedCards.sort((a, b) => a.order - b.order);
          setCards(updatedCards);
        } else {
          // 没有保存的布局，使用默认布局
          setCards(initialCards);
        }
      } catch (error) {
        console.error('加载布局配置失败:', error);
        setCards(initialCards);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  // 移动卡片
  const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setCards((prevCards) => {
      const newCards = [...prevCards];
      const [removed] = newCards.splice(dragIndex, 1);
      newCards.splice(hoverIndex, 0, removed);

      // 更新 order
      return newCards.map((card, index) => ({
        ...card,
        order: index,
      }));
    });
  }, []);

  // 切换卡片可见性
  const toggleVisibility = useCallback((id: string) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
  }, []);

  // 保存布局
  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const layout: DashboardLayout = {
        cards: cards.map((card) => ({
          id: card.id,
          visible: card.visible,
          order: card.order,
        })),
      };

      await api.post('/users/dashboard-layout', { layout });

      message.success('布局保存成功');

      if (onLayoutChange) {
        onLayoutChange(layout);
      }
    } catch (error) {
      console.error('保存布局失败:', error);
      message.error('保存布局失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 进入/退出编辑模式
  const toggleEditMode = () => {
    if (isEditMode && autoSave) {
      // 退出编辑模式时自动保存
      saveLayout();
    }
    setIsEditMode(!isEditMode);
  };

  // 手动保存
  const handleSave = async () => {
    await saveLayout();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">加载布局配置中...</Text>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* 控制栏 */}
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: isEditMode ? '#e6f7ff' : '#fafafa',
            borderRadius: 8,
            border: isEditMode ? '1px solid #91d5ff' : '1px solid #d9d9d9',
          }}
        >
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <SettingOutlined style={{ color: isEditMode ? '#1890ff' : undefined }} />
              <Text strong={isEditMode}>
                {isEditMode ? '编辑模式' : '看板布局'}
              </Text>
              {isEditMode && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  拖拽卡片调整顺序，切换开关显示/隐藏
                </Text>
              )}
            </Space>
            <Space>
              {isEditMode && !autoSave && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={isSaving}
                >
                  保存布局
                </Button>
              )}
              <Button
                type={isEditMode ? 'primary' : 'default'}
                onClick={toggleEditMode}
                loading={isSaving}
              >
                {isEditMode ? '完成编辑' : '自定义布局'}
              </Button>
            </Space>
          </Space>
        </div>

        {/* 卡片列表 - 使用 BentoGrid 布局 */}
        <BentoGrid>
          {cards.map((card, index) => (
            <DraggableCard
              key={card.id}
              card={card}
              index={index}
              moveCard={moveCard}
              toggleVisibility={toggleVisibility}
              isEditMode={isEditMode}
            />
          ))}
        </BentoGrid>

        {/* 提示信息 */}
        {isEditMode && (
          <Card variant="outlined" style={{ marginTop: 16 }}>
            <CardContent>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>💡 使用提示：</Text>
                <Text type="secondary">• 拖拽卡片可以调整显示顺序</Text>
                <Text type="secondary">• 使用开关可以显示/隐藏卡片</Text>
                <Text type="secondary">
                  • {autoSave ? '退出编辑模式时会自动保存' : '点击"保存布局"按钮保存更改'}
                </Text>
              </Space>
            </CardContent>
          </Card>
        )}
      </div>
    </DndProvider>
  );
};

export default CustomizableDashboard;
