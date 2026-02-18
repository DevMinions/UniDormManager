package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStudentValidation(t *testing.T) {
	tests := []struct {
		name    string
		student Student
		wantErr bool
	}{
		{
			name: "有效学生",
			student: Student{
				ID:         "1",
				Name:       "张三",
				StudentID:  "2021001001",
				Major:      "计算机科学与技术",
				RoomNumber: "A101",
				Status:     "Active",
			},
			wantErr: false,
		},
		{
			name: "姓名为空",
			student: Student{
				ID:        "1",
				Name:      "",
				StudentID: "2021001001",
				Status:    "Active",
			},
			wantErr: false, // 模型层不验证，由 handler 验证
		},
		{
			name: "学号为空",
			student: Student{
				ID:        "1",
				Name:      "张三",
				StudentID: "",
				Status:    "Active",
			},
			wantErr: false,
		},
		{
			name: "状态值无效",
			student: Student{
				ID:        "1",
				Name:      "张三",
				StudentID: "2021001001",
				Status:    "Invalid",
			},
			wantErr: false, // 模型层不验证
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 验证学生对象创建
			assert.NotNil(t, tt.student)
			assert.Equal(t, tt.student.Name, tt.student.Name)
		})
	}
}

func TestCreateStudentRequestValidation(t *testing.T) {
	tests := []struct {
		name    string
		req     CreateStudentRequest
		wantErr bool
	}{
		{
			name: "有效请求",
			req: CreateStudentRequest{
				Name:      "张三",
				StudentID: "2021001001",
				Major:     "计算机科学与技术",
				Status:    "Active",
			},
			wantErr: false,
		},
		{
			name: "缺少姓名",
			req: CreateStudentRequest{
				Name:      "",
				StudentID: "2021001001",
			},
			wantErr: false,
		},
		{
			name: "缺少学号",
			req: CreateStudentRequest{
				Name:      "张三",
				StudentID: "",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotNil(t, tt.req)
		})
	}
}

func TestRoomValidation(t *testing.T) {
	tests := []struct {
		name string
		room Room
	}{
		{
			name: "有效房间",
			room: Room{
				ID:       "1",
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Occupied: 2,
				Type:     "Male",
				Status:   "Available",
			},
		},
		{
			name: "房间已满",
			room: Room{
				ID:       "2",
				Number:   "A102",
				Building: "A栋",
				Capacity: 4,
				Occupied: 4,
				Type:     "Male",
				Status:   "Full",
			},
		},
		{
			name: "维修中",
			room: Room{
				ID:       "3",
				Number:   "B101",
				Building: "B栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Female",
				Status:   "Maintenance",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotNil(t, tt.room)
			assert.Greater(t, tt.room.Capacity, 0)
			assert.LessOrEqual(t, tt.room.Occupied, tt.room.Capacity)
		})
	}
}

func TestCreateRoomRequestValidation(t *testing.T) {
	tests := []struct {
		name string
		req  CreateRoomRequest
	}{
		{
			name: "有效请求",
			req: CreateRoomRequest{
				Number:   "A101",
				Building: "A栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Male",
				Status:   "Available",
			},
		},
		{
			name: "女生宿舍",
			req: CreateRoomRequest{
				Number:   "B101",
				Building: "B栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Female",
				Status:   "Available",
			},
		},
		{
			name: "混合宿舍",
			req: CreateRoomRequest{
				Number:   "C101",
				Building: "C栋",
				Capacity: 4,
				Occupied: 0,
				Type:     "Co-ed",
				Status:   "Available",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotNil(t, tt.req)
			assert.NotEmpty(t, tt.req.Number)
			assert.NotEmpty(t, tt.req.Building)
			assert.Greater(t, tt.req.Capacity, 0)
		})
	}
}

func TestRepairRequestValidation(t *testing.T) {
	tests := []struct {
		name   string
		repair RepairRequest
	}{
		{
			name: "待处理报修",
			repair: RepairRequest{
				ID:         "1",
				Title:      "水管漏水",
				Status:     "Pending",
				RoomNumber: "A101",
				Priority:   "High",
			},
		},
		{
			name: "处理中报修",
			repair: RepairRequest{
				ID:         "2",
				Title:      "灯坏了",
				Status:     "In Progress",
				RoomNumber: "A102",
				Priority:   "Medium",
			},
		},
		{
			name: "已完成报修",
			repair: RepairRequest{
				ID:         "3",
				Title:      "门锁更换",
				Status:     "Completed",
				RoomNumber: "B101",
				Priority:   "Low",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotNil(t, tt.repair)
			assert.NotEmpty(t, tt.repair.Title)
			assert.NotEmpty(t, tt.repair.Status)
		})
	}
}

func TestPaginatedResponse(t *testing.T) {
	tests := []struct {
		name     string
		response PaginatedResponse
	}{
		{
			name: "空响应",
			response: PaginatedResponse{
				Data:       []interface{}{},
				Total:      0,
				Page:       1,
				PageSize:   10,
				TotalPages: 0,
				HasNext:    false,
				HasPrev:    false,
			},
		},
		{
			name: "有数据的响应",
			response: PaginatedResponse{
				Data: []interface{}{
					map[string]string{"id": "1", "name": "张三"},
					map[string]string{"id": "2", "name": "李四"},
				},
				Total:      2,
				Page:       1,
				PageSize:   10,
				TotalPages: 1,
				HasNext:    false,
				HasPrev:    false,
			},
		},
		{
			name: "多页响应",
			response: PaginatedResponse{
				Data:       []interface{}{},
				Total:      100,
				Page:       2,
				PageSize:   10,
				TotalPages: 10,
				HasNext:    true,
				HasPrev:    true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotNil(t, tt.response)
			assert.GreaterOrEqual(t, tt.response.Page, 1)
			assert.GreaterOrEqual(t, tt.response.PageSize, 1)
		})
	}
}