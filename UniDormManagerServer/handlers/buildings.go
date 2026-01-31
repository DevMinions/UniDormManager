package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// BuildingHandler 楼栋处理器
type BuildingHandler struct {
	store store.StoreInterface
}

// NewBuildingHandler 创建楼栋处理器
func NewBuildingHandler(s store.StoreInterface) *BuildingHandler {
	return &BuildingHandler{store: s}
}

// GetAllBuildings 获取所有楼栋
func (h *BuildingHandler) GetAllBuildings(c *gin.Context) {
	allBuildings := h.store.GetAllBuildings()
	
	// 确保 allBuildings 不是 nil
	if allBuildings == nil {
		allBuildings = []*models.Building{}
	}
	
	// 根据权限范围过滤数据
	claims := auth.GetClaims(c)
	if claims == nil {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	// 系统管理员可以访问所有楼栋
	roles := auth.GetRoles(c)
	isSystemAdmin := false
	for _, role := range roles {
		if role == "system_admin" {
			isSystemAdmin = true
			break
		}
	}

	var filteredBuildings []*models.Building
	if isSystemAdmin {
		// 系统管理员：返回所有楼栋
		filteredBuildings = allBuildings
	} else if len(claims.BuildingIDs) > 0 {
		// 楼栋管理员：只返回管理的楼栋
		buildingMap := make(map[string]bool)
		for _, buildingID := range claims.BuildingIDs {
			buildingMap[buildingID] = true
		}
		
		for _, building := range allBuildings {
			if buildingMap[building.ID] {
				filteredBuildings = append(filteredBuildings, building)
			}
		}
	} else {
		// 其他角色：无权限或返回空列表
		filteredBuildings = []*models.Building{}
	}

	c.JSON(http.StatusOK, filteredBuildings)
}

// GetBuildingByID 根据ID获取楼栋
func (h *BuildingHandler) GetBuildingByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Building ID is required")
		return
	}

	building, exists := h.store.GetBuildingByID(id)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Building not found")
		return
	}

	// 检查权限：是否可以访问该楼栋
	claims := auth.GetClaims(c)
	if claims == nil {
		middleware.WriteError(c, http.StatusUnauthorized, "unauthorized", "User not authenticated")
		return
	}

	// 系统管理员可以访问所有楼栋
	roles := auth.GetRoles(c)
	isSystemAdmin := false
	for _, role := range roles {
		if role == "system_admin" {
			isSystemAdmin = true
			break
		}
	}

	if !isSystemAdmin {
		// 检查是否是管理的楼栋
		hasAccess := false
		for _, buildingID := range claims.BuildingIDs {
			if buildingID == id {
				hasAccess = true
				break
			}
		}
		
		if !hasAccess {
			middleware.WriteError(c, http.StatusForbidden, "forbidden", "Access denied")
			return
		}
	}

	c.JSON(http.StatusOK, building)
}

// CreateBuilding 创建楼栋
func (h *BuildingHandler) CreateBuilding(c *gin.Context) {
	var req models.CreateBuildingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证必填字段
	if req.Name == "" || req.Manager == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Name and Manager are required")
		return
	}

	// 验证类型值
	if req.Type != "Male" && req.Type != "Female" && req.Type != "Co-ed" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid type value")
		return
	}

	// 验证层数
	if req.Floors <= 0 {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Floors must be greater than 0")
		return
	}

	building := h.store.CreateBuilding(&req)
	c.JSON(http.StatusCreated, building)
}

// UpdateBuilding 更新楼栋
func (h *BuildingHandler) UpdateBuilding(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Building ID is required")
		return
	}

	var req models.UpdateBuildingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid request body")
		return
	}

	// 验证类型值
	if req.Type != "" && req.Type != "Male" && req.Type != "Female" && req.Type != "Co-ed" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Invalid type value")
		return
	}

	building, exists := h.store.UpdateBuilding(id, &req)
	if !exists {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Building not found")
		return
	}

	c.JSON(http.StatusOK, building)
}

// DeleteBuilding 删除楼栋
func (h *BuildingHandler) DeleteBuilding(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		middleware.WriteError(c, http.StatusBadRequest, "bad_request", "Building ID is required")
		return
	}

	if !h.store.DeleteBuilding(id) {
		middleware.WriteError(c, http.StatusNotFound, "not_found", "Building not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Building deleted successfully"})
}
