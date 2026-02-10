package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"unidorm-manager-server/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStore 模拟存储层
type MockStore struct {
	mock.Mock
}

func (m *MockStore) GetAllStudents() []*models.Student {
	args := m.Called()
	return args.Get(0).([]*models.Student)
}

func (m *MockStore) GetStudentsPaginated(req *models.PaginatedRequest, filter *models.StudentFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetStudentByID(id string) (*models.Student, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.Student), args.Bool(1)
}

func (m *MockStore) CreateStudent(req *models.CreateStudentRequest) *models.Student {
	args := m.Called(req)
	return args.Get(0).(*models.Student)
}

func (m *MockStore) UpdateStudent(id string, req *models.UpdateStudentRequest) (*models.Student, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.Student), args.Bool(1)
}

func (m *MockStore) DeleteStudent(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetAllBuildings() []*models.Building {
	args := m.Called()
	return args.Get(0).([]*models.Building)
}

func (m *MockStore) GetBuildingByID(id string) (*models.Building, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.Building), args.Bool(1)
}

func (m *MockStore) CreateBuilding(req *models.CreateBuildingRequest) *models.Building {
	args := m.Called(req)
	return args.Get(0).(*models.Building)
}

func (m *MockStore) UpdateBuilding(id string, req *models.UpdateBuildingRequest) (*models.Building, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.Building), args.Bool(1)
}

func (m *MockStore) DeleteBuilding(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetAllRooms() []*models.Room {
	args := m.Called()
	return args.Get(0).([]*models.Room)
}

func (m *MockStore) GetRoomsPaginated(req *models.PaginatedRequest, filter *models.RoomFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetRoomByID(id string) (*models.Room, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.Room), args.Bool(1)
}

func (m *MockStore) CreateRoom(req *models.CreateRoomRequest) *models.Room {
	args := m.Called(req)
	return args.Get(0).(*models.Room)
}

func (m *MockStore) UpdateRoom(id string, req *models.UpdateRoomRequest) (*models.Room, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.Room), args.Bool(1)
}

func (m *MockStore) DeleteRoom(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetAllRepairRequests() []*models.RepairRequest {
	args := m.Called()
	return args.Get(0).([]*models.RepairRequest)
}

func (m *MockStore) GetRepairRequestsPaginated(req *models.PaginatedRequest, filter *models.RepairFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetRepairRequestByID(id string) (*models.RepairRequest, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.RepairRequest), args.Bool(1)
}

func (m *MockStore) CreateRepairRequest(req *models.CreateRepairRequest) *models.RepairRequest {
	args := m.Called(req)
	return args.Get(0).(*models.RepairRequest)
}

func (m *MockStore) UpdateRepairRequest(id string, req *models.UpdateRepairRequest) (*models.RepairRequest, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.RepairRequest), args.Bool(1)
}

func (m *MockStore) DeleteRepairRequest(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetAllNotices() []*models.Notice {
	args := m.Called()
	return args.Get(0).([]*models.Notice)
}

func (m *MockStore) GetNoticeByID(id string) (*models.Notice, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.Notice), args.Bool(1)
}

func (m *MockStore) CreateNotice(req *models.CreateNoticeRequest) *models.Notice {
	args := m.Called(req)
	return args.Get(0).(*models.Notice)
}

func (m *MockStore) UpdateNotice(id string, req *models.UpdateNoticeRequest) (*models.Notice, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.Notice), args.Bool(1)
}

func (m *MockStore) DeleteNotice(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) CreateInspection(req *models.CreateInspectionRequest, inspectorID string) (*models.Inspection, error) {
	args := m.Called(req, inspectorID)
	return args.Get(0).(*models.Inspection), args.Error(1)
}

func (m *MockStore) GetInspectionsPaginated(req *models.PaginatedRequest, filter *models.InspectionFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetInspectionByID(id string) (*models.Inspection, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.Inspection), args.Bool(1)
}

func (m *MockStore) UpdateInspection(id string, req *models.CreateInspectionRequest) (*models.Inspection, bool) {
	args := m.Called(id, req)
	return args.Get(0).(*models.Inspection), args.Bool(1)
}

