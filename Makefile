# ============================================
# Makefile - 常用命令
# ============================================

.PHONY: help build up down logs ps clean test deploy restart up-f down-v rebuild \
        test-backend test-frontend backup restore shell-backend shell-db shell-redis \
        update version health logs-backend logs-frontend logs-db

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services (background)"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - Tail all logs"
	@echo "  make logs-backend  - Tail backend logs only"
	@echo "  make logs-frontend - Tail frontend logs only"
	@echo "  make logs-db    - Tail postgres logs only"
	@echo "  make ps         - List running containers"
	@echo "  make clean      - Remove containers + volumes + images"
	@echo "  make test       - Run backend + frontend tests"
	@echo "  make backup     - Dump postgres database"
	@echo "  make restore    - Restore postgres database (file=...)"

# 构建镜像
build:
	docker compose build

# 启动服务（后台）
up:
	docker compose up -d

# 启动服务（前台，调试用）
up-f:
	docker compose up

# 停止服务
down:
	docker compose down

# 停止并删除数据卷
down-v:
	docker compose down -v

# 重启服务
restart:
	docker compose restart

# 查看日志
logs:
	docker compose logs -f

# 查看后端日志
logs-backend:
	docker compose logs -f backend

# 查看前端日志
logs-frontend:
	docker compose logs -f frontend

# 查看数据库日志
logs-db:
	docker compose logs -f postgres

# 列出运行中的容器
ps:
	docker compose ps

# 清理
clean:
	docker compose down -v --rmi all --remove-orphans
	docker system prune -f

# 重新构建并启动
rebuild: down build up

# 运行测试
test: test-backend test-frontend

# 后端测试
test-backend:
	cd UniDormManagerServer && go test -v ./...

# 前端测试
test-frontend:
	cd UniDormManagerWeb && npm test -- --run

# 数据库备份
backup:
	@mkdir -p backups
	@FILE=backups/unidorm_$$(date +%Y%m%d_%H%M%S).sql; \
	docker compose exec -T postgres pg_dump -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-unidorm} > $$FILE; \
	echo "Backup completed: $$FILE"

# 数据库恢复（需要指定文件）
restore:
	@if [ -z "$(file)" ]; then \
		echo "Usage: make restore file=backups/unidorm_20260528_120000.sql"; \
		exit 1; \
	fi
	docker compose exec -T postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-unidorm} < $(file)
	@echo "Restore completed from $(file)"

# 进入后端容器
shell-backend:
	docker compose exec backend sh

# 进入数据库
shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-unidorm}

# 进入 Redis
shell-redis:
	docker compose exec redis redis-cli -a $${REDIS_PASSWORD}

# 更新（拉取最新代码并重启）
update:
	git pull
	docker compose pull
	docker compose up -d

# 健康检查
health:
	@echo "Service health:"
	@docker compose ps
	@echo ""
	@echo "Backend /health:"
	@curl -fsS http://localhost:8080/health || echo "Backend not responding"
