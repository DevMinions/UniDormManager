package models

import "time"

// PaginatedRequest 分页请求参数
type PaginatedRequest struct {
	Page      int               `json:"page" form:"page" binding:"min=1"`
	PageSize  int               `json:"pageSize" form:"pageSize" binding:"min=1,max=100"`
	SortBy    string            `json:"sortBy" form:"sortBy"`
	SortOrder string            `json:"sortOrder" form:"sortOrder" binding:"omitempty,oneof=asc desc"`
	Search    string            `json:"search" form:"search"`
	Filters   map[string]string `json:"filters" form:"filters"`
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
	HasNext    bool        `json:"hasNext"`
	HasPrev    bool        `json:"hasPrev"`
}

// StudentFilter 学生筛选参数
type StudentFilter struct {
	Status   string `json:"status" form:"status"`
	Major    string `json:"major" form:"major"`
	Room     string `json:"room" form:"room"`
	Building string `json:"building" form:"building"`
}

// RoomFilter 房间筛选参数
type RoomFilter struct {
	Status      string `json:"status" form:"status"`
	Building    string `json:"building" form:"building"`
	Type        string `json:"type" form:"type"`
	CapacityMin int    `json:"capacityMin" form:"capacityMin"`
	CapacityMax int    `json:"capacityMax" form:"capacityMax"`
}

// RepairFilter 维修筛选参数
type RepairFilter struct {
	Status    string    `json:"status" form:"status"`
	Priority  string    `json:"priority" form:"priority"`
	StudentID string    `json:"studentId" form:"studentId"`
	Room      string    `json:"room" form:"room"`
	DateFrom  time.Time `json:"dateFrom" form:"dateFrom"`
	DateTo    time.Time `json:"dateTo" form:"dateTo"`
}

// InspectionFilter 查寝筛选参数
type InspectionFilter struct {
	Status    string    `json:"status" form:"status"`
	Building  string    `json:"building" form:"building"`
	Inspector string    `json:"inspector" form:"inspector"`
	DateFrom  time.Time `json:"dateFrom" form:"dateFrom"`
	DateTo    time.Time `json:"dateTo" form:"dateTo"`
	ScoreMin  int       `json:"scoreMin" form:"scoreMin"`
	ScoreMax  int       `json:"scoreMax" form:"scoreMax"`
}

// CalculatePagination 计算分页信息
func CalculatePagination(page, pageSize int, total int64) PaginatedResponse {
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	return PaginatedResponse{
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

// GetOffset 获取分页偏移量
func (p *PaginatedRequest) GetOffset() int {
	return (p.Page - 1) * p.PageSize
}

// ValidateAndSetDefaults 验证并设置默认值
func (p *PaginatedRequest) ValidateAndSetDefaults() {
	if p.Page <= 0 {
		p.Page = 1
	}
	if p.PageSize <= 0 {
		p.PageSize = 10
	}
	if p.PageSize > 100 {
		p.PageSize = 100
	}
	if p.SortOrder == "" {
		p.SortOrder = "desc"
	}
	if p.SortBy == "" {
		p.SortBy = "created_at"
	}
}

// BuildOrderBy 构建排序子句
func (p *PaginatedRequest) BuildOrderBy() string {
	// 防止SQL注入的安全检查
	allowedSortColumns := map[string]bool{
		"created_at": true,
		"updated_at": true,
		"name":       true,
		"status":     true,
		"priority":   true,
		"student_id": true,
		"room":       true,
	}

	if !allowedSortColumns[p.SortBy] {
		p.SortBy = "created_at"
	}

	return p.SortBy + " " + p.SortOrder
}
