//go:build integration

// Tier 2 集成测试：用 testcontainers 起真实 PostgreSQL，跑 store 层 pgx 往返。
// 默认 `go test ./...` 不会编译本文件（无 integration tag），不依赖 Docker。
// 运行：go test -tags=integration -run Integration ./store/
package store

import (
	"context"
	"os"
	"testing"

	"unidorm-manager-server/config"
	"unidorm-manager-server/database"
	"unidorm-manager-server/models"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// TestMain 起一个全测试共享的 postgres 容器，并用项目自己的 InitDatabase 建表/初始化，
// 确保测试 schema 与生产 createTables 完全一致（不维护第二套 DDL）。
func TestMain(m *testing.M) {
	ctx := context.Background()

	container, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2),
		),
	)
	if err != nil {
		panic("failed to start postgres container: " + err.Error())
	}

	host, err := container.Host(ctx)
	if err != nil {
		panic(err)
	}
	port, err := container.MappedPort(ctx, "5432/tcp")
	if err != nil {
		panic(err)
	}

	cfg := config.LoadConfig()
	cfg.Database.Host = host
	cfg.Database.Port = port.Port()
	cfg.Database.User = "test"
	cfg.Database.Password = "test"
	cfg.Database.DBName = "testdb"
	cfg.Database.SSLMode = "disable"

	if err := database.InitDatabase(cfg); err != nil {
		_ = container.Terminate(ctx)
		panic("InitDatabase failed: " + err.Error())
	}

	code := m.Run()

	database.CloseDatabase()
	_ = container.Terminate(ctx)
	os.Exit(code)
}

// truncate 清空指定表，保证每个子测试从干净状态起，断言可确定。
func truncate(t *testing.T, tables ...string) {
	t.Helper()
	for _, tbl := range tables {
		_, err := database.DB.Exec(context.Background(), "TRUNCATE TABLE "+tbl+" CASCADE")
		require.NoError(t, err)
	}
}

func TestStudentCRUD_Integration(t *testing.T) {
	truncate(t, "students")
	s := NewDBStore(false)

	created := s.CreateStudent(&models.CreateStudentRequest{
		Name:      "张三",
		StudentID: "2026001",
		Major:     "计算机",
		Status:    "Active",
	})
	require.NotNil(t, created)
	require.NotEmpty(t, created.ID)

	got, ok := s.GetStudentByID(created.ID)
	require.True(t, ok)
	require.Equal(t, "张三", got.Name)
	require.Equal(t, "2026001", got.StudentID)

	// 分页列表 + 搜索：真实跑 BuildStudentQuery 的 SQL（含 $n 绑定）。
	resp, err := s.GetStudentsPaginated(
		&models.PaginatedRequest{Page: 1, PageSize: 10, Search: "张"},
		&models.StudentFilter{},
	)
	require.NoError(t, err)
	require.Equal(t, int64(1), resp.Total)

	require.True(t, s.DeleteStudent(created.ID))
	_, ok = s.GetStudentByID(created.ID)
	require.False(t, ok)
}

// TestAccessLogDirectionFilter_Integration 是 B6/B6b 修复的端到端回归：
// 修复前 BuildAccessLogQuery 对 Direction filter 重复 append arg，导致 $n 跳号，
// pgx 在真库 bind 时直接报参数不匹配 —— 本测试此前必然失败。
func TestAccessLogDirectionFilter_Integration(t *testing.T) {
	truncate(t, "access_logs")
	s := NewDBStore(false)

	for _, d := range []string{"In", "Out", "In"} {
		_, err := s.CreateAccessLog(&models.CreateAccessLogRequest{
			StudentID:   "stu-1",
			StudentName: "李四",
			RoomNumber:  "101",
			Direction:   d,
			GateName:    "东门",
		})
		require.NoError(t, err)
	}

	resp, err := s.GetAccessLogsPaginated(
		&models.PaginatedRequest{Page: 1, PageSize: 10},
		&models.AccessLogFilter{Direction: "In"},
	)
	require.NoError(t, err, "Direction filter 应能正常绑定参数（B6 修复后）")
	require.Equal(t, int64(2), resp.Total, "应只返回 2 条 In 方向记录")
}
