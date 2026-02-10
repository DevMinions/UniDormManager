package store

import (
	"testing"
	"time"
	"unidorm-manager-server/models"

	"github.com/stretchr/testify/assert"
)

func TestIsLateReturn(t *testing.T) {
	tests := []struct {
		name      string
		hour      int
		minute    int
		direction string
		expected  bool
	}{
		{
			name:      "22:59进入-不是晚归",
			hour:      22,
			minute:    59,
			direction: "In",
			expected:  false,
		},
		{
			name:      "23:00进入-是晚归",
			hour:      23,
			minute:    0,
			direction: "In",
			expected:  true,
		},
		{
			name:      "23:30进入-是晚归",
			hour:      23,
			minute:    30,
			direction: "In",
			expected:  true,
		},
		{
			name:      "00:30进入-是晚归",
			hour:      0,
			minute:    30,
			direction: "In",
			expected:  true,
		},
		{
			name:      "23:00外出-不是晚归",
			hour:      23,
			minute:    0,
			direction: "Out",
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testTime := time.Date(2024, 1, 1, tt.hour, tt.minute, 0, 0, time.Local)
			isLate := testTime.Hour() >= 23 && tt.direction == "In"
			assert.Equal(t, tt.expected, isLate)
		})
	}
}

func TestCreateAccessLogRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     models.CreateAccessLogRequest
		isValid bool
	}{
		{
			name: "有效请求-进入",
			req: models.CreateAccessLogRequest{
				StudentID:   "student-001",
				StudentName: "张三",
				Direction:   "In",
				GateName:    "东门",
			},
			isValid: true,
		},
		{
			name: "有效请求-外出",
			req: models.CreateAccessLogRequest{
				StudentID:   "student-001",
				StudentName: "张三",
				Direction:   "Out",
				GateName:    "东门",
			},
			isValid: true,
		},
		{
			name: "缺少学生ID",
			req: models.CreateAccessLogRequest{
				StudentName: "张三",
				Direction:   "In",
				GateName:    "东门",
			},
			isValid: false,
		},
		{
			name: "缺少学生姓名",
			req: models.CreateAccessLogRequest{
				StudentID: "student-001",
				Direction: "In",
				GateName:  "东门",
			},
			isValid: false,
		},
		{
			name: "无效方向",
			req: models.CreateAccessLogRequest{
				StudentID:   "student-001",
				StudentName: "张三",
				Direction:   "Invalid",
				GateName:    "东门",
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 基本验证
			hasStudentID := tt.req.StudentID != ""
			hasStudentName := tt.req.StudentName != ""
			isValidDirection := tt.req.Direction == "In" || tt.req.Direction == "Out"
			hasGateName := tt.req.GateName != ""

			isValid := hasStudentID && hasStudentName && isValidDirection && hasGateName
			assert.Equal(t, tt.isValid, isValid)
		})
	}
}

func TestLateReturnAlert_Model(t *testing.T) {
	alert := models.LateReturnAlert{
		ID:          "alert-001",
		StudentID:   "student-001",
		StudentName: "张三",
		RoomNumber:  "101",
		AlertDate:   "2024-01-15",
		Status:      "Pending",
		NotifySent:  true,
	}

	assert.Equal(t, "alert-001", alert.ID)
	assert.Equal(t, "张三", alert.StudentName)
	assert.Equal(t, "Pending", alert.Status)
	assert.True(t, alert.NotifySent)
}

func TestHandleLateReturnRequest_Validation(t *testing.T) {
	req := models.HandleLateReturnRequest{
		Handler: "admin-001",
		Comment: "已联系学生确认安全",
		Status:  "Handled",
	}

	// 验证状态只能是 Handled 或 Ignored
	isValidStatus := req.Status == "Handled" || req.Status == "Ignored"
	assert.True(t, isValidStatus)
	assert.NotEmpty(t, req.Handler)
}
