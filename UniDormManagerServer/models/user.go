package models

import (
	"time"
)

// User 用户模型
type User struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	RealName    string     `json:"realName"`
	Status      string     `json:"status"` // Active, Inactive, Suspended
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// 关联数据（查询时加载）
	Roles     []Role   `json:"roles,omitempty"`
	StudentID *string  `json:"studentId,omitempty"` // 如果是学生用户
}

// Role 角色模型
type Role struct {
	ID          string       `json:"id"`
	Code        string       `json:"code"`        // student, dorm_manager, etc.
	Name        string       `json:"name"`        // 学生, 宿管员
	Description string       `json:"description"`
	Level       int          `json:"level"`       // 角色优先级
	Permissions []Permission `json:"permissions,omitempty"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

// Permission 权限模型
type Permission struct {
	ID          string `json:"id"`
	Code        string `json:"code"`        // students:read, students:create
	Name        string `json:"name"`         // 查看学生, 创建学生
	Resource    string `json:"resource"`    // students, buildings, rooms
	Action      string `json:"action"`       // read, create, update, delete, special
	Description string `json:"description"`
}

// UserRole 用户角色关联
type UserRole struct {
	UserID    string  `json:"userId"`
	RoleID    string  `json:"roleId"`
	BuildingID *string `json:"buildingId,omitempty"` // 楼栋管理员关联的楼栋
	CreatedAt time.Time `json:"createdAt"`
}

// RolePermission 角色权限关联
type RolePermission struct {
	RoleID       string          `json:"roleId"`
	PermissionID string          `json:"permissionId"`
	Scope        PermissionScope `json:"scope"` // all, building, self
	CreatedAt    time.Time       `json:"createdAt"`
}

// PermissionScope 权限范围
type PermissionScope string

const (
	ScopeAll      PermissionScope = "all"      // 全部数据
	ScopeBuilding PermissionScope = "building" // 本楼栋数据
	ScopeSelf     PermissionScope = "self"     // 本人数据
)

// 预定义角色代码
const (
	RoleStudent          = "student"
	RoleDormManager      = "dorm_manager"
	RoleMaintenanceStaff = "maintenance_staff"
	RoleBuildingManager  = "building_manager"
	RoleLogisticsAdmin   = "logistics_admin"
	RoleSystemAdmin      = "system_admin"
)

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username  string   `json:"username"`
	Password  string   `json:"password"`
	Email     string   `json:"email"`
	Phone     string   `json:"phone"`
	RealName  string   `json:"realName"`
	RoleIDs   []string `json:"roleIds"`
	StudentID *string  `json:"studentId,omitempty"` // 可选，关联学生
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Email    string   `json:"email,omitempty"`
	Phone    string   `json:"phone,omitempty"`
	RealName string   `json:"realName,omitempty"`
	Status   string   `json:"status,omitempty"`
	RoleIDs  []string `json:"roleIds,omitempty"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string    `json:"token"`
	User      *UserInfo `json:"user"`
	ExpiresIn int64     `json:"expiresIn"` // Token过期时间（秒）
}

// UserInfo 用户信息（不包含敏感信息）
type UserInfo struct {
	ID        string   `json:"id"`
	Username  string   `json:"username"`
	Email     string   `json:"email"`
	Phone     string   `json:"phone"`
	RealName  string   `json:"realName"`
	Roles     []string `json:"roles"`
	StudentID *string  `json:"studentId,omitempty"`
}

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Level       int      `json:"level"`
	PermissionIDs []string `json:"permissionIds"`
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	Name        string   `json:"name,omitempty"`
	Description string   `json:"description,omitempty"`
	Level       int      `json:"level,omitempty"`
	PermissionIDs []string `json:"permissionIds,omitempty"`
}

// AssignRolesRequest 分配角色请求
type AssignRolesRequest struct {
	RoleIDs    []string  `json:"roleIds"`
	BuildingID *string   `json:"buildingId,omitempty"` // 楼栋管理员需要指定楼栋
}

