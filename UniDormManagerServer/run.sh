#!/bin/bash

# UniDorm Manager Server 启动脚本

PORT=${PORT:-8080}

echo "Starting UniDorm Manager Server on port $PORT..."
go run main.go

