# 🏠 UniDormManager 宿舍管理系统 - Docker 部署指南

这是一个功能完整的大学宿舍管理系统，现在包含了全新的业务功能模块：

## 🆕 新增业务功能

### 1. 📝 查寝评分系统
- **移动端友好的滑块评分界面**
- **6项评分指标**：地面清洁、床铺整理、违规电器、消防安全、晚归纪律、通风情况
- **实时计算总分**（0-100分）
- **房间选择和楼栋筛选**
- **历史记录分页显示**

### 2. 🏆 查寝排行榜（红黑榜）
- **三栏布局**：红榜（优秀宿舍） • 总排行 • 黑榜（需改进宿舍）
- **周/月切换时间范围**
- **楼栋筛选功能**
- **视觉化排名图标**（奖杯、奖牌、皇冠）
- **统计概览面板**
- **整改建议提示**

### 3. 🚨 晚归监控与报警系统
- **实时门禁监控**：显示最近记录，每30秒自动刷新
- **晚归告警管理**：待处理告警列表，支持标记已处理/忽略
- **智能筛选功能**：按方向、状态、楼栋筛选
- **状态可视化**：正常/晚归/未归用不同颜色和图标区分
- **处理记录追踪**：显示处理人和处理时间

### 4. 🔄 线上换寝申请系统
- **多级审批流程**：辅导员 → 学院 → 公寓中心三级审核
- **可视化流程**：进度条显示当前审批步骤
- **申请详情管理**：当前房间、目标房间、申请理由、紧急程度
- **审批操作**：通过/驳回按钮
- **状态管理**：待审核/已通过/已驳回

## 🚀 快速启动

### 前置要求
- Docker Desktop 或 Docker Engine
- Docker Compose
- 8GB+ 内存（推荐）
- 10GB+ 磁盘空间

### 一键启动
```bash
# 进入项目目录
cd /path/to/UniDormManager

# 执行启动脚本
./start.sh
```

### 手动启动
```bash
# 创建必要目录
mkdir -p logs postgres_data redis_data

# 构建并启动服务
docker-compose up --build -d

# 等待服务启动（约30秒）
docker-compose ps

# 检查服务状态
docker-compose logs -f
```

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 🎨 前端应用 | http://localhost:3000 | React 管理界面 |
| ⚙️ 后端API | http://localhost:8080 | Go RESTful API |
| 📚 API文档 | http://localhost:8080/swagger | Swagger 文档 |
| 🏥 查寝评分 | http://localhost:3000/inspections | 评分管理页面 |
| 🏆 查寝排行榜 | http://localhost:3000/rankings | 红黑榜展示 |
| 🚨 晚归监控 | http://localhost:3000/access-logs | 实时监控页面 |
| 🔄 换寝申请 | http://localhost:3000/workflow | 审批流程页面 |

## 🔐 默认登录

- **用户名**: `admin`
- **密码**: 首次启动后端时在日志中查找 `INITIAL PASSWORD`，或通过 `ADMIN_INITIAL_PASSWORD` 环境变量预设

## 🗄️ 数据库连接

```bash
# 连接 PostgreSQL
docker exec -it unidorm-postgres psql -U postgres -d unidorm

# 连接 Redis
docker exec -it unidorm-redis redis-cli
```

**连接信息**:
- 主机: localhost
- 端口: 5433 (PostgreSQL), 6380 (Redis)
- 用户名: postgres
- 密码: postgres
- 数据库: unidorm

## 📋 功能菜单

### 📊 核心功能
- 🏠 仪表盘
- 🏢 楼栋管理
- 🚪 房间管理
- 👥 学生管理
- 🔧 报修管理
- 📢 公告通知
- 🤖 AI 智能助手

### 🏢 业务审批
- 📝 查寝评分
- 🏆 红黑榜公示
- 🔄 换寝审批
- 🚨 晚归预警

### ⚙️ 系统管理
- 👤 用户管理
- 🛡️ 角色管理
- 🔐 权限列表

## 📝 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 停止并删除数据（注意：会删除数据）
docker compose down -v

# 重新构建
docker compose build

# 重启服务
docker compose restart
```

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :8080
   lsof -i :5433

   # 修改 docker-compose.yml 中的端口映射
   ```

2. **权限问题**
   ```bash
   # 将用户添加到 docker 组
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **内存不足**
   ```bash
   # 增加 Docker 内存限制
   # 在 docker-compose.yml 中添加 mem_limit
   ```

4. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose ps postgres

   # 查看数据库日志
   docker-compose logs postgres
   ```

## 🔄 数据持久化

系统使用 Docker 卷进行数据持久化：

- `postgres_data`: PostgreSQL 数据库数据
- `redis_data`: Redis 缓存数据
- `logs`: 应用日志文件

---

🎉 **享受使用 UniDormManager 宿舍管理系统！**

