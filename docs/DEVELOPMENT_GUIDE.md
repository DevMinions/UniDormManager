# Development Guide

UniDormManager 的项目专属约定。通用语言规范(Go style guide / Effective TypeScript)请查官方文档,这里只写本项目内的约束。

## Backend (Go 1.23 + Gin)

### 分层

```
main.go → handlers/* → store.StoreInterface → store_db.go → database/* (pgx)
                       │
                       └─ utils.QueryBuilder (分页 / 过滤)
```

- **handlers** 一个业务域一个文件;只做参数绑定 / 调 store / 返回响应,不写 SQL
- **store** 用接口隔离,handler 测试可换 mock(见 `handlers/access_logs_test.go`)
- **utils/query_builder.go** 复合分页查询时用;`qb.Where(cond, args...)` 已自动 append,不要再手动 `qb.args = append(...)`(历史 bug B6/B6b)

### 错误处理

- handler 用 `c.ShouldBindJSON(&req)`,失败返 400 `{"error": "invalid_request"}`
- store 函数返 `(T, error)`,handler 收到 err 直接返 500;**不要吞错误返回空切片**(历史 bug B4)
- 业务约束失败用统一格式 `{"error": "<code>", "message": "<人类可读>"}`

### Schema 变更

`database/database.go` 是 source of truth(`migrations/` 仅历史归档,不自动跑)。新加列必须 idempotent:

```go
"ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1"
```

CREATE TABLE 也用 IF NOT EXISTS。改完重启即生效,不破坏现库数据。

### 新加路由 + RBAC

加 `middleware.RequirePermission("foo:bar")` 后,**必须**同步往 `database/init_auth_data.go` 加一行 permission:

```go
{ID: "perm-foo-bar", Code: "foo:bar", Name: "...", Module: "foo"}
```

`role-system-admin` 通过 wildcard `INSERT ... SELECT FROM permissions` 自动包含。忘加 permission 会导致 system-admin 也拿 403(历史 bug B5)。

### 审计与监控

写操作(POST/PUT/PATCH/DELETE 且 status<400)自动被 `middleware.AuditLog` 异步写入 `audit_logs`。如果新加端点不希望被审计(如健康检查),不需特殊处理 — 它只盯写操作。

新加 Prometheus 指标在 `monitoring/metrics.go` 的 `promauto.NewCounterVec` / `NewGauge` 模式。Grafana dashboard 在 `grafana/provisioning/dashboards/unidorm-overview.json`。

## Frontend (React 19 + TypeScript + Vite)

### 分层

```
App.tsx (HashRouter)
  └─ pages/* (一个管理页一个文件)
       ├─ services/api.ts (fetch + JWT 注入,所有 HTTP 走这里)
       ├─ hooks/usePaginatedData.ts (分页 + search + error)
       └─ contexts/AuthContext (token 持久化)
```

- **services/api.ts** 是 HTTP 客户端唯一入口;不要在 page 里手写 `fetch`
- **hooks/usePaginatedData** 已经处理 page / pageSize / search / filters / error 状态,新增列表页直接复用
- Tailwind utility-first;新加 UI 复用 Lucide React 图标库,不引入额外图标库

### Controlled Form 注意点

React `<input value={state} onChange={...}>` 是 controlled component。e2e 自动化(Playwright)使用 `.fill()` 在某些动画/transition 期间不触发 onChange,需要 `.focus() + pressSequentially()`(已在 `tests/audit_web_crud*.js` 注释里固化)。手动开发不受影响。

### Status 字段约定

字符串字段统一**大写首字母**:`'Pending'` / `'In Progress'` / `'Completed'` / `'Handled'` / `'Active'`。前后端约定一致(历史 bug:后端曾有 `convertRepairStatus` 强行转小写,导致 UI 状态判断全失效)。

## Test

| 改动类型 | 必须 |
|---|---|
| 后端新端点 | `tests/audit_api.py` 加用例 + `docs/API.md` 加章节 |
| 后端业务逻辑分支 | `handlers/*_test.go` 表驱动测试(参考既有) |
| 前端新页面 | 至少 `tests/audit_web.js` 导航冒烟(加路径到 pages 数组) |
| 前端 CRUD/workflow | `tests/audit_web_crud_*.js` 或 `audit_web_workflow_*.js`(模板参考 buildings/students/rooms/repairs) |
| schema 变更 | `database/database.go` IF NOT EXISTS + 重启验证 |

提 PR 前 `make test` + `make audit` 必须双绿,见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## E2E 踩坑(节省时间)

1. Playwright `button.click()` 在 framer-motion 动画期 actionability 30s 卡死 → 用 `click({ force: true })`
2. `input.click()` 同因 → 用 `.focus()` + `.pressSequentially(text, { delay: 5 })`
3. HashRouter 同 hash 二次 `page.goto()` 不重新挂载组件 → 先 goto 别处再回来才能触发 fetch
4. `tr.filter({ hasText })` 在卡片视图找不到行 → 卡片用 `div.hover\\:shadow-md` 等独有 class

## 参考

- [Architecture](ARCHITECTURE.md) — C4 + 关键流程
- [API reference](API.md)
- [Database init](DATABASE_INIT.md) — 自动建表 / 种子数据
- [RBAC design](ROLE_BASED_DESIGN.md)
