package database

import (
	"context"
	"fmt"
	"log"
)

// InitAuthData 初始化认证相关数据（角色和权限）
func InitAuthData(ctx context.Context) error {
	// 插入预定义权限
	permissions := []string{
		`INSERT INTO permissions (id, code, name, resource, action, description) VALUES
		('perm-students-read', 'students:read', '查看学生', 'students', 'read', '查看学生信息'),
		('perm-students-create', 'students:create', '创建学生', 'students', 'create', '创建新学生'),
		('perm-students-update', 'students:update', '更新学生', 'students', 'update', '更新学生信息'),
		('perm-students-delete', 'students:delete', '删除学生', 'students', 'delete', '删除学生'),
		('perm-students-checkin', 'students:checkin', '办理入住', 'students', 'special', '为学生办理入住'),
		('perm-students-checkout', 'students:checkout', '办理退宿', 'students', 'special', '为学生办理退宿'),
		('perm-buildings-read', 'buildings:read', '查看楼栋', 'buildings', 'read', '查看楼栋信息'),
		('perm-buildings-create', 'buildings:create', '创建楼栋', 'buildings', 'create', '创建新楼栋'),
		('perm-buildings-update', 'buildings:update', '更新楼栋', 'buildings', 'update', '更新楼栋信息'),
		('perm-buildings-delete', 'buildings:delete', '删除楼栋', 'buildings', 'delete', '删除楼栋'),
		('perm-rooms-read', 'rooms:read', '查看房间', 'rooms', 'read', '查看房间信息'),
		('perm-rooms-create', 'rooms:create', '创建房间', 'rooms', 'create', '创建新房间'),
		('perm-rooms-update', 'rooms:update', '更新房间', 'rooms', 'update', '更新房间信息'),
		('perm-rooms-delete', 'rooms:delete', '删除房间', 'rooms', 'delete', '删除房间'),
		('perm-repairs-read', 'repairs:read', '查看报修', 'repairs', 'read', '查看报修请求'),
		('perm-repairs-create', 'repairs:create', '创建报修', 'repairs', 'create', '创建报修请求'),
		('perm-repairs-update', 'repairs:update', '更新报修', 'repairs', 'update', '更新报修状态'),
		('perm-repairs-delete', 'repairs:delete', '删除报修', 'repairs', 'delete', '删除报修请求'),
		('perm-notices-read', 'notices:read', '查看公告', 'notices', 'read', '查看公告通知'),
		('perm-notices-create', 'notices:create', '创建公告', 'notices', 'create', '发布公告'),
		('perm-notices-update', 'notices:update', '更新公告', 'notices', 'update', '更新公告'),
		('perm-notices-delete', 'notices:delete', '删除公告', 'notices', 'delete', '删除公告'),
		('perm-dashboard-read', 'dashboard:read', '查看仪表板', 'dashboard', 'read', '查看统计数据'),
		('perm-users-read', 'users:read', '查看用户', 'users', 'read', '查看用户列表'),
		('perm-users-create', 'users:create', '创建用户', 'users', 'create', '创建新用户'),
		('perm-users-update', 'users:update', '更新用户', 'users', 'update', '更新用户信息'),
		('perm-users-delete', 'users:delete', '删除用户', 'users', 'delete', '删除用户'),
		('perm-roles-read', 'roles:read', '查看角色', 'roles', 'read', '查看角色列表'),
		('perm-roles-create', 'roles:create', '创建角色', 'roles', 'create', '创建新角色'),
		('perm-roles-update', 'roles:update', '更新角色', 'roles', 'update', '更新角色信息'),
		('perm-roles-delete', 'roles:delete', '删除角色', 'roles', 'delete', '删除角色'),
		('perm-inspections-read', 'inspections:read', '查看查寝', 'inspections', 'read', '查看查寝记录'),
		('perm-inspections-create', 'inspections:create', '创建查寝', 'inspections', 'create', '创建与提交查寝评分')
		ON CONFLICT (id) DO NOTHING`,
	}

	for _, sql := range permissions {
		if _, err := DB.Exec(ctx, sql); err != nil {
			return fmt.Errorf("failed to insert permissions: %w", err)
		}
	}

	// 插入角色权限关联
	rolePermissions := []string{
		// 学生角色
		`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
		('role-student', 'perm-students-read', 'self'),
		('role-student', 'perm-rooms-read', 'all'),
		('role-student', 'perm-repairs-create', 'self'),
		('role-student', 'perm-repairs-read', 'self'),
		('role-student', 'perm-notices-read', 'all'),
		('role-student', 'perm-dashboard-read', 'self')
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
		// 宿管员角色
		`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
		('role-dorm-manager', 'perm-students-read', 'all'),
		('role-dorm-manager', 'perm-students-create', 'all'),
		('role-dorm-manager', 'perm-students-update', 'all'),
		('role-dorm-manager', 'perm-students-checkin', 'all'),
		('role-dorm-manager', 'perm-students-checkout', 'all'),
		('role-dorm-manager', 'perm-buildings-read', 'all'),
		('role-dorm-manager', 'perm-rooms-read', 'all'),
		('role-dorm-manager', 'perm-rooms-update', 'all'),
		('role-dorm-manager', 'perm-repairs-read', 'all'),
		('role-dorm-manager', 'perm-repairs-update', 'all'),
		('role-dorm-manager', 'perm-notices-read', 'all'),
		('role-dorm-manager', 'perm-inspections-read', 'all'),
		('role-dorm-manager', 'perm-inspections-create', 'all'),
		('role-dorm-manager', 'perm-dashboard-read', 'all')
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
		// 维修人员角色
		`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
		('role-maintenance-staff', 'perm-repairs-read', 'all'),
		('role-maintenance-staff', 'perm-repairs-update', 'all'),
		('role-maintenance-staff', 'perm-rooms-read', 'all'),
		('role-maintenance-staff', 'perm-rooms-update', 'all'),
		('role-maintenance-staff', 'perm-notices-read', 'all'),
		('role-maintenance-staff', 'perm-dashboard-read', 'all')
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
		// 楼栋管理员角色
		`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
		('role-building-manager', 'perm-buildings-read', 'building'),
		('role-building-manager', 'perm-buildings-update', 'building'),
		('role-building-manager', 'perm-rooms-read', 'building'),
		('role-building-manager', 'perm-rooms-update', 'building'),
		('role-building-manager', 'perm-students-read', 'building'),
		('role-building-manager', 'perm-repairs-read', 'building'),
		('role-building-manager', 'perm-repairs-update', 'building'),
		('role-building-manager', 'perm-notices-read', 'all'),
		('role-building-manager', 'perm-dashboard-read', 'building')
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
		// 后勤管理员角色
		`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
		('role-logistics-admin', 'perm-notices-read', 'all'),
		('role-logistics-admin', 'perm-notices-create', 'all'),
		('role-logistics-admin', 'perm-notices-update', 'all'),
		('role-logistics-admin', 'perm-notices-delete', 'all'),
		('role-logistics-admin', 'perm-buildings-read', 'all'),
		('role-logistics-admin', 'perm-repairs-read', 'all'),
		('role-logistics-admin', 'perm-dashboard-read', 'all')
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
		// 系统管理员角色 - 所有权限
		`INSERT INTO role_permissions (role_id, permission_id, scope)
		SELECT 'role-system-admin', id, 'all'
		FROM permissions
		ON CONFLICT (role_id, permission_id) DO NOTHING`,
	}

	for _, sql := range rolePermissions {
		if _, err := DB.Exec(ctx, sql); err != nil {
			log.Printf("Warning: Failed to insert role permissions: %v", err)
		}
	}

	log.Println("Auth data initialized successfully")
	return nil
}
