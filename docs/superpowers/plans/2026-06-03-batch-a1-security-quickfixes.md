# Batch A1 安全快修 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法跟踪进度。

**目标：** 闭环 UniDormManager 后端所有安全 CRITICAL + 实际可利用 HIGH（微信接管、JWT 伪造、SQLi、撞库、换寝越权、students IDOR），不退化 136 live 基线。

**架构：** 在现有 Gin handler→store 分层上做外科手术式修改 + 1 个新中间件（登录限流）+ config 加 `IsProduction()`。完整 scope 系统（A2）不在此。

**技术栈：** Go 1.23 / Gin / pgx / go-redis v9 / testify。测试：`go test ./...`（单测）+ live 基线 harness（`make audit` 等价手动跑）。

**上游规格：** `docs/superpowers/specs/2026-06-03-batch-a1-security-quickfixes-design.md`

---

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `config/config.go` | 加 `Env` 字段 + `IsProduction()` | 修改 |
| `config/config_test.go` | config 单测 | 创建 |
| `auth/jwt.go` | 删默认密钥、`crypto/rand` 真随机、拆分 `SetJWTSecret`/`SetRandomDevSecret`、删调试打印 | 修改 |
| `auth/jwt_test.go` | jwt 密钥单测 | 创建/扩 |
| `utils/query_builder.go` | `OrderBy` 校验 sortOrder | 修改 |
| `utils/query_builder_test.go` | OrderBy 注入单测 | 创建 |
| `middleware/middleware.go` | `CORS()` 改 env 白名单 | 修改 |
| `middleware/cors_test.go` | CORS 白名单单测 | 创建 |
| `middleware/ratelimit.go` | 新登录限流中间件(Redis+内存回退) | 创建 |
| `middleware/ratelimit_test.go` | 限流单测 | 创建 |
| `store/interface.go` `store/store_db.go` | `DeleteRoomSwapApplication` 加 owner + 查 RowsAffected | 修改 |
| `handlers/room_swaps.go` | `CancelApplication` 传 caller、归属 | 修改 |
| `handlers/students.go` | `GetStudentByID`/`Update`/`Delete` 归属校验 | 修改 |
| `handlers/auth.go` | 删微信 code 日志;test_* 分支 dev gate | 修改 |
| `main.go` | JWT fail-fast、CORS env、挂限流、wechat dev-gate(抽 `setupAuthRoutes`)、room-swap DELETE 传 caller | 修改 |
| `main_test.go` | wechat 路由 env-gate 单测 | 创建 |

**前置（执行者先做一次）：** 起 live 验证栈（绕过 docker mirror/ENOSPC）：
```bash
docker run -d --name unidorm_pg_audit -e POSTGRES_DB=unidorm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16-alpine
# 每次跑后端：
cd UniDormManagerServer && DB_HOST=localhost DB_PORT=5433 DB_USER=postgres DB_PASSWORD=postgres DB_NAME=unidorm DB_SSLMODE=disable USE_CACHE=false JWT_SECRET=audit-test-secret-key-min-32-characters-long-xyz ADMIN_INITIAL_PASSWORD=admin123 APP_ENV=development PORT=8082 go run main.go
# API 基线回归：BASE=http://localhost:8082 ADMIN_PASS=admin123 python3 ../tests/audit_api.py  → 期望 38/38
```

---

### 任务 1：config 加 `IsProduction()`（A1-1/2/4 的前置）

**文件：**
- 修改：`config/config.go`
- 测试：`config/config_test.go`

- [ ] **步骤 1：编写失败的测试**

`config/config_test.go`：
```go
package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsProduction(t *testing.T) {
	assert.True(t, (&Config{Env: "production"}).IsProduction())
	assert.False(t, (&Config{Env: "development"}).IsProduction())
	assert.False(t, (&Config{Env: ""}).IsProduction())
}

func TestLoadConfigEnvDefault(t *testing.T) {
	os.Unsetenv("APP_ENV")
	assert.Equal(t, "development", LoadConfig().Env)
	os.Setenv("APP_ENV", "production")
	defer os.Unsetenv("APP_ENV")
	assert.Equal(t, "production", LoadConfig().Env)
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd UniDormManagerServer && go test ./config/ -run TestIsProduction -v`
预期：编译失败 `Config has no field Env` / `IsProduction undefined`

- [ ] **步骤 3：实现**

