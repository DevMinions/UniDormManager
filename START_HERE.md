# 🎯 从这里开始 - Docker 启动指南

## 📋 当前状态

✅ Docker 已安装  
✅ Docker Compose 已安装  
❌ Docker 权限需要修复

## 🔧 立即修复权限问题

### 方法 1：自动修复（推荐）

```bash
./setup-docker.sh
```

然后**重新登录**或运行：
```bash
newgrp docker
```

### 方法 2：手动修复

```bash
# 将用户添加到 docker 组
sudo usermod -aG docker $USER

# 刷新权限（二选一）
newgrp docker
# 或者重新登录系统
```

## 🚀 启动步骤

### 1. 修复权限后，测试配置

```bash
./test-docker.sh
```

### 2. 启动所有服务

```bash
./start.sh
```

或者手动启动：

```bash
docker compose up -d
```

### 3. 查看服务状态

```bash
docker compose ps
```

### 4. 查看日志

```bash
# 所有服务
docker compose logs -f

# 特定服务
docker compose logs -f backend
docker compose logs -f frontend
```

## 🌐 访问应用

启动成功后：

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080  
- **健康检查**: http://localhost:8080/health

## 🔐 默认登录信息

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ 生产环境请立即修改！

## 📝 常用命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 停止并删除数据
docker compose down -v

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重新构建
docker compose build

# 重启服务
docker compose restart
```

## ❓ 遇到问题？

1. **权限问题**: 运行 `./setup-docker.sh` 并重新登录
2. **端口占用**: 修改 `docker-compose.yml` 中的端口
3. **查看详细文档**: [SETUP_DOCKER.md](./SETUP_DOCKER.md)

---

**下一步**: 运行 `./setup-docker.sh` 修复权限！

