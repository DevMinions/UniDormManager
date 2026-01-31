#!/bin/bash

echo "🔧 Docker 权限设置脚本"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  请不要使用 root 用户运行此脚本"
    echo "   请以普通用户运行，脚本会提示您输入 sudo 密码"
    exit 1
fi

# 检查用户是否已在 docker 组
if groups | grep -q docker; then
    echo "✅ 用户 $USER 已在 docker 组中"
    echo "   如果仍有权限问题，请运行: newgrp docker"
    exit 0
fi

echo "📝 将用户 $USER 添加到 docker 组..."
echo "   需要输入您的 sudo 密码："
echo ""

# 将用户添加到 docker 组
sudo usermod -aG docker $USER

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 用户已添加到 docker 组"
    echo ""
    echo "⚠️  重要：请执行以下操作之一使更改生效："
    echo "   1. 重新登录系统（推荐）"
    echo "   2. 运行: newgrp docker"
    echo ""
    echo "然后运行: ./start.sh"
else
    echo "❌ 添加用户到 docker 组失败"
    exit 1
fi
