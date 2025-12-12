# TradeNexus Backend - Dockerfile
# 用途: Nest.js API 服务

FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 创建日志目录
RUN mkdir -p /app/logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动命令
CMD ["npm", "run", "start:prod"]
