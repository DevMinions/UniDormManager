package monitoring

import (
	"runtime"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// 系统指标
var (
	// HTTP请求数量
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "HTTP请求总数",
		},
		[]string{"method", "endpoint", "status"},
	)

	// HTTP请求持续时间
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP请求持续时间",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	// 数据库查询数量
	dbQueriesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "db_queries_total",
			Help: "数据库查询总数",
		},
		[]string{"operation", "table"},
	)

	// 数据库查询持续时间
	dbQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "db_query_duration_seconds",
			Help:    "数据库查询持续时间",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"operation", "table"},
	)

	// 缓存操作数量
	cacheOperationsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_operations_total",
			Help: "缓存操作总数",
		},
		[]string{"operation", "result"},
	)

	// 活跃用户数
	activeUsers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_users",
			Help: "当前活跃用户数",
		},
	)

	// 系统资源使用
	systemMetrics = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "system_metrics",
			Help: "系统资源使用指标",
		},
		[]string{"metric"},
	)
)

// RecordHTTPRequest 记录HTTP请求指标
func RecordHTTPRequest(method, endpoint, status string, duration time.Duration) {
	httpRequestsTotal.WithLabelValues(method, endpoint, status).Inc()
	httpRequestDuration.WithLabelValues(method, endpoint).Observe(duration.Seconds())
}

// RecordDBQuery 记录数据库查询指标
func RecordDBQuery(operation, table string, duration time.Duration) {
	dbQueriesTotal.WithLabelValues(operation, table).Inc()
	dbQueryDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// RecordCacheOperation 记录缓存操作指标
func RecordCacheOperation(operation, result string) {
	cacheOperationsTotal.WithLabelValues(operation, result).Inc()
}

// UpdateActiveUsers 更新活跃用户数
func UpdateActiveUsers(count float64) {
	activeUsers.Set(count)
}

// UpdateSystemMetrics 更新系统指标
func UpdateSystemMetrics() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// 内存使用（字节）
	systemMetrics.WithLabelValues("memory_alloc_bytes").Set(float64(m.Alloc))
	systemMetrics.WithLabelValues("memory_total_alloc_bytes").Set(float64(m.TotalAlloc))
	systemMetrics.WithLabelValues("memory_sys_bytes").Set(float64(m.Sys))

	// Goroutine数量
	systemMetrics.WithLabelValues("goroutines").Set(float64(runtime.NumGoroutine()))

	// GC相关信息
	systemMetrics.WithLabelValues("gc_pause_total_ns").Set(float64(m.PauseTotalNs))
	systemMetrics.WithLabelValues("gc_num_gc").Set(float64(m.NumGC))
}

// 业务指标
var (
	// 登录次数
	loginAttemptsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "login_attempts_total",
			Help: "登录尝试次数",
		},
		[]string{"result"},
	)

	// 学生数量
	studentsTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "students_total",
			Help: "学生总数",
		},
	)

	// 房间数量
	roomsTotal = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "rooms_total",
			Help: "房间总数",
		},
	)

	// 维修申请数量
	repairRequestsTotal = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "repair_requests_total",
			Help: "维修申请数量",
		},
		[]string{"status"},
	)
)

// RecordLoginAttempt 记录登录尝试
func RecordLoginAttempt(result string) {
	loginAttemptsTotal.WithLabelValues(result).Inc()
}

// UpdateStudentsTotal 更新学生总数
func UpdateStudentsTotal(count float64) {
	studentsTotal.Set(count)
}

// UpdateRoomsTotal 更新房间总数
func UpdateRoomsTotal(count float64) {
	roomsTotal.Set(count)
}

// UpdateRepairRequestsTotal 更新维修申请数量
func UpdateRepairRequestsTotal(status string, count float64) {
	repairRequestsTotal.WithLabelValues(status).Set(count)
}