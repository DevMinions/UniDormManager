package utils

import (
	"context"
	"regexp"
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"

	"unidorm-manager-server/models"
)

func TestOrderByRejectsInjection(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM students")
	qb.OrderBy("status", "ASC; DROP TABLE students--")
	assert.Contains(t, qb.baseQuery, "ORDER BY status DESC")
	assert.NotContains(t, qb.baseQuery, "DROP")
}

func TestOrderByValidOrdersPreserved(t *testing.T) {
	qbAsc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbAsc.OrderBy("name", "asc")
	assert.Contains(t, qbAsc.baseQuery, "ORDER BY name ASC")

	qbDesc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbDesc.OrderBy("name", "DESC")
	assert.Contains(t, qbDesc.baseQuery, "ORDER BY name DESC")
}

func TestOrderByNonWhitelistedColumnIgnored(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qb.OrderBy("evil_col", "ASC")
	assert.NotContains(t, qb.baseQuery, "ORDER BY")
}

// ---- 占位符 / args 对齐回归（抓 B6/B6b 重复 append）----

// placeholderRe 匹配 SQL 中的 $1 / $2 ... 占位符。
var placeholderRe = regexp.MustCompile(`\$(\d+)`)

// assertPlaceholdersMatchArgs 校验 query_builder 的核心不变量：
//  1. SQL 中最大占位符编号 == len(args)（多/少一个 arg 都失败 → 抓 B6/B6b 重复 append）
//  2. 占位符 $1..$N 连续无跳号、无重复（跳号意味着某个 arg 错位）
//
// 这是 pgx 在运行期对参数绑定的硬性要求；任何违反都会让该查询在真库上直接报错。
func assertPlaceholdersMatchArgs(t *testing.T, name, sql string, args []interface{}) {
	t.Helper()

	matches := placeholderRe.FindAllStringSubmatch(sql, -1)
	seen := map[int]bool{}
	maxN := 0
	for _, m := range matches {
		// 占位符正则保证 m[1] 是纯数字。
		n := 0
		for _, c := range m[1] {
			n = n*10 + int(c-'0')
		}
		seen[n] = true
		if n > maxN {
			maxN = n
		}
	}

	if maxN != len(args) {
		t.Errorf("%s: 最大占位符 $%d 与 len(args)=%d 不一致\nSQL: %s\nargs: %v",
			name, maxN, len(args), sql, args)
	}

	var missing []int
	for i := 1; i <= maxN; i++ {
		if !seen[i] {
			missing = append(missing, i)
		}
	}
	if len(missing) > 0 {
		sort.Ints(missing)
		t.Errorf("%s: 占位符跳号，缺失 %v\nSQL: %s", name, missing, sql)
	}
}

// baseReq 返回一个会触发 OrderBy + LimitOffset 的标准分页请求。
func baseReq() *models.PaginatedRequest {
	return &models.PaginatedRequest{
		Page:      2,
		PageSize:  10,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
}

// checkBoth 对 data / count 两个 builder 同时跑对齐断言。
func checkBoth(t *testing.T, data, count *QueryBuilder) {
	t.Helper()
	dSQL, dArgs := data.BuildQuery()
	assertPlaceholdersMatchArgs(t, "data", dSQL, dArgs)
	cSQL, cArgs := count.BuildCountQuery()
	assertPlaceholdersMatchArgs(t, "count", cSQL, cArgs)
}

func TestBuildStudentQuery_PlaceholderAlignment(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name   string
		req    *models.PaginatedRequest
		filter *models.StudentFilter
	}{
		{"empty", baseReq(), &models.StudentFilter{}},
		{"search", &models.PaginatedRequest{Page: 1, PageSize: 10, Search: "张"}, &models.StudentFilter{}},
		{"all-filters", baseReq(), &models.StudentFilter{Status: "active", Major: "CS", Room: "101", Building: "A"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			data, count := BuildStudentQuery(ctx, tc.req, tc.filter)
			checkBoth(t, data, count)
		})
	}
}

func TestBuildRoomQuery_PlaceholderAlignment(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name   string
		filter *models.RoomFilter
	}{
		{"empty", &models.RoomFilter{}},
		{"status-type", &models.RoomFilter{Status: "available", Type: "standard"}},
		{"building-in", &models.RoomFilter{Building: "A,B,C"}},
		{"capacity-range", &models.RoomFilter{CapacityMin: 2, CapacityMax: 6}},
		{"all", &models.RoomFilter{Status: "available", Type: "standard", Building: "A,B", CapacityMin: 2, CapacityMax: 6}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			data, count := BuildRoomQuery(ctx, baseReq(), tc.filter)
			checkBoth(t, data, count)
		})
	}
}

func TestBuildAccessLogQuery_PlaceholderAlignment(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name   string
		filter *models.AccessLogFilter
	}{
		{"empty", &models.AccessLogFilter{}},
		{"direction", &models.AccessLogFilter{Direction: "in"}},
		{"date-range", &models.AccessLogFilter{DateFrom: "2026-01-01", DateTo: "2026-02-01"}},
		{"gate", &models.AccessLogFilter{GateName: "南门"}},
		{"all", &models.AccessLogFilter{Status: "normal", Direction: "in", GateName: "南门", DateFrom: "2026-01-01", DateTo: "2026-02-01"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			data, count := BuildAccessLogQuery(ctx, baseReq(), tc.filter)
			checkBoth(t, data, count)
		})
	}
}

func TestBuildLateReturnQuery_PlaceholderAlignment(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name   string
		filter *models.LateReturnFilter
	}{
		{"empty", &models.LateReturnFilter{}},
		{"date-range", &models.LateReturnFilter{AlertDateFrom: "2026-01-01", AlertDateTo: "2026-02-01"}},
		{"all", &models.LateReturnFilter{Status: "pending", AlertDateFrom: "2026-01-01", AlertDateTo: "2026-02-01"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			data, count := BuildLateReturnQuery(ctx, baseReq(), tc.filter)
			checkBoth(t, data, count)
		})
	}
}
