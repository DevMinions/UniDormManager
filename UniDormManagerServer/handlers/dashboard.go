package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/cache"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/models"
	"unidorm-manager-server/store"
)

// DashboardHandler 仪表板处理器
type DashboardHandler struct {
	store store.StoreInterface
}

// NewDashboardHandler 创建仪表板处理器
func NewDashboardHandler(s store.StoreInterface) *DashboardHandler {
	return &DashboardHandler{store: s}
}

// GetDashboardStats 获取仪表板统计数据
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	// 尝试从缓存获取
	if cache.Cache != nil {
		var cached models.DashboardStats
		if err := cache.Get(cache.CacheKeyDashboard, &cached); err == nil {
			c.JSON(http.StatusOK, cached)
			return
		}
	}

	students, err := h.store.GetAllStudents()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询学生失败")
		return
	}
	rooms, err := h.store.GetAllRooms()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询房间失败")
		return
	}
	repairs, err := h.store.GetAllRepairRequests()
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询报修失败")
		return
	}

	// 计算统计数据
	totalStudents := len(students)

	// 计算入住率
	totalCapacity := 0
	totalOccupied := 0
	for _, room := range rooms {
		totalCapacity += room.Capacity
		totalOccupied += room.Occupied
	}
	occupancyRate := 0.0
	if totalCapacity > 0 {
		occupancyRate = float64(totalOccupied) / float64(totalCapacity) * 100
	}

	// 计算待处理和已完成的报修
	pendingRepairs := 0
	completedRepairs := 0
	for _, repair := range repairs {
		if repair.Status == "Pending" {
			pendingRepairs++
		} else if repair.Status == "Completed" {
			completedRepairs++
		}
	}

	// 构建楼栋入住情况数据
	buildingMap := make(map[string]*models.BuildingOccupancy)
	for _, room := range rooms {
		if buildingMap[room.Building] == nil {
			buildingMap[room.Building] = &models.BuildingOccupancy{
				Name:     room.Building,
				Occupied: 0,
				Capacity: 0,
			}
		}
		buildingMap[room.Building].Occupied += room.Occupied
		buildingMap[room.Building].Capacity += room.Capacity
	}
	occupancyData := make([]models.BuildingOccupancy, 0, len(buildingMap))
	for _, data := range buildingMap {
		occupancyData = append(occupancyData, *data)
	}

	// 构建报修状态统计
	requestStatus := []models.RepairRequestStatus{
		{Name: "待处理", Value: 0, Color: "#F59E0B"},
		{Name: "处理中", Value: 0, Color: "#3B82F6"},
		{Name: "已完成", Value: 0, Color: "#10B981"},
	}
	for _, repair := range repairs {
		switch repair.Status {
		case "Pending":
			requestStatus[0].Value++
		case "In Progress":
			requestStatus[1].Value++
		case "Completed":
			requestStatus[2].Value++
		}
	}

	stats := models.DashboardStats{
		TotalStudents:    totalStudents,
		OccupancyRate:    occupancyRate,
		PendingRepairs:   pendingRepairs,
		CompletedRepairs: completedRepairs,
		OccupancyData:    occupancyData,
		RequestStatus:    requestStatus,
	}

	// 写入缓存
	if cache.Cache != nil {
		cache.Set(cache.CacheKeyDashboard, stats, cache.CacheExpirationShort)
	}

	c.JSON(http.StatusOK, stats)
}
