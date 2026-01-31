package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// RoleHandler 角色管理处理器
type RoleHandler struct {
	roleStore *store.RoleStore
}

// NewRoleHandler 创建角色管理处理器
func NewRoleHandler() *RoleHandler {
	return &RoleHandler{
		roleStore: store.NewRoleStore(),
	}
}

// GetAllRoles 获取所有角色
func (h *RoleHandler) GetAllRoles(c *gin.Context) {
	roles, err := h.roleStore.GetAllRoles()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get roles")
		return
	}

	// 为每个角色加载权限信息
	for _, role := range roles {
		permissions, _ := h.roleStore.GetRolePermissions(role.ID)
		role.Permissions = permissions
	}

	c.JSON(http.StatusOK, roles)
}

// GetRoleByID 根据ID获取角色
func (h *RoleHandler) GetRoleByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Role ID is required")
		return
	}

	role, err := h.roleStore.GetRoleByID(id)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get role")
		return
	}

	if role == nil {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Role not found")
		return
	}

	// 加载权限信息
	permissions, _ := h.roleStore.GetRolePermissions(role.ID)
	role.Permissions = permissions

	c.JSON(http.StatusOK, role)
}

// CreateRole 创建角色
func (h *RoleHandler) CreateRole(c *gin.Context) {
	var req models.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Code == "" || req.Name == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Code and name are required")
		return
	}

	// 检查角色代码是否已存在
	existing, _ := h.roleStore.GetRoleByCode(req.Code)
	if existing != nil {
		middleware.WriteError(c, http.StatusConflict, "conflict", "Role code already exists")
		return
	}

	role, err := h.roleStore.CreateRole(&req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to create role")
		return
	}

	// 加载权限信息
	permissions, _ := h.roleStore.GetRolePermissions(role.ID)
	role.Permissions = permissions

	c.JSON(http.StatusCreated, role)
}

// UpdateRole 更新角色
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Role ID is required")
		return
	}

	var req models.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	role, err := h.roleStore.UpdateRole(id, &req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to update role")
		return
	}

	if role == nil {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Role not found")
		return
	}

	// 加载权限信息
	permissions, _ := h.roleStore.GetRolePermissions(role.ID)
	role.Permissions = permissions

	c.JSON(http.StatusOK, role)
}

// DeleteRole 删除角色
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Role ID is required")
		return
	}

	// 检查是否是预定义角色（不能删除）
	role, _ := h.roleStore.GetRoleByID(id)
	if role != nil {
		// 预定义角色代码列表
		predefinedRoles := []string{
			"student", "dorm_manager", "maintenance_staff",
			"building_manager", "logistics_admin", "system_admin",
		}
		for _, code := range predefinedRoles {
			if role.Code == code {
				middleware.WriteError(c, http.StatusForbidden, "forbidden", "Cannot delete predefined role")
				return
			}
		}
	}

	if err := h.roleStore.DeleteRole(id); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to delete role")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role deleted successfully"})
}

// GetAllPermissions 获取所有权限
func (h *RoleHandler) GetAllPermissions(c *gin.Context) {
	permissions, err := h.roleStore.GetAllPermissions()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get permissions")
		return
	}

	c.JSON(http.StatusOK, permissions)
}

