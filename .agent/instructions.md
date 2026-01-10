# 工作区专项规则 (NEW BD)

## 产品定位
这是一个 **SaaS 产品**：
- **平台方（我们）**：运营和销售系统
- **品牌工厂（客户）**：付费使用系统管理达人合作
- **达人（合作方）**：查看与各工厂的合作信息

## 技术规范

### 数据存储
- **金额存储**：所有金额字段（如 `unitCost`, `salesGmv`, `pitFee` 等）必须在数据库中以整数存储（单位：分）。

### 前端风格
- **视觉风格**：采用 "Deep Space / Premium Glass" 现代视觉风格，强调玻璃拟态、渐变和阴影。
- **状态管理**：使用 Zustand 进行轻量级状态管理。

### 认证系统架构（重要！）
系统采用**三套完全独立的认证系统**，确保安全隔离：

| 用户类型 | 登录入口 | Store | localStorage Key | 主页 |
|---------|---------|-------|------------------|------|
| 平台管理员 | `/admin/login` | `adminStore` | `admin-storage` | `/app/admin` |
| 工厂客户（老板/员工） | `/login` | `authStore` | `auth-storage` | `/app/dashboard` |
| 达人 | `/influencer-portal/login` | `influencerPortalStore` | `influencer_*` | `/influencer-portal` |

**关键原则**：
1. 三套系统使用不同的 localStorage key，互不干扰
2. 同一浏览器可同时登录三种账号
3. 每套系统有独立的路由守卫（`AdminProtectedRoute`、`ProtectedRoute`、`InfluencerProtectedRoute`）
4. 平台管理员 API 应添加额外的权限验证

## 业务逻辑

### ROI 计算
- **公式**：ROI = 销售 GMV / (样品成本 + 快递费 + 坑位费 + 实付佣金)
- **回本判断**：ROI < 1 为亏损，ROI >= 1 为回本

### 数据隔离
- **工厂隔离**：不同工厂的数据完全隔离
- **达人端口隔离**：达人只能看到与自己相关的合作数据

## 相关文档
- [登录账号汇总](./docs/登录账号汇总.md) - 所有测试账号信息
- [测试指南](./docs/测试指南.md) - 功能测试流程
