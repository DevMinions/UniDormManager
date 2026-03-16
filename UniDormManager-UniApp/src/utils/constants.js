// ============================================
// 常量定义
// ============================================

// 页面路径常量
export const PAGES = {
  HOME: '/pages/index/index',
  LOGIN: '/pages/login/login',
  PROFILE: '/pages/profile/index',
  
  // 报修
  REPAIRS_LIST: '/pages/repairs/list',
  REPAIRS_DETAIL: '/pages/repairs/detail',
  REPAIRS_SUBMIT: '/pages/repairs/submit',
  
  // 房间
  ROOMS_LIST: '/pages/rooms/list',
  ROOMS_DETAIL: '/pages/rooms/detail',
  
  // 公告
  NOTICES_LIST: '/pages/notices/list',
  NOTICES_DETAIL: '/pages/notices/detail',
  
  // 查寝
  INSPECTIONS_LIST: '/pages/inspections/list',
  INSPECTIONS_RANKINGS: '/pages/inspections/rankings',
  INSPECTIONS_SCORE: '/pages/inspections/score',
  
  // 换寝
  ROOM_SWAPS_LIST: '/pages/room-swaps/list',
  ROOM_SWAPS_APPLY: '/pages/room-swaps/apply',
  ROOM_SWAPS_DETAIL: '/pages/room-swaps/detail',
  
  // 入住退宿
  CHECKIN: '/pages/checkin/index',
  CHECKOUT: '/pages/checkout/index',
  
  // 管理员
  ADMIN_DASHBOARD: '/pages/admin/dashboard',
  ADMIN_USERS: '/pages/admin/users'
}

// 角色代码常量
export const ROLES = {
  STUDENT: 'student',
  DORM_MANAGER: 'dorm_manager',
  MAINTENANCE: 'maintenance_staff',
  BUILDING_MANAGER: 'building_manager',
  LOGISTICS_ADMIN: 'logistics_admin',
  SYSTEM_ADMIN: 'system_admin'
}

// 状态常量
export const STATUS = {
  // 报修状态
  REPAIR: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed'
  },
  
  // 换寝状态
  ROOM_SWAP: {
    PENDING: 'Pending',
    COUNSELOR_APPROVED: 'CounselorApproved',
    COUNSELOR_REJECTED: 'CounselorRejected',
    COLLEGE_APPROVED: 'CollegeApproved',
    COLLEGE_REJECTED: 'CollegeRejected',
    FINAL_APPROVED: 'FinalApproved',
    FINAL_REJECTED: 'FinalRejected',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  },
  
  // 查寝状态
  INSPECTION: {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    PASS: 'pass',
    WARNING: 'warning'
  },
  
  // 房间状态
  ROOM: {
    FREE: 'free',
    OCCUPIED: 'occupied',
    FULL: 'full'
  }
}

// 缓存键常量
export const CACHE_KEYS = {
  USER_INFO: 'user_info',
  TOKEN: 'token',
  ROOMS_LIST: 'rooms_list',
  REPAIRS_LIST: 'repairs_list',
  NOTICES_LIST: 'notices_list',
  INSPECTIONS_LIST: 'inspections_list'
}

// 颜色常量
export const COLORS = {
  PRIMARY: '#9A3412',
  PRIMARY_LIGHT: '#F8F2F0',
  PRIMARY_DARK: '#7C2D12',
  
  SUCCESS: '#059669',
  SUCCESS_LIGHT: '#ECFDF5',
  
  WARNING: '#D97706',
  WARNING_LIGHT: '#FEF3C7',
  
  ERROR: '#DC2626',
  ERROR_LIGHT: '#FEE2E2',
  
  INFO: '#3B82F6',
  INFO_LIGHT: '#DBEAFE',
  
  GRAY: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
}

// 分页常量
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
}

// 评分标准
export const SCORE_STANDARDS = {
  EXCELLENT: 90,
  GOOD: 80,
  PASS: 70,
  FAIL: 60
}

// 问题类型
export const ISSUE_TYPES = {
  BED_UNMADE: { value: 'bed_unmade', label: '床铺未整理' },
  GARBAGE: { value: 'garbage', label: '垃圾未清理' },
  DESK_CLUTTER: { value: 'desk_clutter', label: '桌面凌乱' },
  ILLEGAL_APPLIANCE: { value: 'illegal_appliance', label: '违规电器' },
  POWER_ISSUE: { value: 'power_issue', label: '私拉电线' },
  SMOKING: { value: 'smoking', label: '吸烟痕迹' },
  NOISE: { value: 'noise', label: '噪音扰民' },
  OTHER: { value: 'other', label: '其他问题' }
}
