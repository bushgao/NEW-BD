# 业务端优化 - 设计文档

**创建时间**: 2026年1月6日  
**状态**: 设计中  
**版本**: 1.0

---

## 📋 设计概述

本设计文档详细描述了业务端优化项目的技术架构、组件设计、数据模型和实现方案。项目分为工厂老板端优化和商务人员端优化两大部分，重点实现商务权限管理功能。

---

## 🏗️ 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 工厂老板端   │  │ 商务人员端   │  │ 共享组件库   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    API 网关层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 权限中间件   │  │ 认证中间件   │  │ 日志中间件   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 报表服务     │  │ 权限服务     │  │ 通知服务     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    数据访问层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Prisma ORM   │  │ 缓存层       │  │ 文件存储     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

**前端**:
- React 18
- TypeScript
- Ant Design 5
- Recharts (图表库)
- Zustand (状态管理)
- React Query (数据获取)

**后端**:
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT 认证

---

## 🎨 组件设计

### 第一部分：工厂老板端组件

#### 1.1 数据可视化组件

**TrendChart 组件**
```typescript
interface TrendChartProps {
  period: 'week' | 'month' | 'quarter';
  dataType: 'gmv' | 'cost' | 'roi';
  onPeriodChange: (period: string) => void;
}
```

**ROIAnalysisChart 组件**
```typescript
interface ROIAnalysisChartProps {
  staffData: StaffROIData[];
  chartType: 'bar' | 'pie' | 'scatter';
}
```

**PipelineFunnelChart 组件**
```typescript
interface PipelineFunnelChartProps {
  stages: PipelineStageData[];
  showConversionRate: boolean;
  showDuration: boolean;
}
```


#### 1.2 商务绩效分析组件

**StaffComparisonChart 组件**
```typescript
interface StaffComparisonChartProps {
  staffIds: string[];
  metrics: ('leads' | 'deals' | 'gmv' | 'roi' | 'efficiency')[];
  onStaffSelect: (staffIds: string[]) => void;
}
```

**StaffQualityScore 组件**
```typescript
interface StaffQualityScoreProps {
  staffId: string;
  showTrend: boolean;
  showSuggestions: boolean;
}

interface QualityScore {
  overall: number;
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
  trend: ScoreTrend[];
  suggestions: string[];
}
```

**StaffWorkCalendar 组件**
```typescript
interface StaffWorkCalendarProps {
  staffId: string;
  month: Date;
  onDateClick: (date: Date) => void;
}

interface CalendarEvent {
  date: Date;
  type: 'deadline' | 'scheduled' | 'followup';
  title: string;
  collaborationId?: string;
}
```

#### 1.3 快捷操作组件

**QuickActionsPanel 组件**
```typescript
interface QuickActionsPanelProps {
  actions: QuickAction[];
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
}
```

**SmartNotifications 组件**
```typescript
interface SmartNotificationsProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
}

interface Notification {
  id: string;
  type: 'daily_summary' | 'alert' | 'reminder';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRead: boolean;
}
```

**CustomizableDashboard 组件**
```typescript
interface CustomizableDashboardProps {
  layout: DashboardLayout;
  widgets: Widget[];
  onLayoutChange: (layout: DashboardLayout) => void;
}

interface DashboardLayout {
  cards: CardLayout[];
}

interface CardLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}
```


#### 1.4 ⭐ 商务权限管理组件

**StaffPermissionsModal 组件**
```typescript
interface StaffPermissionsModalProps {
  visible: boolean;
  staffId: string;
  currentPermissions: StaffPermissions;
  onSave: (permissions: StaffPermissions) => Promise<void>;
  onCancel: () => void;
}

interface StaffPermissions {
  dataVisibility: {
    viewOthersInfluencers: boolean;
    viewOthersCollaborations: boolean;
    viewOthersPerformance: boolean;
    viewTeamData: boolean;
    viewRanking: boolean;
  };
  operations: {
    manageInfluencers: boolean;
    manageSamples: boolean;
    manageCollaborations: boolean;
    deleteCollaborations: boolean;
    exportData: boolean;
    batchOperations: boolean;
  };
  advanced: {
    viewCostData: boolean;
    viewROIData: boolean;
    modifyOthersData: boolean;
  };
}
```

