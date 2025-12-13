-- TradeNexus AI 数据库初始化脚本
-- 版本: v3.0
-- 此脚本在 PostgreSQL 容器首次启动时自动执行

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用 pgvector 扩展 (用于 RAG 向量搜索)
-- 注意: 需要使用支持 pgvector 的 PostgreSQL 镜像
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建用于全文搜索的配置
-- CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);

-- 设置默认时区
SET timezone = 'Asia/Shanghai';

-- 打印初始化完成信息
DO $$
BEGIN
    RAISE NOTICE 'TradeNexus AI 数据库初始化完成!';
END $$;
