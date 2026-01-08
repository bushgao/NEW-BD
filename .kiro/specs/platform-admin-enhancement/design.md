# 平台管理端功能增强 - 设计文档

## 概述

本文档描述平台管理端功能增强的技术设计，包括达人管理、来源追踪、认证功能和数据统计增强。

## 架构

### 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React + TypeScript)              │
├─────────────────────────────────────────────────────────┤
│  平台管理页面                                             │
│  ├─ 达人管理列表                                          │
│  ├─ 达人详情弹窗                                          │
│  ├─ 认证审核弹窗                                          │
│  └─ 统计数据看板                                          │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                    后端 (Node.js + Express)              │
├─────────────────────────────────────────────────────────┤
│  Platform Service                                        │
│  ├─ listAllInfluencers()                                 │
│  ├─ getInfluencerDetail()                                │
│  ├─ verifyInfluencer()                                   │
│  └─ getInfluencerStats()                                 │
└─────────────────────────────────────────────────────────┘
                          ↓ Prisma ORM
┌─────────────────────────────────────────────────────────┐
│                    数据库 (PostgreSQL)                    │
├─────────────────────────────────────────────────────────┤
│  Influencer 表（扩展）                                    │
│  ├─ createdBy (新增)                                     │
│  ├─ sourceType (新增)                                    │
│  ├─ verificationStatus (新增)                            │
│  ├─ verifiedAt (新增)                                    │
│  ├─ verifiedBy (新增)                                    │
│  └─ verificationNote (新增)                              │
└─────────────────────────────────────────────────────────┘
```

## 组件和接口

### 数据模型

#### 新增枚举类型

```prisma
// 达人来源类型
enum InfluencerSourceType {
  PLATFORM  // 平台管理员添加
  FACTORY   // 工厂老板添加
  STAFF     // 商务人员添加
}

// 达人认证状态
enum VerificationStatus {
  UNVERIFIED  // 未认证
  VERIFIED    // 已认证
  REJECTED    // 认证失败
}
```


#### Influencer 模型扩展

```prisma
model Influencer {
  id         String   @id @default(uuid())
  factoryId  String
  nickname   String
  platform   Platform
  platformId String
  phone      String?
  wechat     String?
  followers  String?
  categories String[]
  tags       String[]
  notes      String?
  
  // ========== 新增字段 ==========
  createdBy            String?              // 添加人ID
  sourceType           InfluencerSourceType @default(STAFF)  // 来源类型
  verificationStatus   VerificationStatus   @default(UNVERIFIED)  // 认证状态
  verifiedAt           DateTime?            // 认证时间
  verifiedBy           String?              // 认证人ID
  verificationNote     String?              // 认证备注
  verificationHistory  Json?                // 认证历史记录
  // ==============================
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  factory        Factory         @relation(fields: [factoryId], references: [id])
  collaborations Collaboration[]
  creator        User?           @relation("InfluencerCreator", fields: [createdBy], references: [id])
  verifier       User?           @relation("InfluencerVerifier", fields: [verifiedBy], references: [id])

  @@unique([factoryId, platform, platformId])
  @@index([factoryId])
  @@index([nickname])
  @@index([phone])
  @@index([createdBy])
  @@index([sourceType])
  @@index([verificationStatus])
}
```

#### User 模型扩展

```prisma
model User {
  // ... 现有字段
  
  // Relations
  // ... 现有关系
  createdInfluencers  Influencer[] @relation("InfluencerCreator")
  verifiedInfluencers Influencer[] @relation("InfluencerVerifier")
}
```

### API 接口设计

#### 1. 获取所有达人列表（平台级别）

```typescript
GET /api/platform/influencers

Query Parameters:
- page: number (default: 1)
- pageSize: number (default: 20)
- keyword?: string (搜索昵称、平台ID、手机号)
- platform?: Platform (平台筛选)
- factoryId?: string (工厂筛选)
- sourceType?: InfluencerSourceType (来源类型筛选)
- verificationStatus?: VerificationStatus (认证状态筛选)
- createdBy?: string (添加人筛选)

