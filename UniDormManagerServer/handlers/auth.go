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

// WechatLoginRequest 微信登录请求
type WechatLoginRequest struct {
	Code     string `json:"code" binding:"required"`
	UserInfo WechatUserInfo `json:"userInfo"`
}

// WechatUserInfo 微信用户信息
type WechatUserInfo struct {
	NickName  string `json:"nickName"`
	AvatarURL string `json:"avatarUrl"`
	Gender     int    `json:"gender"`
	Language   string `json:"language"`
	City       string `json:"city"`
	Province   string `json:"province"`
	Country    string `json:"country"`
}

// WechatLoginResponse 微信登录响应
type WechatLoginResponse struct {
	Token     string      `json:"token"`
	User      models.UserInfo `json:"user"`
	ExpiresIn int64       `json:"expiresIn"`
	UserRole  string      `json:"userRole"`   // 主要角色：student, maintenance, admin
	UserLevel int        `json:"userLevel"` // 权限等级：1-6
	Roles     []string   `json:"roles"`     // 所有角色代码
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

// WechatLogin 微信登录（小程序专用）
func (h *AuthHandler) WechatLogin(c *gin.Context) {
	var req WechatLoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	log.Printf("微信登录请求: code=%s, nickName=%s", req.Code, req.UserInfo.NickName)

	// 根据code查询/创建用户
	// 测试账号：
	//   - "test_student" → 学生账号
	//   - "test_dorm_manager" → 宿管员账号
	//   - "test_maintenance" → 维修工账号
	//   - "test_building_manager" → 楼栋管理员账号
	//   - "test_logistics_admin" → 后勤管理员账号
	//   - 其他 → 学生账号（默认）

	var username string
	var displayName string
	var userRole string
	var userLevel int

	switch req.Code {
	case "test_student":
		username = "student1"
		displayName = "测试学生"
		userRole = "student"
		userLevel = 1
	case "test_dorm_manager":
		username = "dorm_manager1"
		displayName = "测试宿管员"
		userRole = "student"
		userLevel = 2
	case "test_maintenance":
		username = "maintenance1"
		displayName = "测试维修工"
		userRole = "maintenance"
		userLevel = 3
	case "test_building_manager":
		username = "building_manager1"
		displayName = "测试楼栋管理员"
		userRole = "admin"
		userLevel = 4
	case "test_logistics_admin":
		username = "logistics_admin1"
		displayName = "测试后勤管理员"
		userRole = "admin"
		userLevel = 5
	default:
		// 默认返回学生账号
		username = "student1"
		displayName = req.UserInfo.NickName
		if displayName == "" {
			displayName = "微信用户"
		}
		userRole = "student"
		userLevel = 1
	}

	// 获取用户（包含密码哈希）
	user, _, err := h.userStore.GetUserByUsernameWithPassword(username)
	if err != nil || user == nil {
		log.Printf("Error querying user %s: %v", username, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "Failed to get test user",
			"details": err.Error(),
		})
		return
	}

	// 检查用户状态
	if user.Status != "Active" {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "User account is not active")
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

<<<<<<< HEAD
	// 更新用户信息（微信昵称）
	if req.UserInfo.NickName != "" && req.UserInfo.NickName != displayName {
		updateReq := &models.UpdateUserRequest{
			RealName: req.UserInfo.NickName,
		}
		_, _ = h.userStore.UpdateUser(user.ID, updateReq)
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
		RealName:  req.UserInfo.NickName,
		Roles:     roleCodes,
		StudentID: studentID,
	}

	expiresIn := int64(auth.TokenExpiration.Seconds())

	c.JSON(http.StatusOK, WechatLoginResponse{
		Token:     token,
		User:      *userInfo,
		ExpiresIn: expiresIn,
		UserRole:  userRole,
		UserLevel: userLevel,
		Roles:     roleCodes,
	})

	log.Printf("微信登录成功: username=%s, role=%s, level=%d", username, userRole, userLevel)
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