`config/config.go`：`Config` struct 加字段（在 `Port string` 后）：
```go
	// 运行环境：development / production
	Env string
```
`LoadConfig()` 返回的 `&Config{...}` 加（在 `Port:` 行后）：
```go
		Env: getEnv("APP_ENV", "development"),
```
文件末尾加方法：
```go
// IsProduction 是否生产环境
func (c *Config) IsProduction() bool {
	return c.Env == "production"
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./config/ -v`
预期：PASS

- [ ] **步骤 5：Commit**
```bash
git add config/config.go config/config_test.go
git commit -m "feat(config): 加 APP_ENV / IsProduction() (A1 前置)"
```

---

### 任务 2：JWT 弱密钥 fail-fast + 真随机（A1-2 + A1-7 jwt 部分）

**文件：**
- 修改：`auth/jwt.go`（L12-82）、`main.go:48-51`
- 测试：`auth/jwt_test.go`

- [ ] **步骤 1：编写失败的测试**

`auth/jwt_test.go`（若已存在则追加这些函数）：
```go
package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateJWTSecret(t *testing.T) {
	assert.Error(t, validateJWTSecret(""))
	assert.Error(t, validateJWTSecret("short"))
	assert.Error(t, validateJWTSecret("your-secret-key-change-in-production"))
	assert.NoError(t, validateJWTSecret("a-very-long-and-secure-secret-key-1234567890"))
}

func TestGenerateRandomSecretIsNonDeterministic(t *testing.T) {
	a := generateRandomSecret()
	b := generateRandomSecret()
	assert.NotEqual(t, a, b, "随机密钥必须不可重算")
	assert.GreaterOrEqual(t, len(a), 32)
}

func TestSetJWTSecretRejectsWeak(t *testing.T) {
	assert.Error(t, SetJWTSecret("short"))
	assert.NoError(t, SetJWTSecret("a-very-long-and-secure-secret-key-1234567890"))
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`go test ./auth/ -run 'TestGenerateRandomSecretIsNonDeterministic|TestSetJWTSecretRejectsWeak' -v`
预期：`TestGenerateRandomSecretIsNonDeterministic` FAIL（当前 `generateRandomSecret` 确定性，两次相同）；`TestSetJWTSecret` 可能 PASS 也可能因当前实现的随机回退副作用而异常 —— 以非确定性测试失败为准。

- [ ] **步骤 3：实现**

`auth/jwt.go`：
1. 改 imports（加 `crypto/rand`、`encoding/base64`，删不再需要的 `os`）：
```go
import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)
```
2. L14 默认密钥置空：
```go
	// JWT 密钥（必须由 SetJWTSecret 设置；生产无强密钥则拒绝启动）
	jwtSecret []byte
```
3. 替换 `SetJWTSecret`（删所有 `fmt.Printf` 调试 + 内部 env 回退，职责单一）：
```go
// SetJWTSecret 校验并设置 JWT 密钥；不合格返回 error（由调用方决定 fatal 还是回退）
func SetJWTSecret(secret string) error {
	if err := validateJWTSecret(secret); err != nil {
		return err
	}
	jwtSecret = []byte(secret)
	return nil
}

// SetRandomDevSecret 仅非生产环境缺密钥时回退使用
func SetRandomDevSecret() {
	jwtSecret = []byte(generateRandomSecret())
}
```
4. 替换 `generateRandomSecret` 为 `crypto/rand`：
```go
// generateRandomSecret 生成密码学安全随机密钥
func generateRandomSecret() string {
	b := make([]byte, 48)
	if _, err := rand.Read(b); err != nil {
		panic("failed to generate random JWT secret: " + err.Error())
	}
	return base64.StdEncoding.EncodeToString(b)
}
```

`main.go:48-51` 替换为：
```go
	// 设置 JWT 密钥（生产无强密钥拒绝启动）
	if err := auth.SetJWTSecret(os.Getenv("JWT_SECRET")); err != nil {
		if cfg.IsProduction() {
			log.Fatalf("生产环境 JWT 密钥无效，拒绝启动: %v", err)
		}
		log.Printf("⚠️  开发环境 JWT 密钥无效，使用随机临时密钥（重启失效）: %v", err)
		auth.SetRandomDevSecret()
	}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./auth/ -v`
预期：PASS。再 `go build ./...` 确认 main.go 编译（`os` 仍被 main 用到，保留 main 的 import）。

- [ ] **步骤 5：Commit**
```bash
git add auth/jwt.go auth/jwt_test.go main.go
git commit -m "fix(auth): JWT 弱密钥生产 fail-fast + crypto/rand 真随机 + 删调试打印 (A1-2/A1-7)"
```

---

### 任务 3：ORDER BY SQL 注入（A1-3）

**文件：**
- 修改：`utils/query_builder.go:72-88`
- 测试：`utils/query_builder_test.go`

- [ ] **步骤 1：编写失败的测试**

`utils/query_builder_test.go`：
```go
package utils

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOrderByRejectsInjection(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM students")
	qb.OrderBy("status", "ASC; DROP TABLE students--")
	assert.Contains(t, qb.baseQuery, "ORDER BY status DESC")
	assert.NotContains(t, qb.baseQuery, "DROP")
}