Response:
{
  data: InfluencerWithDetails[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}

InfluencerWithDetails:
{
  id: string,
  nickname: string,
  platform: Platform,
  platformId: string,
  phone?: string,
  wechat?: string,
  followers?: string,
  categories: string[],
  tags: string[],
  sourceType: InfluencerSourceType,
  verificationStatus: VerificationStatus,
  verifiedAt?: Date,
  createdAt: Date,
  factory: {
    id: string,
    name: string
  },
  creator?: {
    id: string,
    name: string,
    role: UserRole
  },
  verifier?: {
    id: string,
    name: string
  },
  _count: {
    collaborations: number
  }
}
```


#### 2. 获取达人详情

```typescript
GET /api/platform/influencers/:id

Response:
{
  id: string,
  nickname: string,
  platform: Platform,
  platformId: string,
  phone?: string,
  wechat?: string,
  followers?: string,
  categories: string[],
  tags: string[],
  notes?: string,
  sourceType: InfluencerSourceType,
  verificationStatus: VerificationStatus,
  verifiedAt?: Date,
  verificationNote?: string,
  verificationHistory?: VerificationHistoryEntry[],
  createdAt: Date,
  updatedAt: Date,
  factory: {
    id: string,
    name: string,
    owner: {
      id: string,
      name: string,
      email: string
    }
  },
  creator?: {
    id: string,
    name: string,
    email: string,
    role: UserRole
  },
  verifier?: {
    id: string,
    name: string,
    email: string
  },
  collaborations: CollaborationSummary[]
}

VerificationHistoryEntry:
{
  action: 'VERIFIED' | 'REJECTED' | 'RESET',
  verifiedBy: string,
  verifiedByName: string,
  verifiedAt: Date,
  note?: string
}

CollaborationSummary:
{
  id: string,
  stage: PipelineStage,
  businessStaff: {
    id: string,
    name: string
  },
  createdAt: Date,
  hasResult: boolean
}
```

#### 3. 认证达人

```typescript
POST /api/platform/influencers/:id/verify

Request Body:
{
  status: 'VERIFIED' | 'REJECTED',
  note?: string
}

Response:
{
  id: string,
  verificationStatus: VerificationStatus,
  verifiedAt: Date,
  verifiedBy: string,
  verificationNote?: string
}
```

#### 4. 获取达人统计数据

```typescript
GET /api/platform/influencers/stats

Query Parameters:
- startDate?: Date
- endDate?: Date

Response:
{
  total: number,
  bySource: {
    PLATFORM: number,
    FACTORY: number,
    STAFF: number
  },
  byVerificationStatus: {
    UNVERIFIED: number,
    VERIFIED: number,
    REJECTED: number
  },
  byPlatform: {
    DOUYIN: number,
    KUAISHOU: number,
    XIAOHONGSHU: number,
    WEIBO: number,
    OTHER: number
  },
  byFactory: {
    factoryId: string,
    factoryName: string,
    count: number
  }[],
  sourceQuality: {
    sourceType: InfluencerSourceType,
    total: number,
    verified: number,
    verificationRate: number,
    collaborations: number,
    successRate: number
  }[]
}
```

#### 5. 导出达人列表

```typescript
GET /api/platform/influencers/export

Query Parameters: (same as list API)

Response:
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="influencers-{date}.xlsx"

Excel Columns:
- 昵称
- 平台
- 账号ID
- 粉丝数
- 手机号
- 微信号
- 所属工厂
- 来源类型
- 添加人
- 认证状态
- 认证时间
- 合作次数
- 添加时间
```


## 数据模型详细设计

### 达人来源追踪

**设计原则**：
- 自动记录：在创建达人时自动记录 `createdBy` 和 `sourceType`
- 不可修改：来源信息一旦记录不可修改
- 完整追溯：记录添加人的完整信息（ID、姓名、角色）

**来源类型判断逻辑**：
```typescript
function determineSourceType(user: User): InfluencerSourceType {
  switch (user.role) {
    case 'PLATFORM_ADMIN':
      return 'PLATFORM';
    case 'FACTORY_OWNER':
      return 'FACTORY';
    case 'BUSINESS_STAFF':
      return 'STAFF';
    default:
      return 'STAFF';
  }
}
```

### 达人认证系统

**认证状态流转**：
```
UNVERIFIED (未认证)
    ↓
    ├─→ VERIFIED (已认证)
    └─→ REJECTED (认证失败)
         ↓
         └─→ UNVERIFIED (重新认证)
```

**认证历史记录格式**：
```typescript
interface VerificationHistory {
  entries: Array<{
    action: 'VERIFIED' | 'REJECTED' | 'RESET';
    verifiedBy: string;
    verifiedByName: string;
    verifiedAt: Date;
    note?: string;
  }>;
}
```

**认证规则**：
1. 只有平台管理员可以进行认证操作
2. 认证时必须填写备注（拒绝时必填）
3. 认证历史完整保留，不可删除
4. 认证状态变更时发送通知给工厂老板和添加人

## 错误处理

### 错误码定义

```typescript
enum PlatformErrorCode {
  // 达人相关
  INFLUENCER_NOT_FOUND = 'INFLUENCER_NOT_FOUND',
  INFLUENCER_ALREADY_VERIFIED = 'INFLUENCER_ALREADY_VERIFIED',
  
  // 权限相关
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',
  ONLY_ADMIN_CAN_VERIFY = 'ONLY_ADMIN_CAN_VERIFY',
  
  // 验证相关
  VERIFICATION_NOTE_REQUIRED = 'VERIFICATION_NOTE_REQUIRED',
  INVALID_VERIFICATION_STATUS = 'INVALID_VERIFICATION_STATUS',
}
```

### 错误处理策略

1. **权限验证**：
   - 所有平台管理 API 必须验证用户角色为 `PLATFORM_ADMIN`
   - 返回 403 Forbidden 如果权限不足

2. **数据验证**：
   - 验证达人 ID 存在性
   - 验证认证状态的有效性
   - 验证必填字段

3. **并发控制**：
   - 使用数据库事务确保认证操作的原子性
   - 防止重复认证

## 测试策略

### 单元测试

**测试覆盖**：
- Service 层所有方法
- 来源类型判断逻辑
- 认证状态流转逻辑
- 统计数据计算逻辑

**测试用例示例**：
```typescript
describe('PlatformService', () => {
  describe('listAllInfluencers', () => {
    it('should return all influencers across factories');
    it('should filter by source type');
    it('should filter by verification status');
    it('should include creator information');
  });

  describe('verifyInfluencer', () => {
    it('should verify influencer successfully');
    it('should reject influencer with note');
    it('should record verification history');
    it('should send notification to factory owner');
    it('should throw error if not admin');
  });
});
```


## 前端组件设计

### 1. 达人管理列表页面 (InfluencerManagement.tsx)

**组件结构**：
```tsx
<InfluencerManagement>
  <PageHeader title="达人管理" />
  <FilterBar>
    <SearchInput placeholder="搜索昵称/账号ID/手机号" />
    <Select placeholder="平台" options={platforms} />
    <Select placeholder="工厂" options={factories} />
    <Select placeholder="来源类型" options={sourceTypes} />
    <Select placeholder="认证状态" options={verificationStatuses} />
    <Button onClick={handleExport}>导出</Button>
  </FilterBar>
  <Table>
    <Column title="昵称" dataIndex="nickname" />
    <Column title="平台" dataIndex="platform" render={renderPlatformBadge} />
    <Column title="粉丝数" dataIndex="followers" />
    <Column title="所属工厂" dataIndex="factory.name" />
    <Column title="来源" dataIndex="sourceType" render={renderSourceBadge} />
    <Column title="添加人" dataIndex="creator.name" />
    <Column title="认证状态" dataIndex="verificationStatus" render={renderVerificationBadge} />
    <Column title="添加时间" dataIndex="createdAt" render={formatDate} />
    <Column title="操作" render={renderActions} />
  </Table>
  <Pagination />
</InfluencerManagement>
```

**状态管理**：
```typescript
interface InfluencerManagementState {
  influencers: InfluencerWithDetails[];
  loading: boolean;
  filters: {
    keyword?: string;
    platform?: Platform;
    factoryId?: string;
    sourceType?: InfluencerSourceType;
    verificationStatus?: VerificationStatus;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

### 2. 达人详情弹窗 (InfluencerDetailModal.tsx)

**组件结构**：
```tsx
<Modal title="达人详情" width={800}>
  <Tabs>
    <TabPane tab="基本信息" key="basic">
      <Descriptions>
        <Item label="昵称">{influencer.nickname}</Item>
        <Item label="平台">{influencer.platform}</Item>
        <Item label="账号ID">{influencer.platformId}</Item>
        <Item label="粉丝数">{influencer.followers}</Item>
        <Item label="手机号">{influencer.phone}</Item>
        <Item label="微信号">{influencer.wechat}</Item>
        <Item label="类目">{influencer.categories.join(', ')}</Item>
        <Item label="标签">{influencer.tags.join(', ')}</Item>
      </Descriptions>
    </TabPane>
    
    <TabPane tab="来源信息" key="source">
      <Descriptions>
        <Item label="来源类型">{renderSourceBadge(influencer.sourceType)}</Item>
        <Item label="添加人">{influencer.creator?.name}</Item>
        <Item label="添加人角色">{influencer.creator?.role}</Item>
        <Item label="添加时间">{formatDateTime(influencer.createdAt)}</Item>
        <Item label="所属工厂">{influencer.factory.name}</Item>
        <Item label="工厂老板">{influencer.factory.owner.name}</Item>
      </Descriptions>
    </TabPane>
    
    <TabPane tab="认证信息" key="verification">
      <Descriptions>
        <Item label="认证状态">{renderVerificationBadge(influencer.verificationStatus)}</Item>
        <Item label="认证时间">{formatDateTime(influencer.verifiedAt)}</Item>
        <Item label="认证人">{influencer.verifier?.name}</Item>
        <Item label="认证备注">{influencer.verificationNote}</Item>
      </Descriptions>
      {influencer.verificationHistory && (
        <Timeline>
          {influencer.verificationHistory.entries.map(entry => (
            <TimelineItem key={entry.verifiedAt}>
              <div>{entry.action} by {entry.verifiedByName}</div>
              <div>{formatDateTime(entry.verifiedAt)}</div>
              {entry.note && <div>备注: {entry.note}</div>}
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </TabPane>
    
    <TabPane tab="合作记录" key="collaborations">
      <Table dataSource={influencer.collaborations}>
        <Column title="阶段" dataIndex="stage" />
        <Column title="商务" dataIndex="businessStaff.name" />
        <Column title="创建时间" dataIndex="createdAt" />
        <Column title="有结果" dataIndex="hasResult" render={renderBoolean} />
      </Table>
    </TabPane>
  </Tabs>
</Modal>
```

### 3. 认证审核弹窗 (VerificationModal.tsx)

**组件结构**：
```tsx
<Modal title="达人认证审核" width={600}>
  <Alert 
    message="请仔细核实达人信息的真实性" 
    type="info" 
    showIcon 
  />
  
  <Descriptions bordered>
    <Item label="昵称">{influencer.nickname}</Item>
    <Item label="平台">{influencer.platform}</Item>
    <Item label="账号ID">{influencer.platformId}</Item>
    <Item label="粉丝数">{influencer.followers}</Item>
    <Item label="手机号">{influencer.phone}</Item>
    <Item label="微信号">{influencer.wechat}</Item>
    <Item label="添加人">{influencer.creator?.name}</Item>
    <Item label="来源类型">{renderSourceBadge(influencer.sourceType)}</Item>
  </Descriptions>
  
  <Form form={form}>
    <Form.Item 
      name="status" 
      label="审核结果" 
      rules={[{ required: true }]}
    >
      <Radio.Group>
        <Radio value="VERIFIED">通过认证</Radio>
        <Radio value="REJECTED">拒绝认证</Radio>
      </Radio.Group>
    </Form.Item>
    
    <Form.Item 
      name="note" 
      label="备注"
      rules={[
        { required: form.getFieldValue('status') === 'REJECTED' }
      ]}
    >
      <TextArea 
        rows={4} 
        placeholder="请填写认证备注（拒绝时必填）" 
      />
    </Form.Item>
  </Form>
  
  <Space>
    <Button onClick={onCancel}>取消</Button>
    <Button type="primary" onClick={handleSubmit}>提交</Button>
  </Space>
</Modal>
```

### 4. 统计数据看板 (InfluencerStatsPanel.tsx)

**组件结构**：
```tsx
<Card title="达人统计">
  <Row gutter={16}>
    <Col span={6}>
      <Statistic title="达人总数" value={stats.total} />
    </Col>
    <Col span={6}>
      <Statistic 
        title="已认证" 
        value={stats.byVerificationStatus.VERIFIED} 
        valueStyle={{ color: '#52c41a' }}
      />
    </Col>
    <Col span={6}>
      <Statistic 
        title="未认证" 
        value={stats.byVerificationStatus.UNVERIFIED} 
        valueStyle={{ color: '#faad14' }}
      />
    </Col>
    <Col span={6}>
      <Statistic 
        title="认证失败" 
        value={stats.byVerificationStatus.REJECTED} 
        valueStyle={{ color: '#ff4d4f' }}
      />
    </Col>
  </Row>
  
  <Divider />
  
  <Row gutter={16}>
    <Col span={12}>
      <Card title="来源分布" size="small">
        <Pie 
          data={[
            { type: '平台添加', value: stats.bySource.PLATFORM },
            { type: '工厂添加', value: stats.bySource.FACTORY },
            { type: '商务添加', value: stats.bySource.STAFF },
          ]}
        />
      </Card>
    </Col>
    <Col span={12}>
      <Card title="平台分布" size="small">
        <Bar 
          data={Object.entries(stats.byPlatform).map(([platform, count]) => ({
            platform,
            count
          }))}
        />
      </Card>
    </Col>
  </Row>
  
  <Divider />
  
  <Card title="来源质量分析" size="small">
    <Table dataSource={stats.sourceQuality}>
      <Column title="来源类型" dataIndex="sourceType" />
      <Column title="总数" dataIndex="total" />
      <Column title="已认证" dataIndex="verified" />
      <Column title="认证率" dataIndex="verificationRate" render={renderPercent} />
      <Column title="合作数" dataIndex="collaborations" />
      <Column title="成功率" dataIndex="successRate" render={renderPercent} />
    </Table>
  </Card>
</Card>
```

## 实施计划

### 阶段 1: 数据库迁移（1天）

**任务**：
1. 创建 Prisma migration
2. 添加新的枚举类型
3. 扩展 Influencer 模型
4. 更新 User 模型关系
5. 运行 migration
6. 更新 seed 数据

**文件**：
- `packages/backend/prisma/migrations/xxx_add_influencer_source_and_verification.sql`
- `packages/backend/prisma/schema.prisma`
- `packages/backend/prisma/seed.ts`

### 阶段 2: 后端 API 实现（2-3天）

**任务**：
1. 扩展 platform.service.ts
   - `listAllInfluencers()`
   - `getInfluencerDetail()`
   - `verifyInfluencer()`
   - `getInfluencerStats()`
   - `exportInfluencers()`
2. 创建 platform-influencer.routes.ts
3. 添加权限中间件验证
4. 实现通知发送逻辑
5. 编写单元测试

**文件**：
- `packages/backend/src/services/platform.service.ts`
- `packages/backend/src/routes/platform-influencer.routes.ts`
- `packages/backend/src/middleware/admin-auth.middleware.ts`
- `packages/backend/src/services/platform.service.test.ts`

### 阶段 3: 前端实现（3-4天）

**任务**：
1. 创建达人管理页面组件
2. 创建达人详情弹窗
3. 创建认证审核弹窗
4. 创建统计数据看板
5. 集成到平台管理页面
6. 实现导出功能
7. 添加路由配置

**文件**：
- `packages/frontend/src/pages/Admin/InfluencerManagement.tsx`
- `packages/frontend/src/pages/Admin/InfluencerDetailModal.tsx`
- `packages/frontend/src/pages/Admin/VerificationModal.tsx`
- `packages/frontend/src/pages/Admin/InfluencerStatsPanel.tsx`
- `packages/frontend/src/services/platform-influencer.service.ts`

### 阶段 4: 测试和优化（1-2天）

**任务**：
1. 功能测试
2. 数据准确性测试
3. 性能优化
4. UI/UX 优化
5. 文档更新

**预计总时间**: 7-10 天

---

**文档状态**: ✅ 设计完成  
**下一步**: 创建任务列表（tasks.md）
