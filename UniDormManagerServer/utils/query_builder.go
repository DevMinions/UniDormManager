package utils

import (
	"context"
	"fmt"
	"strings"

	"unidorm-manager-server/models"
)

// QueryBuilder 构建分页查询的Builder
type QueryBuilder struct {
	baseQuery  string
	countQuery string
	args       []interface{}
	hasWhere   bool
	ctx        context.Context
}

// NewQueryBuilder 创建查询构建器
func NewQueryBuilder(ctx context.Context, baseQuery string) *QueryBuilder {
	return &QueryBuilder{
		baseQuery: baseQuery,
		// countQuery is now generated dynamically
		ctx:      ctx,
		hasWhere: false,
	}
}

// Where 添加WHERE条件
func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
	if !qb.hasWhere {
		qb.baseQuery += " WHERE " + condition
		qb.hasWhere = true
	} else {
		qb.baseQuery += " AND " + condition
	}
	qb.args = append(qb.args, args...)
	return qb
}

// WhereLike 添加LIKE查询条件
func (qb *QueryBuilder) WhereLike(column, value string) *QueryBuilder {
	if value != "" {
		return qb.Where(fmt.Sprintf("%s ILIKE $%d", column, len(qb.args)+1), "%"+value+"%")
	}
	return qb
}

// WhereIn 添加IN查询条件
func (qb *QueryBuilder) WhereIn(column string, values []string) *QueryBuilder {
	if len(values) > 0 {
		placeholders := make([]string, len(values))
		args := make([]interface{}, len(values))
		for i, v := range values {
			placeholders[i] = fmt.Sprintf("$%d", len(qb.args)+i+1)
			args[i] = v
		}
		return qb.Where(fmt.Sprintf("%s IN (%s)", column, strings.Join(placeholders, ",")), args...)
	}
	return qb
}

// WhereStatus 添加状态查询
func (qb *QueryBuilder) WhereStatus(status string, columnName string) *QueryBuilder {
	if status != "" && status != "All" {
		return qb.Where(fmt.Sprintf("%s = $%d", columnName, len(qb.args)+1), status)
	}
	return qb
}

// OrderBy 添加排序
func (qb *QueryBuilder) OrderBy(sortBy, sortOrder string) *QueryBuilder {
	// 安全的排序列表
	allowedColumns := map[string]bool{
		"created_at": true, "updated_at": true, "name": true,
		"status": true, "priority": true, "student_id": true,
		"room": true, "number": true,
	}

	if allowedColumns[sortBy] {
		if sortOrder == "" {
			sortOrder = "DESC"
		}
		qb.baseQuery += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)
	}
	return qb
}

// LimitOffset 添加分页限制
func (qb *QueryBuilder) LimitOffset(page, pageSize int) *QueryBuilder {
	offset := (page - 1) * pageSize
	qb.baseQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", len(qb.args)+1, len(qb.args)+2)
	qb.args = append(qb.args, pageSize, offset)
	return qb
}

// BuildQuery 构建最终查询
func (qb *QueryBuilder) BuildQuery() (string, []interface{}) {
	return qb.baseQuery, qb.args
}

// BuildCountQuery 构建计数查询
func (qb *QueryBuilder) BuildCountQuery() (string, []interface{}) {
	return fmt.Sprintf("SELECT COUNT(*) FROM (%s) as count_table", qb.baseQuery), qb.args
}

