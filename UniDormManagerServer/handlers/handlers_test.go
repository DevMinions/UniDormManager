package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	
	"unidorm-manager-server/models"
)

// MockStore 是一个模拟的存储实现
type MockStore struct {
	mock.Mock
}

func (m *MockStore) GetAllStudents() []*models.Student {
	args := m.Called()
	return args.Get(0).([]*models.Student)
}

func (m *MockStore) GetStudentsPaginated(req *models.PaginatedRequest, filter *models.StudentFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetStudentByID(id string) (*models.Student, bool) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.Student), args.Bool(1)
}

func (m *MockStore) CreateStudent(req *models.CreateStudentRequest) *models.Student {
	args := m.Called(req)
	return args.Get(0).(*models.Student)
}

func (m *MockStore) UpdateStudent(id string, req *models.UpdateStudentRequest) (*models.Student, bool) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.Building), args.Bool(1)
}

func (m *MockStore) CreateBuilding(req *models.CreateBuildingRequest) *models.Building {
	args := m.Called(req)
	return args.Get(0).(*models.Building)
}

func (m *MockStore) UpdateBuilding(id string, req *models.UpdateBuildingRequest) (*models.Building, bool) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetRoomByID(id string) (*models.Room, bool) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.Room), args.Bool(1)
}

func (m *MockStore) CreateRoom(req *models.CreateRoomRequest) *models.Room {
	args := m.Called(req)
	return args.Get(0).(*models.Room)
}

func (m *MockStore) UpdateRoom(id string, req *models.UpdateRoomRequest) (*models.Room, bool) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetRepairRequestByID(id string) (*models.RepairRequest, bool) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.RepairRequest), args.Bool(1)
}

func (m *MockStore) CreateRepairRequest(req *models.CreateRepairRequest) *models.RepairRequest {
	args := m.Called(req)
	return args.Get(0).(*models.RepairRequest)
}

func (m *MockStore) UpdateRepairRequest(id string, req *models.UpdateRepairRequest) (*models.RepairRequest, bool) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
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
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.Notice), args.Bool(1)
}

func (m *MockStore) CreateNotice(req *models.CreateNoticeRequest) *models.Notice {
	args := m.Called(req)
	return args.Get(0).(*models.Notice)
}

func (m *MockStore) UpdateNotice(id string, req *models.UpdateNoticeRequest) (*models.Notice, bool) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Bool(1)
	}
	return args.Get(0).(*models.Notice), args.Bool(1)
}

func (m *MockStore) DeleteNotice(id string) bool {
	args := m.Called(id)
	return args.Bool(0)
}

func (m *MockStore) CreateInspection(req *models.CreateInspectionRequest, inspectorID string) (*models.Inspection, error) {
	args := m.Called(req, inspectorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Inspection), args.Error(1)
}

func (m *MockStore) GetInspectionsPaginated(req *models.PaginatedRequest, filter *models.InspectionFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetRoomSwapApplications(userID string, role string) ([]*models.RoomSwapApplication, error) {
	args := m.Called(userID, role)
	return args.Get(0).([]*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) GetPendingRoomSwapApplications() ([]*models.RoomSwapApplication, error) {
	args := m.Called()
	return args.Get(0).([]*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) CreateRoomSwapApplication(userID string, req *models.CreateRoomSwapRequest) (*models.RoomSwapApplication, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RoomSwapApplication), args.Error(1)
}

func (m *MockStore) ApproveRoomSwapApplication(id string, req *models.ApproveRoomSwapRequest) error {
	args := m.Called(id, req)
	return args.Error(0)
}

func (m *MockStore) GetAccessLogsPaginated(req *models.PaginatedRequest, filter *models.AccessLogFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetLiveAccessLogs() ([]*models.AccessLog, error) {
	args := m.Called()
	return args.Get(0).([]*models.AccessLog), args.Error(1)
}

func (m *MockStore) GetLateReturnAlertsPaginated(req *models.PaginatedRequest, filter *models.LateReturnFilter) (*models.PaginatedResponse, error) {
	args := m.Called(req, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PaginatedResponse), args.Error(1)
}

func (m *MockStore) GetPendingLateReturns() ([]*models.LateReturnAlert, error) {
	args := m.Called()
	return args.Get(0).([]*models.LateReturnAlert), args.Error(1)
}

func (m *MockStore) HandleLateReturn(id string, req *models.HandleLateReturnRequest) (*models.LateReturnAlert, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LateReturnAlert), args.Error(1)
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func makeRequest(t *testing.T, router *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
	var reqBody []byte
	if body != nil {
		var err error
		reqBody, err = json.Marshal(body)
		assert.NoError(t, err)
	}
	
	req := httptest.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}