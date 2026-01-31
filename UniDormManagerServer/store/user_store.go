package store

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"unidorm-manager-server/cache"
	"unidorm-manager-server/database"
	"unidorm-manager-server/models"
)

// UserStore 用户存储
type UserStore struct{}

// NewUserStore 创建用户存储实例
func NewUserStore() *UserStore {
	return &UserStore{}
}

// GetUserByUsername 根据用户名获取用户
func (s *UserStore) GetUserByUsername(username string) (*models.User, error) {
	ctx := context.Background()

	var user models.User
	var lastLoginAt sql.NullTime
	var email, phone, realName sql.NullString
	err := database.DB.QueryRow(ctx,
		`SELECT id, username, password_hash, email, phone, real_name, status, 
		 last_login_at, created_at, updated_at 
		 FROM users WHERE username = $1`,
		username).Scan(
		&user.ID, &user.Username, nil, &email, &phone, &realName,
		&user.Status, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if email.Valid {
		user.Email = email.String
	}
	if phone.Valid {
		user.Phone = phone.String
	}
	if realName.Valid {
		user.RealName = realName.String
	}
	if lastLoginAt.Valid {
		t := lastLoginAt.Time
		user.LastLoginAt = &t
	}

	return &user, nil
}

// GetUserByUsernameWithPassword 根据用户名获取用户（包含密码哈希）
func (s *UserStore) GetUserByUsernameWithPassword(username string) (*models.User, string, error) {
	ctx := context.Background()

	var user models.User
	var passwordHash string
	var lastLoginAt sql.NullTime
	var email, phone, realName sql.NullString
	err := database.DB.QueryRow(ctx,
		`SELECT id, username, password_hash, email, phone, real_name, status, 
		 last_login_at, created_at, updated_at 
		 FROM users WHERE username = $1`,
		username).Scan(
		&user.ID, &user.Username, &passwordHash, &email, &phone, &realName,
		&user.Status, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, "", nil
	}
	if err != nil {
		return nil, "", err
	}

	if email.Valid {
		user.Email = email.String
	}
	if phone.Valid {
		user.Phone = phone.String
	}
	if realName.Valid {
		user.RealName = realName.String
	}
	if lastLoginAt.Valid {
		t := lastLoginAt.Time
		user.LastLoginAt = &t
	}

	return &user, passwordHash, nil
}

// GetUserByID 根据ID获取用户
func (s *UserStore) GetUserByID(id string) (*models.User, error) {
	ctx := context.Background()

	var user models.User
	var lastLoginAt sql.NullTime
	var email, phone, realName sql.NullString
	err := database.DB.QueryRow(ctx,
		`SELECT id, username, email, phone, real_name, status, 
		 last_login_at, created_at, updated_at 
		 FROM users WHERE id = $1`,
		id).Scan(
		&user.ID, &user.Username, &email, &phone, &realName,
		&user.Status, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if email.Valid {
		user.Email = email.String
	}
	if phone.Valid {
		user.Phone = phone.String
	}
	if realName.Valid {
		user.RealName = realName.String
	}
	if lastLoginAt.Valid {
		t := lastLoginAt.Time
		user.LastLoginAt = &t
	}

	return &user, nil
}

// GetAllUsers 获取所有用户
func (s *UserStore) GetAllUsers() ([]*models.User, error) {
	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT id, username, email, phone, real_name, status, 
		 last_login_at, created_at, updated_at 
		 FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		var lastLoginAt sql.NullTime
		var email, phone, realName sql.NullString
		if err := rows.Scan(&user.ID, &user.Username, &email, &phone,
			&realName, &user.Status, &lastLoginAt,
			&user.CreatedAt, &user.UpdatedAt); err == nil {
			if email.Valid {
				user.Email = email.String
			}
			if phone.Valid {
				user.Phone = phone.String
			}
			if realName.Valid {
				user.RealName = realName.String
			}
			if lastLoginAt.Valid {
				t := lastLoginAt.Time
				user.LastLoginAt = &t
			}
			users = append(users, &user)
		}
	}

	return users, nil
}

// CreateUser 创建用户
func (s *UserStore) CreateUser(req *models.CreateUserRequest, passwordHash string) (*models.User, error) {
	ctx := context.Background()
	userID := uuid.New().String()

	user := &models.User{
		ID:        userID,
		Username:  req.Username,
		Email:     req.Email,
		Phone:     req.Phone,
		RealName:  req.RealName,
		Status:    "Active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err := database.DB.Exec(ctx,
		`INSERT INTO users (id, username, password_hash, email, phone, real_name, status) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		user.ID, user.Username, passwordHash, user.Email, user.Phone, user.RealName, user.Status)

	if err != nil {
		return nil, err
	}

	// 分配角色
	if len(req.RoleIDs) > 0 {
		for _, roleID := range req.RoleIDs {
			var buildingID *string
			// 如果是楼栋管理员角色，需要检查是否有 buildingID
			_, err := database.DB.Exec(ctx,
				`INSERT INTO user_roles (user_id, role_id, building_id) VALUES ($1, $2, $3)`,
				userID, roleID, buildingID)
			if err != nil {
				// 记录错误但继续
				continue
			}
		}
	}

	// 关联学生（如果有）
	if req.StudentID != nil {
		_, err := database.DB.Exec(ctx,
			`INSERT INTO user_students (user_id, student_id) VALUES ($1, $2)`,
			userID, *req.StudentID)
		if err != nil {
			// 记录错误但继续
		}
	}

	return user, nil
}

// UpdateUser 更新用户
func (s *UserStore) UpdateUser(id string, req *models.UpdateUserRequest) (*models.User, error) {
	ctx := context.Background()

	// 先获取现有用户
	user, err := s.GetUserByID(id)
	if err != nil || user == nil {
		return nil, err
	}

	// 更新字段
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.RealName != "" {
		user.RealName = req.RealName
	}
	if req.Status != "" {
		user.Status = req.Status
	}

	// 更新数据库
	_, err = database.DB.Exec(ctx,
		`UPDATE users SET email = $1, phone = $2, real_name = $3, status = $4, updated_at = $5 WHERE id = $6`,
		user.Email, user.Phone, user.RealName, user.Status, time.Now(), id)

	if err != nil {
		return nil, err
	}

	// 更新角色（如果有）
	if len(req.RoleIDs) > 0 {
		// 删除旧角色
		_, _ = database.DB.Exec(ctx, "DELETE FROM user_roles WHERE user_id = $1", id)

		// 添加新角色
		for _, roleID := range req.RoleIDs {
			_, _ = database.DB.Exec(ctx,
				`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
				id, roleID)
		}

		// 清除权限相关缓存
		if cache.Cache != nil {
			cache.Delete(cache.CacheKeyUserRoles + id)
			cache.Delete(cache.CacheKeyUserPerms + id)
			cache.Delete(cache.CacheKeyUserBuildings + id)
		}
	}

	return user, nil
}

