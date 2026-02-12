-- 修复学生表缺少楼栋字段的问题

-- 1. 给学生表添加building字段
ALTER TABLE students ADD COLUMN IF NOT EXISTS building VARCHAR(50);

-- 2. 合理的分配方案：
-- 总共34名学生
-- A栋：101(4人), 102(4人), 201(4人), 202(4人), 301(6人) = 22人
-- B栋：101(4人), 102(4人), 201(4人) = 12人
-- C栋：暂时不住人

-- 3. A栋分配
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

-- 4. B栋分配
UPDATE students SET building = 'B栋', room_number = '101' 
WHERE student_id IN ('2023023', '2023024', '2023025', '2023026');

UPDATE students SET building = 'B栋', room_number = '102' 
WHERE student_id IN ('2023027', '2023028', '2023029', '2023030');

UPDATE students SET building = 'B栋', room_number = '201' 
WHERE student_id IN ('2023031', '2023032', '2023033', '2023034');

-- 5. C栋暂时不住人，设置为'-'
UPDATE students SET building = NULL, room_number = '-' WHERE building IS NULL;

-- 6. 更新房间入住数
UPDATE rooms r
SET occupied = (
    SELECT COUNT(*) 
    FROM students s 
    WHERE s.room_number = r.number AND s.building = r.building
);

-- 7. 验证结果
SELECT 
    'A栋' as building,
    (SELECT COUNT(*) FROM students WHERE building = 'A栋') as student_count
UNION ALL
SELECT 
    'B栋',
    (SELECT COUNT(*) FROM students WHERE building = 'B栋')
UNION ALL
SELECT 
    '未分配',
    (SELECT COUNT(*) FROM students WHERE building IS NULL OR building = '');
