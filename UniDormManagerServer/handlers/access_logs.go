package handlers

import (
	"net/http"
	"strconv"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"

	"github.com/gin-gonic/gin"
)

type AccessLogHandler struct {
	store store.StoreInterface
}

func NewAccessLogHandler(s store.StoreInterface) *AccessLogHandler {
	return &AccessLogHandler{store: s}
}

// GetAccessLogs 获取门禁记录 (分页)
func (h *AccessLogHandler) GetAccessLogs(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if err != nil || pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	req := &models.PaginatedRequest{
		Page:      page,
		PageSize:  pageSize,
		Search:    c.Query("search"),
		SortBy:    c.DefaultQuery("sortBy", "timestamp"),
		SortOrder: c.DefaultQuery("sortOrder", "DESC"),
	}

	filter := &models.AccessLogFilter{
		Direction:   c.Query("direction"),
		StudentName: c.Query("studentName"),
		RoomNumber:  c.Query("roomNumber"),
		GateName:    c.Query("gateName"),
		Status:      c.Query("status"),
		DateFrom:    c.Query("dateFrom"),
		DateTo:      c.Query("dateTo"),
	}

	resp, err := h.store.GetAccessLogsPaginated(req, filter)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetLiveLogs 获取实时门禁记录
func (h *AccessLogHandler) GetLiveLogs(c *gin.Context) {
	logs, err := h.store.GetLiveAccessLogs()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, logs)
}

// CreateAccessLog 创建门禁记录 (接收门禁系统推送)
func (h *AccessLogHandler) CreateAccessLog(c *gin.Context) {
	var req models.CreateAccessLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	accessLog, err := h.store.CreateAccessLog(&req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusCreated, accessLog)
}
