#!/bin/bash
# UniDormManager 完整业务测试脚本（带认证）
# 使用 api-dev skill 进行测试

BASE_URL="http://localhost:8082"
TOKEN=""
PASS=0
FAIL=0

echo "========================================"
echo "  UniDormManager 完整业务测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试函数
test_api() {
    local method="$1"
    local endpoint="$2"
    local expected="$3"
    local body="$4"
    local description="$5"
    local auth="${6:-true}"
    
    local args=(-s -o /dev/null -w "%{http_code}" -X "$method")
    
    # 添加认证头
    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        args+=(-H "Authorization: Bearer $TOKEN")
    fi
    
    if [ -n "$body" ]; then
        args+=(-H "Content-Type: application/json" -d "$body")
    fi
    
    local status
    status=$(curl "${args[@]}" "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description ($method $endpoint -> $status)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $description ($method $endpoint -> $status, 期望 $expected)"
        ((FAIL++))
        return 1
    fi
}

# 登录获取 Token
echo "🔐 步骤1: 登录获取 Token"
echo "------------------------"

# 尝试使用默认账号登录
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

# 尝试不同的登录方式
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 登录成功${NC}"
    echo "Token: ${TOKEN:0:30}..."
elif echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ 登录成功${NC}"
    echo "Token: ${TOKEN:0:30}..."
else
    echo -e "${YELLOW}⚠️  登录失败或不需要 Token${NC}"
    echo "响应: $LOGIN_RESPONSE"
fi
echo ""

# 基础健康检查
echo "🔍 步骤2: 基础服务检查"
echo "------------------------"
test_api "GET" "/health" "200" "" "健康检查端点" "false"
echo ""

# 认证测试
echo "🔍 步骤3: 认证接口测试"
echo "------------------------"
if [ -n "$TOKEN" ]; then
    test_api "GET" "/api/auth/me" "200" "" "获取当前用户信息"
else
    echo -e "${YELLOW}⚠️  跳过认证测试（未获取到 Token）${NC}"
fi
echo ""

# 学生管理测试
echo "🔍 步骤4: 学生管理业务测试"
echo "------------------------"
test_api "GET" "/api/students" "200" "" "获取学生列表（分页）"
test_api "GET" "/api/students/all" "200" "" "获取所有学生"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/students" "201" '{"name":"测试学生","studentNo":"TEST001","major":"CS","gender":"male","phone":"13800138000","buildingId":1,"roomId":1}' "创建学生"
fi
echo ""

# 楼栋管理测试
echo "🔍 步骤5: 楼栋管理业务测试"
echo "------------------------"
test_api "GET" "/api/buildings" "200" "" "获取楼栋列表"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/buildings" "201" '{"name":"测试楼栋","code":"TEST01","floors":6,"roomsPerFloor":20}' "创建楼栋"
fi
echo ""

# 房间管理测试
echo "🔍 步骤6: 房间管理业务测试"
echo "------------------------"
test_api "GET" "/api/rooms" "200" "" "获取房间列表（分页）"
test_api "GET" "/api/rooms/all" "200" "" "获取所有房间"
echo ""

# 报修管理测试
echo "🔍 步骤7: 报修管理业务测试"
echo "------------------------"
test_api "GET" "/api/repairs" "200" "" "获取报修列表"
test_api "GET" "/api/repairs/all" "200" "" "获取所有报修"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/repairs" "201" '{"title":"测试报修","description":"测试描述","priority":"normal","roomId":1}' "创建报修"
fi
echo ""

# 查寝管理测试
echo "🔍 步骤8: 查寝管理业务测试"
echo "------------------------"
test_api "GET" "/api/inspections" "200" "" "获取查寝记录"
test_api "GET" "/api/inspections/rooms" "200" "" "获取查寝房间列表"
test_api "GET" "/api/inspections/rankings" "200" "" "获取查寝排名"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/inspections" "201" '{"roomId":1,"overallScore":95,"status":"excellent","comment":"测试查寝"}' "创建查寝记录"
fi
echo ""

# 换寝申请测试
echo "🔍 步骤9: 换寝申请业务测试"
echo "------------------------"
test_api "GET" "/api/room-swaps" "200" "" "获取换寝申请"
test_api "GET" "/api/room-swaps/my-applications" "200" "" "获取我的申请"
test_api "GET" "/api/room-swaps/pending" "200" "" "获取待处理申请"
test_api "GET" "/api/room-swaps/history" "200" "" "获取历史记录"
test_api "GET" "/api/room-swaps/available" "200" "" "获取可用房间"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/room-swaps" "201" '{"reason":"测试换寝","targetRoomId":2}' "提交换寝申请"
fi
echo ""

# 门禁记录测试
echo "🔍 步骤10: 门禁管理业务测试"
echo "------------------------"
test_api "GET" "/api/access-logs" "200" "" "获取门禁记录"
test_api "GET" "/api/access-logs/live" "200" "" "获取实时记录"
echo ""

# 晚归告警测试
echo "🔍 步骤11: 晚归告警业务测试"
echo "------------------------"
test_api "GET" "/api/late-returns" "200" "" "获取晚归记录"
test_api "GET" "/api/late-returns/pending" "200" "" "获取待处理晚归"
echo ""

# 公告管理测试
echo "🔍 步骤12: 公告通知业务测试"
echo "------------------------"
test_api "GET" "/api/notices" "200" "" "获取公告列表"
if [ -n "$TOKEN" ]; then
    test_api "POST" "/api/notices" "201" '{"title":"测试公告","content":"测试内容","type":"general"}' "创建公告"
fi
echo ""

# 仪表板测试
echo "🔍 步骤13: 仪表板业务测试"
echo "------------------------"
test_api "GET" "/api/dashboard/stats" "200" "" "获取仪表板统计"
echo ""

# 监控端点测试
echo "🔍 步骤14: 监控端点测试"
echo "------------------------"
test_api "GET" "/metrics" "200" "" "Prometheus 指标端点" "false"
echo ""

# 测试结果汇总
echo "========================================"
echo "  测试结果汇总"
echo "========================================"
echo -e "${GREEN}✅ 通过: $PASS${NC}"
echo -e "${RED}❌ 失败: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    echo "系统运行正常，所有业务接口可用。"
    exit 0
else
    echo -e "${YELLOW}⚠️  有 $FAIL 个测试失败${NC}"
    echo "建议检查失败的接口和相关配置。"
    exit 1
fi
