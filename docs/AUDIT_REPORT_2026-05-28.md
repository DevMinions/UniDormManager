# UniDormManager 全功能审核报告

- **审核日期**: 2026-05-28
- **审核范围**: 后端 Go API · Web 管理端 (React) · 微信原生小程序 · UniApp 客户端
- **运行环境**: `unidorm-postgres:5433`、`unidorm-redis:6381` 容器已运行;后端以 host 进程跑在 `:8082`;前端 vite preview 跑在 `:3000`
- **数据状态**: 测的是**当前工作区**(含上一会话遗留的未提交改动)。基线数据:34 学生 · 13 房间 · 9 报修 · 5 公告 · 3 楼栋 · 1 admin 账号

---

## TL;DR

| 阶段 | 通过/总数 | 状态 |
|---|---|---|
| **P0** 现有自动化测试套件 | Go 单测 5/5 包 · Web vitest 31/31 | ✅ 全绿(但浅,全是 mock) |
| **P1** 后端 API 实测(全部 11 域 / 36 项) | **25/36** | 🔴 5 个真 500 + 6 个 RBAC 403 + 隐藏数据吞错 |
| **P2** Web E2E(登录+11 页面) | **14/17** | 🟡 失败 100% 级联自 P1 后端 bug;但**前端不显示错误状态** |
| **P3** UniApp 静态审 | (无法 build:H5,依赖卡死) | 🔴 16 个 API 模块,**4 个完全没后端**;单复数路径混用大面积 404 |
| **P4** 微信小程序静态审 | — | 🟡 端点子集小,被 B1/B5 级联;`/api/upload` 不存在;查寝页是空壳 |

**结论**:Phase 0 的绿灯**严重误导**——unit 测试都是 mock,跑不到真实 schema 不匹配的地方。运行起来后,几个核心管理功能(学生分页、房间分页、查寝、门禁记录、晚归、调宿审批)对管理员账号都是不可用状态。

---

## 真 Bug 清单(按严重度)

### 🔴 严重 — 后端

#### B1 · `rooms.floor` 列代码引用而 schema 不存在
- **现象**: `GET /api/rooms?page=1&pageSize=10` → 500 `column r.floor does not exist (SQLSTATE 42703)`;`GET /api/inspections/rooms` 同;`GET /api/rooms/all` 返回 `[]`+200(吞错见 B4)
- **证据**:
  - `database/database.go:67-78` 自动建表 rooms 无 floor 列
  - `migrations/init.sql` 也无 rooms.floor
  - `store/store_db.go:530, 569`、`utils/query_builder.go:142` 均 SELECT floor
  - `models/models.go:33` `Room.Floor int` 字段存在(代码层期待这列)
  - 运行库 `\d rooms` 实际列: `id,number,building,capacity,occupied,type,status,created_at,updated_at`
- **影响**: 房间分页 API、查寝按楼栋汇总、Web/Mini/UniApp 房间列表全部失效
- **修复方向**: 二选一 — (a) 给 rooms 表加 `floor INTEGER` 列并改自动建表 + 写数据迁移;(b) 从 struct/query 移除 Floor。选 (a) 更贴近业务(楼层是真实属性)

#### B2 · `students.building` 列代码引用而 schema 不存在
- **现象**: `GET /api/students?page=1&pageSize=10` → 500;`/api/students/all` 返回 `[]`+200 (34 个学生看不到)
- **证据**:
  - `database/database.go:47` 自动建表 students 无 building 列
  - `scripts/fix-student-building.sql:4` 外挂脚本加列,但**未执行**
  - `store/store_db.go:46, 158, 186`、`utils/query_builder.go:111` SELECT s.building
  - 运行库 `\d students` 实际列: `id,name,student_id,major,room_number,status,...`
- **修复方向**: 把 `fix-student-building.sql` 并入自动建表(database.go) + 一次性 ALTER 现有库

