// Mock data for testing

export const mockStudents = [
  {
    id: '1',
    name: '张三',
    studentId: '2023001',
    major: '计算机科学',
    roomNumber: 'A-101',
    status: 'Active' as const,
  },
  {
    id: '2',
    name: '李四',
    studentId: '2023002',
    major: '软件工程',
    roomNumber: 'A-102',
    status: 'Active' as const,
  },
  {
    id: '3',
    name: '王五',
    studentId: '2023003',
    major: '人工智能',
    roomNumber: 'B-201',
    status: 'Graduated' as const,
  },
];

export const mockRooms = [
  {
    id: '1',
    number: 'A-101',
    buildingId: '1',
    building: 'A栋',
    capacity: 4,
    occupied: 4,
    type: 'Male' as const,
    status: 'Full' as const,
  },
  {
    id: '2',
    number: 'A-102',
    buildingId: '1',
    building: 'A栋',
    capacity: 4,
    occupied: 2,
    type: 'Male' as const,
    status: 'Available' as const,
  },
  {
    id: '3',
    number: 'B-201',
    buildingId: '2',
    building: 'B栋',
    capacity: 4,
    occupied: 0,
    type: 'Female' as const,
    status: 'Available' as const,
  },
];

export const mockBuildings = [
  {
    id: '1',
    name: 'A栋',
    type: 'Male' as const,
    floors: 6,
    manager: '张老师',
    description: '男生宿舍',
  },
  {
    id: '2',
    name: 'B栋',
    type: 'Female' as const,
    floors: 6,
    manager: '李老师',
    description: '女生宿舍',
  },
];

export const mockRepairs = [
  {
    id: '1',
    title: '水龙头漏水',
    description: '浴室洗脸盆水龙头持续漏水',
    status: 'pending' as const,
    date: '2024-01-15',
    roomNumber: 'A-101',
    priority: 'High' as const,
  },
  {
    id: '2',
    title: '灯泡损坏',
    description: '宿舍灯泡不亮',
    status: 'processing' as const,
    date: '2024-01-14',
    roomNumber: 'A-102',
    priority: 'Medium' as const,
  },
];

export const mockNotices = [
  {
    id: '1',
    title: '关于寒假期间宿舍管理的通知',
    content: '寒假期间请注意宿舍安全...',
    date: '2024-01-10',
    author: '宿舍管理中心',
  },
  {
    id: '2',
    title: '防火安全提醒',
    content: '严禁使用违规电器...',
    date: '2024-01-08',
    author: '安全部',
  },
];

export const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@unidorm.edu',
    phone: '13800138000',
    realName: '系统管理员',
    status: 'Active' as const,
    roles: [{ id: '1', code: 'system_admin', name: '系统管理员' }],
  },
  {
    id: '2',
    username: 'dorm_manager',
    email: 'dorm@unidorm.edu',
    phone: '13800138001',
    realName: '宿管员',
    status: 'Active' as const,
    roles: [{ id: '2', code: 'dorm_manager', name: '宿管员' }],
  },
];

export const mockRoles = [
  {
    id: '1',
    code: 'system_admin',
    name: '系统管理员',
    description: '拥有所有权限',
    level: 10,
  },
  {
    id: '2',
    code: 'dorm_manager',
    name: '宿管员',
    description: '管理宿舍日常事务',
    level: 3,
  },
];

export const mockInspections = [
  {
    id: '1',
    roomNumber: 'A-101',
    building: 'A栋',
    inspector: '张老师',
    checkDate: '2024-01-15',
    overallScore: 92,
    status: 'good' as const,
    comment: '整体卫生良好',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    roomNumber: 'A-102',
    building: 'A栋',
    inspector: '张老师',
    checkDate: '2024-01-15',
    overallScore: 78,
    status: 'fair' as const,
    comment: '需要加强卫生管理',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

export const mockAuthResponse = {
  token: 'mock-jwt-token',
  user: mockUsers[0],
  expiresIn: 3600,
};

export const mockPermissions = [
  {
    id: '1',
    code: 'students:read',
    name: '查看学生',
    resource: 'students',
    action: 'read',
    description: '查看学生信息',
  },
  {
    id: '2',
    code: 'students:create',
    name: '创建学生',
    resource: 'students',
    action: 'create',
    description: '创建学生信息',
  },
  {
    id: '3',
    code: 'rooms:read',
    name: '查看房间',
    resource: 'rooms',
    action: 'read',
    description: '查看房间信息',
  },
];

export const mockDashboardStats = {
  totalStudents: 1250,
  totalRooms: 500,
  totalBuildings: 10,
  pendingRepairs: 23,
  availableRooms: 45,
  occupancyRate: 91.0,
};
