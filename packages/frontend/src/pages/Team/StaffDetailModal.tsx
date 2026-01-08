import { useState, useEffect } from 'react';
import { Modal, Descriptions, Spin, message, Statistic, Row, Col, Divider, Tabs } from 'antd';
import {
  TeamOutlined,
  ProjectOutlined,
  GiftOutlined,
  TrophyOutlined,
  DollarOutlined,
  TrophyFilled,
  CalendarOutlined,
} from '@ant-design/icons';
import { getStaffDetail, type StaffDetail } from '../../services/staff-management.service';
import { Card, CardContent } from '../../components/ui/Card';
import StaffQualityScore from '../../components/charts/StaffQualityScore';
import StaffWorkCalendar from '../../components/charts/StaffWorkCalendar';

interface StaffDetailModalProps {
  visible: boolean;
  staffId: string;
  onCancel: () => void;
}

const StaffDetailModal = ({ visible, staffId, onCancel }: StaffDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<StaffDetail | null>(null);

  useEffect(() => {
    if (visible && staffId) {
      fetchDetail();
    }
  }, [visible, staffId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await getStaffDetail(staffId);
      setDetail(data);
    } catch (error) {
      message.error('获取商务账号详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `¥${(cents / 100).toFixed(2)}`;
  };

  return (
    <Modal
      title="商务账号详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : detail ? (
        <Tabs
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <div>
                  {/* 基本信息 */}
                  <Descriptions title="基本信息" column={2} bordered>
                    <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{detail.email}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {detail.status === 'ACTIVE' ? '正常' : '已禁用'}
                    </Descriptions.Item>
                    <Descriptions.Item label="加入时间">
                      {new Date(detail.createdAt).toLocaleString('zh-CN')}
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider>工作统计</Divider>

                  {/* 工作统计卡片 */}
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card>
                        <CardContent>
                          <Statistic
                            title="管理的达人数量"
                            value={detail.stats.influencerCount}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </CardContent>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <CardContent>
                          <Statistic
                            title="创建的合作数量"
                            value={detail.stats.collaborationCount}
                            prefix={<ProjectOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </CardContent>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <CardContent>
                          <Statistic
                            title="寄样次数"
                            value={detail.stats.dispatchCount}
                            prefix={<GiftOutlined />}
                            valueStyle={{ color: '#faad14' }}
                          />
                        </CardContent>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <CardContent>
                          <Statistic
                            title="成交数量"
                            value={detail.stats.closedDeals}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                          />
                        </CardContent>
                      </Card>
                    </Col>
                    <Col span={16}>
                      <Card>
                        <CardContent>
                          <Statistic
                            title="总GMV"
                            value={formatCurrency(detail.stats.totalGmv)}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#eb2f96', fontSize: 24 }}
                          />
                        </CardContent>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'quality',
              label: (
                <span>
                  <TrophyFilled /> 质量评分
                </span>
              ),
              children: (
                <StaffQualityScore 
                  staffId={staffId} 
                  showTrend={true}
                  showSuggestions={true}
                />
              )
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined /> 工作日历
                </span>
              ),
              children: (
                <StaffWorkCalendar staffId={staffId} />
              )
            }
          ]}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          暂无数据
        </div>
      )}
    </Modal>
  );
};

export default StaffDetailModal;
