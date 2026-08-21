# 公众号作品投票系统 - 云端部署 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install --production

# 复制源码
COPY server.js ./
COPY public ./public

# 数据目录（Render 通过挂载持久磁盘覆盖到此）
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
