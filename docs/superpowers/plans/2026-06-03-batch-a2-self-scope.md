# Batch A2 self-scope 系统 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现。步骤用复选框（`- [ ]`）跟踪。

**目标：** DB 驱动 scope 装载进 JWT + students 对象级/列表级 self-scope 强制(学生只能读/列自己),堵住学生经 `GET /students` 枚举全部学生的缺口。

**架构：** 登录时从 `role_permissions` 查每权限 scope(多角色取最宽)塞进 `claims.Scopes`;`middleware.GetPermissionScope` 读它;students handler 据 scope=self 做对象归属校验 + 列表注入 `WHERE s.id=$self`。

**技术栈：** Go / Gin / pgx / testify。

**上游：** spec `docs/superpowers/specs/2026-06-03-batch-a2-self-scope-design.md`。代码在 main(A1 已合并)。

**前置(执行者先做一次,live 回归用):**
```bash
docker run -d --name unidorm_pg_audit -e POSTGRES_DB=unidorm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16-alpine
# 跑后端:cd UniDormManagerServer && DB_HOST=localhost DB_PORT=5433 DB_USER=postgres DB_PASSWORD=postgres DB_NAME=unidorm DB_SSLMODE=disable USE_CACHE=false APP_ENV=development JWT_SECRET=audit-test-secret-key-min-32-characters-long-xyz ADMIN_INITIAL_PASSWORD=admin123 LOGIN_RATE_LIMIT=10000 PORT=8082 go run main.go
# 回归:BASE=http://localhost:8082 ADMIN_PASS=admin123 python3 ../tests/audit_api.py → 38/38
```

---

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `auth/jwt.go` | Claims 加 `Scopes`;`GenerateToken` 加参数 | 修改 |
| `auth/jwt_test.go` | scopes 往返测试 | 扩 |
| `store/user_store.go` | `GetUserPermissionScopes` + `mergeBroadest` | 修改 |
| `store/user_store_test.go` | `mergeBroadest` 单测 | 创建/扩 |
| `handlers/auth.go` | Login/WechatLogin 装载 scopes | 修改 |
| `middleware/rbac.go` | `GetPermissionScope` 读 claims.Scopes | 修改 |
| `middleware/rbac_test.go` | GetPermissionScope 单测 | 创建/扩 |
| `models/pagination.go` | `StudentFilter` 加 `ScopeSelfID` | 修改 |
| `utils/query_builder.go` | `BuildStudentQuery` 注入 self 过滤 | 修改 |
| `utils/query_builder_test.go` | self 过滤测试 | 扩 |
| `handlers/students.go` | 对象级 scope 驱动 + 列表覆写 ScopeSelfID;删 isDormStaff | 修改 |
| `handlers/students_test.go` | 对象 + 列表 scope 测试 | 修改 |

---

### 任务 1：Claims 加 Scopes + GenerateToken 参数

**文件：** 修改 `auth/jwt.go`、`auth/jwt_test.go`、call sites `handlers/auth.go`

- [ ] **步骤 1：写失败测试** `auth/jwt_test.go` 追加：
```go
func TestGenerateTokenCarriesScopes(t *testing.T) {
	_ = SetJWTSecret("a-very-long-and-secure-secret-key-1234567890")
	scopes := map[string]string{"students:read": "self"}
	tok, err := GenerateToken("u1", "alice", []string{"student"}, []string{"students:read"}, nil, nil, scopes)
	assert.NoError(t, err)
	claims, err := ParseToken(tok)
	assert.NoError(t, err)
	assert.Equal(t, "self", claims.Scopes["students:read"])
}
```

- [ ] **步骤 2：运行验证失败**
`go test ./auth/ -run TestGenerateTokenCarriesScopes -v` → 编译失败(GenerateToken 参数不符 / Claims 无 Scopes)。

- [ ] **步骤 3：实现** `auth/jwt.go`：
1. `Claims` struct(L20 区)加字段(在 `StudentID` 后):
```go
	Scopes map[string]string `json:"scopes,omitempty"` // perm-code → scope(self/building/all)
```
2. `GenerateToken` 签名末尾加 `scopes map[string]string`,claims 字面量加 `Scopes: scopes`：
```go
func GenerateToken(userID, username string, roles, permissions, buildingIDs []string, studentID *string, scopes map[string]string) (string, error) {
	...
	claims := Claims{
		...
		StudentID:   studentID,
		Scopes:      scopes,
		...
	}
	...
}
```

- [ ] **步骤 4：修 call sites 让其编译**
`handlers/auth.go`:两处 `auth.GenerateToken(...)`(约 L137 Login、L292 WechatLogin)末尾加 `, nil`(任务3 换真值)。`go build ./...` 通过。

