# 数据库持久化和缓存配置指南

## 概述

项目现在**必须**使用 PostgreSQL 数据库进行数据持久化：
- **数据库存储** - 使用 PostgreSQL 持久化数据（必需）
- **Redis 缓存** - 可选，用于提升性能

## 快速开始

**注意**: 本项目现在**必须**使用 PostgreSQL 数据库。数据库连接失败时服务器将无法启动。

### 1. 使用 PostgreSQL 数据库（必需）

#### 1.1 安装 PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)

#### 1.2 创建数据库

```bash
# 登录 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE unidorm;
CREATE USER unidorm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE unidorm TO unidorm_user;
\q
```

#### 1.3 运行数据库迁移

数据库表会在首次连接时自动创建，或者手动执行：

```bash
psql -U unidorm_user -d unidorm -f migrations/init.sql
```

#### 1.4 配置环境变量

创建 `.env` 文件或设置环境变量：

```bash
export USE_DB=true
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=unidorm_user
export DB_PASSWORD=your_password
export DB_NAME=unidorm
export DB_SSLMODE=disable
```

#### 1.5 运行服务器

```bash
go run main.go
```

### 2. 启用 Redis 缓存（可选）

#### 2.1 安装 Redis

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
```

**macOS:**
```bash
brew install redis
```

**Windows:**
下载并安装 [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

#### 2.2 启动 Redis

```bash
redis-server
```

#### 2.3 配置环境变量

```bash
export USE_DB=true
export USE_CACHE=true
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=  # 如果设置了密码
```

#### 2.4 运行服务器

```bash
go run main.go
```

## 环境变量配置

### 完整配置示例

```bash
# 服务器配置
PORT=8080

# 数据库配置（必需）
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=unidorm
DB_SSLMODE=disable

# Redis 配置（可选）
USE_CACHE=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 缓存策略

### 缓存过期时间

- **短时间缓存（5分钟）**: 房间列表、报修列表、仪表板统计
- **中等时间缓存（15分钟）**: 学生列表、公告列表
- **长时间缓存（1小时）**: 楼栋列表（变更频率低）

### 缓存失效

当数据发生变更时，相关缓存会自动清除：
- 创建/更新/删除操作会清除列表缓存
- 单个资源更新会清除该资源的缓存
- 仪表板统计会在相关数据变更时清除

## 性能优化建议

### 1. 数据库优化

- 使用连接池（已实现）
- 创建适当的索引（已实现）
- 定期清理旧数据

### 2. 缓存优化

- 对于频繁查询的数据启用缓存
- 根据数据更新频率调整缓存过期时间
- 监控缓存命中率

### 3. 查询优化

- 使用分页查询大量数据
- 避免 N+1 查询问题
- 使用数据库视图优化复杂查询

## Docker 部署

### docker-compose.yml 示例

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: unidorm
      POSTGRES_USER: unidorm_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      USE_DB: "true"
      USE_CACHE: "true"
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: unidorm_user
      DB_PASSWORD: your_password
      DB_NAME: unidorm
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

## 故障排除

### 数据库连接失败

1. 检查 PostgreSQL 是否运行：`sudo systemctl status postgresql`
2. 检查连接信息是否正确
3. 检查防火墙设置

### Redis 连接失败

1. 检查 Redis 是否运行：`redis-cli ping`
2. 检查 Redis 配置
3. 检查网络连接

### 缓存不生效

1. 确认 `USE_CACHE=true` 已设置
2. 检查 Redis 连接状态
3. 查看日志确认缓存操作

## 数据迁移

如果需要迁移现有数据到新的数据库：

1. 导出现有数据（使用数据库导出工具）
2. 导入到 PostgreSQL
3. 验证数据完整性
4. 更新环境变量
5. 重启服务器

## 监控和维护

### 数据库维护

```sql
-- 查看表大小
SELECT pg_size_pretty(pg_total_relation_size('students'));

-- 查看连接数
SELECT count(*) FROM pg_stat_activity;

-- 清理旧数据（示例）
DELETE FROM repair_requests WHERE status = 'Completed' AND created_at < NOW() - INTERVAL '1 year';
```

### Redis 维护

```bash
# 查看内存使用
redis-cli INFO memory

# 查看键数量
redis-cli DBSIZE

# 清理所有缓存
redis-cli FLUSHDB
```

## 最佳实践

1. **开发环境**: 使用本地 PostgreSQL 数据库
2. **测试环境**: 使用数据库，可选启用缓存
3. **生产环境**: 使用数据库 + Redis 缓存，获得最佳性能

4. **数据备份**: 定期备份 PostgreSQL 数据库
5. **监控**: 监控数据库和 Redis 的性能指标
6. **日志**: 记录重要操作和错误信息