**PermissionTemplateSelector 组件**
```typescript
interface PermissionTemplateSelectorProps {
  templates: PermissionTemplate[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
}

interface PermissionTemplate {
  id: 'basic' | 'advanced' | 'supervisor' | 'custom';
  name: string;
  description: string;
  permissions: StaffPermissions;
}
```

**usePermissions Hook**
```typescript
interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean;
  permissions: StaffPermissions | null;
  isLoading: boolean;
}

function usePermissions(): UsePermissionsReturn {
  const { user } = useAuthStore();
  
  // 工厂老板拥有所有权限
  if (user?.role === 'FACTORY_OWNER') {
    return {
      hasPermission: () => true,
      permissions: null,
      isLoading: false,
    };
  }
  
  // 商务人员权限检查
  const permissions = user?.permissions as StaffPermissions;
  
  const hasPermission = (permission: string): boolean => {
    const [category, key] = permission.split('.');
    return permissions?.[category]?.[key] ?? false;
  };
  
  return {
    hasPermission,
    permissions,
    isLoading: false,
  };
}
```


### 第二部分：商务人员端组件

#### 2.1 达人管理优化组件

**QuickFilters 组件**
```typescript
interface QuickFiltersProps {
  savedFilters: SavedFilter[];
  onApplyFilter: (filter: FilterConfig) => void;
  onSaveFilter: (name: string, filter: FilterConfig) => void;
  onDeleteFilter: (filterId: string) => void;
}

interface SavedFilter {
  id: string;
  name: string;
  filter: FilterConfig;
  createdAt: Date;
}
```

**InfluencerDetailPanel 组件**
```typescript
interface InfluencerDetailPanelProps {
  influencerId: string;
  showHistory: boolean;
  showROI: boolean;
  showBestSamples: boolean;
  showContactHistory: boolean;
}

interface InfluencerDetail {
  basic: InfluencerBasicInfo;
  collaborationHistory: Collaboration[];
  roiStats: ROIStats;
  bestSamples: Sample[];
  contactHistory: ContactRecord[];
}
```

**InfluencerGroups 组件**
```typescript
interface InfluencerGroupsProps {
  groups: InfluencerGroup[];
  influencers: Influencer[];
  onGroupChange: (influencerId: string, groupId: string) => void;
  onCreateGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

interface InfluencerGroup {
  id: string;
  name: string;
  color: string;
  influencerCount: number;
  stats: GroupStats;
}
```

#### 2.2 跟进流程优化组件

**QuickFollowUp 组件**
```typescript
interface QuickFollowUpProps {
  collaborationId: string;
  templates: FollowUpTemplate[];
  voiceInput: boolean;
  onSubmit: (content: string, images?: File[]) => Promise<void>;
}

interface FollowUpTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}
```

**FollowUpReminder 组件**
```typescript
interface FollowUpReminderProps {
  collaborations: Collaboration[];
  onRemind: (collaborationId: string) => void;
  onSnooze: (collaborationId: string, duration: number) => void;
}

interface FollowUpSuggestion {
  collaborationId: string;
  influencerName: string;
  lastFollowUpDate: Date;
  suggestedNextDate: Date;
  frequency: 'daily' | 'weekly' | 'biweekly';
  priority: 'low' | 'medium' | 'high';
}
```

**FollowUpAnalytics 组件**
```typescript
interface FollowUpAnalyticsProps {
  staffId: string;
  period: 'week' | 'month' | 'quarter';
}

interface FollowUpAnalytics {
  effectivenessScore: number;
  bestTime: string;
  bestFrequency: string;
  conversionByTime: TimeConversionData[];
  conversionByFrequency: FrequencyConversionData[];
}
```


#### 2.3 数据录入优化组件

**SmartForm 组件**
```typescript
interface SmartFormProps {
  type: 'collaboration' | 'dispatch' | 'result';
  initialData?: any;
  autoFill: boolean;
  suggestions: boolean;
  onSubmit: (data: any) => Promise<void>;
}

interface SmartFormState {
  data: any;
  suggestions: Suggestion[];
  validationErrors: ValidationError[];
  isDirty: boolean;
}
```

**BatchOperations 组件**
```typescript
interface BatchOperationsProps {
  selectedIds: string[];
  operations: BatchOperation[];
  onExecute: (operation: string, data: any) => Promise<void>;
}

interface BatchOperation {
  id: string;
  name: string;
  icon: React.ReactNode;
  requiresInput: boolean;
  inputSchema?: any;
}
```

