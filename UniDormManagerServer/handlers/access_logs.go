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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

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
