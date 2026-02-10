#!/bin/bash
# UniDormManager 完整功能测试脚本
# 逐一测试所有功能模块

BASE_URL="http://localhost:8082"
TOKEN=""
PASS=0
FAIL=0
TEST_RESULTS=""

echo "========================================"
echo "  UniDormManager 完整功能测试"
echo "  开始时间: $(date)"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试记录函数
record_test() {
    local module="$1"
    local feature="$2"
    local status="$3"
    local details="$4"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅${NC} [$module] $feature"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} [$module] $feature"
        echo "   详情: $details"
        ((FAIL++))
    fi
    
    TEST_RESULTS="$TEST_RESULTS\n$module|$feature|$status|$details"
}

# 登录获取Token
echo "🔐 步骤1: 登录获取Token"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if echo "$LOGIN_RESP" | grep -q "token"; then
    TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ 登录成功"
    echo "Token: ${TOKEN:0:30}..."
else
    echo "❌ 登录失败"
    echo "响应: $LOGIN_RESP"
    exit 1
fi
echo ""

# ==================== 1. 用户认证模块 ====================
echo "========================================"
echo "  模块1: 用户认证"
echo "========================================"

# 1.1 用户登录
echo "测试1.1: 用户登录..."
record_test "认证" "用户登录" "PASS" "获取Token成功"