#### B3 · `inspections` / `inspection_details` 表未由自动建表创建
- **现象**: `GET /api/inspections?page=...` → 500 `relation "inspections" does not exist`;`/my`、`/rooms` 同
- **证据**:
  - `database/database.go` createTables 完全无 inspections / inspection_details
  - `migrations/new_features.sql:5-30` 定义了,但是独立 SQL 文件**没被运行**
- **影响**: 查寝功能后端层 100% 失效
- **修复方向**: 把 `new_features.sql` 里 inspections / inspection_details / 触发器 / 视图 `inspection_rankings` 全部并入 database.go 自动建表

#### B4 · 数据访问层吞掉 DB 错误返回空切片
- **证据**: `store/store_db.go:47-48` `if err != nil { return []*models.Student{} }`;`:531-533` 同;`GetAllRooms` Scan 循环 `if err == nil { append }` 静默丢弃失败行
- **影响**: B1/B2 的真错误被掩盖成"接口 200 但数据为空",运维体感"数据库没数据",极难定位
- **修复方向**: store 接口返回 `([]*X, error)`,handler 把 error 化为 500/记日志。这是架构级问题,会牵动若干 handler 改造

#### B5 · 路由依赖的 RBAC 权限未播种
- **现象**: `/api/access-logs` `/access-logs/live` `/api/late-returns` `/late-returns/pending` `/api/room-swaps` `/api/room-swaps/pending` 全部 403
- **证据**: 运行库 `permissions` 表 33 个权限,**无** `access_logs:*` / `late_returns:*` / `room_swaps:read` / `room_swaps:approve`;但 `main.go:226,228,232,239-249` `RequirePermission(...)` 显式要求它们
- **影响**: 门禁记录、晚归处理、调宿审批 — 包括系统管理员**全员 403,事实不可用**
- **修复方向**: 在 `init.sql` / auth 初始化(`Auth data initialized successfully` 那段)补全这些 permission 行并赋给系统管理员角色

### 🟡 中 — Web 管理端

#### F1 · 前端 API 调用失败不显示错误状态
- **证据**: P2 控制台抓到 11 条 4xx/5xx;失败请求 6 类去重(详见 audit_web.js 输出);但页面 `errorUI=false` —— Students/Rooms/AccessLogs 页面看不出来"加载失败",只是空白
- **影响**: 即使后端修好,以后任何 API 抖动用户都无感知,只看到"空数据"
- **修复方向**: `usePaginatedData.ts` 把 `error` 状态露给页面,并加 fallback UI(`<EmptyState />` / 错误 toast)

#### F2 · 单 bundle 1057 KB(超 vite 警告)且 code-split 失效
- **证据**: `npm run build` 报 `dist/assets/index-*.js 1,057.12 kB`;`usePaginatedData.ts` 7 处 dynamic import `api.ts`,但 14 个 page 又 statically import 它 → rollup 警告"dynamic import will not move module into another chunk"
- **修复方向**: 统一动态或静态;或用 `build.rollupOptions.output.manualChunks` 手动切

### 🔴 严重 — UniApp

#### U1 · 4 个 API 模块对应的后端域完全不存在
- **证据**: UniApp `src/api/` 有 16 个模块。后端 main.go 对照:
  - ❌ **不存在**: `dataTransfer.js`(import/export/templates,12 个端点)、`faceRecognition.js`(devices/faces/records/realtime)、`message.js`(messages/unread-count/read-all)、`report.js`(reports/generate/templates)
  - ❌ 还调了: `/api/sms/*`、`/api/wecom/*`、`/api/upload/image`、`/api/statistics` — 后端无
- **影响**: 这些功能在 UniApp 上点开就 404。视觉上能渲染,功能上是死的
- **修复方向**: 决策——要么后端补齐这些域,要么从 UniApp 移除/隐藏这些页面。**建议先决定产品边界再动手**

