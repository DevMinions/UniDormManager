# Batch A2 — self-scope 系统(设计)

**日期**: 2026-06-03
**上游**: [生产级修复路线图](./2026-06-03-backend-web-production-readiness-roadmap.md) Batch A2;承接 [A1](./2026-06-03-batch-a1-security-quickfixes-design.md)
**状态**: 设计待审

## 1. 背景与决策

A1 已闭环安全阻断项,IDOR 用了**定向**归属校验(`GetStudentByID` 主键比对)。A2 做 DB 驱动的通用 scope。已与用户确认:

- **scope 机制 = DB 驱动**:登录时从 `role_permissions` 加载用户每个权限的 scope 进 Claims,中间件/handler 据此强制。(尊重 `role_permissions.scope` 这个唯一真相,并为 A2b/未来资源复用。)
- **A2 范围 = 只做 self-scope**;building-scope 拆 [A2b](#7-范围外后续)(因 `building_id`↔`building` 名字错配复杂,且只 building_manager 用)。

## 2. 关键发现:self-scope 实际只干净适用于 students

`scope='self'` 的全部 `role_permissions` 行(`init_auth_data.go:66-71`)**仅 role-student**:`students:read`、`repairs:create`、`repairs:read`、`dashboard:read`。但:

- **`repair_requests` 表无 owner 列**(`database.go`:只有 `room_number`,无 `student_id`/`user_id`)→ 维修单挂房间不挂学生,无法干净地"只看自己的维修单"。→ **repairs self-scope 延后**(需先加 schema owner 列,见 §7)。
- **`dashboard:read=self`** 是聚合统计,非 object/list,属另一种强制模式 → **延后**。
- **students** self-scope 干净(`students.id` = `claims.StudentID` 主键,A1 已验证对象级)。

**因此 A2 落地目标 = 通用 scope 基建 + students 的 self 强制。** A1 已做 students 对象级(`GetStudentByID`),**真正未堵的缺口是 students 列表端点**:学生持 `students:read`(scope=self)能过权限门,但 `GET /students` 列表无视 scope → **学生可枚举全部学生**。A2 堵这条,并把 A1 的定向校验升级为 scope 驱动。

## 3. 架构(3 个单元)

### 单元 1 — scope 装载进 token(`auth` + `store/user_store` + `handlers/auth`)

- `auth.Claims`(`auth/jwt.go:20`)加字段:
  ```go
  Scopes map[string]string `json:"scopes,omitempty"` // perm-code → scope(self/building/all)
  ```
- `GenerateToken` 签名加 `scopes map[string]string` 参数,塞进 claims。
- 新 store 方法 `UserStore.GetUserPermissionScopes(userID string) (map[string]string, error)`:
  ```sql
  SELECT p.code, rp.scope
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = $1
  ```
  Go 层合并:同一 code 多角色取**最宽**(`all` > `building` > `self`)。
- `handlers/auth.go` 的 `Login`(L137 附近)和 `WechatLogin`(L292 附近):`scopes, _ := h.userStore.GetUserPermissionScopes(user.ID)`,传给 `GenerateToken`。

### 单元 2 — scope 解析(`middleware/rbac.go`)

替换占位 `GetPermissionScope`(L126,当前是硬编码 role→scope map):
```go
// GetPermissionScope 返回调用者对某权限的 scope(self/building/all);
// 缺失则 fail-safe 取最严 "self"。来源是登录时装载的 claims.Scopes(DB 驱动)。
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
（`FilterByScope`/`ExtractBuildingIDs` 等其它占位 A2 不动,留 A2b。）

### 单元 3 — students self 强制(`handlers/students.go` + `models` + `utils/query_builder.go` + `store`)

**对象级** `GetStudentByID`(把 A1 的 `isDormStaff||self` 改为 scope 驱动):
```go
if middleware.GetPermissionScope(c, "students", "read") == "self" && !middleware.IsSelfData(c, student.ID) {
	middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权访问该学生记录")
	return
}
```
`all`/`building` → 放行(building 不过滤留 A2b,**不退化**:building_manager 现状本就看全部)。`UpdateStudent` 同样改 scope 驱动。删除 A1 引入的 `isDormStaff` helper(被 scope 驱动取代,确认无其它引用)。

**列表级** `GET /students`(`GetStudentsPaginated` → `BuildStudentQuery`):
- `models.StudentFilter` 加字段 `ScopeSelfID string`(**不加 query/form binding tag**,不从用户输入绑定)。
- `handlers/students.go` 的 list handler:`ShouldBindQuery` 之后**显式覆写** `filter.ScopeSelfID`:
  ```go
  if middleware.GetPermissionScope(c, "students", "read") == "self" {
      filter.ScopeSelfID = auth.GetClaims(c).StudentID 解引用 // claims.StudentID 是 *string,= students.id 主键
  }
  ```
  (用户即使传 `?scopeSelfID=x` 也被覆写,安全。)
- `BuildStudentQuery`(`utils/query_builder.go:110`)**签名不变**,内部在构建 WHERE 阶段加:
  ```go
  if filter.ScopeSelfID != "" {
      qb.Where(fmt.Sprintf("id = $%d", len(qb.args)+1), filter.ScopeSelfID)
  }
  ```
  （签名不变是有意:避免撞上正在进行的 query_builder fuzz/B6 工作。)

**数据流**:登录 → claims.Scopes 含 `students:read→self`(学生)→ 列表请求 → handler 读 scope=self → 覆写 filter.ScopeSelfID=自己主键 → query 注入 `WHERE id=$self` → 学生只见自己;staff(scope=all)→ ScopeSelfID 空 → 不过滤 → 见全部。

**fail-safe(nil StudentID)**:若 scope=`self` 但 `claims.StudentID==nil`(异常,如学生用户未关联 student 记录)→ 对象级 `GetStudentByID` 返 403(`IsSelfData` 对 nil 已返 false);列表级把 `ScopeSelfID` 置为不可能匹配的哨兵(如 `"\x00__no_self__"`)使结果为空。**绝不**因 nil 退化成"不过滤看全部"。

## 4. 从 A1 迁移

A1 在 `students.go` 加了 `isDormStaff(c)` + 定向 `IsSelfData(c, student.ID)`。A2 用 scope 驱动取代:`GetPermissionScope=="self"` 蕴含"非 staff"(staff 的 students:read scope=all)。迁移后删 `isDormStaff`,对象级行为等价(staff 放行、学生限自己),并新增列表级。A1 的 students 测试相应改为 scope 驱动断言。

## 5. 测试策略(TDD)

1. `GetUserPermissionScopes`:多角色合并取最宽(造一个兼 student+dorm_manager 的用户 → students:read 应得 `all`);单 student → `self`。
2. `GetPermissionScope`:claims.Scopes 命中返回对应;缺失 fail-safe `self`;无 claims `self`。
3. students 对象级(scope 驱动):学生 self→200、学生 other→403、staff(scope=all)→200 任意。(改自 A1 用例,真实主键模型。)
4. **students 列表级**(新):学生 token → 结果只含自己;staff → 含全部。用 handler httptest + mock store,断言传入 store 的 `filter.ScopeSelfID` = 学生主键(scope=self)/ 空(staff)。
5. `BuildStudentQuery`:`filter.ScopeSelfID` 非空 → baseQuery 含 `WHERE id = $n` 且占位符对齐;空 → 无该条件(不退化既有 BuildStudentQuery 测试/fuzz)。
6. 守 `go test ./...` 全绿 + live audit_api 38/38(admin scope=all,不受影响)。

## 6. 成功标准

1. Claims.Scopes 登录装载,DB 驱动(role_permissions 真相)。
2. students 对象级 + **列表级** self-scope 真生效:学生只能读/列自己;staff 不受限。各配带牙测试(列表级证明学生看不到他人)。
3. A1 的定向 students 校验被 scope 驱动取代,行为不退化。
4. `go test ./...` 全绿;136 live 基线不退化。
5. building/all 在 A2 一律不过滤(building_manager 无退化),为 A2b 预留 claims.Scopes 机制。

## 7. 范围外 / 后续

- **A2b building-scope**:`claims.BuildingIDs`(=`user_roles.building_id`,buildings.id 主键)→ `students.building`/`rooms.building`(名字)需 ID→名 解析层;覆盖 building_manager 的 buildings/rooms/students/repairs。
- **repairs self-scope**:`repair_requests` 需先加 owner 列(`student_id`/`reporter_id`)——schema 变更,归 Batch B 或单独决策。
- **dashboard self-scope**:聚合统计的 scope,另一种强制模式,延后。
- repairs/dashboard 在 A2 期间:学生持这些 self 权限但 A2 不对其列表注入过滤(维持现状,不在 A2 制造半成品)。
