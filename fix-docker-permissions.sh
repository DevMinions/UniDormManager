#!/bin/bash

# 修复 Docker 权限问题的脚本

echo "🔧 修复 Docker 权限..."

# 检查当前用户是否在 docker 组中
if groups | grep -q docker; then
    echo "✅ 用户已在 docker 组中，请重新登录或运行: newgrp docker"
    exit 0
fi

echo "📝 需要将当前用户添加到 docker 组..."
echo "请运行以下命令（需要管理员权限）："
echo ""
echo "sudo usermod -aG docker $USER"
echo "newgrp docker"
echo ""
echo "或者重新登录后再次尝试运行 Docker 命令"

