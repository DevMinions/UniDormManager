package middleware

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"unidorm-manager-server/audit"
	"unidorm-manager-server/auth"
	"unidorm-manager-server/database"
)

// AuditLog 是 gin 中间件:对每个成功的写请求(POST/PUT/PATCH/DELETE)
// 异步往 audit_logs 表写一条记录(谁、何时、调了什么接口)。
//
// 设计取舍:
// - 只记录 method/path/status/user/ip/UA,**不记录 body**。原因:
//  1. 多数 POST 含密码/token 等敏感字段,记录有风险
//  2. Body 拦截需要 io.ReadAll + io.NopCloser replay,易引入 bug
//  3. 真要重放历史改动,可以日后扩展加 sanitized after-state JSON
//
// - 异步 goroutine + context.Background():DB 慢/挂不阻塞 API 响应
// - 失败仅 log.Printf,不上报 metrics 也不重试
func AuditLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // 让 handler 跑完

		// 只关心写操作
		switch c.Request.Method {
		case "POST", "PUT", "PATCH", "DELETE":
		default:
			return
		}
		// 失败请求不计(避免被失败重试灌爆表)
		if c.Writer.Status() >= 400 {
			return
		}

		userID := auth.GetUserID(c)
		username := auth.GetUsername(c)
		// 未登录(理论不会到这,所有写接口都 AuthMiddleware)也要兜底
		if userID == "" && username == "" {
			return
		}

		method := c.Request.Method
		path := c.Request.URL.Path
		status := c.Writer.Status()
		ip := c.ClientIP()
		ua := c.Request.UserAgent()
		if len(ua) > 500 {
			ua = ua[:500]
		}

		// 异步写,API 响应已 flush 给客户端,不阻塞
		id := uuid.NewString()
		go func() {
			ctx := context.Background()
			_, err := database.DB.Exec(ctx, `
				INSERT INTO audit_logs (id, user_id, username, method, path, status, ip, user_agent)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, id, userID, username, method, path, status, ip, ua)
			if err != nil {
				log.Printf("audit: insert failed: %v (method=%s path=%s)", err, method, path)
			}
		}()

		// 同时实时广播给 SSE 订阅者(in-memory,best-effort)
		audit.Publish(audit.Event{
			ID:        id,
			UserID:    userID,
			Username:  username,
			Method:    method,
			Path:      path,
			Status:    status,
			IP:        ip,
			UserAgent: ua,
			CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		})
	}
}