#### 2.4 工作台优化组件

**TodayTodoList 组件**
```typescript
interface TodayTodoListProps {
  todos: TodoItem[];
  onComplete: (todoId: string) => void;
  onSnooze: (todoId: string, until: Date) => void;
}

interface TodoItem {
  id: string;
  type: 'followup' | 'deadline' | 'dispatch' | 'result';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueTime?: Date;
  relatedId: string;
}
```

**WorkStats 组件**
```typescript
interface WorkStatsProps {
  period: 'today' | 'week' | 'month';
  showTrend: boolean;
}

interface WorkStats {
  leadsAdded: number;
  collaborationsCreated: number;
  samplesDispatched: number;
  followUpsCompleted: number;
  dealsCompleted: number;
  gmv: number;
  goalProgress: number;
  rankChange: number;
}
```

---

## 💾 数据模型设计

### 数据库 Schema 更新

#### User 模型更新
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         UserRole
  factoryId    String?
  
  // 新增：权限配置
  permissions  Json?    @default("{}")
  
  // 新增：个人偏好设置
  preferences  Json?    @default("{}")
  
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  disabledAt   DateTime?
  disabledBy   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  factory         Factory?          @relation("FactoryStaff", fields: [factoryId], references: [id])
  ownedFactory    Factory?          @relation("FactoryOwner")
  collaborations  Collaboration[]
  sampleDispatches SampleDispatch[]
  followUpRecords FollowUpRecord[]
  notifications   Notification[]
  createdInfluencers  Influencer[]  @relation("InfluencerCreator")
  verifiedInfluencers Influencer[]  @relation("InfluencerVerifier")

  @@index([email])
  @@index([factoryId])
}
```

#### 权限配置结构
```typescript
interface UserPermissions {
  dataVisibility: {
    viewOthersInfluencers: boolean;
    viewOthersCollaborations: boolean;
    viewOthersPerformance: boolean;
    viewTeamData: boolean;
    viewRanking: boolean;
  };
  operations: {
    manageInfluencers: boolean;
    manageSamples: boolean;
    manageCollaborations: boolean;
    deleteCollaborations: boolean;
    exportData: boolean;
    batchOperations: boolean;
  };
  advanced: {
    viewCostData: boolean;
    viewROIData: boolean;
    modifyOthersData: boolean;
  };
}
```

#### 用户偏好设置结构
```typescript
interface UserPreferences {
  dashboard: {
    layout: DashboardLayout;
    defaultPeriod: 'week' | 'month' | 'quarter';
  };
  filters: {
    saved: SavedFilter[];
  };
  notifications: {
    email: boolean;
    push: boolean;
    dailySummary: boolean;
  };
}
```


---

## 🔌 API 设计

### 工厂老板端 API

#### 数据可视化 API
```typescript
// 获取趋势数据
GET /api/reports/dashboard/trends
Query: {
  period: 'week' | 'month' | 'quarter'
  dataType: 'gmv' | 'cost' | 'roi'
}
Response: {
  success: boolean;
  data: {
    current: TrendData[];
    previous: TrendData[];
    comparison: {
      change: number;
      percentage: number;
    };
  };
}

// 获取 ROI 分析数据
GET /api/reports/dashboard/roi-analysis
Response: {
  success: boolean;
  data: {
    byStaff: StaffROIData[];
    costBreakdown: CostBreakdown;
    costVsRevenue: ScatterData[];
  };
}

// 获取管道漏斗数据
GET /api/reports/dashboard/pipeline-funnel
Response: {
  success: boolean;
  data: {
    stages: PipelineStageData[];
    conversionRates: number[];
    avgDuration: number[];
  };
}
```

#### 商务绩效分析 API
```typescript
// 获取商务对比数据
GET /api/reports/staff/comparison
Query: {
  staffIds: string[];
  metrics: string[];
}
Response: {
  success: boolean;
  data: {
    comparison: StaffComparisonData[];
    insights: string[];
  };
}

// 获取商务质量评分
GET /api/reports/staff/:staffId/quality-score
Response: {
  success: boolean;
  data: {
    overall: number;
    breakdown: ScoreBreakdown;
    trend: ScoreTrend[];
    suggestions: string[];
  };
}

