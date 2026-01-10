const fs = require('fs');

const filePath = 'packages/backend/src/services/influencer.service.ts';

// 读取文件
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有可能的编码问题
content = content.replace(/手机�?/g, '手机号');
content = content.replace(/\r\n/g, '\n'); // 统一换行符

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ 文件编码已修复');
