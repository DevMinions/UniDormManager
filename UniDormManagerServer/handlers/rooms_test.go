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

func TestRoomHandler_GetRoomsAll(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		mockRooms      []*models.Room
		expectedStatus int
		expectedCount  int
	}{
		{
			name: "获取所有房间成功",
			mockRooms: []*models.Room{
				{ID: "1", Number: "A101", Building: "A栋", Capacity: 4, Occupied: 2, Type: "Male", Status: "Available"},
				{ID: "2", Number: "A102", Building: "A栋", Capacity: 4, Occupied: 4, Type: "Male", Status: "Full"},
				{ID: "3", Number: "B101", Building: "B栋", Capacity: 4, Occupied: 0, Type: "Female", Status: "Available"},
			},
			expectedStatus: http.StatusOK,
			expectedCount:  3,
		},
		{
			name:           "获取空列表",
			mockRooms:      []*models.Room{},
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
		{
			name:           "获取nil列表",
			mockRooms:      nil,
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewRoomHandler(mockStore)
			
			mockStore.On("GetAllRooms").Return(tt.mockRooms)
			
			router := setupTestRouter()
			router.GET("/rooms", handler.GetRoomsAll)
			
			w := makeRequest(t, router, "GET", "/rooms", nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			var response []*models.Room
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Len(t, response, tt.expectedCount)
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestRoomHandler_GetRoomsPaginated(t *testing.T) {
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
				Data: []*models.Room{
					{ID: "1", Number: "A101", Building: "A栋", Capacity: 4, Occupied: 2},
				},
				Total:      1,
				Page:       1,
				PageSize:   10,
				TotalPages: 1,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:        "带楼栋筛选查询",
			queryParams: "?page=1&pageSize=10&building=A栋",
			mockResponse: &models.PaginatedResponse{
				Data: []*models.Room{
					{ID: "1", Number: "A101", Building: "A栋", Capacity: 4},
					{ID: "2", Number: "A102", Building: "A栋", Capacity: 4},
				},
				Total: 2,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
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
			handler := NewRoomHandler(mockStore)
			
			mockStore.On("GetRoomsPaginated", mock.Anything, mock.Anything).Return(tt.mockResponse, tt.mockError)
			
			router := setupTestRouter()
			router.GET("/rooms", handler.GetRoomsPaginated)
			
			w := makeRequest(t, router, "GET", "/rooms"+tt.queryParams, nil)
			
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

func TestRoomHandler_GetRoomByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		roomID         string
		mockRoom       *models.Room
		mockExists     bool
		expectedStatus int
	}{
		{
			name:           "获取房间成功",
			roomID:         "1",
			mockRoom:       &models.Room{ID: "1", Number: "A101", Building: "A栋", Capacity: 4, Occupied: 2, Type: "Male", Status: "Available"},
			mockExists:     true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "房间不存在",
			roomID:         "999",
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "房间ID为空",
			roomID:         "",
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusNotFound,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewRoomHandler(mockStore)
			
			if tt.roomID != "" {
				mockStore.On("GetRoomByID", tt.roomID).Return(tt.mockRoom, tt.mockExists)
			}
			
			router := setupTestRouter()
			router.GET("/rooms/:id", handler.GetRoomByID)
			
			path := "/rooms/" + tt.roomID
			if tt.roomID == "" {
				path = "/rooms/"
			}
			w := makeRequest(t, router, "GET", path, nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response models.Room
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockRoom.Number, response.Number)
			}
			
			if tt.roomID != "" {
				mockStore.AssertExpectations(t)
			}
		})
	}
}

func TestRoomHandler_CreateRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		requestBody    models.CreateRoomRequest
		mockRoom       *models.Room
		expectedStatus int
	}{
		{
			name: "创建房间成功",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Male",
				Status:   "Available",
			},
			mockRoom: &models.Room{
				ID:       "1",
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Male",
				Status:   "Available",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "房间号为空",
			requestBody: models.CreateRoomRequest{
				Number:   "",
				Building: "A栋",
				Capacity: 4,
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "楼栋为空",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "",
				Capacity: 4,
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "类型值无效",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Type:     "Invalid",
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "状态值无效",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Status:   "Invalid",
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "容量无效",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 0,
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "入住人数超过容量",
			requestBody: models.CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Occupied: 5,
			},
			mockRoom:       nil,
			expectedStatus: http.StatusBadRequest,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewRoomHandler(mockStore)
			
			if tt.mockRoom != nil {
				mockStore.On("CreateRoom", mock.Anything).Return(tt.mockRoom)
			}
			
			router := setupTestRouter()
			router.POST("/rooms", handler.CreateRoom)
			
			w := makeRequest(t, router, "POST", "/rooms", tt.requestBody)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusCreated {
				var response models.Room
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockRoom.Number, response.Number)
				assert.Equal(t, tt.mockRoom.Building, response.Building)
			}
			
			mockStore.AssertExpectations(t)
		})
	}
}

