# TradeNexus AI - 数据库部署指南

> 本指南用于部署 PostgreSQL + pgvector，启用 Titans 长期记忆系统

## 📋 前置要求

- **Docker Desktop** (推荐) 或 本地 PostgreSQL 16+
- **Node.js** 18+

---

## 🚀 方案 A: Docker 一键部署 (推荐)

### 1. 安装 Docker Desktop

**Windows**:
1. 下载: https://www.docker.com/products/docker-desktop/
2. 安装并启动 Docker Desktop
3. 确保 WSL 2 已启用

**验证安装**:
```bash
docker --version
docker compose version
```

### 2. 启动数据库服务

```bash
cd TradeNexus_AI

# 启动 PostgreSQL + Redis
docker compose up -d postgres redis

# 查看服务状态
docker compose ps
```

### 3. 配置环境变量

编辑 `backend/.env`:
```env
DATABASE_URL=postgresql://admin:tradenexus2024@localhost:5432/tradenexus
REDIS_URL=redis://localhost:6379
```

### 4. 执行数据库迁移

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 执行迁移
npx prisma migrate dev --name init

# 查看数据库
npx prisma studio
```

### 5. 验证部署

```bash
# 启动后端
npm run start:dev

# 测试 Memory API
curl http://localhost:3000/memory/stats
```

**预期输出**:
```json
{
  "factualMemory": { "quotes": 0 },
  "semanticMemory": { "knowledgeChunks": 0 },
  "associativeMemory": { "relations": 0 },
  "conversationMemory": { "summaries": 0 },
  "totalMemories": 0
}
```

---

## 🔧 方案 B: 本地 PostgreSQL 安装

### Windows

1. 下载 PostgreSQL 16: https://www.postgresql.org/download/windows/
2. 安装时勾选 **pgvector** 扩展 (或后续手动安装)
3. 创建数据库:

```sql
-- 使用 pgAdmin 或 psql
CREATE DATABASE tradenexus;
CREATE USER admin WITH PASSWORD 'tradenexus2024';
GRANT ALL PRIVILEGES ON DATABASE tradenexus TO admin;

-- 启用 pgvector 扩展
\c tradenexus
CREATE EXTENSION IF NOT EXISTS vector;
```

### macOS

```bash
# 使用 Homebrew
brew install postgresql@16 pgvector

# 启动服务
brew services start postgresql@16

# 创建数据库
createdb tradenexus
psql tradenexus -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Linux (Ubuntu/Debian)

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql-16 postgresql-16-pgvector

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库
sudo -u postgres createdb tradenexus
sudo -u postgres psql tradenexus -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 📊 数据库 Schema 说明

### Titans 记忆系统表

| 表名 | 用途 | 记忆类型 |
|------|------|---------|
| `quotes` | 报价数据 (带 TTL) | 事实记忆 |
| `knowledge_chunks` | 法规/合同知识库 | 语义记忆 |
| `entity_relations` | 实体关系图谱 | 关联记忆 |
| `conversation_memories` | 对话摘要 | 对话记忆 |
| `supplier_capabilities` | 供应商能力 | 关联记忆 |

### 业务数据表

| 表名 | 用途 |
|------|------|
| `users` | 用户管理 |
| `products` | 产品/选品数据 |
| `sourcing_results` | 供应链货源 |
| `profit_calculations` | 利润计算 |
| `compliance_checks` | 合规检查 |
| `jobs` | 任务队列 |

---

## 🔍 常用命令

### Prisma 命令

```bash
# 生成 Client
npx prisma generate

# 开发迁移 (创建迁移文件)
npx prisma migrate dev --name <migration_name>

# 生产迁移 (只应用迁移)
npx prisma migrate deploy

# 重置数据库 (危险!)
npx prisma migrate reset

# 查看数据库
npx prisma studio

# 拉取现有数据库 Schema
npx prisma db pull
```

### Docker 命令

```bash
# 启动服务
docker compose up -d postgres redis

# 停止服务
docker compose stop

# 查看日志
docker compose logs -f postgres

# 进入数据库容器
docker exec -it tradenexus_db psql -U admin -d tradenexus

# 删除所有数据 (危险!)
docker compose down -v
```

### 数据库备份

```bash
# 备份
docker exec tradenexus_db pg_dump -U admin tradenexus > backup.sql

# 恢复
cat backup.sql | docker exec -i tradenexus_db psql -U admin -d tradenexus
```

---

## ⚠️ 故障排除

### 问题 1: pgvector 扩展不存在

```sql
-- 检查扩展是否可用
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- 如果不存在，需要安装 pgvector
-- Docker: 使用 pgvector/pgvector:pg16 镜像
-- 本地: 按系统安装 pgvector 包
```

### 问题 2: 连接被拒绝

```bash
# 检查服务是否运行
docker compose ps

# 检查端口
netstat -an | findstr 5432

# 检查防火墙
# Windows: 允许 5432 端口
```

### 问题 3: 迁移失败

```bash
# 重置迁移状态
npx prisma migrate resolve --rolled-back <migration_name>

# 强制重置 (会删除数据!)
npx prisma migrate reset --force
```

---

## 📌 下一步

1. ✅ 完成数据库部署
2. ✅ 执行 Prisma 迁移
3. 测试 Memory API:
   - `POST /memory/quote` - 保存报价
   - `GET /memory/quotes` - 查询报价
   - `POST /memory/search/hybrid` - 混合检索
4. 验证 AI 集成:
   - 对话时自动查询长期记忆
   - 新信息自动保存到记忆系统

---

*文档版本: v1.0*  
*更新日期: 2025-12-13*
