package store

import (
	"context"
	"fmt"
	"time"

	"unidorm-manager-server/database"
	"unidorm-manager-server/models"
	"unidorm-manager-server/utils"
)

// GetRoomsPaginated 分页获取房间
func (s *DBStore) GetRoomsPaginated(req *models.PaginatedRequest, filter *models.RoomFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()

	// 验证参数
	req.ValidateAndSetDefaults()

	// 构建查询
	dataQB, countQB := utils.BuildRoomQuery(ctx, req, filter)

	// 查询总数
	countQuery, countArgs := countQB.BuildCountQuery()
	var total int64
	err := database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("查询房间总数失败: %w", err)
	}

	// 查询数据
	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("查询房间数据失败: %w", err)
	}
	defer rows.Close()

	rooms := make([]*models.Room, 0)
	for rows.Next() {
		var room models.Room
		if err := rows.Scan(
			&room.ID, &room.Number, &room.Building, &room.Floor,
			&room.Capacity, &room.Occupied, &room.Type, &room.Status,
		); err == nil {
			rooms = append(rooms, &room)
		}
	}

	// 构建分页响应
	response := models.CalculatePagination(req.Page, req.PageSize, total)
	response.Data = rooms

	return &response, nil
}

// GetRepairRequestsPaginated 分页获取维修申请
func (s *DBStore) GetRepairRequestsPaginated(req *models.PaginatedRequest, filter *models.RepairFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()

	// 验证参数
	req.ValidateAndSetDefaults()

	// 构建查询
	dataQB, countQB := utils.BuildRepairQuery(ctx, req, filter)

	// 查询总数
	countQuery, countArgs := countQB.BuildCountQuery()
	var total int64
	err := database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("查询维修申请总数失败: %w", err)
	}

	// 查询数据
	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("查询维修申请数据失败: %w", err)
	}
	defer rows.Close()

	repairs := make([]*models.RepairRequest, 0)
	for rows.Next() {
		var repair models.RepairRequest
		var date time.Time
		if err := rows.Scan(
			&repair.ID, &repair.Title, &repair.Description,
			&repair.Status, &date, &repair.RoomNumber, &repair.Priority,
		); err == nil {
			repair.Date = date.Format("2006-01-02")
			repair.Status = convertRepairStatus(repair.Status) // 转换状态值
			repairs = append(repairs, &repair)
		}
	}

	// 构建分页响应
	response := models.CalculatePagination(req.Page, req.PageSize, total)
	response.Data = repairs

	return &response, nil
}

// GetInspectionsPaginated 分页获取查寝记录
func (s *DBStore) GetInspectionsPaginated(req *models.PaginatedRequest, filter *models.InspectionFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()

	// 验证参数
	req.ValidateAndSetDefaults()

	// 构建查询
	dataQB, countQB := utils.BuildInspectionQuery(ctx, req, filter)

	// 查询总数
	countQuery, countArgs := countQB.BuildCountQuery()
	var total int64
	err := database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("查询查寝记录总数失败: %w", err)
	}

	// 查询数据
	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("查询查寝记录数据失败: %w", err)
	}
	defer rows.Close()

	inspections := make([]*models.Inspection, 0)
	for rows.Next() {
		var inspection models.Inspection
		// SCAN MUST MATCH QUERY in BuildInspectionQuery:
		// id, room_number, building, inspector, check_date, overall_score, status, comment, created_at
		if err := rows.Scan(
			&inspection.ID, &inspection.RoomNumber, &inspection.Building,
			&inspection.Inspector, &inspection.CheckDate, &inspection.OverallScore,
			&inspection.Status, &inspection.Comment, &inspection.CreatedAt,
		); err == nil {
			inspections = append(inspections, &inspection)
		}
	}

	// 构建分页响应
	response := models.CalculatePagination(req.Page, req.PageSize, total)
	response.Data = inspections

	return &response, nil
}
