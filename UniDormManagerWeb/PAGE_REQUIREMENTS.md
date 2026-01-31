# 用户和角色权限管理页面需求文档

## 概述

本系统支持完整的 RBAC（基于角色的访问控制）权限管理，需要前端页面来配置和管理用户、角色和权限。所有页面需要权限控制，只有拥有相应权限的用户才能访问。

## API 端点

### 用户管理
- `GET /api/users` - 获取所有用户（需要 `users:read` 权限）
- `GET /api/users/:id` - 获取单个用户（需要 `users:read` 权限）
- `POST /api/users` - 创建用户（需要 `users:create` 权限）
- `PUT /api/users/:id` - 更新用户（需要 `users:update` 权限）
- `DELETE /api/users/:id` - 删除用户（需要 `users:delete` 权限）
- `POST /api/users/:id/roles` - 分配角色给用户（需要 `users:update` 权限）

### 角色管理
- `GET /api/roles` - 获取所有角色（需要 `roles:read` 权限）
- `GET /api/roles/:id` - 获取单个角色（需要 `roles:read` 权限）
- `POST /api/roles` - 创建角色（需要 `roles:create` 权限）
- `PUT /api/roles/:id` - 更新角色（需要 `roles:update` 权限）
- `DELETE /api/roles/:id` - 删除角色（需要 `roles:delete` 权限）

### 权限管理
- `GET /api/permissions` - 获取所有权限（需要 `roles:read` 权限）

## 页面需求

### 1. 用户管理页面 (UserManagement.tsx)

**路由**: `/users`  
**权限要求**: `users:read`

#### 功能需求

1. **用户列表展示**
   - 表格显示所有用户
   - 列：用户名、真实姓名、邮箱、手机号、状态、角色、创建时间、操作
   - 支持搜索（按用户名、真实姓名、邮箱）
   - 支持按状态筛选（Active/Inactive/Suspended）
   - 支持按角色筛选
   - 分页显示

2. **创建用户**
   - 按钮：右上角"创建用户"按钮（需要 `users:create` 权限）
   - 表单字段：
     - 用户名（必填，唯一）
     - 密码（必填，至少6位）
     - 确认密码（必填，需与密码一致）
     - 邮箱（可选）
     - 手机号（可选）
     - 真实姓名（可选）
     - 角色选择（多选，至少选择一个）
     - 关联学生（可选，下拉选择学生）
     - 楼栋选择（如果选择楼栋管理员角色，必填）
   - 提交后刷新列表

3. **编辑用户**
   - 点击表格中的"编辑"按钮（需要 `users:update` 权限）
   - 表单字段：
     - 邮箱（可编辑）
     - 手机号（可编辑）
     - 真实姓名（可编辑）
     - 状态（下拉选择：Active/Inactive/Suspended）
     - 角色选择（多选，可修改）
     - 关联学生（可修改）
   - 不能修改用户名和密码（密码修改单独功能）

4. **删除用户**
   - 点击表格中的"删除"按钮（需要 `users:delete` 权限）
   - 确认对话框："确定要删除用户 {username} 吗？"
   - 不能删除自己
   - 删除后刷新列表

5. **分配角色**
   - 点击表格中的"分配角色"按钮（需要 `users:update` 权限）
   - 弹窗显示：
     - 当前角色列表（标签显示）
     - 角色选择器（多选）
     - 楼栋选择（如果选择楼栋管理员角色）
   - 保存后刷新用户信息

6. **状态显示**
   - 状态标签颜色：
     - Active: 绿色
     - Inactive: 灰色
     - Suspended: 红色

7. **角色显示**
   - 以标签形式显示用户的所有角色
   - 不同角色用不同颜色区分

#### UI/UX 要求
- 使用表格布局，响应式设计
- 操作按钮使用图标+文字
- 表单验证提示清晰
- 加载状态和错误提示
- 成功操作后显示提示消息

---

### 2. 角色管理页面 (RoleManagement.tsx)

**路由**: `/roles`  
**权限要求**: `roles:read`

#### 功能需求

1. **角色列表展示**
   - 卡片或表格形式展示所有角色
   - 显示信息：角色代码、角色名称、描述、优先级、权限数量、创建时间
   - 支持搜索（按角色代码、名称）
   - 支持按优先级排序

