package auth

import (
	"github.com/gin-gonic/gin"
)

const (
	// ContextKeyUserID 用户ID在Context中的键
	ContextKeyUserID = "user_id"
	// ContextKeyUsername 用户名在Context中的键
	ContextKeyUsername = "username"
	// ContextKeyRoles 角色在Context中的键
	ContextKeyRoles = "roles"
	// ContextKeyPermissions 权限在Context中的键
	ContextKeyPermissions = "permissions"
	// ContextKeyClaims JWT Claims在Context中的键
	ContextKeyClaims = "claims"
)

// SetUserID 设置用户ID到Context
func SetUserID(c *gin.Context, userID string) {
	c.Set(ContextKeyUserID, userID)
}

// GetUserID 从Context获取用户ID
func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get(ContextKeyUserID); exists {
		if id, ok := userID.(string); ok {
			return id
		}
	}
	return ""
}

// SetUsername 设置用户名到Context
func SetUsername(c *gin.Context, username string) {
	c.Set(ContextKeyUsername, username)
}

// GetUsername 从Context获取用户名
func GetUsername(c *gin.Context) string {
	if username, exists := c.Get(ContextKeyUsername); exists {
		if name, ok := username.(string); ok {
			return name
		}
	}
	return ""
}

// SetRoles 设置角色到Context
func SetRoles(c *gin.Context, roles []string) {
	c.Set(ContextKeyRoles, roles)
}

// GetRoles 从Context获取角色
func GetRoles(c *gin.Context) []string {
	if roles, exists := c.Get(ContextKeyRoles); exists {
		if r, ok := roles.([]string); ok {
			return r
		}
	}
	return []string{}
}

// SetPermissions 设置权限到Context
func SetPermissions(c *gin.Context, permissions []string) {
	c.Set(ContextKeyPermissions, permissions)
}

// GetPermissions 从Context获取权限
func GetPermissions(c *gin.Context) []string {
	if permissions, exists := c.Get(ContextKeyPermissions); exists {
		if p, ok := permissions.([]string); ok {
			return p
		}
	}
	return []string{}
}

// SetClaims 设置Claims到Context
func SetClaims(c *gin.Context, claims *Claims) {
	c.Set(ContextKeyClaims, claims)
}

// GetClaims 从Context获取Claims
func GetClaims(c *gin.Context) *Claims {
	if claims, exists := c.Get(ContextKeyClaims); exists {
		if c, ok := claims.(*Claims); ok {
			return c
		}
	}
	return nil
}

