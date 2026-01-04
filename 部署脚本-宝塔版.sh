#!/bin/bash

# Zilo 宝塔部署脚本
# 使用方法：在宝塔终端中，复制每一段命令单独执行

echo "=========================================="
echo "Zilo 系统部署脚本 - 宝塔版"
echo "=========================================="
echo ""

# 设置 Node.js 路径
NODE_PATH="/www/server/nodejs/v18.20.8/bin"
export PATH="$NODE_PATH:$PATH"

# 项目路径
PROJECT_DIR="/www/wwwroot/zilo"

echo "步骤 1/8: 生成 JWT 密钥"
echo "=========================================="
echo "请运行以下命令生成两个密钥："
echo "openssl rand -base64 64"
echo "openssl rand -base64 64"
echo ""
echo "生成后，请记录这两个密钥！"
echo ""
read -p "按回车键继续..."

echo ""
echo "步骤 2/8: 配置环境变量"
echo "=========================================="
echo "请手动创建文件：$PROJECT_DIR/packages/backend/.env"
echo ""
echo "文件内容模板："
echo "----------------------------------------"
cat << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://zilo:5sf3Em2EGwxi@localhost:5432/ziloproduction?schema=public"
JWT_SECRET="[第一个密钥]"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="[第二个密钥]"
JWT_REFRESH_EXPIRES_IN="30d"
CORS_ORIGIN="https://zilohq.com,http://zilohq.com,http://101.43.69.38"
EOF
echo "----------------------------------------"
echo ""
read -p "配置完成后，按回车键继续..."

echo ""
echo "步骤 3/8: 安装根目录依赖"
echo "=========================================="
cd "$PROJECT_DIR" || exit 1
echo "当前目录: $(pwd)"
$NODE_PATH/npm install
echo "✓ 根目录依赖安装完成"
echo ""

echo "步骤 4/8: 安装后端依赖"
echo "=========================================="
cd "$PROJECT_DIR/packages/backend" || exit 1
echo "当前目录: $(pwd)"
$NODE_PATH/npm install
echo "✓ 后端依赖安装完成"
echo ""

echo "步骤 5/8: 生成 Prisma 客户端"
echo "=========================================="
$NODE_PATH/npx prisma generate
echo "✓ Prisma 客户端生成完成"
echo ""

echo "步骤 6/8: 运行数据库迁移"
echo "=========================================="
$NODE_PATH/npx prisma migrate deploy
echo "✓ 数据库迁移完成"
echo ""

echo "步骤 7/8: 构建后端"
echo "=========================================="
$NODE_PATH/npm run build
echo "✓ 后端构建完成"
echo ""

echo "步骤 8/8: 构建前端"
echo "=========================================="
cd "$PROJECT_DIR/packages/frontend" || exit 1
echo "当前目录: $(pwd)"
$NODE_PATH/npm install
$NODE_PATH/npm run build
echo "✓ 前端构建完成"
echo ""

echo "=========================================="
echo "✓ 构建完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 使用 PM2 启动后端服务"
echo "2. 配置 Nginx"
echo "3. 配置域名解析"
echo "4. 申请 SSL 证书"
echo ""
