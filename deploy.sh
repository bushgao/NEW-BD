#!/bin/bash

# ============================================
# Zilo 系统自动化部署脚本
# ============================================
# 服务器 IP: 101.43.69.38
# 域名: zilohq.com
# ============================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 Zilo 系统自动化部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# ============================================
# 第一步：检查环境
# ============================================
echo "第一步：检查环境..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    print_error "请使用 root 用户运行此脚本"
    exit 1
fi

print_success "环境检查通过"
echo ""

# ============================================
# 第二步：安装必要软件
# ============================================
echo "第二步：安装必要软件..."

# 更新系统
print_info "更新系统包..."
yum update -y > /dev/null 2>&1 || apt update -y > /dev/null 2>&1
print_success "系统包更新完成"

# 安装 Git
if ! command -v git &> /dev/null; then
    print_info "安装 Git..."
    yum install -y git > /dev/null 2>&1 || apt install -y git > /dev/null 2>&1
    print_success "Git 安装完成"
else
    print_success "Git 已安装"
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "请先在宝塔面板安装 Node.js 18"
    echo "1. 登录宝塔面板: http://101.43.69.38:8888/tencentcloud"
    echo "2. 点击 软件商店 -> 搜索 Node.js -> 安装版本 18"
    exit 1
else
    NODE_VERSION=$(node -v)
    print_success "Node.js 已安装: $NODE_VERSION"
fi

# 检查 PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "请先在宝塔面板安装 PostgreSQL 14"
    echo "1. 登录宝塔面板: http://101.43.69.38:8888/tencentcloud"
    echo "2. 点击 软件商店 -> 搜索 PostgreSQL -> 安装版本 14"
    exit 1
else
    print_success "PostgreSQL 已安装"
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    print_info "安装 PM2..."
    npm install -g pm2 > /dev/null 2>&1
    print_success "PM2 安装完成"
else
    print_success "PM2 已安装"
fi

echo ""

# ============================================
# 第三步：克隆代码
# ============================================
echo "第三步：克隆代码..."

# 创建目录
if [ ! -d "/www/wwwroot" ]; then
    mkdir -p /www/wwwroot
fi

cd /www/wwwroot

# 删除旧代码（如果存在）
if [ -d "zilo" ]; then
    print_info "删除旧代码..."
    rm -rf zilo
fi

# 克隆代码
print_info "从 GitHub 克隆代码..."
git clone https://github.com/bushgao/NEW-BD.git zilo
print_success "代码克隆完成"

cd zilo
print_success "当前目录: $(pwd)"
echo ""

# ============================================
# 第四步：生成安全密钥
# ============================================
echo "第四步：生成安全密钥..."

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

print_success "JWT 密钥已生成"
echo ""

# ============================================
# 第五步：配置数据库
# ============================================
echo "第五步：配置数据库..."

print_info "请在宝塔面板创建数据库："
echo "1. 登录宝塔面板: http://101.43.69.38:8888/tencentcloud"
echo "2. 点击 数据库 -> PostgreSQL"
echo "3. 点击 添加数据库"
echo "4. 数据库名: zilo_production"
echo "5. 用户名: zilo"
echo "6. 密码: 点击随机密码生成"
echo ""
read -p "数据库创建完成后，请输入数据库密码: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "数据库密码不能为空"
    exit 1
fi

print_success "数据库密码已记录"
echo ""

# ============================================
# 第六步：配置环境变量
# ============================================
echo "第六步：配置环境变量..."

cd /www/wwwroot/zilo/packages/backend

# 创建 .env 文件
cat > .env << EOF
# 生产环境
NODE_ENV=production
PORT=3000

# 数据库配置（PostgreSQL）
DATABASE_URL="postgresql://zilo:${DB_PASSWORD}@localhost:5432/zilo_production?schema=public"

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
# 第七步：安装依赖
# ============================================
echo "第七步：安装依赖..."

cd /www/wwwroot/zilo

print_info "安装根目录依赖..."
npm install
print_success "根目录依赖安装完成"

print_info "安装后端依赖..."
cd packages/backend
npm install
print_success "后端依赖安装完成"

print_info "安装前端依赖..."
cd ../frontend
npm install
print_success "前端依赖安装完成"

echo ""

# ============================================
# 第八步：构建应用
# ============================================
echo "第八步：构建应用..."

print_info "生成 Prisma Client..."
cd /www/wwwroot/zilo/packages/backend
npx prisma generate
print_success "Prisma Client 生成完成"

print_info "运行数据库迁移..."
npx prisma migrate deploy
print_success "数据库迁移完成"

print_info "构建后端..."
npm run build
print_success "后端构建完成"

print_info "构建前端..."
cd ../frontend
npm run build
print_success "前端构建完成"

echo ""

# ============================================
# 第九步：启动后端服务
# ============================================
echo "第九步：启动后端服务..."

cd /www/wwwroot/zilo/packages/backend

# 停止旧服务（如果存在）
pm2 delete zilo-backend > /dev/null 2>&1 || true

# 启动新服务
pm2 start dist/index.js --name zilo-backend
pm2 save
pm2 startup

print_success "后端服务启动完成"
echo ""

# ============================================
# 第十步：显示部署信息
# ============================================
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "📋 部署信息："
echo "  - 服务器 IP: 101.43.69.38"
echo "  - 域名: zilohq.com"
echo "  - 前端目录: /www/wwwroot/zilo/packages/frontend/dist"
echo "  - 后端端口: 3000"
echo ""
echo "🔐 数据库信息："
echo "  - 数据库名: zilo_production"
echo "  - 用户名: zilo"
echo "  - 密码: ${DB_PASSWORD}"
echo ""
echo "📝 下一步操作："
echo "  1. 在宝塔面板配置 Nginx（参考 宝塔部署指南.md 第九步）"
echo "  2. 配置域名解析（参考 宝塔部署指南.md 第十一步）"
echo "  3. 申请 SSL 证书（参考 宝塔部署指南.md 第十二步）"
echo ""
echo "🔍 查看服务状态："
echo "  pm2 status"
echo "  pm2 logs zilo-backend"
echo ""
echo "=========================================="
