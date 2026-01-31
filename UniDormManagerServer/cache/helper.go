package cache

import (
	"fmt"
	"log"
	"time"
)

// CacheHelper 缓存助手
type CacheHelper struct {
	prefix string
}

// NewCacheHelper 创建缓存助手
func NewCacheHelper(prefix string) *CacheHelper {
	return &CacheHelper{prefix: prefix}
}

// GetKey 生成完整的缓存键
func (h *CacheHelper) GetKey(key string) string {
	return fmt.Sprintf("%s%s", h.prefix, key)
}

// SetWithExpiration 设置带过期时间的缓存
func (h *CacheHelper) SetWithExpiration(key string, value interface{}, expiration time.Duration) error {
	fullKey := h.GetKey(key)
	if err := Set(fullKey, value, expiration); err != nil {
		log.Printf("缓存设置失败: %s, error: %v", fullKey, err)
		return err
	}
	log.Printf("缓存设置成功: %s (过期时间: %v)", fullKey, expiration)
	return nil
}

// GetOrSet 获取缓存，如果不存在则执行回调函数并缓存结果
func (h *CacheHelper) GetOrSet(key string, dest interface{}, expiration time.Duration, callback func() (interface{}, error)) error {
	fullKey := h.GetKey(key)

	// 尝试从缓存获取
	if err := Get(fullKey, dest); err == nil {
		log.Printf("缓存命中: %s", fullKey)
		return nil
	}

	// 缓存未命中，执行回调
	data, err := callback()
	if err != nil {
		log.Printf("回调函数执行失败: %v", err)
		return err
	}

	// 设置缓存
	if err := h.SetWithExpiration(key, data, expiration); err != nil {
		log.Printf("缓存设置失败，但数据已获取: %v", err)
		// 不影响主流程，只记录日志
		return nil
	}

	return nil
}

// Invalidate 使缓存失效
func (h *CacheHelper) Invalidate(key string) error {
	fullKey := h.GetKey(key)
	if err := Delete(fullKey); err != nil {
		log.Printf("缓存删除失败: %s, error: %v", fullKey, err)
		return err
	}
	log.Printf("缓存删除成功: %s", fullKey)
	return nil
}

// InvalidatePattern 删除匹配模式的所有缓存
func (h *CacheHelper) InvalidatePattern(pattern string) error {
	fullPattern := h.GetKey(pattern)
	if err := DeletePattern(fullPattern); err != nil {
		log.Printf("批量缓存删除失败: %s, error: %v", fullPattern, err)
		return err
	}
	log.Printf("批量缓存删除成功: %s", fullPattern)
	return nil
}

// 批量缓存操作助手
var (
	StudentCache    = NewCacheHelper(CacheKeyStudent)
	StudentsCache   = NewCacheHelper(CacheKeyStudents)
	BuildingCache   = NewCacheHelper(CacheKeyBuilding)
	BuildingsCache  = NewCacheHelper(CacheKeyBuildings)
	RoomCache       = NewCacheHelper(CacheKeyRoom)
	RoomsCache      = NewCacheHelper(CacheKeyRooms)
	RepairCache     = NewCacheHelper(CacheKeyRepair)
	RepairsCache    = NewCacheHelper(CacheKeyRepairs)
	NoticeCache     = NewCacheHelper(CacheKeyNotice)
	NoticesCache    = NewCacheHelper(CacheKeyNotices)
	DashboardCache  = NewCacheHelper(CacheKeyDashboard)
	UserRolesCache  = NewCacheHelper(CacheKeyUserRoles)
	UserPermsCache  = NewCacheHelper(CacheKeyUserPerms)
	UserBuildingsCache = NewCacheHelper(CacheKeyUserBuildings)
)