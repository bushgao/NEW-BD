#!/bin/bash

# ============================================
# Zilo 系统一键部署脚本（宝塔版）
# ============================================
# 服务器 IP: 101.43.69.38
# 域名: zilohq.com
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 Zilo 系统一键部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印函数
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# ============================================
# 步骤 1：检查环境
# ============================================
print_step "步骤 1/10: 检查环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装！请在宝塔面板安装 Node.js 18"
    exit 1
fi
print_success "Node.js 已安装: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    print_error "npm 未安装！"
    exit 1
fi
print_success "npm 已安装: $(npm -v)"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    print_info "安装 PM2..."
    npm install -g pm2
fi
print_success "PM2 已安装"

# 检查 Git
if ! command -v git &> /dev/null; then
    print_error "Git 未安装！"
    exit 1
fi
print_success "Git 已安装"

echo ""

# ============================================
# 步骤 2：生成安全密钥
# ============================================
print_step "步骤 2/10: 生成安全密钥..."

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

print_success "安全密钥已生成"
echo ""

# ============================================
# 步骤 3：获取数据库密码
# ============================================
print_step "步骤 3/10: 配置数据库..."

echo ""
echo "请在宝塔面板创建 PostgreSQL 数据库："
echo "  1. 打开宝塔面板 -> 数据库 -> PostgreSQL"
echo "  2. 点击「添加数据库」"
echo "  3. 数据库名: ziloproduction"
echo "  4. 用户名: zilo"
echo "  5. 密码: 点击「随机密码」生成"
echo ""
read -p "请输入数据库密码: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "数据库密码不能为空！"
    exit 1
fi

print_success "数据库密码已记录"
echo ""

# ============================================
# 步骤 4：克隆代码
# ============================================
print_step "步骤 4/10: 克隆代码..."

# 创建目录
mkdir -p /www/wwwroot
cd /www/wwwroot

# 删除旧代码
if [ -d "zilo" ]; then
    print_info "删除旧代码..."
    rm -rf zilo
fi

# 克隆代码
print_info "从 GitHub 克隆代码..."
git clone https://github.com/bushgao/NEW-BD.git zilo

cd zilo
print_success "代码克隆完成: $(pwd)"
echo ""

# ============================================
# 步骤 5：配置环境变量
# ============================================
print_step "步骤 5/10: 配置环境变量..."

cd /www/wwwroot/zilo/packages/backend

cat > .env << EOF
# 生产环境
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL="postgresql://zilo:${DB_PASSWORD}@localhost:5432/ziloproduction?schema=public"

# JWT 密钥
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_REFRESH_EXPIRES_IN="30d"

# CORS 配置
CORS_ORIGIN="https://zilohq.com,http://zilohq.com,http://101.43.69.38"
EOF

print_success "环境变量配置完成"
echo ""

# ============================================
# 步骤 6：安装依赖
# ============================================
print_step "步骤 6/10: 安装依赖..."

cd /www/wwwroot/zilo

print_info "安装根目录依赖..."
npm install --production=false

print_info "安装后端依赖..."
cd packages/backend
npm install --production=false

print_info "安装前端依赖..."
cd ../frontend
npm install --production=false

print_success "依赖安装完成"
echo ""

# ============================================
# 步骤 7：构建后端
# ============================================
print_step "步骤 7/10: 构建后端..."

cd /www/wwwroot/zilo/packages/backend

print_info "生成 Prisma Client..."
npx prisma generate

print_info "运行数据库迁移..."
npx prisma migrate deploy

print_info "构建后端代码..."
npm run build

print_success "后端构建完成"
echo ""

# ============================================
# 步骤 8：构建前端
# ============================================
print_step "步骤 8/10: 构建前端..."

cd /www/wwwroot/zilo/packages/frontend

print_info "构建前端代码..."
npm run build

print_success "前端构建完成"
print_info "前端文件位置: /www/wwwroot/zilo/packages/frontend/dist"
echo ""

# ============================================
# 步骤 9：启动后端服务
# ============================================
print_step "步骤 9/10: 启动后端服务..."

cd /www/wwwroot/zilo/packages/backend

# 停止旧服务
pm2 delete zilo-backend 2>/dev/null || true

# 启动新服务
pm2 start dist/index.js --name zilo-backend

# 保存配置
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true

print_success "后端服务已启动"
echo ""

# ============================================
# 步骤 10：显示部署结果
# ============================================
print_step "步骤 10/10: 部署完成！"
echo ""

echo "=========================================="
echo "🎉 部署成功！"
echo "=========================================="
echo ""
echo "📋 部署信息："
echo "  ✓ 服务器 IP: 101.43.69.38"
echo "  ✓ 域名: zilohq.com"
echo "  ✓ 前端目录: /www/wwwroot/zilo/packages/frontend/dist"
echo "  ✓ 后端端口: 3000"
echo "  ✓ 后端服务: 运行中"
echo ""
echo "🔐 数据库信息："
echo "  ✓ 数据库名: ziloproduction"
echo "  ✓ 用户名: zilo"
echo "  ✓ 密码: ${DB_PASSWORD}"
echo ""
echo "📝 下一步操作（在宝塔面板完成）："
echo ""
echo "  1️⃣  配置 Nginx 网站："
echo "     - 打开宝塔面板 -> 网站 -> 添加站点"
echo "     - 域名: zilohq.com,www.zilohq.com"
echo "     - 根目录: /www/wwwroot/zilo/packages/frontend/dist"
echo "     - PHP版本: 纯静态"
echo ""
echo "  2️⃣  配置反向代理："
echo "     - 网站设置 -> 反向代理 -> 添加反向代理"
echo "     - 代理名称: backend-api"
echo "     - 目标URL: http://127.0.0.1:3000"
echo "     - 代理目录: /api"
echo ""
echo "  3️⃣  配置 SPA 路由："
echo "     - 网站设置 -> 配置文件"
echo "     - 在 location / { 中添加:"
echo "       try_files \$uri \$uri/ /index.html;"
echo ""
echo "  4️⃣  配置域名解析（腾讯云）："
echo "     - 域名注册 -> 我的域名 -> zilohq.com -> 解析"
echo "     - 添加 A 记录: @ -> 101.43.69.38"
echo "     - 添加 A 记录: www -> 101.43.69.38"
echo ""
echo "  5️⃣  申请 SSL 证书："
echo "     - 网站设置 -> SSL -> Let's Encrypt"
echo "     - 勾选域名 -> 申请"
echo "     - 开启「强制HTTPS」"
echo ""
echo "🔍 查看服务状态："
echo "  pm2 status"
echo "  pm2 logs zilo-backend"
echo ""
echo "🌐 访问地址（配置完成后）："
echo "  https://zilohq.com"
echo ""
echo "=========================================="
echo ""

# 显示 PM2 状态
pm2 status

echo ""
echo "✅ 部署脚本执行完成！"
echo ""
