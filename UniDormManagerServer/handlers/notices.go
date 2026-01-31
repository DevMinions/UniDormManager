package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// NoticeHandler 公告处理器
type NoticeHandler struct {
	store store.StoreInterface
}

// NewNoticeHandler 创建公告处理器
func NewNoticeHandler(s store.StoreInterface) *NoticeHandler {
	return &NoticeHandler{store: s}
}

// GetAllNotices 获取所有公告
func (h *NoticeHandler) GetAllNotices(c *gin.Context) {
	notices := h.store.GetAllNotices()
	// 确保返回的不是 nil，而是空数组
	if notices == nil {
		notices = []*models.Notice{}
	}
	c.JSON(http.StatusOK, notices)
}

// GetNoticeByID 根据ID获取公告
func (h *NoticeHandler) GetNoticeByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Notice ID is required")
		return
	}

	notice, exists := h.store.GetNoticeByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Notice not found")
		return
	}

	c.JSON(http.StatusOK, notice)
}

// CreateNotice 创建公告
func (h *NoticeHandler) CreateNotice(c *gin.Context) {
	var req models.CreateNoticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Title == "" || req.Author == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Title and Author are required")
		return
	}

	notice := h.store.CreateNotice(&req)
	c.JSON(http.StatusCreated, notice)
}

// UpdateNotice 更新公告
func (h *NoticeHandler) UpdateNotice(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Notice ID is required")
		return
	}

	var req models.UpdateNoticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	notice, exists := h.store.UpdateNotice(id, &req)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Notice not found")
		return
	}

	c.JSON(http.StatusOK, notice)
}

// DeleteNotice 删除公告
func (h *NoticeHandler) DeleteNotice(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Notice ID is required")
		return
	}

	if !h.store.DeleteNotice(id) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Notice not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notice deleted successfully"})
}
