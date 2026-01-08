import { Typography } from 'antd';
import InfluencerManagement from './InfluencerManagement';

const { Title } = Typography;

const Influencers = () => {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        达人管理
      </Title>
      <InfluencerManagement />
    </div>
  );
};

export default Influencers;
