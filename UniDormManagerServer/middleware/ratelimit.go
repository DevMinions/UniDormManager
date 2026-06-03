package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"unidorm-manager-server/cache"
)

// memLimiter USE_CACHE=false（无 Redis）时的进程内滑动窗口回退。
// 仅适用于开发/单实例；生产应开 Redis（TTL 自动回收 + 多副本一致）。
// 不活动 IP 的 key 不会主动清理——高基数场景应走 Redis 路径,此回退不承担。
type memLimiter struct {
	mu   sync.Mutex
	hits map[string][]time.Time
}

var memLim = &memLimiter{hits: make(map[string][]time.Time)}

func (m *memLimiter) allow(key string, limit int, window time.Duration) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	cutoff := time.Now().Add(-window)
	var kept []time.Time
	for _, t := range m.hits[key] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= limit {
		m.hits[key] = kept
		return false
	}
	m.hits[key] = append(kept, time.Now())
	return true
}

// RateLimitLogin 按客户端 IP 限制登录频率，防撞库
func RateLimitLogin(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := "ratelimit:login:" + c.ClientIP()
		allowed := true
		if cache.Cache != nil {
			ctx := c.Request.Context()
			count, err := cache.Cache.Incr(ctx, key).Result()
			if err == nil {
				if count == 1 {
					// 设 TTL；失败则删 key,避免无过期导致永久封锁(fail-open)
					if expErr := cache.Cache.Expire(ctx, key, window).Err(); expErr != nil {
						cache.Cache.Del(ctx, key)
					}
				}
				allowed = count <= int64(limit)
			} // Redis 故障则放行，避免限流器故障拒绝合法登录
		} else {
			allowed = memLim.allow(key, limit, window)
		}
		if !allowed {
			c.Header("Retry-After", strconv.Itoa(int(window.Seconds())))
			WriteError(c, http.StatusTooManyRequests, "rate_limited", "登录尝试过于频繁，请稍后再试")
			c.Abort()
			return
		}
		c.Next()
	}
}
