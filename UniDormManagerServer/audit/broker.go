// Package audit 给 audit 事件做 in-process fan-out。
//
// middleware/audit.go 在写库后会调 Publish(event);任意数量的 SSE 订阅者
// 通过 Subscribe() 拿到只读 channel,Unsubscribe 时归还。
//
// 设计:单进程内存广播,无持久化。重启或者多实例部署后历史事件就丢了
// (但 audit_logs 表里依然有完整记录,Stream 是"实时看新事件"的补充)。
package audit

import (
	"sync"
	"sync/atomic"
)

// Event 就是一条审计记录(跟 audit_logs 表字段对齐,JSON 化后给 SSE 客户端)
type Event struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Username  string `json:"username"`
	Method    string `json:"method"`
	Path      string `json:"path"`
	Status    int    `json:"status"`
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
}

// subscriberBufSize: 单订阅者的事件 buffer。Publish 不等慢消费,溢出就丢
// (审计是 best-effort 实时通知,落库保证可靠)。
const subscriberBufSize = 32

var (
	mu          sync.RWMutex
	subscribers = map[uint64]chan Event{}
	nextID      atomic.Uint64
)

// Subscribe 返回 (channel, id, unsubscribe)。读完调 unsubscribe 释放资源。
func Subscribe() (<-chan Event, func()) {
	ch := make(chan Event, subscriberBufSize)
	id := nextID.Add(1)
	mu.Lock()
	subscribers[id] = ch
	mu.Unlock()
	return ch, func() {
		mu.Lock()
		if c, ok := subscribers[id]; ok {
			delete(subscribers, id)
			close(c)
		}
		mu.Unlock()
	}
}

// Publish 把事件 fan-out 给所有当前订阅者。慢订阅者(buffer 满)会丢失事件,
// 不阻塞 Publish 调用方。
func Publish(e Event) {
	mu.RLock()
	defer mu.RUnlock()
	for _, ch := range subscribers {
		select {
		case ch <- e:
		default:
			// drop on full buffer
		}
	}
}

// SubscriberCount 给运维/测试看当前在线监听数
func SubscriberCount() int {
	mu.RLock()
	defer mu.RUnlock()
	return len(subscribers)
}
