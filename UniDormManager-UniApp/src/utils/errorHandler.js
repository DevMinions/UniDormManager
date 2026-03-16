
// ============================================
// 统一的错误处理工具
// ============================================

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',      // 网络错误
  AUTH: 'AUTH_ERROR',            // 认证错误
  VALIDATION: 'VALIDATION_ERROR', // 校验错误
  BUSINESS: 'BUSINESS_ERROR',    // 业务错误
  SERVER: 'SERVER_ERROR',        // 服务器错误
  UNKNOWN: 'UNKNOWN_ERROR'       // 未知错误
}

/**
 * 统一错误类
 */
export class AppError extends Error {
  constructor(type, message, details = {}) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 处理 API 错误
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 * @param {Object} options - 配置选项
 */
export const handleApiError = (error, defaultMessage = '操作失败', options = {}) => {
  const { 
    showToast = true,      // 是否显示 Toast
    logError = true,       // 是否记录日志
    rethrow = false        // 是否重新抛出
  } = options
  
  let message = defaultMessage
  let errorType = ErrorTypes.UNKNOWN
  
  // 解析错误类型
  if (error.response) {
    // HTTP 错误
    const status = error.response.status
    if (status === 401) {
      errorType = ErrorTypes.AUTH
      message = '登录已过期，请重新登录'
    } else if (status === 403) {
      errorType = ErrorTypes.AUTH
      message = '没有权限执行此操作'
    } else if (status === 404) {
      errorType = ErrorTypes.BUSINESS
      message = '请求的资源不存在'
    } else if (status >= 500) {
      errorType = ErrorTypes.SERVER
      message = '服务器繁忙，请稍后重试'
    }
  } else if (error.request) {
    // 请求未收到响应
    errorType = ErrorTypes.NETWORK
    message = '网络连接失败，请检查网络'
  } else if (error.message) {
    // 其他错误
    message = error.message
  }
  
  // 使用后端返回的错误消息
  if (error.data?.message) {
    message = error.data.message
  }
  
  // 显示 Toast
  if (showToast) {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }
  
  // 记录错误日志
  if (logError) {
    console.error('[API Error]:', {
      type: errorType,
      message,
      original: error,
      timestamp: new Date().toISOString()
    })
  }
  
  // 重新抛出
  if (rethrow) {
    throw new AppError(errorType, message, { original: error })
  }
  
  return { type: errorType, message }
}

/**
 * 处理表单校验错误
 * @param {Object} errors - 校验错误对象
 * @param {Object} fieldMap - 字段名映射
 */
export const handleValidationError = (errors, fieldMap = {}) => {
  const messages = []
  
  for (const [field, errorList] of Object.entries(errors)) {
    const fieldName = fieldMap[field] || field
    const errorMsg = Array.isArray(errorList) ? errorList[0] : errorList
    messages.push(`${fieldName}: ${errorMsg}`)
  }
  
  const message = messages.join('\n')
  
  uni.showModal({
    title: '表单校验失败',
    content: message,
    showCancel: false
  })
  
  return messages
}

/**
 * 全局错误处理
 * @param {Error} error - 错误对象
 */
export const globalErrorHandler = (error) => {
  console.error('[Global Error]:', error)
  
  // 上报错误（生产环境）
  // #ifdef PRODUCTION
  // reportError(error)
  // #endif
  
  // 显示友好的错误提示
  uni.showModal({
    title: '出错了',
    content: '抱歉，应用程序遇到了问题。请稍后重试或联系管理员。',
    showCancel: false
  })
}

/**
 * 重试机制
 * @param {Function} fn - 要执行的函数
 * @param {Object} options - 配置
 */
export const retry = async (fn, options = {}) => {
  const {
    retries = 3,
    delay = 1000,
    onRetry
  } = options
  
  let lastError
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i < retries) {
        if (onRetry) {
          onRetry(error, i + 1)
        }
        await sleep(delay * Math.pow(2, i)) // 指数退避
      }
    }
  }
  
  throw lastError
}

/**
 * 延迟函数
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
