import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, message, Modal } from 'antd';
import { EyeOutlined, SafetyCertificateOutlined, TeamOutlined, CloseCircleOutlined } from '@ant-design/icons';
import * as globalInfluencerService from '../../services/global-influencer.service';
import type { GlobalInfluencer, VerificationStatus, InfluencerSourceType } from '../../services/global-influencer.service';

const sourceTypeLabels: Record<InfluencerSourceType, string> = {
  PLATFORM: '平台添加',
  FACTORY: '品牌添加',
  STAFF: '商务添加',
  SELF_REGISTER: '达人自注册',
};

const verificationStatusLabels: Record<VerificationStatus, string> = {
  UNVERIFIED: '未认证',
  VERIFIED: '已认证',
  REJECTED: '认证失败',
};

const sourceTypeColors: Record<InfluencerSourceType, string> = {
  PLATFORM: 'blue',
  FACTORY: 'green',
  STAFF: 'default',
  SELF_REGISTER: 'purple',
};

const verificationStatusColors: Record<VerificationStatus, string> = {
  UNVERIFIED: 'warning',
  VERIFIED: 'success',
  REJECTED: 'error',
};

export default function InfluencerManagement() {
  const [influencers, setInfluencers] = useState<GlobalInfluencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');

  // Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<GlobalInfluencer | null>(null);
  const [verifyNote, setVerifyNote] = useState('');

  useEffect(() => {
    loadInfluencers();
  }, [page, pageSize]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (verificationStatus) params.verificationStatus = verificationStatus;

      const data = await globalInfluencerService.searchGlobalInfluencers(params);

      setInfluencers(data.data);
      setTotal(data.total);
    } catch (error: any) {
      message.error(error.message || '加载达人列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadInfluencers();
  };

  const handleReset = () => {
    setKeyword('');
    setVerificationStatus('');
    setPage(1);
    setTimeout(loadInfluencers, 0);
  };

  const handleVerify = (influencer: GlobalInfluencer) => {
    setSelectedInfluencer(influencer);
    setVerifyNote('');
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedInfluencer) return;

    try {
      await globalInfluencerService.verifyInfluencer(selectedInfluencer.id, status, verifyNote);
      message.success(status === 'VERIFIED' ? '认证成功' : '已拒绝认证');
      setVerifyModalOpen(false);
      loadInfluencers();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      width: 130,
      render: (wechat: string) => wechat || '-',
    },
    {
      title: '合作品牌数',
      dataIndex: 'brandCount',
      key: 'brandCount',
      width: 100,
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <span>{count || 0}</span>
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 100,
      render: (type: InfluencerSourceType) => (
        <Tag color={sourceTypeColors[type]}>{sourceTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 100,
      render: (status: VerificationStatus) => (
        <Tag color={verificationStatusColors[status]}>
          {verificationStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: GlobalInfluencer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info(`查看达人详情：${record.nickname}`)}
          >
            查看
          </Button>
          {record.verificationStatus === 'UNVERIFIED' && (
            <Button
              type="link"
              size="small"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleVerify(record)}
            >
              认证
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索昵称/手机号/微信号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="认证状态"
            value={verificationStatus}
            onChange={setVerificationStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="UNVERIFIED">未认证</Select.Option>
            <Select.Option value="VERIFIED">已认证</Select.Option>
            <Select.Option value="REJECTED">认证失败</Select.Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={influencers}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 位达人`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
      />

      {/* 认证弹窗 */}
      <Modal
        title={`认证达人：${selectedInfluencer?.nickname}`}
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setVerifyModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleVerifySubmit('REJECTED')}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={() => handleVerifySubmit('VERIFIED')}
          >
            通过认证
          </Button>,
        ]}
      >
        <p>手机号：{selectedInfluencer?.phone || '-'}</p>
        <p>微信号：{selectedInfluencer?.wechat || '-'}</p>
        <Input.TextArea
          placeholder="备注（拒绝时请填写原因）"
          value={verifyNote}
          onChange={(e) => setVerifyNote(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
}
