package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// StudentHandler 学生处理器
type StudentHandler struct {
	store store.StoreInterface
}

// NewStudentHandler 创建学生处理器
func NewStudentHandler(s store.StoreInterface) *StudentHandler {
	return &StudentHandler{store: s}
}

// GetStudents 获取学生（支持分页和搜索）
func (h *StudentHandler) GetStudents(c *gin.Context) {
	// 检查是否有分页参数，如果有则使用分页查询
	if c.Query("page") != "" || c.Query("pageSize") != "" {
		h.GetStudentsPaginated(c)
		return
	}

	// 没有分页参数，使用传统查询（保持兼容性）
	h.GetStudentsAll(c)
}

// GetStudentsPaginated 分页获取学生
func (h *StudentHandler) GetStudentsPaginated(c *gin.Context) {
	// 解析分页参数
	var req models.PaginatedRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "无效的分页参数",
			"details": err.Error(),
		})
		return
	}

	// 解析筛选参数
	var filter models.StudentFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		filter = models.StudentFilter{}
	}

	// 根据权限范围过滤数据
	claims := auth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "用户未认证",
		})
		return
	}

	// 系统管理员可以访问所有学生
	roles := auth.GetRoles(c)
	isSystemAdmin := false
	for _, role := range roles {
		if role == "system_admin" {
			isSystemAdmin = true
			break
		}
	}

	// 如果不是系统管理员，需要过滤楼栋权限
	if !isSystemAdmin && len(claims.BuildingIDs) > 0 {
		// 这里需要根据用户的楼栋权限过滤数据
		// 在实际应用中，应该将用户管理的楼栋ID添加到filter中
	}

	// 调用分页查询
	response, err := h.store.GetStudentsPaginated(&req, &filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "查询学生数据失败",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetStudentsAll 获取所有学生（传统方式）
func (h *StudentHandler) GetStudentsAll(c *gin.Context) {
	allStudents := h.store.GetAllStudents()

	// 确保 allStudents 不是 nil
	if allStudents == nil {
		allStudents = []*models.Student{}
	}

	// 根据权限范围过滤数据
	claims := auth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "用户未认证",
		})
		return
	}

	// 系统管理员可以访问所有学生
	roles := auth.GetRoles(c)
	isSystemAdmin := false
	for _, role := range roles {
		if role == "system_admin" {
			isSystemAdmin = true
			break
		}
	}

	var filteredStudents []*models.Student
	if isSystemAdmin {
		// 系统管理员：返回所有学生
		filteredStudents = allStudents
	} else if len(claims.BuildingIDs) > 0 {
		// 楼栋管理员：只返回管理楼栋的学生
		allRooms := h.store.GetAllRooms()
		buildingRoomMap := make(map[string]bool)
		for _, room := range allRooms {
			for _, buildingID := range claims.BuildingIDs {
				if room.Building == buildingID {
					buildingRoomMap[room.Number] = true
					break
				}
			}
		}
		for _, student := range allStudents {
			if buildingRoomMap[student.RoomNumber] {
				filteredStudents = append(filteredStudents, student)
			}
		}
	}

	c.JSON(http.StatusOK, filteredStudents)
}

// GetStudentByID 根据ID获取学生
func (h *StudentHandler) GetStudentByID(c *gin.Context) {
	id := c.Param("id")

	student, exists := h.store.GetStudentByID(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": "学生不存在",
		})
		return
	}

	c.JSON(http.StatusOK, student)
}

// CreateStudent 创建学生
func (h *StudentHandler) CreateStudent(c *gin.Context) {
	var req models.CreateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "无效的学生信息",
			"details": err.Error(),
		})
		return
	}

	student := h.store.CreateStudent(&req)
	c.JSON(http.StatusCreated, student)
}

// UpdateStudent 更新学生
func (h *StudentHandler) UpdateStudent(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "无效的学生信息",
			"details": err.Error(),
		})
		return
	}

	student, updated := h.store.UpdateStudent(id, &req)
	if !updated {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": "学生不存在",
		})
		return
	}

	c.JSON(http.StatusOK, student)
}

// DeleteStudent 删除学生
func (h *StudentHandler) DeleteStudent(c *gin.Context) {
	id := c.Param("id")

	if h.store.DeleteStudent(id) {
		c.JSON(http.StatusOK, gin.H{
			"message": "学生删除成功",
		})
	} else {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": "学生不存在",
		})
	}
}