- [ ] **步骤 5：验证 + commit**
`go test ./auth/ -v` PASS;`go test ./...` 不退化。
```bash
git add auth/jwt.go auth/jwt_test.go handlers/auth.go
git commit -m "feat(auth): Claims 加 Scopes + GenerateToken 透传 (A2 单元1)"
```

---

### 任务 2：GetUserPermissionScopes + mergeBroadest

**文件：** 修改 `store/user_store.go`;创建/扩 `store/user_store_test.go`

- [ ] **步骤 1：写失败测试** `store/user_store_test.go`(包 `store`)：
```go
func TestMergeBroadest(t *testing.T) {
	assert.Equal(t, "self", mergeBroadest("", "self"))
	assert.Equal(t, "all", mergeBroadest("self", "all"))
	assert.Equal(t, "all", mergeBroadest("all", "self"))
	assert.Equal(t, "building", mergeBroadest("self", "building"))
	assert.Equal(t, "building", mergeBroadest("building", "self"))
}
```
（若 `store/user_store_test.go` 不存在则创建,加 `package store` + testify import。）

- [ ] **步骤 2：运行验证失败**
`go test ./store/ -run TestMergeBroadest -v` → 编译失败(mergeBroadest 未定义)。

- [ ] **步骤 3：实现** `store/user_store.go` 追加：
```go
// mergeBroadest 多角色对同一权限取最宽 scope(all > building > self)
func mergeBroadest(existing, incoming string) string {
	rank := map[string]int{"self": 1, "building": 2, "all": 3}
	if rank[incoming] > rank[existing] {
		return incoming
	}
	return existing
}

// GetUserPermissionScopes 返回用户每个权限码的有效 scope(多角色取最宽)
func (s *UserStore) GetUserPermissionScopes(userID string) (map[string]string, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx,
		`SELECT p.code, rp.scope
		 FROM user_roles ur
		 INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
		 INNER JOIN permissions p ON rp.permission_id = p.id
		 WHERE ur.user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	scopes := make(map[string]string)
	for rows.Next() {
		var code, scope string
		if err := rows.Scan(&code, &scope); err != nil {
			return nil, err
		}
		scopes[code] = mergeBroadest(scopes[code], scope)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return scopes, nil
}
```

- [ ] **步骤 4：验证 + commit**
`go test ./store/ -run TestMergeBroadest -v` PASS;`go build ./...`;`go test ./...` 不退化。
```bash
git add store/user_store.go store/user_store_test.go
git commit -m "feat(store): GetUserPermissionScopes + mergeBroadest 取最宽 (A2 单元1)"
```

---

### 任务 3：Login/WechatLogin 装载 scopes

**文件：** 修改 `handlers/auth.go`

- [ ] **步骤 1：实现**（此任务无独立单测,由 live audit 覆盖;改动机械）
`Login`(约 L131-137)在 `GenerateToken` 调用前加:
```go
	scopes, err := h.userStore.GetUserPermissionScopes(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "加载权限范围失败")
		return
	}
