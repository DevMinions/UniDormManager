# Changelog

所有 notable 的变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.2.0] - 2026-05-28

第二个 GitHub 开源发布。本版集中补齐对外可观察性与工程能力。

### ✨ 新增

- **文件上传** `POST /api/upload` — multipart,5MiB 限制,MIME 嗅探,image+pdf 白名单;`/uploads/<date>/<uuid>.<ext>` + 静态 serve
- **审计日志** `audit_logs` 表 + middleware 自动记录所有写操作 + `GET /api/audit-logs` 分页查询
- **SSE 实时流** `GET /api/audit-logs/stream` — 内置 broker,fetch+ReadableStream 消费,断开自动 unsubscribe
- **周期任务** robfig/cron/v3 + `cleanup-expired-tokens`(每日 03:00) + `scan-late-returns`(每日 02:00) + `GET /api/scheduler/jobs` 查注册任务
- **时序统计** `GET /api/statistics/repairs-by-day?days=N` — PostgreSQL `generate_series` 补 N 天连续无 gap
- **Web Dashboard 报修趋势** LineChart 三色(新增/已完成/待处理)
- **Web Dashboard 实时审计流** 面板,实时显示最近 10 条写操作
- **Prometheus 业务指标** `audit_events_total{method,status_class}` / `scheduler_job_runs_total{name,result}` / `sse_subscribers`
- **Render Blueprint** `render.yaml` — 一键 deploy PostgreSQL + 后端 + 前端
- **英文 README** `README.en.md` + 顶部语言切换
- **测试 harness** `tests/audit_uniapp.js` + `tests/upload_smoke.py`(主仓库 audit_api 从 36 → 38 项)

### 🔧 改进

- `PaginatedRequest` 删 `binding:"min=1"`,前端不传分页参数也走默认 1/10(不再 400)
- Web bundle code-split:react / recharts / lucide / gemini 各自 chunk,最大 386KB < 500KB
- `hooks/usePaginatedData.ts` 改静态 import api,消除 rollup dynamic-import 警告
- CI `deploy-staging/production` 占位 job → `deploy-render`(workflow_dispatch 手动触发 + Render hook)
- `actions/checkout@v6` · `setup-go@v6` · `codecov@v6` · `build-push-action@v7` · `codeql-action@v4` 升级

### 🗑️ 移除

