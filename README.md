# UniDormManager

> 宿舍管理系统 - 基于 Go + Vue3 的现代化宿舍管理解决方案

[![Go](https://img.shields.io/badge/Go-1.23+-blue)](https://golang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.0+-green)](https://vuejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ 项目简介

UniDormManager 是一套完整的宿舍管理系统，提供学生信息管理、宿舍分配、报修处理、公告通知、查寝评分、门禁记录等功能。

### 核心功能

- 🎓 **学生管理** - 学生信息维护、宿舍分配
- 🏢 **楼栋管理** - 楼栋信息、房间管理
- 🔧 **报修管理** - 报修请求处理、状态跟踪
- 📢 **公告管理** - 公告发布、通知管理
- 📊 **查寝评分** - 查寝记录、评分统计、排行榜
- 🚪 **门禁管理** - 门禁记录、晚归预警
- 🔄 **换寝申请** - 在线换寝申请、审批流程
- 👥 **用户权限** - RBAC权限管理、角色配置

---

## 🏗️ 技术栈

### 后端
- **语言**: Go 1.23+
- **框架**: Gin
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **监控**: Prometheus + Grafana

### 前端
- **框架**: Vue 3 + Vite
- **UI库**: Tailwind CSS
- **图表**: Recharts
- **HTTP**: Fetch API
- **路由**: React Router DOM

---

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- Git

### Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://git.adamyu.top:20443/adamyu/UniDormManager.git
cd UniDormManager

# 2. 启动所有服务
docker compose up -d

# 3. 导入测试数据（可选）
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql

# 4. 访问系统
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# Grafana: http://localhost:3001
```

### 默认账号

- **用户名**: `admin`
- **密码**: 首次启动后端时会在日志中打印一次（搜索 `INITIAL PASSWORD`），或通过 `ADMIN_INITIAL_PASSWORD` 环境变量预设

⚠️ 首启完成请立即登录并修改 admin 密码。

---

## 📚 文档

- [快速开始指南](docs/QUICK_START.md)
- [数据库初始化](docs/DATABASE_INIT.md)
- [Docker部署指南](docs/DOCKER.md)
- [开发备忘录](docs/DEVELOPMENT_MEMO.md)
- [贡献指南](CONTRIBUTING.md)

---

## 🛠️ 开发

### 环境配置

```bash
# 后端
cd UniDormManagerServer
go mod download
go run main.go

# 前端
cd UniDormManagerWeb
npm install
npm run dev
```

### 工作流

本项目采用规范的 Git 工作流：

```
feature/* (功能开发) → dev (开发测试) → master (生产发布)
```

详细的分支管理规范请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📊 项目结构

```
UniDormManager/
├── UniDormManagerServer/    # Go后端
│   ├── handlers/              # API处理器
│   ├── models/                # 数据模型
│   ├── database/              # 数据库操作
│   ├── store/                 # 数据存储层
│   ├── cache/                 # Redis缓存
│   └── main.go                # 主程序
├── UniDormManagerWeb/        # Vue3前端
│   ├── pages/                 # 页面组件
│   ├── components/            # 共享组件
│   ├── services/              # API服务
│   ├── contexts/              # React Context
│   └── types.ts               # TypeScript类型定义
├── scripts/                   # SQL脚本
├── docker-compose.yml         # Docker编排
└── CONTRIBUTING.md            # 贡献指南
```

---

## 📝 提交规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` Bug修复
- `refactor:` 代码重构
- `docs:` 文档更新
- `style:` 代码格式
- `test:` 测试相关
- `chore:` 构建/工具

示例：`feat: 添加查寝评分功能`

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

详细指南请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 👥 作者

- [adamyu](https://git.adamyu.top:20443/adamyu)

---

## 📮 反馈

如有问题或建议，请提交 Issue 或联系项目维护者。

---

**最后更新**: 2026-01-31
