package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"unidorm-manager-server/auth"
	"unidorm-manager-server/models"
)

// authMiddlewareFor injects a fixed userID into the gin context, simulating auth middleware.
func authMiddlewareFor(userID string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth.SetUserID(c, userID)
		c.Next()
	}
}

func setupRoomSwapTest() (*gin.Engine, *MockStore) {
	return setupRoomSwapTestWithUser("test-user")
}

func setupRoomSwapTestWithUser(userID string) (*gin.Engine, *MockStore) {
	gin.SetMode(gin.TestMode)
	mockStore := new(MockStore)
	handler := NewRoomSwapHandler(mockStore)

	r := gin.New()
	r.Use(authMiddlewareFor(userID))
	api := r.Group("/api")
	{
		roomSwaps := api.Group("/room-swaps")
		{
			roomSwaps.GET("", handler.GetApplications)
			roomSwaps.GET("/my-applications", handler.GetMyApplications)
			roomSwaps.GET("/pending", handler.GetPendingApplications)
			roomSwaps.GET("/history", handler.GetSwapHistory)
			roomSwaps.GET("/available", handler.GetAvailableRooms)
			roomSwaps.POST("", handler.ApplyRoomSwap)
			roomSwaps.POST("/:id/approve", handler.ApproveRoomSwap)
			roomSwaps.DELETE("/:id", handler.CancelApplication)
		}
	}

	return r, mockStore
}

func TestGetMyApplications(t *testing.T) {
	router, mockStore := setupRoomSwapTest()

	expectedApps := []*models.RoomSwapApplication{
		{
			ID:            "app-001",
			ApplicantID:   "user-001",
			ApplicantName: "张三",
			CurrentRoom:   "101",
			TargetRoom:    "201",
			Status:        "Pending",
		},
	}

	mockStore.On("GetMyRoomSwapApplications", mock.Anything).Return(expectedApps, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/room-swaps/my-applications", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []*models.RoomSwapApplication
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, expectedApps[0].ApplicantName, response[0].ApplicantName)

	mockStore.AssertExpectations(t)
}

// TestCancelApplication_Success verifies that the handler passes the caller's UserID as applicantID.
func TestCancelApplication_Success(t *testing.T) {
	const callerID = "userA"
	router, mockStore := setupRoomSwapTestWithUser(callerID)

	// Mock expects both id AND callerID — proves ownership check is wired correctly.
	mockStore.On("DeleteRoomSwapApplication", "app-001", callerID).Return(true)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/room-swaps/app-001", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "申请已取消", response["message"])

	mockStore.AssertExpectations(t)
}

// TestCancelApplication_NotFound verifies 404 when store returns false (applicantID mismatch or id absent).
func TestCancelApplication_NotFound(t *testing.T) {
	const callerID = "userB"
	router, mockStore := setupRoomSwapTestWithUser(callerID)

	mockStore.On("DeleteRoomSwapApplication", "nonexistent", callerID).Return(false)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/room-swaps/nonexistent", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	mockStore.AssertExpectations(t)
}

// TestCancelApplication_WrongOwner verifies 404 when mock simulates applicantID mismatch.
func TestCancelApplication_WrongOwner(t *testing.T) {
	const callerID = "userC" // not the owner of app-001
	router, mockStore := setupRoomSwapTestWithUser(callerID)

	// Store returns false because applicant_id doesn't match
	mockStore.On("DeleteRoomSwapApplication", "app-001", callerID).Return(false)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/room-swaps/app-001", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	mockStore.AssertExpectations(t)
}

func TestGetSwapHistory(t *testing.T) {
	router, mockStore := setupRoomSwapTest()

	expectedHistory := []*models.RoomSwapHistory{
		{
			ID:            "history-001",
			ApplicationID: "app-001",
			Action:        "Pending",
			ActorName:     "张三",
		},
	}

	mockStore.On("GetRoomSwapHistory", mock.Anything).Return(expectedHistory, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/room-swaps/history", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []*models.RoomSwapHistory
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, expectedHistory[0].Action, response[0].Action)

	mockStore.AssertExpectations(t)
}

func TestGetAvailableRooms(t *testing.T) {
	router, mockStore := setupRoomSwapTest()

	expectedRooms := []*models.Room{
		{
			ID:       "room-001",
			Number:   "301",
			Building: "A栋",
			Capacity: 4,
			Occupied: 2,
			Status:   "Available",
		},
	}

	mockStore.On("GetAvailableRooms").Return(expectedRooms, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/room-swaps/available", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response []*models.Room
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Len(t, response, 1)
	assert.Equal(t, expectedRooms[0].Number, response[0].Number)

	mockStore.AssertExpectations(t)
}
