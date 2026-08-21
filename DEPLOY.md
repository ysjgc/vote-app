# 云端部署指南

本投票系统支持部署到免费云平台（如 Render），获得稳定的公网 HTTPS 链接，外部用户无需本机在线即可访问。

## 方式一：Render 一键部署（推荐）

1. 将本项目推送到您的 GitHub 仓库：
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

2. 登录 [Render](https://render.com)（可用 GitHub 账号免费注册）

3. 在 Dashboard 点击 **New + → Blueprint**，选择本仓库

4. Render 会自动读取 `render.yaml` 完成部署，自动分配公网链接
   （格式类似 `https://zhuangtou-vote.onrender.com`）

5. 部署完成后即获得公网地址，可生成二维码分享给外部用户

### 数据持久化说明
- `render.yaml` 已配置 1GB 持久磁盘挂载到 `/data`
- 投票数据保存在 `/data/votes.json`，实例重启/重新部署不会丢失
- 截止时间到后，您可在 Render 后台停止该服务即可关闭投票

## 方式二：Docker 部署（任意支持 Docker 的云主机）

```bash
docker build -t vote-app .
docker run -d -p 3000:3000 -v vote_data:/data -e DATA_DIR=/data vote-app
```

## 方式三：其他 Node 平台（Railway / Fly.io 等）

- 启动命令：`node server.js`
- 环境变量：`PORT`（平台自动注入）、`DATA_DIR`（指向持久存储目录）
- 健康检查：`/api/works`

## 部署后
- 访问公网地址即可投票（功能与本地一致：检索、限选3个、限投3次、截止时间）
- 可在 [二维码生成工具](https://cli.im) 把公网地址生成二维码
