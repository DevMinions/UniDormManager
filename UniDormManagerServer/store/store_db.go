package store

import (
	"context"
	"fmt"
	"log"
	"time"

	"unidorm-manager-server/cache"
	"unidorm-manager-server/database"
	"unidorm-manager-server/models"
	"unidorm-manager-server/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// DBStore 数据库存储实现
type DBStore struct {
	cacheEnabled bool
}

// NewDBStore 创建数据库存储实例
func NewDBStore(cacheEnabled bool) *DBStore {
	return &DBStore{
		cacheEnabled: cacheEnabled,
	}
}

// ========== Student Methods ==========

// GetAllStudents 获取所有学生（已弃用，请使用GetStudentsPaginated）
func (s *DBStore) GetAllStudents() ([]*models.Student, error) {
	ctx := context.Background()

	// 尝试从缓存获取
	if s.cacheEnabled {
		cached := []*models.Student{}
		if err := cache.Get(cache.CacheKeyStudents, &cached); err == nil {
			return cached, nil
		}
	}

	// 从数据库查询
	rows, err := database.DB.Query(ctx,
		"SELECT id, name, student_id, major, room_number, building, status FROM students ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("查询学生失败: %w", err)
	}
	defer rows.Close()

	students := []*models.Student{}
	for rows.Next() {
		var student models.Student
		if err := rows.Scan(&student.ID, &student.Name, &student.StudentID,
			&student.Major, &student.RoomNumber, &student.Building, &student.Status); err != nil {
			return nil, fmt.Errorf("扫描学生记录失败: %w", err)
		}
		students = append(students, &student)
	}

	// 写入缓存
	if s.cacheEnabled && len(students) > 0 {
		cache.Set(cache.CacheKeyStudents, students, cache.CacheExpirationMedium)
	}

	return students, nil
}

// GetStudentsPaginated 分页获取学生
func (s *DBStore) GetStudentsPaginated(req *models.PaginatedRequest, filter *models.StudentFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()

	// 验证参数
	req.ValidateAndSetDefaults()

	// 构建查询
	dataQB, countQB := utils.BuildStudentQuery(ctx, req, filter)

	// 查询总数
	countQuery, countArgs := countQB.BuildCountQuery()
	var total int64
	err := database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("查询学生总数失败: %w", err)
	}

	// 查询数据
	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("查询学生数据失败: %w", err)
	}
	defer rows.Close()

	students := []*models.Student{}
	for rows.Next() {
		var student struct {
			ID           string    `json:"id"`
			Name         string    `json:"name"`
			StudentID    string    `json:"student_id"`
			Major        string    `json:"major"`
			RoomNumber   string    `json:"room_number"`
			Building     string    `json:"building"`
			Status       string    `json:"status"`
			CreatedAt    time.Time `json:"created_at"`
			UpdatedAt    time.Time `json:"updated_at"`
			BuildingName *string   `json:"building_name"`
		}

		if err := rows.Scan(
			&student.ID, &student.Name, &student.StudentID,
			&student.Major, &student.RoomNumber, &student.Building, &student.Status,
			&student.CreatedAt, &student.UpdatedAt, &student.BuildingName,
		); err == nil {
			// 转换为标准格式
			s := &models.Student{
				ID:         student.ID,
				Name:       student.Name,
				StudentID:  student.StudentID,
				Major:      student.Major,
				RoomNumber: student.RoomNumber,
				Building:   student.Building,
				Status:     student.Status,
			}

			if student.BuildingName != nil {
				// 如果数据库查询返回了楼栋名称，使用它
				s.Building = *student.BuildingName
			}

			students = append(students, s)
		}
	}

	// 构建分页响应
	response := models.CalculatePagination(req.Page, req.PageSize, total)
	response.Data = students

	return &response, nil
}

// GetStudentByID 根据ID获取学生
func (s *DBStore) GetStudentByID(id string) (*models.Student, bool) {
	ctx := context.Background()
	cacheKey := cache.CacheKeyStudent + id

	// 尝试从缓存获取
	if s.cacheEnabled {
		var cached models.Student
		if err := cache.Get(cacheKey, &cached); err == nil {
			return &cached, true
		}
	}

	// 从数据库查询
	var student models.Student
	err := database.DB.QueryRow(ctx,
		"SELECT id, name, student_id, major, room_number, building, status FROM students WHERE id = $1",
		id).Scan(&student.ID, &student.Name, &student.StudentID,
		&student.Major, &student.RoomNumber, &student.Building, &student.Status)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	// 写入缓存
	if s.cacheEnabled {
		cache.Set(cacheKey, student, cache.CacheExpirationMedium)
	}

	return &student, true
}

// GetStudentByUserID 根据用户ID获取学生（通过关联查询）
func (s *DBStore) GetStudentByUserID(userID string) (*models.Student, bool) {
	ctx := context.Background()

	// 从数据库查询 - 假设 students 表有 user_id 字段关联到 users 表
	// 如果没有 user_id 字段，则需要先查询 users 表获取 student_id
	var student models.Student
	err := database.DB.QueryRow(ctx, `
		SELECT s.id, s.name, s.student_id, s.major, s.room_number, s.status 
		FROM students s
		JOIN users u ON u.student_id = s.id
		WHERE u.id = $1`,
		userID).Scan(&student.ID, &student.Name, &student.StudentID,
		&student.Major, &student.RoomNumber, &student.Status)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	return &student, true
}

// CreateStudent 创建学生
func (s *DBStore) CreateStudent(req *models.CreateStudentRequest) *models.Student {
	ctx := context.Background()
	student := &models.Student{
		ID:         uuid.New().String(),
		Name:       req.Name,
		StudentID:  req.StudentID,
		Major:      req.Major,
		RoomNumber: "-",
		Status:     req.Status,
	}
	if student.Status == "" {
		student.Status = "Active"
	}

	// 插入数据库
	_, err := database.DB.Exec(ctx,
		"INSERT INTO students (id, name, student_id, major, room_number, building, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		student.ID, student.Name, student.StudentID, student.Major, student.RoomNumber, student.Building, student.Status)

	if err != nil {
		return nil
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyStudents)
		cache.Delete(cache.CacheKeyStudent + student.ID)
	}

	return student
}

