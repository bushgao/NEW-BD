import { Typography } from 'antd';
import { useTheme } from '../../theme/ThemeProvider';
import InfluencerManagement from './InfluencerManagement';

const { Title } = Typography;

const Influencers = () => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '40px',
        margin: '-24px',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          达人管理
        </Title>
        <InfluencerManagement />
      </div>
    </div>
  );
};

export default Influencers;
