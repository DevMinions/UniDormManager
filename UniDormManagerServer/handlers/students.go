package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/middleware"
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
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", "无效的分页参数")
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
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "用户未认证")
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
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询学生数据失败")
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetStudentsAll 获取所有学生（传统方式）
func (h *StudentHandler) GetStudentsAll(c *gin.Context) {
	allStudents, err := h.store.GetAllStudents()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询学生失败")
		return
	}

	// 确保 allStudents 不是 nil
	if allStudents == nil {
		allStudents = []*models.Student{}
	}

	// 根据权限范围过滤数据
	claims := auth.GetClaims(c)
	if claims == nil {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "用户未认证")
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
		allRooms, err := h.store.GetAllRooms()
		if err != nil {
			middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询房间失败")
			return
		}
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

// isDormStaff 判断调用者是否持有可跨人管理学生的员工角色
func isDormStaff(c *gin.Context) bool {
	for _, r := range auth.GetRoles(c) {
		switch r {
		case "dorm_manager", "building_manager", "logistics_admin", "system_admin":
			return true
		}
	}
	return false
}

// GetStudentByID 根据ID获取学生
func (h *StudentHandler) GetStudentByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Student ID is required")
		return
	}

	student, exists := h.store.GetStudentByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "学生不存在")
		return
	}

	// 归属校验：staff 可访问任意记录；学生只能访问自己的记录（A1-8 IDOR 修复）
	// 使用主键 student.ID 而非学号 student.StudentID：claims.StudentID 存的是 students.id（主键）
	if !isDormStaff(c) && !middleware.IsSelfData(c, student.ID) {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权访问该学生记录")
		return
	}

	c.JSON(http.StatusOK, student)
}

// CreateStudent 创建学生
func (h *StudentHandler) CreateStudent(c *gin.Context) {
	var req models.CreateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", "无效的学生信息")
		return
	}

	// 验证必填字段
	if req.Name == "" || req.StudentID == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Name and StudentID are required")
		return
	}

	// 验证状态值
	if req.Status != "" && req.Status != "Active" && req.Status != "Graduated" && req.Status != "On Leave" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	student := h.store.CreateStudent(&req)
	if student == nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "创建学生失败")
		return
	}
	c.JSON(http.StatusCreated, student)
}

// UpdateStudent 更新学生
func (h *StudentHandler) UpdateStudent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Student ID is required")
		return
	}

	var req models.UpdateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "invalid_request", "无效的学生信息")
		return
	}

	// 验证状态值
	if req.Status != "" && req.Status != "Active" && req.Status != "Graduated" && req.Status != "On Leave" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid status value")
		return
	}

	// 防御性归属校验：先取目标记录，确认归属后再更新（A1-8 IDOR 防御）
	// 注：学生角色无 students:update 权限，RBAC 中间件已拦截；此处为 defense-in-depth。
	existing, exists := h.store.GetStudentByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "学生不存在")
		return
	}
	// 使用主键 existing.ID 而非学号 existing.StudentID：claims.StudentID 存的是 students.id（主键）
	if !isDormStaff(c) && !middleware.IsSelfData(c, existing.ID) {
		middleware.WriteError(c, http.StatusForbidden, "forbidden", "无权修改该学生记录")
		return
	}

	student, updated := h.store.UpdateStudent(id, &req)
	if !updated {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "学生不存在")
		return
	}

	c.JSON(http.StatusOK, student)
}

// DeleteStudent 删除学生
func (h *StudentHandler) DeleteStudent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Student ID is required")
		return
	}

	if h.store.DeleteStudent(id) {
		c.JSON(http.StatusOK, gin.H{
			"message": "学生删除成功",
		})
	} else {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "学生不存在")
	}
}
