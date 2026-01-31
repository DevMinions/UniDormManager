package logger

import (
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Logger *logrus.Logger

// InitLogger 初始化日志系统
func InitLogger(logLevel string, logFile string) error {
	Logger = logrus.New()

	// 设置日志级别
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		level = logrus.InfoLevel
	}
	Logger.SetLevel(level)

	// 设置日志格式
	Logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "timestamp",
			logrus.FieldKeyLevel: "level",
			logrus.FieldKeyMsg:   "message",
		},
	})

	// 设置日志输出
	if logFile != "" {
		// 确保日志目录存在
		logDir := filepath.Dir(logFile)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			return err
		}

		// 日志轮转配置
		logRotate := &lumberjack.Logger{
			Filename:   logFile,
			MaxSize:    100, // MB
			MaxBackups: 5,
			MaxAge:     30, // days
			Compress:   true,
		}

		Logger.SetOutput(logRotate)
	} else {
		Logger.SetOutput(os.Stdout)
	}

	Logger.Info("日志系统初始化完成")
	return nil
}

// GinLogger 返回Gin中间件
func GinLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// 处理请求
		c.Next()

		// 记录日志
		duration := time.Since(start)
		status := c.Writer.Status()

		entry := Logger.WithFields(logrus.Fields{
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     status,
			"duration":   duration.Milliseconds(),
			"ip":         c.ClientIP(),
			"user_agent": c.Request.UserAgent(),
		})

		// 根据状态码设置日志级别
		switch {
		case status >= 500:
			entry.Error("内部服务器错误")
		case status >= 400:
			entry.Warn("客户端错误")
		default:
			entry.Info("请求处理")
		}
	}
}

// LogRequest 记录请求日志
func LogRequest(method, path string, userID interface{}, data interface{}) {
	Logger.WithFields(logrus.Fields{
		"action": "api_request",
		"method": method,
		"path":   path,
		"user":   userID,
		"data":   data,
	}).Info("API请求")
}

// LogError 记录错误日志
func LogError(err error, context map[string]interface{}) {
	fields := logrus.Fields{
		"error": err.Error(),
	}

	// 添加上下文信息
	for k, v := range context {
		fields[k] = v
	}

	Logger.WithFields(fields).Error("系统错误")
}

// LogSecurity 记录安全相关日志
func LogSecurity(event string, details map[string]interface{}) {
	fields := logrus.Fields{
		"event":   event,
		"level":   "security",
		"ip":      details["ip"],
		"user":    details["user"],
		"details": details,
	}

	Logger.WithFields(fields).Warn("安全事件")
}

// LogPerformance 记录性能日志
func LogPerformance(operation string, duration time.Duration, details map[string]interface{}) {
	fields := logrus.Fields{
		"operation": operation,
		"duration":  duration.Milliseconds(),
		"level":     "performance",
	}

	// 添加详细信息
	for k, v := range details {
		fields[k] = v
	}

	if duration > time.Second {
		Logger.WithFields(fields).Warn("慢查询")
	} else {
		Logger.WithFields(fields).Info("性能日志")
	}
}

// LogDatabase 记录数据库操作日志
func LogDatabase(operation string, table string, duration time.Duration, rows int) {
	Logger.WithFields(logrus.Fields{
		"operation": operation,
		"table":     table,
		"duration":  duration.Milliseconds(),
		"rows":      rows,
		"level":     "database",
	}).Info("数据库操作")
}

// LogCache 记录缓存操作日志
func LogCache(operation string, key string, hit bool) {
	fields := logrus.Fields{
		"operation": operation,
		"key":       key,
		"hit":       hit,
		"level":     "cache",
	}

	if hit {
		Logger.WithFields(fields).Debug("缓存命中")
	} else {
		Logger.WithFields(fields).Debug("缓存未命中")
	}
}

// LogUserAction 记录用户操作日志
func LogUserAction(userID string, action string, resource string, details interface{}) {
	Logger.WithFields(logrus.Fields{
		"user_id":  userID,
		"action":   action,
		"resource": resource,
		"details":  details,
		"level":    "user_action",
	}).Info("用户操作")
}

// LogSystem 记录系统事件
func LogSystem(event string, details map[string]interface{}) {
	Logger.WithFields(logrus.Fields{
		"event":   event,
		"level":   "system",
		"details": details,
	}).Info("系统事件")
}