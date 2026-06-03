package middleware

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CORS 跨域中间件：生产按 CORS_ALLOWED_ORIGINS 白名单回显，开发回退 *
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowed := resolveAllowedOrigin(origin)
		if allowed != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowed)
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Max-Age", "3600")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// resolveAllowedOrigin 返回应回显的 Allow-Origin（空=不下发）
func resolveAllowedOrigin(origin string) string {
	raw := os.Getenv("CORS_ALLOWED_ORIGINS")
	if raw == "" {
		// 非生产且未配置 → 开发便利回退 *
		if os.Getenv("APP_ENV") != "production" {
			return "*"
		}
		return ""
	}
	for _, o := range strings.Split(raw, ",") {
		if strings.TrimSpace(o) == origin && origin != "" {
			return origin
		}
	}
	return ""
}

// Logging 日志中间件
func Logging() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[%s] %s %s - %d - %v - %s",
			method,
			path,
			clientIP,
			statusCode,
			latency,
			c.Request.UserAgent(),
		)
	}
}

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// WriteError 写入错误响应（辅助函数）
func WriteError(c *gin.Context, statusCode int, errorMsg string, message string) {
	c.JSON(statusCode, ErrorResponse{
		Error:   errorMsg,
		Message: message,
	})
	c.Abort()
}
