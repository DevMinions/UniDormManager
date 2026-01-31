
import { Permission, Role, User } from '../types';

// 1. Permissions Definition
export const ALL_PERMISSIONS: Permission[] = [
  // Student Management
  { id: 'p1', code: 'students:read', name: '查看学生', resource: 'students', action: 'read', description: '允许查看学生列表和详情' },
  { id: 'p2', code: 'students:create', name: '创建学生', resource: 'students', action: 'create', description: '允许添加新学生' },
  { id: 'p3', code: 'students:update', name: '更新学生', resource: 'students', action: 'update', description: '允许编辑学生信息' },
  { id: 'p4', code: 'students:delete', name: '删除学生', resource: 'students', action: 'delete', description: '允许删除学生档案' },
  { id: 'p5', code: 'students:checkin', name: '办理入住', resource: 'students', action: 'special', description: '允许为学生分配宿舍' },
  { id: 'p6', code: 'students:checkout', name: '办理退宿', resource: 'students', action: 'special', description: '允许移除学生宿舍关联' },

  // Building Management
  { id: 'p7', code: 'buildings:read', name: '查看楼栋', resource: 'buildings', action: 'read', description: '允许查看楼栋信息' },
  { id: 'p8', code: 'buildings:create', name: '创建楼栋', resource: 'buildings', action: 'create', description: '允许新增楼栋' },
  { id: 'p9', code: 'buildings:update', name: '更新楼栋', resource: 'buildings', action: 'update', description: '允许编辑楼栋信息' },
  { id: 'p10', code: 'buildings:delete', name: '删除楼栋', resource: 'buildings', action: 'delete', description: '允许删除楼栋' },

  // Room Management
  { id: 'p11', code: 'rooms:read', name: '查看房间', resource: 'rooms', action: 'read', description: '允许查看房间状态' },
  { id: 'p12', code: 'rooms:create', name: '创建房间', resource: 'rooms', action: 'create', description: '允许新增房间' },
  { id: 'p13', code: 'rooms:update', name: '更新房间', resource: 'rooms', action: 'update', description: '允许编辑房间属性' },
  { id: 'p14', code: 'rooms:delete', name: '删除房间', resource: 'rooms', action: 'delete', description: '允许删除房间' },

  // Repair Management
  { id: 'p15', code: 'repairs:read', name: '查看报修', resource: 'repairs', action: 'read', description: '允许查看报修单' },
  { id: 'p16', code: 'repairs:create', name: '创建报修', resource: 'repairs', action: 'create', description: '允许提交报修申请' },
  { id: 'p17', code: 'repairs:update', name: '更新报修', resource: 'repairs', action: 'update', description: '允许更新维修进度' },
  { id: 'p18', code: 'repairs:delete', name: '删除报修', resource: 'repairs', action: 'delete', description: '允许删除历史报修单' },

  // Notice Management
  { id: 'p19', code: 'notices:read', name: '查看公告', resource: 'notices', action: 'read', description: '允许查看系统公告' },
  { id: 'p20', code: 'notices:create', name: '创建公告', resource: 'notices', action: 'create', description: '允许发布新公告' },
  { id: 'p21', code: 'notices:update', name: '更新公告', resource: 'notices', action: 'update', description: '允许编辑公告内容' },
  { id: 'p22', code: 'notices:delete', name: '删除公告', resource: 'notices', action: 'delete', description: '允许撤下公告' },

  // System Management (Users & Roles)
  { id: 'p23', code: 'users:read', name: '查看用户', resource: 'users', action: 'read', description: '允许查看后台用户列表' },
  { id: 'p24', code: 'users:create', name: '创建用户', resource: 'users', action: 'create', description: '允许新增管理员账户' },
  { id: 'p25', code: 'users:update', name: '更新用户', resource: 'users', action: 'update', description: '允许编辑用户信息和角色' },
  { id: 'p26', code: 'users:delete', name: '删除用户', resource: 'users', action: 'delete', description: '允许删除管理员账户' },
  { id: 'p27', code: 'roles:read', name: '查看角色', resource: 'roles', action: 'read', description: '允许查看角色和权限' },
  { id: 'p28', code: 'roles:create', name: '创建角色', resource: 'roles', action: 'create', description: '允许定义新角色' },
  { id: 'p29', code: 'roles:update', name: '更新角色', resource: 'roles', action: 'update', description: '允许修改角色权限' },
  { id: 'p30', code: 'roles:delete', name: '删除角色', resource: 'roles', action: 'delete', description: '允许移除自定义角色' },
  
  // Dashboard
  { id: 'p31', code: 'dashboard:read', name: '查看仪表盘', resource: 'dashboard', action: 'read', description: '允许访问数据概览' },
];

// 2. Initial Roles
export const INITIAL_ROLES: Role[] = [
  {
    id: 'r1',
    code: 'system_admin',
    name: '系统管理员',
    description: '拥有系统所有权限，负责整体运维。',
    level: 10,
    isSystem: true,
    permissionIds: ALL_PERMISSIONS.map(p => p.id) // All permissions
  },
  {
    id: 'r2',
    code: 'dorm_manager',
    name: '宿管员',
    description: '负责学生、房间和报修的日常管理。',
    level: 3,
    isSystem: true,
    permissionIds: [
      'p1', 'p2', 'p3', 'p4', 'p5', 'p6', // Students
      'p7', 'p11', 'p13', // Buildings read, Rooms read/update
      'p15', 'p17', // Repairs read/update
      'p19', 'p31' // Notices read, Dashboard
    ]
  },
  {
    id: 'r3',
    code: 'maintenance_staff',
    name: '维修人员',
    description: '负责处理报修任务。',
    level: 2,
    isSystem: true,
    permissionIds: [
      'p15', 'p17', // Repairs
      'p11', 'p13', // Rooms (update status)
      'p19', 'p31'
    ]
  },
  {
    id: 'r4',
    code: 'student',
    name: '学生',
    description: '普通学生账号。',
    level: 1,
    isSystem: true,
    permissionIds: ['p16', 'p19'] // Create repair, read notices
  }
];

// 3. Initial Users
export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    realName: '系统管理员',
    email: 'admin@unidorm.edu',
    phone: '13800138000',
    status: 'Active',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    roleIds: ['r1']
  },
  {
    id: 'u2',
    username: 'zhang_laoshi',
    realName: '张老师',
    email: 'zhang@unidorm.edu',
    phone: '13900139000',
    status: 'Active',
    createdAt: '2023-05-15',
    updatedAt: '2023-05-15',
    roleIds: ['r2']
  },
  {
    id: 'u3',
    username: 'li_shifu',
    realName: '李师傅',
    email: 'li@unidorm.edu',
    phone: '13700137000',
    status: 'Active',
    createdAt: '2023-06-20',
    updatedAt: '2023-06-20',
    roleIds: ['r3']
  }
];

// Helper to check permission
export const checkPermission = (user: User, resourceAction: string, roles: Role[]): boolean => {
  // 1. Find user's roles
  const userRoles = roles.filter(r => user.roleIds.includes(r.id));
  
  // 2. Collect all permission IDs
  const allPermIds = new Set<string>();
  userRoles.forEach(r => r.permissionIds.forEach(pid => allPermIds.add(pid)));

  // 3. Find target permission ID
  const targetPerm = ALL_PERMISSIONS.find(p => p.code === resourceAction);
  if (!targetPerm) return false;

  return allPermIds.has(targetPerm.id);
};
