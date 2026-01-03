# 着陆页集成说明

## 当前配置

着陆页已经成功集成到主项目中！现在只需要运行一个项目。

### 统一架构
- **位置**: `packages/frontend/src/pages/LandingPage/`
- **访问地址**: http://localhost:5173/
- **技术栈**: React + Tailwind CSS + Ant Design + Framer Motion + lucide-react

## 路由结构

- `/` - 着陆页（营销页面）
- `/login` - 登录页面
- `/register` - 注册页面
- `/app/*` - 登录后的管理系统

## 用户流程

1. 用户访问 http://localhost:5173/ 看到营销着陆页
2. 点击页面上的"登录"或"免费试用"按钮
3. 跳转到登录/注册页面
4. 登录成功后进入 `/app/dashboard` 管理系统

## 启动项目

```bash
# 后端
cd packages/backend
npm run dev

# 前端（包含着陆页）
cd packages/frontend
npm run dev
```

访问: http://localhost:5173/

## 技术实现

### Tailwind CSS 配置

已正确配置 Tailwind CSS v3：
- `tailwind.config.js` - 配置文件，包含自定义颜色和主题
- `postcss.config.js` - PostCSS 配置
- `src/index.css` - 包含 Tailwind 指令

**重要配置**：
```js
// tailwind.config.js
corePlugins: {
  preflight: false, // 避免与 Ant Design 样式冲突
}
```

### 组件结构

```
packages/frontend/src/pages/LandingPage/
├── index.tsx                    # 主页面
└── components/
    ├── Hero.tsx                 # 英雄区域
    ├── PainPoints.tsx           # 痛点展示
    ├── FeatureHighlight.tsx     # 功能亮点
    ├── InteractiveROI.tsx       # 交互式 ROI 计算器
    ├── Comparison.tsx           # 对比表格
    └── Footer.tsx               # 页脚
```

### 依赖包

- `tailwindcss` - CSS 框架
- `framer-motion` - 动画库
- `lucide-react` - 图标库
- `react-router-dom` - 路由管理

## 优势

1. **统一架构**: 只需维护一个项目
2. **无样式冲突**: Tailwind CSS 与 Ant Design 和平共存
3. **共享后端**: 着陆页和管理系统使用同一个后端 API
4. **简化部署**: 一次构建，一次部署
5. **代码复用**: 可以共享组件和工具函数

## 生产环境部署

### 构建

```bash
# 构建前端（包含着陆页）
cd packages/frontend
npm run build

# 构建后端
cd packages/backend
npm run build
```

### 部署建议

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name zilo.com;

    # 前端静态文件
    location / {
        root /var/www/zilo/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 注意事项

1. Tailwind CSS 的 `preflight` 已禁用，避免与 Ant Design 冲突
2. 着陆页使用 Tailwind CSS 类名，管理系统使用 Ant Design 组件
3. 两者可以在同一个项目中和平共存
4. 如果需要修改着陆页样式，编辑 `tailwind.config.js` 中的主题配置

## 故障排除

### 样式不生效

1. 确保 `tailwind.config.js` 的 `content` 配置正确
2. 重启开发服务器
3. 清除浏览器缓存

### 构建错误

1. 删除 `node_modules` 和 `package-lock.json`
2. 重新安装依赖：`npm install`
3. 重新构建：`npm run build`

### Ant Design 样式冲突

已通过 `corePlugins: { preflight: false }` 解决，无需额外配置。
