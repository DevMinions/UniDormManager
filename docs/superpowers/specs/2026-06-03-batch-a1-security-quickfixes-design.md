# Batch A1 — 安全阻断快修(设计)

**日期**: 2026-06-03
**上游**: [生产级修复路线图](./2026-06-03-backend-web-production-readiness-roadmap.md) Batch A
**范围**: A1 = 7 项外科手术式安全修复 + 定向 IDOR 归属校验。**A2(完整 scope 系统)是独立 spec,不在此。**

## 目标

快速闭环所有安全 CRITICAL + 实际可利用的 HIGH,全程守住 136 live 基线绿,每修复点配 `go test` 回归。

## 决策(已与用户确认)

- 微信端点:**摘路由 / 仅 dev 注册**(非真实化)
- IDOR:A1 用**定向归属校验**(A2 再上完整 DB 驱动 scope + 查询注入)
- 登录限流:**Redis 计数**(Redis 不可用时 dev 内存回退,prod 要求 Redis)

---

## 逐项设计

### A1-1 微信登录端点摘除
**问题**: `handlers/auth.go:191-226` 把 `req.Code` switch 成特权账号直发 JWT,未认证端点 → `POST {"code":"test_logistics_admin"}` 拿 admin。`main.go:110` 注册路由。
**做法**: 路由注册加 env gate —— 仅当 `APP_ENV=development`(或显式 `WECHAT_LOGIN_DEV_STUB=true`)才注册 `/api/auth/wechat/login`;生产环境不注册。handler 内 `test_*` 分支同样仅 dev 编入。真实化(jscode2session)留待 mobile 上线。
**测试**: `main.go` 路由组装抽成可测函数,断言 `APP_ENV=production` 时 wechat 路由不存在;`APP_ENV=development` 时存在。集成:prod 配置下 POST → 404。

### A1-2 JWT 弱密钥 fail-fast + 真随机
**问题**: `auth/jwt.go:14` 硬编码默认密钥;`SetJWTSecret` 校验失败仅 `return err`,`main.go:49` 只 `log.Printf` 继续;`generateRandomSecret`(jwt.go:75)用 `chars[i%len]` 确定性可重算。
**做法**:
- 删 jwt.go:14 默认值(`jwtSecret` 初始为空)
- `generateRandomSecret` 改 `crypto/rand`
- `main.go`: `if err := auth.SetJWTSecret(secret); err != nil { if APP_ENV=="production" { log.Fatalf } else { log.Printf 警告 } }` —— 生产无强密钥**拒绝启动**;dev 允许随机回退
- 删 jwt.go 的调试 `fmt.Printf`(并入 A1-7)
**测试**: `validateJWTSecret` 拒空/短/默认值;`generateRandomSecret()` 两次调用结果不同(非确定性);生产路径无强密钥返回致命错误。

### A1-3 ORDER BY SQL 注入
**问题**: `utils/query_builder.go:82-86` `sortOrder` 裸拼接;`handlers/access_logs.go:39` / `late_returns.go:39` 用 `DefaultQuery` 绕过 model validator。
**做法**: `OrderBy` 内 `sortOrder = strings.ToUpper(strings.TrimSpace(sortOrder))`,不属 `{ASC,DESC}` 一律强制 `DESC`。`sortBy` 既有白名单不动。
**测试**: `OrderBy(..., "ASC; DROP TABLE x--")` 产出以 `DESC` 结尾、无注入;`asc`/`desc` 正常保留。

### A1-4 CORS 收敛白名单
**问题**: `middleware/middleware.go:13` 写死 `Access-Control-Allow-Origin: *`。
**做法**: 读 `CORS_ALLOWED_ORIGINS` env(逗号分隔)。请求 `Origin` 命中白名单 → 回显该 Origin;否则不下发 CORS 头。`APP_ENV!=production` 且白名单空 → 回退 `*`(dev 便利)。不设 `Allow-Credentials`(维持现状)。
**测试**: 白名单含 `https://a.com`,Origin=`https://a.com` → 回显;Origin=`https://evil.com` → 不回显。dev 空白名单 → `*`。

