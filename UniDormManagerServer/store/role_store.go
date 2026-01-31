package store

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"unidorm-manager-server/database"
	"unidorm-manager-server/models"
)

// RoleStore 角色存储
type RoleStore struct{}

// NewRoleStore 创建角色存储实例
func NewRoleStore() *RoleStore {
	return &RoleStore{}
}

// GetAllRoles 获取所有角色
func (s *RoleStore) GetAllRoles() ([]*models.Role, error) {
	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT id, code, name, description, level, created_at, updated_at 
		 FROM roles ORDER BY level DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*models.Role
	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.Code, &role.Name, &role.Description,
			&role.Level, &role.CreatedAt, &role.UpdatedAt); err == nil {
			roles = append(roles, &role)
		}
	}

	return roles, nil
}

// GetRoleByID 根据ID获取角色
func (s *RoleStore) GetRoleByID(id string) (*models.Role, error) {
	ctx := context.Background()

	var role models.Role
	err := database.DB.QueryRow(ctx,
		`SELECT id, code, name, description, level, created_at, updated_at 
		 FROM roles WHERE id = $1`,
		id).Scan(&role.ID, &role.Code, &role.Name, &role.Description,
		&role.Level, &role.CreatedAt, &role.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &role, nil
}

// GetRoleByCode 根据代码获取角色
func (s *RoleStore) GetRoleByCode(code string) (*models.Role, error) {
	ctx := context.Background()

	var role models.Role
	err := database.DB.QueryRow(ctx,
		`SELECT id, code, name, description, level, created_at, updated_at 
		 FROM roles WHERE code = $1`,
		code).Scan(&role.ID, &role.Code, &role.Name, &role.Description,
		&role.Level, &role.CreatedAt, &role.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &role, nil
}

// CreateRole 创建角色
func (s *RoleStore) CreateRole(req *models.CreateRoleRequest) (*models.Role, error) {
	ctx := context.Background()
	roleID := uuid.New().String()

	role := &models.Role{
		ID:          roleID,
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		Level:       req.Level,
	}

	_, err := database.DB.Exec(ctx,
		`INSERT INTO roles (id, code, name, description, level) VALUES ($1, $2, $3, $4, $5)`,
		role.ID, role.Code, role.Name, role.Description, role.Level)

	if err != nil {
		return nil, err
	}

	// 分配权限
	if len(req.PermissionIDs) > 0 {
		for _, permID := range req.PermissionIDs {
			_, err := database.DB.Exec(ctx,
				`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES ($1, $2, 'all')`,
				roleID, permID)
			if err != nil {
				// 记录错误但继续
				continue
			}
		}
	}

	return role, nil
}

// UpdateRole 更新角色
func (s *RoleStore) UpdateRole(id string, req *models.UpdateRoleRequest) (*models.Role, error) {
	ctx := context.Background()

	// 先获取现有角色
	role, err := s.GetRoleByID(id)
	if err != nil || role == nil {
		return nil, err
	}

	// 更新字段
	if req.Name != "" {
		role.Name = req.Name
	}
	if req.Description != "" {
		role.Description = req.Description
	}
	if req.Level > 0 {
		role.Level = req.Level
	}

	// 更新数据库
	_, err = database.DB.Exec(ctx,
		`UPDATE roles SET name = $1, description = $2, level = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
		role.Name, role.Description, role.Level, id)

	if err != nil {
		return nil, err
	}

	// 更新权限（如果有）
	if len(req.PermissionIDs) > 0 {
		// 删除旧权限
		_, _ = database.DB.Exec(ctx, "DELETE FROM role_permissions WHERE role_id = $1", id)

		// 添加新权限
		for _, permID := range req.PermissionIDs {
			_, _ = database.DB.Exec(ctx,
				`INSERT INTO role_permissions (role_id, permission_id, scope) VALUES ($1, $2, 'all')`,
				id, permID)
		}
	}

	return role, nil
}

// DeleteRole 删除角色
func (s *RoleStore) DeleteRole(id string) error {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx, "DELETE FROM roles WHERE id = $1", id)
	return err
}

// GetRolePermissions 获取角色的权限
func (s *RoleStore) GetRolePermissions(roleID string) ([]models.Permission, error) {
	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT p.id, p.code, p.name, p.resource, p.action, p.description, rp.scope
		 FROM permissions p
		 INNER JOIN role_permissions rp ON p.id = rp.permission_id
		 WHERE rp.role_id = $1`,
		roleID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		var scope string
		if err := rows.Scan(&perm.ID, &perm.Code, &perm.Name, &perm.Resource,
			&perm.Action, &perm.Description, &scope); err == nil {
			permissions = append(permissions, perm)
		}
	}

	return permissions, nil
}

// GetAllPermissions 获取所有权限
func (s *RoleStore) GetAllPermissions() ([]*models.Permission, error) {
	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT id, code, name, resource, action, description 
		 FROM permissions ORDER BY resource, action`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []*models.Permission
	for rows.Next() {
		var perm models.Permission
		if err := rows.Scan(&perm.ID, &perm.Code, &perm.Name, &perm.Resource,
			&perm.Action, &perm.Description); err == nil {
			permissions = append(permissions, &perm)
		}
	}

	return permissions, nil
}

