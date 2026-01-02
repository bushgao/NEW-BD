# Design Document: UI 视觉风格升级

## Overview

本设计文档描述了达人合作执行与成本管理系统的 UI 视觉风格升级方案。我们将参考 Sugar CRM 的现代化设计风格，创建一套统一、优雅、易用的界面设计系统。

## Architecture

### 设计系统架构

```
Design System
├── Design Tokens (设计令牌)
│   ├── Colors (颜色)
│   ├── Typography (字体)
│   ├── Spacing (间距)
│   ├── Shadows (阴影)
│   └── Border Radius (圆角)
├── Base Components (基础组件)
│   ├── Button
│   ├── Card
│   ├── Avatar
│   ├── Input
│   └── Badge
├── Composite Components (复合组件)
│   ├── UserAvatarGroup
│   ├── StatusCard
│   ├── DataCard
│   └── FlowChart
└── Page Layouts (页面布局)
    ├── Dashboard
    ├── Pipeline
    ├── List View
    └── Detail View
```

## Design Tokens

### 颜色系统

```typescript
// 主色调
const colors = {
  // 品牌色
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // 主色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // 头像装饰色
  avatar: {
    blue: '#60a5fa',
    red: '#f87171',
    yellow: '#fbbf24',
    green: '#34d399',
    purple: '#a78bfa',
    pink: '#f472b6',
  },
  
  // 背景色
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
};
```

### 字体系统

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'SF Pro', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### 间距系统

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};
```

### 阴影系统

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};
```

### 圆角系统

```typescript
const borderRadius = {
  none: '0',
  sm: '0.5rem',   // 8px
  base: '0.75rem', // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  full: '9999px', // 完全圆形
};
```

## Components and Interfaces

### 1. Card Component (卡片组件)

```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

// 样式规范
const cardStyles = {
  default: {
    background: colors.background.primary,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.base,
    padding: spacing[6],
    transition: 'all 0.2s ease',
  },
  hover: {
    boxShadow: shadows.md,
    transform: 'translateY(-2px)',
  },
};
```

### 2. Avatar Component (头像组件)

```typescript
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy' | 'away';
  ringColor?: keyof typeof colors.avatar;
}

// 样式规范
const avatarStyles = {
  sizes: {
    sm: { width: '32px', height: '32px', ring: '2px' },
    md: { width: '40px', height: '40px', ring: '3px' },
    lg: { width: '48px', height: '48px', ring: '3px' },
  },
  ring: {
    width: '3px',
    offset: '2px',
    colors: colors.avatar,
  },
};
```

### 3. Button Component (按钮组件)

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// 样式规范
const buttonStyles = {
  primary: {
    background: colors.neutral[900],
    color: colors.background.primary,
    borderRadius: borderRadius.base,
    padding: `${spacing[2]} ${spacing[4]}`,
    fontWeight: typography.fontWeight.medium,
  },
  secondary: {
    background: colors.background.primary,
    color: colors.neutral[900],
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: borderRadius.base,
  },
  icon: {
    background: colors.background.primary,
    borderRadius: borderRadius.full,
    padding: spacing[2],
    boxShadow: shadows.sm,
  },
};
```

### 4. Input Component (输入框组件)

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

// 样式规范
const inputStyles = {
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  input: {
    background: colors.neutral[50],
    border: 'none',
    borderRadius: borderRadius.base,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    transition: 'all 0.2s ease',
  },
  focus: {
    outline: `2px solid ${colors.primary[500]}`,
    outlineOffset: '2px',
  },
  error: {
    outline: `2px solid ${colors.error}`,
  },
};
```

### 5. Badge Component (标签组件)

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