2. **创建角色**
   - 按钮：右上角"创建角色"按钮（需要 `roles:create` 权限）
   - 表单字段：
     - 角色代码（必填，唯一，英文小写+下划线，如：custom_role）
     - 角色名称（必填，中文名称）
     - 描述（可选）
     - 优先级（必填，数字，1-10）
     - 权限选择（多选，按资源分组显示）
       - 学生管理：查看、创建、更新、删除、办理入住、办理退宿
       - 楼栋管理：查看、创建、更新、删除
       - 房间管理：查看、创建、更新、删除
       - 报修管理：查看、创建、更新、删除
       - 公告管理：查看、创建、更新、删除
       - 仪表板：查看
       - 用户管理：查看、创建、更新、删除
       - 角色管理：查看、创建、更新、删除
   - 权限选择支持：
     - 按资源全选/取消全选
     - 单个权限选择
     - 显示权限描述
   - 提交后刷新列表

3. **编辑角色**
   - 点击卡片/表格中的"编辑"按钮（需要 `roles:update` 权限）
   - 表单字段：
     - 角色代码（只读，不可修改）
     - 角色名称（可编辑）
     - 描述（可编辑）
     - 优先级（可编辑）
     - 权限选择（可修改）
   - 预定义角色（student, dorm_manager等）不能编辑

4. **删除角色**
   - 点击卡片/表格中的"删除"按钮（需要 `roles:delete` 权限）
   - 确认对话框："确定要删除角色 {name} 吗？删除后，拥有该角色的用户将失去相关权限。"
   - 预定义角色不能删除（禁用删除按钮或提示）
   - 删除前检查是否有用户使用该角色，如有则提示
   - 删除后刷新列表

5. **查看角色详情**
   - 点击角色卡片/行，展开显示：
     - 角色基本信息
     - 权限列表（按资源分组）
     - 拥有该角色的用户数量（可选）

6. **权限展示**
   - 权限以标签形式显示
   - 按资源分组，每组用不同颜色
   - 显示权限代码和名称

#### UI/UX 要求
- 使用卡片布局或表格布局
- 权限选择器使用树形结构或分组复选框
- 预定义角色用特殊标识（如徽章）
- 优先级用数字或星级显示
- 加载状态和错误提示

---

### 3. 权限列表页面 (PermissionList.tsx)

**路由**: `/permissions`  
**权限要求**: `roles:read`  
**说明**: 此页面为只读，用于查看系统中所有可用的权限

#### 功能需求

1. **权限列表展示**
   - 按资源分组展示所有权限
   - 每个资源组显示：
     - 资源名称（如：学生管理）
     - 资源代码（如：students）
     - 该资源下的所有权限
   - 权限信息：
     - 权限代码（如：students:read）
     - 权限名称（如：查看学生）
     - 操作类型（read/create/update/delete/special）
     - 描述

2. **搜索和筛选**
   - 支持搜索（按权限代码、名称、资源）
   - 支持按资源筛选
   - 支持按操作类型筛选

3. **权限详情**
   - 点击权限项，显示详细信息：
     - 权限代码
     - 权限名称
     - 资源
     - 操作
     - 描述
     - 拥有该权限的角色列表（可选）

#### UI/UX 要求
- 使用分组列表或折叠面板
- 权限用卡片或列表项展示
- 操作类型用标签区分颜色
- 简洁清晰的布局

---

## 数据模型

