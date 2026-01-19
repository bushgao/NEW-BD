import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import routes from './routes';
import prisma from './lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS 配置 - 支持前端和 Chrome 插件
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  // Chrome 插件使用 chrome-extension:// 协议
];

app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 Postman、Chrome 插件）
    if (!origin) return callback(null, true);

    // 允许 chrome-extension:// 协议
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // 检查是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 生产环境可以从环境变量读取（支持逗号分隔的多个域名）
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      if (envOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection check
app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