// 获取商务工作日历
GET /api/reports/staff/:staffId/calendar
Query: {
  month: string; // YYYY-MM
}
Response: {
  success: boolean;
  data: {
    events: CalendarEvent[];
    workload: WorkloadData[];
  };
}
```

#### 快捷操作 API
```typescript
// 获取每日摘要
GET /api/reports/dashboard/daily-summary
Response: {
  success: boolean;
  data: {
    overdueCollaborations: number;
    pendingSamples: number;
    pendingResults: number;
    alerts: Alert[];
    highlights: string[];
  };
}

// 获取预警信息
GET /api/reports/dashboard/alerts
Response: {
  success: boolean;
  data: {
    alerts: Alert[];
  };
}

// 保存看板布局
POST /api/users/dashboard-layout
Body: {
  layout: DashboardLayout;
}
Response: {
  success: boolean;
}
```


#### ⭐ 权限管理 API
```typescript
// 获取商务权限
GET /api/staff/:staffId/permissions
Response: {
  success: boolean;
  data: {
    permissions: StaffPermissions;
    template: 'basic' | 'advanced' | 'supervisor' | 'custom';
  };
}

// 更新商务权限
PUT /api/staff/:staffId/permissions
Body: {
  permissions: StaffPermissions;
}
Response: {
  success: boolean;
  data: {
    user: User;
  };
}

// 获取权限模板
GET /api/staff/permission-templates
Response: {
  success: boolean;
  data: {
    templates: PermissionTemplate[];
  };
}
```

### 商务人员端 API

#### 达人管理优化 API
```typescript
// 获取达人合作历史
GET /api/influencers/:id/collaboration-history
Response: {
  success: boolean;
  data: {
    collaborations: Collaboration[];
    stats: CollaborationStats;
  };
}

// 获取达人 ROI 统计
GET /api/influencers/:id/roi-stats
Response: {
  success: boolean;
  data: {
    avgROI: number;
    totalGMV: number;
    totalCost: number;
    bestSample: Sample;
  };
}

// 创建/更新达人分组
POST /api/influencers/groups
Body: {
  name: string;
  color: string;
  influencerIds: string[];
}
Response: {
  success: boolean;
  data: {
    group: InfluencerGroup;
  };
}
```

#### 跟进流程优化 API
```typescript
// 获取跟进模板
GET /api/collaborations/follow-up-templates
Response: {
  success: boolean;
  data: {
    templates: FollowUpTemplate[];
  };
}

// 快速跟进
POST /api/collaborations/:id/follow-up/quick
Body: {
  content: string;
  images?: string[];
  voiceNote?: string;
}
Response: {
  success: boolean;
  data: {
    followUp: FollowUpRecord;
  };
}

// 获取跟进分析
GET /api/collaborations/follow-up-analytics
Query: {
  staffId: string;
  period: 'week' | 'month' | 'quarter';
}
Response: {
  success: boolean;
  data: {
    analytics: FollowUpAnalytics;
  };
}
```

#### 数据录入优化 API
```typescript
// 获取智能建议
GET /api/collaborations/suggestions
Query: {
  influencerId: string;
  type: 'sample' | 'price' | 'schedule';
}
Response: {
  success: boolean;
  data: {
    suggestions: Suggestion[];
  };
}

// 批量更新
POST /api/collaborations/batch-update
Body: {
  ids: string[];
  operation: 'dispatch' | 'updateStage' | 'setDeadline';
  data: any;
}
Response: {
  success: boolean;
  data: {
    updated: number;
    failed: number;
    errors: Error[];
  };
}

// 数据验证
POST /api/collaborations/validate
Body: {
  data: any;
}
Response: {
  success: boolean;
  data: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
}
```

#### 工作台优化 API
```typescript
// 获取今日待办
GET /api/reports/my-dashboard/today-todos
Response: {
  success: boolean;
  data: {
    todos: TodoItem[];
    summary: {
      total: number;
      completed: number;
      overdue: number;
    };
  };
}

// 获取工作统计
GET /api/reports/my-dashboard/work-stats
Query: {
  period: 'today' | 'week' | 'month';
}
Response: {
  success: boolean;
  data: {
    stats: WorkStats;
    trend: TrendData[];
  };
}
```


---

## 🔐 权限验证设计

### 权限中间件

```typescript
// packages/backend/src/middleware/permission.middleware.ts