```
并把该处 `auth.GenerateToken(..., studentID, nil)` 的 `nil` 换成 `scopes`。
`WechatLogin`(约 L286-292)同样:加载 `scopes`(出错可 `scopes = map[string]string{}` 容错,因 stub 账号),`GenerateToken` 末参换 `scopes`。

- [ ] **步骤 2：验证 + commit**
`go build ./...`;`go test ./...` 不退化。起后端(见前置)→ `python3 ../tests/audit_api.py` 期望 38/38(admin 登录带 scopes 不报错)。
```bash
git add handlers/auth.go
git commit -m "feat(auth): 登录装载 permission scopes 进 token (A2 单元1)"
```

---

### 任务 4：GetPermissionScope 读 claims.Scopes

**文件：** 修改 `middleware/rbac.go`;创建/扩 `middleware/rbac_test.go`

- [ ] **步骤 1：写失败测试** `middleware/rbac_test.go`(包 `middleware`)：
```go
func TestGetPermissionScope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mk := func(scopes map[string]string) *gin.Context {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Set("claims", &auth.Claims{Scopes: scopes})
		return c
	}
	assert.Equal(t, "self", GetPermissionScope(mk(map[string]string{"students:read": "self"}), "students", "read"))
	assert.Equal(t, "all", GetPermissionScope(mk(map[string]string{"students:read": "all"}), "students", "read"))
	// 缺失 → fail-safe self
	assert.Equal(t, "self", GetPermissionScope(mk(map[string]string{}), "students", "read"))
	// 无 claims → self
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	assert.Equal(t, "self", GetPermissionScope(c, "students", "read"))
}
```
（确认 `auth.GetClaims` 从 context key `"claims"` 读 `*auth.Claims`——先读 `auth/context.go` 确认 key 名,测试照此 `c.Set`。）

- [ ] **步骤 2：运行验证失败**
`go test ./middleware/ -run TestGetPermissionScope -v` → 当前占位实现按 role 返回,断言不符 FAIL。

- [ ] **步骤 3：实现** 替换 `middleware/rbac.go` 的 `GetPermissionScope`(L126)：
```go
// GetPermissionScope 返回调用者对某权限的 scope(self/building/all);
// 来源是登录装载的 claims.Scopes(DB 驱动);缺失/无 claims fail-safe 取最严 self。
func GetPermissionScope(c *gin.Context, resource, action string) string {
	claims := auth.GetClaims(c)
	if claims == nil {
		return "self"
	}
	if s, ok := claims.Scopes[resource+":"+action]; ok && s != "" {
		return s
	}
	return "self"
}
```

- [ ] **步骤 4：验证 + commit**
`go test ./middleware/ -run TestGetPermissionScope -v` PASS;`go test ./...` 不退化。
```bash
git add middleware/rbac.go middleware/rbac_test.go
git commit -m "fix(rbac): GetPermissionScope 读 claims.Scopes(替换占位) (A2 单元2)"
```

---

### 任务 5：students 对象级 scope 驱动(取代 A1 isDormStaff)

**文件：** 修改 `handlers/students.go`、`handlers/students_test.go`

- [ ] **步骤 1：改测试为 scope 驱动**（A1 用 isDormStaff;A2 用 claims.Scopes）
`handlers/students_test.go` 的 `TestStudentHandler_GetStudentByID`:把注入 staff 角色的用例改为注入 `claims.Scopes`。即 `authMiddlewareForStudent` 风格的 helper 改为可设 Scopes:
- "scope=all 读任意 → 200":claims.Scopes `{"students:read":"all"}`。
- "scope=self 读自己 → 200":Scopes `{"students:read":"self"}` + claims.StudentID=记录主键。
- "scope=self 读别人 → 403":Scopes self + StudentID≠记录主键。
（保留 A1 的真实主键模型:record.ID=主键、StudentID=学号、claims.StudentID=主键值。）

- [ ] **步骤 2：运行验证失败**
`go test ./handlers/ -run TestStudentHandler_GetStudentByID -v` → 因 handler 仍用 isDormStaff(不看 scope)而 FAIL。

- [ ] **步骤 3：实现** `handlers/students.go`：
1. `GetStudentByID` 把 A1 的 `if !isDormStaff(c) && !middleware.IsSelfData(c, student.ID) {...}` 改为:
```go
	if middleware.GetPermissionScope(c, "students", "read") == "self" && !middleware.IsSelfData(c, student.ID) {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权访问该学生记录")
		return
	}
```
2. `UpdateStudent` 把 A1 的同款 `if !isDormStaff(c) && !middleware.IsSelfData(c, existing.ID)` 改为同样的 scope 驱动(权限码用 `"students","update"`):
```go
	if middleware.GetPermissionScope(c, "students", "update") == "self" && !middleware.IsSelfData(c, existing.ID) {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权修改该学生记录")
		return
	}
```
3. 删除 A1 的 `isDormStaff` helper 函数(确认全文件无其它引用:`grep -n isDormStaff handlers/`)。

- [ ] **步骤 4：验证 + commit**
`go test ./handlers/ -run TestStudentHandler_GetStudentByID -v` PASS;`go test ./...` 不退化。
```bash
git add handlers/students.go handlers/students_test.go
git commit -m "refactor(students): 对象级 IDOR 改 scope 驱动,删 A1 isDormStaff (A2 单元3)"
```

---

### 任务 6：students 列表级 self 过滤

**文件：** 修改 `models/pagination.go`、`utils/query_builder.go`、`utils/query_builder_test.go`、`handlers/students.go`、`handlers/students_test.go`

- [ ] **步骤 1：写失败测试**（query 层 + handler 层）
`utils/query_builder_test.go` 追加：
```go
func TestBuildStudentQueryScopeSelf(t *testing.T) {
	req := &models.PaginatedRequest{Page: 1, PageSize: 10}
	filter := &models.StudentFilter{ScopeSelfID: "stu-pk-self"}
	dataQB, _ := BuildStudentQuery(context.Background(), req, filter)
	q, args := dataQB.BuildQuery()
	assert.Contains(t, q, "s.id = $")
	assert.Contains(t, args, "stu-pk-self")
}

