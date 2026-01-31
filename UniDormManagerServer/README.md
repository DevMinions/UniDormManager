# UniDorm Manager Server

大学宿舍管理系统后端服务，使用 Go 1.22+ 和 Gin 框架构建的 RESTful API。

## 功能特性

- ✅ 学生管理（CRUD）
- ✅ 楼栋管理（CRUD）
- ✅ 房间管理（CRUD）
- ✅ 报修管理（CRUD）
- ✅ 公告通知（CRUD）
- ✅ 仪表板统计数据
- ✅ PostgreSQL 数据库持久化
- ✅ Redis 缓存支持（可选）
- ✅ CORS 支持
- ✅ 请求日志记录
- ✅ 输入验证
- ✅ 错误处理

## 技术栈

- **语言**: Go 1.23+
- **HTTP 框架**: Gin Web Framework (`github.com/gin-gonic/gin`)
- **数据库**: PostgreSQL (`github.com/jackc/pgx/v5`)
- **缓存**: Redis (`github.com/redis/go-redis/v9`) - 可选
- **UUID**: `github.com/google/uuid`

## 前置要求

- Go 1.23 或更高版本
- PostgreSQL 12 或更高版本
- Redis 6 或更高版本（可选，用于缓存）

## 项目结构

```
UniDormManagerServer/
├── main.go              # 主程序入口
├── go.mod              # Go 模块定义
├── config/             # 配置管理
│   └── config.go
├── database/           # 数据库层
│   └── database.go
├── cache/              # 缓存层（可选）
│   └── cache.go
├── models/             # 数据模型
│   └── models.go
├── store/              # 数据存储层
│   ├── interface.go    # 存储接口
│   └── store_db.go     # 数据库存储实现
├── handlers/           # HTTP 处理器
│   ├── students.go
│   ├── buildings.go
│   ├── rooms.go
│   ├── repairs.go
│   ├── notices.go
│   └── dashboard.go
├── middleware/         # 中间件
│   └── middleware.go
└── migrations/         # 数据库迁移脚本
    └── init.sql
```

## 快速开始

### 1. 安装 PostgreSQL

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

### 2. 创建数据库

```bash
# 登录 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE unidorm;
CREATE USER unidorm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE unidorm TO unidorm_user;
\q
```

### 3. 配置环境变量

创建 `.env` 文件或设置环境变量：

```bash
# 服务器配置
export PORT=8080

# 数据库配置（必需）
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=unidorm_user
export DB_PASSWORD=your_password
export DB_NAME=unidorm
export DB_SSLMODE=disable

# Redis 配置（可选）
export USE_CACHE=true
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=
```

### 4. 安装依赖

```bash
cd UniDormManagerServer
go mod download
```

### 5. 运行数据库迁移

数据库表会在首次连接时自动创建，或者手动执行：

```bash
psql -U unidorm_user -d unidorm -f migrations/init.sql
```

### 6. 运行服务器

```bash
go run main.go
```

服务器将在 `http://localhost:8080` 启动。

**注意**: 如果数据库连接失败，服务器将无法启动。请确保 PostgreSQL 正在运行且配置正确。

## API 端点

### 学生管理

- `GET /api/students` - 获取所有学生
- `GET /api/students/{id}` - 获取指定学生
- `POST /api/students` - 创建学生
- `PUT /api/students/{id}` - 更新学生
- `DELETE /api/students/{id}` - 删除学生

### 楼栋管理

- `GET /api/buildings` - 获取所有楼栋
- `GET /api/buildings/{id}` - 获取指定楼栋
- `POST /api/buildings` - 创建楼栋
- `PUT /api/buildings/{id}` - 更新楼栋
- `DELETE /api/buildings/{id}` - 删除楼栋

### 房间管理

- `GET /api/rooms` - 获取所有房间
- `GET /api/rooms/{id}` - 获取指定房间
- `POST /api/rooms` - 创建房间
- `PUT /api/rooms/{id}` - 更新房间
- `DELETE /api/rooms/{id}` - 删除房间

### 报修管理

- `GET /api/repairs` - 获取所有报修请求
- `GET /api/repairs/{id}` - 获取指定报修请求
- `POST /api/repairs` - 创建报修请求
- `PUT /api/repairs/{id}` - 更新报修请求
- `DELETE /api/repairs/{id}` - 删除报修请求

### 公告通知

- `GET /api/notices` - 获取所有公告
- `GET /api/notices/{id}` - 获取指定公告
- `POST /api/notices` - 创建公告
- `PUT /api/notices/{id}` - 更新公告
- `DELETE /api/notices/{id}` - 删除公告

### 仪表板

- `GET /api/dashboard/stats` - 获取仪表板统计数据

### 健康检查

- `GET /health` - 健康检查端点

## 请求示例

### 创建学生

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "studentId": "2023001",
    "major": "计算机科学",
    "status": "Active"
  }'
```

### 创建报修请求

```bash
curl -X POST http://localhost:8080/api/repairs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "水龙头漏水",
    "description": "浴室洗脸盆水龙头持续漏水",
    "roomNumber": "101",
    "priority": "Medium"
  }'
```

### 获取仪表板统计

```bash
curl http://localhost:8080/api/dashboard/stats
```

## 数据模型

详见 `API.md` 文档。

## 错误响应格式

```json
{
  "error": "error_code",
  "message": "错误描述信息"
}
```

常见错误码：
- `bad_request` - 请求参数错误
- `not_found` - 资源未找到
- `method_not_allowed` - HTTP 方法不允许
- `internal_server_error` - 服务器内部错误

## 数据库配置

详细配置说明请参考 `DATABASE.md` 文档。

## 缓存配置

Redis 缓存是可选的，但强烈建议在生产环境中启用。详细说明请参考 `DATABASE.md` 文档。

## 开发说明

### 添加新功能

1. 在 `models/models.go` 中定义数据模型
2. 在 `database/database.go` 中添加表结构
3. 在 `store/store_db.go` 中实现存储方法
4. 在 `handlers/` 中创建处理器
5. 在 `main.go` 中注册路由

## 故障排除

### 数据库连接失败

1. 检查 PostgreSQL 是否运行：`sudo systemctl status postgresql`
2. 检查连接信息是否正确
3. 检查防火墙设置
4. 查看服务器日志获取详细错误信息

### Redis 连接失败

如果 Redis 连接失败，服务器会继续运行但不使用缓存。检查：
1. Redis 是否运行：`redis-cli ping`
2. Redis 配置是否正确

## 许可证

MIT License