### A1-5 登录限流(Redis 计数)
**问题**: `/api/auth/login` 无限流,可无限撞库。
**做法**: 新增 `middleware.RateLimitLogin`,挂在 `auth.POST("/login")` 前。key=`ratelimit:login:<clientIP>`,`cache.Cache.Incr` + 首次 `Expire(window)`;超阈值返 429 + `Retry-After`。配置 env:`LOGIN_RATE_LIMIT`(默认 10)、`LOGIN_RATE_WINDOW`(默认 15m)。**`cache.Cache==nil`(USE_CACHE=false)**:dev 用进程内 `map[ip]计数`+互斥回退;`APP_ENV=production` 且 Redis 不可用 → 启动期警告(不强制 fatal,避免误伤,但文档标注生产应开 Redis)。
**测试**: 内存回退路径:窗口内第 N+1 次请求返 429;窗口过后重置。Redis 路径用接口抽象 + mock。

### A1-6 换寝取消鉴权 + 归属
**问题**: `DELETE /api/room-swaps/:id`(`room_swaps.go:101`)无 `RequirePermission` 也无归属 → 任意人删任意申请。
**做法**: `store.DeleteRoomSwapApplication(id, callerUserID)` 加 `AND applicant_id = $caller`;handler 从 claims 取 `UserID` 传入;affected rows=0 → 404。不新增 permission(避免改 RBAC 种子),靠归属约束(任意登录用户只能删自己的)。管理员"删任意"留 A2/后续。
**测试**: 集成 —— 用户 A 删用户 B 的申请 → 404/无效;删自己的 → 成功。

### A1-7 日志脱敏
**问题**: `auth/jwt.go:47,53,70` 打印 secret 长度;`handlers/auth.go:175` 打印微信 `code`。
**做法**: 删这些 `fmt.Printf`/log 行(jwt 部分并入 A1-2)。
**测试**: 代码审查 + grep 断言无敏感打印(可加一个简单测试或 lint 规则,主要靠 review)。

### A1-8 定向 IDOR 归属校验(students by-:id)
**问题**: `GetStudentByID`(`handlers/students.go:145`)对持 `students:read` 的学生不校验归属 → 学生遍历 `:id` 读任意学生(scope 被无视)。`UpdateStudent`/`DeleteStudent` 已被 `RequirePermission("students:update"/"delete")` 挡住学生(学生无此权限),但加防御性校验。
**做法**: 新增 handler 辅助 `requireStudentAccess(c, recordStudentID)`:若 caller 持任一 staff 角色(`dorm_manager`/`building_manager`/`logistics_admin`/`system_admin`)→ 放行;否则要求 `middleware.IsSelfData(c, recordStudentID)`,否则 403。挂到 `GetStudentByID`(必)+ `UpdateStudent`/`DeleteStudent`(防御)。
**测试**: 集成 —— 学生 token `GET /students/<别人>` → 403;`GET /students/<自己>` → 200;staff token → 200 任意。
**注**: 完整的 building-scope(楼栋管理员仅限本楼)与列表级查询注入是 **A2** 范围。

---

## 测试策略(TDD)

1. 每项**先写失败测试**复现问题(尤其 A1-1 微信接管、A1-2 JWT 伪造、A1-3 SQLi、A1-8 IDOR),再修。
2. **136 live 基线全程绿**:实现后重跑受影响 harness(audit_api + 相关 web E2E)。
3. 新增/扩 `go test`:`auth`(jwt)、`middleware`(cors/ratelimit/rbac)、`utils`(query_builder)、handler 层归属校验。
4. 一项一个(或按域分组)逻辑 commit,message 引用 `A1-x`。

## 成功标准(A1 达标线)

1. 8 项全部实现 + 各配 `go test` 回归,`go test ./...` 全绿
2. 136 live 基线不退化
3. 新增 env 文档化:`CORS_ALLOWED_ORIGINS`、`LOGIN_RATE_LIMIT`、`LOGIN_RATE_WINDOW`、`WECHAT_LOGIN_DEV_STUB`;`APP_ENV` 在 JWT/CORS/限流的行为表
4. 所有安全 CRITICAL(C1 微信/C2 JWT/C6 限流)+ 可利用 HIGH(H2 换寝取消/H3 SQLi/H1 实际 IDOR)闭环

## 范围外(后续 spec)

- **A2**: 完整 scope 系统(Claims 加 `Scopes map`、登录从 `role_permissions` 加载、对象级 + 列表级查询注入、building-scope)
- **M3 Logout token 吊销**(Redis 黑名单)—— A2 或独立
- Batch B(数据正确性/事务)、Batch C(运维/部署)按路线图后续

## 待实现期决议(plan 阶段细化)

- 限流 key 是否加 username 维度(需在中间件解析 body;先 IP-only,够防撞库)
- CORS 多 Origin 的 Vary 头处理
