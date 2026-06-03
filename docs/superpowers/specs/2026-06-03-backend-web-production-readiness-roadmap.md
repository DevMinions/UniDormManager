# 后端 + PC Web 生产级修复路线图

**日期**: 2026-06-03
**状态**: 已审计,待逐批实现
**结论**: 功能维度达标(136/136 E2E live 全绿),**绝对生产级标准未达 —— 去重后 7 CRITICAL + 11 HIGH + 7 MEDIUM**(详见 §2 枚举;其中事务缺失类我按根因合并,实际涉及 UpdateStudent/DeleteStudent/换寝多处)

---

## 1. 背景与审计方法

继 mobile 前端加固之后,本轮反向审计**后端(Go/Gin/PostgreSQL)+ PC Web(React)**的生产可用性。

**两阶段证据:**

### Part 1 — 基线 live 复跑(2026-06-03,本机)
环境绕过:docker build 被国内镜像 DNS 挡(`alpine:latest` 拉取失败)、`vite dev` 撞 ENOSPC(inotify 上限);改用**原生 `go run` 后端 + 缓存 postgres:16-alpine 容器 + 静态托管 `npm run build` 产物**,`VITE_API_URL` 直连后端、CORS=`*`。

| harness | 结果 |
|---|---|
| `go test ./...` | green(auth/handlers/middleware/models/store 5 包 ok) |
| audit_api(后端 38 项) | 38/38 |
| web vitest | 31/31 |
| audit_web(导航 17 项) | 17/17 |
| Buildings UI CRUD | 14/14 |
| Students UI CRUD | 10/10 |
| Rooms UI CRUD | 13/13 |
| Repairs workflow | 13/13 |
| **合计** | **136/136** |

CHANGELOG `[0.2.7]` 文档化的 136/136 今天 live 仍成立,即便中途 bump 了 gin 1.10→1.12、pgx 5.7→5.9。

### Part 2 — 深挖 harness 测不到的维度(3 个并行专项审计)
安全 / 正确性·并发 / 运维·部署·性能。结论一致:**E2E 全绿 ≠ 生产级**,深层阻断项集中在这三域。

---

## 2. 完整发现清单(按域 + file:line)

### 2.1 安全(→ Batch A)

| ID | 级别 | 问题 | 证据 | 修复方向 |
|---|---|---|---|---|
| SEC-C1 | CRITICAL | 微信登录把客户端 `code` 字符串 `switch` 成特权账号直发 JWT,从不调微信 `code2session`。`POST {"code":"test_logistics_admin"}` → admin token,零凭据接管 | `handlers/auth.go:167-326`(分支 191-226) | 生产真实化(jscode2session 换 openid)或先从 `main.go:110` 摘路由;`test_*` 分支仅 `APP_ENV=development` 编入 |
| SEC-C2 | CRITICAL | JWT 弱/缺密钥不 fail-fast:硬编码默认 `your-secret-key-change-in-production`;compose 默认 `please_change_me_min_32_chars_for_production`(len≥32 被当合法);`generateRandomSecret` 用 `chars[i%len]` **确定性可重算** → 离线伪造任意 admin token。`main.go` 仅 `log.Printf` 不退出 | `auth/jwt.go:14,73-82` + `main.go:48-51` | 生产 `SetJWTSecret` 失败即 `log.Fatal`;删默认值;随机回退改 `crypto/rand` |
| SEC-H1 | HIGH | IDOR:`RequirePermission` 只比权限串,**完全无视 `role_permissions.scope`(self/building/all)**。学生 token 可遍历 `:id` 读/改/删任意学生。`FilterByScope`/`GetPermissionScope` 是占位空实现 | `middleware/rbac.go:15-43,178-208` · `handlers/students.go:145` | handler 内对 `:id` 做归属校验,或中间件读 scope 注入 `WHERE` |
| SEC-H2 | HIGH | 换寝取消 `DELETE /api/room-swaps/:id` **既无 RequirePermission 也无归属校验** → 任意登录用户删任意人申请 | `handlers/room_swaps.go:101-113` · `main.go:257` | store 加 `AND user_id=$caller`;路由加权限 |
| SEC-H3 | HIGH | 认证态 SQLi:`OrderBy` 的 `sortOrder` 裸拼接;access_logs/late_returns 用 `DefaultQuery` 手工构造绕过 model 的 `oneof=asc desc` validator | `utils/query_builder.go:82-86` · `handlers/access_logs.go:39-40` · `handlers/late_returns.go:39-40` | `OrderBy` 内 `ToUpper` 后只允许 `ASC`/`DESC` |
| SEC-H4 | HIGH | CORS `Access-Control-Allow-Origin: *` 写死(缓解项:未设 Allow-Credentials、JWT 走 header 非 cookie,危害削弱)。生产应白名单 | `middleware/middleware.go:13` | 按 `APP_ENV` 回显白名单 Origin |
| SEC-C6 | CRITICAL | `/api/auth/login` 零限流 → 无限撞库 | `handlers/auth.go` Login · `main.go:108` | IP+用户名维度限流(`x/time/rate` 或 Redis 计数)+ 失败退避 |
| SEC-M2 | MEDIUM | 启动日志打印 JWT secret **长度** + 微信 `code`(短期凭据) | `auth/jwt.go:47,53,70` · `handlers/auth.go:175` | 删调试输出 |
| SEC-M3 | MEDIUM | Logout 空操作,JWT 24h 内无法吊销 | `handlers/auth.go:329-338` | Redis 黑名单(jti+TTL),AuthMiddleware 查 |

