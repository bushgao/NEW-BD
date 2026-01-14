import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, message, Modal } from 'antd';
import { EyeOutlined, SafetyCertificateOutlined, DownloadOutlined } from '@ant-design/icons';
import type {
  InfluencerWithDetails,
  Platform,
  InfluencerSourceType,
  VerificationStatus,
} from '@ics/shared';
import * as platformInfluencerService from '../../services/platform-influencer.service';
import InfluencerDetailModal from './InfluencerDetailModal';
import VerificationModal from './VerificationModal';

const platformLabels: Record<Platform, string> = {
  DOUYIN: '抖音',
  KUAISHOU: '快手',
  XIAOHONGSHU: '小红书',
  WEIBO: '微博',
  OTHER: '其他',
};

const sourceTypeLabels: Record<InfluencerSourceType, string> = {
  PLATFORM: '平台添加',
  FACTORY: '品牌添加',
  STAFF: '商务添加',
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
};

const verificationStatusColors: Record<VerificationStatus, string> = {
  UNVERIFIED: 'warning',
  VERIFIED: 'success',
  REJECTED: 'error',
};

export default function InfluencerManagement() {
  const [influencers, setInfluencers] = useState<InfluencerWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState<Platform | ''>('');
  const [sourceType, setSourceType] = useState<InfluencerSourceType | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerWithDetails | null>(null);

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
      if (platform) params.platform = platform;
      if (sourceType) params.sourceType = sourceType;
      if (verificationStatus) params.verificationStatus = verificationStatus;

      const data = await platformInfluencerService.listAllInfluencers(params);

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
    setPlatform('');
    setSourceType('');
    setVerificationStatus('');
    setPage(1);
    setTimeout(loadInfluencers, 0);
  };

  const handleViewDetail = (influencer: InfluencerWithDetails) => {
    setSelectedInfluencer(influencer);
    setDetailModalOpen(true);
  };

  const handleVerify = (influencer: InfluencerWithDetails) => {
    setSelectedInfluencer(influencer);
    setVerificationModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (keyword) params.keyword = keyword;
      if (platform) params.platform = platform;
      if (sourceType) params.sourceType = sourceType;
      if (verificationStatus) params.verificationStatus = verificationStatus;

      await platformInfluencerService.exportInfluencers(params);
      message.success('导出成功');
    } catch (error: any) {
      message.error(error.message || '导出失败');
    }
  };

  const handleDeleteInfluencer = (influencer: InfluencerWithDetails) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除达人「${influencer.nickname}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await platformInfluencerService.deleteInfluencer(influencer.id);
          message.success('删除成功');
          loadInfluencers();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => platformLabels[platform],
    },
    {
      title: '账号ID',
      dataIndex: 'platformId',
      key: 'platformId',
      width: 150,
    },
    {
      title: '粉丝数',
      dataIndex: 'followers',
      key: 'followers',
      width: 100,
      render: (followers: string) => followers || '-',
    },
    {
      title: '所属品牌',
      dataIndex: ['factory', 'name'],
      key: 'factoryName',
      width: 150,
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
      title: '添加人',
      dataIndex: ['creator', 'name'],
      key: 'creatorName',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: InfluencerWithDetails) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
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
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDeleteInfluencer(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索昵称/账号ID/手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择平台"
            value={platform}
            onChange={setPlatform}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="DOUYIN">抖音</Select.Option>
            <Select.Option value="KUAISHOU">快手</Select.Option>
            <Select.Option value="XIAOHONGSHU">小红书</Select.Option>
            <Select.Option value="WEIBO">微博</Select.Option>
            <Select.Option value="OTHER">其他</Select.Option>
          </Select>
          <Select
            placeholder="来源类型"
            value={sourceType}
            onChange={setSourceType}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="PLATFORM">平台添加</Select.Option>
            <Select.Option value="FACTORY">品牌添加</Select.Option>
            <Select.Option value="STAFF">商务添加</Select.Option>
          </Select>
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
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={influencers}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
      />

      <InfluencerDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedInfluencer(null);
        }}
        influencerId={selectedInfluencer?.id || ''}
      />

      <VerificationModal
        open={verificationModalOpen}
        influencer={selectedInfluencer}
        onClose={() => {
          setVerificationModalOpen(false);
          setSelectedInfluencer(null);
        }}
        onSuccess={() => {
          loadInfluencers();
        }}
      />
    </div>
  );
}
