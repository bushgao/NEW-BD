import { useState, useEffect } from 'react';
import { Typography, message } from 'antd';
import FactoryList from './FactoryList';
import {
  getPlatformStats,
  type PlatformStats,
} from '../../services/platform.service';

const { Title } = Typography;

const Factories = () => {
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
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        工厂管理
      </Title>
      <FactoryList onRefresh={loadStats} />
    </div>
  );
};

export default Factories;
