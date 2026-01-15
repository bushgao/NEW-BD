import { Typography, List, Button } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { useAuthStore } from '../../../stores/authStore';

const { Title } = Typography;

const PlatformAdminView = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="deep-space-wrapper" style={{ padding: '40px', margin: '-24px', position: 'relative' }}>
            {/* Contextual Glow */}
            <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-[80px] pointer-events-none z-0" />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Title level={4} className="!text-white mb-6">欢迎回来, {user?.name}</Title>
                <Card variant="deep" style={{ marginTop: 24 }}>
                    <CardContent>
                        <Title level={5} className="!text-indigo-200">平台管理</Title>
                        <p className="text-slate-300">作为平台管理员，您可以使用以下功能:</p>
                        <List
                            dataSource={[
                                {
                                    icon: <TeamOutlined className="text-indigo-400" />,
                                    title: '工厂管理',
                                    description: '审核和管理工厂账号',
                                    path: '/app/admin',
                                },
                                {
                                    icon: <UserOutlined className="text-emerald-400" />,
                                    title: '套餐配置',
                                    description: '配置不同套餐的功能和配额',
                                    path: '/app/admin',
                                },
                            ]}
                            renderItem={(item) => (
                                <List.Item
                                    className="!border-white/10"
                                    actions={[
                                        <Button type="link" onClick={() => navigate(item.path)} className="!text-indigo-300 hover:!text-indigo-200">
                                            前往
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={item.icon}
                                        title={<span className="text-slate-200">{item.title}</span>}
                                        description={<span className="text-slate-400">{item.description}</span>}
                                    />
                                </List.Item>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlatformAdminView;
