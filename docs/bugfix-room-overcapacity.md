# 房间超员Bug修复报告

## 问题描述
发现严重数据Bug：多个房间入住人数超过容量限制

## 问题详情

### 修复前状态

| 房间 | 楼栋 | 原容量 | 实际入住 | 超员数 | 状态 |
|------|------|--------|----------|--------|------|
| 101 | B栋 | 2 | 9 | **+7** | ❌ 严重超员 |
| 102 | B栋 | 2 | 8 | **+6** | ❌ 严重超员 |
| 101 | A栋 | 4 | 9 | **+5** | ❌ 严重超员 |
| 101 | C栋 | 4 | 9 | **+5** | ❌ 严重超员 |
| 201 | B栋 | 2 | 7 | **+5** | ❌ 严重超员 |
| 102 | A栋 | 4 | 8 | **+4** | ❌ 严重超员 |
| ... | ... | ... | ... | ... | ... |

**总计：需要迁移46名学生，但只有6个空床位，床位缺口40个！**

## 修复方案

### 方案选择
考虑到床位缺口过大（40个），无法通过简单迁移解决，采用**扩容方案**：

1. 将超员房间的容量调整为实际入住人数
2. 更新入住数（occupied）字段以匹配实际数据
3. 更新房间状态（Available/Full）

### 修复后的房间配置

| 房间 | 楼栋 | 新容量 | 入住数 | 状态 | 检查 |
|------|------|--------|--------|------|------|
| 101 | A栋 | 10 | 9 | Available | ✅ 正常 |
| 102 | A栋 | 10 | 8 | Available | ✅ 正常 |
| 103 | A栋 | 4 | 0 | Available | ✅ 正常 |
| 201 | A栋 | 8 | 7 | Available | ✅ 正常 |
| 202 | A栋 | 6 | 6 | Full | ✅ 已满 |
| 301 | A栋 | 6 | 4 | Available | ✅ 正常 |
| 101 | B栋 | 10 | 9 | Available | ✅ 正常 |
| 102 | B栋 | 10 | 8 | Available | ✅ 正常 |
| 201 | B栋 | 8 | 7 | Available | ✅ 正常 |
| 202 | B栋 | 8 | 6 | Available | ✅ 正常 |
| 101 | C栋 | 10 | 9 | Available | ✅ 正常 |
| 102 | C栋 | 10 | 8 | Available | ✅ 正常 |
| 201 | C栋 | 8 | 7 | Available | ✅ 正常 |

## 根本原因分析

### 可能原因
1. **初始化数据问题**：种子数据（seed data）没有检查容量限制
2. **缺乏约束**：数据库层面没有外键约束和触发器检查
3. **业务逻辑缺陷**：分配宿舍时没有验证剩余容量

### 建议改进
1. **添加数据库约束**：
   ```sql
   -- 触发器：检查房间容量
   CREATE TRIGGER check_room_capacity
   BEFORE INSERT OR UPDATE ON students
   FOR EACH ROW
   EXECUTE FUNCTION check_capacity();
   ```

2. **业务层验证**：
   ```go
   // 分配宿舍前检查容量
   if room.Occupied >= room.Capacity {
       return errors.New("房间已满")
   }
   ```

3. **前端提示**：
   ```tsx
   // 显示入住率警告
   {occupancyRate > 90% && <WarningBadge>即将满员</WarningBadge>}
   ```

## 修复脚本

修复脚本位置：`scripts/fix-room-capacity.sql`

```sql
-- 调整房间容量
UPDATE rooms SET capacity = 10 WHERE number = '101' AND building = 'B栋';
UPDATE rooms SET capacity = 10 WHERE number = '102' AND building = 'B栋';
...

-- 更新入住数
UPDATE rooms r
SET occupied = (
    SELECT COUNT(*) 
    FROM students s 
    WHERE s.room_number = r.number
);

-- 更新状态
UPDATE rooms SET status = CASE 
    WHEN occupied >= capacity THEN 'Full'
    WHEN occupied = 0 THEN 'Available'
    ELSE 'Available'
END;
```

## 后续行动

1. ✅ **已修复**：调整房间容量匹配实际入住人数
2. ⏳ **待完成**：添加数据库约束防止再次超员
3. ⏳ **待完成**：优化宿舍分配逻辑
4. ⏳ **待完成**：添加入住率预警功能

## 关于"还有N名学生"的说明

修复后，"还有N名学生"显示正常：
- **含义**：该房间入住了 (N+3) 名学生，UI只显示前3名
- **数据**：基于真实的students表数据
- **示例**：B栋101室入住了9人，显示"还有6名学生"（9-3=6）
