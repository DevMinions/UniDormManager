// ============================================
// 通用工具函数
// ============================================

/**
 * 显示成功提示
 * @param {string} title - 提示内容
 */
export const showSuccess = (title) => {
  uni.showToast({
    title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 * @param {string} title - 提示内容
 */
export const showError = (title) => {
  uni.showToast({
    title,
    icon: 'error',
    duration: 2000
  })
}

/**
 * 格式化日期
 * @param {string|number|Date} date - 日期
 * @param {string} format - 格式
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 防抖函数
 * @param {Function} fn - 函数
 * @param {number} delay - 延迟时间
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 函数
 * @param {number} interval - 间隔时间
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 深拷贝
 * @param {any} obj - 对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const copy = {}
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key])
    })
    return copy
  }
  return obj
}

/**
 * 校验手机号
 * @param {string} phone - 手机号
 */
export const isValidPhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 校验邮箱
 * @param {string} email - 邮箱
 */
export const isValidEmail = (email) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return reg.test(email)
}

/**
 * 获取当前页面路径
 */
export const getCurrentPagePath = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage ? currentPage.route : ''
}

/**
 * 跳转页面
 * @param {string} url - 路径
 * @param {object} options - 选项
 */
export const navigateTo = (url, options = {}) => {
  const { replace = false, tab = false } = options
  
  if (tab) {
    uni.switchTab({ url })
  } else if (replace) {
    uni.redirectTo({ url })
  } else {
    uni.navigateTo({ url })
  }
}

/**
 * 返回上一页
 * @param {number} delta - 返回层数
 */
export const navigateBack = (delta = 1) => {
  uni.navigateBack({ delta })
}

/**
 * 预览图片
 * @param {string[]} urls - 图片列表
 * @param {number} current - 当前索引
 */
export const previewImage = (urls, current = 0) => {
  uni.previewImage({
    urls,
    current
  })
}

/**
 * 选择图片
 * @param {number} count - 数量
 * @param {string[]} sourceType - 来源
 */
export const chooseImage = (count = 1, sourceType = ['album', 'camera']) => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sourceType,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 保存数据到本地
 * @param {string} key - 键
 * @param {any} data - 数据
 */
export const setStorage = (key, data) => {
  try {
    uni.setStorageSync(key, data)
    return true
  } catch (e) {
    console.error('保存数据失败:', e)
    return false
  }
}

/**
 * 从本地获取数据
 * @param {string} key - 键
 */
export const getStorage = (key) => {
  try {
    return uni.getStorageSync(key)
  } catch (e) {
    console.error('获取数据失败:', e)
    return null
  }
}

/**
 * 移除本地数据
 * @param {string} key - 键
 */
export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    console.error('移除数据失败:', e)
    return false
  }
}

/**
 * 生成唯一 ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 文件大小格式化
 * @param {number} bytes - 字节数
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
