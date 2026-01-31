# 🐳 Docker 环境设置指南

## ⚠️ Docker 权限问题解决方案

如果遇到 `permission denied while trying to connect to the Docker daemon socket` 错误，请按以下步骤操作：

### 方法一：将用户添加到 docker 组（推荐）

```bash
# 1. 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 2. 刷新组权限（二选一）：
# 选项 A: 重新登录
# 选项 B: 使用 newgrp 命令（临时生效）
newgrp docker

# 3. 验证权限
docker ps
```

### 方法二：使用 sudo（不推荐，每次都需要密码）

```bash
sudo docker compose up -d
```

## 🚀 启动项目

权限修复后，运行：

```bash
./start.sh
```

或者：

```bash
docker compose up -d
```

## ✅ 验证安装

```bash
# 检查 Docker 是否正常工作
docker ps

# 检查 Docker Compose
docker compose version
```

## 📝 常见问题

### 问题 1: Docker 服务未运行

**症状**: `Cannot connect to the Docker daemon`

**解决**:
```bash
# 启动 Docker 服务
sudo systemctl start docker
# 或
sudo service docker start
```

### 问题 2: 用户不在 docker 组

**症状**: `permission denied`

**解决**: 使用方法一将用户添加到 docker 组

### 问题 3: 端口被占用

**症状**: `bind: address already in use`

**解决**: 修改 `docker-compose.yml` 中的端口映射