// UpdateStudent 更新学生（修复版 - 添加房间容量验证）
func (s *DBStore) UpdateStudent(id string, req *models.UpdateStudentRequest) (*models.Student, bool) {
	ctx := context.Background()

	// 先获取现有数据
	student, exists := s.GetStudentByID(id)
	if !exists {
		return nil, false
	}

	// 如果涉及房间变更，需要验证
	if req.RoomNumber != "" && req.RoomNumber != student.RoomNumber {
		// 1. 检查目标房间是否存在（使用学生当前楼栋查找）
		building := student.Building
		targetRoom, roomExists := s.GetRoomByNumber(building, req.RoomNumber)
		if !roomExists {
			return nil, false // 房间不存在
		}

		// 2. 检查目标房间是否已满
		if targetRoom.Occupied >= targetRoom.Capacity {
			return nil, false // 房间已满
		}

		// 3. 更新原房间的人数（如果原来有房间且不是"-"）
		if student.RoomNumber != "-" && student.RoomNumber != "" {
			s.updateRoomOccupied(student.Building, student.RoomNumber, -1)
		}

		// 4. 更新目标房间的人数
		s.updateRoomOccupied(targetRoom.Building, req.RoomNumber, 1)

		// 5. 更新学生的房间信息
		student.RoomNumber = req.RoomNumber
		student.Building = targetRoom.Building
	}

	// 更新其他字段
	if req.Name != "" {
		student.Name = req.Name
	}
	if req.StudentID != "" {
		student.StudentID = req.StudentID
	}
	if req.Major != "" {
		student.Major = req.Major
	}
	if req.Status != "" {
		student.Status = req.Status
	}

	// 更新数据库
	_, err := database.DB.Exec(ctx,
		"UPDATE students SET name = $1, student_id = $2, major = $3, room_number = $4, building = $5, status = $6, updated_at = $7 WHERE id = $8",
		student.Name, student.StudentID, student.Major, student.RoomNumber, student.Building, student.Status, time.Now(), id)

	if err != nil {
		return nil, false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyStudents)
		cache.Delete(cache.CacheKeyStudent + id)
	}

	return student, true
}

// updateRoomOccupied 更新房间入住人数（辅助函数）
func (s *DBStore) updateRoomOccupied(building string, roomNumber string, delta int) {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx,
		"UPDATE rooms SET occupied = occupied + $1 WHERE building = $2 AND number = $3",
		delta, building, roomNumber)
	if err != nil {
		log.Printf("更新房间人数失败: %v", err)
	}
}

// DeleteStudent 删除学生
func (s *DBStore) DeleteStudent(id string) bool {
	ctx := context.Background()

	// 先获取学生信息，以便更新房间入住数
	student, exists := s.GetStudentByID(id)
	if !exists {
		return false
	}

	// 删除数据库记录
	_, err := database.DB.Exec(ctx, "DELETE FROM students WHERE id = $1", id)
	if err != nil {
		return false
	}

	// 更新原房间入住人数
	if student.RoomNumber != "-" && student.RoomNumber != "" {
		s.updateRoomOccupied(student.Building, student.RoomNumber, -1)
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyStudents)
		cache.Delete(cache.CacheKeyStudent + id)
		cache.Delete(cache.CacheKeyDashboard)
	}

	return true
}

// ========== Building Methods ==========

// GetAllBuildings 获取所有楼栋
func (s *DBStore) GetAllBuildings() ([]*models.Building, error) {
	ctx := context.Background()

	// 尝试从缓存获取
	if s.cacheEnabled {
		cached := []*models.Building{}
		if err := cache.Get(cache.CacheKeyBuildings, &cached); err == nil {
			return cached, nil
		}
	}

	// 从数据库查询
	rows, err := database.DB.Query(ctx,
		"SELECT id, name, type, floors, manager, description FROM buildings ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("查询楼栋失败: %w", err)
	}
	defer rows.Close()

	buildings := []*models.Building{}
	for rows.Next() {
		var building models.Building
		if err := rows.Scan(&building.ID, &building.Name, &building.Type,
			&building.Floors, &building.Manager, &building.Description); err != nil {
			return nil, fmt.Errorf("扫描楼栋记录失败: %w", err)
		}
		buildings = append(buildings, &building)
	}

	// 写入缓存
	if s.cacheEnabled && len(buildings) > 0 {
		cache.Set(cache.CacheKeyBuildings, buildings, cache.CacheExpirationLong)
	}

	return buildings, nil
}

// GetBuildingByID 根据ID获取楼栋
func (s *DBStore) GetBuildingByID(id string) (*models.Building, bool) {
	ctx := context.Background()
	cacheKey := cache.CacheKeyBuilding + id

	// 尝试从缓存获取
	if s.cacheEnabled {
		var cached models.Building
		if err := cache.Get(cacheKey, &cached); err == nil {
			return &cached, true
		}
	}

	// 从数据库查询
	var building models.Building
	err := database.DB.QueryRow(ctx,
		"SELECT id, name, type, floors, manager, description FROM buildings WHERE id = $1",
		id).Scan(&building.ID, &building.Name, &building.Type,
		&building.Floors, &building.Manager, &building.Description)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	// 写入缓存
	if s.cacheEnabled {
		cache.Set(cacheKey, building, cache.CacheExpirationLong)
	}

	return &building, true
}

// CreateBuilding 创建楼栋
func (s *DBStore) CreateBuilding(req *models.CreateBuildingRequest) *models.Building {
	ctx := context.Background()
	building := &models.Building{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Type:        req.Type,
		Floors:      req.Floors,
		Manager:     req.Manager,
		Description: req.Description,
	}

	// 插入数据库
	_, err := database.DB.Exec(ctx,
		"INSERT INTO buildings (id, name, type, floors, manager, description) VALUES ($1, $2, $3, $4, $5, $6)",
		building.ID, building.Name, building.Type, building.Floors, building.Manager, building.Description)

	if err != nil {
		return nil
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyBuildings)
		cache.Delete(cache.CacheKeyBuilding + building.ID)
	}

	return building
}

// UpdateBuilding 更新楼栋
func (s *DBStore) UpdateBuilding(id string, req *models.UpdateBuildingRequest) (*models.Building, bool) {
	ctx := context.Background()

	// 先获取现有数据
	building, exists := s.GetBuildingByID(id)
	if !exists {
		return nil, false
	}

	// 更新字段
	if req.Name != "" {
		building.Name = req.Name
	}
	if req.Type != "" {
		building.Type = req.Type
	}
	if req.Floors > 0 {
		building.Floors = req.Floors
	}
	if req.Manager != "" {
		building.Manager = req.Manager
	}
	if req.Description != "" {
		building.Description = req.Description
	}

	// 更新数据库
	_, err := database.DB.Exec(ctx,
		"UPDATE buildings SET name = $1, type = $2, floors = $3, manager = $4, description = $5, updated_at = $6 WHERE id = $7",
		building.Name, building.Type, building.Floors, building.Manager, building.Description, time.Now(), id)

	if err != nil {
		return nil, false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyBuildings)
		cache.Delete(cache.CacheKeyBuilding + id)
	}

	return building, true
}