// DeleteUser 删除用户
func (s *UserStore) DeleteUser(id string) error {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
	return err
}

// UpdateUserLastLogin 更新用户最后登录时间
func (s *UserStore) UpdateUserLastLogin(userID string) error {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx,
		`UPDATE users SET last_login_at = $1 WHERE id = $2`,
		time.Now(), userID)
	return err
}

// GetUserRoles 获取用户角色（带缓存）
func (s *UserStore) GetUserRoles(userID string) ([]models.Role, error) {
	cacheKey := cache.CacheKeyUserRoles + userID

	// 尝试从缓存获取
	if cache.Cache != nil {
		var cached []models.Role
		if err := cache.Get(cacheKey, &cached); err == nil {
			return cached, nil
		}
	}

	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT r.id, r.code, r.name, r.description, r.level, r.created_at, r.updated_at
		 FROM roles r
		 INNER JOIN user_roles ur ON r.id = ur.role_id
		 WHERE ur.user_id = $1`,
		userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.Code, &role.Name, &role.Description,
			&role.Level, &role.CreatedAt, &role.UpdatedAt); err == nil {
			roles = append(roles, role)
		}
	}

	// 写入缓存
	if cache.Cache != nil && len(roles) > 0 {
		cache.Set(cacheKey, roles, cache.CacheExpirationLong)
	}

	return roles, nil
}

// GetUserPermissions 获取用户权限（通过角色，带缓存）
func (s *UserStore) GetUserPermissions(userID string) ([]models.Permission, error) {
	cacheKey := cache.CacheKeyUserPerms + userID

	// 尝试从缓存获取
	if cache.Cache != nil {
		var cached []models.Permission
		if err := cache.Get(cacheKey, &cached); err == nil {
			return cached, nil
		}
	}

	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT DISTINCT p.id, p.code, p.name, p.resource, p.action, p.description
		 FROM permissions p
		 INNER JOIN role_permissions rp ON p.id = rp.permission_id
		 INNER JOIN user_roles ur ON rp.role_id = ur.role_id
		 WHERE ur.user_id = $1`,
		userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var perm models.Permission
		if err := rows.Scan(&perm.ID, &perm.Code, &perm.Name, &perm.Resource,
			&perm.Action, &perm.Description); err == nil {
			permissions = append(permissions, perm)
		}
	}

	// 写入缓存
	if cache.Cache != nil && len(permissions) > 0 {
		cache.Set(cacheKey, permissions, cache.CacheExpirationLong)
	}

	return permissions, nil
}