export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // 工厂老板拥有所有权限
    if (user.role === 'FACTORY_OWNER') {
      return next();
    }
    
    // 平台管理员拥有所有权限
    if (user.role === 'PLATFORM_ADMIN') {
      return next();
    }
    
    // 检查商务权限
    if (user.role === 'BUSINESS_STAFF') {
      const permissions = user.permissions as StaffPermissions;
      
      if (!hasPermission(permissions, permission)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '您没有权限执行此操作'
          }
        });
      }
    }
    
    next();
  };
};

function hasPermission(permissions: StaffPermissions, permission: string): boolean {
  const [category, key] = permission.split('.');
  
  if (!permissions || !permissions[category]) {
    return false;
  }
  
  return permissions[category][key] ?? false;
}
```

### 数据过滤中间件

```typescript
// packages/backend/src/middleware/data-filter.middleware.ts

export const filterByPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    // 工厂老板和平台管理员可以查看所有数据
    if (user.role === 'FACTORY_OWNER' || user.role === 'PLATFORM_ADMIN') {
      return next();
    }
    
    // 商务人员根据权限过滤数据
    if (user.role === 'BUSINESS_STAFF') {
      const permissions = user.permissions as StaffPermissions;
      
      // 如果没有查看其他商务数据的权限，只返回自己的数据
      if (permission === 'viewOthersInfluencers' && 
          !permissions.dataVisibility.viewOthersInfluencers) {
        req.query.createdBy = user.id;
      }
      
      if (permission === 'viewOthersCollaborations' && 
          !permissions.dataVisibility.viewOthersCollaborations) {
        req.query.businessStaffId = user.id;
      }
    }
    
    next();
  };
};
```

### 路由应用示例

```typescript
// packages/backend/src/routes/influencer.routes.ts

import { checkPermission, filterByPermission } from '../middleware/permission.middleware';

// 查看达人列表 - 根据权限过滤
router.get('/', 
  authenticateToken,
  filterByPermission('viewOthersInfluencers'),
  getInfluencers
);

// 创建达人 - 需要权限
router.post('/',
  authenticateToken,
  checkPermission('operations.manageInfluencers'),
  createInfluencer
);

// 删除达人 - 需要权限
router.delete('/:id',
  authenticateToken,
  checkPermission('operations.manageInfluencers'),
  deleteInfluencer
);

// 样品管理路由
router.post('/samples',
  authenticateToken,
  checkPermission('operations.manageSamples'),
  createSample
);

// 查看成本数据 - 需要高级权限
router.get('/costs',
  authenticateToken,
  checkPermission('advanced.viewCostData'),
  getCosts
);
```


---

## 📱 移动端适配设计

### 响应式断点

```typescript
const breakpoints = {
  xs: 0,      // 手机竖屏
  sm: 576,    // 手机横屏
  md: 768,    // 平板竖屏
  lg: 992,    // 平板横屏
  xl: 1200,   // 桌面
  xxl: 1600,  // 大屏
};
```

### 移动端布局策略

**工厂老板端 Dashboard**:
- 桌面端：3-4列卡片布局
- 平板端：2列卡片布局
- 手机端：1列卡片布局，可折叠详情

**商务人员端工作台**:
- 桌面端：左侧待办列表 + 右侧详情
- 平板端：上下布局
- 手机端：单页面切换，底部导航

### 移动端专属功能

```typescript
// 下拉刷新
const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };
  
  return { refreshing, handleRefresh };
};

// 手势操作
const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  // 实现滑动手势
};

// 触摸优化
const touchOptimization = {
  minTouchTarget: 44, // 最小触摸目标 44x44px
  spacing: 8,         // 触摸目标间距
};
```

---

## 🎨 UI/UX 设计规范

### 颜色系统

```typescript
const colors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // 数据可视化颜色
  chart: {
    blue: '#1890ff',
    green: '#52c41a',
    orange: '#faad14',
    red: '#ff4d4f',
    purple: '#722ed1',
    cyan: '#13c2c2',
  },
  
  // 权限相关颜色
  permission: {
    granted: '#52c41a',
    denied: '#ff4d4f',
    partial: '#faad14',
  },
};
```

### 图表样式规范

```typescript
const chartStyles = {
  // 折线图
  line: {
    strokeWidth: 2,
    dot: { r: 4 },
    activeDot: { r: 6 },
  },
  
  // 柱状图
  bar: {
    radius: [4, 4, 0, 0],
    barSize: 20,
  },
  
  // 饼图
  pie: {
    innerRadius: '60%',
    outerRadius: '80%',
    paddingAngle: 2,
  },
  
  // 漏斗图
  funnel: {
    labelLine: true,
    label: {
      position: 'right',
      formatter: '{b}: {c}',
    },
  },
};
```

### 动画规范

```typescript
const animations = {
  // 页面切换
  pageTransition: {
    duration: 300,
    easing: 'ease-in-out',
  },
  
  // 卡片展开/折叠
  cardExpand: {
    duration: 200,
    easing: 'ease-out',
  },
  
  // 图表动画
  chartAnimation: {
    duration: 1000,
    easing: 'ease-in-out',
  },
  
  // 权限变更提示
  permissionChange: {
    duration: 500,
    easing: 'ease-in-out',
  },
};
```

---

## 🚀 性能优化设计

### 前端性能优化

**代码分割**:
```typescript
// 路由级别代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));

