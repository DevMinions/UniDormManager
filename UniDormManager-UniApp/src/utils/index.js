// ============================================
// 工具函数统一导出
// ============================================

// 基础工具
export {
  handleApiError,
  showSuccess,
  showError,
  showLoading,
  showConfirm,
  get,
  formatDate,
  debounce,
  throttle
} from './helpers.js'

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
  PAGES,
  ROLES,
  STATUS,
  CACHE_KEYS,
  COLORS,
  PAGINATION,
  SCORE_STANDARDS,
  ISSUE_TYPES
} from './constants.js'

// 通知服务
export {
  notificationService,
  localNotification,
  messageCenter,
  TEMPLATE_IDS
} from './notification.js'
