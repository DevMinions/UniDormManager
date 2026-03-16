# ============================================
# Makefile - 常用命令
# ============================================

.PHONY: help build up down logs ps clean test deploy

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs"
	@echo "  make ps         - List running containers"
	@echo "  make clean      - Clean up containers and volumes"
	@echo "  make test       - Run tests"
	@echo "  make deploy     - Deploy to production"
	@echo "  make backup     - Backup database"
	@echo "  make restore    - Restore database"

# 构建镜像
build:
	docker-compose build

# 启动服务（后台）
up:
	docker-compose up -d

# 启动服务（前台，调试用）
up-f:
	docker-compose up

# 停止服务
down:
	docker-compose down

# 停止并删除数据
down-v:
	docker-compose down -v

# 重启服务
restart:
	docker-compose restart

# 查看日志
logs:
	docker-compose logs -f

# 查看后端日志
logs-backend:
	docker-compose logs -f backend

# 查看前端日志
logs-frontend:
	docker-compose logs -f frontend

# 查看数据库日志
logs-db:
	docker-compose logs -f mysql

# 列出运行中的容器
ps:
	docker-compose ps

# 清理
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# 重新构建并启动
rebuild: down build up

# 运行测试
test:
	cd UniDormManagerServer && go test ./...
	cd UniDormManager-UniApp && npm test

# 后端测试
test-backend:
	cd UniDormManagerServer && go test -v ./...

# 前端测试
test-frontend:
	cd UniDormManager-UniApp && npm test

# 数据库备份
backup:
	@mkdir -p backups
	@docker exec unidorm_mysql mysqldump -u root -p$${MYSQL_ROOT_PASSWORD} unidorm_db > backups/unidorm_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed: backups/unidorm_$$(date +%Y%m%d_%H%M%S).sql"

# 数据库恢复（需要指定文件）
restore:
	@if [ -z "$(file)" ]; then \
		echo "Usage: make restore file=backups/unidorm_20240101_120000.sql"; \
		exit 1; \
	fi
	docker exec -i unidorm_mysql mysql -u root -p$${MYSQL_ROOT_PASSWORD} unidorm_db < $(file)
	@echo "Restore completed from $(file)"

# 进入后端容器
shell-backend:
	docker-compose exec backend sh

# 进入数据库
shell-db:
	docker-compose exec mysql mysql -u root -p

# 进入 Redis
shell-redis:
	docker-compose exec redis redis-cli -a $${REDIS_PASSWORD}

# 更新（拉取最新代码并重启）
update:
	git pull
	docker-compose pull
	docker-compose up -d

# 查看版本
version:
	@echo "Backend version:"
	@docker-compose exec backend ./server -v 2>/dev/null || echo "N/A"
	@echo "Frontend version:"
	@docker-compose exec frontend nginx -v 2>/dev/null || echo "N/A"

# 健康检查
health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:8080/health || echo "Backend not responding"
	@echo ""
	@echo "Frontend health:"
	@curl -s http://localhost:80/health || echo "Frontend not responding"
