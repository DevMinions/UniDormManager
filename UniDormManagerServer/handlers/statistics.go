package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"unidorm-manager-server/database"
	"unidorm-manager-server/middleware"
)

// StatisticsHandler 时序统计处理器。
// 与 DashboardHandler 区别:Dashboard 给的是当前快照(总数、入住率等);
// Statistics 给的是按日聚合的时序数据,前端用来画趋势图。
type StatisticsHandler struct{}

// NewStatisticsHandler 创建时序统计处理器
func NewStatisticsHandler() *StatisticsHandler {
	return &StatisticsHandler{}
}

// repairsDayRow 单日报修聚合
type repairsDayRow struct {
	Day       string `json:"day"`       // YYYY-MM-DD
	Total     int    `json:"total"`     // 当日新增报修
	Completed int    `json:"completed"` // 当日完成数
	Pending   int    `json:"pending"`   // 当日新增中至今仍 Pending
}

// GetRepairsByDay GET /api/statistics/repairs-by-day?days=30
//
// 返回过去 N 天(含今天)每天的报修聚合,缺日补 0,适合前端 LineChart。
// days 范围 [1,180], 默认 30。
func (h *StatisticsHandler) GetRepairsByDay(c *gin.Context) {
	days := 30
	if q := c.Query("days"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n >= 1 && n <= 180 {
			days = n
		}
	}

	const q = `
		WITH days AS (
			SELECT generate_series(
				CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day',
				CURRENT_DATE,
				'1 day'
			)::date AS day
		)
		SELECT
			TO_CHAR(d.day, 'YYYY-MM-DD') AS day,
			COALESCE(COUNT(r.id), 0) AS total,
			COALESCE(SUM(CASE WHEN r.status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed,
			COALESCE(SUM(CASE WHEN r.status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending
		FROM days d
		LEFT JOIN repair_requests r
			ON date_trunc('day', r.created_at)::date = d.day
		GROUP BY d.day
		ORDER BY d.day
	`
	ctx := context.Background()
	rows, err := database.DB.Query(ctx, q, days)
	if err != nil {
		middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "查询报修时序失败")
		return
	}
	defer rows.Close()

	out := make([]repairsDayRow, 0, days)
	for rows.Next() {
		var r repairsDayRow
		if err := rows.Scan(&r.Day, &r.Total, &r.Completed, &r.Pending); err != nil {
			middleware.WriteError(c, http.StatusInternalServerError, "internal_error", "扫描报修时序失败")
			return
		}
		out = append(out, r)
	}
	c.JSON(http.StatusOK, gin.H{"days": days, "data": out})
}
