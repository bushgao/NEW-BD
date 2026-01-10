/**
 * UI 组件展示页面
 * 用于展示新的设计系统和组件
 */

import { Row, Col, Space, Typography, Divider } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  SearchOutlined,
  PlusOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Card, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { AvatarGroup } from '../../components/ui/AvatarGroup';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text, Paragraph } = Typography;

const UIShowcase = () => {
  const { theme, mode, setThemeMode } = useTheme();

  // Helper properties for easier usage
  const isDark = mode === 'dark';
  const toggleTheme = () => setThemeMode(isDark ? 'light' : 'dark');

  return (
    <div
      style={{
        padding: '40px',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        margin: '-24px',
      }}
    >
      {/* 添加背景装饰元素以增强毛玻璃效果 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.15), rgba(191, 90, 242, 0.15))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 217, 61, 0.15))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '30%',
        width: '350px',
        height: '350px',
        background: 'linear-gradient(135deg, rgba(107, 207, 127, 0.12), rgba(95, 201, 201, 0.12))',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* 内容区域 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2}>UI 设计系统展示</Title>
          <Paragraph>
            参考 Sugar CRM 的现代化设计风格，采用浅色背景、大圆角、柔和阴影、毛玻璃效果
          </Paragraph>
          <Button onClick={toggleTheme}>
            切换到{isDark ? '亮色' : '暗色'}模式
          </Button>
        </div>

        {/* Card 组件展示 */}
        <Title level={3}>Card 卡片组件（毛玻璃效果）</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 48 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card variant="default">
              <CardTitle>默认卡片</CardTitle>
              <CardContent>
                <Text>这是一个默认样式的卡片，使用毛玻璃效果和大圆角。</Text>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card variant="elevated">
              <CardTitle>悬浮卡片</CardTitle>
              <CardContent>
                <Text>这是一个悬浮样式的卡片，阴影更明显，毛玻璃效果更强。</Text>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card variant="outlined">
              <CardTitle>边框卡片</CardTitle>
              <CardContent>
                <Text>这是一个带边框的卡片，半透明毛玻璃效果。</Text>
              </CardContent>
            </Card>
          </Col>
        </Row>

        {/* 统计卡片示例 */}
        <Title level={3}>统计卡片示例（毛玻璃 + 悬停效果）</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 48 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ color: theme.colors.neutral[600], fontSize: 14 }}>总销售额</Text>
                  <Title level={2} style={{ margin: 0, color: theme.colors.primary[600] }}>
                    ¥128,456
                  </Title>
                  <Badge variant="success" size="sm">+12.5%</Badge>
                </Space>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ color: theme.colors.neutral[600], fontSize: 14 }}>新增用户</Text>
                  <Title level={2} style={{ margin: 0, color: theme.colors.primary[600] }}>
                    1,234
                  </Title>
                  <Badge variant="warning" size="sm">-3.2%</Badge>
                </Space>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ color: theme.colors.neutral[600], fontSize: 14 }}>活跃合作</Text>
                  <Title level={2} style={{ margin: 0, color: theme.colors.primary[600] }}>
                    89
                  </Title>
                  <Badge variant="info" size="sm">持平</Badge>
                </Space>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ color: theme.colors.neutral[600], fontSize: 14 }}>平均 ROI</Text>
                  <Title level={2} style={{ margin: 0, color: theme.colors.success }}>
                    2.8x
                  </Title>
                  <Badge variant="success" size="sm">+18.3%</Badge>
                </Space>
              </CardContent>
            </Card>
          </Col>
        </Row>

        {/* Avatar 组件展示 */}
        <Title level={3}>Avatar 头像组件</Title>
        <Card style={{ marginBottom: 48 }}>
          <CardContent>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同尺寸</Text>
                <Space size={16}>
                  <Avatar name="张三" size="xs" />
                  <Avatar name="李四" size="sm" />
                  <Avatar name="王五" size="md" />
                  <Avatar name="赵六" size="lg" />
                  <Avatar name="钱七" size="xl" />
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>带彩色圆圈装饰（渐变效果）</Text>
                <Space size={16}>
                  <Avatar name="张三" ringColor="#5ac8fa" size="lg" />
                  <Avatar name="李四" ringColor="#ff6b6b" size="lg" />
                  <Avatar name="王五" ringColor="#ffd93d" size="lg" />
                  <Avatar name="赵六" ringColor="#6bcf7f" size="lg" />
                  <Avatar name="钱七" ringColor="#bf5af2" size="lg" />
                  <Avatar name="孙八" ringColor="#ff2d92" size="lg" />
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>带状态指示</Text>
                <Space size={16}>
                  <Avatar name="在线" status="online" showStatus />
                  <Avatar name="离线" status="offline" showStatus />
                  <Avatar name="忙碌" status="busy" showStatus />
                  <Avatar name="离开" status="away" showStatus />
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>头像组（重叠布局）</Text>
                <AvatarGroup
                  avatars={[
                    { name: '张三', ringColor: theme.colors.avatar.blue },
                    { name: '李四', ringColor: theme.colors.avatar.red },
                    { name: '王五', ringColor: theme.colors.avatar.yellow },
                    { name: '赵六', ringColor: theme.colors.avatar.green },
                    { name: '钱七', ringColor: theme.colors.avatar.purple },
                    { name: '孙八', ringColor: theme.colors.avatar.pink },
                    { name: '周九', ringColor: theme.colors.avatar.blue },
                  ]}
                  max={5}
                />
              </div>
            </Space>
          </CardContent>
        </Card>

        {/* Button 组件展示 */}
        <Title level={3}>Button 按钮组件</Title>
        <Card style={{ marginBottom: 48 }}>
          <CardContent>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同变体</Text>
                <Space wrap>
                  <Button variant="primary">主要按钮</Button>
                  <Button variant="secondary">次要按钮</Button>
                  <Button variant="outline">边框按钮</Button>
                  <Button variant="ghost">幽灵按钮</Button>
                  <Button variant="danger">危险按钮</Button>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同尺寸</Text>
                <Space wrap align="center">
                  <Button size="sm">小按钮</Button>
                  <Button size="md">中按钮</Button>
                  <Button size="lg">大按钮</Button>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>带图标</Text>
                <Space wrap>
                  <Button icon={<PlusOutlined />}>新建</Button>
                  <Button variant="secondary" icon={<DownloadOutlined />}>下载</Button>
                  <Button variant="outline" icon={<SearchOutlined />} iconPosition="right">
                    搜索
                  </Button>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>状态</Text>
                <Space wrap>
                  <Button loading>加载中</Button>
                  <Button disabled>禁用状态</Button>
                </Space>
              </div>
            </Space>
          </CardContent>
        </Card>

        {/* Input 组件展示 */}
        <Title level={3}>Input 输入框组件</Title>
        <Card style={{ marginBottom: 48 }}>
          <CardContent>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>基础输入框</Text>
                <Input placeholder="请输入内容" fullWidth />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>带前缀图标</Text>
                <Input
                  placeholder="请输入邮箱"
                  prefix={<MailOutlined />}
                  fullWidth
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>带后缀图标</Text>
                <Input
                  placeholder="搜索..."
                  suffix={<SearchOutlined />}
                  fullWidth
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>错误状态</Text>
                <Input
                  placeholder="请输入用户名"
                  prefix={<UserOutlined />}
                  error
                  errorMessage="用户名不能为空"
                  fullWidth
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同尺寸</Text>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input placeholder="小尺寸" size="sm" fullWidth />
                  <Input placeholder="中尺寸" size="md" fullWidth />
                  <Input placeholder="大尺寸" size="lg" fullWidth />
                </Space>
              </div>
            </Space>
          </CardContent>
        </Card>

        {/* Badge 组件展示 */}
        <Title level={3}>Badge 徽章组件</Title>
        <Card style={{ marginBottom: 48 }}>
          <CardContent>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同颜色变体</Text>
                <Space wrap>
                  <Badge variant="primary">主要</Badge>
                  <Badge variant="success">成功</Badge>
                  <Badge variant="warning">警告</Badge>
                  <Badge variant="error">错误</Badge>
                  <Badge variant="info">信息</Badge>
                  <Badge variant="neutral">中性</Badge>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>不同尺寸</Text>
                <Space wrap align="center">
                  <Badge size="sm">小徽章</Badge>
                  <Badge size="md">中徽章</Badge>
                  <Badge size="lg">大徽章</Badge>
                </Space>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>圆点徽章</Text>
                <Space wrap align="center">
                  <Space>
                    <Badge variant="success" dot />
                    <Text>在线</Text>
                  </Space>
                  <Space>
                    <Badge variant="error" dot />
                    <Text>离线</Text>
                  </Space>
                  <Space>
                    <Badge variant="warning" dot />
                    <Text>忙碌</Text>
                  </Space>
                </Space>
              </div>
            </Space>
          </CardContent>
        </Card>

        {/* 综合示例 - 用户卡片 */}
        <Title level={3}>综合示例 - 团队成员卡片（毛玻璃 + 黑色按钮）</Title>
        <Row gutter={[16, 16]}>
          {[
            { name: '张三', role: '商务经理', status: 'online', deals: 23, gmv: '¥128,456', color: '#5ac8fa' },
            { name: '李四', role: '商务专员', status: 'busy', deals: 18, gmv: '¥95,230', color: '#ff6b6b' },
            { name: '王五', role: '商务专员', status: 'away', deals: 15, gmv: '¥78,900', color: '#ffd93d' },
          ].map((member, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Space>
                      <Avatar
                        name={member.name}
                        size="lg"
                        ringColor={member.color}
                        status={member.status as any}
                        showStatus
                      />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{member.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 14 }}>{member.role}</Text>
                      </div>
                    </Space>

                    <Divider style={{ margin: 0 }} />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>成交数量</Text>
                        <br />
                        <Text strong style={{ fontSize: 18 }}>{member.deals}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>总GMV</Text>
                        <br />
                        <Text strong style={{ fontSize: 18, color: theme.colors.success }}>
                          {member.gmv}
                        </Text>
                      </Col>
                    </Row>
                  </Space>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" size="sm" fullWidth>
                    查看详情
                  </Button>
                </CardFooter>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default UIShowcase;
