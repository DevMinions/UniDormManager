package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// RoomHandler 房间处理器
type RoomHandler struct {
	store store.StoreInterface
}

// NewRoomHandler 创建房间处理器
func NewRoomHandler(s store.StoreInterface) *RoomHandler {
	return &RoomHandler{store: s}
}

// GetRooms 获取房间（支持分页和搜索）
func (h *RoomHandler) GetRooms(c *gin.Context) {
	// 检查是否有分页参数，如果有则使用分页查询
	if c.Query("page") != "" || c.Query("pageSize") != "" {
		h.GetRoomsPaginated(c)
		return
	}

	// 没有分页参数，使用传统查询（保持兼容性）
	h.GetRoomsAll(c)
}

// GetRoomsPaginated 分页获取房间
func (h *RoomHandler) GetRoomsPaginated(c *gin.Context) {
	// 解析分页参数
	var req models.PaginatedRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "无效的分页参数",
			"details": err.Error(),
		})
		return
	}

	// 解析筛选参数
	var filter models.RoomFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		filter = models.RoomFilter{}
	}

	// 调用分页查询
	response, err := h.store.GetRoomsPaginated(&req, &filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "查询房间数据失败",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetRoomsAll 获取所有房间（传统方式，保持兼容性）
func (h *RoomHandler) GetRoomsAll(c *gin.Context) {
	rooms := h.store.GetAllRooms()
	// 确保返回的不是 nil，而是空数组
	if rooms == nil {
		rooms = []*models.Room{}
	}
	c.JSON(http.StatusOK, rooms)
}

// GetAllRooms 获取所有房间
func (h *RoomHandler) GetAllRooms(c *gin.Context) {

	rooms := h.store.GetAllRooms()
	// 确保返回的不是 nil，而是空数组
	if rooms == nil {
		rooms = []*models.Room{}
	}
	c.JSON(http.StatusOK, rooms)
}

// GetRoomByID 根据ID获取房间
func (h *RoomHandler) GetRoomByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Room ID is required")
		return
	}

	room, exists := h.store.GetRoomByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Room not found")
		return
	}

	c.JSON(http.StatusOK, room)
}

// CreateRoom 创建房间
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	var req models.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Number == "" || req.Building == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Number and Building are required")
		return
	}

	// 验证类型值
	if req.Type != "Male" && req.Type != "Female" && req.Type != "Co-ed" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid type value")
		return
	}

	// 验证状态值
	if req.Status != "Available" && req.Status != "Full" && req.Status != "Maintenance" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	// 验证容量
	if req.Capacity <= 0 {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Capacity must be greater than 0")
		return
	}

	// 验证入住人数不能超过容量
	if req.Occupied > req.Capacity {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Occupied cannot exceed capacity")
		return
	}

	room := h.store.CreateRoom(&req)
	c.JSON(http.StatusCreated, room)
}

// UpdateRoom 更新房间
func (h *RoomHandler) UpdateRoom(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Room ID is required")
		return
	}

	var req models.UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证类型值
	if req.Type != "" && req.Type != "Male" && req.Type != "Female" && req.Type != "Co-ed" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid type value")
		return
	}

	// 验证状态值
	if req.Status != "" && req.Status != "Available" && req.Status != "Full" && req.Status != "Maintenance" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	room, exists := h.store.UpdateRoom(id, &req)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Room not found")
		return
	}

	// 再次验证入住人数不能超过容量
	if req.Occupied > 0 && req.Occupied > room.Capacity {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Occupied cannot exceed capacity")
		return
	}

	c.JSON(http.StatusOK, room)
}

// DeleteRoom 删除房间
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Room ID is required")
		return
	}

	if !h.store.DeleteRoom(id) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Room not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}
