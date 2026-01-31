package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// RepairHandler 报修处理器
type RepairHandler struct {
	store store.StoreInterface
}

// NewRepairHandler 创建报修处理器
func NewRepairHandler(s store.StoreInterface) *RepairHandler {
	return &RepairHandler{store: s}
}

// GetRepairRequests 获取维修申请（支持分页和搜索）
func (h *RepairHandler) GetRepairRequests(c *gin.Context) {
	// 检查是否有分页参数，如果有则使用分页查询
	if c.Query("page") != "" || c.Query("pageSize") != "" {
		h.GetRepairRequestsPaginated(c)
		return
	}

	// 没有分页参数，使用传统查询（保持兼容性）
	h.GetRepairRequestsAll(c)
}

// GetRepairRequestsPaginated 分页获取维修申请
func (h *RepairHandler) GetRepairRequestsPaginated(c *gin.Context) {
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
	var filter models.RepairFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		filter = models.RepairFilter{}
	}

	// 调用分页查询
	response, err := h.store.GetRepairRequestsPaginated(&req, &filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "查询维修申请数据失败",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetRepairRequestsAll 获取所有维修申请（传统方式，保持兼容性）
func (h *RepairHandler) GetRepairRequestsAll(c *gin.Context) {
	requests := h.store.GetAllRepairRequests()
	// 确保返回的不是 nil，而是空数组
	if requests == nil {
		requests = []*models.RepairRequest{}
	}
	c.JSON(http.StatusOK, requests)
}

// GetAllRepairRequests 获取所有报修请求
func (h *RepairHandler) GetAllRepairRequests(c *gin.Context) {

	requests := h.store.GetAllRepairRequests()
	// 确保返回的不是 nil，而是空数组
	if requests == nil {
		requests = []*models.RepairRequest{}
	}
	c.JSON(http.StatusOK, requests)
}

// GetRepairRequestByID 根据ID获取报修请求
func (h *RepairHandler) GetRepairRequestByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Repair request ID is required")
		return
	}

	req, exists := h.store.GetRepairRequestByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Repair request not found")
		return
	}

	c.JSON(http.StatusOK, req)
}

// CreateRepairRequest 创建报修请求
func (h *RepairHandler) CreateRepairRequest(c *gin.Context) {
	var req models.CreateRepairRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Title == "" || req.RoomNumber == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Title and RoomNumber are required")
		return
	}

	// 验证优先级值
	if req.Priority != "" && req.Priority != "Low" && req.Priority != "Medium" && req.Priority != "High" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid priority value")
		return
	}

	repair := h.store.CreateRepairRequest(&req)
	c.JSON(http.StatusCreated, repair)
}

// UpdateRepairRequest 更新报修请求
func (h *RepairHandler) UpdateRepairRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Repair request ID is required")
		return
	}

	var req models.UpdateRepairRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证状态值
	if req.Status != "" && req.Status != "Pending" && req.Status != "In Progress" && req.Status != "Completed" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	// 验证优先级值
	if req.Priority != "" && req.Priority != "Low" && req.Priority != "Medium" && req.Priority != "High" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid priority value")
		return
	}

	repair, exists := h.store.UpdateRepairRequest(id, &req)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Repair request not found")
		return
	}

	c.JSON(http.StatusOK, repair)
}

// DeleteRepairRequest 删除报修请求
func (h *RepairHandler) DeleteRepairRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Repair request ID is required")
		return
	}

	if !h.store.DeleteRepairRequest(id) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Repair request not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Repair request deleted successfully"})
}