// DeleteBuilding 删除楼栋
func (s *DBStore) DeleteBuilding(id string) bool {
	ctx := context.Background()

	// 删除数据库记录
	_, err := database.DB.Exec(ctx, "DELETE FROM buildings WHERE id = $1", id)
	if err != nil {
		return false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyBuildings)
		cache.Delete(cache.CacheKeyBuilding + id)
	}

	return true
}

// ========== Room Methods ==========

// GetAllRooms 获取所有房间
func (s *DBStore) GetAllRooms() ([]*models.Room, error) {
	ctx := context.Background()

	// 尝试从缓存获取
	if s.cacheEnabled {
		cached := []*models.Room{}
		if err := cache.Get(cache.CacheKeyRooms, &cached); err == nil {
			return cached, nil
		}
	}

	// 从数据库查询
	rows, err := database.DB.Query(ctx,
		"SELECT id, number, building, floor, capacity, occupied, type, status FROM rooms ORDER BY building, number")
	if err != nil {
		return nil, fmt.Errorf("查询房间失败: %w", err)
	}
	defer rows.Close()

	rooms := []*models.Room{}
	for rows.Next() {
		var room models.Room
		if err := rows.Scan(&room.ID, &room.Number, &room.Building, &room.Floor,
			&room.Capacity, &room.Occupied, &room.Type, &room.Status); err != nil {
			return nil, fmt.Errorf("扫描房间记录失败: %w", err)
		}
		rooms = append(rooms, &room)
	}

	// 写入缓存
	if s.cacheEnabled && len(rooms) > 0 {
		cache.Set(cache.CacheKeyRooms, rooms, cache.CacheExpirationShort)
	}

	return rooms, nil
}

// GetRoomByID 根据ID获取房间
func (s *DBStore) GetRoomByID(id string) (*models.Room, bool) {
	ctx := context.Background()
	cacheKey := cache.CacheKeyRoom + id

	// 尝试从缓存获取
	if s.cacheEnabled {
		var cached models.Room
		if err := cache.Get(cacheKey, &cached); err == nil {
			return &cached, true
		}
	}

	// 从数据库查询
	var room models.Room
	err := database.DB.QueryRow(ctx,
		"SELECT id, number, building, floor, capacity, occupied, type, status FROM rooms WHERE id = $1",
		id).Scan(&room.ID, &room.Number, &room.Building, &room.Floor,
		&room.Capacity, &room.Occupied, &room.Type, &room.Status)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	// 写入缓存
	if s.cacheEnabled {
		cache.Set(cacheKey, room, cache.CacheExpirationShort)
	}

	return &room, true
}

