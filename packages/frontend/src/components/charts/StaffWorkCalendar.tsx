import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Spin, Alert, Card, Statistic, Row, Col, Modal, List, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { reportService } from '../../services/report.service';

interface CalendarEvent {
  date: string;
  type: 'deadline' | 'scheduled' | 'followup';
  title: string;
  collaborationId: string;
  influencerName: string;
  stage: string;
}

interface WorkloadData {
  date: string;
  count: number;
  level: 'low' | 'medium' | 'high';
}

interface CalendarData {
  events: CalendarEvent[];
  workload: WorkloadData[];
  stats: {
    totalEvents: number;
    deadlines: number;
    scheduled: number;
    followups: number;
    avgDailyWorkload: number;
  };
}

interface StaffWorkCalendarProps {
  staffId: string;
}

const StaffWorkCalendar: React.FC<StaffWorkCalendarProps> = ({ staffId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCalendarData(selectedDate);
  }, [staffId, selectedDate]);

  const fetchCalendarData = async (date: Dayjs) => {
    setLoading(true);
    setError(null);
    try {
      const month = date.format('YYYY-MM');
      const data = await reportService.getStaffCalendar(staffId, month);
      setCalendarData(data);
    } catch (err: any) {
      console.error('获取日历数据失败:', err);
      setError(err.message || '获取日历数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string): 'error' | 'success' | 'processing' | 'default' => {
    switch (type) {
      case 'deadline':
        return 'error';
      case 'scheduled':
        return 'processing';
      case 'followup':
        return 'success';
      default:
        return 'default';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'deadline':
        return '截止日期';
      case 'scheduled':
        return '排期日期';
      case 'followup':
        return '跟进提醒';
      default:
        return '其他';
    }
  };

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  const dateCellRender = (value: Dayjs) => {
    if (!calendarData) return null;

    const dateStr = value.format('YYYY-MM-DD');
    
    // 获取当天的事件
    const dayEvents = calendarData.events.filter(
      event => event.date === dateStr
    );

    // 获取当天的工作负载
    const dayWorkload = calendarData.workload.find(
      w => w.date === dateStr
    );

    return (
      <div style={{ minHeight: '60px' }}>
        {/* 工作负载指示器 */}
        {dayWorkload && dayWorkload.count > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: getWorkloadColor(dayWorkload.level),
            }}
            title={`工作量: ${dayWorkload.count} 项`}
          />
        )}

        {/* 事件列表 */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {dayEvents.slice(0, 3).map((event, index) => (
            <li key={index} style={{ marginBottom: 2 }}>
              <Badge
                status={getEventTypeColor(event.type)}
                text={
                  <span
                    style={{
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      maxWidth: '100px',
                    }}
                  >
                    {event.title}
                  </span>
                }
              />
            </li>
          ))}
          {dayEvents.length > 3 && (
            <li style={{ fontSize: '12px', color: '#999' }}>
              +{dayEvents.length - 3} 更多...
            </li>
          )}
        </ul>
      </div>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    if (!calendarData) return;

    const dateStr = date.format('YYYY-MM-DD');
    const dayEvents = calendarData.events.filter(
      event => event.date === dateStr
    );

    if (dayEvents.length > 0) {
      setSelectedEvents(dayEvents);
      setModalVisible(true);
    }
  };

  const handlePanelChange = (date: Dayjs) => {
    setSelectedDate(date);
  };

  if (loading && !calendarData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载日历数据..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!calendarData) {
    return null;
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总事件数"
              value={calendarData.stats.totalEvents}
              suffix="项"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="截止日期"
              value={calendarData.stats.deadlines}
              suffix="个"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="排期日期"
              value={calendarData.stats.scheduled}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均日工作量"
              value={calendarData.stats.avgDailyWorkload.toFixed(1)}
              suffix="项"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图例说明 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <Badge status="error" text="截止日期" />
          </div>
          <div>
            <Badge status="processing" text="排期日期" />
          </div>
          <div>
            <Badge status="success" text="跟进提醒" />
          </div>
          <div style={{ marginLeft: 24 }}>
            <span style={{ marginRight: 8 }}>工作负载:</span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#52c41a',
                marginRight: 4,
              }}
            />
            <span style={{ marginRight: 12 }}>低</span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#faad14',
                marginRight: 4,
              }}
            />
            <span style={{ marginRight: 12 }}>中</span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ff4d4f',
                marginRight: 4,
              }}
            />
            <span>高</span>
          </div>
        </div>
      </Card>

      {/* 日历 */}
      <Card>
        <Calendar
          dateCellRender={dateCellRender}
          onSelect={handleDateSelect}
          onPanelChange={handlePanelChange}
        />
      </Card>

      {/* 事件详情弹窗 */}
      <Modal
        title={`${selectedEvents[0]?.date} 的工作安排`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={selectedEvents}
          renderItem={(event) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div>
                    <Tag color={getEventTypeColor(event.type)}>
                      {getEventTypeName(event.type)}
                    </Tag>
                    <span>{event.title}</span>
                  </div>
                }
                description={
                  <div>
                    <div>达人: {event.influencerName}</div>
                    <div>阶段: {event.stage}</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      合作ID: {event.collaborationId}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default StaffWorkCalendar;
