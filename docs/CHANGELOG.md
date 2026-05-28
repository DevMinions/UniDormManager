# Changelog

所有 notable 的变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.2.2] - 2026-05-28

### 🐛 修复

- **Students search 三列 AND 假绿** — `BuildStudentQuery` 串 `.WhereLike('s.name', s).WhereLike('s.student_id', s).WhereLike('s.major', s)`,`qb.Where` 自动 AND,要求三列同时含 search,绝大多数学生不符合 → 后端返 total=0。Students 页面搜索框输入任何东西后列表立刻变空,看起来像"无匹配"。改成单条 OR + 同一 `$n` 复用,跟 `BuildRoomQuery` 风格一致

### 🧪 测试

- **`tests/audit_web_crud_students.js`** 新文件 — Students 完整 UI CRUD 10 项(create → search 验三列 OR → edit → delete with `window.confirm` accept → 列表同步)
- baseline **110/110 全绿** + 5 包 ok(从 100/100 → 110/110)

---

## [0.2.1] - 2026-05-28

文档 / 监控 / 测试 收尾版。无 API 变更,无 schema 变更,直接覆盖 v0.2.0 部署。

### 📚 文档

- **API.md** 加 "v0.2.0 新增接口" 章节(此前 doc 停留在 v0.1.0):
  `POST /api/upload` · `GET /api/statistics/repairs-by-day` ·
  `GET /api/audit-logs` · `GET /api/audit-logs/stream`(含前端 SSE 消费示例) ·
  `GET /api/scheduler/jobs`
- **ARCHITECTURE.md** 新文件 — 7 张 Mermaid 图:
  - C4 L1 系统上下文 / L2 容器视图 / L3 后端包分层
  - 写请求 + audit 链 sequence(client 拿到 201 后异步写库 + broker.Publish)
  - JWT + RBAC 校验 sequence
  - Dashboard 并行拉 stats + repairs-by-day 数据流
  - Render Blueprint 部署拓扑
- README / README.en.md 加 ARCHITECTURE.md 链接

### 📊 监控

- **Grafana 默认 dashboard** `grafana/provisioning/dashboards/unidorm-overview.json` —
  此前 provisioning 目录是空的,起 compose 看不到图。本 dashboard 走 file
  provisioning 自动 load,开机即可见。5 行 11 panel:
  - 业务概览 stat:students / rooms / sse_subscribers / active_users / 未完成报修
  - HTTP:请求速率 by status(stack) + topk 8 endpoint p95
  - 审计:audit_events rate by method + by status_class(2xx 绿 / 4xx 黄 / 5xx 红)
  - Scheduler:scheduler_job_runs_total 累计 by (name, result)
  - 登录尝试 by status(failed 红 / success 绿)
  - schemaVersion 39 兼容 Grafana 10+,UID 固定 `unidorm-overview`

### 🧪 测试

- **`tests/audit_web_crud.js`** 新文件 — Buildings 完整 UI CRUD 14 项:
  UI Create → UI Edit → API Delete → 列表同步验证。脚本注释带 3 个 e2e 坑的踩坑笔记:
  多卡片精确锁定 / `pressSequentially` 替代 `.fill()` 触发 React onChange /
  HashRouter 同 hash 二次 goto 不重挂载
- **baseline 全绿** 100/100 + 5 包 ok:audit_api 38/38 · audit_web 17/17 ·
  audit_web_crud 14/14 · vitest 31/31 · `go test ./...` 5 包 ok

### 🐛 修复

- **E2E click 30s actionability 卡死** — vite preview dist 下,framer-motion 入场
  动画阻塞 `button.click()` 30s。`tests/audit_web.js` + `audit_web_crud.js`
  全部改 `{ force: true }`,input 换 `.focus()`,注释带根因
- **TestSetJWTSecret env 污染** — `SetJWTSecret` 在 secret 无效时 fallback
  到 `$JWT_SECRET`;以前本地带 env 跑 baseline 偶尔假绿。子测加
  `t.Setenv('JWT_SECRET', '')` 用 testing 自带回滚机制隔离

### 🔧 改进

- `go.mod`:`robfig/cron/v3` 提到 direct(P3 加 scheduler 时通过 indirect 引入,`go mod tidy` 修正)

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
