
// ============================================
// 通用工具函数
// ============================================

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式模板
 * @returns {string}
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间
 * @param {Date|string|number} date - 日期
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天'
  }
  
  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[d.getDay()]
  }
  
  // 更早
  return formatDate(d, 'MM-DD')
}

/**
 * 深拷贝
 * @param {*} obj - 要拷贝的对象
 * @returns {*}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间
 * @returns {Function}
 */
export const debounce = (fn, delay = 300) => {
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
 * @param {number} interval - 间隔时间
 * @returns {Function}
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 判断对象是否为空
 * @param {*} obj - 要判断的对象
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true
  if (typeof obj === 'string') return obj.trim() === ''
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * 生成唯一ID
 * @returns {string}
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 文件大小格式化
 * @param {number} bytes - 字节数
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 手机号脱敏
 * @param {string} phone - 手机号
 * @returns {string}
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 身份证号脱敏
 * @param {string} idCard - 身份证号
 * @returns {string}
 */
export const maskIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return idCard
  return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2')
}

/**
 * 数组去重
 * @param {Array} arr - 数组
 * @param {string} key - 对象去重时的键
 * @returns {Array}
 */
export const unique = (arr, key) => {
  if (key) {
    const seen = new Set()
    return arr.filter(item => {
      const val = item[key]
      if (seen.has(val)) return false
      seen.add(val)
      return true
    })
  }
  return [...new Set(arr)]
}

/**
 * 数组分组
 * @param {Array} arr - 数组
 * @param {Function|string} key - 分组键
 * @returns {Object}
 */
export const groupBy = (arr, key) => {
  return arr.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

/**
 * 将对象转为查询字符串
 * @param {Object} params - 参数对象
 * @returns {string}
 */
export const toQueryString = (params) => {
  if (!params || typeof params !== 'object') return ''
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * 从查询字符串解析对象
 * @param {string} query - 查询字符串
 * @returns {Object}
 */
export const parseQueryString = (query) => {
  if (!query) return {}
  const params = {}
  query.replace(/^\?/, '').split('&').forEach(pair => {
    const [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })
  return params
}

/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
export const get = (obj, path, defaultValue) => {
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
 * 延迟执行
 * @param {number} ms - 毫秒数
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 重试函数
 * @param {Function} fn - 要执行的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 延迟时间
 * @returns {Promise}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < retries) {
        await sleep(delay * Math.pow(2, i))
      }
    }
  }
  throw lastError
}