// GetUserBuildingIDs 获取用户管理的楼栋ID列表（带缓存）
func (s *UserStore) GetUserBuildingIDs(userID string) ([]string, error) {
	cacheKey := cache.CacheKeyUserBuildings + userID

	// 尝试从缓存获取
	if cache.Cache != nil {
		var cached []string
		if err := cache.Get(cacheKey, &cached); err == nil {
			return cached, nil
		}
	}

	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT DISTINCT building_id FROM user_roles 
		 WHERE user_id = $1 AND building_id IS NOT NULL`,
		userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buildingIDs []string
	for rows.Next() {
		var buildingID string
		if err := rows.Scan(&buildingID); err == nil {
			buildingIDs = append(buildingIDs, buildingID)
		}
	}

	// 写入缓存
	if cache.Cache != nil {
		cache.Set(cacheKey, buildingIDs, cache.CacheExpirationLong)
	}

	return buildingIDs, nil
}

// GetUserStudentID 获取用户关联的学生ID
func (s *UserStore) GetUserStudentID(userID string) (*string, error) {
	ctx := context.Background()

	var studentID string
	err := database.DB.QueryRow(ctx,
		`SELECT student_id FROM user_students WHERE user_id = $1`,
		userID).Scan(&studentID)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &studentID, nil
}

// AssignRoles 分配角色给用户
func (s *UserStore) AssignRoles(userID string, req *models.AssignRolesRequest) error {
	ctx := context.Background()

	// 删除旧角色
	_, err := database.DB.Exec(ctx, "DELETE FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 添加新角色
	for _, roleID := range req.RoleIDs {
		_, err := database.DB.Exec(ctx,
			`INSERT INTO user_roles (user_id, role_id, building_id) VALUES ($1, $2, $3)`,
			userID, roleID, req.BuildingID)
		if err != nil {
			return err
		}
	}

	// 清除权限相关缓存
	if cache.Cache != nil {
		cache.Delete(cache.CacheKeyUserRoles + userID)
		cache.Delete(cache.CacheKeyUserPerms + userID)
		cache.Delete(cache.CacheKeyUserBuildings + userID)
	}

	return nil
}
