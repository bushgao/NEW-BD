import { useState, useEffect } from 'react';
import { Typography, message } from 'antd';
import { useTheme } from '../../theme/ThemeProvider';
import FactoryList from './FactoryList';
import {
  getPlatformStats,
  type PlatformStats,
} from '../../services/platform.service';

const { Title } = Typography;

const Factories = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const loadStats = async () => {
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (error) {
      message.error('加载统计数据失败');
      console.error(error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
        margin: '-24px',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          品牌管理
        </Title>
        <FactoryList onRefresh={loadStats} />
      </div>
    </div>
  );
};

export default Factories;
