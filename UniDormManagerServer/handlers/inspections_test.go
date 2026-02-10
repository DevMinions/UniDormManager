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

func setupInspectionTest() (*gin.Engine, *MockStore) {
	gin.SetMode(gin.TestMode)
	mockStore := new(MockStore)
	handler := NewInspectionHandler(mockStore)

	r := gin.New()
	api := r.Group("/api")
	{
		inspections := api.Group("/inspections")
		{
			inspections.GET("", handler.GetInspections)
			inspections.POST("", handler.CreateInspection)
			inspections.GET("/rooms", handler.GetInspectionRooms)
			inspections.GET("/rankings", handler.GetInspectionRankings)
			inspections.GET("/:id", handler.GetInspectionByID)
			inspections.PUT("/:id", handler.UpdateInspection)
			inspections.DELETE("/:id", handler.DeleteInspection)
		}
	}

	return r, mockStore
}

func TestCreateInspection_Success(t *testing.T) {
	router, mockStore := setupInspectionTest()

	req := models.CreateInspectionRequest{
		RoomNumber:   "101",
		Building:     "A栋",
		OverallScore: 85,
		Comment:      "卫生良好",
		Details: []models.InspectionDetail{
			{Category: "卫生", Item: "地面", Score: 20, MaxScore: 20},
		},
	}

	expectedInspection := &models.Inspection{
		ID:           "inspection-001",
		RoomNumber:   req.RoomNumber,
		Building:     req.Building,
		OverallScore: req.OverallScore,
		Status:       "Good",
		Comment:      req.Comment,
		Details:      req.Details,
	}

	mockStore.On("CreateInspection", &req, mock.Anything).Return(expectedInspection, nil)

	jsonData, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	req_http, _ := http.NewRequest("POST", "/api/inspections", bytes.NewBuffer(jsonData))
	req_http.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req_http)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.Inspection
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedInspection.RoomNumber, response.RoomNumber)
	assert.Equal(t, expectedInspection.OverallScore, response.OverallScore)

	mockStore.AssertExpectations(t)
}

func TestGetInspectionByID_Success(t *testing.T) {
	router, mockStore := setupInspectionTest()

	expectedInspection := &models.Inspection{
		ID:           "inspection-001",
		RoomNumber:   "101",
		Building:     "A栋",
		OverallScore: 85,
		Status:       "Good",
	}

	mockStore.On("GetInspectionByID", "inspection-001").Return(expectedInspection, true)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/inspections/inspection-001", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.Inspection
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedInspection.ID, response.ID)

	mockStore.AssertExpectations(t)
}

func TestGetInspectionByID_NotFound(t *testing.T) {
	router, mockStore := setupInspectionTest()

	mockStore.On("GetInspectionByID", "nonexistent").Return((*models.Inspection)(nil), false)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/inspections/nonexistent", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	mockStore.AssertExpectations(t)
}

func TestUpdateInspection_Success(t *testing.T) {
	router, mockStore := setupInspectionTest()

	req := models.CreateInspectionRequest{
		RoomNumber:   "102",
		Building:     "B栋",
		OverallScore: 90,
		Comment:      "优秀",
	}

	expectedInspection := &models.Inspection{
		ID:           "inspection-001",
		RoomNumber:   req.RoomNumber,
		Building:     req.Building,
		OverallScore: req.OverallScore,
		Status:       "Excellent",
		Comment:      req.Comment,
	}

	mockStore.On("UpdateInspection", "inspection-001", &req).Return(expectedInspection, true)

	jsonData, _ := json.Marshal(req)
	w := httptest.NewRecorder()
	req_http, _ := http.NewRequest("PUT", "/api/inspections/inspection-001", bytes.NewBuffer(jsonData))
	req_http.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req_http)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.Inspection
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, expectedInspection.OverallScore, response.OverallScore)

	mockStore.AssertExpectations(t)
}

func TestDeleteInspection_Success(t *testing.T) {
	router, mockStore := setupInspectionTest()

	mockStore.On("DeleteInspection", "inspection-001").Return(true)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/inspections/inspection-001", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Inspection deleted successfully", response["message"])

	mockStore.AssertExpectations(t)
}

func TestGetInspectionRankings(t *testing.T) {
	router, mockStore := setupInspectionTest()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/inspections/rankings", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []models.InspectionRanking
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Empty(t, response)
}
