# AI助手迁移部署指南

> **目标**: 将这个AI助手部署到新服务器上
> **适用场景**: 你想在新服务器上运行类似的AI助手
> **前提条件**: 新服务器已安装Docker、Git

---

## 🚀 快速开始（最简单的方式）

### 方案1：使用Docker镜像（推荐）

#### 步骤1：在当前服务器打包镜像

```bash
cd /home/moltbot/workspace/UniDormManager
docker compose build -t unidorm-backend:latest .

# 保存镜像到文件
docker save unidorm-backend:latest | gzip > unidorm-backend.tar.gz
```

#### 步骤2：传输到新服务器

```bash
# 使用scp传输
scp unidorm-backend.tar.gz user@your-new-server:/home/user/

# 或者使用rsync
rsync -avz unidorm-backend.tar.gz user@your-new-server:/home/user/
```

#### 步骤3：在新服务器加载镜像

```bash
# 解压镜像
gunzip -c unidorm-backend.tar.gz | docker load

# 启动容器
cd /path/to/project
docker compose up -d
```

---

## 🐧 方案2：在新服务器从源码构建

### 步骤1：克隆项目到新服务器

```bash
# 在新服务器上执行
git clone https://git.adamyu.top:20443/adamyu/UniDormManager.git
cd UniDormManager
git checkout dev
```

### 步骤2：在新服务器安装Docker和Docker Compose

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# CentOS/RHEL
sudo yum install -y docker docker-compose

# 添加当前用户到docker组
sudo usermod -aG $USER docker
newgrp docker
```

### 步骤3：配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑.env文件
nano .env
```

**.env文件配置示例**：
```bash
# 数据库配置
POSTGRES_DB=unidorm
POSTGRES_USER=unidorm
POSTGRES_PASSWORD=YourSecurePassword123!@#  # 修改为强密码
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YourSecureRedisPass123!@#  # 修改为强密码

# JWT配置
JWT_SECRET=YourSuperSecretKeyChangeThisInProduction2026!@#
JWT_EXPIRATION=86400  # 24小时

# 服务器配置
SERVER_PORT=8080
SERVER_MODE=production

# 微信小程序配置（可选）
WECHAT_APPID=your_wechat_appid
WECHAT_APPSECRET=your_wechat_appsecret
```

### 步骤4：启动服务

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 查看服务状态
docker compose ps
```

---

## 🔑 重要安全配置

### 必须修改的默认配置

| 配置项 | 原值 | 新值 | 说明 |
|--------|------|------|------|
| **数据库密码** | `postgres` | `SecurePass123!` | 修改为强密码 |
| **Redis密码** | `redis` | `SecureRedisPass123!` | 修改为强密码 |
| **JWT密钥** | `unidorm-secret-key` | `随机字符串` | 修改为32位随机字符串 |
| **API端口** | `8080` | `8080` | 根据需要修改 |
| **服务器模式** | `development` | `production` | 生产环境 |

### 生成随机JWT密钥

```bash
# 生成32位随机字符串
openssl rand -hex 16

# 或使用python
python3 -c "import secrets; print(secrets.token_hex(16))"
```

---

## 📊 完整部署步骤

### 阶段1：环境准备

```bash
# 1. 安装Docker
sudo apt-get install -y docker.io docker-compose-plugin

# 2. 安装Git
sudo apt-get install -y git

# 3. 添加用户到docker组
sudo usermod -aG $USER docker
newgrp docker

# 4. 验证安装
docker --version
docker compose version
```

### 阶段2：项目部署

```bash
# 1. 克隆项目
git clone https://git.adamyu.top:20443/adamyu/UniDormManager.git
cd UniDormManager

# 2. 切换到dev分支
git checkout dev

# 3. 配置环境变量
cp .env.example .env
nano .env  # 修改数据库密码、Redis密码、JWT密钥

# 4. 启动服务
docker compose up -d --build

# 5. 检查服务状态
docker compose ps

# 6. 查看日志
docker compose logs -f
```

### 阶段3：验证部署

```bash
# 1. 测试API端点
curl http://your-server:8080/health