func TestRoomHandler_UpdateRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		roomID         string
		requestBody    models.UpdateRoomRequest
		mockRoom       *models.Room
		mockExists     bool
		expectedStatus int
	}{
		{
			name:   "更新房间成功",
			roomID: "1",
			requestBody: models.UpdateRoomRequest{
				Number:   "A101",
				Capacity: 6,
				Status:   "Available",
			},
			mockRoom: &models.Room{
				ID:       "1",
				Number:   "A101",
				Building: "A栋",
				Capacity: 6,
				Status:   "Available",
			},
			mockExists:     true,
			expectedStatus: http.StatusOK,
		},
		{
			name:      "房间不存在",
			roomID:    "999",
			requestBody: models.UpdateRoomRequest{Number: "A101"},
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:      "房间ID为空",
			roomID:    "",
			requestBody: models.UpdateRoomRequest{Number: "A101"},
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:   "类型值无效",
			roomID: "1",
			requestBody: models.UpdateRoomRequest{
				Type: "Invalid",
			},
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "状态值无效",
			roomID: "1",
			requestBody: models.UpdateRoomRequest{
				Status: "Invalid",
			},
			mockRoom:       nil,
			mockExists:     false,
			expectedStatus: http.StatusBadRequest,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewRoomHandler(mockStore)
			
			if tt.roomID != "" && (tt.requestBody.Type == "" || tt.requestBody.Type == "Male" || tt.requestBody.Type == "Female" || tt.requestBody.Type == "Co-ed") {
				if tt.requestBody.Status == "" || tt.requestBody.Status == "Available" || tt.requestBody.Status == "Full" || tt.requestBody.Status == "Maintenance" {
					mockStore.On("UpdateRoom", tt.roomID, mock.Anything).Return(tt.mockRoom, tt.mockExists)
				}
			}
			
			router := setupTestRouter()
			router.PUT("/rooms/:id", handler.UpdateRoom)
			
			path := "/rooms/" + tt.roomID
			if tt.roomID == "" {
				path = "/rooms/"
			}
			w := makeRequest(t, router, "PUT", path, tt.requestBody)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.expectedStatus == http.StatusOK {
				var response models.Room
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Equal(t, tt.mockRoom.Number, response.Number)
			}
			
			if tt.roomID != "" {
				mockStore.AssertExpectations(t)
			}
		})
	}
}

func TestRoomHandler_DeleteRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		roomID         string
		mockDeleted    bool
		expectedStatus int
	}{
		{
			name:           "删除房间成功",
			roomID:         "1",
			mockDeleted:    true,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "房间不存在",
			roomID:         "999",
			mockDeleted:    false,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "房间ID为空",
			roomID:         "",
			mockDeleted:    false,
			expectedStatus: http.StatusNotFound,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStore := new(MockStore)
			handler := NewRoomHandler(mockStore)
			
			if tt.roomID != "" {
				mockStore.On("DeleteRoom", tt.roomID).Return(tt.mockDeleted)
			}
			
			router := setupTestRouter()
			router.DELETE("/rooms/:id", handler.DeleteRoom)
			
			path := "/rooms/" + tt.roomID
			if tt.roomID == "" {
				path = "/rooms/"
			}
			w := makeRequest(t, router, "DELETE", path, nil)
			
			assert.Equal(t, tt.expectedStatus, w.Code)
			
			if tt.roomID != "" {
				mockStore.AssertExpectations(t)
			}
		})
	}
}