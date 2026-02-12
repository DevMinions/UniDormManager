-- 彻底修复学生房间分配问题
-- 问题：所有学生的building都是'A栋'，需要正确分配到不同楼栋

-- 1. 先查看当前错误数据
-- SELECT student_id, name, building, room_number FROM students ORDER BY student_id;

-- 2. 重新正确分配学生到不同楼栋
-- 总共34名学生，合理分配：
-- A栋：101(4人), 102(4人), 201(4人), 202(4人), 301(6人) = 22人
-- B栋：101(4人), 102(4人), 201(4人) = 12人
-- C栋：0人

-- 清空building字段，重新分配
UPDATE students SET building = NULL;

-- A栋分配 - 前22名学生
UPDATE students SET building = 'A栋', room_number = '101' 
WHERE student_id IN ('2023001', '2023002', '2023003', '2023004');

UPDATE students SET building = 'A栋', room_number = '102' 
WHERE student_id IN ('2023005', '2023006', '2023007', '2023008');

UPDATE students SET building = 'A栋', room_number = '201' 
WHERE student_id IN ('2023009', '2023010', '2023011', '2023012');

UPDATE students SET building = 'A栋', room_number = '202' 
WHERE student_id IN ('2023013', '2023014', '2023015', '2023016');

UPDATE students SET building = 'A栋', room_number = '301' 
WHERE student_id IN ('2023017', '2023018', '2023019', '2023020', '2023021', '2023022');

-- B栋分配 - 后12名学生
UPDATE students SET building = 'B栋', room_number = '101' 
WHERE student_id IN ('2023023', '2023024', '2023025', '2023026');

UPDATE students SET building = 'B栋', room_number = '102' 
WHERE student_id IN ('2023027', '2023028', '2023029', '2023030');

UPDATE students SET building = 'B栋', room_number = '201' 
WHERE student_id IN ('2023031', '2023032', '2023033', '2023034');

-- 3. 更新房间入住数（按楼栋分别统计）
UPDATE rooms r
SET occupied = (
    SELECT COUNT(*) 
    FROM students s 
    WHERE s.room_number = r.number 
    AND s.building = r.building
);

-- 4. 更新房间状态
UPDATE rooms 
SET status = CASE 
    WHEN occupied >= capacity THEN 'Full'
    WHEN occupied = 0 THEN 'Available'
    ELSE 'Available'
END;

-- 5. 验证修复结果
SELECT 
    r.building as 楼栋,
    r.number as 房间,
    r.capacity as 容量,
    r.occupied as 入住数,
    (SELECT COUNT(*) FROM students s WHERE s.room_number = r.number AND s.building = r.building) as 实际统计
FROM rooms r
ORDER BY r.building, r.number;
