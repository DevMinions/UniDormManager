# 数据库初始化指南

本文档说明在使用 Docker 部署时如何初始化数据库数据。

## 目录
1. [自动初始化（推荐）](#方法1-自动初始化推荐)
2. [使用 SQL 脚本初始化测试数据](#方法2-使用sql脚本初始化测试数据)
3. [使用 Docker 命令执行 SQL](#方法3-使用docker命令执行sql)
4. [手动初始化管理员](#方法4-手动初始化管理员)
5. [清除数据重新初始化](#方法5-清除数据重新初始化)

---

## 方法1: 自动初始化（推荐）

### 说明
后端服务启动时会**自动执行**以下初始化：
- ✅ 创建所有数据库表
- ✅ 初始化角色数据（student, dorm_manager, maintenance_staff 等）
- ✅ 初始化权限数据（所有 CRUD 权限）
- ✅ 创建默认管理员用户

### 默认管理员账号
- **用户名**: `admin`
- **密码**: `admin123`

### 使用步骤
```bash
# 1. 启动所有服务（会自动初始化数据库）
docker compose up -d

# 2. 查看后端日志，确认初始化成功
docker compose logs backend | grep -i "initialized\|admin"

# 3. 访问前端登录页面
# http://localhost:3000
# 使用 admin/admin123 登录
```

### 特点
- ✅ **无需手动操作**，启动即用
- ✅ **幂等性**：重复启动不会重复创建数据
- ✅ **安全**：已存在的数据不会被覆盖（使用 `ON CONFLICT DO NOTHING`）

---

## 方法2: 使用 SQL 脚本初始化测试数据

### 说明
如果需要添加**测试数据**（学生、楼栋、房间、报修、公告等），可以使用提供的 SQL 脚本。

### 测试数据内容
- 3 栋宿舍楼（A栋、B栋、C栋）
- 13 个房间
- 34 名学生
- 8 条报修记录
- 5 条公告通知

### 使用步骤

#### 方法 2.1: 直接执行 SQL 文件
```bash
# 1. 确保服务已启动
docker compose up -d

# 2. 执行测试数据脚本
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql

# 或者使用绝对路径
docker compose exec -T postgres psql -U postgres -d unidorm < /path/to/scripts/seed_test_data.sql
```

#### 方法 2.2: 复制文件到容器执行
```bash
# 1. 复制 SQL 文件到容器
docker cp scripts/seed_test_data.sql unidorm-postgres:/tmp/seed_test_data.sql

# 2. 在容器内执行
docker compose exec postgres psql -U postgres -d unidorm -f /tmp/seed_test_data.sql
```

#### 方法 2.3: 手动连接数据库执行
```bash
# 1. 连接到 PostgreSQL 容器
docker compose exec postgres psql -U postgres -d unidorm

# 2. 在 psql 中执行 SQL 文件
\i /tmp/seed_test_data.sql

# 或者直接粘贴 SQL 内容执行
```

---

## 方法3: 使用 Docker 命令执行 SQL

### 执行任意 SQL 语句
```bash
# 单条 SQL 语句
docker compose exec -T postgres psql -U postgres -d unidorm -c "SELECT COUNT(*) FROM students;"

# 多条 SQL 语句
docker compose exec -T postgres psql -U postgres -d unidorm <<EOF
INSERT INTO buildings (id, name, type, floors, manager) 
VALUES ('building-4', 'D栋', 'Male', 6, '新管理员');
EOF
```

### 查看数据库内容
```bash
# 查看所有表
docker compose exec postgres psql -U postgres -d unidorm -c "\dt"

# 查看学生数量
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT COUNT(*) FROM students;"

# 查看管理员用户
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT username, email FROM users WHERE username = 'admin';"
```

---

## 方法4: 手动初始化管理员

如果需要重置管理员密码或创建新的管理员用户：

### 使用 Go 工具（如果已编译）
```bash
# 1. 进入后端容器
docker compose exec backend sh

# 2. 运行初始化工具（如果存在）
./init_admin [新密码]

# 默认密码是 admin123
```

### 使用 SQL 直接创建
```bash
# 连接到数据库
docker compose exec postgres psql -U postgres -d unidorm

# 执行以下 SQL（密码是 admin123 的哈希值，需要从代码获取或使用 bcrypt 生成）
# 通常后端会自动创建，此方法仅用于特殊情况
```

---

## 方法5: 清除数据重新初始化

如果需要**完全清除数据并重新初始化**：

### 清除所有数据（危险操作）
```bash
# 1. 停止所有服务
docker compose down

# 2. 删除数据库卷（会清除所有数据）
docker volume rm unidormmanager_postgres_data

# 或者使用以下命令一次性删除
docker compose down -v

# 3. 重新启动服务（会自动重新初始化）
docker compose up -d
```

### 只清除业务数据（保留用户和角色）
```bash
# 连接到数据库
docker compose exec postgres psql -U postgres -d unidorm

# 执行以下 SQL
TRUNCATE TABLE students, rooms, buildings, repair_requests, notices CASCADE;
```

---

## 验证初始化结果

### 检查初始化状态
```bash
# 查看后端日志中的初始化信息
docker compose logs backend | grep -i "initialized\|admin\|roles\|permissions"

# 应该看到类似输出：
# Database tables created successfully
# Roles initialized successfully
# Auth data initialized successfully
# Default admin user initialized (username: admin, password: admin123)
```

### 检查数据
```bash
# 检查角色数量（应该有 6 个角色）
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT COUNT(*) FROM roles;"

# 检查权限数量（应该有约 27 个权限）
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT COUNT(*) FROM permissions;"

# 检查管理员用户
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT username, email, real_name FROM users WHERE username = 'admin';"
```

---

## 常见问题

### Q1: 初始化失败怎么办？
```bash
# 查看详细错误日志
docker compose logs backend

# 检查数据库连接
docker compose exec postgres pg_isready -U postgres

# 检查数据库是否存在
docker compose exec postgres psql -U postgres -l | grep unidorm
```

### Q2: 如何修改默认管理员密码？
1. 使用前端界面登录后修改
2. 或使用 SQL 直接更新（需要先获取密码哈希值）

### Q3: 如何添加更多测试数据？
编辑 `scripts/seed_test_data.sql` 文件，添加更多 INSERT 语句，然后重新执行。

### Q4: 初始化会覆盖已有数据吗？
不会。所有初始化语句都使用了 `ON CONFLICT DO NOTHING`，已存在的数据不会被覆盖。

---

## 快速参考

```bash
# 启动服务（自动初始化）
docker compose up -d

# 添加测试数据
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql

# 查看数据
docker compose exec postgres psql -U postgres -d unidorm -c "SELECT COUNT(*) FROM students;"

# 清除所有数据重新开始
docker compose down -v && docker compose up -d
```

---

## 相关文件

- 数据库初始化代码: `UniDormManagerServer/database/database.go`
- 权限初始化代码: `UniDormManagerServer/database/init_auth_data.go`
- 测试数据脚本: `scripts/seed_test_data.sql`
- Docker 配置: `docker-compose.yml`