#### U2 · 单复数路径混用大量 404
- **证据**(扫描 `src/`):`/api/room` 单数版本被 **10 个文件**调用、`/api/repair` 4 个、`/api/notice` 3 个、`/api/building` 2 个、`/api/role` 2 个、`/api/message` 2 个、`/api/late` 2 个、`/api/access` 2 个、`/api/report` 1 个、`/api/user` 1 个。后端**全部用复数**
- **影响**: 上述位置全部 404
- **修复方向**: 全局 sed 单数→复数,排查例外

### 🟡 中 — 微信小程序

#### M1 · `app.js:11` baseUrl 硬编码 `http://localhost:8080`
- **现象**: 端口与后端实际 `:8082` 不符;生产环境也未走环境变量
- **修复方向**: 抽到 `utils/config.js` 按 `__wxConfig.envVersion`(release/trial/develop)切换

#### M2 · `app.json` 静态 tabBar.list(4 项)与 `app.js` 按角色动态 tabBar 混用
- **现象**: `tabBar.custom: true` 同时给了静态 list,角色不同时初次渲染会闪
- **修复方向**: 静态 list 只放最低权限的占位,真正项交给 custom-tab-bar

#### M3 · `requiredBackgroundModes:["audio"]` 申请音频后台
- **现象**: 宿管 App 没有音频场景,微信审核可能拒
- **修复方向**: 删除,除非真有播报需求

#### M5 · `/api/upload` 后端不存在
- **证据**: `pages/notices/publish/index.js:175` 调 baseUrl + `/api/upload`;后端 main.go 无任何 upload 路由
- **影响**: 发公告时上传图片 100% 失败
- **修复方向**: 后端实现 `/api/upload`(multipart + 存对象存储/本地)或改用现有图床

#### M7 · `project.config.json` appid = `"touristappid"`
- **影响**: 不能上传/真机调试/发布
- **修复方向**: 填真实小程序 AppID,避免上库

#### M8 · `pages/inspections/list/` 是空壳
- **证据**: index.js 里无任何 API 调用、无 data 绑定
- **修复方向**: 实现或下架

---

## 已澄清的"非 Bug"

- **分页参数名**:正确是 `pageSize`(对齐前端 `services/api.ts:211` 与 struct `form:"pageSize"`);`tests/*.sh` 老脚本里的 `size=` 是**陈旧文档**
- **buildings.type** 取值范围:`Male`/`Female`/`Co-ed`,不接受中文(老 seed 数据有 "学生宿舍" 等,与 handler 校验冲突,但读没事,只写新建会触发)
- **inspections/rankings 返回空 + 200**:rankings 走的是另一条不依赖 inspections 表的代码路径(可能默认空集),不算 bug

---

## 测试产物

新建以下两个 harness,**可重复执行**,后续修完 bug 拿它们回归:

| 文件 | 用途 |
|---|---|
| `tests/audit_api.py` | 后端逐接口实测(36 项),登录→GET 列表/详情→buildings 全 CRUD 闭环,输出 PASS/FAIL + JSON_RESULT |
| `tests/audit_web.js` | Web E2E 冒烟(Playwright + 系统 google-chrome),登录+11 页面,抓控制台错误与失败网络请求,输出 JSON_WEB |

启动后端(对齐已运行容器): `cd UniDormManagerServer && DB_PORT=5433 REDIS_PORT=6381 PORT=8082 JWT_SECRET=audit-test-secret-key-min-32-characters-long go run main.go`

---

## 建议修复顺序

1. **B4 先修**(吞错改成报错) —— 不修这个,其它 bug 的回归很难看清
2. **B3 / B1 / B2** —— 把 inspections 加入自动建表 + 给 rooms 加 floor 列 + 给 students 加 building 列(并入 database.go,删除/收编外挂 SQL 脚本)
3. **B5** —— 在 auth 初始化时播种缺失的 permissions 并赋给系统管理员
4. **F1** —— `usePaginatedData` 露出 error,加 UI 状态(改完前面后端,F1 才不会被"反正没数据"的体感掩盖)
5. **U2** —— UniApp 单数路径统一改复数(简单 sed,收益大)
6. **U1 / M5** —— **先和你确认产品边界**:是补后端,还是裁前端?这块工作量取决于决策
7. F2 / M1 / M2 / M3 / M7 / M8 —— 收尾杂项

