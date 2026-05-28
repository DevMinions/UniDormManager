// Package scheduler 周期任务调度。
//
// 用 robfig/cron/v3 注册按时跑的后台任务,例如:清理过期 token、扫描晚归。
// 真正的任务实现见 jobs.go。
package scheduler

import (
	"log"
	"sync"

	"github.com/robfig/cron/v3"

	"unidorm-manager-server/store"
)

// JobInfo 暴露给 admin 查看用的简单元信息
type JobInfo struct {
	ID       int    `json:"id"`
	Schedule string `json:"schedule"`
	Name     string `json:"name"`
}

var (
	mu sync.Mutex
	c  *cron.Cron
	// jobs 记录注册的元信息,c.Entries() 拿不到 cron 表达式字符串和 name
	jobs []JobInfo
)

// Start 启动调度器。可重复调用是安全的(已启动则忽略)。
func Start(s store.StoreInterface) {
	mu.Lock()
	defer mu.Unlock()
	if c != nil {
		log.Println("scheduler: already running, skip")
		return
	}
	c = cron.New(cron.WithSeconds())

	register := func(schedule, name string, fn func()) {
		id, err := c.AddFunc(schedule, fn)
		if err != nil {
			log.Printf("scheduler: register %q failed: %v", name, err)
			return
		}
		jobs = append(jobs, JobInfo{ID: int(id), Schedule: schedule, Name: name})
	}

	// 每天 03:00 清理 token_blacklist 里过期项
	register("0 0 3 * * *", "cleanup-expired-tokens", cleanupExpiredTokens)

	// 每天 02:00 扫晚归
	register("0 0 2 * * *", "scan-late-returns", func() { scanLateReturns(s) })

	c.Start()
	log.Printf("scheduler: started with %d jobs", len(jobs))
}

// Stop 优雅关闭。等待所有进行中 job 完成后返回。
func Stop() {
	mu.Lock()
	defer mu.Unlock()
	if c == nil {
		return
	}
	ctx := c.Stop()
	<-ctx.Done()
	c = nil
	log.Println("scheduler: stopped")
}

// Jobs 返回当前注册的任务清单,给 admin GET /api/scheduler/jobs 用。
func Jobs() []JobInfo {
	mu.Lock()
	defer mu.Unlock()
	out := make([]JobInfo, len(jobs))
	copy(out, jobs)
	return out
}
