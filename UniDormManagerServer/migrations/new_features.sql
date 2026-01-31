-- 新增业务功能数据库表结构
-- 在现有 init.sql 基础上添加新功能表

-- 查寝评分系统相关表
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(20) NOT NULL,
    building VARCHAR(50) NOT NULL,
    inspector VARCHAR(100) NOT NULL,
    check_date TIMESTAMP WITH TIME ZONE NOT NULL,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    status VARCHAR(20) CHECK (status IN ('Excellent', 'Good', 'Fair', 'Poor')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (room_number, building) REFERENCES rooms(number, building)
);

CREATE TABLE IF NOT EXISTS inspection_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hygiene', 'Safety', 'Discipline', 'AirQuality')),
    item VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 25),
    max_score INTEGER NOT NULL DEFAULT 25,
    comment TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 门禁记录系统相关表
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    student_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('In', 'Out')),
    gate_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    photo_url VARCHAR(500),
    status VARCHAR(20) CHECK (status IN ('Normal', 'Late', 'Absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS late_return_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    student_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    alert_date DATE NOT NULL,
    last_entry TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Handled', 'Ignored')),
    handler VARCHAR(100),
    handle_time TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    notify_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curfew_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building VARCHAR(50) NOT NULL UNIQUE,
    weekday_time TIME NOT NULL DEFAULT '23:00:00',
    weekend_time TIME NOT NULL DEFAULT '23:30:00',
    alert_delay INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 换寝申请系统相关表
CREATE TABLE IF NOT EXISTS room_swap_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES students(id),
    applicant_name VARCHAR(100) NOT NULL,
    current_room VARCHAR(20) NOT NULL,
    current_roommate VARCHAR(100),
    target_room VARCHAR(20) NOT NULL,
    target_roommate VARCHAR(100),
    reason TEXT NOT NULL,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('Normal', 'Urgent', 'VeryUrgent')),
    status VARCHAR(30) CHECK (status IN ('Pending', 'CounselorApproved', 'CounselorRejected', 'CollegeApproved', 'CollegeRejected', 'FinalApproved', 'FinalRejected', 'Completed', 'Cancelled')),
    current_step VARCHAR(30) CHECK (current_step IN ('Counselor', 'College', 'ApartmentCenter')),
    apply_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES room_swap_applications(id) ON DELETE CASCADE,
    step VARCHAR(30) NOT NULL CHECK (step IN ('Counselor', 'College', 'ApartmentCenter')),
    approver_id UUID REFERENCES users(id),
    approver_name VARCHAR(100) NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Approved', 'Rejected')),
    comment TEXT,
    approval_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_step VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_swap_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    student_name VARCHAR(100) NOT NULL,
    from_room VARCHAR(20) NOT NULL,
    to_room VARCHAR(20) NOT NULL,
    swap_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    application_id UUID REFERENCES room_swap_applications(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 查寝排行榜视图（简化版本，实际应用中可能需要更复杂的计算）
CREATE OR REPLACE VIEW inspection_rankings AS
SELECT
    gen_random_uuid() as id,
    i.room_number,
    i.building,
    ROUND(AVG(i.overall_score), 1) as week_score,
    ROUND(AVG(i.overall_score), 1) as month_score,
    ROW_NUMBER() OVER (PARTITION BY i.building ORDER BY AVG(i.overall_score) DESC) as rank,
    COUNT(*) OVER (PARTITION BY i.building) as total_rooms,
    CASE
        WHEN AVG(i.overall_score) >= 90 THEN true
        ELSE false
    END as is_red_list,
    CASE
        WHEN AVG(i.overall_score) < 70 THEN true
        ELSE false
    END as is_black_list,
    NOW() as last_updated
FROM inspections i
WHERE i.check_date >= NOW() - INTERVAL '7 days'
GROUP BY i.room_number, i.building;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_inspections_room_date ON inspections(room_number, check_date);
CREATE INDEX IF NOT EXISTS idx_inspections_building_date ON inspections(building, check_date);
CREATE INDEX IF NOT EXISTS idx_access_logs_student_time ON access_logs(student_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_late_alerts_date ON late_return_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_room_swap_applicant ON room_swap_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_room_swap_status ON room_swap_applications(status);
CREATE INDEX IF NOT EXISTS idx_approval_flow_application ON approval_flows(application_id);

-- 创建更新时间戳的触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为新表创建触发器
CREATE TRIGGER update_inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_late_alerts_updated_at
    BEFORE UPDATE ON late_return_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_swaps_updated_at
    BEFORE UPDATE ON room_swap_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curfew_settings_updated_at
    BEFORE UPDATE ON curfew_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据（可选）
INSERT INTO curfew_settings (building, weekday_time, weekend_time, alert_delay, is_active) VALUES
('A栋', '23:00:00', '23:30:00', 30, true),
('B栋', '23:00:00', '23:30:00', 30, true),
('C栋', '22:30:00', '23:00:00', 30, true)
ON CONFLICT (building) DO NOTHING;