# 2. 测试登录
curl -X POST http://your-server:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 3. 测试Dashboard
curl http://your-server:8080/api/dashboard/stats
```

---

## 🔧 Docker Compose配置详解

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: unidorm-postgres
    environment:
      POSTGRES_DB: unidorm
      POSTGRES_USER: unidorm
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - backend
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: unidorm-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - backend
    restart: unless-stopped

  backend:
    build: .
    container_name: unidorm-backend
    ports:
      - "${SERVER_PORT:-8080}:8080"
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=unidorm
      - POSTGRES_USER=unidorm
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=${JWT_EXPIRATION}
      - SERVER_MODE=${SERVER_MODE}
    depends_on:
      - postgres
      - redis
    networks:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

---

## 🌐 网络和域名配置

### 如果使用域名

1. **配置Nginx反向代理**（推荐）

```nginx
# /etc/nginx/sites-available/unidorm
server {
    listen 80;
    server_name your-domain.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. **启用SSL证书**

```bash
# 使用Let's Encrypt免费证书
sudo apt-get install certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com
```

---

## 📱 小程序配置

### 更新API地址

在 `UniDormManagerMini/app.js` 中修改：

```javascript
App({
  globalData: {
    baseUrl: 'https://your-domain.com', // 修改为你的域名
    // ...
  }
})
```

### 微信小程序后台配置

1. 登录微信小程序后台
2. 进入"开发" → "开发设置"
3. 配置服务器域名白名单：
   - `https://your-domain.com`
   - `wss://your-domain.com` (WebSocket)
4. 修改服务器域名（正式环境）：
   - `https://your-domain.com`

---

## 🗄️ 数据备份和迁移

### 备份数据（旧服务器）

```bash
# 备份PostgreSQL
docker exec -it unidorm-postgres pg_dump -U unidorm unidorm > unidorm_backup_$(date +%Y%m%d).sql

# 备份Redis
docker exec unidorm-redis redis-cli BGSAVE
docker cp unidorm-redis:/data/dump.rdb redis_$(date +%Y%m%d).rdb
```

### 恢复数据（新服务器）

```bash
# 恢复PostgreSQL
docker exec -i unidorm-postgres psql -U unidorm unidorm < /path/to/unidorm_backup.sql

# 恢复Redis
docker stop unidorm-redis
docker cp /path/to/redis_*.rdb unidorm-redis:/data/dump.rdb
docker start unidorm-redis
```

---

## 🔍 故障排查

### 问题1：容器启动失败

```bash
# 查看容器日志
docker compose logs -f backend

# 检查容器状态
docker compose ps

# 重启容器
docker compose restart backend
```

### 问题2：数据库连接失败

```bash
# 检查PostgreSQL容器
docker exec -it unidorm-postgres psql -U unidorm -h localhost -c "SELECT version();"

# 检查网络连接
docker network inspect backend
```

### 问题3：API无法访问

```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 8080/tcp

# 检查端口监听
netstat -tlnp | grep 8080
```

### 问题4：Redis无法连接

```bash
# 检查Redis容器
docker exec -it unidorm-redis redis-cli PING

# 检查Redis密码
docker exec -it unidorm-redis redis-cli -a YOUR_PASSWORD PING
```

---

## 📊 监控和维护

### 日志查看

```bash
# 查看所有日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f postgres

# 查看最近100行日志
docker compose logs --tail=100
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看容器详情
docker inspect unidorm-backend
```

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/unidorm"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份PostgreSQL
docker exec unidorm-postgres pg_dump -U unidorm unidorm > $BACKUP_DIR/postgres_$DATE.sql

# 备份Redis
docker exec unidorm-redis redis-cli BGSAVE
sleep 5
docker cp unidorm-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "*.sql" -mtime +7d -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7d -delete

echo "Backup completed: $DATE"
```

---

## 📋 部署检查清单

- [ ] Docker已安装
- [ ] Docker Compose已安装
- [ ] Git已安装
- [ ] 用户已添加到docker组
- [ ] 项目已克隆到新服务器
- [ ] 环境变量已配置（.env文件）
- [ ] 数据库密码已修改
- [ ] Redis密码已修改
- [ ] JWT密钥已修改
- [ ] Docker容器已启动
- [ ] 所有服务状态正常
- [ ] API端点可访问
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 登录功能测试通过
- [ ] Dashboard功能测试通过
- [ ] Nginx反向代理已配置（如需要）
- [ ] SSL证书已配置（如需要）
- [ ] 防火墙规则已配置
- [ ] 小程序后台已配置域名白名单
- [ ] 小程序API地址已更新
- [ ] 数据库已备份
- [ ] 监控已配置

---

## 🎯 快速命令集

```bash
# 克隆项目
git clone https://git.adamyu.top:20443/adamyu/UniDormManager.git
cd UniDormManager && git checkout dev

# 配置环境
cp .env.example .env
nano .env

# 启动服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 清理和重建
docker compose down -v
docker compose up -d --build
```

---

**🎉 按照这个指南，你就可以在新服务器上成功部署一个类似的AI助手了！**

**需要我解释任何步骤吗？或者你有其他需求？** 🍬