// BuildStudentQuery 构建学生分页查询
func BuildStudentQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.StudentFilter) (*QueryBuilder, *QueryBuilder) {
	baseQuery := `
		SELECT s.id, s.name, s.student_id, s.major, s.room_number, s.building, s.status, s.created_at, s.updated_at,
		       r.building as building_name
		FROM students s
		LEFT JOIN rooms r ON s.room_number = r.number AND s.building = r.building
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	// search 跨三列 OR(name / student_id / major)。
	// 之前用 WhereLike 串三次是 AND,要求同时命中三列,实际等于无人匹配 — UI 搜索时
	// 学生列表立刻变空。改 OR + 同一 $n 复用,跟 BuildRoomQuery 的写法保持一致。
	if req.Search != "" {
		n := len(qb.args) + 1
		qb.Where(fmt.Sprintf("(s.name ILIKE $%d OR s.student_id ILIKE $%d OR s.major ILIKE $%d)", n, n, n), "%"+req.Search+"%")
	}
	qb.WhereStatus(filter.Status, "s.status").
		WhereLike("s.major", filter.Major).
		WhereLike("r.number", filter.Room).
		WhereLike("r.building", filter.Building)

	// 构建数据查询和计数查询
	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// BuildRoomQuery 构建房间分页查询
func BuildRoomQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.RoomFilter) (*QueryBuilder, *QueryBuilder) {
	// 修正 SELECT 列以匹配 store_pagination.go 中的 scan
	baseQuery := `
		SELECT r.id, r.number, r.building, r.floor, r.capacity, r.occupied, r.type, r.status
		FROM rooms r
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	// 添加筛选条件
	// 修正 Search 逻辑：rooms 表中 building 是字符串列
	// 添加筛选条件
	// 修正 Search 逻辑：rooms 表中 building 是字符串列
	if req.Search != "" {
		qb.Where(fmt.Sprintf("(r.number ILIKE $%d OR r.building ILIKE $%d)", len(qb.args)+1, len(qb.args)+1), "%"+req.Search+"%")
	}

	qb.WhereStatus(filter.Status, "r.status").
		WhereStatus(filter.Type, "r.type")

	// 修正 Building 筛选：处理 "All"
	if filter.Building != "" && filter.Building != "All" {
		buildings := strings.Split(filter.Building, ",")
		if len(buildings) > 0 {
			qb.WhereIn("r.building", buildings)
		}
	}

	if filter.CapacityMin > 0 {
		qb.Where("r.capacity >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.CapacityMin)
	}

	if filter.CapacityMax > 0 {
		qb.Where("r.capacity <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.CapacityMax)
	}

	// 构建数据查询和计数查询
	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// BuildRepairQuery 构建维修申请分页查询
func BuildRepairQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.RepairFilter) (*QueryBuilder, *QueryBuilder) {
	// 修正 SELECT 列以匹配 store_pagination.go 中的 scan
	baseQuery := `
		SELECT r.id, r.title, r.description, r.status, r.date, r.room_number, r.priority
		FROM repair_requests r
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	// 添加筛选条件
	// 添加筛选条件
	if req.Search != "" {
		qb.Where(fmt.Sprintf("(r.title ILIKE $%d OR r.room_number ILIKE $%d)", len(qb.args)+1, len(qb.args)+1), "%"+req.Search+"%")
	}

	qb.WhereStatus(filter.Status, "r.status").
		WhereStatus(filter.Priority, "r.priority")

	if filter.Room != "" {
		qb.WhereLike("r.room_number", filter.Room)
	}

	// 日期范围筛选
	// 注意：数据库中 date 可能存储为 text (YYYY-MM-DD) 或 date 类型，store_db.go 中 CreateRepairRequest 使用 date 类型但 Scan 时看起来像处理时间
	// 假设 date 列是 date 类型或 text 格式的日期
	if !filter.DateFrom.IsZero() {
		qb.Where("r.date >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateFrom.Format("2006-01-02"))
	}

	if !filter.DateTo.IsZero() {
		qb.Where("r.date <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateTo.Format("2006-01-02"))
	}

	// 构建数据查询和计数查询
	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// BuildInspectionQuery 构建查寝分页查询
func BuildInspectionQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.InspectionFilter) (*QueryBuilder, *QueryBuilder) {
	baseQuery := `
		SELECT i.id, i.room_number, i.building, i.inspector, i.check_date, i.overall_score, i.status, i.comment, i.created_at
		FROM inspections i
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	if req.Search != "" {
		qb.Where(fmt.Sprintf("(i.room_number ILIKE $%d OR i.inspector ILIKE $%d)", len(qb.args)+1, len(qb.args)+1), "%"+req.Search+"%")
	}

	qb.WhereStatus(filter.Status, "i.status")

	if filter.Building != "" && filter.Building != "All" {
		qb.Where(fmt.Sprintf("i.building = $%d", len(qb.args)+1), filter.Building)
	}

	if filter.Inspector != "" {
		qb.Where(fmt.Sprintf("i.inspector = $%d", len(qb.args)+1), filter.Inspector)
	}

	if !filter.DateFrom.IsZero() {
		qb.Where("i.check_date >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateFrom.Format("2006-01-02"))
	}

	if !filter.DateTo.IsZero() {
		qb.Where("i.check_date <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateTo.Format("2006-01-02"))
	}

	if filter.ScoreMin > 0 {
		qb.Where("i.overall_score >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.ScoreMin)
	}

	if filter.ScoreMax > 0 {
		qb.Where("i.overall_score <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.ScoreMax)
	}

	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// BuildAccessLogQuery 构建门禁记录分页查询
func BuildAccessLogQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.AccessLogFilter) (*QueryBuilder, *QueryBuilder) {
	baseQuery := `
		SELECT id, student_id, student_name, room_number, direction, gate_name, timestamp, photo_url, status, created_at
		FROM access_logs
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	if req.Search != "" {
		qb.Where(fmt.Sprintf("(student_name ILIKE $%d OR student_id ILIKE $%d OR room_number ILIKE $%d)", len(qb.args)+1, len(qb.args)+1, len(qb.args)+1), "%"+req.Search+"%")
	}

	qb.WhereStatus(filter.Status, "status")

	if filter.Direction != "" {
		qb.Where("direction = $"+fmt.Sprintf("%d", len(qb.args)+1), filter.Direction)
		qb.args = append(qb.args, filter.Direction)
	}

	if filter.GateName != "" {
		qb.WhereLike("gate_name", filter.GateName)
	}

	if filter.DateFrom != "" {
		qb.Where("timestamp >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateFrom)
		qb.args = append(qb.args, filter.DateFrom)
	}

	if filter.DateTo != "" {
		qb.Where("timestamp <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.DateTo)
		qb.args = append(qb.args, filter.DateTo)
	}

	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// BuildLateReturnQuery 构建晚归告警分页查询
func BuildLateReturnQuery(ctx context.Context, req *models.PaginatedRequest, filter *models.LateReturnFilter) (*QueryBuilder, *QueryBuilder) {
	baseQuery := `
		SELECT id, student_id, student_name, room_number, alert_date, last_entry, status, handler, handle_time, comment, notify_sent, created_at, updated_at
		FROM late_return_alerts
	`

	qb := NewQueryBuilder(ctx, baseQuery)

	if req.Search != "" {
		qb.Where(fmt.Sprintf("(student_name ILIKE $%d OR room_number ILIKE $%d)", len(qb.args)+1, len(qb.args)+1), "%"+req.Search+"%")
	}

	qb.WhereStatus(filter.Status, "status")

	if filter.AlertDateFrom != "" {
		qb.Where("alert_date >= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.AlertDateFrom)
		qb.args = append(qb.args, filter.AlertDateFrom)
	}

	if filter.AlertDateTo != "" {
		qb.Where("alert_date <= $"+fmt.Sprintf("%d", len(qb.args)+1), filter.AlertDateTo)
		qb.args = append(qb.args, filter.AlertDateTo)
	}

	dataQB := qb.Clone().
		OrderBy(req.SortBy, req.SortOrder).
		LimitOffset(req.Page, req.PageSize)

	countQB := qb.Clone()

	return dataQB, countQB
}

// Clone 克隆QueryBuilder
func (qb *QueryBuilder) Clone() *QueryBuilder {
	newQB := &QueryBuilder{
		baseQuery:  qb.baseQuery,
		countQuery: qb.countQuery,
		args:       make([]interface{}, len(qb.args)),
		hasWhere:   qb.hasWhere,
		ctx:        qb.ctx,
	}
	copy(newQB.args, qb.args)
	return newQB
}