func TestBuildStudentQueryNoScopeNoFilter(t *testing.T) {
	req := &models.PaginatedRequest{Page: 1, PageSize: 10}
	filter := &models.StudentFilter{} // ScopeSelfID 空
	dataQB, _ := BuildStudentQuery(context.Background(), req, filter)
	q, _ := dataQB.BuildQuery()
	assert.NotContains(t, q, "s.id = $")
}
```
`handlers/students_test.go` 加(若既有 mock 易表达):`TestStudentsPaginated_StudentScopedToSelf` —— claims.Scopes `{"students:read":"self"}` + StudentID="stu-pk-self",调 GetStudentsPaginated,断言传给 mock store 的 `filter.ScopeSelfID == "stu-pk-self"`;staff(scope all)→ `filter.ScopeSelfID == ""`。

- [ ] **步骤 2：运行验证失败**
`go test ./utils/ -run TestBuildStudentQueryScopeSelf -v` → 编译失败(StudentFilter 无 ScopeSelfID)。

- [ ] **步骤 3：实现**
1. `models/pagination.go` 的 `StudentFilter` 加字段(**无 form tag**,不从用户输入绑定;`json:"-"` 不外露):
```go
	ScopeSelfID string `json:"-"` // 仅由 handler 从 claims 覆写(self-scope),不绑定用户输入
```
2. `utils/query_builder.go` 的 `BuildStudentQuery`,在现有 `WhereLike(...)` 链之后、`dataQB := qb.Clone()` 之前加(注意表别名 `s`):
```go
	if filter.ScopeSelfID != "" {
		qb.Where(fmt.Sprintf("s.id = $%d", len(qb.args)+1), filter.ScopeSelfID)
	}
```
3. `handlers/students.go` 的 `GetStudentsPaginated`:把现有死占位块(`isSystemAdmin` 判定 + `if !isSystemAdmin && len(claims.BuildingIDs)>0 {空}`,约 L58-72)整段替换为 scope 驱动:
```go
	// self-scope:学生只能列自己;all/building 不过滤(building 留 A2b)
	if middleware.GetPermissionScope(c, "students", "read") == "self" {
		if claims.StudentID != nil {
			filter.ScopeSelfID = *claims.StudentID
		} else {
			filter.ScopeSelfID = "\x00__no_self__" // fail-safe:nil StudentID → 空结果,绝不退化看全部
		}
	}
```
（确认 `middleware` 已 import;`claims` 变量在该函数已取。)

- [ ] **步骤 4：验证 + commit**
`go test ./utils/ -run TestBuildStudentQuery -v`(新+旧不退化)、`go test ./handlers/ -v`、`go test ./...` 全绿。
```bash
git add models/pagination.go utils/query_builder.go utils/query_builder_test.go handlers/students.go handlers/students_test.go
git commit -m "feat(students): 列表级 self-scope 注入 WHERE s.id=self,堵学生枚举 (A2 单元3)"
```

---

### 任务 7：全量回归 + live + 文档

- [ ] **步骤 1：单测全绿** `go test ./...` 所有包 PASS。
- [ ] **步骤 2：live 基线** 起栈(前置)→ `python3 ../tests/audit_api.py` 期望 38/38(admin scope=all,students 列表仍全量)。
- [ ] **步骤 3：文档** 在路线图 `docs/superpowers/specs/2026-06-03-backend-web-production-readiness-roadmap.md` §7 加 A2 进度行 + commit hash。
```bash
git add docs/superpowers/specs/2026-06-03-backend-web-production-readiness-roadmap.md
git commit -m "docs(roadmap): 记 A2 self-scope 完成"
```

---

## 自检结果

**规格覆盖度：** 单元1(Claims.Scopes 装载)=任务1/2/3;单元2(GetPermissionScope)=任务4;单元3(students 对象级=任务5、列表级=任务6);回归=任务7。全覆盖。nil StudentID fail-safe = 任务6 步骤3。

**占位符扫描：** 任务4 步骤1 要求"先读 auth/context.go 确认 claims context key"——非 TODO,是定位指令(测试 `c.Set("claims",...)` 的 key 必须与 `auth.GetClaims` 读的一致)。任务3/6 的 mock 表达依赖既有测试结构,执行者先读再照写。其余步骤均含实际代码。

**类型一致性：** `GenerateToken(..., scopes map[string]string)` 签名在 jwt.go/两处 call site 一致;`Claims.Scopes map[string]string` 在 jwt/rbac/测试一致;`StudentFilter.ScopeSelfID string` 在 model/query_builder/handler 一致;`GetPermissionScope(c, resource, action) string`、`mergeBroadest(existing, incoming) string`、`GetUserPermissionScopes(userID) (map[string]string, error)` 各处一致。

**执行期需确认(含定位指令,非占位):** `auth.GetClaims` 的 context key(任务4);`handlers/students_test.go` 既有 mock store + claims 注入 helper(任务5/6 照 A1 用例改)。
