-- 测试数据脚本
-- 用于向数据库添加测试数据

-- 插入测试楼栋
INSERT INTO buildings (id, name, type, floors, manager, description) VALUES
('building-1', 'A栋', 'Male', 6, '张管理员', '男生宿舍楼，6层，共120个房间'),
('building-2', 'B栋', 'Female', 6, '李管理员', '女生宿舍楼，6层，共120个房间'),
('building-3', 'C栋', 'Co-ed', 5, '王管理员', '混合宿舍楼，5层，共100个房间')
ON CONFLICT (id) DO NOTHING;

-- 插入测试房间
INSERT INTO rooms (id, number, building, capacity, occupied, type, status) VALUES
-- A栋房间
('room-a101', '101', 'A栋', 4, 4, 'Male', 'Full'),
('room-a102', '102', 'A栋', 4, 3, 'Male', 'Available'),
('room-a103', '103', 'A栋', 4, 0, 'Male', 'Available'),
('room-a201', '201', 'A栋', 4, 2, 'Male', 'Available'),
('room-a202', '202', 'A栋', 4, 4, 'Male', 'Full'),
('room-a301', '301', 'A栋', 6, 4, 'Male', 'Available'),
-- B栋房间
('room-b101', '101', 'B栋', 2, 2, 'Female', 'Full'),
('room-b102', '102', 'B栋', 2, 1, 'Female', 'Available'),
('room-b201', '201', 'B栋', 2, 0, 'Female', 'Available'),
('room-b202', '202', 'B栋', 2, 2, 'Female', 'Full'),
-- C栋房间
('room-c101', '101', 'C栋', 4, 3, 'Co-ed', 'Available'),
('room-c102', '102', 'C栋', 4, 4, 'Co-ed', 'Full'),
('room-c201', '201', 'C栋', 6, 5, 'Co-ed', 'Available')
ON CONFLICT (id) DO NOTHING;

-- 插入测试学生
INSERT INTO students (id, name, student_id, major, room_number, status) VALUES
-- A栋学生
('student-1', '张三', '2023001', '计算机科学', '101', 'Active'),
('student-2', '李四', '2023002', '软件工程', '101', 'Active'),
('student-3', '王五', '2023003', '自动化', '101', 'Active'),
('student-4', '赵六', '2023004', '数学', '101', 'Active'),
('student-5', '孙七', '2023005', '英语', '102', 'Active'),
('student-6', '周八', '2023006', '物理', '102', 'Active'),
('student-7', '吴九', '2023007', '化学', '102', 'Active'),
('student-8', '郑十', '2023008', '生物', '201', 'Active'),
('student-9', '钱十一', '2023009', '历史', '201', 'Active'),
('student-10', '孙十二', '2023010', '哲学', '202', 'Active'),
('student-11', '周十三', '2023011', '法学', '202', 'Active'),
('student-12', '吴十四', '2023012', '经济学', '202', 'Active'),
('student-13', '郑十五', '2023013', '管理学', '202', 'Active'),
('student-14', '王十六', '2023014', '艺术', '301', 'Active'),
('student-15', '李十七', '2023015', '音乐', '301', 'Active'),
('student-16', '张十八', '2023016', '体育', '301', 'Active'),
('student-17', '刘十九', '2023017', '教育', '301', 'Active'),
-- B栋学生
('student-18', '陈二十', '2023018', '计算机科学', '101', 'Active'),
('student-19', '杨二一', '2023019', '软件工程', '101', 'Active'),
('student-20', '黄二二', '2023020', '英语', '102', 'Active'),
('student-21', '林二三', '2023021', '文学', '202', 'Active'),
('student-22', '徐二四', '2023022', '新闻学', '202', 'Active'),
-- C栋学生
('student-23', '朱二五', '2023023', '计算机科学', '101', 'Active'),
('student-24', '马二六', '2023024', '软件工程', '101', 'Active'),
('student-25', '胡二七', '2023025', '自动化', '101', 'Active'),
('student-26', '郭二八', '2023026', '数学', '102', 'Active'),
('student-27', '何二九', '2023027', '物理', '102', 'Active'),
('student-28', '高三十', '2023028', '化学', '102', 'Active'),
('student-29', '罗三一', '2023029', '生物', '102', 'Active'),
('student-30', '梁三二', '2023030', '环境科学', '201', 'Active'),
('student-31', '宋三三', '2023031', '材料科学', '201', 'Active'),
('student-32', '唐三四', '2023032', '机械工程', '201', 'Active'),
('student-33', '许三五', '2023033', '电气工程', '201', 'Active'),
('student-34', '韩三六', '2023034', '建筑学', '201', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 插入测试报修请求
INSERT INTO repair_requests (id, title, description, room_number, status, priority, date) VALUES
('repair-1', '水龙头漏水', '浴室洗脸盆水龙头持续漏水，需要维修', '101', 'Pending', 'Medium', CURRENT_DATE - INTERVAL '2 days'),
('repair-2', '窗户锁损坏', '窗户锁扣无法扣上，存在安全隐患', '205', 'In Progress', 'High', CURRENT_DATE - INTERVAL '1 day'),
('repair-3', '灯泡更换', '主卧灯光闪烁，需要更换', '103', 'Completed', 'Low', CURRENT_DATE - INTERVAL '5 days'),
('repair-4', '空调不制冷', '空调制冷效果差，需要检查维修', '102', 'Pending', 'High', CURRENT_DATE),
('repair-5', '门把手松动', '宿舍门把手松动，需要紧固', '201', 'Pending', 'Low', CURRENT_DATE),
('repair-6', '插座无电', '床头插座无电，需要检查电路', '301', 'In Progress', 'Medium', CURRENT_DATE - INTERVAL '1 day'),
('repair-7', '卫生间堵塞', '卫生间下水道堵塞，需要疏通', '202', 'Pending', 'Medium', CURRENT_DATE),
('repair-8', '窗帘损坏', '窗帘轨道损坏，无法正常使用', '101', 'Completed', 'Low', CURRENT_DATE - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 插入测试公告
INSERT INTO notices (id, title, content, author, date) VALUES
('notice-1', '关于寒假期间宿舍封闭管理的通知', '各位同学：寒假将至，为确保宿舍安全，所有宿舍将于1月15日开始封闭管理，请同学们在1月14日前整理好个人物品，关闭水电开关。', '后勤管理处', CURRENT_DATE - INTERVAL '10 days'),
('notice-2', '本周三 A 栋停水检修通知', '因管道维护，A 栋将于本周三下午 14:00-16:00 停水，请同学们提前储备用水，给大家带来的不便敬请谅解。', '维修中心', CURRENT_DATE - INTERVAL '5 days'),
('notice-3', '宿舍文明卫生检查评比结果公示', '经检查，本月文明宿舍名单如下：A101、B102、C201，以上宿舍保持良好，特此表扬。', '学生处', CURRENT_DATE - INTERVAL '15 days'),
('notice-4', '关于宿舍用电安全的温馨提示', '近期发现部分宿舍存在用电安全隐患，请同学们注意：1. 不使用大功率电器；2. 人走断电；3. 不乱拉电线。', '安全保卫处', CURRENT_DATE - INTERVAL '3 days'),
('notice-5', '宿舍楼门禁系统升级通知', '为提高宿舍安全管理，宿舍楼门禁系统将于本周升级，升级期间可能影响正常使用，请同学们携带学生证以备查验。', '后勤管理处', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

