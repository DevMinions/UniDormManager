package main

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"unidorm-manager-server/auth"
	"unidorm-manager-server/cache"
	"unidorm-manager-server/config"
	"unidorm-manager-server/database"
	"unidorm-manager-server/handlers"
	"unidorm-manager-server/logger"
	"unidorm-manager-server/middleware"
	"unidorm-manager-server/monitoring"
	"unidorm-manager-server/scheduler"
	"unidorm-manager-server/store"
)

func main() {
	// 设置 Gin 模式（release, debug, test）
	gin.SetMode(gin.ReleaseMode)

	// 加载配置
	cfg := config.LoadConfig()

	// 初始化日志系统
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	logFile := os.Getenv("LOG_FILE")

	if err := logger.InitLogger(logLevel, logFile); err != nil {
		log.Printf("Failed to initialize logger: %v", err)
	} else {
		logger.LogSystem("系统启动", map[string]interface{}{
			"version": "v2.0",
			"mode":    gin.Mode(),
			"env":     os.Getenv("GIN_MODE"),
		})
	}

	// 设置 JWT 密钥（生产无强密钥拒绝启动）
	if err := auth.SetJWTSecret(os.Getenv("JWT_SECRET")); err != nil {
		if cfg.IsProduction() {
			log.Fatalf("生产环境 JWT 密钥无效，拒绝启动: %v", err)
		}
		log.Printf("⚠️  开发环境 JWT 密钥无效，使用随机临时密钥（重启失效）: %v", err)
		auth.SetRandomDevSecret()
	}

	// 必须初始化数据库
	log.Println("Initializing database connection...")
	if err := database.InitDatabase(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v\nPlease ensure PostgreSQL is running and configured correctly.", err)
	}
	defer database.CloseDatabase()
	log.Println("Database connected successfully")

	// 初始化 Redis 缓存（可选）
	useCache := os.Getenv("USE_CACHE") == "true"
	if useCache {
		log.Println("Initializing Redis cache...")
		if err := cache.InitCache(cfg); err != nil {
			log.Printf("Warning: Redis cache initialization failed: %v", err)
			log.Println("Continuing without cache")
			useCache = false
		} else {
			defer cache.CloseCache()
			log.Println("Redis cache connected successfully")
		}
	} else {
		log.Println("Redis cache disabled (set USE_CACHE=true to enable)")
	}

	// 创建数据库存储实例
	s := store.NewDBStore(useCache)

	// 创建处理器
	authHandler := handlers.NewAuthHandler()
	userHandler := handlers.NewUserHandler()
	roleHandler := handlers.NewRoleHandler()
	studentHandler := handlers.NewStudentHandler(s)
	buildingHandler := handlers.NewBuildingHandler(s)
	roomHandler := handlers.NewRoomHandler(s)
	repairHandler := handlers.NewRepairHandler(s)
	noticeHandler := handlers.NewNoticeHandler(s)
	dashboardHandler := handlers.NewDashboardHandler(s)
	inspectionHandler := handlers.NewInspectionHandler(s)
	roomSwapHandler := handlers.NewRoomSwapHandler(s)
	accessLogHandler := handlers.NewAccessLogHandler(s)
	lateReturnHandler := handlers.NewLateReturnHandler(s)
	uploadHandler := handlers.NewUploadHandler()
	statisticsHandler := handlers.NewStatisticsHandler()
	auditLogsHandler := handlers.NewAuditLogsHandler()

	// 创建 Gin 路由引擎
	r := gin.New()

	// 应用全局中间件
	r.Use(logger.GinLogger()) // 使用新的结构化日志中间件
	r.Use(middleware.CORS())
	r.Use(gin.Recovery()) // Gin 内置的恢复中间件

	// 登录限流配置（防暴力撞库）
	loginRateLimit := 10
	if v, err := strconv.Atoi(os.Getenv("LOGIN_RATE_LIMIT")); err == nil && v > 0 {
		loginRateLimit = v
	}
	loginRateWindow := 15 * time.Minute
	if v, err := time.ParseDuration(os.Getenv("LOGIN_RATE_WINDOW")); err == nil && v > 0 {
		loginRateWindow = v
	}

	// 认证路由（不需要认证）
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", middleware.RateLimitLogin(loginRateLimit, loginRateWindow), authHandler.Login)
		auth.POST("/wechat/login", authHandler.WechatLogin) // 微信登录（小程序）
		auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
	}

	// API 路由组（需要认证）
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware()) // 所有 API 都需要认证
	api.Use(middleware.AuditLog())       // 写操作自动记审计日志(异步)
	{
		// 通用文件上传（任意登录用户）
		api.POST("/upload", uploadHandler.UploadFile)

		// 调度器管理（admin 可见）
		api.GET("/scheduler/jobs", middleware.RequirePermission("users:read"), func(c *gin.Context) {
			c.JSON(200, gin.H{"jobs": scheduler.Jobs()})
		})

		// 时序统计（dashboard 趋势图用）
		statistics := api.Group("/statistics")
		statistics.Use(middleware.RequirePermission("dashboard:read"))
		{
			statistics.GET("/repairs-by-day", statisticsHandler.GetRepairsByDay)
		}

		// 审计日志(admin 可见,users:read 权限)
		api.GET("/audit-logs", middleware.RequirePermission("users:read"), auditLogsHandler.GetAuditLogs)
		api.GET("/audit-logs/stream", middleware.RequirePermission("users:read"), auditLogsHandler.StreamAuditLogs)

		// 用户管理路由（需要管理员权限）
		users := api.Group("/users")
		users.Use(middleware.RequirePermission("users:read"))
		{
			users.GET("", userHandler.GetAllUsers)
			users.GET("/:id", userHandler.GetUserByID)
			users.POST("", middleware.RequirePermission("users:create"), userHandler.CreateUser)
			users.PUT("/:id", middleware.RequirePermission("users:update"), userHandler.UpdateUser)
			users.DELETE("/:id", middleware.RequirePermission("users:delete"), userHandler.DeleteUser)
			users.POST("/:id/roles", middleware.RequirePermission("users:update"), userHandler.AssignRoles)
		}

		// 角色管理路由（需要管理员权限）
		roles := api.Group("/roles")
		roles.Use(middleware.RequirePermission("roles:read"))
		{
			roles.GET("", roleHandler.GetAllRoles)
			roles.GET("/:id", roleHandler.GetRoleByID)
			roles.POST("", middleware.RequirePermission("roles:create"), roleHandler.CreateRole)
			roles.PUT("/:id", middleware.RequirePermission("roles:update"), roleHandler.UpdateRole)
			roles.DELETE("/:id", middleware.RequirePermission("roles:delete"), roleHandler.DeleteRole)
		}

		// 权限管理路由
		permissions := api.Group("/permissions")
		permissions.Use(middleware.RequirePermission("roles:read"))
		{
			permissions.GET("", roleHandler.GetAllPermissions)
		}

		// 学生管理路由
		students := api.Group("/students")
		{
			// 传统的全量获取（保持兼容性）
			students.GET("/all", middleware.RequirePermission("students:read"), studentHandler.GetStudentsAll)
			// 新的分页获取（推荐使用）
			students.GET("", middleware.RequirePermission("students:read"), studentHandler.GetStudents)
			students.POST("", middleware.RequirePermission("students:create"), studentHandler.CreateStudent)
			students.GET("/:id", middleware.RequirePermission("students:read"), studentHandler.GetStudentByID)
			students.PUT("/:id", middleware.RequirePermission("students:update"), studentHandler.UpdateStudent)
			students.DELETE("/:id", middleware.RequirePermission("students:delete"), studentHandler.DeleteStudent)
		}

		// 楼栋管理路由
		buildings := api.Group("/buildings")
		{
			buildings.GET("", middleware.RequirePermission("buildings:read"), buildingHandler.GetAllBuildings)
			buildings.POST("", middleware.RequirePermission("buildings:create"), buildingHandler.CreateBuilding)
			buildings.GET("/:id", middleware.RequirePermission("buildings:read"), buildingHandler.GetBuildingByID)
			buildings.PUT("/:id", middleware.RequirePermission("buildings:update"), buildingHandler.UpdateBuilding)
			buildings.DELETE("/:id", middleware.RequirePermission("buildings:delete"), buildingHandler.DeleteBuilding)
		}

		// 房间管理路由
		rooms := api.Group("/rooms")
		{
			// 传统的全量获取（保持兼容性）
			rooms.GET("/all", middleware.RequirePermission("rooms:read"), roomHandler.GetRoomsAll)
			// 新的分页获取（推荐使用）
			rooms.GET("", middleware.RequirePermission("rooms:read"), roomHandler.GetRooms)
			rooms.POST("", middleware.RequirePermission("rooms:create"), roomHandler.CreateRoom)
			rooms.GET("/:id", middleware.RequirePermission("rooms:read"), roomHandler.GetRoomByID)
			rooms.PUT("/:id", middleware.RequirePermission("rooms:update"), roomHandler.UpdateRoom)
			rooms.DELETE("/:id", middleware.RequirePermission("rooms:delete"), roomHandler.DeleteRoom)
		}

		// 报修管理路由
		repairs := api.Group("/repairs")
		{
			// 传统的全量获取（保持兼容性）
			repairs.GET("/all", middleware.RequirePermission("repairs:read"), repairHandler.GetRepairRequestsAll)
			// 新的分页获取（推荐使用）
			repairs.GET("", middleware.RequirePermission("repairs:read"), repairHandler.GetRepairRequests)
			repairs.POST("", middleware.RequirePermission("repairs:create"), repairHandler.CreateRepairRequest)
			repairs.GET("/:id", middleware.RequirePermission("repairs:read"), repairHandler.GetRepairRequestByID)
			repairs.PUT("/:id", middleware.RequirePermission("repairs:update"), repairHandler.UpdateRepairRequest)
			repairs.DELETE("/:id", middleware.RequirePermission("repairs:delete"), repairHandler.DeleteRepairRequest)
		}

		// 公告管理路由
		notices := api.Group("/notices")
		{
			notices.GET("", middleware.RequirePermission("notices:read"), noticeHandler.GetAllNotices)
			notices.POST("", middleware.RequirePermission("notices:create"), noticeHandler.CreateNotice)
			notices.GET("/:id", middleware.RequirePermission("notices:read"), noticeHandler.GetNoticeByID)
			notices.PUT("/:id", middleware.RequirePermission("notices:update"), noticeHandler.UpdateNotice)
			notices.DELETE("/:id", middleware.RequirePermission("notices:delete"), noticeHandler.DeleteNotice)
		}

		// 仪表板路由
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/stats", middleware.RequirePermission("dashboard:read"), dashboardHandler.GetDashboardStats)
		}

		// 查寝管理路由
		inspections := api.Group("/inspections")
		{
			inspections.GET("", middleware.RequirePermission("inspections:read"), inspectionHandler.GetInspections)
			inspections.GET("/my", middleware.RequirePermission("inspections:read"), inspectionHandler.GetMyInspections)
			inspections.POST("", middleware.RequirePermission("inspections:create"), inspectionHandler.CreateInspection)
			inspections.GET("/rooms", middleware.RequirePermission("inspections:read"), inspectionHandler.GetInspectionRooms)
			inspections.GET("/rankings", middleware.RequirePermission("inspections:read"), inspectionHandler.GetInspectionRankings)
			inspections.GET("/:id", middleware.RequirePermission("inspections:read"), inspectionHandler.GetInspectionByID)
			inspections.PUT("/:id", middleware.RequirePermission("inspections:update"), inspectionHandler.UpdateInspection)
			inspections.DELETE("/:id", middleware.RequirePermission("inspections:delete"), inspectionHandler.DeleteInspection)
		}

		// 换寝申请路由
		roomSwaps := api.Group("/room-swaps")
		{
			roomSwaps.GET("", middleware.RequirePermission("room_swaps:read"), roomSwapHandler.GetApplications)
			roomSwaps.GET("/my-applications", roomSwapHandler.GetMyApplications)
			roomSwaps.GET("/pending", middleware.RequirePermission("room_swaps:read"), roomSwapHandler.GetPendingApplications)
			roomSwaps.GET("/history", roomSwapHandler.GetSwapHistory)
			roomSwaps.GET("/available", roomSwapHandler.GetAvailableRooms)
			roomSwaps.POST("", roomSwapHandler.ApplyRoomSwap)
			roomSwaps.POST("/:id/approve", middleware.RequirePermission("room_swaps:approve"), roomSwapHandler.ApproveRoomSwap)
			roomSwaps.DELETE("/:id", roomSwapHandler.CancelApplication)
		}

		// 门禁记录路由
		accessLogs := api.Group("/access-logs")
		{
			accessLogs.GET("", middleware.RequirePermission("access_logs:read"), accessLogHandler.GetAccessLogs)
			accessLogs.GET("/live", middleware.RequirePermission("access_logs:read"), accessLogHandler.GetLiveLogs)
			accessLogs.POST("", middleware.RequirePermission("access_logs:create"), accessLogHandler.CreateAccessLog)
		}

		// 晚归告警路由
		lateReturns := api.Group("/late-returns")
		{
			lateReturns.GET("", middleware.RequirePermission("late_returns:read"), lateReturnHandler.GetLateReturns)
			lateReturns.GET("/pending", middleware.RequirePermission("late_returns:read"), lateReturnHandler.GetPendingReturns)
			lateReturns.POST("/:id/handle", middleware.RequirePermission("late_returns:handle"), lateReturnHandler.HandleLateReturn)
		}
	}

	// 健康检查端点
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
			"cache":     useCache,
			"database":  "connected",
		})
	})

	// 添加监控端点 (Prometheus metrics)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// 静态文件服务（上传产物）
	r.Static("/uploads", "./uploads")

	// 启动后台任务：定期更新系统指标
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			monitoring.UpdateSystemMetrics()
		}
	}()

	// 启动周期任务调度器（晚归扫描、过期 token 清理等）
	scheduler.Start(s)
	defer scheduler.Stop()

	// 获取端口号，默认为 8080
	port := cfg.Port

	logger.LogSystem("服务器启动", map[string]interface{}{
		"port":    port,
		"api_url": "http://localhost:" + port + "/api",
		"health":  "http://localhost:" + port + "/health",
		"metrics": "http://localhost:" + port + "/metrics",
		"cache":   useCache,
	})

	// 启动服务器

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
