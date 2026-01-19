"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const routes_1 = __importDefault(require("./routes"));
const prisma_1 = __importDefault(require("./lib/prisma"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // 允许没有 origin 的请求（如 Postman、Chrome 插件）
        if (!origin)
            return callback(null, true);
        // 允许 chrome-extension:// 协议
        if (origin.startsWith('chrome-extension://')) {
            return callback(null, true);
        }
        // 检查是否在允许列表中
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // 生产环境可以从环境变量读取
        if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Database connection check
app.get('/health/db', async (_req, res) => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// API routes
app.use('/api', routes_1.default);
// Error handling
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map