func (m *MockStore) DeleteInspection(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetRoomSwapApplications(userID string, role string) ([]*models.RoomSwapApplication, error) {
	args := m.Called(userID, role)
	return args.Get(0).([]*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) GetRoomSwapApplicationsPaginated(req *models.PaginatedRequest, filter *models.RoomSwapFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetMyRoomSwapApplications(userID string) ([]*models.RoomSwapApplication, error) {
	args := m.Called(userID)
	return args.Get(0).([]*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) GetPendingRoomSwapApplications() ([]*models.RoomSwapApplication, error) {
	args := m.Called()
	return args.Get(0).([]*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) GetRoomSwapApplicationByID(id string) (*models.RoomSwapApplication, bool) {
	args := m.Called(id)
	return args.Get(0).(*models.RoomSwapApplication), args.Bool(1)
}

func (m *MockStore) CreateRoomSwapApplication(userID string, req *models.CreateRoomSwapRequest) (*models.RoomSwapApplication, error) {
	args := m.Called(userID, req)
	return args.Get(0).(*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) ApproveRoomSwapApplication(id string, req *models.ApproveRoomSwapRequest) error {
	args := m.Called(id, req)
	return args.Error(0)
}

func (m *MockStore) DeleteRoomSwapApplication(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetRoomSwapHistory(userID string) ([]*models.RoomSwapHistory, error) {
	args := m.Called(userID)
	return args.Get(0).([]*models.RoomSwapHistory), args.Error(1)
}

func (m *MockStore) GetAvailableRooms() ([]*models.Room, error) {
	args := m.Called()
	return args.Get(0).([]*models.Room), args.Error(1)
}
}

func (m *MockStore) ApproveRoomSwapApplication(id string, req *models.ApproveRoomSwapRequest) error {
	args := m.Called(id, req)
	return args.Error(0)
}

func (m *MockStore) DeleteRoomSwapApplication(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) GetRoomSwapHistory(userID string) ([]*models.RoomSwapHistory, error) {
	args := m.Called(userID)
	return args.Get(0).([]*models.RoomSwapHistory), args.Error(1)
}

func (m *MockStore) GetAvailableRooms() ([]*models.Room, error) {
	args := m.Called()
	return args.Get(0).([]*models.Room), args.Error(1)
}

func (m *MockStore) GetAccessLogsPaginated(req *models.PaginatedRequest, filter *models.AccessLogFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetLiveAccessLogs() ([]*models.AccessLog, error) {
	args := m.Called()
	return args.Get(0).([]*models.AccessLog), args.Error(1)
}

func (m *MockStore) CreateAccessLog(req *models.CreateAccessLogRequest) (*models.AccessLog, error) {
	args := m.Called(req)
	return args.Get(0).(*models.AccessLog), args.Error(1)
}

func (m *MockStore) GetLateReturnAlertsPaginated(req *models.PaginatedRequest, filter *models.LateReturnFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetPendingLateReturns() ([]*models.LateReturnAlert, error) {
	args := m.Called()
	return args.Get(0).([]*models.LateReturnAlert), args.Error(1)
}

func (m *MockStore) HandleLateReturn(id string, req *models.HandleLateReturnRequest) (*models.LateReturnAlert, error) {
	args := m.Called(id, req)
	return args.Get(0).(*models.LateReturnAlert), args.Error(1)
}

func setupAccessLogTest() (*gin.Engine, *MockStore) {
	gin.SetMode(gin.TestMode)
	mockStore := new(MockStore)
	handler := NewAccessLogHandler(mockStore)

	r := gin.New()
	api := r.Group("/api")
	{
		accessLogs := api.Group("/access-logs")
		{
			accessLogs.GET("", handler.GetAccessLogs)
			accessLogs.GET("/live", handler.GetLiveLogs)
			accessLogs.POST("", handler.CreateAccessLog)
		}
	}

	return r, mockStore
}

func TestCreateAccessLog_NormalEntry(t *testing.T) {
	router, mockStore := setupAccessLogTest()

	req := models.CreateAccessLogRequest{
		StudentID:   "student-001",
		StudentName: "张三",
		RoomNumber:  "101",
		Direction:   "In",
		GateName:    "东门",
		Timestamp:   time.Now().Format(time.RFC3339),
	}

	expectedLog := &models.AccessLog{
		ID:          "log-001",
		StudentID:   req.StudentID,
		StudentName: req.StudentName,
		RoomNumber:  req.RoomNumber,
		Direction:   req.Direction,
		GateName:    req.GateName,
		Timestamp:   req.Timestamp,
		Status:      "Normal",
	}

	mockStore.On("CreateAccessLog", &req).Return(expectedLog, nil)

	jsonData, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/access-logs", bytes.NewBuffer(jsonData))
	c.Request.Header.Set("Content-Type", "application/json")

	handler := NewAccessLogHandler(mockStore)
	handler.CreateAccessLog(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response models.AccessLog
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedLog.StudentID, response.StudentID)
	assert.Equal(t, expectedLog.StudentName, response.StudentName)

	mockStore.AssertExpectations(t)
}

func TestCreateAccessLog_LateEntry(t *testing.T) {
	router, mockStore := setupAccessLogTest()

	// 模拟23:30的晚归记录
	lateTime := time.Now()
	lateTime = time.Date(lateTime.Year(), lateTime.Month(), lateTime.Day(), 23, 30, 0, 0, lateTime.Location())

	req := models.CreateAccessLogRequest{
		StudentID:   "student-001",
		StudentName: "张三",
		RoomNumber:  "101",
		Direction:   "In",
		GateName:    "东门",
		Timestamp:   lateTime.Format(time.RFC3339),
	}

	expectedLog := &models.AccessLog{
		ID:          "log-001",
		StudentID:   req.StudentID,
		StudentName: req.StudentName,
		RoomNumber:  req.RoomNumber,
		Direction:   req.Direction,
		GateName:    req.GateName,
		Timestamp:   req.Timestamp,
		Status:      "Late",
	}

	mockStore.On("CreateAccessLog", &req).Return(expectedLog, nil)

	jsonData, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/access-logs", bytes.NewBuffer(jsonData))
	c.Request.Header.Set("Content-Type", "application/json")

	handler := NewAccessLogHandler(mockStore)
	handler.CreateAccessLog(c)

	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response models.AccessLog
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Late", response.Status)

	mockStore.AssertExpectations(t)
}

func TestCreateAccessLog_InvalidRequest(t *testing.T) {
	router, mockStore := setupAccessLogTest()

	// 缺少必填字段的请求
	req := map[string]string{
		"studentName": "张三",
	}

	jsonData, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/access-logs", bytes.NewBuffer(jsonData))
	c.Request.Header.Set("Content-Type", "application/json")

	handler := NewAccessLogHandler(mockStore)
	handler.CreateAccessLog(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetAccessLogs(t *testing.T) {
	router, mockStore := setupAccessLogTest()

	expectedResp := &models.PaginatedResponse{
		Data: []*models.AccessLog{
			{
				ID:          "log-001",
				StudentID:   "student-001",
				StudentName: "张三",
				Direction:   "In",
				GateName:    "东门",
				Status:      "Normal",
			},
		},
		Total:    1,
		Page:     1,
		PageSize: 10,
	}

	mockStore.On("GetAccessLogsPaginated", mock.Anything, mock.Anything).Return(expectedResp, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/access-logs?page=1&pageSize=10", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.PaginatedResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(1), response.Total)

	mockStore.AssertExpectations(t)
}

func TestGetLiveLogs(t *testing.T) {
	router, mockStore := setupAccessLogTest()

	expectedLogs := []*models.AccessLog{
		{
			ID:          "log-001",
			StudentID:   "student-001",
			StudentName: "张三",
			Direction:   "In",
			GateName:    "东门",
			Status:      "Normal",
		},
	}

	mockStore.On("GetLiveAccessLogs").Return(expectedLogs, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/access-logs/live", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []*models.AccessLog
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, "张三", response[0].StudentName)

	mockStore.AssertExpectations(t)
}