// 组件级别代码分割
const TrendChart = lazy(() => import('./components/charts/TrendChart'));
const ROIAnalysisChart = lazy(() => import('./components/charts/ROIAnalysisChart'));
```

**数据缓存**:
```typescript
// 使用 React Query 缓存
const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: fetchDashboardTrends,
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  });
};
```

**虚拟滚动**:
```typescript
// 大列表使用虚拟滚动
import { FixedSizeList } from 'react-window';

const InfluencerList = ({ influencers }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={influencers.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <InfluencerCard influencer={influencers[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 后端性能优化

**数据库查询优化**:
```typescript
// 使用索引
@@index([factoryId, createdBy])
@@index([businessStaffId, stage])

// 分页查询
const getInfluencers = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize;
  
  const [data, total] = await Promise.all([
    prisma.influencer.findMany({
      skip,
      take: pageSize,
      include: {
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.influencer.count(),
  ]);
  
  return { data, total };
};
```

**缓存策略**:
```typescript
// Redis 缓存热点数据
const getCachedDashboardData = async (factoryId: string) => {
  const cacheKey = `dashboard:${factoryId}`;
  
  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 从数据库查询
  const data = await fetchDashboardData(factoryId);
  
  // 写入缓存，5分钟过期
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
};
```


---

## 🧪 测试策略

### 单元测试

**权限验证测试**:
```typescript
describe('Permission Middleware', () => {
  it('should allow factory owner to access all resources', async () => {
    const req = { user: { role: 'FACTORY_OWNER' } };
    const res = {};
    const next = jest.fn();
    
    await checkPermission('operations.manageSamples')(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });
  
  it('should deny access when permission is missing', async () => {
    const req = { 
      user: { 
        role: 'BUSINESS_STAFF',
        permissions: {
          operations: { manageSamples: false }
        }
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    await checkPermission('operations.manageSamples')(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

**组件测试**:
```typescript
describe('StaffPermissionsModal', () => {
  it('should render permission checkboxes', () => {
    const { getByText } = render(
      <StaffPermissionsModal
        visible={true}
        staffId="staff-1"
        currentPermissions={defaultPermissions}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    expect(getByText('查看其他商务的达人信息')).toBeInTheDocument();
    expect(getByText('创建/编辑/删除样品')).toBeInTheDocument();
  });
  
  it('should apply template when selected', () => {
    const onSave = jest.fn();
    const { getByText } = render(
      <StaffPermissionsModal
        visible={true}
        staffId="staff-1"
        currentPermissions={defaultPermissions}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );
    
    fireEvent.click(getByText('团队主管'));
    fireEvent.click(getByText('保存并应用'));
    
    expect(onSave).toHaveBeenCalledWith(supervisorPermissions);
  });
});
```

### 集成测试

**权限流程测试**:
```typescript
describe('Permission Flow', () => {
  it('should update permissions and apply immediately', async () => {
    // 1. 工厂老板登录
    const ownerToken = await loginAsFactoryOwner();
    
    // 2. 更新商务权限
    const response = await request(app)
      .put('/api/staff/staff-1/permissions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        permissions: {
          operations: { manageSamples: true }
        }
      });
    
    expect(response.status).toBe(200);
    
    // 3. 商务登录
    const staffToken = await loginAsStaff('staff-1');
    
    // 4. 验证权限生效
    const samplesResponse = await request(app)
      .post('/api/samples')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Test Sample' });
    
    expect(samplesResponse.status).toBe(201);
  });
});
```

### E2E 测试

**关键流程测试**:
```typescript
describe('Factory Owner Dashboard E2E', () => {
  it('should display trend charts and allow period switching', async () => {
    await page.goto('http://localhost:5173/app/dashboard');
    await page.waitForSelector('.trend-chart');
    
    // 验证默认显示周数据
    expect(await page.textContent('.period-selector')).toContain('7天');
    
    // 切换到月数据
    await page.click('.period-selector');
    await page.click('text=30天');
    
    // 验证图表更新
    await page.waitForSelector('.trend-chart[data-period="month"]');
  });
  
  it('should manage staff permissions', async () => {
    await page.goto('http://localhost:5173/app/team');
    
    // 点击权限设置
    await page.click('text=权限设置');
    
    // 选择团队主管模板
    await page.click('text=团队主管');
    
    // 保存
    await page.click('text=保存并应用');
    
    // 验证成功提示
    await page.waitForSelector('text=权限更新成功');
  });
});
```

---

## 📊 监控和日志

### 性能监控

```typescript
// 前端性能监控
const reportWebVitals = (metric: Metric) => {
  // 上报到监控服务
  if (metric.name === 'FCP') {
    console.log('First Contentful Paint:', metric.value);
  }
  if (metric.name === 'LCP') {
    console.log('Largest Contentful Paint:', metric.value);
  }
  if (metric.name === 'CLS') {
    console.log('Cumulative Layout Shift:', metric.value);
  }
};

// API 响应时间监控
const apiMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // 如果响应时间超过500ms，记录警告
    if (duration > 500) {
      logger.warn(`Slow API: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};
```

### 权限审计日志

```typescript
// 权限变更日志
const logPermissionChange = async (
  operatorId: string,
  targetUserId: string,
  oldPermissions: StaffPermissions,
  newPermissions: StaffPermissions
) => {
  await prisma.auditLog.create({
    data: {
      type: 'PERMISSION_CHANGE',
      operatorId,
      targetUserId,
      details: {
        old: oldPermissions,
        new: newPermissions,
        changes: getPermissionChanges(oldPermissions, newPermissions),
      },
      timestamp: new Date(),
    },
  });
};

// 权限拒绝日志
const logPermissionDenied = async (
  userId: string,
  permission: string,
  resource: string
) => {
  await prisma.auditLog.create({
    data: {
      type: 'PERMISSION_DENIED',
      userId,
      details: {
        permission,
        resource,
        timestamp: new Date(),
      },
    },
  });
};
```

---

## 🔄 数据迁移计划

### 迁移步骤

**Step 1: 添加 permissions 字段**
```sql
-- 添加 permissions 字段到 User 表
ALTER TABLE "User" ADD COLUMN "permissions" JSONB DEFAULT '{}';

-- 添加 preferences 字段到 User 表
ALTER TABLE "User" ADD COLUMN "preferences" JSONB DEFAULT '{}';
```

**Step 2: 初始化默认权限**
```typescript
// 为所有现有商务人员设置默认权限（基础商务）
const initializeDefaultPermissions = async () => {
  const businessStaff = await prisma.user.findMany({
    where: { role: 'BUSINESS_STAFF' },
  });
  
  const defaultPermissions = {
    dataVisibility: {
      viewOthersInfluencers: false,
      viewOthersCollaborations: false,
      viewOthersPerformance: false,
      viewTeamData: true,
      viewRanking: true,
    },
    operations: {
      manageInfluencers: true,
      manageSamples: false,
      manageCollaborations: true,
      deleteCollaborations: false,
      exportData: true,
      batchOperations: true,
    },
    advanced: {
      viewCostData: false,
      viewROIData: true,
      modifyOthersData: false,
    },
  };
  
  for (const staff of businessStaff) {
    await prisma.user.update({
      where: { id: staff.id },
      data: { permissions: defaultPermissions },
    });
  }
};
```

**Step 3: 验证迁移**
```typescript
// 验证所有商务人员都有权限配置
const verifyMigration = async () => {
  const staffWithoutPermissions = await prisma.user.count({
    where: {
      role: 'BUSINESS_STAFF',
      permissions: null,
    },
  });
  
  if (staffWithoutPermissions > 0) {
    throw new Error(`${staffWithoutPermissions} staff members missing permissions`);
  }
  
  console.log('Migration verified successfully');
};
```

---

## 📝 文档状态

**设计文档**: ✅ 已完成  
**下一步**: 创建任务分解文档（tasks.md）

