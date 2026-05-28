# Docker 部署指南

本文档说明如何使用 Docker 运行 UniDormManager 项目。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 快速启动

### 1. 克隆项目（如果还没有）

```bash
cd /home/adamyu/CursorPorjects/UniDormManager
```

### 2. 配置环境变量（可选）

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### 3. 启动所有服务

```bash
docker-compose up -d
```

这将启动以下服务：
- **PostgreSQL** (端口 5432)
- **Redis** (端口 6379)
- **后端 API** (端口 8080)
- **前端 Web** (端口 3000)

### 4. 查看服务状态

```bash
docker-compose ps
```

### 5. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🌐 访问应用

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **健康检查**: http://localhost:8080/health

## 🔧 常用命令

### 停止服务

```bash
docker-compose down
```

### 停止并删除数据卷（⚠️ 会删除数据库数据）

```bash
docker-compose down -v
```

### 重新构建镜像

```bash
# 重新构建所有服务
docker-compose build

# 重新构建特定服务
docker-compose build backend
docker-compose build frontend
```

### 重启服务

```bash
docker-compose restart
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d unidorm
```

## 📊 数据库管理

### 初始化数据库

数据库会在后端服务首次启动时自动初始化（包括表结构和初始数据）。

### 手动执行 SQL

```bash
# 进入数据库容器
docker-compose exec postgres psql -U postgres -d unidorm

# 或者从本地执行
docker-compose exec -T postgres psql -U postgres -d unidorm < migrations/init.sql
```

### 备份数据库

```bash
docker-compose exec postgres pg_dump -U postgres unidorm > backup.sql
```

### 恢复数据库

```bash
docker-compose exec -T postgres psql -U postgres unidorm < backup.sql
```

## 🔐 默认账户

系统初始化后会创建默认管理员账户：

- **用户名**: `admin`
- **密码**: 后端首启时随机生成，日志中搜 `INITIAL PASSWORD`；或用 `ADMIN_INITIAL_PASSWORD` 环境变量预设

⚠️ **首启完成请立即登录并修改 admin 密码！**

## 🛠️ 开发模式

### 仅启动数据库和 Redis

```bash
docker-compose up -d postgres redis
```

然后在本地运行前后端：

```bash
# 后端
cd UniDormManagerServer
go run main.go

# 前端
cd UniDormManagerWeb
npm install
npm run dev
```

### 热重载开发

前端支持热重载，修改代码后会自动刷新。

## 🐛 故障排查

### 后端无法连接数据库

1. 检查 PostgreSQL 是否正常运行：
   ```bash
   docker-compose ps postgres
   ```

2. 检查数据库日志：
   ```bash
   docker-compose logs postgres
   ```

3. 检查环境变量是否正确：
   ```bash
   docker-compose exec backend env | grep DB_
   ```

### 前端无法访问后端 API

1. 检查后端是否正常运行：
   ```bash
   docker-compose ps backend
   curl http://localhost:8080/health
   ```

2. 检查前端 nginx 配置中的 API 代理设置

3. 检查浏览器控制台的网络请求

### 端口冲突

如果端口被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "3001:80"  # 前端改为 3001
  - "8081:8080"  # 后端改为 8081
```

## 📝 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 后端服务端口 | 8080 |
| `DB_HOST` | 数据库主机 | postgres |
| `DB_PORT` | 数据库端口 | 5432 |
| `DB_USER` | 数据库用户 | postgres |
| `DB_PASSWORD` | 数据库密码 | postgres |
| `DB_NAME` | 数据库名称 | unidorm |
| `REDIS_HOST` | Redis 主机 | redis |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `USE_CACHE` | 是否启用缓存 | true |
| `JWT_SECRET` | JWT 密钥 | (需设置) |
| `VITE_API_URL` | 前端 API 地址 | http://localhost:8080 |

## 🔒 生产环境建议

1. **修改默认密码**：立即修改数据库和 Redis 密码
2. **设置强 JWT 密钥**：使用随机生成的强密钥
3. **启用 HTTPS**：配置 SSL/TLS 证书
4. **配置防火墙**：限制数据库和 Redis 的外部访问
5. **定期备份**：设置数据库自动备份
6. **监控日志**：配置日志收集和监控
7. **资源限制**：为容器设置 CPU 和内存限制

## 📚 相关文档

- [API 文档](./UniDormManagerServer/API.md)
- [数据库文档](./UniDormManagerServer/DATABASE.md)
- [认证文档](./UniDormManagerServer/AUTH.md)

