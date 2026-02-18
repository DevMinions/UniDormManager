package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	
	"unidorm-manager-server/models"
)

func TestStudentHandler_GetStudentsAll(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		mockStudents   []*models.Student
		expectedStatus int
		expectedCount  int
	}{
		{
			name: "获取所有学生成功",
			mockStudents: []*models.Student{
				{ID: "1", Name: "张三", StudentID: "2021001", Major: "计算机", RoomNumber: "A101", Status: "Active"},
				{ID: "2", Name: "李四", StudentID: "2021002", Major: "软件工程", RoomNumber: "A102", Status: "Active"},
			},
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:           "获取空列表",
			mockStudents:   []*models.Student{},
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
		{
			name:           "获取nil列表",
			mockStudents:   nil,
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			mockStore.On("GetAllStudents").Return(tt.mockStudents)
			
			router := setupTestRouter()
			router.GET("/students", handler.GetStudentsAll)
			
			w := makeRequest(t, router, "GET", "/students", nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			var response []*models.Student
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Len(t, response, tt.expectedCount)
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestStudentHandler_GetStudentsPaginated(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		queryParams    string
		mockResponse   *models.PaginatedResponse
		mockError      error
		expectedStatus int
	}{
		{
			name:        "分页查询成功",
			queryParams: "?page=1&pageSize=10",
			mockResponse: &models.PaginatedResponse{
				Data: []*models.Student{
					{ID: "1", Name: "张三", StudentID: "2021001", Major: "计算机"},
				},
				Total:      1,
				Page:       1,
				PageSize:   10,
				TotalPages: 1,
				HasNext:    false,
				HasPrev:    false,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "分页参数无效",
			queryParams:    "?page=invalid",
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "数据库查询失败",
			queryParams:    "?page=1&pageSize=10",
			mockResponse:   nil,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			if tt.mockResponse != nil || tt.mockError != nil {
				mockStore.On("GetStudentsPaginated", mock.Anything, mock.Anything).Return(tt.mockResponse, tt.mockError)
			}
			
			router := setupTestRouter()
			router.GET("/students", handler.GetStudentsPaginated)
			
			w := makeRequest(t, router, "GET", "/students"+tt.queryParams, nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK && tt.mockResponse != nil {
				var response models.PaginatedResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockResponse.Total, response.Total)
			}
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestStudentHandler_GetStudentByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		studentID      string
		mockStudent    *models.Student
		mockExists     bool
		expectedStatus int
	}{
		{
			name:           "获取学生成功",
			studentID:      "1",
			mockStudent:    &models.Student{ID: "1", Name: "张三", StudentID: "2021001", Major: "计算机"},
			mockExists:     true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "学生不存在",
			studentID:      "999",
			mockStudent:    nil,
			mockExists:     false,
			expectedStatus: http.StatusNotFound,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			mockStore.On("GetStudentByID", tt.studentID).Return(tt.mockStudent, tt.mockExists)
			
			router := setupTestRouter()
			router.GET("/students/:id", handler.GetStudentByID)
			
			w := makeRequest(t, router, "GET", "/students/"+tt.studentID, nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response models.Student
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockStudent.Name, response.Name)
			}
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestStudentHandler_CreateStudent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		requestBody    models.CreateStudentRequest
		mockStudent    *models.Student
		expectedStatus int
	}{
		{
			name: "创建学生成功",
			requestBody: models.CreateStudentRequest{
				Name:      "张三",
				StudentID: "2021001",
				Major:     "计算机",
				Status:    "Active",
			},
			mockStudent: &models.Student{
				ID:        "1",
				Name:      "张三",
				StudentID: "2021001",
				Major:     "计算机",
				Status:    "Active",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "请求体无效",
			requestBody:    models.CreateStudentRequest{},
			mockStudent:    nil,
			expectedStatus: http.StatusBadRequest,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			if tt.mockStudent != nil {
				mockStore.On("CreateStudent", mock.Anything).Return(tt.mockStudent)
			}
			
			router := setupTestRouter()
			router.POST("/students", handler.CreateStudent)
			
			w := makeRequest(t, router, "POST", "/students", tt.requestBody)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusCreated {
				var response models.Student
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockStudent.Name, response.Name)
			}
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestStudentHandler_UpdateStudent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		studentID      string
		requestBody    models.UpdateStudentRequest
		mockStudent    *models.Student
		mockUpdated    bool
		expectedStatus int
	}{
		{
			name:      "更新学生成功",
			studentID: "1",
			requestBody: models.UpdateStudentRequest{
				Name:   "张三 Updated",
				Major:  "软件工程",
				Status: "Active",
			},
			mockStudent: &models.Student{
				ID:        "1",
				Name:      "张三 Updated",
				StudentID: "2021001",
				Major:     "软件工程",
				Status:    "Active",
			},
			mockUpdated:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:      "学生不存在",
			studentID: "999",
			requestBody: models.UpdateStudentRequest{
				Name: "张三",
			},
			mockStudent:    nil,
			mockUpdated:    false,
			expectedStatus: http.StatusNotFound,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			mockStore.On("UpdateStudent", tt.studentID, mock.Anything).Return(tt.mockStudent, tt.mockUpdated)
			
			router := setupTestRouter()
			router.PUT("/students/:id", handler.UpdateStudent)
			
			w := makeRequest(t, router, "PUT", "/students/"+tt.studentID, tt.requestBody)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response models.Student
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockStudent.Name, response.Name)
			}
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestStudentHandler_DeleteStudent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		studentID      string
		mockDeleted    bool
		expectedStatus int
	}{
		{
			name:           "删除学生成功",
			studentID:      "1",
			mockDeleted:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "学生不存在",
			studentID:      "999",
			mockDeleted:    false,
			expectedStatus: http.StatusNotFound,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewStudentHandler(mockStore)
			
			mockStore.On("DeleteStudent", tt.studentID).Return(tt.mockDeleted)
			
			router := setupTestRouter()
			router.DELETE("/students/:id", handler.DeleteStudent)
			
			w := makeRequest(t, router, "DELETE", "/students/"+tt.studentID, nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			mockStore.AssertExpectations(t)
		})
	}
}