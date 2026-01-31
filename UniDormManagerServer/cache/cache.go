package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"unidorm-manager-server/config"
)

// Cache Redis 缓存客户端
var Cache *redis.Client
var ctx = context.Background()

// InitCache 初始化 Redis 缓存
func InitCache(cfg *config.Config) error {
	Cache = redis.NewClient(&redis.Options{
		Addr:     cfg.GetRedisAddr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// 测试连接
	if err := Cache.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis cache connected successfully")
	return nil
}

// CloseCache 关闭 Redis 连接
func CloseCache() {
	if Cache != nil {
		Cache.Close()
		log.Println("Redis cache connection closed")
	}
}

// Set 设置缓存
func Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return Cache.Set(ctx, key, data, expiration).Err()
}

// Get 获取缓存
func Get(key string, dest interface{}) error {
	data, err := Cache.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

// Delete 删除缓存
func Delete(key string) error {
	return Cache.Del(ctx, key).Err()
}

// DeletePattern 删除匹配模式的所有键
func DeletePattern(pattern string) error {
	keys, err := Cache.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}
	if len(keys) > 0 {
		return Cache.Del(ctx, keys...).Err()
	}
	return nil
}

// Exists 检查键是否存在
func Exists(key string) bool {
	return Cache.Exists(ctx, key).Val() > 0
}

// 缓存键前缀
const (
	CacheKeyStudent      = "student:"
	CacheKeyStudents     = "students:all"
	CacheKeyBuilding     = "building:"
	CacheKeyBuildings    = "buildings:all"
	CacheKeyRoom         = "room:"
	CacheKeyRooms        = "rooms:all"
	CacheKeyRepair       = "repair:"
	CacheKeyRepairs      = "repairs:all"
	CacheKeyNotice       = "notice:"
	CacheKeyNotices      = "notices:all"
	CacheKeyDashboard    = "dashboard:stats"
	CacheKeyUserRoles    = "user:roles:"      // user:roles:{userID}
	CacheKeyUserPerms    = "user:perms:"      // user:perms:{userID}
	CacheKeyUserBuildings = "user:buildings:" // user:buildings:{userID}
)

// 缓存过期时间
const (
	CacheExpirationShort = 5 * time.Minute   // 5分钟
	CacheExpirationMedium = 15 * time.Minute // 15分钟
	CacheExpirationLong  = 1 * time.Hour      // 1小时
)