### 2.2 数据正确性 / 并发(→ Batch B)

| ID | 级别 | 问题 | 证据 | 修复方向 |
|---|---|---|---|---|
| CORR-C3 | CRITICAL | **换寝审批不真正换房**:`FinalApproved` 只 `UPDATE ... status`,从不改 `students.room_number`/`building` 也不调 `updateRoomOccupied` → 核心功能静默失效(已核实) | `store_db.go:1230-1267` | `FinalApproved` 分支开事务:换两生 room_number + 两房 occupied + status |
| CORR-C4a | CRITICAL | 房间 occupied 读-改-写竞态:`GetRoomByNumber`(读)→ 应用层判满 → `updateRoomOccupied`(+1),并发可超员 | `store_db.go:250-266` | 原子 `UPDATE rooms SET occupied=occupied+1 WHERE ... AND occupied<capacity`,查 affected rows |
| CORR-C4b | CRITICAL | 全仓**零事务**:UpdateStudent 换房(4 步写)/DeleteStudent(删后减计数)中途失败留永久脏数据/锁死床位 | `store_db.go:261-291,327-335` | `pool.BeginTx` 包裹多步写 |
| CORR-H1 | HIGH | 吞错:7 个分页方法 `if err==nil {append}`,Scan 失败静默丢行返 200 截断数据 | `store_db.go:111-133,1144,1174,1286,1319,1447,1494` | 改 `if err!=nil {return nil,err}` |
| CORR-H2 | HIGH | 全仓无 `rows.Err()` 检查 → 网络中断静默返回部分数据(且可能被缓存) | `store/store_db.go`(全局) | 每个 rows 遍历后 `if err:=rows.Err()` |
| CORR-H3 | HIGH | `Create*` 失败返 `nil` 不返 error → 唯一键冲突等变 500 而非 409 | `store_db.go:204-234` 等(Student/Building/Room/Notice/Repair) | 签名改 `(*Model, error)`,handler 区分 pgErr 23505→409 |
| CORR-H4 | HIGH | 删楼栋/房间无孤儿防护(`building`/`room_number` 存的是名字非 FK)→ 悬空 rooms/students | `store_db.go:498-514,673-690` | 业务层前置检查或加 FK ON DELETE RESTRICT |
| CORR-M1 | MEDIUM | 晚归告警 COUNT→INSERT 无事务,并发重复插入 | `store_db.go:1400-1419` | `late_return_alerts(student_id,alert_date)` UNIQUE + `ON CONFLICT` |
| CORR-M3 | MEDIUM | `updateRoomOccupied(-1)` 无 `WHERE occupied>0` → 可写成负值 | `store_db.go:261-263` | SQL 加 `AND occupied>0` |

### 2.3 运维 / 部署 / 性能(→ Batch C)

