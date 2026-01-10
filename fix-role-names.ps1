# 修复所有后端文件中的角色名称
# FACTORY_OWNER -> BRAND
# BUSINESS_STAFF -> BUSINESS

$files = @(
    "packages/backend/src/services/influencer.service.ts",
    "packages/backend/src/services/collaboration.service.ts",
    "packages/backend/src/services/staff-management.service.ts",
    "packages/backend/src/middleware/permission.middleware.ts"
)

foreach ($file in $files) {
    Write-Host "Processing $file..."
    
    # 读取文件内容
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # 替换角色名称
    $content = $content -replace "role === 'FACTORY_OWNER'", "role === 'BRAND'"
    $content = $content -replace "role === 'BUSINESS_STAFF'", "role === 'BUSINESS'"
    $content = $content -replace "userRole === 'BUSINESS_STAFF'", "userRole === 'BUSINESS'"
    $content = $content -replace "case 'FACTORY_OWNER':", "case 'BRAND':"
    $content = $content -replace "case 'BUSINESS_STAFF':", "case 'BUSINESS':"
    
    # 写回文件
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "✓ Fixed $file"
}

Write-Host "`n所有文件已修复！"
