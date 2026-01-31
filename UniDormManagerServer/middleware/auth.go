package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
)

// AuthMiddleware 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取 Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			WriteError(c, http.StatusUnauthorized, "unauthorized", "Authorization header is required")
			c.Abort()
			return
		}

		// 检查 Bearer 前缀
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			WriteError(c, http.StatusUnauthorized, "unauthorized", "Invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 解析和验证 Token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			WriteError(c, http.StatusUnauthorized, "unauthorized", "Invalid or expired token")
			c.Abort()
			return
		}

		// 将用户信息存储到 Context
		auth.SetUserID(c, claims.UserID)
		auth.SetUsername(c, claims.Username)
		auth.SetRoles(c, claims.Roles)
		auth.SetPermissions(c, claims.Permissions)
		auth.SetClaims(c, claims)

		c.Next()
	}
}

// OptionalAuthMiddleware 可选认证中间件（不强制要求登录）
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				if claims, err := auth.ValidateToken(parts[1]); err == nil {
					auth.SetUserID(c, claims.UserID)
					auth.SetUsername(c, claims.Username)
					auth.SetRoles(c, claims.Roles)
					auth.SetPermissions(c, claims.Permissions)
					auth.SetClaims(c, claims)
				}
			}
		}
		c.Next()
	}
}

