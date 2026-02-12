#!/bin/bash
# UniDormManager API 测试脚本
# 测试所有主要业务接口

BASE_URL="http://localhost:8082"
PASS=0
FAIL=0

echo "========================================"
echo "  UniDormManager API 测试"
echo "  基础URL: $BASE_URL"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local method="$1"
    local endpoint="$2"
    local expected="$3"
    local body="$4"
    local description="$5"
    
    local args=(-s -o /dev/null -w "%{http_code}" -X "$method")
    
    if [ -n "$body" ]; then
        args+=(-H "Content-Type: application/json" -d "$body")
    fi
    
    local status
    status=$(curl "${args[@]}" "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description ($method $endpoint -> $status)"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description ($method $endpoint -> $status, 期望 $expected)"
        ((FAIL++))
    fi
}

echo "🔍 测试1: 基础健康检查"
echo "------------------------"
test_api "GET" "/health" "200" "" "健康检查端点"
test_api "GET" "/api/health" "200" "" "API健康检查"
echo ""

echo "🔍 测试2: 学生管理API"
echo "------------------------"
test_api "GET" "/api/students" "200" "" "获取学生列表"
test_api "GET" "/api/students?page=1&size=10" "200" "" "分页获取学生"
test_api "POST" "/api/students" "201" '{"name":"测试学生","studentNo":"TEST001","major":"CS"}' "创建学生"
echo ""

echo "🔍 测试3: 宿舍管理API"
echo "------------------------"
test_api "GET" "/api/dorms" "200" "" "获取宿舍列表"
test_api "GET" "/api/dorms/buildings" "200" "" "获取楼栋列表"
test_api "GET" "/api/rooms" "200" "" "获取房间列表"
echo ""

echo "🔍 测试4: 报修管理API"
echo "------------------------"
test_api "GET" "/api/repairs" "200" "" "获取报修列表"
test_api "GET" "/api/repairs/status/pending" "200" "" "获取待处理报修"
echo ""

echo "🔍 测试5: 查寝评分API"
echo "------------------------"
test_api "GET" "/api/inspections" "200" "" "获取查寝记录"
test_api "GET" "/api/inspections/ranking" "200" "" "获取查寝排名"
echo ""

echo "🔍 测试6: 门禁管理API"
echo "------------------------"
test_api "GET" "/api/access-records" "200" "" "获取门禁记录"
test_api "GET" "/api/access-records/late" "200" "" "获取晚归记录"
echo ""

echo "🔍 测试7: 换寝申请API"
echo "------------------------"
test_api "GET" "/api/room-swaps" "200" "" "获取换寝申请"
echo ""

echo "🔍 测试8: 公告通知API"
echo "------------------------"
test_api "GET" "/api/notices" "200" "" "获取公告列表"
echo ""

echo "========================================"
echo "  测试结果"
echo "========================================"
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAIL 个测试失败${NC}"
    exit 1
fi
