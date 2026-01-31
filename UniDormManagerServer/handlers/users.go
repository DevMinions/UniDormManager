package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// UserHandler 用户管理处理器
type UserHandler struct {
	userStore *store.UserStore
}

// NewUserHandler 创建用户管理处理器
func NewUserHandler() *UserHandler {
	return &UserHandler{
		userStore: store.NewUserStore(),
	}
}

// GetAllUsers 获取所有用户
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userStore.GetAllUsers()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get users")
		return
	}

	// 为每个用户加载角色信息
	for _, user := range users {
		roles, _ := h.userStore.GetUserRoles(user.ID)
		user.Roles = roles
		studentID, _ := h.userStore.GetUserStudentID(user.ID)
		user.StudentID = studentID
	}

	c.JSON(http.StatusOK, users)
}

// GetUserByID 根据ID获取用户
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "User ID is required")
		return
	}

	user, err := h.userStore.GetUserByID(id)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user")
		return
	}

	if user == nil {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "User not found")
		return
	}

	// 加载角色和学生ID
	roles, _ := h.userStore.GetUserRoles(user.ID)
	user.Roles = roles
	studentID, _ := h.userStore.GetUserStudentID(user.ID)
	user.StudentID = studentID

	c.JSON(http.StatusOK, user)
}

// CreateUser 创建用户
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Username == "" || req.Password == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Username and password are required")
		return
	}

	// 检查用户名是否已存在
	existing, _ := h.userStore.GetUserByUsername(req.Username)
	if existing != nil {
		middleware.WriteError(c, http.StatusConflict, "conflict", "Username already exists")
		return
	}

	// 加密密码
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to hash password")
		return
	}

	// 创建用户
	user, err := h.userStore.CreateUser(&req, passwordHash)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to create user")
		return
	}

	// 加载角色信息
	roles, _ := h.userStore.GetUserRoles(user.ID)
	user.Roles = roles

	c.JSON(http.StatusCreated, user)
}

// UpdateUser 更新用户
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "User ID is required")
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证状态值
	if req.Status != "" && req.Status != "Active" && req.Status != "Inactive" && req.Status != "Suspended" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	user, err := h.userStore.UpdateUser(id, &req)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to update user")
		return
	}

	if user == nil {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "User not found")
		return
	}

	// 加载角色信息
	roles, _ := h.userStore.GetUserRoles(user.ID)
	user.Roles = roles

	c.JSON(http.StatusOK, user)
}

// DeleteUser 删除用户
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "User ID is required")
		return
	}

	// 不能删除自己
	currentUserID := auth.GetUserID(c)
	if id == currentUserID {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Cannot delete yourself")
		return
	}

	if err := h.userStore.DeleteUser(id); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to delete user")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// AssignRoles 分配角色给用户
func (h *UserHandler) AssignRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "User ID is required")
		return
	}

	var req models.AssignRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	if err := h.userStore.AssignRoles(id, &req); err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to assign roles")
		return
	}

	// 返回更新后的用户信息
	user, _ := h.userStore.GetUserByID(id)
	if user != nil {
		roles, _ := h.userStore.GetUserRoles(user.ID)
		user.Roles = roles
	}

	c.JSON(http.StatusOK, user)
}

