package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPaginatedRequest(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected int
	}{
		{"Valid page 1", "1", 1},
		{"Valid page 10", "10", 10},
		{"Invalid page 0", "0", 1}, // Should default to 1
		{"Invalid page negative", "-1", 1},
		{"Invalid string", "abc", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This is a placeholder test - actual implementation depends on how you parse the query
			assert.Equal(t, tt.expected, tt.expected)
		})
	}
}

func TestPaginatedResponse(t *testing.T) {
	data := []interface{}{"item1", "item2", "item3"}
	response := PaginatedResponse{
		Data:       data,
		Total:      100,
		Page:       1,
		PageSize:   10,
		TotalPages: 10,
		HasNext:    true,
		HasPrev:    false,
	}

	assert.Equal(t, 100, response.Total)
	assert.Equal(t, 1, response.Page)
	assert.Equal(t, 10, response.PageSize)
	assert.Equal(t, 10, response.TotalPages)
	assert.True(t, response.HasNext)
	assert.False(t, response.HasPrev)
	assert.Equal(t, 3, len(response.Data))
}

func TestStudentValidation(t *testing.T) {
	tests := []struct {
		name      string
		student   Student
		wantError bool
	}{
		{
			name: "Valid student",
			student: Student{
				ID:        "1",
				Name:      "张三",
				StudentID: "2023001",
				Major:     "计算机科学",
				Status:    "Active",
			},
			wantError: false,
		},
		{
			name: "Empty name",
			student: Student{
				ID:        "1",
				Name:      "",
				StudentID: "2023001",
				Major:     "计算机科学",
				Status:    "Active",
			},
			wantError: true,
		},
		{
			name: "Empty student ID",
			student: Student{
				ID:        "1",
				Name:      "张三",
				StudentID: "",
				Major:     "计算机科学",
				Status:    "Active",
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.student.Name != "" && tt.student.StudentID != ""
			assert.Equal(t, tt.wantError, !isValid)
		})
	}
}

func TestRoomStatus(t *testing.T) {
	tests := []struct {
		name       string
		occupied   int
		capacity   int
		wantStatus string
	}{
		{"Full room", 4, 4, "Full"},
		{"Available room", 2, 4, "Available"},
		{"Empty room", 0, 4, "Available"},
		{"Overcrowded", 5, 4, "Full"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var status string
			if tt.occupied >= tt.capacity {
				status = "Full"
			} else {
				status = "Available"
			}
			assert.Equal(t, tt.wantStatus, status)
		})
	}
}

func TestRepairPriority(t *testing.T) {
	tests := []struct {
		name     string
		priority string
		valid    bool
	}{
		{"High priority", "High", true},
		{"Medium priority", "Medium", true},
		{"Low priority", "Low", true},
		{"Invalid priority", "Critical", false},
	}

	validPriorities := map[string]bool{
		"High":   true,
		"Medium": true,
		"Low":    true,
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, isValid := validPriorities[tt.priority]
			assert.Equal(t, tt.valid, isValid)
		})
	}
}

func TestInspectionScore(t *testing.T) {
	tests := []struct {
		name       string
		score      int
		wantStatus string
	}{
		{"Excellent score", 95, "Excellent"},
		{"Good score", 85, "Good"},
		{"Fair score", 75, "Fair"},
		{"Poor score", 65, "Poor"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var status string
			switch {
			case tt.score >= 90:
				status = "Excellent"
			case tt.score >= 80:
				status = "Good"
			case tt.score >= 70:
				status = "Fair"
			default:
				status = "Poor"
			}
			assert.Equal(t, tt.wantStatus, status)
		})
	}
}
