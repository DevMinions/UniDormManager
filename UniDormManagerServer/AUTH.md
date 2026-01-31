# 用户认证和权限系统

## 概述

系统实现了基于 RBAC（基于角色的访问控制）的用户认证和权限管理系统。

## 架构设计

### 核心组件

1. **认证模块** (`auth/`)
   - JWT Token 生成和验证
   - 密码加密和验证
   - Context 工具函数

2. **中间件** (`middleware/`)
   - 认证中间件：验证 Token
   - RBAC 中间件：权限检查

3. **存储层** (`store/user_store.go`)
   - 用户 CRUD 操作
   - 角色和权限查询

4. **处理器** (`handlers/auth.go`)
   - 登录/登出
   - 获取当前用户信息

## 数据库设计

### 核心表

- `users` - 用户表
- `roles` - 角色表
- `permissions` - 权限表
- `user_roles` - 用户角色关联表
- `role_permissions` - 角色权限关联表
- `user_students` - 用户学生关联表
- `token_blacklist` - Token 黑名单

### 预定义角色

1. **student** (学生) - 级别 1
2. **maintenance_staff** (维修人员) - 级别 2
3. **dorm_manager** (宿管员) - 级别 3
4. **building_manager** (楼栋管理员) - 级别 4
5. **logistics_admin** (后勤管理员) - 级别 5
6. **system_admin** (系统管理员) - 级别 10

### 权限格式

权限代码格式：`resource:action`

例如：
- `students:read` - 查看学生
- `students:create` - 创建学生
- `repairs:update` - 更新报修

## API 端点

### 认证相关

```
POST   /api/auth/login      # 登录
POST   /api/auth/logout      # 登出（需要认证）
GET    /api/auth/me          # 获取当前用户信息（需要认证）
```

### 登录请求示例

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 响应示例

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-admin-1",
    "username": "admin",
    "email": "admin@unidorm.edu",
    "realName": "系统管理员",
    "roles": ["system_admin"],
    "studentId": null
  },
  "expiresIn": 86400
}
```

### 使用 Token

在后续请求中，需要在请求头中携带 Token：

```bash
curl http://localhost:8080/api/students \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 初始化管理员账户

### 方法 1：使用初始化工具

```bash
cd UniDormManagerServer
go run cmd/init_admin/main.go [password]
```

默认密码：`admin123`

### 方法 2：手动创建

1. 启动服务器（会自动创建表结构）
2. 使用 SQL 插入用户（需要先生成密码哈希）

## 权限检查

### 在路由中使用

```go
// 要求认证
api.Use(middleware.AuthMiddleware())

// 要求特定权限
students.GET("", middleware.RequirePermission("students", "read"), handler.GetAllStudents)

// 要求特定角色
admin := api.Group("/admin", middleware.RequireRole("system_admin"))
```

### 在处理器中检查

```go
func (h *StudentHandler) GetAllStudents(c *gin.Context) {
    // 检查权限
    if !middleware.CheckPermission(c, "students", "read") {
        middleware.WriteError(c, http.StatusForbidden, "forbidden", "No permission")
        return
    }
    
    // 获取权限范围
    scope := middleware.GetPermissionScope(c, "students", "read")
    
    // 根据范围过滤数据
    students := h.store.GetAllStudents()
    if scope == "self" {
        // 只返回自己的数据
    }
}
```

## 环境变量配置

```bash
# JWT 密钥（生产环境必须设置）
export JWT_SECRET=your-secret-key-change-in-production

# 数据库配置
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=unidorm
```

## 安全建议

1. **生产环境必须设置 JWT_SECRET**
   - 使用强随机字符串
   - 长度至少 32 字符

2. **密码策略**
   - 最小长度 8 字符
   - 包含大小写字母、数字
   - 定期更换密码

3. **Token 安全**
   - Token 过期时间：24 小时
   - 使用 HTTPS 传输
   - 实现 Token 刷新机制

4. **权限验证**
   - 前端显示控制 + 后端强制验证
   - 记录操作日志
   - 定期审计权限分配

## 下一步

1. 实现用户管理接口（需要管理员权限）
2. 实现角色管理接口（需要管理员权限）
3. 实现权限缓存优化
4. 实现 Token 刷新机制
5. 实现操作日志记录

