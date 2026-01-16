import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Input,
    Button,
    message,
    Space,
    Typography,
    Tag,
    Modal,
    Tooltip,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    UserOutlined,
    PhoneOutlined,
    WechatOutlined,
} from '@ant-design/icons';
import { searchGlobalInfluencers, type GlobalInfluencer } from '../../services/global-influencer.service';
import { addInfluencerToRoster } from '../../services/influencer.service';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 主题色常量
const PRIMARY_COLOR = '#1890ff';
const PRIMARY_BG = '#e6f7ff';

interface InfluencerForDisplay extends GlobalInfluencer {
    key: string;
}

const InfluencerSquarePage = () => {
    const [loading, setLoading] = useState(false);
    const [influencers, setInfluencers] = useState<InfluencerForDisplay[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [addingId, setAddingId] = useState<string | null>(null);

    // 加载全局达人列表
    const loadInfluencers = async (page = 1, search = keyword) => {
        setLoading(true);
        try {
            const result = await searchGlobalInfluencers({
                keyword: search,
                page,
                pageSize: 10,
            });
            setInfluencers(result.data.map(item => ({ ...item, key: item.id })));
            setTotal(result.total);
            setCurrentPage(page);
        } catch (error) {
            message.error('加载达人列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInfluencers();
    }, []);

    // 搜索
    const handleSearch = (value: string) => {
        setKeyword(value);
        loadInfluencers(1, value);
    };

    // 拉入我的库
    const handleAddToRoster = async (influencer: GlobalInfluencer) => {
        setAddingId(influencer.id);
        try {
            await addInfluencerToRoster({
                globalInfluencerId: influencer.id,
                nickname: influencer.nickname || '',
                phone: influencer.phone || undefined,
                wechat: influencer.wechat || undefined,
            });
            message.success(`已将「${influencer.nickname}」添加到我的达人库`);
        } catch (error: any) {
            if (error.response?.status === 409) {
                message.warning('该达人已在您的库中');
            } else {
                message.error(error.response?.data?.message || '添加失败');
            }
        } finally {
            setAddingId(null);
        }
    };

    // 确认添加
    const confirmAdd = (influencer: GlobalInfluencer) => {
        Modal.confirm({
            title: '添加达人到我的库',
            content: (
                <div>
                    <p>确定将以下达人添加到您的达人库吗？</p>
                    <p><strong>昵称：</strong>{influencer.nickname}</p>
                    {influencer.phone && <p><strong>手机号：</strong>{influencer.phone}</p>}
                </div>
            ),
            okText: '确认添加',
            cancelText: '取消',
            onOk: () => handleAddToRoster(influencer),
        });
    };

    const columns = [
        {
            title: '昵称',
            dataIndex: 'nickname',
            key: 'nickname',
            render: (text: string) => (
                <Space>
                    <UserOutlined style={{ color: PRIMARY_COLOR }} />
                    <Text strong>{text || '-'}</Text>
                </Space>
            ),
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => (
                <Space>
                    <PhoneOutlined />
                    <Text>{text || '-'}</Text>
                </Space>
            ),
        },
        {
            title: '微信号',
            dataIndex: 'wechat',
            key: 'wechat',
            render: (text: string) => (
                <Space>
                    <WechatOutlined style={{ color: '#07c160' }} />
                    <Text>{text || '-'}</Text>
                </Space>
            ),
        },
        {
            title: '合作品牌数',
            dataIndex: 'brandCount',
            key: 'brandCount',
            render: (count: number) => (
                <Tag color={count > 0 ? 'blue' : 'default'}>{count || 0} 个品牌</Tag>
            ),
        },
        {
            title: '入库时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: GlobalInfluencer) => (
                <Tooltip title="添加到我的达人库">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        loading={addingId === record.id}
                        onClick={() => confirmAdd(record)}
                    >
                        拉入我的库
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <div
            style={{
                padding: 24,
                margin: -24,
                minHeight: 'calc(100vh - 64px)',
                background: `linear-gradient(135deg, ${PRIMARY_BG} 0%, #f5f7fa 100%)`,
            }}
        >
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* 页面标题 */}
                <Card
                    style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        marginBottom: 24,
                    }}
                    bodyStyle={{ padding: 24 }}
                >
                    <Title level={4} style={{ margin: 0 }}>🏪 达人广场</Title>
                    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                        浏览全局达人池，选择适合的达人添加到您的达人库进行合作
                    </Paragraph>
                </Card>

                {/* 搜索和列表 */}
                <Card
                    style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                    }}
                    bodyStyle={{ padding: 24 }}
                >
                    {/* 搜索栏 */}
                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder="搜索达人昵称、手机号、微信号"
                            allowClear
                            enterButton={<><SearchOutlined /> 搜索</>}
                            style={{ width: 400 }}
                            onSearch={handleSearch}
                        />
                    </Space>

                    {/* 达人列表 */}
                    <Table
                        loading={loading}
                        dataSource={influencers}
                        columns={columns}
                        pagination={{
                            current: currentPage,
                            total: total,
                            pageSize: 10,
                            onChange: (page) => loadInfluencers(page),
                            showTotal: (t) => `共 ${t} 位达人`,
                        }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default InfluencerSquarePage;