// CreateRoom 创建房间
func (s *DBStore) CreateRoom(req *models.CreateRoomRequest) *models.Room {
	ctx := context.Background()
	room := &models.Room{
		ID:       uuid.New().String(),
		Number:   req.Number,
		Building: req.Building,
		Capacity: req.Capacity,
		Occupied: req.Occupied,
		Type:     req.Type,
		Status:   req.Status,
	}

	// 插入数据库
	_, err := database.DB.Exec(ctx,
		"INSERT INTO rooms (id, number, building, capacity, occupied, type, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		room.ID, room.Number, room.Building, room.Capacity, room.Occupied, room.Type, room.Status)

	if err != nil {
		return nil
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRooms)
		cache.Delete(cache.CacheKeyRoom + room.ID)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return room
}

// UpdateRoom 更新房间
func (s *DBStore) UpdateRoom(id string, req *models.UpdateRoomRequest) (*models.Room, bool) {
	ctx := context.Background()

	// 先获取现有数据
	room, exists := s.GetRoomByID(id)
	if !exists {
		return nil, false
	}

	// 更新字段
	if req.Number != "" {
		room.Number = req.Number
	}
	if req.Building != "" {
		room.Building = req.Building
	}
	if req.Capacity > 0 {
		room.Capacity = req.Capacity
	}
	if req.Occupied >= 0 {
		room.Occupied = req.Occupied
	}
	if req.Type != "" {
		room.Type = req.Type
	}
	if req.Status != "" {
		room.Status = req.Status
	}

	// 更新数据库
	_, err := database.DB.Exec(ctx,
		"UPDATE rooms SET number = $1, building = $2, capacity = $3, occupied = $4, type = $5, status = $6, updated_at = $7 WHERE id = $8",
		room.Number, room.Building, room.Capacity, room.Occupied, room.Type, room.Status, time.Now(), id)

	if err != nil {
		return nil, false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRooms)
		cache.Delete(cache.CacheKeyRoom + id)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return room, true
}

// DeleteRoom 删除房间
func (s *DBStore) DeleteRoom(id string) bool {
	ctx := context.Background()

	// 删除数据库记录
	_, err := database.DB.Exec(ctx, "DELETE FROM rooms WHERE id = $1", id)
	if err != nil {
		return false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRooms)
		cache.Delete(cache.CacheKeyRoom + id)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return true
}

// ========== RepairRequest Methods ==========

// convertRepairStatus 将后端状态转换为前端期望的格式
func convertRepairStatus(status string) string {
	switch status {
	case "Pending":
		return "pending"
	case "In Progress":
		return "processing"
	case "Completed":
		return "completed"
	default:
		return "pending"
	}
}

// GetAllRepairRequests 获取所有报修请求
func (s *DBStore) GetAllRepairRequests() ([]*models.RepairRequest, error) {
	ctx := context.Background()

	// 尝试从缓存获取
	if s.cacheEnabled {
		cached := []*models.RepairRequest{}
		if err := cache.Get(cache.CacheKeyRepairs, &cached); err == nil {
			return cached, nil
		}
	}

	// 从数据库查询
	rows, err := database.DB.Query(ctx,
		"SELECT id, title, description, status, date, room_number, priority FROM repair_requests ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("查询报修失败: %w", err)
	}
	defer rows.Close()

	repairs := []*models.RepairRequest{}
	for rows.Next() {
		var repair models.RepairRequest
		var date time.Time
		if err := rows.Scan(&repair.ID, &repair.Title, &repair.Description,
			&repair.Status, &date, &repair.RoomNumber, &repair.Priority); err != nil {
			return nil, fmt.Errorf("扫描报修记录失败: %w", err)
		}
		repair.Date = date.Format("2006-01-02")
		repair.Status = convertRepairStatus(repair.Status) // 转换状态值
		repairs = append(repairs, &repair)
	}

	// 写入缓存
	if s.cacheEnabled && len(repairs) > 0 {
		cache.Set(cache.CacheKeyRepairs, repairs, cache.CacheExpirationShort)
	}

	return repairs, nil
}

// GetRepairRequestByID 根据ID获取报修请求
func (s *DBStore) GetRepairRequestByID(id string) (*models.RepairRequest, bool) {
	ctx := context.Background()
	cacheKey := cache.CacheKeyRepair + id

	// 尝试从缓存获取
	if s.cacheEnabled {
		var cached models.RepairRequest
		if err := cache.Get(cacheKey, &cached); err == nil {
			return &cached, true
		}
	}

	// 从数据库查询
	var repair models.RepairRequest
	var date time.Time
	err := database.DB.QueryRow(ctx,
		"SELECT id, title, description, status, date, room_number, priority FROM repair_requests WHERE id = $1",
		id).Scan(&repair.ID, &repair.Title, &repair.Description,
		&repair.Status, &date, &repair.RoomNumber, &repair.Priority)
	if err == nil {
		repair.Date = date.Format("2006-01-02")
		repair.Status = convertRepairStatus(repair.Status) // 转换状态值
	}

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	// 写入缓存
	if s.cacheEnabled {
		cache.Set(cacheKey, repair, cache.CacheExpirationShort)
	}

	return &repair, true
}

// CreateRepairRequest 创建报修请求
func (s *DBStore) CreateRepairRequest(req *models.CreateRepairRequest) *models.RepairRequest {
	ctx := context.Background()
	repair := &models.RepairRequest{
		ID:          uuid.New().String(),
		Title:       req.Title,
		Description: req.Description,
		Status:      "Pending",
		Date:        models.GetCurrentDate(),
		RoomNumber:  req.RoomNumber,
		Priority:    req.Priority,
	}
	if repair.Priority == "" {
		repair.Priority = "Medium"
	}

	// 插入数据库
	_, err := database.DB.Exec(ctx,
		"INSERT INTO repair_requests (id, title, description, status, date, room_number, priority) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		repair.ID, repair.Title, repair.Description, repair.Status, repair.Date, repair.RoomNumber, repair.Priority)

	if err != nil {
		return nil
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRepairs)
		cache.Delete(cache.CacheKeyRepair + repair.ID)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return repair
}

// UpdateRepairRequest 更新报修请求
func (s *DBStore) UpdateRepairRequest(id string, req *models.UpdateRepairRequest) (*models.RepairRequest, bool) {
	ctx := context.Background()

	// 先获取现有数据
	repair, exists := s.GetRepairRequestByID(id)
	if !exists {
		return nil, false
	}

	// 更新字段
	if req.Title != "" {
		repair.Title = req.Title
	}
	if req.Description != "" {
		repair.Description = req.Description
	}
	if req.Status != "" {
		repair.Status = req.Status
	}
	if req.Priority != "" {
		repair.Priority = req.Priority
	}

	// 更新数据库
	_, err := database.DB.Exec(ctx,
		"UPDATE repair_requests SET title = $1, description = $2, status = $3, priority = $4, updated_at = $5 WHERE id = $6",
		repair.Title, repair.Description, repair.Status, repair.Priority, time.Now(), id)

	if err != nil {
		return nil, false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRepairs)
		cache.Delete(cache.CacheKeyRepair + id)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return repair, true
}

// DeleteRepairRequest 删除报修请求
func (s *DBStore) DeleteRepairRequest(id string) bool {
	ctx := context.Background()

	// 删除数据库记录
	_, err := database.DB.Exec(ctx, "DELETE FROM repair_requests WHERE id = $1", id)
	if err != nil {
		return false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyRepairs)
		cache.Delete(cache.CacheKeyRepair + id)
		cache.Delete(cache.CacheKeyDashboard) // 清除仪表板缓存
	}

	return true
}

// ========== Notice Methods ==========

// GetAllNotices 获取所有公告
func (s *DBStore) GetAllNotices() ([]*models.Notice, error) {
	ctx := context.Background()

	// 尝试从缓存获取
	if s.cacheEnabled {
		cached := []*models.Notice{}
		if err := cache.Get(cache.CacheKeyNotices, &cached); err == nil {
			return cached, nil
		}
	}

	// 从数据库查询
	rows, err := database.DB.Query(ctx,
		"SELECT id, title, content, date, author FROM notices ORDER BY created_at DESC")
	if err != nil {
		return nil, fmt.Errorf("查询公告失败: %w", err)
	}
	defer rows.Close()

	notices := []*models.Notice{}
	for rows.Next() {
		var notice models.Notice
		var date time.Time
		if err := rows.Scan(&notice.ID, &notice.Title, &notice.Content,
			&date, &notice.Author); err != nil {
			return nil, fmt.Errorf("扫描公告记录失败: %w", err)
		}
		notice.Date = date.Format("2006-01-02")
		notices = append(notices, &notice)
	}

	// 写入缓存
	if s.cacheEnabled && len(notices) > 0 {
		cache.Set(cache.CacheKeyNotices, notices, cache.CacheExpirationMedium)
	}

	return notices, nil
}

// GetNoticeByID 根据ID获取公告
func (s *DBStore) GetNoticeByID(id string) (*models.Notice, bool) {
	ctx := context.Background()
	cacheKey := cache.CacheKeyNotice + id

	// 尝试从缓存获取
	if s.cacheEnabled {
		var cached models.Notice
		if err := cache.Get(cacheKey, &cached); err == nil {
			return &cached, true
		}
	}

	// 从数据库查询
	var notice models.Notice
	var date time.Time
	err := database.DB.QueryRow(ctx,
		"SELECT id, title, content, date, author FROM notices WHERE id = $1",
		id).Scan(&notice.ID, &notice.Title, &notice.Content,
		&date, &notice.Author)
	if err == nil {
		notice.Date = date.Format("2006-01-02")
	}

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	// 写入缓存
	if s.cacheEnabled {
		cache.Set(cacheKey, notice, cache.CacheExpirationMedium)
	}

	return &notice, true
}

// CreateNotice 创建公告
func (s *DBStore) CreateNotice(req *models.CreateNoticeRequest) *models.Notice {
	ctx := context.Background()
	notice := &models.Notice{
		ID:      uuid.New().String(),
		Title:   req.Title,
		Content: req.Content,
		Date:    models.GetCurrentDate(),
		Author:  req.Author,
	}

	// 插入数据库
	_, err := database.DB.Exec(ctx,
		"INSERT INTO notices (id, title, content, date, author) VALUES ($1, $2, $3, $4, $5)",
		notice.ID, notice.Title, notice.Content, notice.Date, notice.Author)

	if err != nil {
		return nil
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyNotices)
		cache.Delete(cache.CacheKeyNotice + notice.ID)
	}

	return notice
}

