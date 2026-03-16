package store

import "unidorm-manager-server/models"

// StoreInterface 存储接口，定义数据库存储的通用方法
type StoreInterface interface {
	// Student methods
	GetAllStudents() []*models.Student
	GetStudentsPaginated(req *models.PaginatedRequest, filter *models.StudentFilter) (*models.PaginatedResponse, error)
	GetStudentByID(id string) (*models.Student, bool)
	GetStudentByUserID(userID string) (*models.Student, bool) // 根据用户ID获取学生
	CreateStudent(req *models.CreateStudentRequest) *models.Student
	UpdateStudent(id string, req *models.UpdateStudentRequest) (*models.Student, bool)
	DeleteStudent(id string) bool

	// Building methods
	GetAllBuildings() []*models.Building
	GetBuildingByID(id string) (*models.Building, bool)
	CreateBuilding(req *models.CreateBuildingRequest) *models.Building
	UpdateBuilding(id string, req *models.UpdateBuildingRequest) (*models.Building, bool)
	DeleteBuilding(id string) bool

	// Room methods
	GetAllRooms() []*models.Room
	GetRoomsPaginated(req *models.PaginatedRequest, filter *models.RoomFilter) (*models.PaginatedResponse, error)
	GetRoomByID(id string) (*models.Room, bool)
	CreateRoom(req *models.CreateRoomRequest) *models.Room
	UpdateRoom(id string, req *models.UpdateRoomRequest) (*models.Room, bool)
	DeleteRoom(id string) bool

	// RepairRequest methods
	GetAllRepairRequests() []*models.RepairRequest
	GetRepairRequestsPaginated(req *models.PaginatedRequest, filter *models.RepairFilter) (*models.PaginatedResponse, error)
	GetRepairRequestByID(id string) (*models.RepairRequest, bool)
	CreateRepairRequest(req *models.CreateRepairRequest) *models.RepairRequest
	UpdateRepairRequest(id string, req *models.UpdateRepairRequest) (*models.RepairRequest, bool)
	DeleteRepairRequest(id string) bool

	// Notice methods
	GetAllNotices() []*models.Notice
	GetNoticeByID(id string) (*models.Notice, bool)
	CreateNotice(req *models.CreateNoticeRequest) *models.Notice
	UpdateNotice(id string, req *models.UpdateNoticeRequest) (*models.Notice, bool)
	DeleteNotice(id string) bool

	// Inspection methods
	CreateInspection(req *models.CreateInspectionRequest, inspectorID string) (*models.Inspection, error)
	GetInspectionsPaginated(req *models.PaginatedRequest, filter *models.InspectionFilter) (*models.PaginatedResponse, error)
	GetInspectionsByRoomNumber(roomNumber string) []models.Inspection // 根据房间号获取查寝记录

	// Room Swap methods
	GetRoomSwapApplications(userID string, role string) ([]*models.RoomSwapApplication, error)
	GetPendingRoomSwapApplications() ([]*models.RoomSwapApplication, error)
	CreateRoomSwapApplication(userID string, req *models.CreateRoomSwapRequest) (*models.RoomSwapApplication, error)
	ApproveRoomSwapApplication(id string, req *models.ApproveRoomSwapRequest) error

	// Access Log methods
	GetAccessLogsPaginated(req *models.PaginatedRequest, filter *models.AccessLogFilter) (*models.PaginatedResponse, error)
	GetLiveAccessLogs() ([]*models.AccessLog, error)

	// Late Return methods
	GetLateReturnAlertsPaginated(req *models.PaginatedRequest, filter *models.LateReturnFilter) (*models.PaginatedResponse, error)
	GetPendingLateReturns() ([]*models.LateReturnAlert, error)
	HandleLateReturn(id string, req *models.HandleLateReturnRequest) (*models.LateReturnAlert, error)
}