// 样式规范
const badgeStyles = {
  default: {
    background: colors.neutral[100],
    color: colors.neutral[700],
    borderRadius: borderRadius.base,
    padding: `${spacing[1]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  variants: {
    success: { background: '#d1fae5', color: '#065f46' },
    warning: { background: '#fef3c7', color: '#92400e' },
    error: { background: '#fee2e2', color: '#991b1b' },
    info: { background: '#dbeafe', color: '#1e40af' },
  },
};
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  shadows: typeof shadows;
  borderRadius: typeof borderRadius;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}
```

## Page Layouts

### 1. Dashboard Layout (仪表盘布局)

```typescript
// 布局结构
<DashboardLayout>
  <Header>
    <Logo />
    <Navigation />
    <UserMenu />
  </Header>
  
  <Main>
    <PageTitle>工厂老板看板</PageTitle>
    
    <StatsGrid>
      <StatCard icon={<Icon />} title="合作总数" value={120} />
      <StatCard icon={<Icon />} title="样品成本" value="¥45,000" />
      <StatCard icon={<Icon />} title="ROI" value="3.2x" />
    </StatsGrid>
    
    <ChartsGrid>
      <Card>
        <ChartTitle>管道分布</ChartTitle>
        <PieChart data={pipelineData} />
      </Card>
      
      <Card>
        <ChartTitle>月度趋势</ChartTitle>
        <LineChart data={trendData} />
      </Card>
    </ChartsGrid>
  </Main>
</DashboardLayout>
```

### 2. Pipeline Layout (管道布局)

```typescript
// 管道视图布局
<PipelineLayout>
  <Header>
    <PageTitle>合作管道</PageTitle>
    <Actions>
      <Button variant="primary">新建合作</Button>
      <Button variant="icon"><FilterIcon /></Button>
    </Actions>
  </Header>
  
  <PipelineBoard>
    <PipelineColumn status="initial">
      <ColumnHeader>
        <Title>初步接触</Title>
        <Count>12</Count>
      </ColumnHeader>
      
      <CardList>
        <CollaborationCard>
          <AvatarGroup users={[...]} />
          <CardTitle>达人名称</CardTitle>
          <CardMeta>
            <Badge>小红书</Badge>
            <Date>2天前</Date>
          </CardMeta>
        </CollaborationCard>
      </CardList>
    </PipelineColumn>
    
    {/* 其他列... */}
  </PipelineBoard>
</PipelineLayout>
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 设计令牌一致性
*For any* UI 组件，使用的颜色、间距、圆角等设计令牌应该来自统一的设计系统，而不是硬编码的值
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: 响应式布局正确性
*For any* 屏幕尺寸，界面应该正确适配并保持可用性，不出现内容溢出或重叠
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 3: 交互反馈一致性
*For any* 可交互元素（按钮、链接、输入框），应该有统一的悬停、聚焦、激活状态反馈
**Validates: Requirements 4.3, 5.2**

### Property 4: 无障碍性
*For any* UI 组件，应该满足 WCAG 2.1 AA 级别的无障碍标准，包括颜色对比度、键盘导航等
**Validates: Requirements 9.5**

### Property 5: 主题切换完整性
*For any* 主题模式（明亮/暗黑），所有 UI 组件应该正确应用对应的颜色方案
**Validates: Requirements 10.2, 10.3**

## Error Handling

### 设计系统错误处理

1. **缺失设计令牌**: 如果组件引用了不存在的设计令牌，应该回退到默认值并在开发环境中警告
2. **无效属性值**: 如果传入了无效的属性值（如不存在的 variant），应该使用默认值
3. **主题加载失败**: 如果主题配置加载失败，应该使用默认浅色主题
4. **响应式断点错误**: 如果检测到不支持的屏幕尺寸，应该使用最接近的断点配置

## Testing Strategy

### 视觉回归测试

使用 Chromatic 或 Percy 进行视觉回归测试：
- 每个组件的不同状态截图
- 不同主题模式下的截图
- 不同屏幕尺寸下的截图

### 单元测试

- 测试组件的不同 props 组合
- 测试交互行为（点击、悬停、聚焦）
- 测试无障碍属性（ARIA 标签、键盘导航）

### 集成测试

- 测试页面级别的布局和交互
- 测试主题切换功能
- 测试响应式行为

### 性能测试

- 测试组件渲染性能
- 测试动画性能（60fps）
- 测试大数据量下的性能

## Implementation Notes

### 技术栈

- **样式方案**: Tailwind CSS + CSS-in-JS (styled-components)
- **组件库基础**: Ant Design (逐步替换为自定义组件)
- **动画库**: Framer Motion
- **图标库**: Lucide React
- **主题管理**: Context API + localStorage

### 迁移策略

1. **Phase 1**: 建立设计系统基础（Design Tokens + Base Components）
2. **Phase 2**: 逐页面迁移（Dashboard → Pipeline → List Views）
3. **Phase 3**: 细节优化和动画增强
4. **Phase 4**: 暗色模式支持（可选）

### 性能优化

- 使用 CSS 变量实现主题切换，避免重新渲染
- 懒加载非关键组件
- 使用 React.memo 优化组件渲染
- 使用 CSS transform 实现动画，避免重排重绘
