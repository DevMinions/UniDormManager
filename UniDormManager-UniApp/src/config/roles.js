// ============================================
// 角色配置 - 不同角色的首页功能模块
// ============================================

// 角色定义
export const ROLES = {
  STUDENT: 'student',              // 学生
  DORM_MANAGER: 'dorm_manager',    // 宿管员
  MAINTENANCE: 'maintenance_staff', // 维修人员
  BUILDING_MANAGER: 'building_manager', // 楼栋管理员
  LOGISTICS_ADMIN: 'logistics_admin',   // 后勤管理员
  SYSTEM_ADMIN: 'system_admin'     // 系统管理员
}

// 角色信息配置
export const ROLE_CONFIG = {
  [ROLES.STUDENT]: {
    name: '学生',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '🎓',
    description: '宿舍入住学生'
  },
  [ROLES.DORM_MANAGER]: {
    name: '宿管员',
    color: '#059669',
    bgColor: '#ECFDF5',
    icon: '🏠',
    description: '宿舍楼管理员'
  },
  [ROLES.MAINTENANCE]: {
    name: '维修人员',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: '🔧',
    description: '设备维修工人'
  },
  [ROLES.BUILDING_MANAGER]: {
    name: '楼栋管理员',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    icon: '🏢',
    description: '特定楼栋负责人'
  },
  [ROLES.LOGISTICS_ADMIN]: {
    name: '后勤管理员',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '📋',
    description: '后勤部门管理员'
  },
  [ROLES.SYSTEM_ADMIN]: {
    name: '系统管理员',
    color: '#1E293B',
    bgColor: '#F1F5F9',
    icon: '⚡',
    description: '系统超级管理员'
  }
}

// 各角色的首页快捷菜单
export const ROLE_QUICK_MENU = {
  [ROLES.STUDENT]: [
    { icon: '🔧', text: '我要报修', path: '/pages/repairs/submit', color: '#FEF3C7' },
    { icon: '📋', text: '我的报修', path: '/pages/repairs/list', color: '#ECFDF5' },
    { icon: '🔄', text: '换寝申请', path: '/pages/room-swaps/list', color: '#F8F2F0' },
    { icon: '📢', text: '公告', path: '/pages/notices/list', color: '#F8F2F0' },
    { icon: '⭐', text: '宿舍评分', path: '/pages/inspections/list', color: '#FEF3C7' },
    { icon: '🏆', text: '排行榜', path: '/pages/inspections/rankings', color: '#FEF3C7' },
    { icon: '🌙', text: '晚归记录', path: '/pages/late-returns/list', color: '#FEE2E2' },
    { icon: '🚪', text: '门禁记录', path: '/pages/access-logs/list', color: '#EFF6FF' }
  ],
  [ROLES.DORM_MANAGER]: [
    { icon: '📋', text: '报修管理', path: '/pages/repairs/list', color: '#ECFDF5' },
    { icon: '🏠', text: '房间管理', path: '/pages/rooms/list', color: '#F8F2F0' },
    { icon: '👥', text: '学生管理', path: '/pages/admin/users', color: '#EFF6FF' },
    { icon: '📝', text: '查寝评分', path: '/pages/inspections/score', color: '#FEF3C7' },
    { icon: '🌙', text: '晚归告警', path: '/pages/late-returns/list', color: '#FEE2E2' },
    { icon: '🚪', text: '门禁记录', path: '/pages/access-logs/list', color: '#EFF6FF' },
    { icon: '📢', text: '发布公告', path: '/pages/notices/list', color: '#FEF3C7' }
  ],
  [ROLES.MAINTENANCE]: [
    { icon: '📋', text: '待处理工单', path: '/pages/repairs/list', color: '#FEF3C7' },
    { icon: '✅', text: '已完成', path: '/pages/repairs/list?status=completed', color: '#ECFDF5' },
    { icon: '🔧', text: '提交报修', path: '/pages/repairs/submit', color: '#EFF6FF' },
    { icon: '📢', text: '公告', path: '/pages/notices/list', color: '#F8F2F0' }
  ],
  [ROLES.BUILDING_MANAGER]: [
    { icon: '🏢', text: '房间管理', path: '/pages/rooms/list', color: '#EDE9FE' },
    { icon: '👥', text: '学生管理', path: '/pages/admin/users', color: '#ECFDF5' },
    { icon: '📝', text: '查寝评分', path: '/pages/inspections/score', color: '#FEF3C7' },
    { icon: '📋', text: '报修管理', path: '/pages/repairs/list', color: '#FEF3C7' },
    { icon: '📢', text: '公告', path: '/pages/notices/list', color: '#F8F2F0' }
  ],
  [ROLES.LOGISTICS_ADMIN]: [
    { icon: '📊', text: '数据统计', path: '/pages/admin/statistics', color: '#FEE2E2' },
    { icon: '🔧', text: '报修管理', path: '/pages/repairs/list', color: '#FEF3C7' },
    { icon: '🏢', text: '楼栋管理', path: '/pages/buildings/list', color: '#EDE9FE' },
    { icon: '🏠', text: '房间管理', path: '/pages/rooms/list', color: '#F8F2F0' },
    { icon: '📢', text: '公告管理', path: '/pages/notices/list', color: '#ECFDF5' }
  ],
  [ROLES.SYSTEM_ADMIN]: [
    { icon: '⚡', text: '系统管理', path: '/pages/admin/dashboard', color: '#F1F5F9' },
    { icon: '👤', text: '用户管理', path: '/pages/admin/users', color: '#EFF6FF' },
    { icon: '🏠', text: '房间管理', path: '/pages/rooms/list', color: '#ECFDF5' },
    { icon: '📋', text: '报修管理', path: '/pages/repairs/list', color: '#FEF3C7' }
  ]
}

