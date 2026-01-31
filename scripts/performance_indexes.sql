-- 性能优化索引脚本
-- 创建时间: 2024-12-08
-- 目标: 提升数据库查询性能

-- ============================================
-- 用户相关索引
-- ============================================

-- 用户表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_created ON users(status, created_at);

-- 用户角色表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_building_id ON user_roles(building_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_building ON user_roles(user_id, building_id);

-- ============================================
-- 角色权限相关索引
-- ============================================

-- 角色权限表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================
-- 学生相关索引
-- ============================================

-- 学生表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_major ON students(major);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_room_number ON students(room_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_status_major ON students(status, major);

-- 用户学生关联表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_students_user_id ON user_students(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_students_student_id ON user_students(student_id);

-- ============================================
-- 楼栋相关索引
-- ============================================

-- 楼栋表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_name ON buildings(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_status ON buildings(status);

-- ============================================
-- 房间相关索引
-- ============================================

-- 房间表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_building_id ON rooms(building_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_building_room ON rooms(building_id, room_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_status_capacity ON rooms(status, capacity);

-- ============================================
-- 维修申请相关索引
-- ============================================

-- 维修申请表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_student_id ON repair_requests(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_room_id ON repair_requests(room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_priority ON repair_requests(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_created_at ON repair_requests(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_status_date ON repair_requests(status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_student_status ON repair_requests(student_id, status);

-- ============================================
-- 通知公告相关索引
-- ============================================

-- 通知表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notices_title ON notices USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notices_content ON notices USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notices_created_at ON notices(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notices_status_created ON notices(status, created_at);

-- ============================================
-- 复合索引优化
-- ============================================

-- 用于仪表板统计的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_building_room_status ON students(room_number) WHERE status = 'Active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repair_requests_status_priority_date ON repair_requests(status, priority, created_at);

-- 用于权限查询的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role_building ON user_roles(user_id, role_id, building_id);

-- ============================================
-- 分析索引使用情况
-- ============================================

-- 创建索引使用情况统计视图
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 创建查询分析视图
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100 -- 执行时间超过100ms的查询
ORDER BY mean_time DESC;

-- ============================================
-- 定期维护脚本
-- ============================================

-- 更新表统计信息
ANALYZE;

-- 重建索引（如果有必要）
-- REINDEX DATABASE unidorm;

-- 显示索引创建结果
SELECT
    'Index created successfully: ' || indexname as result
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY indexname;

COMMENT ON TABLE index_usage_stats IS '索引使用情况统计视图';
COMMENT ON TABLE slow_queries IS '慢查询分析视图';

-- 提示信息
DO $$
BEGIN
    RAISE NOTICE '===== 索引优化脚本执行完成 =====';
    RAISE NOTICE '已创建 % 个新索引', (
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE indexname LIKE 'idx_%'
    );
    RAISE NOTICE '请定期运行 ANALYZE 更新统计信息';
    RAISE NOTICE '可通过视图 index_usage_stats 监控索引使用情况';
    RAISE NOTICE '可通过视图 slow_queries 监控慢查询';
END $$;