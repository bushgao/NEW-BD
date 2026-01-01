import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Row,
  Col,
  message,
  Popconfirm,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Platform } from '@ics/shared';
import {
  getInfluencers,
  deleteInfluencer,
  getAllTags,
  getAllCategories,
  PLATFORM_LABELS,
  type Influencer,
  type InfluencerFilter,
} from '../../services/influencer.service';
import InfluencerModal from './InfluencerModal';
import ImportModal from './ImportModal';
import TagsModal from './TagsModal';
import { ExportButton } from '../Import';

const { Title } = Typography;

const InfluencersPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Influencer[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filter, setFilter] = useState<InfluencerFilter>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [tagsInfluencer, setTagsInfluencer] = useState<Influencer | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInfluencers({
        ...filter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取达人列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [tags, categories] = await Promise.all([getAllTags(), getAllCategories()]);
      setAllTags(tags);
      setAllCategories(categories);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });
  };

  const handleSearch = (keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePlatformFilter = (platform: Platform | undefined) => {
    setFilter((prev) => ({ ...prev, platform }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (category: string | undefined) => {
    setFilter((prev) => ({ ...prev, category }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTagsFilter = (tags: string[] | undefined) => {
    setFilter((prev) => ({ ...prev, tags }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInfluencer(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '删除失败');
    }
  };

  const handleEdit = (record: Influencer) => {
    setEditingInfluencer(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingInfluencer(null);
    setModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setEditingInfluencer(null);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  const handleImportClose = (refresh?: boolean) => {
    setImportModalVisible(false);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  const handleTagsClick = (record: Influencer) => {
    setTagsInfluencer(record);
    setTagsModalVisible(true);
  };

  const handleTagsClose = (refresh?: boolean) => {
    setTagsModalVisible(false);
    setTagsInfluencer(null);
    if (refresh) {
      fetchData();
      fetchMetadata();
    }
  };

  const columns: ColumnsType<Influencer> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
      ellipsis: true,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: Platform) => (
        <Tag color={getPlatformColor(platform)}>{PLATFORM_LABELS[platform]}</Tag>
      ),
    },
    {
      title: '平台账号ID',
      dataIndex: 'platformId',
      key: 'platformId',
      width: 150,
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '类目',
      dataIndex: 'categories',
      key: 'categories',
      width: 150,
      render: (categories: string[]) =>
        categories.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {categories.slice(0, 2).map((cat) => (
              <Tag key={cat}>{cat}</Tag>
            ))}
            {categories.length > 2 && <Tag>+{categories.length - 2}</Tag>}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[], record: Influencer) => (
        <Space size={[0, 4]} wrap>
          {tags.slice(0, 2).map((tag) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && <Tag color="blue">+{tags.length - 2}</Tag>}
          <Tooltip title="管理标签">
            <TagsOutlined
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => handleTagsClick(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (notes: string | null) => notes || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该达人吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            达人管理
          </Title>
        </Col>
        <Col>
          <Space>
            <ExportButton types={['influencers']} buttonText="导出" showDateRange={false} />
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
              批量导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加达人
            </Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="搜索达人昵称"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择平台"
              allowClear
              style={{ width: '100%' }}
              onChange={handlePlatformFilter}
              options={Object.entries(PLATFORM_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择类目"
              allowClear
              style={{ width: '100%' }}
              onChange={handleCategoryFilter}
              options={allCategories.map((cat) => ({ value: cat, label: cat }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTagsFilter}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              maxTagCount={2}
            />
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <InfluencerModal
        visible={modalVisible}
        influencer={editingInfluencer}
        onClose={handleModalClose}
        allCategories={allCategories}
        allTags={allTags}
      />

      <ImportModal visible={importModalVisible} onClose={handleImportClose} />

      <TagsModal
        visible={tagsModalVisible}
        influencer={tagsInfluencer}
        onClose={handleTagsClose}
        allTags={allTags}
      />
    </div>
  );
};

// Helper function for platform colors
function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    DOUYIN: 'magenta',
    KUAISHOU: 'orange',
    XIAOHONGSHU: 'red',
    WEIBO: 'gold',
    OTHER: 'default',
  };
  return colors[platform];
}

export default InfluencersPage;
