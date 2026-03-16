// ============================================
// 工具函数统一导出
// ============================================

// 基础工具
export {
  formatDate,
  formatRelativeTime,
  deepClone,
  debounce,
  throttle,
  isEmpty,
  generateId,
  formatFileSize,
  maskPhone,
  maskIdCard,
  unique,
  groupBy,
  toQueryString,
  parseQueryString,
  get,
  sleep,
  retry
} from './helpers.js'

// 错误处理
export {
  ErrorTypes,
  AppError,
  handleApiError,
  handleValidationError,
  globalErrorHandler
} from './errorHandler.js'

// 性能优化
export {
  initLazyLoad,
  getVirtualListData,
  debounceSearch,
  throttleLoadMore,
  cacheManager,
  preloadImages,
  getItemHeight
} from './performance.js'

// 表单验证
export {
  validateForm,
  validateField,
  showFirstError,
  validators
} from './validator.js'

// 常量
export {
  ROLES,
  ROLE_NAMES,
  REPAIR_STATUS,
  REPAIR_STATUS_CONFIG,
  ROOM_SWAP_STATUS,
  ROOM_SWAP_STATUS_CONFIG,
  LATE_RETURN_STATUS,
  LATE_RETURN_STATUS_CONFIG,
  ACCESS_DIRECTION,
  ACCESS_STATUS,
  INSPECTION_LEVEL,
  MESSAGE_TYPE,
  PAGINATION,
  STORAGE_KEYS,
  DATE_FORMAT
} from './constants.js'

// 通知服务
export {
  notificationService,
  localNotification,
  messageCenter,
  TEMPLATE_IDS
} from './notification.js'

// 兼容性导出（保留旧版函数名）
export { showSuccess, showError } from './common.js'
