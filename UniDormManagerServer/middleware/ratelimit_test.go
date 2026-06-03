package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestMemLimiterAllowsUpToLimit(t *testing.T) {
	m := &memLimiter{hits: make(map[string][]time.Time)}
	for i := 0; i < 3; i++ {
		assert.True(t, m.allow("k", 3, time.Minute), "第 %d 次应放行", i+1)
	}
	assert.False(t, m.allow("k", 3, time.Minute), "超过 limit 应拒绝")
}

func TestRateLimitLoginReturns429(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/login", RateLimitLogin(2, time.Minute), func(c *gin.Context) { c.Status(200) })
	do := func() int {
		req := httptest.NewRequest("POST", "/login", nil)
		req.RemoteAddr = "1.2.3.4:5555"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}
	assert.Equal(t, 200, do())
	assert.Equal(t, 200, do())
	assert.Equal(t, http.StatusTooManyRequests, do())
}
