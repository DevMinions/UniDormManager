package models

import (
	"time"
)

// Student 学生模型
type Student struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	StudentID  string `json:"studentId"`
	Major      string `json:"major"`
	RoomNumber string `json:"roomNumber"`
	Status     string `json:"status"` // Active, Graduated, On Leave
}

// Building 楼栋模型
type Building struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Type        string `json:"type"` // Male, Female, Co-ed
	Floors      int    `json:"floors"`
	Manager     string `json:"manager"`
	Description string `json:"description"`
}

// Room 房间模型
type Room struct {
	ID       string `json:"id"`
	Number   string `json:"number"`
	Building string `json:"building"`
	Floor    int    `json:"floor"`
	Capacity int    `json:"capacity"`
	Occupied int    `json:"occupied"`
	Type     string `json:"type"`   // Male, Female, Co-ed
	Status   string `json:"status"` // Available, Full, Maintenance
}

// RepairRequest 报修请求模型
type RepairRequest struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"` // Pending, In Progress, Completed
	Date        string `json:"date"`
	RoomNumber  string `json:"roomNumber"`
	Priority    string `json:"priority"` // Low, Medium, High
}

// Notice 公告通知模型
type Notice struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Date    string `json:"date"`
	Author  string `json:"author"`
}

// ChatMessage 聊天消息模型
type ChatMessage struct {
	Role string `json:"role"` // user, model
	Text string `json:"text"`
}

// DashboardStats 仪表板统计数据
type DashboardStats struct {
	TotalStudents    int                   `json:"totalStudents"`
	OccupancyRate    float64               `json:"occupancyRate"`
	PendingRepairs   int                   `json:"pendingRepairs"`
	CompletedRepairs int                   `json:"completedRepairs"`
	OccupancyData    []BuildingOccupancy   `json:"occupancyData"`
	RequestStatus    []RepairRequestStatus `json:"requestStatus"`
}

// BuildingOccupancy 楼栋入住情况
type BuildingOccupancy struct {
	Name     string `json:"name"`
	Occupied int    `json:"occupied"`
	Capacity int    `json:"capacity"`
}

// RepairRequestStatus 报修状态统计
type RepairRequestStatus struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

// CreateStudentRequest 创建学生请求
type CreateStudentRequest struct {
	Name      string `json:"name"`
	StudentID string `json:"studentId"`
	Major     string `json:"major"`
	Status    string `json:"status"`
}

// UpdateStudentRequest 更新学生请求
type UpdateStudentRequest struct {
	Name       string `json:"name,omitempty"`
	StudentID  string `json:"studentId,omitempty"`
	Major      string `json:"major,omitempty"`
	RoomNumber string `json:"roomNumber,omitempty"`
	Status     string `json:"status,omitempty"`
}

// CreateBuildingRequest 创建楼栋请求
type CreateBuildingRequest struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Floors      int    `json:"floors"`
	Manager     string `json:"manager"`
	Description string `json:"description"`
}

// UpdateBuildingRequest 更新楼栋请求
type UpdateBuildingRequest struct {
	Name        string `json:"name,omitempty"`
	Type        string `json:"type,omitempty"`
	Floors      int    `json:"floors,omitempty"`
	Manager     string `json:"manager,omitempty"`
	Description string `json:"description,omitempty"`
}

// CreateRoomRequest 创建房间请求
type CreateRoomRequest struct {
	Number   string `json:"number"`
	Building string `json:"building"`
	Capacity int    `json:"capacity"`
	Occupied int    `json:"occupied"`
	Type     string `json:"type"`
	Status   string `json:"status"`
}

// UpdateRoomRequest 更新房间请求
type UpdateRoomRequest struct {
	Number   string `json:"number,omitempty"`
	Building string `json:"building,omitempty"`
	Capacity int    `json:"capacity,omitempty"`
	Occupied int    `json:"occupied,omitempty"`
	Type     string `json:"type,omitempty"`
	Status   string `json:"status,omitempty"`
}

// CreateRepairRequest 创建报修请求
type CreateRepairRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	RoomNumber  string `json:"roomNumber"`
	Priority    string `json:"priority"`
}

// UpdateRepairRequest 更新报修请求
type UpdateRepairRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
	Priority    string `json:"priority,omitempty"`
}

// CreateNoticeRequest 创建公告请求
type CreateNoticeRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Author  string `json:"author"`
}

