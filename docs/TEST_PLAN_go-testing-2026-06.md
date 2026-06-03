# Go 测试补强方案（基于三篇文档评估）

> 日期 2026-06-03。
> 触发：评估三篇 Go 文档（Fuzzing / 集成测试工具链 / "神级 Skill" 软文）对本项目的价值。

## 实施记录（2026-06-03）

- **Tier 1 已完成**：`utils/query_builder_test.go` 加占位符/args 对齐回归。**当场抓到一个线上 bug**——
  `BuildAccessLogQuery`（Direction/DateFrom/DateTo）与 `BuildLateReturnQuery`（AlertDateFrom/AlertDateTo）
  在 `Where()` 已 append 后又手动 `qb.args = append(...)`，导致 `$n` 跳号、pgx bind 报错。
  即门禁按方向/日期筛选、晚归按日期筛选此前是坏的。已删除 5 行多余 append 修复，全绿。
- **Tier 2 已完成**：`store/store_db_integration_test.go`，testcontainers 真 PostgreSQL。
  含 Student CRUD + AccessLog Direction filter（B6 修复的端到端回归）。
  - **与下方原计划的偏差**：隔离方式从 `testing.Short()` 改为 **build tag `//go:build integration`**——
    更外科：默认 `go test ./...` 完全不编译该文件、不碰 Docker，现有 CI 后端 job 零改动。
  - CI 新增 `backend-integration` job（`go test -tags=integration -run Integration ./store/...`）。
  - 本地跑：`go test -tags=integration -run Integration ./store/`（需 Docker；离线环境加
    `TESTCONTAINERS_RYUK_DISABLED=true` 并预先 `docker pull postgres:16-alpine`）。
- **Tier 3（Fuzzing）**：未做，可选。

## 0. 现状（实测，非假设）

- `go 1.25.0`，`testify v1.11.1` 已在 `go.mod`，无需新增断言库。
- 已有约 2500 LOC 测试，**全部是 handler 层 httptest + `gin.TestMode`**，外加
  `middleware/`、`auth/jwt`、`models/`、`store/late_return` 各一份。
- CI（`.github/workflows/ci-cd.yml`）后端 job 跑 `go test ./...`。

**真实缺口（按 ROI 排序）：**

| 缺口 | 文件 | 现状 | 风险 |
|---|---|---|---|
| 分页查询构建 | `utils/query_builder.go`（368 LOC，16 函数） | **零专属测试** | B6/B6b bug 的发源地：`$n` 占位符与 args 切片错位/重复 append |
| store 真实现 | `store/store_db.go`（pgx） | 仅 `late_return` 有测试 | SQL 语法、事务回滚、连接池问题只在真库暴露 |
| 信任边界解析 | 查询参数 / filter 解析 | 无 | 畸形输入未系统探索 |

## 1. 三篇文档的取舍结论

- **②《Go 集成测试》（testcontainers / sqlmock / httptest）→ 采纳大部分。** 唯一刚需。
- **①《Go Fuzzing》→ 局部采纳。** 只对 query_builder 参数解析有限价值，非全项目刚需。
- **③《Go 后端神级 Skill》→ 不采纳。** 推销 `/skill add golang/go-best-practices`，来源未验证、Web3/"撸毛"语境，其宣传能力本环境（superpowers-zh / `/code-review` / `/security-review` / CodeGraph）已覆盖。其 7 步清单可当 review checklist，不必装。

**显式否决 sqlmock**（文档②主推之一）：本项目 SQL 由 query_builder 动态拼接，sqlmock 要求写死期望 SQL 正则 → 测试沦为"重复实现 SQL 字符串"，脆且抓不到真 bug。store 层用 testcontainers 真库，不用 sqlmock。

## 2. 分层方案

### Tier 1 —— query_builder 纯函数单元测试【最高 ROI，零基础设施】

- **新增** `utils/query_builder_test.go`，表驱动（文档②的 table-driven 模式）。
- **被测**：`BuildQuery()` / `BuildCountQuery()` 及 6 个 `BuildXQuery`（Student/Room/Repair/Inspection/AccessLog/LateReturn）。
- **核心断言（直接回归 B6/B6b）**：
  1. 生成 SQL 中 `$n` 占位符的最大编号 == `len(args)`（错位/重复 append 立即失败）。
  2. `$1..$n` 连续无跳号、无重复。
  3. data 查询与 count 查询的 args 一致（`Clone()` 共享语义，line 358 是经典 bug 点）。
  4. `OrderBy` 白名单：非法 `sortBy` 不进 SQL（防注入回归）。
  5. 空 filter → 不产生 `WHERE`；多 filter → `AND` 串接顺序正确。
- **不需要**：数据库、Docker、testcontainers、sqlmock。`go test ./utils/` 直接跑。
- **CI**：现有 `go test ./...` 原样覆盖，无改动。

### Tier 2 —— store_db.go testcontainers 集成测试【真库往返】

- **新增** `store/store_db_integration_test.go`，用 `testcontainers-go/modules/postgres` 起 `postgres:16-alpine`（与 `docker-compose.yml` 一致）。
- **新增依赖**：`github.com/testcontainers/testcontainers-go` + `/modules/postgres`。
- **建表**：复用 `database.createTables`（幂等），避免维护第二套 schema。
- **被测**：核心 CRUD + 分页 + 事务回滚（建/查/改/删 一个 resource 走通即可，不求全表）。
- **隔离**：用 `testing.Short()` 跳过——`go test -short` 走快路径不起容器；CI 用独立 integration job 起容器（文档②的 unit/integration 双 job 拆分）。
- **CI 改动**：后端 unit job 改 `go test -short -race ./...`；新增 integration job（GitHub ubuntu runner 自带 Docker，testcontainers 可用）。

### Tier 3 —— Fuzzing【可选，信任边界】

- **新增** `utils/query_builder_fuzz_test.go`：fuzz filter/search/sort 入参，断言"不 panic + 占位符与 args 始终对齐"。
- 1~2 个 fuzz target 即可，别为用而用。
- **CI**：种子语料随 `go test` 跑；长时 fuzz 用 nightly cron job（文档①示例）。

## 3. 落地顺序与验证

1. **Tier 1** → 验证：`cd UniDormManagerServer && go test -run TestBuild ./utils/ -v` 全绿；故意还原一次 B6（手动 double-append）确认测试变红。
2. **Tier 2** → 验证：`go test ./store/ -run Integration -v`（本地需 Docker）；`go test -short ./...` 确认跳过。
3. **Tier 3** → 验证：`go test -fuzz=FuzzBuildStudentQuery -fuzztime=30s ./utils/` 无 crash。
4. CI 改动后确认 `ci-cd.yml` 两个 job 均绿。

## 4. 不做的事（避免过度工程）

- 不引入 sqlmock（见 §1）。
- 不重写现有 handler httptest（够用，按需补，不推倒）。
- 不装第三方 "go-best-practices" skill（文档③）。
- 不追求覆盖率数字，只补"能抓真 bug"的点。