func TestOrderByValidOrdersPreserved(t *testing.T) {
	qbAsc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbAsc.OrderBy("name", "asc")
	assert.Contains(t, qbAsc.baseQuery, "ORDER BY name ASC")

	qbDesc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbDesc.OrderBy("name", "DESC")
	assert.Contains(t, qbDesc.baseQuery, "ORDER BY name DESC")
}

func TestOrderByNonWhitelistedColumnIgnored(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qb.OrderBy("evil_col", "ASC")
	assert.NotContains(t, qb.baseQuery, "ORDER BY")
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`go test ./utils/ -run TestOrderBy -v`
预期：`TestOrderByRejectsInjection` FAIL（当前裸拼接 → baseQuery 含 `DROP`）

- [ ] **步骤 3：实现**

`utils/query_builder.go` 替换 `OrderBy`（`strings` 已 import）：
```go
// OrderBy 添加排序（sortBy 白名单 + sortOrder 仅 ASC/DESC，防注入）
func (qb *QueryBuilder) OrderBy(sortBy, sortOrder string) *QueryBuilder {
	allowedColumns := map[string]bool{
		"created_at": true, "updated_at": true, "name": true,
		"status": true, "priority": true, "student_id": true,
		"room": true, "number": true,
	}

	if allowedColumns[sortBy] {
		order := strings.ToUpper(strings.TrimSpace(sortOrder))
		if order != "ASC" && order != "DESC" {
			order = "DESC"
		}
		qb.baseQuery += fmt.Sprintf(" ORDER BY %s %s", sortBy, order)
	}
	return qb
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./utils/ -v`
预期：PASS

- [ ] **步骤 5：Commit**
```bash
git add utils/query_builder.go utils/query_builder_test.go
git commit -m "fix(query): ORDER BY sortOrder 白名单化，堵认证态 SQLi (A1-3)"
```

---

### 任务 4：CORS 收敛白名单（A1-4）

**文件：**
- 修改：`middleware/middleware.go:10-25`
- 测试：`middleware/cors_test.go`

- [ ] **步骤 1：编写失败的测试**

`middleware/cors_test.go`：
```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupCORSRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CORS())
	r.GET("/test", func(c *gin.Context) { c.Status(200) })
	return r
}

func TestCORSAllowlistEchoesAllowed(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://admin.example.com,https://b.example.com")
	r := setupCORSRouter()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "https://admin.example.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, "https://admin.example.com", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORSAllowlistRejectsUnlisted(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://admin.example.com")
	r := setupCORSRouter()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "https://evil.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORSDevWildcard(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("CORS_ALLOWED_ORIGINS", "")
	r := setupCORSRouter()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`go test ./middleware/ -run TestCORS -v`
预期：`TestCORSAllowlistRejectsUnlisted` FAIL（当前永远回 `*`）

- [ ] **步骤 3：实现**

`middleware/middleware.go`：顶部 import 加 `"os"` 和 `"strings"`。替换 `CORS()`：
```go
// CORS 跨域中间件：生产按 CORS_ALLOWED_ORIGINS 白名单回显，开发回退 *
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowed := resolveAllowedOrigin(origin)
		if allowed != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowed)
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Max-Age", "3600")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// resolveAllowedOrigin 返回应回显的 Allow-Origin（空=不下发）
func resolveAllowedOrigin(origin string) string {
	raw := os.Getenv("CORS_ALLOWED_ORIGINS")
	if raw == "" {
		// 非生产且未配置 → 开发便利回退 *
		if os.Getenv("APP_ENV") != "production" {
			return "*"
		}
		return ""
	}
	for _, o := range strings.Split(raw, ",") {
		if strings.TrimSpace(o) == origin && origin != "" {
			return origin
		}
	}
	return ""
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./middleware/ -run TestCORS -v`
预期：PASS。再跑 `go test ./middleware/ -v` 确认原有 middleware_test 不退化（注：旧 `middleware_test.go:147` 断言 `*`——若它无 Origin 头则 dev 下仍得 `*`；若它断言生产白名单场景需同步更新该旧断言）。

- [ ] **步骤 5：Commit**
```bash
git add middleware/middleware.go middleware/cors_test.go
git commit -m "fix(cors): 生产按 CORS_ALLOWED_ORIGINS 白名单回显，开发回退 * (A1-4)"
```

---

### 任务 5：登录限流（Redis + 内存回退）（A1-5）

**文件：**
- 创建：`middleware/ratelimit.go`、`middleware/ratelimit_test.go`
- 修改：`main.go`（挂到 login 路由）

- [ ] **步骤 1：编写失败的测试**

`middleware/ratelimit_test.go`：
```go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestMemLimiterAllowsUpToLimit(t *testing.T) {
	m := &memLimiter{hits: make(map[string][]time.Time)}
	for i := 0; i < 3; i++ {
		assert.True(t, m.allow("k", 3, time.Minute), "第 %d 次应放行", i+1)
	}
	assert.False(t, m.allow("k", 3, time.Minute), "超过 limit 应拒绝")
}

func TestRateLimitLoginReturns429(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/login", RateLimitLogin(2, time.Minute), func(c *gin.Context) { c.Status(200) })
	do := func() int {
		req := httptest.NewRequest("POST", "/login", nil)
		req.RemoteAddr = "1.2.3.4:5555"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}
	assert.Equal(t, 200, do())
	assert.Equal(t, 200, do())
	assert.Equal(t, http.StatusTooManyRequests, do())
}
```
（注：测试在 `cache.Cache == nil` 即内存回退路径下运行——无需 Redis。）

- [ ] **步骤 2：运行测试验证失败**

运行：`go test ./middleware/ -run 'TestMemLimiter|TestRateLimitLogin' -v`
预期：编译失败 `RateLimitLogin undefined` / `memLimiter undefined`

- [ ] **步骤 3：实现**

`middleware/ratelimit.go`：
```go
package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"unidorm-manager-server/cache"
)

