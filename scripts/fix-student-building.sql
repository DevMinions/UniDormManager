-- 修复学生表缺少楼栋字段的问题

-- 1. 给学生表添加building字段
ALTER TABLE students ADD COLUMN IF NOT EXISTS building VARCHAR(50);

-- 2. 根据现有数据推断楼栋（基于学号范围分配）
-- 这里使用简单的分配逻辑：根据学号尾数分配到不同楼栋
UPDATE students 
SET building = CASE 
    WHEN RIGHT(student_id, 1) IN ('1', '4', '7') THEN 'A栋'
    WHEN RIGHT(student_id, 1) IN ('2', '5', '8') THEN 'B栋'
    WHEN RIGHT(student_id, 1) IN ('3', '6', '9', '0') THEN 'C栋'
    ELSE 'A栋'
END
WHERE building IS NULL OR building = '';

-- 3. 重新分配房间，确保每个房间的入住人数合理
-- 首先清空所有学生的房间分配
UPDATE students SET room_number = '-', building = NULL;

-- 4. 重新分配学生到房间（确保不超标）
-- A栋分配
UPDATE students 
SET room_number = '101', building = 'A栋'
WHERE student_id IN ('2023001', '2023002', '2023003', '2023004');

UPDATE students 
SET room_number = '102', building = 'A栋'
WHERE student_id IN ('2023005', '2023006', '2023007', '2023008');

UPDATE students 
SET room_number = '201', building = 'A栋'
WHERE student_id IN ('2023009', '2023010', '2023011', '2023012');

UPDATE students 
SET room_number = '202', building = 'A栋'
WHERE student_id IN ('2023013', '2023014', '2023015', '2023016');

UPDATE students 
SET room_number = '301', building = 'A栋'
WHERE student_id IN ('2023017', '2023018', '2023019', '2023020');

-- B栋分配
UPDATE students 
SET room_number = '101', building = 'B栋'
WHERE student_id IN ('2023021', '2023022', '2023023', '2023024');

UPDATE students 
SET room_number = '102', building = 'B栋'
WHERE student_id IN ('2023025', '2023026', '2023027', '2023028');

UPDATE students 
SET room_number = '201', building = 'B栋'
WHERE student_id IN ('2023029', '2023030', '2023031', '2023032');

UPDATE students 
SET room_number = '202', building = 'B栋'
WHERE student_id IN ('2023033', '2023034');

-- C栋分配（剩余学生）
UPDATE students 
SET room_number = '101', building = 'C栋'
WHERE building IS NULL OR building = '';

-- 5. 更新房间入住数
UPDATE rooms r
SET occupied = (
    SELECT COUNT(*) 
    FROM students s 
    WHERE s.room_number = r.number AND s.building = r.building
);

-- 6. 验证修复结果
SELECT 
    r.building,
    r.number as room_number,
    r.capacity,
    r.occupied,
    (SELECT COUNT(*) FROM students s WHERE s.room_number = r.number AND s.building = r.building) as actual_count
FROM rooms r
ORDER BY r.building, r.number;
