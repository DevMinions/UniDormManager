package main

import (
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"unidorm-manager-server/config"
	"unidorm-manager-server/handlers"
)

func hasRoute(r *gin.Engine, method, path string) bool {
	for _, ri := range r.Routes() {
		if ri.Method == method && ri.Path == path {
			return true
		}
	}
	return false
}

func TestWechatRouteGatedByEnv(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := handlers.NewAuthHandler()

	rProd := gin.New()
	setupAuthRoutes(rProd, h, &config.Config{Env: "production"}, 10, time.Minute)
	assert.False(t, hasRoute(rProd, "POST", "/api/auth/wechat/login"), "生产不应注册微信端点")
	assert.True(t, hasRoute(rProd, "POST", "/api/auth/login"), "普通登录始终存在")

	rDev := gin.New()
	setupAuthRoutes(rDev, h, &config.Config{Env: "development"}, 10, time.Minute)
	assert.True(t, hasRoute(rDev, "POST", "/api/auth/wechat/login"), "开发应注册微信端点")
}
