# ICS 设计系统规范

> 本文档定义了达人营销执行系统 (ICS) 的 UI 设计标准。

---

## 1. 颜色系统

### 主色 (Primary)
| 色阶 | 色值 | 用途 |
|------|------|------|
| 500 | `#0c8ce9` | **主色** - 按钮、链接、重点 |
| 400 | `#36a9fa` | 悬停状态 |
| 600 | `#0070c9` | 按下状态 |
| 100 | `#e0effe` | 浅色背景 |

### 功能色
| 类型 | 色值 | 用途 |
|------|------|------|
| 成功 | `#34c759` | 成功状态、正向指标 |
| 警告 | `#ff9f0a` | 警告提示 |
| 错误 | `#ff3b30` | 错误提示、删除操作 |
| 信息 | `#5ac8fa` | 信息提示 |

### 中性色
| 色阶 | 色值 | 用途 |
|------|------|------|
| 900 | `#1a2332` | 标题文字 |
| 700 | `#3e4c59` | 正文文字 |
| 500 | `#7a8a9e` | 次要文字 |
| 200 | `#e8ecf1` | 边框、分割线 |
| 100 | `#f5f7fa` | 背景色 |

---

## 2. 组件使用规范

### 卡片 (Card)
使用自定义 `Card` 组件，位于 `components/ui/Card.tsx`

```tsx
import { Card, CardTitle, CardContent } from '@/components/ui/Card';

<Card variant="default" padding="md" hoverable>
  <CardTitle>标题</CardTitle>
  <CardContent>内容</CardContent>
</Card>
```

| variant | 描述 |
|---------|------|
| `default` | 默认样式，带阴影 |
| `elevated` | 强调样式，阴影更深 |
| `outlined` | 边框样式，无阴影 |

### 按钮 (Button)
使用 Ant Design Button，主色已通过 ConfigProvider 配置。

```tsx
import { Button } from 'antd';

<Button type="primary">主要按钮</Button>
<Button>默认按钮</Button>
<Button type="text">文字按钮</Button>
```

### 表格 (Table)
使用 Ant Design Table，配合 Card 容器使用。

---

## 3. 间距规范

| 级别 | 尺寸 | 用途 |
|------|------|------|
| 2 | 8px | 紧凑间距 |
| 4 | 16px | 标准间距 |
| 6 | 24px | 卡片内边距 |
| 8 | 32px | 区块间距 |

---

## 4. 圆角规范

| 级别 | 尺寸 | 用途 |
|------|------|------|
| sm | 12px | 按钮、输入框 |
| base | 16px | 卡片 |
| xl | 24px | 大卡片、模态框 |

---

## 5. 主题配置

主题系统定义在 `src/theme/` 目录：
- `tokens.ts` - 设计令牌（颜色、间距等）
- `ThemeProvider.tsx` - 主题提供者
- `index.ts` - 主题导出

### 使用主题
```tsx
import { useTheme } from '@/theme/ThemeProvider';

const { theme } = useTheme();
// 使用 theme.colors.primary[500] 获取主色
```
