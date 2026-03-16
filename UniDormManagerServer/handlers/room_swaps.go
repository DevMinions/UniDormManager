package handlers

import (
	"net/http"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"

	"github.com/gin-gonic/gin"
)

type RoomSwapHandler struct {
	store store.StoreInterface
}

func NewRoomSwapHandler(s store.StoreInterface) *RoomSwapHandler {
	return &RoomSwapHandler{store: s}
}

// GetApplications 获取申请列表
func (h *RoomSwapHandler) GetApplications(c *gin.Context) {
	userID := c.GetString("userId")
	role := c.GetString("role")

	apps, err := h.store.GetRoomSwapApplications(userID, role)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, apps)
}

// GetPendingApplications 获取待处理申请列表
func (h *RoomSwapHandler) GetPendingApplications(c *gin.Context) {
	apps, err := h.store.GetPendingRoomSwapApplications()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, apps)
}

// ApplyRoomSwap 提交申请
func (h *RoomSwapHandler) ApplyRoomSwap(c *gin.Context) {
	userID := c.GetString("userId")
	var req models.CreateRoomSwapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	app, err := h.store.CreateRoomSwapApplication(userID, &req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusCreated, app)
}

// ApproveRoomSwap 审批申请
func (h *RoomSwapHandler) ApproveRoomSwap(c *gin.Context) {
	id := c.Param("id")
	var req models.ApproveRoomSwapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	err := h.store.ApproveRoomSwapApplication(id, &req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "审批成功"})
}

// GetMyApplications 获取当前用户的换寝申请
func (h *RoomSwapHandler) GetMyApplications(c *gin.Context) {
	userID := c.GetString("userId")
	apps, err := h.store.GetMyRoomSwapApplications(userID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}
	c.JSON(http.StatusOK, apps)
}

// CancelApplication 取消换寝申请
func (h *RoomSwapHandler) CancelApplication(c *gin.Context) {
	id := c.Param("id")
	if !h.store.DeleteRoomSwapApplication(id) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Application not found")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "申请已取消"})
}

// GetSwapHistory 获取换寝历史记录
func (h *RoomSwapHandler) GetSwapHistory(c *gin.Context) {
	userID := c.GetString("userId")
	history, err := h.store.GetRoomSwapHistory(userID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}
	c.JSON(http.StatusOK, history)
}

// GetAvailableRooms 获取可换寝的房间列表
func (h *RoomSwapHandler) GetAvailableRooms(c *gin.Context) {
	rooms, err := h.store.GetAvailableRooms()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}
	c.JSON(http.StatusOK, rooms)
}
