// ============================================
// 工具函数 - 错误处理
// ============================================

/**
 * 处理 API 错误并显示提示
 * @param {Error} error - 错误对象
 * @param {string} defaultMsg - 默认错误消息
 */
export function handleApiError(error, defaultMsg = '操作失败，请重试') {
  console.error('API Error:', error)
  
  let message = defaultMsg
  
  if (error?.response?.data?.message) {
    message = error.response.data.message
  } else if (error?.message) {
    message = error.message
  }
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
  
  return message
}

/**
 * 显示成功提示
 * @param {string} message - 成功消息
 */
export function showSuccess(message) {
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 1500
  })
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 */
export function showError(message) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 显示加载中
 * @param {string} title - 加载提示文字
 * @returns {Function} 关闭加载的函数
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
  
  return () => {
    uni.hideLoading()
  }
}

/**
 * 确认对话框
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {Promise<boolean>} 用户是否确认
 */
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
export function get(obj, path, defaultValue = null) {
  if (!obj || !path) return defaultValue
  
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue
    }
    result = result[key]
  }
  
  return result !== undefined ? result : defaultValue
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function}
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
