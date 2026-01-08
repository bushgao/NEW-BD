import React from 'react';
import { Card, Row, Col, Badge, Button } from 'antd';
import {
  ClockCircleOutlined,
  InboxOutlined,
  FileTextOutlined,
  DownloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  route: string;
  filter?: Record<string, any>;
}

interface QuickActionsPanelProps {
  overdueCollaborations: number;
  pendingReceipts: number;
  pendingResults: number;
  onExport?: () => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  overdueCollaborations,
  pendingReceipts,
  pendingResults,
  onExport,
}) => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'overdue',
      title: '超期合作',
      icon: <ClockCircleOutlined style={{ fontSize: 24 }} />,
      count: overdueCollaborations,
      color: '#ff4d4f',
      route: '/app/pipeline',
      filter: { status: 'overdue' },
    },
    {
      id: 'pending-receipts',
      title: '待签收样品',
      icon: <InboxOutlined style={{ fontSize: 24 }} />,
      count: pendingReceipts,
      color: '#faad14',
      route: '/app/samples',
      filter: { status: 'pending' },
    },
    {
      id: 'pending-results',
      title: '待录入结果',
      icon: <FileTextOutlined style={{ fontSize: 24 }} />,
      count: pendingResults,
      color: '#1890ff',
      route: '/app/results',
      filter: { status: 'pending' },
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    // 导航到对应页面并应用筛选
    navigate(action.route, { state: { filter: action.filter } });
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  return (
    <Card
      title={
        <span>
          <WarningOutlined style={{ marginRight: 8 }} />
          快捷操作
        </span>
      }
      extra={
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          导出报表
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        {actions.map((action) => (
          <Col key={action.id} span={8}>
            <Card
              hoverable
              onClick={() => handleActionClick(action)}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                borderColor: action.count > 0 ? action.color : undefined,
              }}
              bodyStyle={{ padding: '20px 12px' }}
            >
              <Badge count={action.count} overflowCount={99}>
                <div
                  style={{
                    color: action.count > 0 ? action.color : '#8c8c8c',
                    marginBottom: 8,
                  }}
                >
                  {action.icon}
                </div>
              </Badge>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: action.count > 0 ? action.color : '#595959',
                  marginTop: 8,
                }}
              >
                {action.title}
              </div>
              {action.count > 0 && (
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: action.color,
                    marginTop: 4,
                  }}
                >
                  {action.count}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActionsPanel;