// 各角色的统计卡片配置
export const ROLE_STATS = {
  [ROLES.STUDENT]: [
    { icon: '🏠', key: 'roomNumber', label: '我的宿舍', variant: 'primary' },
    { icon: '🔧', key: 'pendingRepairs', label: '待处理报修', variant: 'warning' },
    { icon: '📋', key: 'unreadNotices', label: '未读通知', variant: 'secondary' },
    { icon: '⭐', key: 'roomScore', label: '宿舍评分', variant: 'success' }
  ],
  [ROLES.DORM_MANAGER]: [
    { icon: '📋', key: 'pendingRepairs', label: '待处理报修', variant: 'warning' },
    { icon: '🏠', key: 'totalRooms', label: '管理房间', variant: 'primary' },
    { icon: '👥', key: 'totalStudents', label: '入住学生', variant: 'secondary' },
    { icon: '⚠️', key: 'urgentIssues', label: '紧急事项', variant: 'error' }
  ],
  [ROLES.MAINTENANCE]: [
    { icon: '⏳', key: 'pendingTasks', label: '待处理', variant: 'warning' },
    { icon: '🔧', key: 'processingTasks', label: '处理中', variant: 'info' },
    { icon: '✅', key: 'completedToday', label: '今日完成', variant: 'success' },
    { icon: '📊', key: 'weeklyTotal', label: '本周工单', variant: 'secondary' }
  ],
  [ROLES.BUILDING_MANAGER]: [
    { icon: '🏢', key: 'buildingName', label: '管理楼栋', variant: 'primary' },
    { icon: '👥', key: 'totalStudents', label: '入住学生', variant: 'secondary' },
    { icon: '📋', key: 'pendingRepairs', label: '待处理报修', variant: 'warning' },
    { icon: '⭐', key: 'avgScore', label: '平均评分', variant: 'success' }
  ],
  [ROLES.LOGISTICS_ADMIN]: [
    { icon: '🏠', key: 'totalBuildings', label: '管理楼栋', variant: 'primary' },
    { icon: '👥', key: 'totalStudents', label: '入住学生', variant: 'secondary' },
    { icon: '📋', key: 'monthlyRepairs', label: '本月报修', variant: 'warning' },
    { icon: '💰', key: 'repairCosts', label: '维修费用', variant: 'info' }
  ],
  [ROLES.SYSTEM_ADMIN]: [
    { icon: '👤', key: 'totalUsers', label: '系统用户', variant: 'primary' },
    { icon: '🏠', key: 'totalRooms', label: '房间总数', variant: 'secondary' },
    { icon: '📊', key: 'onlineUsers', label: '在线用户', variant: 'success' },
    { icon: '⚠️', key: 'systemAlerts', label: '系统告警', variant: 'error' }
  ]
}

// 获取角色配置
export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG[ROLES.STUDENT]
}

// 获取角色快捷菜单
export function getRoleQuickMenu(role) {
  return ROLE_QUICK_MENU[role] || ROLE_QUICK_MENU[ROLES.STUDENT]
}

// 获取角色统计配置
export function getRoleStats(role) {
  return ROLE_STATS[role] || ROLE_STATS[ROLES.STUDENT]
}

// 判断是否有权限
export function hasPermission(userRoles, requiredRole) {
  if (!userRoles || userRoles.length === 0) return false
  if (Array.isArray(requiredRole)) {
    return userRoles.some(role => requiredRole.includes(role))
  }
  return userRoles.includes(requiredRole)
}

// 是否是管理员
export function isAdmin(userRoles) {
  return hasPermission(userRoles, [ROLES.SYSTEM_ADMIN, ROLES.LOGISTICS_ADMIN])
}

// 是否是宿管相关人员
export function isDormStaff(userRoles) {
  return hasPermission(userRoles, [ROLES.DORM_MANAGER, ROLES.BUILDING_MANAGER])
}

export default {
  ROLES,
  ROLE_CONFIG,
  ROLE_QUICK_MENU,
  ROLE_STATS,
  getRoleConfig,
  getRoleQuickMenu,
  getRoleStats,
  hasPermission,
  isAdmin,
  isDormStaff
}
