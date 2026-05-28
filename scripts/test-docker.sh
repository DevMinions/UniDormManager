#!/bin/bash

# Docker 配置测试脚本

echo "🧪 测试 Docker 配置..."
echo ""

# 测试 Docker 是否可用
echo "1️⃣ 检查 Docker 命令..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker 已安装: $(docker --version)"
else
    echo "   ❌ Docker 未安装"
    exit 1
fi

# 测试 Docker Compose
echo ""
echo "2️⃣ 检查 Docker Compose..."
if docker compose version &> /dev/null; then
    echo "   ✅ Docker Compose 可用"
    docker compose version
else
    echo "   ❌ Docker Compose 不可用"
    exit 1
fi

# 测试 Docker 权限
echo ""
echo "3️⃣ 测试 Docker 权限..."
if docker ps &> /dev/null; then
    echo "   ✅ Docker 权限正常"
else
    echo "   ❌ Docker 权限不足"
    echo ""
    echo "   请运行: ./setup-docker.sh"
    exit 1
fi

# 测试配置文件
echo ""
echo "4️⃣ 检查配置文件..."
cd "$(dirname "$0")"

if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml 存在"
    if docker compose config &> /dev/null; then
        echo "   ✅ docker-compose.yml 配置有效"
    else
        echo "   ❌ docker-compose.yml 配置有误"
        docker compose config
        exit 1
    fi
else
    echo "   ❌ docker-compose.yml 不存在"
    exit 1
fi

if [ -f "UniDormManagerServer/Dockerfile" ]; then
    echo "   ✅ 后端 Dockerfile 存在"
else
    echo "   ❌ 后端 Dockerfile 不存在"
    exit 1
fi

if [ -f "UniDormManagerWeb/Dockerfile" ]; then
    echo "   ✅ 前端 Dockerfile 存在"
else
    echo "   ❌ 前端 Dockerfile 不存在"
    exit 1
fi

echo ""
echo "✅ 所有检查通过！"
echo ""
echo "现在可以运行: ./start.sh"