| ID | 级别 | 问题 | 证据 | 修复方向 |
|---|---|---|---|---|
| OPS-C5 | CRITICAL | 无优雅停机,裸 `r.Run()` → 滚更 SIGTERM 截断在途请求;`CloseDatabase()` 定义但从不调 | `main.go:319` | `http.Server`+goroutine+`signal.Notify`+`Shutdown(ctx)`+CloseDatabase |
| OPS-H5 | HIGH | Dockerfile base 全浮动:`alpine:latest`(拉取失败根因)、`golang:1.26-alpine`、`node:26-alpine`、`nginx:alpine`;compose 同样 | `UniDormManagerServer/Dockerfile:7,28` · `UniDormManagerWeb/Dockerfile:2,20` | pin 精确版本+digest |
| OPS-H6 | HIGH | 前端 nginx 跑 root、无 HEALTHCHECK/USER(后端 Dockerfile 已做对) | `UniDormManagerWeb/Dockerfile:20-32` | 加非 root user + HEALTHCHECK |
| OPS-H7 | HIGH | 热点过滤列无索引:`students.building`/`.status`、`access_logs.timestamp`/`.student_id`、`inspections.status`/`building`/`check_date`、`rooms.status`、`room_swap_applications.status`/`applicant_id`。**且 `migrations/*.sql` 的索引不自动应用(死的)** | `database/database.go:243-280` | createTables 索引数组补全,或启动真正 apply migrations |
| OPS-M4 | MEDIUM | pgxpool 零调优(无 MaxConns/Lifetime…) | `database/database.go:25` | `ParseConfig` 后显式设池参数 |
| OPS-M5 | MEDIUM | 启动初始化失败(角色/权限/admin)仅 `log.Printf` 不阻断 → 带病启动(登录后全 403) | `database.go` init 段 | 关键初始化失败 `log.Fatal` |
| OPS-M6 | MEDIUM | `handlers/auth.go.backup` 等 `.backup` 入仓 | repo | 删除 + `.gitignore`/`.dockerignore` |

### 2.4 已达标(无需改,公平记录)
bcrypt cost=12(`auth/password.go`)· SQL 参数化(除 SEC-H3)· **JWT 算法已 pin**,拒 alg=none/混淆(`auth/jwt.go:111-116`)· 默认 admin `crypto/rand` 随机口令+只打印一次+`ON CONFLICT DO NOTHING`· 上传 MIME 嗅探+随机名+5MiB 限制(`handlers/upload.go`)· 审计中间件不记 body · `gin.Recovery()` 已挂(`main.go:104`)。

---

## 3. 批次划分、依赖与顺序

```
Batch A 安全 ──── 独立,可立即开始;多为外科手术式小改;最高 ROI
Batch B 正确性 ── store 事务基建是地基 → CORR-C3 换寝真换房依赖它;最大改造,需 TDD 守 136 基线
Batch C 运维 ──── 大部分加法式,与 B 弱耦合可并行;真上线前必须完成
```

**推荐顺序:A → B → C**
- **A 先**:SEC-C1/C2/C6 是零门槛完全接管,任何部署的硬门槛;修复面小、风险低。
- **B 次**:store 引入事务模式是架构改造,同时补回静默失效的换寝换房。
- **C 末**:上线前收尾,不挡开发/staging,可与 B 重叠。

| 批 | 工作量 | 主要风险 |
|---|---|---|
| A | 中(6-8 处) | 删微信端点需确认 mobile 约定;CORS 收敛勿误伤前端 |
| B | **大**(事务模式+~10 方法+Create* 签名波及 handler) | 动摇 136 绿;事务模式选型 |
| C | 中(多为新增) | 索引建表锁;nginx 非 root 端口权限 |

---

## 4. 整体"生产级"达标线(success criteria)

1. 全部 CRITICAL + HIGH 闭环,每修复点配回归测试(微信接管 / JWT 伪造 / 事务原子性 / 换寝真换房 / IDOR / SQLi)
2. MEDIUM 逐条"修或显式延后",不静默跳过
3. **136 基线全程保持绿** + 新增 store 事务/竞态 `go test` 用例
4. 一批一个独立 commit 系列 + 自己的 spec,可独立 review/上线

---

## 5. 待定架构决策(Batch B brainstorm 时再定)

store 引入事务的两种模式:
- **① 每方法内 `pool.BeginTx`** — 改动局部,但跨方法组合仍不原子
- **② `store.WithTx(fn)` helper + handler 决定事务边界** — 更正确,但签名级改造,波及所有调用方

B 批设计时权衡后定。

---

## 6. 范围外 / 后续

- 微信登录真实化(jscode2session)需微信 appid/secret + 产品决策 —— 若 mobile 短期不上线,A 批先摘端点即可
- 前端 XSS/CSP、依赖 SCA 扫描、E2E 扩边界用例 —— 留后续轮次
- 本路线图不含 mobile 仓(已单独加固到 vitest 126)
