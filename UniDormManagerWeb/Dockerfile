# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖（包含类型定义和缺失的peer依赖）
RUN npm install --legacy-peer-deps && npm install -D --legacy-peer-deps @types/react @types/react-dom && npm install --legacy-peer-deps react-is

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段：使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