// UpdateNotice 更新公告
func (s *DBStore) UpdateNotice(id string, req *models.UpdateNoticeRequest) (*models.Notice, bool) {
	ctx := context.Background()

	// 先获取现有数据
	notice, exists := s.GetNoticeByID(id)
	if !exists {
		return nil, false
	}

	// 更新字段
	if req.Title != "" {
		notice.Title = req.Title
	}
	if req.Content != "" {
		notice.Content = req.Content
	}

	// 更新数据库
	_, err := database.DB.Exec(ctx,
		"UPDATE notices SET title = $1, content = $2, updated_at = $3 WHERE id = $4",
		notice.Title, notice.Content, time.Now(), id)

	if err != nil {
		return nil, false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyNotices)
		cache.Delete(cache.CacheKeyNotice + id)
	}

	return notice, true
}

// DeleteNotice 删除公告
func (s *DBStore) DeleteNotice(id string) bool {
	ctx := context.Background()

	// 删除数据库记录
	_, err := database.DB.Exec(ctx, "DELETE FROM notices WHERE id = $1", id)
	if err != nil {
		return false
	}

	// 清除相关缓存
	if s.cacheEnabled {
		cache.Delete(cache.CacheKeyNotices)
		cache.Delete(cache.CacheKeyNotice + id)
	}

	return true
}

