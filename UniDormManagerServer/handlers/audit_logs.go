package handlers

import (
	"context"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/audit"
	"unidorm-manager-server/database"
	"unidorm-manager-server/middleware"
)

// AuditLogsHandler 暴露审计日志查询(GET /api/audit-logs)
type AuditLogsHandler struct{}

func NewAuditLogsHandler() *AuditLogsHandler { return &AuditLogsHandler{} }

type auditLogRow struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Username  string `json:"username"`
	Method    string `json:"method"`
	Path      string `json:"path"`
	Status    int    `json:"status"`
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
}

// GetAuditLogs GET /api/audit-logs?page=1&pageSize=50&userId=...
//
// 返回最近的审计日志(按 created_at DESC)。支持按 userId 过滤,分页 1..200。
func (h *AuditLogsHandler) GetAuditLogs(c *gin.Context) {
	page, pageSize := 1, 50
	if q := c.Query("page"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n >= 1 {
			page = n
		}
	}
	if q := c.Query("pageSize"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n >= 1 && n <= 200 {
			pageSize = n
		}
	}
	userIDFilter := c.Query("userId")

	ctx := context.Background()

	// 总数
	var total int64
	var err error
	if userIDFilter != "" {
		err = database.DB.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs WHERE user_id = $1", userIDFilter).Scan(&total)
	} else {
		err = database.DB.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs").Scan(&total)
	}
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询审计日志总数失败")
		return
	}

	// 列表
	offset := (page - 1) * pageSize
	var rows interface {
		Next() bool
		Scan(...any) error
		Close()
	}
	if userIDFilter != "" {
		r, e := database.DB.Query(ctx, `
			SELECT id, COALESCE(user_id,''), COALESCE(username,''), method, path, status,
			       COALESCE(ip,''), COALESCE(user_agent,''),
			       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
			FROM audit_logs
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, userIDFilter, pageSize, offset)
		rows, err = r, e
	} else {
		r, e := database.DB.Query(ctx, `
			SELECT id, COALESCE(user_id,''), COALESCE(username,''), method, path, status,
			       COALESCE(ip,''), COALESCE(user_agent,''),
			       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
			FROM audit_logs
			ORDER BY created_at DESC
			LIMIT $1 OFFSET $2
		`, pageSize, offset)
		rows, err = r, e
	}
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询审计日志失败")
		return
	}
	defer rows.Close()

	out := make([]auditLogRow, 0, pageSize)
	for rows.Next() {
		var r auditLogRow
		if err := rows.Scan(&r.ID, &r.UserID, &r.Username, &r.Method, &r.Path, &r.Status, &r.IP, &r.UserAgent, &r.CreatedAt); err != nil {
			middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "扫描审计日志失败")
			return
		}
		out = append(out, r)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     out,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// StreamAuditLogs GET /api/audit-logs/stream
//
// SSE 实时流。客户端 EventSource 监听即可拿到每条新写操作。
// 客户端断开(c.Request.Context().Done())时自动 unsubscribe 释放 channel。
func (h *AuditLogsHandler) StreamAuditLogs(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // 防止 nginx 缓冲

	ch, unsubscribe := audit.Subscribe()
	defer unsubscribe()

	// 即发即用:用 c.Stream 让 gin 处理 flush
	c.Stream(func(w io.Writer) bool {
		select {
		case ev, ok := <-ch:
			if !ok {
				return false
			}
			c.SSEvent("audit", ev)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}
