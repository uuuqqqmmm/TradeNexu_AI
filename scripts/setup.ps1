# TradeNexus AI v3.0 - 开发环境设置脚本 (PowerShell)
# 用法: .\scripts\setup.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   🚀 TradeNexus AI v3.0 - 开发环境设置                     ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[1/6] 检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js 未安装，请先安装 Node.js 20+" -ForegroundColor Red
    exit 1
}

# 检查 Docker
Write-Host "[2/6] 检查 Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "  ✅ $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Docker 未安装，单机版需要 Docker" -ForegroundColor Yellow
}

# 安装前端依赖
Write-Host "[3/6] 安装前端依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ 前端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  ❌ 前端依赖安装失败" -ForegroundColor Red
}

# 安装后端依赖
Write-Host "[4/6] 安装后端依赖..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ 后端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  ❌ 后端依赖安装失败" -ForegroundColor Red
}
Set-Location ..

# 生成 Prisma Client
Write-Host "[5/6] 生成 Prisma Client..." -ForegroundColor Yellow
Set-Location backend
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Prisma Client 生成完成" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Prisma Client 生成失败 (数据库未连接时正常)" -ForegroundColor Yellow
}
Set-Location ..

# 创建环境变量文件
Write-Host "[6/6] 检查环境变量..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✅ 已从 .env.example 创建 .env" -ForegroundColor Green
        Write-Host "  ⚠️ 请编辑 .env 文件填入您的 API Keys" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✅ .env 文件已存在" -ForegroundColor Green
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor White
Write-Host "  1. 编辑 .env 文件，填入 API Keys" -ForegroundColor Gray
Write-Host "  2. 启动前端: npm run dev" -ForegroundColor Gray
Write-Host "  3. 启动后端: cd backend && npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Docker 部署 (可选):" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor Gray
Write-Host ""