// Inspection Implementation
func (s *DBStore) CreateInspection(req *models.CreateInspectionRequest, inspectorID string) (*models.Inspection, error) {
	ctx := context.Background()
	id := uuid.New().String()
	now := time.Now().Format("2006-01-02 15:04:05")
	currentDate := time.Now().Format("2006-01-02")

	status := "Good"
	if req.OverallScore >= 90 {
		status = "Excellent"
	} else if req.OverallScore < 60 {
		status = "Poor"
	} else if req.OverallScore < 80 {
		status = "Fair"
	}

	inspection := &models.Inspection{
		ID:           id,
		RoomNumber:   req.RoomNumber,
		Building:     req.Building,
		Inspector:    inspectorID,
		CheckDate:    currentDate,
		OverallScore: req.OverallScore,
		Status:       status,
		Comment:      req.Comment,
		Details:      req.Details,
		CreatedAt:    now,
	}

	query := `INSERT INTO inspections (id, room_number, building, inspector, check_date, overall_score, status, comment, created_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := database.DB.Exec(ctx, query,
		inspection.ID, inspection.RoomNumber, inspection.Building, inspection.Inspector,
		inspection.CheckDate, inspection.OverallScore, inspection.Status, inspection.Comment, inspection.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create inspection: %v", err)
	}

	return inspection, nil
}

// GetInspectionsByRoomNumber 根据房间号获取查寝记录
func (s *DBStore) GetInspectionsByRoomNumber(roomNumber string) []models.Inspection {
	ctx := context.Background()

	rows, err := database.DB.Query(ctx,
		`SELECT id, room_number, building, inspector, check_date, overall_score, status, comment, created_at 
		 FROM inspections 
		 WHERE room_number = $1 
		 ORDER BY check_date DESC`,
		roomNumber)
	if err != nil {
		return []models.Inspection{}
	}
	defer rows.Close()

	inspections := []models.Inspection{}
	for rows.Next() {
		var inspection models.Inspection
		var detailsJSON []byte
		err := rows.Scan(
			&inspection.ID, &inspection.RoomNumber, &inspection.Building, &inspection.Inspector,
			&inspection.CheckDate, &inspection.OverallScore, &inspection.Status, &inspection.Comment, &inspection.CreatedAt,
		)
		if err == nil {
			// Details 字段需要从 JSON 解析，这里简化处理
			_ = detailsJSON
			inspections = append(inspections, inspection)
		}
	}

	return inspections
}

// ========== Room Swap Methods ==========

// GetRoomSwapApplications 获取换寝申请
func (s *DBStore) GetRoomSwapApplications(userID string, role string) ([]*models.RoomSwapApplication, error) {
	ctx := context.Background()
	var rows pgx.Rows
	var err error

	if role == "student" {
		rows, err = database.DB.Query(ctx,
			"SELECT id, applicant_id, applicant_name, current_room, target_room, reason, urgency_level, status, current_step, apply_date, created_at, updated_at FROM room_swap_applications WHERE applicant_id = $1 ORDER BY created_at DESC",
			userID)
	} else {
		rows, err = database.DB.Query(ctx,
			"SELECT id, applicant_id, applicant_name, current_room, target_room, reason, urgency_level, status, current_step, apply_date, created_at, updated_at FROM room_swap_applications ORDER BY created_at DESC")
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applications := []*models.RoomSwapApplication{}
	for rows.Next() {
		var app models.RoomSwapApplication
		var applyDate time.Time
		var createdAt, updatedAt time.Time
		err := rows.Scan(
			&app.ID, &app.ApplicantID, &app.ApplicantName, &app.CurrentRoom, &app.TargetRoom,
			&app.Reason, &app.UrgencyLevel, &app.Status, &app.CurrentStep, &applyDate, &createdAt, &updatedAt)
		if err == nil {
			app.ApplyDate = applyDate.Format("2006-01-02")
			app.CreatedAt = createdAt.Format(time.RFC3339)
			app.UpdatedAt = updatedAt.Format(time.RFC3339)
			applications = append(applications, &app)
		}
	}

	return applications, nil
}

// GetPendingRoomSwapApplications 获取所有待处理的换寝申请
func (s *DBStore) GetPendingRoomSwapApplications() ([]*models.RoomSwapApplication, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx,
		"SELECT id, applicant_id, applicant_name, current_room, target_room, reason, urgency_level, status, current_step, apply_date, created_at, updated_at FROM room_swap_applications WHERE status NOT IN ('FinalApproved', 'Completed', 'Cancelled', 'CounselorRejected', 'CollegeRejected', 'FinalRejected') ORDER BY created_at DESC")

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applications := []*models.RoomSwapApplication{}
	for rows.Next() {
		var app models.RoomSwapApplication
		var applyDate time.Time
		var createdAt, updatedAt time.Time
		err := rows.Scan(
			&app.ID, &app.ApplicantID, &app.ApplicantName, &app.CurrentRoom, &app.TargetRoom,
			&app.Reason, &app.UrgencyLevel, &app.Status, &app.CurrentStep, &applyDate, &createdAt, &updatedAt)
		if err == nil {
			app.ApplyDate = applyDate.Format("2006-01-02")
			app.CreatedAt = createdAt.Format(time.RFC3339)
			app.UpdatedAt = updatedAt.Format(time.RFC3339)
			applications = append(applications, &app)
		}
	}

	return applications, nil
}

// CreateRoomSwapApplication 创建换寝申请
func (s *DBStore) CreateRoomSwapApplication(userID string, req *models.CreateRoomSwapRequest) (*models.RoomSwapApplication, error) {
	ctx := context.Background()

	// Get student info
	var studentName, currentRoom string
	err := database.DB.QueryRow(ctx, "SELECT name, room_number FROM students s JOIN user_students us ON s.id = us.student_id WHERE us.user_id = $1", userID).Scan(&studentName, &currentRoom)
	if err != nil {
		// Fallback
		database.DB.QueryRow(ctx, "SELECT real_name FROM users WHERE id = $1", userID).Scan(&studentName)
		if currentRoom == "" {
			currentRoom = "待分配"
		}
	}

	app := &models.RoomSwapApplication{
		ID:            uuid.New().String(),
		ApplicantID:   userID,
		ApplicantName: studentName,
		CurrentRoom:   currentRoom,
		TargetRoom:    req.TargetRoom,
		Reason:        req.Reason,
		UrgencyLevel:  req.UrgencyLevel,
		Status:        "Approving",
		CurrentStep:   "Counselor",
		ApplyDate:     time.Now().Format("2006-01-02"),
		CreatedAt:     time.Now().Format(time.RFC3339),
		UpdatedAt:     time.Now().Format(time.RFC3339),
	}

	_, err = database.DB.Exec(ctx,
		"INSERT INTO room_swap_applications (id, applicant_id, applicant_name, current_room, target_room, reason, urgency_level, status, current_step, apply_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
		app.ID, app.ApplicantID, app.ApplicantName, app.CurrentRoom, app.TargetRoom, app.Reason, app.UrgencyLevel, app.Status, app.CurrentStep, time.Now())

	if err != nil {
		return nil, err
	}

	return app, nil
}

// ApproveRoomSwapApplication 审批更换寝室申请
func (s *DBStore) ApproveRoomSwapApplication(id string, req *models.ApproveRoomSwapRequest) error {
	ctx := context.Background()

	var status, currentStep string
	err := database.DB.QueryRow(ctx, "SELECT status, current_step FROM room_swap_applications WHERE id = $1", id).Scan(&status, &currentStep)
	if err != nil {
		return err
	}

	nextStatus := status
	nextStep := currentStep

	if req.Status == "Rejected" {
		if currentStep == "Counselor" {
			nextStatus = "CounselorRejected"
		} else if currentStep == "College" {
			nextStatus = "CollegeRejected"
		} else {
			nextStatus = "FinalRejected"
		}
	} else {
		if currentStep == "Counselor" {
			nextStatus = "CounselorApproved"
			nextStep = "College"
		} else if currentStep == "College" {
			nextStatus = "CollegeApproved"
			nextStep = "ApartmentCenter"
		} else {
			nextStatus = "FinalApproved"
		}
	}

	_, err = database.DB.Exec(ctx,
		"UPDATE room_swap_applications SET status = $1, current_step = $2, updated_at = $3 WHERE id = $4",
		nextStatus, nextStep, time.Now(), id)

	return err
}

// GetAccessLogsPaginated 获取门禁记录分页
func (s *DBStore) GetAccessLogsPaginated(req *models.PaginatedRequest, filter *models.AccessLogFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()
	dataQB, countQB := utils.BuildAccessLogQuery(ctx, req, filter)

	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []*models.AccessLog{}
	for rows.Next() {
		var logItem models.AccessLog
		var ts time.Time
		var createdAt time.Time
		err := rows.Scan(
			&logItem.ID, &logItem.StudentID, &logItem.StudentName, &logItem.RoomNumber,
			&logItem.Direction, &logItem.GateName, &ts, &logItem.PhotoURL, &logItem.Status, &createdAt)
		if err == nil {
			logItem.Timestamp = ts.Format(time.RFC3339)
			logItem.CreatedAt = createdAt.Format(time.RFC3339)
			logs = append(logs, &logItem)
		}
	}

	var total int64
	countQuery, countArgs := countQB.BuildCountQuery()
	err = database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, err
	}

	resp := models.CalculatePagination(req.Page, req.PageSize, total)
	resp.Data = logs
	return &resp, nil
}

// GetLiveAccessLogs 获取实时门禁记录 (返回最近 50 条)
func (s *DBStore) GetLiveAccessLogs() ([]*models.AccessLog, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx, "SELECT id, student_id, student_name, room_number, direction, gate_name, timestamp, photo_url, status, created_at FROM access_logs ORDER BY timestamp DESC LIMIT 50")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []*models.AccessLog{}
	for rows.Next() {
		var logItem models.AccessLog
		var ts time.Time
		var createdAt time.Time
		err := rows.Scan(
			&logItem.ID, &logItem.StudentID, &logItem.StudentName, &logItem.RoomNumber,
			&logItem.Direction, &logItem.GateName, &ts, &logItem.PhotoURL, &logItem.Status, &createdAt)
		if err == nil {
			logItem.Timestamp = ts.Format(time.RFC3339)
			logItem.CreatedAt = createdAt.Format(time.RFC3339)
			logs = append(logs, &logItem)
		}
	}

	return logs, nil
}

// CreateAccessLog 创建门禁记录，并自动检测晚归
func (s *DBStore) CreateAccessLog(req *models.CreateAccessLogRequest) (*models.AccessLog, error) {
	ctx := context.Background()

	// 解析时间戳
	timestamp := time.Now()
	if req.Timestamp != "" {
		parsedTime, err := time.Parse(time.RFC3339, req.Timestamp)
		if err == nil {
			timestamp = parsedTime
		}
	}

	// 判断是否为晚归 (23:00-05:00进入视为晚归)
	isLateReturn := false
	if req.Direction == "In" && (timestamp.Hour() >= 23 || timestamp.Hour() < 5) {
		isLateReturn = true
	}

	status := "Normal"
	if isLateReturn {
		status = "Late"
	}

	// 创建门禁记录
	logID := uuid.New().String()
	_, err := database.DB.Exec(ctx,
		"INSERT INTO access_logs (id, student_id, student_name, room_number, direction, gate_name, timestamp, photo_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
		logID, req.StudentID, req.StudentName, req.RoomNumber, req.Direction, req.GateName, timestamp, req.PhotoURL, status)
	if err != nil {
		return nil, fmt.Errorf("failed to create access log: %v", err)
	}

	accessLog := &models.AccessLog{
		ID:          logID,
		StudentID:   req.StudentID,
		StudentName: req.StudentName,
		RoomNumber:  req.RoomNumber,
		Direction:   req.Direction,
		GateName:    req.GateName,
		Timestamp:   timestamp.Format(time.RFC3339),
		PhotoURL:    req.PhotoURL,
		Status:      status,
		CreatedAt:   time.Now().Format(time.RFC3339),
	}

	// 如果是晚归，自动创建晚归告警
	if isLateReturn {
		err := s.createLateReturnAlert(ctx, req.StudentID, req.StudentName, req.RoomNumber, timestamp)
		if err != nil {
			// 记录错误但不影响门禁记录创建
			fmt.Printf("Failed to create late return alert: %v\n", err)
		}
	}

	return accessLog, nil
}

// createLateReturnAlert 创建晚归告警
func (s *DBStore) createLateReturnAlert(ctx context.Context, studentID, studentName, roomNumber string, entryTime time.Time) error {
	alertID := uuid.New().String()
	alertDate := entryTime.Format("2006-01-02")
	now := time.Now()

	// 检查今天是否已存在该学生的晚归告警
	var existingCount int
	err := database.DB.QueryRow(ctx,
		"SELECT COUNT(*) FROM late_return_alerts WHERE student_id = $1 AND alert_date = $2",
		studentID, alertDate).Scan(&existingCount)
	if err != nil {
		return err
	}

	// 如果已存在，更新最后进入时间
	if existingCount > 0 {
		_, err = database.DB.Exec(ctx,
			"UPDATE late_return_alerts SET last_entry = $1, updated_at = $2 WHERE student_id = $3 AND alert_date = $4",
			entryTime, now, studentID, alertDate)
		return err
	}

	// 创建新的晚归告警
	_, err = database.DB.Exec(ctx,
		"INSERT INTO late_return_alerts (id, student_id, student_name, room_number, alert_date, last_entry, status, notify_sent, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
		alertID, studentID, studentName, roomNumber, alertDate, entryTime, "Pending", true, now, now)
	if err != nil {
		return err
	}

	// 发送通知给宿管员 (这里仅记录日志，实际项目中可接入短信/推送服务)
	fmt.Printf("[晚归预警] 学生: %s, 房间: %s, 进入时间: %s\n", studentName, roomNumber, entryTime.Format("15:04:05"))

	return nil
}

// GetLateReturnAlertsPaginated 获取晚归告警分页
func (s *DBStore) GetLateReturnAlertsPaginated(req *models.PaginatedRequest, filter *models.LateReturnFilter) (*models.PaginatedResponse, error) {
	ctx := context.Background()
	dataQB, countQB := utils.BuildLateReturnQuery(ctx, req, filter)

	query, args := dataQB.BuildQuery()
	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	alerts := []*models.LateReturnAlert{}
	for rows.Next() {
		var alert models.LateReturnAlert
		var alertDate time.Time
		var lastEntry, handleTime, createdAt, updatedAt *time.Time
		err := rows.Scan(
			&alert.ID, &alert.StudentID, &alert.StudentName, &alert.RoomNumber,
			&alertDate, &lastEntry, &alert.Status, &alert.Handler, &handleTime, &alert.Comment, &alert.NotifySent, &createdAt, &updatedAt)
		if err == nil {
			alert.AlertDate = alertDate.Format("2006-01-02")
			if lastEntry != nil {
				alert.LastEntry = lastEntry.Format(time.RFC3339)
			}
			if handleTime != nil {
				alert.HandleTime = handleTime.Format(time.RFC3339)
			}
			if createdAt != nil {
				alert.CreatedAt = createdAt.Format(time.RFC3339)
			}
			if updatedAt != nil {
				alert.UpdatedAt = updatedAt.Format(time.RFC3339)
			}
			alerts = append(alerts, &alert)
		}
	}

	var total int64
	countQuery, countArgs := countQB.BuildCountQuery()
	err = database.DB.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, err
	}

	resp := models.CalculatePagination(req.Page, req.PageSize, total)
	resp.Data = alerts
	return &resp, nil
}

// GetPendingLateReturns 获取所有处理中的晚归告警
func (s *DBStore) GetPendingLateReturns() ([]*models.LateReturnAlert, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx, "SELECT id, student_id, student_name, room_number, alert_date, last_entry, status, handler, handle_time, comment, notify_sent, created_at, updated_at FROM late_return_alerts WHERE status = 'Pending' ORDER BY alert_date DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	alerts := []*models.LateReturnAlert{}
	for rows.Next() {
		var alert models.LateReturnAlert
		var alertDate time.Time
		var lastEntry, handleTime, createdAt, updatedAt *time.Time
		err := rows.Scan(
			&alert.ID, &alert.StudentID, &alert.StudentName, &alert.RoomNumber,
			&alertDate, &lastEntry, &alert.Status, &alert.Handler, &handleTime, &alert.Comment, &alert.NotifySent, &createdAt, &updatedAt)
		if err == nil {
			alert.AlertDate = alertDate.Format("2006-01-02")
			if lastEntry != nil {
				alert.LastEntry = lastEntry.Format(time.RFC3339)
			}
			if handleTime != nil {
				alert.HandleTime = handleTime.Format(time.RFC3339)
			}
			if createdAt != nil {
				alert.CreatedAt = createdAt.Format(time.RFC3339)
			}
			if updatedAt != nil {
				alert.UpdatedAt = updatedAt.Format(time.RFC3339)
			}
			alerts = append(alerts, &alert)
		}
	}

	return alerts, nil
}

// HandleLateReturn 处理晚归告警
func (s *DBStore) HandleLateReturn(id string, req *models.HandleLateReturnRequest) (*models.LateReturnAlert, error) {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx, "UPDATE late_return_alerts SET status = $1, handler = $2, comment = $3, handle_time = $4, updated_at = $5 WHERE id = $6",
		req.Status, req.Handler, req.Comment, time.Now(), time.Now(), id)
	if err != nil {
		return nil, err
	}

	var alert models.LateReturnAlert
	var alertDate time.Time
	var lastEntry, handleTime, createdAt, updatedAt *time.Time
	err = database.DB.QueryRow(ctx, "SELECT id, student_id, student_name, room_number, alert_date, last_entry, status, handler, handle_time, comment, notify_sent, created_at, updated_at FROM late_return_alerts WHERE id = $1", id).Scan(
		&alert.ID, &alert.StudentID, &alert.StudentName, &alert.RoomNumber,
		&alertDate, &lastEntry, &alert.Status, &alert.Handler, &handleTime, &alert.Comment, &alert.NotifySent, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	alert.AlertDate = alertDate.Format("2006-01-02")
	if lastEntry != nil {
		alert.LastEntry = lastEntry.Format(time.RFC3339)
	}
	if handleTime != nil {
		alert.HandleTime = handleTime.Format(time.RFC3339)
	}
	if createdAt != nil {
		alert.CreatedAt = createdAt.Format(time.RFC3339)
	}
	if updatedAt != nil {
		alert.UpdatedAt = updatedAt.Format(time.RFC3339)
	}

	return &alert, nil
}

// ========== Additional Inspection Methods ==========

// GetInspectionByID 根据ID获取查寝记录
func (s *DBStore) GetInspectionByID(id string) (*models.Inspection, bool) {
	ctx := context.Background()
	var inspection models.Inspection
	var checkDate time.Time
	var createdAt time.Time

	err := database.DB.QueryRow(ctx,
		"SELECT id, room_number, building, inspector, check_date, overall_score, status, comment, created_at FROM inspections WHERE id = $1",
		id).Scan(&inspection.ID, &inspection.RoomNumber, &inspection.Building, &inspection.Inspector,
		&checkDate, &inspection.OverallScore, &inspection.Status, &inspection.Comment, &createdAt)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	inspection.CheckDate = checkDate.Format("2006-01-02")
	inspection.CreatedAt = createdAt.Format(time.RFC3339)
	return &inspection, true
}

// UpdateInspection 更新查寝记录
func (s *DBStore) UpdateInspection(id string, req *models.CreateInspectionRequest) (*models.Inspection, bool) {
	ctx := context.Background()

	// 检查记录是否存在
	_, exists := s.GetInspectionByID(id)
	if !exists {
		return nil, false
	}

	// 计算状态
	status := "Good"
	if req.OverallScore >= 90 {
		status = "Excellent"
	} else if req.OverallScore < 60 {
		status = "Poor"
	} else if req.OverallScore < 80 {
		status = "Fair"
	}

	_, err := database.DB.Exec(ctx,
		"UPDATE inspections SET room_number = $1, building = $2, overall_score = $3, status = $4, comment = $5, updated_at = $6 WHERE id = $7",
		req.RoomNumber, req.Building, req.OverallScore, status, req.Comment, time.Now(), id)

	if err != nil {
		return nil, false
	}

	return s.GetInspectionByID(id)
}

// DeleteInspection 删除查寝记录
func (s *DBStore) DeleteInspection(id string) bool {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx, "DELETE FROM inspections WHERE id = $1", id)
	return err == nil
}

// ========== Additional Room Swap Methods ==========

// GetRoomSwapApplicationsPaginated 分页获取换寝申请
func (s *DBStore) GetRoomSwapApplicationsPaginated(req *models.PaginatedRequest, filter *models.RoomSwapFilter) (*models.PaginatedResponse, error) {
	req.ValidateAndSetDefaults()

	applications, err := s.GetRoomSwapApplications("", "")
	if err != nil {
		return nil, err
	}

	total := int64(len(applications))

	// 应用分页
	start := (req.Page - 1) * req.PageSize
	end := start + req.PageSize
	if start > len(applications) {
		start = len(applications)
	}
	if end > len(applications) {
		end = len(applications)
	}
	paged := applications[start:end]

	resp := models.CalculatePagination(req.Page, req.PageSize, total)
	resp.Data = paged
	return &resp, nil
}

// GetMyRoomSwapApplications 获取当前用户的换寝申请
func (s *DBStore) GetMyRoomSwapApplications(userID string) ([]*models.RoomSwapApplication, error) {
	return s.GetRoomSwapApplications(userID, "student")
}

// GetRoomSwapApplicationByID 根据ID获取换寝申请
func (s *DBStore) GetRoomSwapApplicationByID(id string) (*models.RoomSwapApplication, bool) {
	ctx := context.Background()
	var app models.RoomSwapApplication
	var applyDate time.Time
	var createdAt, updatedAt time.Time

	err := database.DB.QueryRow(ctx,
		"SELECT id, applicant_id, applicant_name, current_room, target_room, reason, urgency_level, status, current_step, apply_date, created_at, updated_at FROM room_swap_applications WHERE id = $1",
		id).Scan(&app.ID, &app.ApplicantID, &app.ApplicantName, &app.CurrentRoom, &app.TargetRoom,
		&app.Reason, &app.UrgencyLevel, &app.Status, &app.CurrentStep, &applyDate, &createdAt, &updatedAt)

	if err == pgx.ErrNoRows {
		return nil, false
	}
	if err != nil {
		return nil, false
	}

	app.ApplyDate = applyDate.Format("2006-01-02")
	app.CreatedAt = createdAt.Format(time.RFC3339)
	app.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &app, true
}

// DeleteRoomSwapApplication 删除换寝申请（取消申请）
func (s *DBStore) DeleteRoomSwapApplication(id string) bool {
	ctx := context.Background()
	_, err := database.DB.Exec(ctx, "DELETE FROM room_swap_applications WHERE id = $1", id)
	return err == nil
}

// GetRoomSwapHistory 获取换寝历史记录
func (s *DBStore) GetRoomSwapHistory(userID string) ([]*models.RoomSwapHistory, error) {
	// 简化实现，返回申请的状态变更历史
	applications, err := s.GetRoomSwapApplications(userID, "")
	if err != nil {
		return nil, err
	}

	history := []*models.RoomSwapHistory{}
	for _, app := range applications {
		history = append(history, &models.RoomSwapHistory{
			ID:            uuid.New().String(),
			ApplicationID: app.ID,
			Action:        app.Status,
			ActorID:       app.ApplicantID,
			ActorName:     app.ApplicantName,
			Comment:       app.Reason,
			CreatedAt:     app.CreatedAt,
		})
	}

	return history, nil
}

// GetAvailableRooms 获取可换寝的空房间
func (s *DBStore) GetAvailableRooms() ([]*models.Room, error) {
	ctx := context.Background()
	rows, err := database.DB.Query(ctx,
		"SELECT id, number, building, capacity, occupied, type, status FROM rooms WHERE status = 'Available' OR (capacity > occupied AND status != 'Full') ORDER BY building, number")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rooms := []*models.Room{}
	for rows.Next() {
		var room models.Room
		if err := rows.Scan(&room.ID, &room.Number, &room.Building, &room.Capacity, &room.Occupied, &room.Type, &room.Status); err == nil {
			rooms = append(rooms, &room)
		}
	}

	return rooms, nil
}

// GetRoomByNumber 根据楼栋和房间号获取房间
func (s *DBStore) GetRoomByNumber(building string, number string) (*models.Room, bool) {
	ctx := context.Background()

	var room models.Room
	err := database.DB.QueryRow(ctx,
		"SELECT id, number, building, capacity, occupied, type, status FROM rooms WHERE building = $1 AND number = $2",
		building, number).Scan(&room.ID, &room.Number, &room.Building, &room.Capacity, &room.Occupied, &room.Type, &room.Status)

	if err != nil {
		return nil, false
	}

	return &room, true
}
