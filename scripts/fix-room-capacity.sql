-- UniDormManager 数据修复脚本
-- 修复房间超员问题

-- 方案：调整房间容量以匹配实际需求，同时添加合理的约束

-- 1. 首先查看当前的房间配置
-- SELECT number, building, capacity FROM rooms ORDER BY building, number;

-- 2. 调整房间容量（根据实际情况扩容）
-- B栋超员严重，需要扩容
UPDATE rooms SET capacity = 10 WHERE number = '101' AND building = 'B栋';  -- 原2人，实际9人
UPDATE rooms SET capacity = 10 WHERE number = '102' AND building = 'B栋';  -- 原2人，实际8人
UPDATE rooms SET capacity = 8 WHERE number = '201' AND building = 'B栋';  -- 原2人，实际7人
UPDATE rooms SET capacity = 8 WHERE number = '202' AND building = 'B栋';  -- 原2人，实际6人

-- A栋也需要扩容
UPDATE rooms SET capacity = 10 WHERE number = '101' AND building = 'A栋';  -- 原4人，实际9人
UPDATE rooms SET capacity = 10 WHERE number = '102' AND building = 'A栋';  -- 原4人，实际8人
UPDATE rooms SET capacity = 8 WHERE number = '201' AND building = 'A栋';  -- 原4人，实际7人
UPDATE rooms SET capacity = 6 WHERE number = '202' AND building = 'A栋';  -- 原4人，实际6人

-- C栋扩容
UPDATE rooms SET capacity = 10 WHERE number = '101' AND building = 'C栋';  -- 原4人，实际9人
UPDATE rooms SET capacity = 10 WHERE number = '102' AND building = 'C栋';  -- 原4人，实际8人
UPDATE rooms SET capacity = 8 WHERE number = '201' AND building = 'C栋';  -- 原6人，实际7人

-- 3. 更新 occupied 字段以匹配实际入住人数
UPDATE rooms r
SET occupied = (
    SELECT COUNT(*) 
    FROM students s 
    WHERE s.room_number = r.number
);

-- 4. 更新房间状态
UPDATE rooms 
SET status = CASE 
    WHEN occupied >= capacity THEN 'Full'
    WHEN occupied = 0 THEN 'Available'
    ELSE 'Available'
END;

-- 5. 验证修复结果
-- SELECT 
--     r.number,
--     r.building,
--     r.capacity,
--     r.occupied,
--     r.status,
--     COUNT(s.id) as actual_students
-- FROM rooms r
-- LEFT JOIN students s ON r.number = s.room_number
-- GROUP BY r.number, r.building, r.capacity, r.occupied, r.status
-- ORDER BY r.building, r.number;
