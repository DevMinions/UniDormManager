# UniDormManager 部署指南

## 📋 目录

- [环境要求](#环境要求)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [数据库配置](#数据库配置)
- [Nginx 配置](#nginx-配置)
- [Docker 部署](#docker-部署)
- [生产环境检查清单](#生产环境检查清单)

---

## 环境要求

### 服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04/22.04)
- **内存**: 最低 2GB，推荐 4GB+
- **磁盘**: 最低 20GB
- **网络**: 公网 IP，开放 80/443 端口

### 软件版本
| 软件 | 版本 | 说明 |
|------|------|------|
| Go | 1.21+ | 后端运行时 |
| Node.js | 18+ | 前端构建 |
| MySQL | 8.0+ | 数据库 |
| Redis | 6.0+ | 缓存 |
| Nginx | 1.20+ | Web 服务器 |

---

## 后端部署

### 1. 安装 Go

```bash
# 下载 Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 验证
go version
```

### 2. 克隆代码

```bash
cd /opt
git clone https://github.com/your-org/UniDormManager.git
cd UniDormManager/UniDormManagerServer
```

### 3. 编译

```bash
# 开发环境
go build -o server main.go

# 生产环境（Linux）
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server main.go
```

### 4. 配置文件

创建 `config.yaml`:

```yaml
server:
  port: 8080
  mode: production  # debug/release

database:
  host: localhost
  port: 3306
  user: unidorm
  password: your_password
  dbname: unidorm_db
  max_open_conns: 100
  max_idle_conns: 10

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: your_jwt_secret_key
  expire_hours: 24

log:
  level: info
  path: ./logs
  max_size: 100  # MB
  max_age: 30    # days

upload:
  path: ./uploads
  max_size: 10   # MB
  allowed_types: [".jpg", ".jpeg", ".png", ".gif"]
```

### 5. 启动服务

```bash
# 直接启动
./server

# 后台运行
nohup ./server > server.log 2>&1 &

# 使用 systemd（推荐）
sudo vim /etc/systemd/system/unidorm.service
```

systemd 配置:
```ini
[Unit]
Description=UniDormManager Server
After=network.target mysql.service redis.service

[Service]
Type=simple
User=unidorm
WorkingDirectory=/opt/UniDormManager/UniDormManagerServer
ExecStart=/opt/UniDormManager/UniDormManagerServer/server
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable unidorm
sudo systemctl start unidorm
sudo systemctl status unidorm
```

---

## 前端部署

### 1. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### 2. 构建

```bash
cd UniDormManager/UniDormManagerWeb

# 安装依赖
npm install

# 生产构建（产物在 dist/）
npm run build
```

### 3. Nginx 配置

```bash
sudo vim /etc/nginx/sites-available/unidorm
```

配置内容:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态资源
    location / {
        root /opt/UniDormManager/UniDormManagerWeb/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件访问
    location /uploads/ {
        alias /opt/UniDormManager/UniDormManagerServer/uploads/;
        expires 30d;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/unidorm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 数据库配置

### 1. 安装 MySQL

```bash
sudo apt update
sudo apt install mysql-server

# 安全配置
sudo mysql_secure_installation
```

### 2. 创建数据库

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE unidorm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'unidorm'@'localhost' IDENTIFIED BY 'your_password';

GRANT ALL PRIVILEGES ON unidorm_db.* TO 'unidorm'@'localhost';

FLUSH PRIVILEGES;
```

### 3. 执行迁移

```bash
cd UniDormManager/UniDormManagerServer

# 使用 migrate 工具或手动执行 SQL
mysql -u unidorm -p unidorm_db < migrations/init.sql
```

### 4. 安装 Redis

```bash
sudo apt install redis-server

# 配置密码
sudo vim /etc/redis/redis.conf
# 修改: requirepass your_redis_password

sudo systemctl restart redis
```

---

## Nginx 配置

### 反向代理优化

```nginx
upstream backend {
    server 127.0.0.1:8080 weight=5;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API 代理
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 限流
        limit_req zone=api_limit burst=20 nodelay;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 限流配置

```nginx
# 在 http 块中
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

---

## Docker 部署

### 1. 后端 Dockerfile

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /app/config.yaml .

EXPOSE 8080

CMD ["./server"]
```

### 2. 前端 Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:h5

FROM nginx:alpine
COPY --from=builder /app/dist/build/h5 /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: unidorm_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: unidorm_db
      MYSQL_USER: unidorm
      MYSQL_PASSWORD: user_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    networks:
      - unidorm_network

  redis:
    image: redis:6-alpine
    container_name: unidorm_redis
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - unidorm_network

  backend:
    build: ./UniDormManagerServer
    container_name: unidorm_backend
    depends_on:
      - mysql
      - redis
    environment:
      DB_HOST: mysql
      REDIS_HOST: redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "8080:8080"
    networks:
      - unidorm_network
    restart: unless-stopped

  frontend:
    build: ./UniDormManagerWeb
    container_name: unidorm_frontend
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - unidorm_network
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:

networks:
  unidorm_network:
    driver: bridge
```

### 4. 启动

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down

# 完全清理（包括数据）
docker-compose down -v
```

---

## 生产环境检查清单

### 安全配置
- [ ] 修改所有默认密码
- [ ] 配置 HTTPS
- [ ] 启用防火墙（只开放必要端口）
- [ ] 配置 CORS 白名单
- [ ] 启用 JWT Token 过期
- [ ] 配置请求限流

### 性能优化
- [ ] 启用 Gzip 压缩
- [ ] 配置静态资源缓存
- [ ] 数据库添加索引
- [ ] 启用 Redis 缓存
- [ ] 配置连接池

### 监控告警
- [ ] 配置日志收集
- [ ] 配置性能监控
- [ ] 配置错误告警
- [ ] 配置磁盘空间监控

### 备份策略
- [ ] 数据库每日备份
- [ ] 上传文件定期备份
- [ ] 配置文件版本控制

---

## 故障排查

### 后端无法启动
```bash
# 检查日志
tail -f /opt/UniDormManager/UniDormManagerServer/logs/server.log

# 检查端口占用
sudo lsof -i :8080

# 检查数据库连接
mysql -u unidorm -p -h localhost unidorm_db
```

### 前端访问不了
```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查前端文件是否存在
ls -la /opt/UniDormManager/UniDormManagerWeb/dist/

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 数据库连接失败
```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 检查用户权限
mysql -u root -p -e "SHOW GRANTS FOR 'unidorm'@'localhost';"

# 检查防火墙
sudo ufw status
```

---

## 更新部署

### 后端更新
```bash
cd /opt/UniDormManager
git pull

cd UniDormManagerServer
# 备份
mv server server.bak.$(date +%Y%m%d)

# 编译
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o server main.go

# 重启
sudo systemctl restart unidorm
```

### 前端更新
```bash
cd /opt/UniDormManager/UniDormManagerWeb
git pull

# 备份
mv dist dist.bak.$(date +%Y%m%d)

# 构建
npm ci
npm run build:h5

# Nginx 自动生效
```
