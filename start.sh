#!/bin/bash

# UniDormManager Docker 启动脚本
# 包含新功能的完整业务系统

set -e

echo "🚀 启动 UniDormManager 宿舍管理系统..."
echo "========================================"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行或权限不足"
    echo ""
    echo "请尝试以下解决方案："
    echo "1. 如果 Docker 未运行，请启动 Docker 服务"
    echo "2. 如果权限不足，请运行以下命令修复权限："
    echo "   sudo usermod -aG docker \$USER"
    echo "   newgrp docker"
    echo "3. 或者重新登录后再试"
    echo ""
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p postgres_data
mkdir -p redis_data

# 设置权限
chmod 755 logs

# 停止现有容器
echo "🛑 停止现有容器..."
docker compose down

# 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker system prune -f

# 构建并启动服务
echo "🔨 构建和启动服务..."
docker compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
echo "正在检查 PostgreSQL 连接..."
until docker exec unidorm-postgres pg_isready -U postgres; do
    echo "PostgreSQL 尚未就绪，等待中..."
    sleep 2
done

echo "✅ PostgreSQL 已就绪"

# 等待后端服务就绪
echo "⏳ 等待后端服务就绪..."
until curl -f http://localhost:8080/health 2>/dev/null; do
    echo "后端服务尚未就绪，等待中..."
    sleep 3
done

echo "✅ 后端服务已就绪"

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
echo "正在执行基础表结构..."
docker exec unidorm-postgres psql -U postgres -d unidorm -f /docker-entrypoint-initdb.d/init.sql

echo "正在执行新功能表结构..."
docker exec unidorm-postgres psql -U postgres -d unidorm -c "
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_inspections_room_date ON inspections(room_number, check_date);
CREATE INDEX IF NOT EXISTS idx_access_logs_student_time ON access_logs(student_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_late_alerts_date ON late_return_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_room_swap_applicant ON room_swap_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_room_swap_status ON room_swap_applications(status);
CREATE INDEX IF NOT EXISTS idx_approval_flow_application ON approval_flows(application_id);
"

echo "✅ 数据库迁移完成"

# 显示服务信息
echo ""
echo "🎉 服务启动成功！"
echo "========================================"
echo "📊 服务访问地址："
echo "前端应用: http://localhost:3000"
echo "后端API:  http://localhost:8080"
echo "API文档:  http://localhost:8080/swagger/index.html"
echo ""
echo "🗄️ 数据库连接信息："
echo "主机: localhost"
echo "端口: 5433"
echo "用户: postgres"
echo "密码: postgres"
echo "数据库: unidorm"
echo ""
echo "🔴 Redis连接信息："
echo "主机: localhost"
echo "端口: 6380"
echo ""
echo "📋 新增业务功能："
echo "✅ 查寝评分系统 - http://localhost:3000/inspections"
echo "✅ 查寝排行榜 - http://localhost:3000/rankings"
echo "✅ 晚归监控系统 - http://localhost:3000/access-logs"
echo "✅ 换寝申请系统 - http://localhost:3000/workflow"
echo ""
echo "🐳 Docker 容器状态："
docker compose ps

echo ""
echo "🔧 常用命令："
echo "查看日志: docker compose logs -f [service_name]"
echo "停止服务: docker compose down"
echo "重启服务: docker compose restart [service_name]"
echo "进入后端容器: docker exec -it unidorm-backend sh"
echo "进入数据库: docker exec -it unidorm-postgres psql -U postgres -d unidorm"

echo ""
echo "🎯 默认登录信息："
echo "用户名: admin"
echo "密码: 查看后端日志，搜 'INITIAL PASSWORD'（或预设 ADMIN_INITIAL_PASSWORD）"
echo ""
echo "✨ 系统已准备就绪，请访问 http://localhost:3000 开始使用！"