// memLimiter USE_CACHE=false 时的进程内滑动窗口回退
type memLimiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

var memLim = &memLimiter{hits: make(map[string][]time.Time)}

func (m *memLimiter) allow(key string, limit int, window time.Duration) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	cutoff := time.Now().Add(-window)
	kept := m.hits[key][:0]
	for _, t := range m.hits[key] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= limit {
		m.hits[key] = kept
		return false
	}
	m.hits[key] = append(kept, time.Now())
	return true
}

// RateLimitLogin 按客户端 IP 限制登录频率，防撞库
func RateLimitLogin(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := "ratelimit:login:" + c.ClientIP()
		allowed := true
		if cache.Cache != nil {
			ctx := c.Request.Context()
			count, err := cache.Cache.Incr(ctx, key).Result()
			if err == nil {
				if count == 1 {
					cache.Cache.Expire(ctx, key, window)
				}
				allowed = count <= int64(limit)
			} // Redis 故障则放行，避免限流器故障拒绝合法登录
		} else {
			allowed = memLim.allow(key, limit, window)
		}
		if !allowed {
			c.Header("Retry-After", strconv.Itoa(int(window.Seconds())))
			WriteError(c, http.StatusTooManyRequests, "rate_limited", "登录尝试过于频繁，请稍后再试")
			c.Abort()
			return
		}
		c.Next()
	}
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./middleware/ -run 'TestMemLimiter|TestRateLimitLogin' -v`
预期：PASS

- [ ] **步骤 5：挂到 login 路由 + commit**

`main.go`：在 import 区确认有 `"time"`（已有）。把 L109 改为：
```go
		auth.POST("/login", middleware.RateLimitLogin(loginRateLimit, loginRateWindow), authHandler.Login)
```
在 `auth := r.Group("/api/auth")` 之前加配置读取：
```go
	loginRateLimit := 10
	if v, err := strconv.Atoi(os.Getenv("LOGIN_RATE_LIMIT")); err == nil && v > 0 {
		loginRateLimit = v
	}
	loginRateWindow := 15 * time.Minute
	if v, err := time.ParseDuration(os.Getenv("LOGIN_RATE_WINDOW")); err == nil && v > 0 {
		loginRateWindow = v
	}