### User（用户）
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  realName: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
  studentId?: string;
}
```

### Role（角色）
```typescript
interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}
```

### Permission（权限）
```typescript
interface Permission {
  id: string;
  code: string; // 格式：resource:action，如 "students:read"
  name: string;
  resource: string; // students, buildings, rooms, etc.
  action: string; // read, create, update, delete, special
  description: string;
}
```

### CreateUserRequest
```typescript
interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  realName?: string;
  roleIds: string[];
  studentId?: string;
}
```

### UpdateUserRequest
```typescript
interface UpdateUserRequest {
  email?: string;
  phone?: string;
  realName?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  roleIds?: string[];
}
```

### AssignRolesRequest
```typescript
interface AssignRolesRequest {
  roleIds: string[];
  buildingId?: string; // 楼栋管理员需要指定楼栋
}
```

### CreateRoleRequest
```typescript
interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  level: number;
  permissionIds: string[];
}
```

### UpdateRoleRequest
```typescript
interface UpdateRoleRequest {
  name?: string;
  description?: string;
  level?: number;
  permissionIds?: string[];
}
```

## 权限资源列表

### 资源分组
1. **学生管理** (students)
   - students:read - 查看学生
   - students:create - 创建学生
   - students:update - 更新学生
   - students:delete - 删除学生
   - students:checkin - 办理入住
   - students:checkout - 办理退宿

2. **楼栋管理** (buildings)
   - buildings:read - 查看楼栋
   - buildings:create - 创建楼栋
   - buildings:update - 更新楼栋
   - buildings:delete - 删除楼栋

3. **房间管理** (rooms)
   - rooms:read - 查看房间
   - rooms:create - 创建房间
   - rooms:update - 更新房间
   - rooms:delete - 删除房间

4. **报修管理** (repairs)
   - repairs:read - 查看报修
   - repairs:create - 创建报修
   - repairs:update - 更新报修
   - repairs:delete - 删除报修

5. **公告管理** (notices)
   - notices:read - 查看公告
   - notices:create - 创建公告
   - notices:update - 更新公告
   - notices:delete - 删除公告

6. **仪表板** (dashboard)
   - dashboard:read - 查看仪表板

7. **用户管理** (users)
   - users:read - 查看用户
   - users:create - 创建用户
   - users:update - 更新用户
   - users:delete - 删除用户

8. **角色管理** (roles)
   - roles:read - 查看角色
   - roles:create - 创建角色
   - roles:update - 更新角色
   - roles:delete - 删除角色

## 预定义角色

以下角色为系统预定义，不能删除，部分不能编辑：

1. **学生** (student) - 优先级：1
   - 查看自己的学生信息
   - 创建和查看自己的报修
   - 查看公告
   - 查看自己的仪表板

2. **宿管员** (dorm_manager) - 优先级：3
   - 学生管理（全部）
   - 楼栋和房间查看
   - 房间更新
   - 报修查看和更新
   - 公告查看
   - 仪表板查看

3. **维修人员** (maintenance_staff) - 优先级：2
   - 报修查看和更新
   - 房间查看和更新
   - 公告查看
   - 仪表板查看

4. **楼栋管理员** (building_manager) - 优先级：4
   - 管理特定楼栋的所有数据
   - 权限范围：building（本楼栋）

5. **后勤管理员** (logistics_admin) - 优先级：5
   - 公告管理（全部）
   - 楼栋查看
   - 报修查看
   - 仪表板查看

6. **系统管理员** (system_admin) - 优先级：10
   - 所有权限
   - 权限范围：all（全部数据）

## 路由配置

需要在 `App.tsx` 中添加以下路由：

```typescript
<Route path="/users" element={<UserManagement />} />
<Route path="/roles" element={<RoleManagement />} />
<Route path="/permissions" element={<PermissionList />} />
```

## 侧边栏菜单

需要在 `Sidebar.tsx` 中添加菜单项（需要相应权限）：

```typescript
// 用户管理（需要 users:read 权限）
{hasPermission('users:read') && (
  <NavLink to="/users">用户管理</NavLink>
)}

// 角色管理（需要 roles:read 权限）
{hasPermission('roles:read') && (
  <NavLink to="/roles">角色管理</NavLink>
)}

// 权限列表（需要 roles:read 权限）
{hasPermission('roles:read') && (
  <NavLink to="/permissions">权限列表</NavLink>
)}
```

## 注意事项

1. **权限检查**：所有页面和操作都需要检查用户权限，无权限时显示提示或隐藏功能
2. **预定义角色保护**：预定义角色不能删除，部分不能编辑
3. **数据验证**：表单提交前需要验证数据格式和必填项
4. **错误处理**：API 调用失败时显示友好的错误提示
5. **加载状态**：数据加载时显示加载动画
6. **响应式设计**：确保在移动端也能正常使用
7. **用户体验**：操作成功后显示提示消息，重要操作需要确认对话框

## 技术栈建议

- UI 组件库：Ant Design / Material-UI / Chakra UI（根据项目现有选择）
- 状态管理：React Context / Redux / Zustand
- HTTP 客户端：Axios / Fetch
- 表单处理：React Hook Form / Formik
- 表格组件：Ant Design Table / Material-UI Table
- 图标：React Icons / Material Icons

## 开发优先级

1. **第一阶段**：用户管理页面（核心功能）
2. **第二阶段**：角色管理页面
3. **第三阶段**：权限列表页面（可选，主要用于参考）

