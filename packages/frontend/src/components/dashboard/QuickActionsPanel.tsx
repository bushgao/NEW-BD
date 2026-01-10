import React from 'react';
import { Card, Badge, Button } from 'antd';
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
  isBento?: boolean;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  overdueCollaborations,
  pendingReceipts,
  pendingResults,
  onExport,
  isBento,
}) => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'overdue',
      title: '超期合作',
      icon: <ClockCircleOutlined style={{ fontSize: 20 }} />,
      count: overdueCollaborations,
      color: '#C89B9C',  // 豆沙粉 - 柔和警告色
      route: '/app/pipeline',
      filter: { status: 'overdue' },
    },
    {
      id: 'pending-receipts',
      title: '待签收样品',
      icon: <InboxOutlined style={{ fontSize: 20 }} />,
      count: pendingReceipts,
      color: '#D4A574',  // 驼色 - 柔和提示色
      route: '/app/samples',
      filter: { status: 'pending' },
    },
    {
      id: 'pending-results',
      title: '待录入结果',
      icon: <FileTextOutlined style={{ fontSize: 20 }} />,
      count: pendingResults,
      color: '#8EACBB',  // 雾霾蓝 - 柔和信息色
      route: '/app/results',
      filter: { status: 'pending' },
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    navigate(action.route, { state: { filter: action.filter } });
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const content = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => (
        <div
          key={action.id}
          className="group cursor-pointer bg-neutral-50 hover:bg-white p-4 rounded-2xl border border-neutral-100 transition-all hover:shadow-soft flex flex-col items-center text-center"
          onClick={() => handleActionClick(action)}
        >
          <div
            className="mb-3 p-3 rounded-full transition-colors"
            style={{
              backgroundColor: action.count > 0 ? `${action.color}15` : '#f3f4f6',
              color: action.count > 0 ? action.color : '#9ca3af',
            }}
          >
            {action.icon}
          </div>
          <div
            className="text-sm font-bold mb-1"
            style={{
              color: action.count > 0 ? action.color : '#4b5563',
            }}
          >
            {action.title}
          </div>
          <Badge
            count={action.count}
            overflowCount={99}
            style={{
              backgroundColor: action.count > 0 ? action.color : '#d1d5db'
            }}
          />
        </div>
      ))}
    </div>
  );

  if (isBento) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-end items-center mb-4 px-1">
          <Button
            type="text"
            icon={<DownloadOutlined className="text-xs" />}
            onClick={handleExport}
            size="small"
            className="text-neutral-400 hover:text-brand-600 hover:bg-neutral-50 transition-all rounded-lg"
          >
            <span className="text-[10px]">导出报表</span>
          </Button>
        </div>
        <div className="flex-1">
          {content}
        </div>
      </div>
    );
  }

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
          size="small"
        >
          导出报表
        </Button>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {content}
    </Card>
  );
};

export default QuickActionsPanel;
