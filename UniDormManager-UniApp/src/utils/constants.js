
// ============================================
// 业务常量定义
// ============================================

/**
 * 用户角色
 */
export const ROLES = {
  STUDENT: 'student',
  DORM_MANAGER: 'dorm_manager',
  MAINTENANCE_STAFF: 'maintenance_staff',
  BUILDING_MANAGER: 'building_manager',
  LOGISTICS_ADMIN: 'logistics_admin',
  SYSTEM_ADMIN: 'system_admin'
}

/**
 * 角色显示名称
 */
export const ROLE_NAMES = {
  [ROLES.STUDENT]: '学生',
  [ROLES.DORM_MANAGER]: '宿管员',
  [ROLES.MAINTENANCE_STAFF]: '维修人员',
  [ROLES.BUILDING_MANAGER]: '楼栋管理员',
  [ROLES.LOGISTICS_ADMIN]: '后勤管理员',
  [ROLES.SYSTEM_ADMIN]: '系统管理员'
}

/**
 * 报修状态
 */
export const REPAIR_STATUS = {
  PENDING: 'Pending',     // 待处理
  ASSIGNED: 'Assigned',   // 已分配
  PROCESSING: 'Processing', // 处理中
  COMPLETED: 'Completed', // 已完成
  CANCELLED: 'Cancelled'  // 已取消
}

/**
 * 报修状态显示配置
 */
export const REPAIR_STATUS_CONFIG = {
  [REPAIR_STATUS.PENDING]: { label: '待处理', color: '#F59E0B', bgColor: '#FEF3C7' },
  [REPAIR_STATUS.ASSIGNED]: { label: '已分配', color: '#3B82F6', bgColor: '#DBEAFE' },
  [REPAIR_STATUS.PROCESSING]: { label: '处理中', color: '#8B5CF6', bgColor: '#EDE9FE' },
  [REPAIR_STATUS.COMPLETED]: { label: '已完成', color: '#059669', bgColor: '#D1FAE5' },
  [REPAIR_STATUS.CANCELLED]: { label: '已取消', color: '#6B7280', bgColor: '#F3F4F6' }
}

/**
 * 换寝申请状态
 */
export const ROOM_SWAP_STATUS = {
  PENDING: 'Pending',     // 待审批
  APPROVED: 'Approved',   // 已通过
  REJECTED: 'Rejected',   // 已拒绝
  CANCELLED: 'Cancelled'  // 已取消
}

/**
 * 换寝状态显示配置
 */
export const ROOM_SWAP_STATUS_CONFIG = {
  [ROOM_SWAP_STATUS.PENDING]: { label: '待审批', color: '#F59E0B', bgColor: '#FEF3C7' },
  [ROOM_SWAP_STATUS.APPROVED]: { label: '已通过', color: '#059669', bgColor: '#D1FAE5' },
  [ROOM_SWAP_STATUS.REJECTED]: { label: '已拒绝', color: '#DC2626', bgColor: '#FEE2E2' },
  [ROOM_SWAP_STATUS.CANCELLED]: { label: '已取消', color: '#6B7280', bgColor: '#F3F4F6' }
}

/**
 * 晚归状态
 */
export const LATE_RETURN_STATUS = {
  PENDING: 'Pending',   // 待处理
  HANDLED: 'Handled',   // 已处理
  IGNORED: 'Ignored'    // 已忽略
}

/**
 * 晚归状态显示配置
 */
export const LATE_RETURN_STATUS_CONFIG = {
  [LATE_RETURN_STATUS.PENDING]: { label: '待处理', color: '#D97706', bgColor: '#FEF3C7' },
  [LATE_RETURN_STATUS.HANDLED]: { label: '已处理', color: '#059669', bgColor: '#D1FAE5' },
  [LATE_RETURN_STATUS.IGNORED]: { label: '已忽略', color: '#64748B', bgColor: '#F1F5F9' }
}

/**
 * 门禁进出方向
 */
export const ACCESS_DIRECTION = {
  IN: 'In',
  OUT: 'Out'
}

/**
 * 门禁状态
 */
export const ACCESS_STATUS = {
  NORMAL: 'Normal',   // 正常
  LATE: 'Late',       // 晚归
  ABSENT: 'Absent'    // 未归
}

/**
 * 查寝评分等级
 */
export const INSPECTION_LEVEL = {
  EXCELLENT: { min: 90, label: '优秀', color: '#059669' },
  GOOD: { min: 80, label: '良好', color: '#3B82F6' },
  PASS: { min: 60, label: '及格', color: '#F59E0B' },
  FAIL: { min: 0, label: '不及格', color: '#DC2626' }
}

/**
 * 消息类型
 */
export const MESSAGE_TYPE = {
  SYSTEM: 'system',
  REPAIR: 'repair',
  ROOMSWAP: 'roomswap',
  LATE: 'late',
  INSPECTION: 'inspection'
}

/**
 * 分页默认值
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 100
}

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
  SETTINGS: 'settings',
  NOTIFICATION_SETTINGS: 'notification_settings',
  LATE_RETURN_NOTIFICATIONS: 'late_return_notifications',
  SYSTEM_SETTINGS: 'system_settings'
}

/**
 * 日期时间格式
 */
export const DATE_FORMAT = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  FULL: 'YYYY-MM-DD HH:mm:ss'
}
