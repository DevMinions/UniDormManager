package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
)

// QueryOptimized 优化查询示例
type QueryOptimized struct{}

// OptimizedStudentQueries 优化的学生查询
type OptimizedStudentQueries struct{}

// GetStudentsWithPagination 分页获取学生（优化版本）
func (q *OptimizedStudentQueries) GetStudentsWithPagination(
	ctx context.Context,
	page, pageSize int,
	searchTerm string,
	status string,
) ([]map[string]interface{}, int, error) {
	offset := (page - 1) * pageSize

	// 使用预编译语句和参数化查询
	query := `
		SELECT
			s.id, s.name, s.student_id, s.major, s.room_number, s.status,
			b.name as building_name,
			COUNT(*) OVER() as total_count
		FROM students s
		LEFT JOIN rooms r ON s.room_number = r.room_number
		LEFT JOIN buildings b ON r.building_id = b.id
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	// 动态构建WHERE条件
	if searchTerm != "" {
		query += fmt.Sprintf(" AND (s.name ILIKE $%d OR s.student_id ILIKE $%d OR s.major ILIKE $%d)",
			argIndex, argIndex+1, argIndex+2)
		args = append(args, "%"+searchTerm+"%", "%"+searchTerm+"%", "%"+searchTerm+"%")
		argIndex += 3
	}

	if status != "" {
		query += fmt.Sprintf(" AND s.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	// 添加分页和排序
	query += fmt.Sprintf(" ORDER BY s.created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	// 执行查询
	rows, err := DB.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("查询学生失败: %w", err)
	}
	defer rows.Close()

	var students []map[string]interface{}
	var totalCount int

	for rows.Next() {
		var student map[string]interface{}
		student = make(map[string]interface{})
		var id, name, studentID, major, roomNumber, status, buildingName string
		var count int

		err := rows.Scan(
			&id, &name, &studentID, &major, &roomNumber, &status,
			&buildingName, &count,
		)
		if err != nil {
			continue
		}

		student["id"] = id
		student["name"] = name
		student["student_id"] = studentID
		student["major"] = major
		student["room_number"] = roomNumber
		student["status"] = status
		student["building_name"] = buildingName

		students = append(students, student)
		totalCount = count
	}

	return students, totalCount, nil
}

// GetDashboardStats 优化的仪表板统计查询
func (q *OptimizedStudentQueries) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	// 使用单个查询获取所有统计数据，减少数据库往返
	query := `
	WITH student_stats AS (
		SELECT
			COUNT(*) as total_students,
			COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_students,
			COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_students
		FROM students
	),
	room_stats AS (
		SELECT
			COUNT(*) as total_rooms,
			COUNT(CASE WHEN status = 'Available' THEN 1 END) as available_rooms,
			COUNT(CASE WHEN status = 'Occupied' THEN 1 END) as occupied_rooms
		FROM rooms
	),
	repair_stats AS (
		SELECT
			COUNT(*) as total_repairs,
			COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_repairs,
			COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_repairs,
			COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_repairs
		FROM repair_requests
		WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
	)
	SELECT
		s.total_students,
		s.active_students,
		s.inactive_students,
		r.total_rooms,
		r.available_rooms,
		r.occupied_rooms,
		p.total_repairs,
		p.pending_repairs,
		p.in_progress_repairs,
		p.completed_repairs
	FROM student_stats s, room_stats r, repair_stats p
	`

	var stats struct {
		TotalStudents     int `json:"total_students"`
		ActiveStudents    int `json:"active_students"`
		InactiveStudents  int `json:"inactive_students"`
		TotalRooms        int `json:"total_rooms"`
		AvailableRooms    int `json:"available_rooms"`
		OccupiedRooms     int `json:"occupied_rooms"`
		TotalRepairs      int `json:"total_repairs"`
		PendingRepairs    int `json:"pending_repairs"`
		InProgressRepairs int `json:"in_progress_repairs"`
		CompletedRepairs  int `json:"completed_repairs"`
	}

	err := DB.QueryRow(ctx, query).Scan(
		&stats.TotalStudents,
		&stats.ActiveStudents,
		&stats.InactiveStudents,
		&stats.TotalRooms,
		&stats.AvailableRooms,
		&stats.OccupiedRooms,
		&stats.TotalRepairs,
		&stats.PendingRepairs,
		&stats.InProgressRepairs,
		&stats.CompletedRepairs,
	)

	if err != nil {
		return nil, fmt.Errorf("获取仪表板统计失败: %w", err)
	}

	// 计算占用率
	occupancyRate := float64(0)
	if stats.TotalRooms > 0 {
		occupancyRate = float64(stats.OccupiedRooms) / float64(stats.TotalRooms) * 100
	}

	result := map[string]interface{}{
		"students": map[string]int{
			"total":     stats.TotalStudents,
			"active":    stats.ActiveStudents,
			"inactive":  stats.InactiveStudents,
		},
		"rooms": map[string]interface{}{
			"total":        stats.TotalRooms,
			"available":    stats.AvailableRooms,
			"occupied":     stats.OccupiedRooms,
			"occupancy_rate": occupancyRate,
		},
		"repairs": map[string]int{
			"total":        stats.TotalRepairs,
			"pending":      stats.PendingRepairs,
			"in_progress":  stats.InProgressRepairs,
			"completed":    stats.CompletedRepairs,
		},
		"last_updated": time.Now(),
	}

	return result, nil
}

// BatchInsertStudents 批量插入学生（优化版本）
func (q *OptimizedStudentQueries) BatchInsertStudents(
	ctx context.Context,
	students []map[string]interface{},
) error {
	if len(students) == 0 {
		return nil
	}

	// 使用批量插入，提高性能
	valueStrings := make([]string, 0, len(students))
	valueArgs := make([]interface{}, 0, len(students)*6)
	argIndex := 1

	for _, student := range students {
		valueStrings = append(valueStrings, fmt.Sprintf(
			"($%d, $%d, $%d, $%d, $%d, $%d)",
			argIndex, argIndex+1, argIndex+2, argIndex+3, argIndex+4, argIndex+5,
		))
		valueArgs = append(valueArgs,
			student["id"],
			student["name"],
			student["student_id"],
			student["major"],
			student["room_number"],
			student["status"],
		)
		argIndex += 6
	}

	query := fmt.Sprintf(`
		INSERT INTO students (id, name, student_id, major, room_number, status)
		VALUES %s
		ON CONFLICT (student_id) DO UPDATE SET
			name = EXCLUDED.name,
			major = EXCLUDED.major,
			room_number = EXCLUDED.room_number,
			status = EXCLUDED.status,
			updated_at = CURRENT_TIMESTAMP
	`, fmt.Sprint(valueStrings))

	_, err := DB.Exec(ctx, query, valueArgs...)
	if err != nil {
		return fmt.Errorf("批量插入学生失败: %w", err)
	}

	log.Printf("成功批量插入 %d 个学生", len(students))
	return nil
}

// ExecuteWithRetry 带重试机制的查询执行
func ExecuteWithRetry(
	ctx context.Context,
	query string,
	args []interface{},
	maxRetries int,
) (pgx.Rows, error) {
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		rows, err := DB.Query(ctx, query, args...)
		if err == nil {
			return rows, nil
		}

		lastErr = err

		// 如果是网络错误或超时，则重试
		if isRetryableError(err) && i < maxRetries-1 {
			log.Printf("查询失败，正在重试 (%d/%d): %v", i+1, maxRetries, err)
			time.Sleep(time.Duration(i+1) * 100 * time.Millisecond) // 指数退避
			continue
		}

		break
	}

	return nil, lastErr
}

// isRetryableError 判断是否为可重试的错误
func isRetryableError(err error) bool {
	// 这里可以添加更多可重试的错误类型
	errStr := err.Error()
	retryableErrors := []string{
		"connection reset",
		"timeout",
		"connection refused",
		"deadlock",
	}

	for _, retryableErr := range retryableErrors {
		if contains(errStr, retryableErr) {
			return true
		}
	}

	return false
}

// contains 检查字符串包含
func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		   (s == substr ||
		    len(s) > len(substr) &&
		    (s[:len(substr)] == substr ||
		     s[len(s)-len(substr):] == substr ||
		     indexOf(s, substr) >= 0))
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}