// UpdateNoticeRequest 更新公告请求
type UpdateNoticeRequest struct {
	Title   string `json:"title,omitempty"`
	Content string `json:"content,omitempty"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse 成功响应
type SuccessResponse struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// 辅助函数：获取当前日期字符串
func GetCurrentDate() string {
	return time.Now().Format("2006-01-02")
}

// Inspection 查寝记录
type Inspection struct {
	ID           string             `json:"id"`
	RoomNumber   string             `json:"roomNumber"`
	Building     string             `json:"building"`
	Inspector    string             `json:"inspector"`
	CheckDate    string             `json:"checkDate"`
	OverallScore int                `json:"overallScore"`
	Status       string             `json:"status"` // Excellent, Good, Fair, Poor
	Comment      string             `json:"comment"`
	Details      []InspectionDetail `json:"details"`
	CreatedAt    string             `json:"createdAt"`
}

// InspectionDetail 查寝详情
type InspectionDetail struct {
	Category string `json:"category"`
	Item     string `json:"item"`
	Score    int    `json:"score"`
	MaxScore int    `json:"maxScore"`
	Comment  string `json:"comment"`
	PhotoURL string `json:"photoUrl,omitempty"`
}

// CreateInspectionRequest 创建查寝请求
type CreateInspectionRequest struct {
	RoomNumber   string             `json:"roomNumber" binding:"required"`
	Building     string             `json:"building" binding:"required"`
	OverallScore int                `json:"overallScore" binding:"required"`
	Comment      string             `json:"comment"`
	Details      []InspectionDetail `json:"details"`
}

// InspectionRanking 查寝排行榜
type InspectionRanking struct {
	ID         string  `json:"id"`
	RoomNumber string  `json:"roomNumber"`
	Building   string  `json:"building"`
	WeekScore  float64 `json:"weekScore"`
	MonthScore float64 `json:"monthScore"`
	Rank       int     `json:"rank"`
}

// RoomSwapApplication 换寝申请
type RoomSwapApplication struct {
	ID            string `json:"id"`
	ApplicantID   string `json:"applicantId"`
	ApplicantName string `json:"applicantName"`
	CurrentRoom   string `json:"currentRoom"`
	TargetRoom    string `json:"targetRoom"`
	Reason        string `json:"reason"`
	UrgencyLevel  string `json:"urgencyLevel"` // Normal, Urgent, VeryUrgent
	Status        string `json:"status"`       // Pending, CounselorApproved, CounselorRejected, etc.
	CurrentStep   string `json:"currentStep"`  // Counselor, College, ApartmentCenter
	ApplyDate     string `json:"applyDate"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
}

// CreateRoomSwapRequest 创建换寝申请请求
type CreateRoomSwapRequest struct {
	TargetRoom   string `json:"targetRoom" binding:"required"`
	Reason       string `json:"reason" binding:"required"`
	UrgencyLevel string `json:"urgencyLevel" binding:"required"`
}

// ApproveRoomSwapRequest 换寝审批请求
type ApproveRoomSwapRequest struct {
	ApproverID   string `json:"approverId"`
	ApproverRole string `json:"approverRole"`
	Status       string `json:"status" binding:"oneof=Approved Rejected"`
	Comment      string `json:"comment"`
}

// AccessLog 门禁记录
type AccessLog struct {
	ID          string `json:"id"`
	StudentID   string `json:"studentId"`
	StudentName string `json:"studentName"`
	RoomNumber  string `json:"roomNumber"`
	Direction   string `json:"direction"` // In, Out
	GateName    string `json:"gateName"`
	Timestamp   string `json:"timestamp"`
	PhotoURL    string `json:"photoUrl,omitempty"`
	Status      string `json:"status"` // Normal, Late, Absent
	CreatedAt   string `json:"createdAt"`
}

// AccessLogFilter 门禁记录筛选
type AccessLogFilter struct {
	Direction   string `json:"direction"`
	StudentName string `json:"studentName"`
	RoomNumber  string `json:"roomNumber"`
	GateName    string `json:"gateName"`
	Status      string `json:"status"`
	DateFrom    string `json:"dateFrom"`
	DateTo      string `json:"dateTo"`
}

// LateReturnAlert 晚归告警
type LateReturnAlert struct {
	ID          string `json:"id"`
	StudentID   string `json:"studentId"`
	StudentName string `json:"studentName"`
	RoomNumber  string `json:"roomNumber"`
	AlertDate   string `json:"alertDate"`
	LastEntry   string `json:"lastEntry,omitempty"`
	Status      string `json:"status"` // Pending, Handled, Ignored
	Handler     string `json:"handler,omitempty"`
	HandleTime  string `json:"handleTime,omitempty"`
	Comment     string `json:"comment,omitempty"`
	NotifySent  bool   `json:"notifySent"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// LateReturnFilter 晚归告警筛选
type LateReturnFilter struct {
	Status        string `json:"status"`
	StudentName   string `json:"studentName"`
	RoomNumber    string `json:"roomNumber"`
	AlertDateFrom string `json:"alertDateFrom"`
	AlertDateTo   string `json:"alertDateTo"`
}

// HandleLateReturnRequest 处理晚归告警请求
type HandleLateReturnRequest struct {
	Handler string `json:"handler"`
	Comment string `json:"comment"`
	Status  string `json:"status"` // Handled, Ignored
}