# 1.2 获取当前用户
echo "测试1.2: 获取当前用户..."
ME_RESP=$(curl -s "$BASE_URL/api/auth/me" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ME_RESP" | grep -q "id"; then
    record_test "认证" "获取当前用户" "PASS" "返回用户详情"
else
    record_test "认证" "获取当前用户" "FAIL" "无法获取用户信息"
fi

echo ""

# ==================== 2. 学生管理模块 ====================
echo "========================================"
echo "  模块2: 学生管理"
echo "========================================"

# 2.1 获取学生列表
echo "测试2.1: 获取学生列表（分页）..."
STUDENTS_RESP=$(curl -s "$BASE_URL/api/students?page=1&size=10" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$STUDENTS_RESP" | grep -q "data"; then
    STUDENT_COUNT=$(echo "$STUDENTS_RESP" | grep -o '"id"' | wc -l)
    record_test "学生管理" "获取学生列表" "PASS" "返回 $STUDENT_COUNT 名学生"
else
    record_test "学生管理" "获取学生列表" "FAIL" "无法获取学生列表"
fi

# 2.2 检查学生building字段
echo "测试2.2: 验证学生building字段..."
BUILDING_CHECK=$(curl -s "$BASE_URL/api/students/all" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
A_COUNT=$(echo "$BUILDING_CHECK" | grep -o '"building":"A栋"' | wc -l)
B_COUNT=$(echo "$BUILDING_CHECK" | grep -o '"building":"B栋"' | wc -l)

if [ "$A_COUNT" -gt 0 ] && [ "$B_COUNT" -gt 0 ]; then
    record_test "学生管理" "building字段分布" "PASS" "A栋:$A_COUNT人, B栋:$B_COUNT人"
else
    record_test "学生管理" "building字段分布" "FAIL" "分布异常: A栋=$A_COUNT, B栋=$B_COUNT"
fi

# 2.3 检查学生是否只在一个房间
echo "测试2.3: 验证学生房间唯一性..."
# 统计student_id出现次数
DUP_CHECK=$(echo "$BUILDING_CHECK" | grep -o '"studentId":"[^"]*"' | sort | uniq -d | wc -l)
if [ "$DUP_CHECK" -eq 0 ]; then
    record_test "学生管理" "学生房间唯一性" "PASS" "无重复学生ID"
else
    record_test "学生管理" "学生房间唯一性" "FAIL" "发现 $DUP_CHECK 个重复学生ID"
fi

echo ""

# ==================== 3. 楼栋管理模块 ====================
echo "========================================"
echo "  模块3: 楼栋管理"
echo "========================================"

# 3.1 获取楼栋列表
echo "测试3.1: 获取楼栋列表..."
BUILDINGS_RESP=$(curl -s "$BASE_URL/api/buildings" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$BUILDINGS_RESP" | grep -q "A栋\|B栋\|C栋"; then
    BLD_COUNT=$(echo "$BUILDINGS_RESP" | grep -o '"name"' | wc -l)
    record_test "楼栋管理" "获取楼栋列表" "PASS" "返回 $BLD_COUNT 栋楼"
else
    record_test "楼栋管理" "获取楼栋列表" "FAIL" "无法获取楼栋列表"
fi

echo ""

# ==================== 4. 房间管理模块 ====================
echo "========================================"
echo "  模块4: 房间管理（重点测试）"
echo "========================================"

# 4.1 获取房间列表
echo "测试4.1: 获取房间列表..."
ROOMS_RESP=$(curl -s "$BASE_URL/api/rooms?page=1&size=20" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$ROOMS_RESP" | grep -q "data"; then
    ROOM_COUNT=$(echo "$ROOMS_RESP" | grep -o '"id"' | wc -l)
    record_test "房间管理" "获取房间列表" "PASS" "返回 $ROOM_COUNT 个房间"
else
    record_test "房间管理" "获取房间列表" "FAIL" "无法获取房间列表"
fi

# 4.2 检查A栋101室
echo "测试4.2: 检查A栋101室入住情况..."
A101_CHECK=$(curl -s "$BASE_URL/api/rooms" -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"number":"101"[^}]*"building":"A栋"[^}]*"occupied":[0-9]*')
if echo "$A101_CHECK" | grep -q '"occupied":4'; then
    record_test "房间管理" "A栋101入住数" "PASS" "入住4人，符合预期"
else
    OCCUPIED=$(echo "$A101_CHECK" | grep -o '"occupied":[0-9]*' | cut -d':' -f2)
    record_test "房间管理" "A栋101入住数" "FAIL" "显示入住$OCCUPIED人，应为4人"
fi

# 4.3 检查B栋101室
echo "测试4.3: 检查B栋101室入住情况..."
B101_CHECK=$(curl -s "$BASE_URL/api/rooms" -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"number":"101"[^}]*"building":"B栋"[^}]*"occupied":[0-9]*')
if echo "$B101_CHECK" | grep -q '"occupied":4'; then
    record_test "房间管理" "B栋101入住数" "PASS" "入住4人，符合预期"
else
    OCCUPIED=$(echo "$B101_CHECK" | grep -o '"occupied":[0-9]*' | cut -d':' -f2)
    record_test "房间管理" "B栋101入住数" "FAIL" "显示入住$OCCUPIED人，应为4人"
fi

# 4.4 检查A栋103室（应为空）
echo "测试4.4: 检查A栋103室（应为空）..."
A103_CHECK=$(curl -s "$BASE_URL/api/rooms" -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"number":"103"[^}]*"building":"A栋"[^}]*"occupied":[0-9]*')
if echo "$A103_CHECK" | grep -q '"occupied":0'; then
    record_test "房间管理" "A栋103空置" "PASS" "入住0人，符合预期"
else
    OCCUPIED=$(echo "$A103_CHECK" | grep -o '"occupied":[0-9]*' | cut -d':' -f2)
    record_test "房间管理" "A栋103空置" "FAIL" "显示入住$OCCUPIED人，应为0人"
fi

# 4.5 检查房间容量不超标
echo "测试4.5: 检查房间容量限制..."
OVER_CAPACITY=$(curl -s "$BASE_URL/api/rooms" -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -o '"occupied":[0-9]*"capacity":[0-9]*' | while read line; do
    OCC=$(echo $line | grep -o '"occupied":[0-9]*' | cut -d':' -f2)
    CAP=$(echo $line | grep -o '"capacity":[0-9]*' | cut -d':' -f2)
    if [ "$OCC" -gt "$CAP" ]; then
        echo "OVER"
        break
    fi
done)

if [ -z "$OVER_CAPACITY" ]; then
    record_test "房间管理" "容量限制检查" "PASS" "无房间超员"
else
    record_test "房间管理" "容量限制检查" "FAIL" "发现房间超员"
fi

echo ""

# ==================== 5. 报修管理模块 ====================
echo "========================================"
echo "  模块5: 报修管理"
echo "========================================"

REPAIRS_RESP=$(curl -s "$BASE_URL/api/repairs" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$REPAIRS_RESP" | grep -q "data"; then
    record_test "报修管理" "获取报修列表" "PASS" "接口正常"
else
    record_test "报修管理" "获取报修列表" "FAIL" "接口异常"
fi

echo ""

# ==================== 6. 查寝评分模块 ====================
echo "========================================"
echo "  模块6: 查寝评分"
echo "========================================"

INSPECTIONS_RESP=$(curl -s "$BASE_URL/api/inspections?page=1&size=10" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$INSPECTIONS_RESP" | grep -q "data"; then
    record_test "查寝评分" "获取查寝记录" "PASS" "接口正常"
else
    record_test "查寝评分" "获取查寝记录" "FAIL" "接口异常"
fi

RANKINGS_RESP=$(curl -s "$BASE_URL/api/inspections/rankings" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if [ $? -eq 0 ]; then
    record_test "查寝评分" "获取查寝排名" "PASS" "接口正常"
else
    record_test "查寝评分" "获取查寝排名" "FAIL" "接口异常"
fi

echo ""

# ==================== 7. 换寝申请模块 ====================
echo "========================================"
echo "  模块7: 换寝申请"
echo "========================================"

SWAPS_RESP=$(curl -s "$BASE_URL/api/room-swaps" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$SWAPS_RESP" | grep -q "data"; then
    record_test "换寝申请" "获取申请列表" "PASS" "接口正常"
else
    record_test "换寝申请" "获取申请列表" "FAIL" "接口异常"
fi

echo ""

# ==================== 8. 门禁管理模块 ====================
echo "========================================"
echo "  模块8: 门禁管理"
echo "========================================"

ACCESS_RESP=$(curl -s "$BASE_URL/api/access-logs" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if [ $? -eq 0 ]; then
    record_test "门禁管理" "获取门禁记录" "PASS" "接口正常"
else
    record_test "门禁管理" "获取门禁记录" "FAIL" "接口异常"
fi

echo ""

# ==================== 9. 晚归告警模块 ====================
echo "========================================"
echo "  模块9: 晚归告警"
echo "========================================"

LATE_RESP=$(curl -s "$BASE_URL/api/late-returns" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if [ $? -eq 0 ]; then
    record_test "晚归告警" "获取晚归记录" "PASS" "接口正常"
else
    record_test "晚归告警" "获取晚归记录" "FAIL" "接口异常"
fi

echo ""

# ==================== 10. 公告通知模块 ====================
echo "========================================"
echo "  模块10: 公告通知"
echo "========================================"

NOTICES_RESP=$(curl -s "$BASE_URL/api/notices" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$NOTICES_RESP" | grep -q "data"; then
    record_test "公告通知" "获取公告列表" "PASS" "接口正常"
else
    record_test "公告通知" "获取公告列表" "FAIL" "接口异常"
fi

echo ""

# ==================== 11. 仪表板模块 ====================
echo "========================================"
echo "  模块11: 仪表板"
echo "========================================"

DASHBOARD_RESP=$(curl -s "$BASE_URL/api/dashboard/stats" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if echo "$DASHBOARD_RESP" | grep -q "totalStudents"; then
    record_test "仪表板" "获取统计数据" "PASS" "接口正常"
else
    record_test "仪表板" "获取统计数据" "FAIL" "接口异常"
fi

echo ""

# ==================== 测试结果汇总 ====================
echo "========================================"
echo "  测试结果汇总"
echo "========================================"
echo -e "${GREEN}✅ 通过: $PASS${NC}"
echo -e "${RED}❌ 失败: $FAIL${NC}"
echo ""

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASS/($PASS+$FAIL))*100}")
echo "成功率: $SUCCESS_RATE%"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    EXIT_CODE=0
else
    echo -e "${YELLOW}⚠️  有 $FAIL 个测试项需要修复${NC}"
    EXIT_CODE=1
fi

echo ""
echo "测试完成时间: $(date)"
echo ""

# 输出详细结果
echo "详细结果:"
echo "$TEST_RESULTS" | column -t -s '|'

exit $EXIT_CODE
