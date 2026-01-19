---
description: 创建新的前端页面（必须遵循设计规范）
---

# 创建新页面 Workflow

此工作流确保每个新创建的页面都符合ICS设计规范。

## 前置步骤（必须）

1. **首先阅读设计规范**
   - 阅读 `F:\NEW BD\docs\前端设计规范.md`
   - 确保理解全页背景对齐规范（`padding: 24px`, `margin: -24px`）
   - 确保理解间距规范（使用 `gap-4` 而非 `gap-6`）

## 创建页面步骤

// turbo-all

2. 确定页面位置：
   - 平台管理员页面: `packages/frontend/src/pages/Admin/`
   - 品牌/商务页面: `packages/frontend/src/pages/`
   - 达人端页面: `packages/frontend/src/pages/InfluencerPortal/`

3. 使用以下模板创建新页面文件：

```tsx
import { Typography } from 'antd';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Title } = Typography;

const [PageName]Page = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
        margin: '-24px',
      }}
    >
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
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
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          [页面标题]
        </Title>

        <Card variant="elevated">
          <CardContent>
            {/* 页面内容 */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default [PageName]Page;
```

4. 在路由文件中添加新路由：
   - 编辑 `packages/frontend/src/routes/index.tsx`
   - 添加新页面的路由配置

## 检查清单（完成后必须核对）

- [ ] 主容器有 `padding: '24px'` 和 `margin: '-24px'`
- [ ] 布局间距使用 `gap-4` 而非 `gap-6`
- [ ] 使用 `Card` 或 `BentoCard` 组件
- [ ] 导入了 `useTheme` 用于渐变背景
- [ ] 没有多余的 `pb-X` padding

## 相关文件

- 设计规范: `F:\NEW BD\docs\前端设计规范.md`
- Card组件: `packages/frontend/src/components/ui/Card.tsx`
- BentoCard组件: `packages/frontend/src/components/ui/Bento.tsx`
- 路由配置: `packages/frontend/src/routes/index.tsx`
