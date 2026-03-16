
import { useUserStore } from '@/store/modules/user'
import { 
  isStudent, 
  isDormStaff, 
  isAdmin,
  isLogisticsAdmin,
  isSystemAdmin 
} from '@/config/roles.js'

/**
 * 权限检查 Hook
 * 
 * 使用示例:
 * const { checkAuth, checkRole, requireRole } = useAuth()
 * 
 * // 基础登录检查
 * onShow(() => {
 *   if (!checkAuth()) return
 *   loadData()
 * })
 * 
 * // 角色检查
 * onShow(() => {
 *   if (!checkRole(isAdmin)) return
 *   loadData()
 * })
 * 
 * // 多角色检查
 * onShow(() => {
 *   if (!requireRole(['system_admin', 'logistics_admin'])) return
 *   loadData()
 * })
 */
export function useAuth() {
  const userStore = useUserStore()

  /**
   * 基础登录检查
   * @param {Object} options - 配置
   * @returns {boolean}
   */
  const checkAuth = (options = {}) => {
    const { 
      redirect = '/pages/login/login',
      showToast = true 
    } = options

    if (!userStore.isLoggedIn) {
      if (showToast) {
        uni.showToast({ title: '请先登录', icon: 'none' })
      }
      if (redirect) {
        uni.reLaunch({ url: redirect })
      }
      return false
    }

    return true
  }

  /**
   * 角色检查
   * @param {Function|Array} roleChecker - 角色检查函数或函数数组
   * @param {Object} options - 配置
   * @returns {boolean}
   */
  const checkRole = (roleChecker, options = {}) => {
    const { 
      showToast = true,
      toastMessage = '无权限访问',
      navigateBack = true 
    } = options

    // 先检查登录
    if (!checkAuth(options)) {
      return false
    }

    const roles = userStore.userInfo?.roles?.map(r => 
      typeof r === 'string' ? r : r.code
    ) || []

    // 支持单个检查函数或数组
    const checkers = Array.isArray(roleChecker) ? roleChecker : [roleChecker]
    const hasRole = checkers.some(checker => checker(roles))

    if (!hasRole) {
      if (showToast) {
        uni.showToast({ title: toastMessage, icon: 'none' })
      }
      if (navigateBack) {
        setTimeout(() => uni.navigateBack(), 1500)
      }
      return false
    }

    return true
  }

  /**
   * 要求特定角色
   * @param {Array<string>} requiredRoles - 所需角色代码列表
   * @param {Object} options - 配置
   * @returns {boolean}
   */
  const requireRole = (requiredRoles, options = {}) => {
    const roleChecker = (userRoles) => {
      return requiredRoles.some(role => userRoles.includes(role))
    }
    return checkRole(roleChecker, options)
  }

  /**
   * 检查是否为管理员（任意管理员）
   */
  const checkAdmin = (options = {}) => {
    return checkRole(isAdmin, { 
      toastMessage: '需要管理员权限',
      ...options 
    })
  }

  /**
   * 检查是否为系统管理员
   */
  const checkSystemAdmin = (options = {}) => {
    return checkRole(isSystemAdmin, { 
      toastMessage: '需要系统管理员权限',
      ...options 
    })
  }

  /**
   * 检查是否为宿管人员
   */
  const checkDormStaff = (options = {}) => {
    return checkRole(isDormStaff, { 
      toastMessage: '需要宿管权限',
      ...options 
    })
  }

  /**
   * 检查是否为学生
   */
  const checkStudent = (options = {}) => {
    return checkRole(isStudent, { 
      toastMessage: '需要学生权限',
      ...options 
    })
  }

  /**
   * 获取当前用户角色
   */
  const getUserRoles = () => {
    return userStore.userInfo?.roles?.map(r => 
      typeof r === 'string' ? r : r.code
    ) || []
  }

  /**
   * 判断是否有指定角色
   */
  const hasRole = (roleCode) => {
    const roles = getUserRoles()
    return roles.includes(roleCode)
  }

  /**
   * 判断是否有任意指定角色
   */
  const hasAnyRole = (roleCodes) => {
    const roles = getUserRoles()
    return roleCodes.some(code => roles.includes(code))
  }

  return {
    checkAuth,
    checkRole,
    requireRole,
    checkAdmin,
    checkSystemAdmin,
    checkDormStaff,
    checkStudent,
    getUserRoles,
    hasRole,
    hasAnyRole
  }
}

/**
 * 页面级权限守卫
 * 在页面中直接使用
 * 
 * 使用示例:
 * onShow(() => {
 *   authGuard(() => loadData(), { requireAdmin: true })
 * })
 */
export function authGuard(callback, options = {}) {
  const { 
    requireAdmin = false,
    requireLogin = true,
    roles = []
  } = options

  const { checkAuth, checkRole, isAdmin } = useAuth()

  // 检查登录
  if (requireLogin && !checkAuth(options)) {
    return false
  }

  // 检查管理员
  if (requireAdmin && !checkRole(isAdmin, options)) {
    return false
  }

  // 检查特定角色
  if (roles.length > 0 && !checkRole(roles, options)) {
    return false
  }

  // 执行回调
  if (typeof callback === 'function') {
    callback()
  }

  return true
}