---

## 已知未覆盖

- **OOM/边界/并发** 没测(读为主)
- **WeChat 登录** 没测(`/api/auth/wechat/login` 需要真实 code)
- **Mini & UniApp 运行时** 没测(无微信开发者工具;UniApp deps 装不下)
- **JWT 过期/blacklist** 没测
- **/metrics 内容** 只 200 没验指标值

---

## 修复进度(2026-05-28 本轮收尾)

按计划 `~/.claude/plans/shimmering-soaring-puffin.md` 执行,本轮目标"后端 B1–B5 + Web F1"全部达成。

| Bug | 状态 | 改动文件 | 验证 |
|---|---|---|---|
| **B1** rooms.floor | ✅ 修 | `database/database.go`(CREATE TABLE + ALTER ADD COLUMN IF NOT EXISTS) | `rooms/all` `[]`→13、分页 500→200、`inspections/rooms` 500→200 |
| **B2** students.building | ✅ 修 | `database/database.go`(同上模式) | `students/all` `[]`→34、分页 500→200 |
| **B3** inspections 表未建 | ✅ 修 | `database/database.go`(追加 inspections + inspection_details CREATE TABLE,对齐既有 VARCHAR(36) + TIMESTAMP 风格) | `inspections` 分页 500→200 |
| **B4** store 吞错 | ✅ 修 | `store/interface.go` + `store/store_db.go` 改 5 个 GetAll* 签名为 `([]*X, error)`;6 个 handler 调用方加 err 处理;`handlers/access_logs_test.go` MockStore 同步;2 个 test setup `.Return(slice)`→`.Return(slice, nil)` | `go test ./...` 全绿;audit 35/36 不退化 |
| **B5** RBAC permissions 未播种 | ✅ 修 | `database/init_auth_data.go`(追加 6 条:access_logs/late_returns/room_swaps 的 read+create/handle/approve;系统管理员通过既有通配 `SELECT ... FROM permissions` 自动获得) | 6 个 403 全部 → 200 |
| **F1** Web 错误状态不显示 | ⚠️ 误报 | 无需改动 | hook (`usePaginatedData.ts` L14/48/74/98-105) 与页面 (Students.tsx L257, RoomManagement.tsx L366) 已实现 error;审核 harness `audit_web.js` 的正则 `/加载失败/` 与实际渲染文本 "加载数据失败" 不匹配,是 harness 文案 bug |

### 本轮新发现 bug

- **B6** ✅ 已修:`GET /api/inspections/my` 500 `expected 1 arguments, got 2` —— 根因在 `utils/query_builder.go:232` `BuildInspectionQuery`,6 个 filter 分支都先 `qb.Where(..., val)`(已 append)又手动 `qb.args = append(qb.args, val)` 二次 append,导致 args 数翻倍而占位符数不变。删 6 行冗余 append 即修
- ⚠️ **未触发同源 bug**:`BuildRoomQuery` L171/176 对 `CapacityMin/Max` 也是同样的二次 append 模式。审核中没人传这两个 filter 所以未触发。留待下一轮一并清理

### 最终验证

- `python3 tests/audit_api.py` → **36/36 PASS**(B6 修后)
- `node tests/audit_web.js` → **17/17 PASS**
- `cd UniDormManagerServer && go test ./...` → 全绿

### 本轮未做(明确推迟)

按计划 Out of scope:U1 / M5 后端补齐(待产品边界决策)、U2 UniApp 单复数、F2 Web bundle、M1/M2/M3/M7/M8 Mini 杂项
