<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# TradeNexus AI

**跨境电商智能体协作平台** | Multi-Agent AI Platform for Cross-border E-commerce

[![Version](https://img.shields.io/badge/version-3.0-blue.svg)](https://github.com/uuuqqqmmm/TradeNexu_AI)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## 🎯 项目简介

TradeNexus AI 是一个基于多智能体协作的跨境电商决策支持系统，旨在帮助中国制造商和外贸从业者实现"中国制造 → 全球销售"的全流程智能化。

### 核心智能体

| 智能体                   | 职责                           |
| ------------------------ | ------------------------------ |
| 🎖️**AI 总管**    | 协调各智能体，生成综合分析报告 |
| 🔍**市场情报官**   | Amazon/TikTok/Shopee 数据分析  |
| 🧱**供应链总监**   | 1688 货源搜索、利润试算        |
| ⚖️**贸易合规官** | HS编码匹配、认证检查           |
| 👥**客户开发官**   | 多语言沟通、社媒挖掘           |

---

## 🚀 快速开始

### 方式一：前端开发模式

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Keys

# 3. 启动开发服务器
npm run dev
```

### 方式二：全栈开发模式 (v3.0)

```bash
# 1. 运行设置脚本
.\scripts\setup.ps1

# 2. 启动 Docker 服务 (数据库 + Redis)
docker-compose up -d postgres redis

# 3. 启动后端
cd backend && npm run start:dev

# 4. 启动前端 (新终端)
npm run dev
```

### 方式三：Docker 一键部署

```bash
# 1. 配置环境变量
cp .env.docker .env

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 前端: http://localhost
# API: http://localhost:3000
# API 文档: http://localhost:3000/api/docs
```

---

## 📁 项目结构

```
TradeNexus_AI/
├── src/                    # 前端源码 (React + Vite)
│   ├── components/         # UI 组件
│   ├── services/           # API 服务
│   └── types.ts            # 类型定义
│
├── backend/                # 后端源码 (Nest.js) [v3.0]
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证
│   │   │   ├── products/   # 产品管理
│   │   │   ├── sourcing/   # 供应链 (1688)
│   │   │   ├── compliance/ # 合规检查
│   │   │   ├── ai/         # AI 分析
│   │   │   └── jobs/       # 任务队列
│   │   ├── workers/        # 后台任务
│   │   └── prisma/         # 数据库
│   └── Dockerfile
│
├── docs/                   # 项目文档
│   ├── PROJECT_DOCUMENTATION.md
│   ├── DEVELOPMENT_ROADMAP_V3.md
│   └── SPRINT_TRACKER.md
│
├── docker-compose.yml      # Docker 编排
├── nginx.conf              # Nginx 配置
└── .env.example            # 环境变量模板
```

---

## ⚙️ 环境变量

| 变量名               | 必需 | 说明                                 |
| -------------------- | ---- | ------------------------------------ |
| `API_KEY`          | ✅   | Google Gemini API Key                |
| `VITE_APIFY_TOKEN` | ✅   | Apify API Token (Amazon/TikTok 数据) |
| `DB_PASSWORD`      | 后端 | PostgreSQL 密码                      |
| `JWT_SECRET`       | 后端 | JWT 签名密钥                         |

---

## 📖 文档

- [开发路线图 v3.0](docs/DEVELOPMENT_ROADMAP_V3.md)
- [Sprint 任务追踪](docs/SPRINT_TRACKER.md)
- [项目文档 v2.0](docs/PROJECT_DOCUMENTATION.md)

---

## 🛠️ 技术栈

**前端**

- React 18 + TypeScript
- Vite
- TailwindCSS
- Recharts
- Lucide Icons

**后端 (v3.0)**

- Nest.js
- Prisma + PostgreSQL
- Redis + BullMQ
- Puppeteer

**AI**

- Google Gemini API
- Apify (Amazon/TikTok Scraper)

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)
