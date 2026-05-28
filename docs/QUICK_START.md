# 🚀 快速启动指南

## 第一步：修复 Docker 权限

如果这是第一次使用 Docker，请先修复权限：

```bash
./scripts/setup-docker.sh
```

然后**重新登录**或运行：
```bash
newgrp docker
```

## 第二步：测试配置

```bash
./scripts/test-docker.sh
```

## 第三步：启动项目

```bash
./start.sh
```

## 📋 完整步骤

```bash
# 1. 进入项目目录
cd /home/adamyu/CursorPorjects/UniDormManager

# 2. 设置 Docker 权限（首次运行）
./scripts/setup-docker.sh
# 然后重新登录或运行: newgrp docker

# 3. 测试配置
./scripts/test-docker.sh

# 4. 启动项目
./start.sh

# 5. 查看服务状态
docker compose ps

# 6. 查看日志
docker compose logs -f
```

## 🌐 访问地址

启动成功后：

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **健康检查**: http://localhost:8080/health

## 🔐 默认账户

- 用户名: `admin`
- 密码: 后端首次启动时会在日志里打印一次（搜 `INITIAL PASSWORD`），或通过 `ADMIN_INITIAL_PASSWORD` 环境变量预设

## 🛑 停止服务

```bash
docker compose down
```

## ❓ 遇到问题？

查看 [SETUP_DOCKER.md](./SETUP_DOCKER.md) 了解详细的故障排查指南。

