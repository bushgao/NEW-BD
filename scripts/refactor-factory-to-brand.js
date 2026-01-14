const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;

        // 替换规则（顺序重要）
        content = content.replace(/FactoryStatus/g, 'BrandStatus');
        content = content.replace(/FactoryStaff/g, 'BrandStaff');
        content = content.replace(/FactoryOwner/g, 'BrandOwner');
        content = content.replace(/factoryId/g, 'brandId');
        content = content.replace(/ownedFactory/g, 'ownedBrand');
        content = content.replace(/\.factory(?=[^a-zA-Z])/g, '.brand');
        content = content.replace(/user\.factory/g, 'user.brand');
        content = content.replace(/prisma\.factory/g, 'prisma.brand');
        content = content.replace(/tx\.factory/g, 'tx.brand');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified:', filePath);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error processing:', filePath, err.message);
        return false;
    }
}

function walkDir(dir, ext, callback) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !file.includes('node_modules')) {
            walkDir(fullPath, ext, callback);
        } else if (ext.some(e => file.endsWith(e))) {
            callback(fullPath);
        }
    });
}

let modifiedCount = 0;

// 后端代码
console.log('Processing backend...');
walkDir('packages/backend/src', ['.ts'], (file) => {
    if (replaceInFile(file)) modifiedCount++;
});

// 前端代码
console.log('Processing frontend...');
walkDir('packages/frontend/src', ['.ts', '.tsx'], (file) => {
    if (replaceInFile(file)) modifiedCount++;
});

console.log(`\nTotal files modified: ${modifiedCount}`);
