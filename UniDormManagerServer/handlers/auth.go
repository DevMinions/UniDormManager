package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	userStore *store.UserStore
}

// NewAuthHandler 创建认证处理器
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userStore: store.NewUserStore(),
	}
}

// Login 登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Username == "" || req.Password == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Username and password are required")
		return
	}

	// 获取用户（包含密码哈希）
	user, passwordHash, err := h.userStore.GetUserByUsernameWithPassword(req.Username)
	if err != nil {
		log.Printf("Error querying user %s: %v", req.Username, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "Failed to query user",
			"details": err.Error(),
		})
		return
	}

	if user == nil {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "Invalid username or password")
		return
	}

	// 检查用户状态
	if user.Status != "Active" {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "User account is not active")
		return
	}

	// 验证密码
	if !auth.CheckPassword(req.Password, passwordHash) {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "Invalid username or password")
		return
	}

	// 获取用户角色
	roles, err := h.userStore.GetUserRoles(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user roles")
		return
	}

	// 获取用户权限
	permissions, err := h.userStore.GetUserPermissions(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user permissions")
		return
	}

	// 获取用户管理的楼栋ID
	buildingIDs, err := h.userStore.GetUserBuildingIDs(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user buildings")
		return
	}

	// 获取用户关联的学生ID
	studentID, err := h.userStore.GetUserStudentID(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get student ID")
		return
	}

	// 转换为字符串数组
	roleCodes := make([]string, len(roles))
	for i, role := range roles {
		roleCodes[i] = role.Code
	}

	permissionCodes := make([]string, len(permissions))
	for i, perm := range permissions {
		permissionCodes[i] = perm.Code
	}

	// 生成 Token
	token, err := auth.GenerateToken(user.ID, user.Username, roleCodes, permissionCodes, buildingIDs, studentID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to generate token")
		return
	}

	// 更新最后登录时间
	_ = h.userStore.UpdateUserLastLogin(user.ID)

	// 构建响应
	userInfo := &models.UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Phone:     user.Phone,
		RealName:  user.RealName,
		Roles:     roleCodes,
		StudentID: studentID,
	}

	expiresIn := int64(auth.TokenExpiration.Seconds())

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:     token,
		User:      userInfo,
		ExpiresIn: expiresIn,
	})
}

// WechatLogin 微信登录（临时实现，用于小程序测试）
func (h *AuthHandler) WechatLogin(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// TODO: 临时实现 - 使用code作为用户名，直接登录
	// 生产环境应该调用微信API换取openid和session_key
	// 这里先用管理员账号做测试，后续完善微信登录流程

	// 获取测试用户（admin）
	user, err := h.userStore.GetUserByUsername("admin")
	if err != nil || user == nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get test user")
		return
	}

	// 获取用户角色
	roles, err := h.userStore.GetUserRoles(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user roles")
		return
	}

	// 获取用户权限
	permissions, err := h.userStore.GetUserPermissions(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user permissions")
		return
	}

	// 获取用户管理的楼栋ID
	buildingIDs, err := h.userStore.GetUserBuildingIDs(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get user buildings")
		return
	}

	// 获取用户关联的学生ID
	studentID, err := h.userStore.GetUserStudentID(user.ID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to get student ID")
		return
	}

	// 转换为字符串数组
	roleCodes := make([]string, len(roles))
	for i, role := range roles {
		roleCodes[i] = role.Code
	}

	permissionCodes := make([]string, len(permissions))
	for i, perm := range permissions {
		permissionCodes[i] = perm.Code
	}

	// 生成 Token
	token, err := auth.GenerateToken(user.ID, user.Username, roleCodes, permissionCodes, buildingIDs, studentID)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "Failed to generate token")
		return
	}

	// 更新最后登录时间
	_ = h.userStore.UpdateUserLastLogin(user.ID)

	// 构建响应
	userInfo := &models.UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Phone:     user.Phone,
		RealName:  user.RealName,
		Roles:     roleCodes,
		StudentID: studentID,
	}

	expiresIn := int64(auth.TokenExpiration.Seconds())

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:     token,
		User:      userInfo,
		ExpiresIn: expiresIn,
	})
}

// Logout 登出
func (h *AuthHandler) Logout(c *gin.Context) {
	// 获取 Token（从请求头）
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// 这里可以将 Token 加入黑名单
		// 简化实现，实际应该存储到数据库或 Redis
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser 获取当前用户信息
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// 尝试从 context 获取 userID
	userID := auth.GetUserID(c)

	// 如果 context 中没有，尝试从 claims 获取
	if userID == "" {
		claims := auth.GetClaims(c)
		if claims != nil {
			userID = claims.UserID
		}
	}

	if userID == "" {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	log.Printf("GetCurrentUser: userID = %s", userID)
	user, err := h.userStore.GetUserByID(userID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "Failed to get user",
			"details": err.Error(),
		})
		return
	}

	if user == nil {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "User not found")
		return
	}

	// 获取角色和权限
	roles, _ := h.userStore.GetUserRoles(userID)
	permissions, _ := h.userStore.GetUserPermissions(userID)
	studentID, _ := h.userStore.GetUserStudentID(userID)

	roleCodes := make([]string, len(roles))
	for i, role := range roles {
		roleCodes[i] = role.Code
	}

	permissionCodes := make([]string, len(permissions))
	for i, perm := range permissions {
		permissionCodes[i] = perm.Code
	}

	userInfo := &models.UserInfo{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Phone:     user.Phone,
		RealName:  user.RealName,
		Roles:     roleCodes,
		StudentID: studentID,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":        userInfo,
		"permissions": permissionCodes,
	})
}