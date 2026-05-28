package database

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB 数据库连接池
var DB *pgxpool.Pool

// InitDatabase 初始化数据库连接
func InitDatabase(cfg *config.Config) error {
	ctx := context.Background()

	connStr := cfg.GetDatabaseURL()
	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 测试连接
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	DB = pool
	log.Println("Database connected successfully")

	// 创建表
	if err := createTables(ctx); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

// createTables 创建数据库表
func createTables(ctx context.Context) error {
	tables := []string{
		// 业务表
		`CREATE TABLE IF NOT EXISTS students (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			student_id VARCHAR(50) UNIQUE NOT NULL,
			major VARCHAR(100),
			room_number VARCHAR(20) DEFAULT '-',
			building VARCHAR(50) DEFAULT '',
			status VARCHAR(20) DEFAULT 'Active',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS buildings (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(50) NOT NULL,
			type VARCHAR(20) NOT NULL,
			floors INTEGER NOT NULL,
			manager VARCHAR(100) NOT NULL,
			description TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS rooms (
			id VARCHAR(36) PRIMARY KEY,
			number VARCHAR(20) NOT NULL,
			building VARCHAR(50) NOT NULL,
			floor INTEGER DEFAULT 1,
			capacity INTEGER NOT NULL,
			occupied INTEGER DEFAULT 0,
			type VARCHAR(20) NOT NULL,
			status VARCHAR(20) DEFAULT 'Available',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(building, number)
		)`,
		`CREATE TABLE IF NOT EXISTS repair_requests (
			id VARCHAR(36) PRIMARY KEY,
			title VARCHAR(200) NOT NULL,
			description TEXT,
			status VARCHAR(20) DEFAULT 'Pending',
			date DATE NOT NULL,
			room_number VARCHAR(20) NOT NULL,
			priority VARCHAR(20) DEFAULT 'Medium',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS notices (
			id VARCHAR(36) PRIMARY KEY,
			title VARCHAR(200) NOT NULL,
			content TEXT,
			date DATE NOT NULL,
			author VARCHAR(100) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		// 用户和角色表
		`CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(36) PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			email VARCHAR(100),
			phone VARCHAR(20),
			real_name VARCHAR(100),
			status VARCHAR(20) DEFAULT 'Active',
			last_login_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS roles (
			id VARCHAR(36) PRIMARY KEY,
			code VARCHAR(50) UNIQUE NOT NULL,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			level INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS permissions (
			id VARCHAR(36) PRIMARY KEY,
			code VARCHAR(100) UNIQUE NOT NULL,
			name VARCHAR(100) NOT NULL,
			resource VARCHAR(50) NOT NULL,
			action VARCHAR(50) NOT NULL,
			description TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS user_roles (
			id SERIAL PRIMARY KEY,
			user_id VARCHAR(36) NOT NULL,
			role_id VARCHAR(36) NOT NULL,
			building_id VARCHAR(36),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS role_permissions (
			role_id VARCHAR(36) NOT NULL,
			permission_id VARCHAR(36) NOT NULL,
			scope VARCHAR(20) DEFAULT 'all',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (role_id, permission_id),
			FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
			FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS user_students (
			user_id VARCHAR(36) PRIMARY KEY,
			student_id VARCHAR(36) UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS token_blacklist (
			token_id VARCHAR(255) PRIMARY KEY,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS room_swap_applications (
			id VARCHAR(36) PRIMARY KEY,
			applicant_id VARCHAR(36) NOT NULL,
			applicant_name VARCHAR(100) NOT NULL,
			current_room VARCHAR(20) NOT NULL,
			target_room VARCHAR(20) NOT NULL,
			reason TEXT,
			urgency_level VARCHAR(20) DEFAULT 'Normal',
			status VARCHAR(50) DEFAULT 'Pending',
			current_step VARCHAR(50) DEFAULT 'Counselor',
			apply_date DATE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS access_logs (
			id VARCHAR(36) PRIMARY KEY,
			student_id VARCHAR(36) NOT NULL,
			student_name VARCHAR(100) NOT NULL,
			room_number VARCHAR(20) NOT NULL,
			direction VARCHAR(10) NOT NULL,
			gate_name VARCHAR(50) NOT NULL,
			timestamp TIMESTAMP NOT NULL,
			photo_url TEXT,
			status VARCHAR(20) DEFAULT 'Normal',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS late_return_alerts (
			id VARCHAR(36) PRIMARY KEY,
			student_id VARCHAR(36) NOT NULL,
			student_name VARCHAR(100) NOT NULL,
			room_number VARCHAR(20) NOT NULL,
			alert_date DATE NOT NULL,
			last_entry TIMESTAMP,
			status VARCHAR(20) DEFAULT 'Pending',
			handler VARCHAR(36),
			handle_time TIMESTAMP,
			comment TEXT,
			notify_sent BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS inspections (
			id VARCHAR(36) PRIMARY KEY,
			room_number VARCHAR(20) NOT NULL,
			building VARCHAR(50) NOT NULL,
			inspector VARCHAR(100) NOT NULL,
			check_date TIMESTAMP NOT NULL,
			overall_score INTEGER,
			status VARCHAR(20),
			comment TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS inspection_details (
			id VARCHAR(36) PRIMARY KEY,
			inspection_id VARCHAR(36) NOT NULL,
			category VARCHAR(50) NOT NULL,
			item VARCHAR(100) NOT NULL,
			score INTEGER NOT NULL,
			max_score INTEGER NOT NULL DEFAULT 25,
			comment TEXT,
			photo_url VARCHAR(500),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		// 创建索引
		`CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id)`,
		`CREATE INDEX IF NOT EXISTS idx_students_room_number ON students(room_number)`,
		`CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building)`,
		`CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status)`,
		`CREATE INDEX IF NOT EXISTS idx_repair_requests_room_number ON repair_requests(room_number)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id)`,
		`CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)`,
		`CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at)`,
		// 补列：CREATE TABLE IF NOT EXISTS 对已存在的表不会加列，需用 ALTER 单独补
		`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1`,
		`ALTER TABLE students ADD COLUMN IF NOT EXISTS building VARCHAR(50) DEFAULT ''`,
	}

	for _, table := range tables {
		if _, err := DB.Exec(ctx, table); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	// 创建 user_roles 的唯一表达式索引（处理 NULL 的 building_id）
	// 注意：需要在表创建之后单独执行
	if _, err := DB.Exec(ctx, `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON user_roles(user_id, role_id, COALESCE(building_id, ''))`); err != nil {
		log.Printf("Warning: Failed to create unique index for user_roles: %v", err)
	}

	log.Println("Database tables created successfully")

	// 创建触发器
	if err := createTriggers(ctx); err != nil {
		return fmt.Errorf("failed to create triggers: %w", err)
	}

	// 初始化角色数据
	if err := initRoles(ctx); err != nil {
		log.Printf("Warning: Failed to init roles: %v", err)
	}

	// 初始化权限数据
	if err := InitAuthData(ctx); err != nil {
		log.Printf("Warning: Failed to init auth data: %v", err)
		// 不阻止启动，允许后续手动初始化
	}

	// 初始化默认管理员用户
	if err := initDefaultAdmin(ctx); err != nil {
		log.Printf("Warning: Failed to init default admin: %v", err)
	}

	return nil
}

// initDefaultAdmin 初始化默认管理员用户
func initDefaultAdmin(ctx context.Context) error {
	// 检查是否已存在管理员用户
	var count int
	err := DB.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE username = 'admin'").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check admin user: %w", err)
	}

	if count > 0 {
		log.Println("Default admin user already exists")
		return nil
	}

	// 决定首启密码：优先用环境变量 ADMIN_INITIAL_PASSWORD；否则用 crypto/rand 生成 16 字符随机串。
	// 随机串只在首启时打印一次到日志，请立刻记下并尽快通过 API/控制台修改。
	password := os.Getenv("ADMIN_INITIAL_PASSWORD")
	if password == "" {
		buf := make([]byte, 12)
		if _, err := rand.Read(buf); err != nil {
			return fmt.Errorf("failed to generate random admin password: %w", err)
		}
		password = base64.RawURLEncoding.EncodeToString(buf) // 16 chars URL-safe
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// 仅首次创建：count==0 才走到这里。ON CONFLICT 仅作并发兜底，不覆盖现有密码。
	adminUserSQL := `INSERT INTO users (id, username, password_hash, email, real_name, status) VALUES
		('user-admin-1', 'admin', $1, 'admin@unidorm.edu', '系统管理员', 'Active')
		ON CONFLICT (id) DO NOTHING`

	if _, err := DB.Exec(ctx, adminUserSQL, passwordHash); err != nil {
		return fmt.Errorf("failed to insert admin user: %w", err)
	}

	// 为管理员分配系统管理员角色（无论用户是否已存在）
	// 使用空字符串而不是 NULL 作为 building_id（因为唯一索引使用 COALESCE）
	adminRoleSQL := `INSERT INTO user_roles (user_id, role_id, building_id) VALUES ($1, $2, '')
		ON CONFLICT (user_id, role_id, COALESCE(building_id, '')) DO NOTHING`
	if _, err := DB.Exec(ctx, adminRoleSQL, "user-admin-1", "role-system-admin"); err != nil {
		log.Printf("Warning: Failed to assign admin role: %v", err)
	}

	log.Println("================================================================")
	log.Printf("  Default admin user created (username: admin)")
	log.Printf("  INITIAL PASSWORD: %s", password)
	log.Println("  ⚠ This password is shown ONLY ONCE. Save it and change ASAP.")
	log.Println("================================================================")
	return nil
}

// initRoles 初始化角色数据
func initRoles(ctx context.Context) error {
	roles := `INSERT INTO roles (id, code, name, description, level) VALUES
		('role-student', 'student', '学生', '普通学生用户', 1),
		('role-dorm-manager', 'dorm_manager', '宿管员', '负责日常宿舍管理', 3),
		('role-maintenance-staff', 'maintenance_staff', '维修人员', '负责处理报修', 2),
		('role-building-manager', 'building_manager', '楼栋管理员', '管理特定楼栋', 4),
		('role-logistics-admin', 'logistics_admin', '后勤管理员', '发布公告和管理', 5),
		('role-system-admin', 'system_admin', '系统管理员', '系统最高权限', 10)
		ON CONFLICT (id) DO NOTHING`

	if _, err := DB.Exec(ctx, roles); err != nil {
		return fmt.Errorf("failed to insert roles: %w", err)
	}

	log.Println("Roles initialized successfully")
	return nil
}

// createTriggers 创建触发器
func createTriggers(ctx context.Context) error {
	// 创建更新时间触发器函数（如果不存在）
	triggerFunc := `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';`

	if _, err := DB.Exec(ctx, triggerFunc); err != nil {
		return fmt.Errorf("failed to create trigger function: %w", err)
	}

	// 为每个表创建更新时间触发器
	triggerConfigs := []struct {
		tableName   string
		triggerName string
	}{
		{"students", "update_students_updated_at"},
		{"buildings", "update_buildings_updated_at"},
		{"rooms", "update_rooms_updated_at"},
		{"repair_requests", "update_repair_requests_updated_at"},
		{"notices", "update_notices_updated_at"},
		{"users", "update_users_updated_at"},
		{"roles", "update_roles_updated_at"},
	}

	for _, config := range triggerConfigs {
		// 先删除触发器（如果存在）
		dropSQL := `DROP TRIGGER IF EXISTS ` + config.triggerName + ` ON ` + config.tableName
		if _, err := DB.Exec(ctx, dropSQL); err != nil {
			log.Printf("Warning: Failed to drop trigger %s: %v", config.triggerName, err)
		}

		// 创建触发器
		createSQL := `CREATE TRIGGER ` + config.triggerName + ` BEFORE UPDATE ON ` + config.tableName +
			` FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
		if _, err := DB.Exec(ctx, createSQL); err != nil {
			log.Printf("Warning: Failed to create trigger %s: %v", config.triggerName, err)
		}
	}

	return nil
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() {
	if DB != nil {
		DB.Close()
		log.Println("Database connection closed")
	}
}
