package handlers

import (
	"net/http"
	"strconv"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"

	"github.com/gin-gonic/gin"
)

type LateReturnHandler struct {
	store store.StoreInterface
}

func NewLateReturnHandler(s store.StoreInterface) *LateReturnHandler {
	return &LateReturnHandler{store: s}
}

// GetLateReturns 获取晚归告警 (分页)
func (h *LateReturnHandler) GetLateReturns(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	req := &models.PaginatedRequest{
		Page:      page,
		PageSize:  pageSize,
		Search:    c.Query("search"),
		SortBy:    c.DefaultQuery("sortBy", "alert_date"),
		SortOrder: c.DefaultQuery("sortOrder", "DESC"),
	}

	filter := &models.LateReturnFilter{
		Status:        c.Query("status"),
		StudentName:   c.Query("studentName"),
		RoomNumber:    c.Query("roomNumber"),
		AlertDateFrom: c.Query("alertDateFrom"),
		AlertDateTo:   c.Query("alertDateTo"),
	}

	resp, err := h.store.GetLateReturnAlertsPaginated(req, filter)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetPendingReturns 获取待处理晚归告警
func (h *LateReturnHandler) GetPendingReturns(c *gin.Context) {
	alerts, err := h.store.GetPendingLateReturns()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, alerts)
}

// HandleLateReturn 处理晚归告警
func (h *LateReturnHandler) HandleLateReturn(c *gin.Context) {
	id := c.Param("id")
	var req models.HandleLateReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	alert, err := h.store.HandleLateReturn(id, &req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "database_error", err.Error())
		return
	}

	c.JSON(http.StatusOK, alert)
}
