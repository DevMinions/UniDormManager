package scheduler

import (
	"context"
	"log"

	"unidorm-manager-server/database"
	"unidorm-manager-server/store"
)

// cleanupExpiredTokens 删 token_blacklist 里 expires_at 已过的记录。
//
// 这是个安全无副作用的清扫任务:JWT 黑名单本来是为了拒绝已登出但还没到期的
// token,过期后的记录可以删,避免表无限增长。
func cleanupExpiredTokens() {
	ctx := context.Background()
	res, err := database.DB.Exec(ctx, "DELETE FROM token_blacklist WHERE expires_at < NOW()")
	if err != nil {
		log.Printf("scheduler[cleanup-expired-tokens]: failed: %v", err)
		return
	}
	log.Printf("scheduler[cleanup-expired-tokens]: deleted %d rows", res.RowsAffected())
}

// scanLateReturns 扫"过去 24h 内最后一条 access_log 是 Out 且没回"的学生,
// 写入 late_return_alerts。今天已经为某人 alert 过的不重复插入。
//
// 这是个**最小可工作版本**:真实校园对"晚归"定义往往更复杂(宿舍楼规定的
// 门禁时间、是否请假、节假日豁免等)。这里只兜底有个调度结构跑起来,业务
// 细化时改 SQL 即可。
func scanLateReturns(_ store.StoreInterface) {
	ctx := context.Background()
	const q = `
		INSERT INTO late_return_alerts
			(id, student_id, student_name, room_number, alert_date, last_entry, status)
		SELECT
			gen_random_uuid()::text,
			last_log.student_id,
			last_log.student_name,
			last_log.room_number,
			CURRENT_DATE,
			last_log.timestamp,
			'Pending'
		FROM (
			SELECT DISTINCT ON (student_id)
				student_id, student_name, room_number, direction, timestamp
			FROM access_logs
			WHERE timestamp > NOW() - INTERVAL '24 hours'
			ORDER BY student_id, timestamp DESC
		) AS last_log
		WHERE last_log.direction = 'Out'
		  AND NOT EXISTS (
			SELECT 1 FROM late_return_alerts a
			WHERE a.student_id = last_log.student_id
			  AND a.alert_date = CURRENT_DATE
		  )
	`
	res, err := database.DB.Exec(ctx, q)
	if err != nil {
		// access_logs 可能没数据 / late_return_alerts 表 schema 跟假设不符。
		// 不致命,记日志即可,下次照常跑。
		log.Printf("scheduler[scan-late-returns]: failed: %v", err)
		return
	}
	log.Printf("scheduler[scan-late-returns]: inserted %d alerts", res.RowsAffected())
}