```
import 区加 `"strconv"`。运行 `go build ./...` 确认编译。
```bash
git add middleware/ratelimit.go middleware/ratelimit_test.go main.go
git commit -m "feat(security): 登录限流中间件(Redis+内存回退)防撞库 (A1-5)"
```

---

### 任务 6：换寝取消归属校验（A1-6）

**文件：**
- 修改：`store/interface.go:60`、`store/store_db.go:1677-1682`、`handlers/room_swaps.go:101-113`、`main.go:257`
- 测试：`store/store_db.go` 经 live 基线；`handlers/room_swaps_test.go` 加单测（沿用既有 mock store 模式）

- [ ] **步骤 1：改接口签名 + 实现（含 RowsAffected 修复）**

`store/interface.go:60`：
```go
	DeleteRoomSwapApplication(id, applicantID string) bool
```
`store/store_db.go:1677-1682` 替换：
```go
// DeleteRoomSwapApplication 取消换寝申请（仅申请人本人可删；返回是否真的删了一行）
func (s *DBStore) DeleteRoomSwapApplication(id, applicantID string) bool {
	ctx := context.Background()
	tag, err := database.DB.Exec(ctx,
		"DELETE FROM room_swap_applications WHERE id = $1 AND applicant_id = $2", id, applicantID)
	return err == nil && tag.RowsAffected() > 0
}
```

- [ ] **步骤 2：改 handler 传 caller**

`handlers/room_swaps.go:102-113` 替换 `CancelApplication` 主体：
```go
func (h *RoomSwapHandler) CancelApplication(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Application ID is required")
		return
	}
	callerID := auth.GetUserID(c)
	if !h.store.DeleteRoomSwapApplication(id, callerID) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Application not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "申请已取消"})
}
```
确认 `handlers/room_swaps.go` 顶部已 import `"unidorm-manager-server/auth"`（GetSwapHistory 已用 `auth.GetUserID`，故已 import）。

- [ ] **步骤 3：编译 + 修所有调用方/mock**

运行：`go build ./...`
预期：`store` 的 mock 实现（若 `handlers/*_test.go` 或 `store` 有 fake 实现 `DeleteRoomSwapApplication`）编译失败 → 同步改其签名为 `(id, applicantID string) bool`。先：
```bash
grep -rn "DeleteRoomSwapApplication" --include=*.go .
```
逐个把实现/调用改成新签名。

- [ ] **步骤 4：写 handler 单测（沿用既有 mock）**

先读 `handlers/room_swaps_test.go` 与 `handlers/handlers_test.go` 了解 mock store 与建 gin context（设 userId/claims）的既有写法，照此加：
```go
func TestCancelApplicationOwnershipEnforced(t *testing.T) {
	// 用既有 mock store：记录传入的 applicantID，非本人时返回 false
	// 构造带 claims(UserID="userA") 的 gin context，调用 CancelApplication
	// 断言：删别人的 → 404；mock 收到的 applicantID == "userA"
}
```
（具体 mock 装配照 `handlers/room_swaps_test.go` 现有用例写实。）

- [ ] **步骤 5：改路由 + 全测 + commit**

`main.go:257`（DELETE 路由本身无需加 RequirePermission，归属由 store 约束）保持，但确认在 `api` 组内（已是，有 AuthMiddleware 注入 userId）。
运行：`go test ./... && go build ./...`
live 回归：起后端 → 用 admin 登录建一个换寝申请 → 用另一账号 DELETE → 期望 404；本人 DELETE → 200。
```bash
git add store/interface.go store/store_db.go handlers/room_swaps.go handlers/room_swaps_test.go main.go
git commit -m "fix(room-swaps): 取消申请加申请人归属约束 + 修 RowsAffected 误判 (A1-6/H2)"
```

---

### 任务 7：微信端点 dev-gate + code 日志脱敏（A1-1 + A1-7 auth 部分）

**文件：**
- 修改：`main.go`（抽 `setupAuthRoutes`，wechat 仅非生产注册）、`handlers/auth.go:175`（删 code 日志）
- 测试：`main_test.go`

- [ ] **步骤 1：编写失败的测试**

`main_test.go`：
```go
package main

import (
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"unidorm-manager-server/config"
	"unidorm-manager-server/handlers"
)

func hasRoute(r *gin.Engine, method, path string) bool {
	for _, ri := range r.Routes() {
		if ri.Method == method && ri.Path == path {
			return true
		}
	}
	return false
}

func TestWechatRouteGatedByEnv(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewAuthHandler()

	rProd := gin.New()
	setupAuthRoutes(rProd, h, &config.Config{Env: "production"})
	assert.False(t, hasRoute(rProd, "POST", "/api/auth/wechat/login"), "生产不应注册微信端点")
	assert.True(t, hasRoute(rProd, "POST", "/api/auth/login"), "普通登录始终存在")

	rDev := gin.New()
	setupAuthRoutes(rDev, h, &config.Config{Env: "development"})
	assert.True(t, hasRoute(rDev, "POST", "/api/auth/wechat/login"), "开发应注册微信端点")
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`go test . -run TestWechatRouteGatedByEnv -v`
预期：编译失败 `setupAuthRoutes undefined`

- [ ] **步骤 3：实现**

`main.go`：把 L107-113 的 auth 路由块抽成函数（放在 `func main()` 外）：
```go
// setupAuthRoutes 注册认证路由；微信小程序端点(stub)仅非生产注册，防零凭据接管
func setupAuthRoutes(r *gin.Engine, authHandler *handlers.AuthHandler, cfg *config.Config) {
	auth := r.Group("/api/auth")
	auth.POST("/login", middleware.RateLimitLogin(loginRateLimit, loginRateWindow), authHandler.Login)
	auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)
	auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
	if !cfg.IsProduction() {
		auth.POST("/wechat/login", authHandler.WechatLogin)
	}
}
```
注：`loginRateLimit`/`loginRateWindow`（任务 5 引入）需提升为包级变量或作为参数传入。**做法**：把它们改为 `setupAuthRoutes` 的参数，签名：
```go
func setupAuthRoutes(r *gin.Engine, authHandler *handlers.AuthHandler, cfg *config.Config, rateLimit int, rateWindow time.Duration)
```
并相应更新 `main_test.go` 调用（传 `10, time.Minute`）与 `main()` 调用。`main()` 内把原 L107-113 块替换为：
```go
	setupAuthRoutes(r, authHandler, cfg, loginRateLimit, loginRateWindow)
```
（删掉 main 内原 `auth := r.Group(...)` 那段。）

`handlers/auth.go:175` 删微信 code 日志：
```go
	// （删除）log.Printf("微信登录请求: code=%s, ...", req.Code, ...)
```
若删后 `log` 包在 auth.go 不再被使用，go 编译会报 unused import → 一并删 import。
（可选加固：`WechatLogin` 内 `test_*` 分支若 `cfg.IsProduction()` 直接 401——但路由已摘除，A1 仅靠路由 gate 即可，避免给 handler 注入 cfg 的额外改动，留注释说明。）

- [ ] **步骤 4：运行测试验证通过**

运行：`go test . -run TestWechatRouteGatedByEnv -v && go build ./...`
预期：PASS + 编译通过

- [ ] **步骤 5：Commit**
```bash
git add main.go main_test.go handlers/auth.go
git commit -m "fix(auth): 微信 stub 端点仅非生产注册 + 删 code 日志，堵零凭据接管 (A1-1/A1-7)"
```

---

### 任务 8：定向 IDOR — students by-:id 归属校验（A1-8）

**文件：**
- 修改：`handlers/students.go`（`GetStudentByID:145`，防御性加 `UpdateStudent`/`DeleteStudent`）
- 测试：`handlers/students_test.go`（沿用既有 mock store）

- [ ] **步骤 1：编写失败的测试**

先读 `handlers/students_test.go` 了解既有 mock store + 建 context 写法，照此加：
```go
func TestGetStudentByIDStudentCannotReadOthers(t *testing.T) {
	// mock store 返回一个 studentId="S-OTHER" 的学生
	// gin context：claims.Roles=["student"], claims.StudentID="S-SELF"
	// 调 GetStudentByID(:id="other") → 期望 403
}

func TestGetStudentByIDStaffCanReadAny(t *testing.T) {
	// claims.Roles=["dorm_manager"] → 期望 200
}

func TestGetStudentByIDStudentReadsSelf(t *testing.T) {
	// claims.Roles=["student"], claims.StudentID 与记录匹配 → 200
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`go test ./handlers/ -run TestGetStudentByID -v`
预期：`...StudentCannotReadOthers` FAIL（当前无归属校验，返 200）

- [ ] **步骤 3：实现**

`handlers/students.go`：加辅助函数（文件内，import 需有 `middleware` 与 `auth`，GetStudentByID 已用 middleware）：
```go
// isDormStaff 是否持有可跨人管理学生的角色
func isDormStaff(c *gin.Context) bool {
	for _, r := range auth.GetRoles(c) {
		switch r {
		case "dorm_manager", "building_manager", "logistics_admin", "system_admin":
			return true
		}
	}
	return false
}
```
`GetStudentByID`（L152 拿到 student 后、L158 返回前）插入：
```go
	if !isDormStaff(c) && !middleware.IsSelfData(c, student.StudentID) {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权访问该学生记录")
		return
	}
```
（`student.StudentID` 为该学生的学号字段；`middleware.IsSelfData` 比对 claims.StudentID/UserID。确认 `models.Student` 的字段名——读 `models` 确认是 `StudentID` 还是 `StudentId`，按实际填。）
防御性：在 `UpdateStudent`、`DeleteStudent` 取到目标记录后插入同样 3 行（这两个端点学生本就无权限，属纵深防御）。
确认 `handlers/students.go` 顶部 import 有 `"unidorm-manager-server/auth"`；若无则加。

- [ ] **步骤 4：运行测试验证通过**

运行：`go test ./handlers/ -run TestGetStudentByID -v`
预期：PASS

- [ ] **步骤 5：Commit**
```bash
git add handlers/students.go handlers/students_test.go
git commit -m "fix(students): GetStudentByID 加 staff-or-self 归属校验，堵 IDOR (A1-8/H1)"
```

---

### 任务 9：全量回归 + 文档 + 收尾

- [ ] **步骤 1：单测全绿**

运行：`go test ./...`
预期：所有包 PASS（auth/config/handlers/middleware/models/store/utils）

- [ ] **步骤 2：live 基线不退化**

起栈（见顶部前置）跑：
```bash
BASE=http://localhost:8082 ADMIN_PASS=admin123 python3 ../tests/audit_api.py
```
预期：38/38。（web E2E 若起前端则一并跑；否则至少 API 38/38 + go test 守住后端。）

- [ ] **步骤 3：新 env 文档化**

在 `CLAUDE.md` 的环境变量表（或 `docs/DEPLOYMENT.md`）补：`APP_ENV`(生产 gate)、`CORS_ALLOWED_ORIGINS`、`LOGIN_RATE_LIMIT`(默认 10)、`LOGIN_RATE_WINDOW`(默认 15m)。说明生产必须设 `JWT_SECRET`(≥32)否则拒启动、生产不注册微信端点。
```bash
git add CLAUDE.md docs/DEPLOYMENT.md
git commit -m "docs: A1 新增安全 env 说明 (APP_ENV/CORS/限流)"
```

- [ ] **步骤 4：更新路线图进度**

在 `docs/superpowers/specs/2026-06-03-backend-web-production-readiness-roadmap.md` 末尾加"修复进度"小节，标 A1 各项 commit hash。

---

## 自检结果

**规格覆盖度：** A1-1(任务7)、A1-2(任务2)、A1-3(任务3)、A1-4(任务4)、A1-5(任务5)、A1-6(任务6)、A1-7(任务2 jwt + 任务7 auth)、A1-8(任务8)、136 基线(任务9)。全覆盖。

**占位符扫描：** 任务 6/8 的 handler 测试要求"先读既有 mock store 模式再写实"——这是因 mock 装配依赖未读的 `handlers_test.go` 既有结构;执行者第一步即读该文件照写，非 TODO。其余步骤均含实际代码。

**类型一致性：** `DeleteRoomSwapApplication(id, applicantID string) bool` 在 interface/impl/handler/mock 四处一致;`setupAuthRoutes` 签名含 `rateLimit int, rateWindow time.Duration`，main 与 main_test 调用一致;`isDormStaff`/`IsSelfData`/`GetRoles`/`GetUserID` 均为已存在或本计划定义的函数。

**已知执行期需确认（非占位，含定位指令）：**
- `models.Student` 学号字段名（`StudentID` vs `StudentId`）— 任务 8 步骤 3 指明读 models 确认
- `handlers/*_test.go` 既有 mock store 装配 — 任务 6/8 指明先读再照写
- 旧 `middleware_test.go` 的 CORS `*` 断言可能需随任务 4 更新