- `UniDormManagerMini` / `UniDormManager-UniApp` 客户端 → 拆到 [DevMinions/UniDormManager-Mobile](https://github.com/DevMinions/UniDormManager-Mobile)
- `pages/RoomManagement_original.tsx` / `Students_original.tsx`(死代码备份)
- `docs/` 16 个内部诊断/重复/过时文档(API_DEBUG_GUIDE, FIX_STATUS_REPORT, TEST_REPORT, MIGRATION_GUIDE, ...)
- `models/ggml-base.bin` 141MB 历史 blob(用 git-filter-repo 从历史彻底清除)
- 全部 `admin123` 硬编码、私服 IP / Gitea URL / moltbot 本机路径

### 🐛 修复

- **B1** `rooms.floor` 列缺失(schema 与代码不符)
- **B2** `students.building` 列缺失
- **B3** `inspections` 表未由自动建表创建
- **B4** store 吞 DB 错误返空切片(GetAll* 签名加 error)
- **B5** RBAC 缺 6 个 permissions(access_logs/late_returns/room_swaps)
- **B6** `BuildInspectionQuery` 6 个 filter 分支重复 append 参数
- **B6b** `BuildRoomQuery` 同源 capacity filter 重复 append
- Mobile UniApp:删 messages 模块 + 修 late-returns filter + notices computed import
- Web ENV: `VITE_API_URL` 拼接 / Docker 镜像 lowercase / Dockerfile 路径
- CI 链上一段时间内的 Docker tag 大小写 / Go 版本不匹配 / publish job buildx 等

### 🔐 安全

- 默认 admin 密码硬编码 `admin123` 移除;首启 `crypto/rand` 16 字符随机密码 + 一次性日志输出(可 `ADMIN_INITIAL_PASSWORD` 预设)
- `cmd/init_admin` CLI 强制 `>= 8 字符 password` 参数,无默认
- GitHub Private Vulnerability Reporting 启用
- `main` 分支 ruleset:防 force push + 防 deletion(允许直推,适合单人维护)
- `SECURITY.md` / `CODE_OF_CONDUCT.md` / Issue & PR templates / dependabot.yml 加入

---

## [0.1.0] - 2026-05-28

首次 GitHub 开源。从 in-progress 内部分支整理成可对外发布的 v0.1.0。

### ✨ 新增

- Go 后端(Gin + pgx + PostgreSQL 16 + 可选 Redis)+ React 19 Web 管理端 + Docker Compose
- 11 个业务域,~60 API:auth / users / roles / permissions / students / buildings / rooms / repairs / notices / dashboard / inspections / room-swaps / access-logs / late-returns
- RBAC 权限管理(系统管理员通配所有权限)
- 审计回归 harness:`tests/audit_api.py` (36 项) + `tests/audit_web.js` (17 项)
- 主仓库 OSS 标准:LICENSE (MIT) / SECURITY / CODE_OF_CONDUCT / dependabot.yml / Issue & PR Templates / CI/CD Pipeline

详见 GitHub release: https://github.com/DevMinions/UniDormManager/releases/tag/v0.1.0

---

## [1.1.0] - 2024-03-16

### 🚀 二期更新

### ✨ 新增功能

#### 数据分析大屏
- 核心指标卡片（入住率、报修、评分等）
- 入住率趋势图表
- 报修类型分布
- 查寝评分分布
- 楼栋入住率对比
- 实时数据展示

#### 智能宿舍分配推荐
- 三步流程：选择学生 → 设置偏好 → 查看推荐
- 多维度偏好设置（作息/学习/整洁/社交/兴趣）
- 智能匹配算法，计算兼容性分数
- 可视化推荐结果

#### 数据导入导出增强
- 批量导入（学生/房间/楼栋/员工）
- 模板下载功能
- 数据预览和错误提示
- 导入/导出历史记录

#### 人脸识别门禁（预留接口）
- 设备管理接口
- 人脸库管理接口
- 识别记录接口
- WebSocket 实时连接

### 🔧 优化与改进

#### 性能优化
- 图片懒加载组件
- API 请求缓存机制
- 性能监控 Hooks
- 防抖节流工具

#### 代码优化
- 统一错误处理
- 规范常量定义
- 提取公共工具函数
- useAuth 权限 Hook

#### 安全加固
- 20+ 种输入校验规则
- XSS 防护
- 敏感数据加密
- 接口防重放保护
- 限流器

#### 测试覆盖
- Vitest 单元测试
- Playwright E2E 测试
- k6 性能压测
- API 集成测试

### 📦 部署准备

- Docker 多阶段构建
- docker-compose 编排
- GitHub Actions CI/CD
- Makefile 常用命令

---

## [1.0.0] - 2024-03-16

### 🎉 正式发布

### ✨ 新增功能

#### P0 核心功能
- 换寝申请功能 - 支持学生提交换寝申请
- 查寝排行榜 - 支持查看各宿舍评分排行
- 查寝评分录入 - 宿管员可录入宿舍评分
- 换寝审批 - 支持审批换寝申请

#### P1 安全管理
- 晚归告警功能 - 自动检测晚归学生
- 门禁记录查看 - 查看进出记录
- 门禁统计图表 - 高峰时段分析
- 晚归推送通知设置

#### P2 管理功能
- 楼栋管理 - 楼栋信息配置
- 角色权限管理 - 灵活的角色和权限配置
- 系统配置 - 通知/宿舍/查寝/报修/安全设置

#### P3 高级功能
- 消息中心 - 统一的消息通知入口
- 数据报表导出 - 支持 Excel/PDF/CSV 导出
- 微信订阅消息推送
- 短信通知服务
- 企业微信集成

---

## 版本说明

### 版本号规则
- `主版本号.次版本号.修订号`
- 主版本号：重大更新，可能不兼容
- 次版本号：新增功能，向后兼容
- 修订号：Bug 修复，向后兼容
