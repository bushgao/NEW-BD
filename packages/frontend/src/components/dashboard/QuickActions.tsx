import { Typography, Row, Col, Button } from 'antd';
import {
  UserAddOutlined,
  FileAddOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Card as CustomCard, CardContent } from '../ui/Card';

const { Text } = Typography;

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onAddInfluencer: () => void;
  onCreateCollaboration: () => void;
  onDispatchSample: () => void;
  onQuickFollowUp: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddInfluencer,
  onCreateCollaboration,
  onDispatchSample,
  onQuickFollowUp,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'add-influencer',
      title: '添加达人',
      description: '快速添加新达人',
      icon: <UserAddOutlined style={{ fontSize: 24 }} />,
      color: '#1890ff',
      onClick: onAddInfluencer,
    },
    {
      id: 'create-collaboration',
      title: '创建合作',
      description: '快速创建合作记录',
      icon: <FileAddOutlined style={{ fontSize: 24 }} />,
      color: '#52c41a',
      onClick: onCreateCollaboration,
    },
    {
      id: 'dispatch-sample',
      title: '寄样',
      description: '快速寄送样品',
      icon: <SendOutlined style={{ fontSize: 24 }} />,
      color: '#faad14',
      onClick: onDispatchSample,
    },
    {
      id: 'quick-followup',
      title: '快速跟进',
      description: '记录跟进信息',
      icon: <MessageOutlined style={{ fontSize: 24 }} />,
      color: '#722ed1',
      onClick: onQuickFollowUp,
    },
  ];

  return (
    <CustomCard variant="elevated">
      <CardContent>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          快捷操作
        </Text>
        <Row gutter={[16, 16]}>
          {actions.map((action) => (
            <Col xs={12} sm={12} md={6} key={action.id}>
              <Button
                type="default"
                size="large"
                block
                onClick={action.onClick}
                style={{
                  height: 'auto',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ display: 'block', fontSize: 14 }}>
                    {action.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {action.description}
                  </Text>
                </div>
              </Button>
            </Col>
          ))}
        </Row>
      </CardContent>
    </CustomCard>
  );
};

export default QuickActions;
