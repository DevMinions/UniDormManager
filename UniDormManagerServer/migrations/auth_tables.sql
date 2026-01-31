-- 用户和角色系统数据库表
-- 在 init.sql 之后执行

-- 1. 用户表（系统用户，区别于Student）
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    real_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, Suspended
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 角色表
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- student, dorm_manager, maintenance_staff, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0, -- 角色优先级，数字越大权限越高
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL, -- students:read, students:create, etc.
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL, -- students, buildings, rooms, repairs, notices
    action VARCHAR(50) NOT NULL, -- read, create, update, delete, special
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 用户角色关联表（多对多）
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    building_id VARCHAR(36), -- 如果是楼栋管理员，关联楼栋ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id, COALESCE(building_id, '')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 5. 角色权限关联表（多对多）
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    scope VARCHAR(20) DEFAULT 'all', -- all, building, self
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 6. 用户与学生关联表（学生用户关联到Student记录）
CREATE TABLE IF NOT EXISTS user_students (
    user_id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 7. JWT Token 黑名单（用于登出）
CREATE TABLE IF NOT EXISTS token_blacklist (
    token_id VARCHAR(255) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- 更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== 初始化数据 ==========

-- 插入预定义角色
INSERT INTO roles (id, code, name, description, level) VALUES
('role-student', 'student', '学生', '普通学生用户', 1),
('role-dorm-manager', 'dorm_manager', '宿管员', '负责日常宿舍管理', 3),
('role-maintenance-staff', 'maintenance_staff', '维修人员', '负责处理报修', 2),
('role-building-manager', 'building_manager', '楼栋管理员', '管理特定楼栋', 4),
('role-logistics-admin', 'logistics_admin', '后勤管理员', '发布公告和管理', 5),
('role-system-admin', 'system_admin', '系统管理员', '系统最高权限', 10)
ON CONFLICT (id) DO NOTHING;

-- 插入预定义权限
INSERT INTO permissions (id, code, name, resource, action, description) VALUES
-- 学生管理权限
('perm-students-read', 'students:read', '查看学生', 'students', 'read', '查看学生信息'),
('perm-students-create', 'students:create', '创建学生', 'students', 'create', '创建新学生'),
('perm-students-update', 'students:update', '更新学生', 'students', 'update', '更新学生信息'),
('perm-students-delete', 'students:delete', '删除学生', 'students', 'delete', '删除学生'),
('perm-students-checkin', 'students:checkin', '办理入住', 'students', 'special', '为学生办理入住'),
('perm-students-checkout', 'students:checkout', '办理退宿', 'students', 'special', '为学生办理退宿'),
-- 楼栋管理权限
('perm-buildings-read', 'buildings:read', '查看楼栋', 'buildings', 'read', '查看楼栋信息'),
('perm-buildings-create', 'buildings:create', '创建楼栋', 'buildings', 'create', '创建新楼栋'),
('perm-buildings-update', 'buildings:update', '更新楼栋', 'buildings', 'update', '更新楼栋信息'),
('perm-buildings-delete', 'buildings:delete', '删除楼栋', 'buildings', 'delete', '删除楼栋'),
-- 房间管理权限
('perm-rooms-read', 'rooms:read', '查看房间', 'rooms', 'read', '查看房间信息'),
('perm-rooms-create', 'rooms:create', '创建房间', 'rooms', 'create', '创建新房间'),
('perm-rooms-update', 'rooms:update', '更新房间', 'rooms', 'update', '更新房间信息'),
('perm-rooms-delete', 'rooms:delete', 'rooms', 'delete', '删除房间'),
-- 报修管理权限
('perm-repairs-read', 'repairs:read', '查看报修', 'repairs', 'read', '查看报修请求'),
('perm-repairs-create', 'repairs:create', '创建报修', 'repairs', 'create', '创建报修请求'),
('perm-repairs-update', 'repairs:update', '更新报修', 'repairs', 'update', '更新报修状态'),
('perm-repairs-delete', 'repairs:delete', '删除报修', 'repairs', 'delete', '删除报修请求'),
-- 公告管理权限
('perm-notices-read', 'notices:read', '查看公告', 'notices', 'read', '查看公告通知'),
('perm-notices-create', 'notices:create', '创建公告', 'notices', 'create', '发布公告'),
('perm-notices-update', 'notices:update', '更新公告', 'notices', 'update', '更新公告'),
('perm-notices-delete', 'notices:delete', '删除公告', 'notices', 'delete', '删除公告'),
-- 仪表板权限
('perm-dashboard-read', 'dashboard:read', '查看仪表板', 'dashboard', 'read', '查看统计数据'),
-- 用户管理权限
('perm-users-read', 'users:read', '查看用户', 'users', 'read', '查看用户列表'),
('perm-users-create', 'users:create', '创建用户', 'users', 'create', '创建新用户'),
('perm-users-update', 'users:update', '更新用户', 'users', 'update', '更新用户信息'),
('perm-users-delete', 'users:delete', '删除用户', 'users', 'delete', '删除用户'),
-- 角色管理权限
('perm-roles-read', 'roles:read', '查看角色', 'roles', 'read', '查看角色列表'),
('perm-roles-create', 'roles:create', '创建角色', 'roles', 'create', '创建新角色'),
('perm-roles-update', 'roles:update', '更新角色', 'roles', 'update', '更新角色信息'),
('perm-roles-delete', 'roles:delete', '删除角色', 'roles', 'delete', '删除角色')
ON CONFLICT (id) DO NOTHING;

-- 角色权限关联（学生角色）
INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
('role-student', 'perm-students-read', 'self'),
('role-student', 'perm-repairs-create', 'self'),
('role-student', 'perm-repairs-read', 'self'),
('role-student', 'perm-notices-read', 'all'),
('role-student', 'perm-dashboard-read', 'self')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 角色权限关联（宿管员角色）
INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
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
('role-dorm-manager', 'perm-dashboard-read', 'all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 角色权限关联（维修人员角色）
INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
('role-maintenance-staff', 'perm-repairs-read', 'all'),
('role-maintenance-staff', 'perm-repairs-update', 'all'),
('role-maintenance-staff', 'perm-rooms-read', 'all'),
('role-maintenance-staff', 'perm-rooms-update', 'all'),
('role-maintenance-staff', 'perm-notices-read', 'all'),
('role-maintenance-staff', 'perm-dashboard-read', 'all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 角色权限关联（楼栋管理员角色）
INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
('role-building-manager', 'perm-buildings-read', 'building'),
('role-building-manager', 'perm-buildings-update', 'building'),
('role-building-manager', 'perm-rooms-read', 'building'),
('role-building-manager', 'perm-rooms-update', 'building'),
('role-building-manager', 'perm-students-read', 'building'),
('role-building-manager', 'perm-repairs-read', 'building'),
('role-building-manager', 'perm-repairs-update', 'building'),
('role-building-manager', 'perm-notices-read', 'all'),
('role-building-manager', 'perm-dashboard-read', 'building')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 角色权限关联（后勤管理员角色）
INSERT INTO role_permissions (role_id, permission_id, scope) VALUES
('role-logistics-admin', 'perm-notices-read', 'all'),
('role-logistics-admin', 'perm-notices-create', 'all'),
('role-logistics-admin', 'perm-notices-update', 'all'),
('role-logistics-admin', 'perm-notices-delete', 'all'),
('role-logistics-admin', 'perm-buildings-read', 'all'),
('role-logistics-admin', 'perm-repairs-read', 'all'),
('role-logistics-admin', 'perm-dashboard-read', 'all')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 角色权限关联（系统管理员角色 - 所有权限）
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-system-admin', id, 'all'
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 创建默认系统管理员账户（密码：admin123，生产环境请修改）
-- 密码哈希：$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZqZqZq
-- 实际使用时应该使用 auth.HashPassword("admin123") 生成
INSERT INTO users (id, username, password_hash, email, real_name, status) VALUES
('user-admin-1', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZqZqZq', 'admin@unidorm.edu', '系统管理员', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 为系统管理员分配角色
INSERT INTO user_roles (user_id, role_id) VALUES
('user-admin-1', 'role-system-admin')
ON CONFLICT (user_id, role_id, COALESCE(building_id, '')) DO NOTHING;

