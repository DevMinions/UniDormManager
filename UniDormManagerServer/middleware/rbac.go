package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
)

// RequirePermission 要求特定权限的中间件
// 支持两种调用方式：
// 1. RequirePermission("students", "read") - 两个参数
// 2. RequirePermission("students:read") - 单个参数（格式：resource:action）
func RequirePermission(resourceOrCode string, action ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var requiredPermission string
		if len(action) > 0 {
			// 两个参数：resource, action
			requiredPermission = resourceOrCode + ":" + action[0]
		} else {
			// 单个参数：已经是 "resource:action" 格式
			requiredPermission = resourceOrCode
		}

		permissions := auth.GetPermissions(c)
		hasPermission := false
		for _, perm := range permissions {
			if perm == requiredPermission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			WriteError(c, http.StatusForbidden, "forbidden", "You don't have permission to perform this action")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole 要求特定角色的中间件
func RequireRole(roleCodes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := auth.GetRoles(c)

		hasRole := false
		for _, userRole := range roles {
			for _, requiredRole := range roleCodes {
				if userRole == requiredRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			WriteError(c, http.StatusForbidden, "forbidden", "You don't have the required role")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission 要求任意一个权限的中间件
func RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userPermissions := auth.GetPermissions(c)

		hasPermission := false
		for _, requiredPerm := range permissions {
			for _, userPerm := range userPermissions {
				if userPerm == requiredPerm {
					hasPermission = true
					break
				}
			}
			if hasPermission {
				break
			}
		}

		if !hasPermission {
			WriteError(c, http.StatusForbidden, "forbidden", "You don't have permission to perform this action")
			c.Abort()
			return
		}

		c.Next()
	}
}

// CheckPermission 检查权限的辅助函数
func CheckPermission(c *gin.Context, resource, action string) bool {
	permissions := auth.GetPermissions(c)
	requiredPermission := resource + ":" + action

	for _, perm := range permissions {
		if perm == requiredPermission {
			return true
		}
	}
	return false
}

// HasRole 检查角色的辅助函数
func HasRole(c *gin.Context, roleCode string) bool {
	roles := auth.GetRoles(c)
	for _, role := range roles {
		if role == roleCode {
			return true
		}
	}
	return false
}

// GetPermissionScope 获取权限范围
func GetPermissionScope(c *gin.Context, resource, action string) string {
	claims := auth.GetClaims(c)
	if claims == nil {
		return "self"
	}

	// 这里可以根据角色和权限配置返回范围
	// 简化实现，实际应该查询数据库获取权限范围
	roles := claims.Roles
	for _, role := range roles {
		switch role {
		case "system_admin":
			return "all"
		case "building_manager":
			return "building"
		case "student":
			return "self"
		}
	}

	return "self"
}

// ExtractBuildingIDs 从 Context 提取楼栋ID列表
func ExtractBuildingIDs(c *gin.Context) []string {
	claims := auth.GetClaims(c)
	if claims != nil && len(claims.BuildingIDs) > 0 {
		return claims.BuildingIDs
	}
	return []string{}
}

// IsSelfData 检查是否是自己的数据
func IsSelfData(c *gin.Context, resourceID string) bool {
	claims := auth.GetClaims(c)
	if claims == nil {
		return false
	}

	// 如果是学生，检查是否是自己的学生ID
	if claims.StudentID != nil && resourceID == *claims.StudentID {
		return true
	}

	// 检查是否是自己的用户ID
	if resourceID == claims.UserID {
		return true
	}

	return false
}

// FilterByScope 根据权限范围过滤数据ID列表
func FilterByScope(c *gin.Context, resourceIDs []string, scope string) []string {
	switch scope {
	case "all":
		return resourceIDs
	case "building":
		// 返回楼栋管理员管理的楼栋相关数据
		buildingIDs := ExtractBuildingIDs(c)
		if len(buildingIDs) == 0 {
			return []string{}
		}
		// 这里需要根据实际业务逻辑过滤
		// 简化实现
		return resourceIDs
	case "self":
		// 只返回自己的数据
		claims := auth.GetClaims(c)
		if claims == nil {
			return []string{}
		}
		filtered := []string{}
		for _, id := range resourceIDs {
			if IsSelfData(c, id) {
				filtered = append(filtered, id)
			}
		}
		return filtered
	default:
		return []string{}
	}
}

