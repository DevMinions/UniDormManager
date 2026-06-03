package utils

import (
	"context"
	"testing"

	"unidorm-manager-server/models"
)

// fuzzCheckAligned 复用 Tier 1 的不变量：fuzz 出来的任意输入下，
// data/count 两个查询的占位符编号都必须与 args 数量严格对齐、无跳号。
// 这是把"任何输入都不能产生 pgx 会拒绝的 SQL"作为属性来验证。
func fuzzCheckAligned(t *testing.T, data, count *QueryBuilder) {
	t.Helper()
	dSQL, dArgs := data.BuildQuery()
	assertPlaceholdersMatchArgs(t, "data", dSQL, dArgs)
	cSQL, cArgs := count.BuildCountQuery()
	assertPlaceholdersMatchArgs(t, "count", cSQL, cArgs)
}

// FuzzBuildStudentQuery fuzz 学生查询的全部外部入参（search/sort + 四个 filter 列）。
func FuzzBuildStudentQuery(f *testing.F) {
	f.Add("张三", "created_at", "asc", "Active", "CS", "101", "A")
	f.Add("", "", "", "", "", "", "")
	f.Add("'; DROP TABLE students;--", "name", "desc", "All", "", "", "")
	f.Add("a%_b", "evil_col", "", "x", "y", "z", "w")

	f.Fuzz(func(t *testing.T, search, sortBy, sortOrder, status, major, room, building string) {
		req := &models.PaginatedRequest{
			Page: 1, PageSize: 10,
			Search: search, SortBy: sortBy, SortOrder: sortOrder,
		}
		filter := &models.StudentFilter{Status: status, Major: major, Room: room, Building: building}
		data, count := BuildStudentQuery(context.Background(), req, filter)
		fuzzCheckAligned(t, data, count)
	})
}

// FuzzBuildAccessLogQuery fuzz 门禁查询入参——B6 修复点，重点确保任意 Direction/日期组合都对齐。
func FuzzBuildAccessLogQuery(f *testing.F) {
	f.Add("李四", "in", "南门", "2026-01-01", "2026-02-01", "normal")
	f.Add("", "", "", "", "", "")
	f.Add("\x00", "in'--", "门", "not-a-date", "", "All")

	f.Fuzz(func(t *testing.T, search, direction, gate, dateFrom, dateTo, status string) {
		req := &models.PaginatedRequest{Page: 1, PageSize: 10, Search: search}
		filter := &models.AccessLogFilter{
			Direction: direction, GateName: gate,
			DateFrom: dateFrom, DateTo: dateTo, Status: status,
		}
		data, count := BuildAccessLogQuery(context.Background(), req, filter)
		fuzzCheckAligned(t, data, count)
	})
}
