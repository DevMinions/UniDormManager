// ============================================
// HTTP 请求封装 - 基于 uni.request
// 新增功能: 请求缓存、性能监控
// ============================================

import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'

// 环境配置（baseURL 优先取构建时注入的 VITE_API_URL，缺省回退本机 8080）
// 部署/开发请在 .env 中设置 VITE_API_URL，例如：VITE_API_URL=http://localhost:8080
const ENV = {
  development: {
    baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8080'
  },
  production: {
    baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8080'
  }
}

const CURRENT_ENV = import.meta.env?.MODE === 'production' ? 'production' : 'development'
const BASE_URL = ENV[CURRENT_ENV].baseURL
const TIMEOUT = 30000

// 请求缓存存储
const cacheStore = new Map()
const cacheTimers = new Map()

// 请求计数器
let requestCount = 0
let loadingTimer = null

/**
 * 获取缓存键
 */
const getCacheKey = (url, params) => {
  return `${url}:${JSON.stringify(params || {})}`
}

/**
 * 获取缓存
 */
const getCache = (key, maxAge) => {
  const cached = cacheStore.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > maxAge) {
    cacheStore.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * 设置缓存
 */
const setCache = (key, data, maxAge) => {
  cacheStore.set(key, {
    data,
    timestamp: Date.now()
  })
  
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key))
  }
  
  const timer = setTimeout(() => {
    cacheStore.delete(key)
    cacheTimers.delete(key)
  }, maxAge)
  
  cacheTimers.set(key, timer)
}

/**
 * 清除缓存
 */
export const clearRequestCache = (key) => {
  if (key) {
    cacheStore.delete(key)
    if (cacheTimers.has(key)) {
      clearTimeout(cacheTimers.get(key))
      cacheTimers.delete(key)
    }
  } else {
    cacheStore.clear()
    cacheTimers.forEach(timer => clearTimeout(timer))
    cacheTimers.clear()
  }
}

// Loading 控制
const showRequestLoading = () => {
  requestCount++
  if (loadingTimer) clearTimeout(loadingTimer)
  loadingTimer = setTimeout(() => {
    if (requestCount > 0) {
      uni.showLoading({ title: '加载中...', mask: true })
    }
  }, 300)
}

const hideRequestLoading = () => {
  requestCount--
  if (requestCount <= 0) {
    requestCount = 0
    if (loadingTimer) {
      clearTimeout(loadingTimer)
      loadingTimer = null
    }
    uni.hideLoading()
  }
}

// 请求拦截
const requestInterceptor = (options) => {
  const userStore = useUserStore()
  
  if (userStore.token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${userStore.token}`
    }
  }
  
  options.header = {
    'Content-Type': 'application/json',
    ...options.header
  }
  
  return options
}

// 响应拦截
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  if (statusCode === 200) {
    return data
  } else if (statusCode === 401) {
    handleTokenExpired()
    return Promise.reject(new Error('登录已过期'))
  } else if (statusCode >= 500) {
    uni.showToast({ title: '服务器错误，请稍后重试', icon: 'none' })
    return Promise.reject(new Error('服务器错误'))
  } else {
    const errorMsg = data?.error?.message || data?.message || `请求失败 (${statusCode})`
    uni.showToast({ title: errorMsg, icon: 'none' })
    return Promise.reject(new Error(errorMsg))
  }
}

// Token 过期处理
const handleTokenExpired = () => {
  const userStore = useUserStore()
  userStore.logout()
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })
}

// 基础请求函数
const baseRequest = (options) => {
  return new Promise((resolve, reject) => {
    const { loading = true, cache = false, cacheMaxAge = 5 * 60 * 1000 } = options
    
    // 检查缓存
    if (cache && options.method === 'GET') {
      const cacheKey = getCacheKey(options.url, options.data)
      const cachedData = getCache(cacheKey, cacheMaxAge)
      if (cachedData) {
        console.log('[Request Cache Hit]:', options.url)
        resolve(cachedData)
        return
      }
    }
    
    if (loading) showRequestLoading()
    
    options = requestInterceptor(options)
    const url = options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`
    
    const startTime = Date.now()
    
    uni.request({
      ...options,
      url,
      timeout: TIMEOUT,
      success: (response) => {
        try {
          const result = responseInterceptor(response)
          
          // 缓存 GET 请求结果
          if (cache && options.method === 'GET') {
            const cacheKey = getCacheKey(options.url, options.data)
            setCache(cacheKey, result, cacheMaxAge)
          }
          
          // 性能日志
          const duration = Date.now() - startTime
          if (duration > 1000) {
            console.warn(`[Slow Request]: ${options.url} took ${duration}ms`)
          }
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        console.error('请求失败:', error)
        uni.showToast({ title: '网络错误，请检查网络连接', icon: 'none' })
        reject(new Error('网络错误'))
      },
      complete: () => {
        if (loading) hideRequestLoading()
      }
    })
  })
}

// 导出请求方法
export const request = {
  get(url, params = {}, options = {}) {
    return baseRequest({
      url,
      method: 'GET',
      data: params,
      ...options
    })
  },
  
  post(url, data = {}, options = {}) {
    return baseRequest({
      url,
      method: 'POST',
      data,
      ...options
    })
  },
  
  put(url, data = {}, options = {}) {
    return baseRequest({
      url,
      method: 'PUT',
      data,
      ...options
    })
  },
  
  delete(url, params = {}, options = {}) {
    return baseRequest({
      url,
      method: 'DELETE',
      data: params,
      ...options
    })
  },
  
  upload(url, filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const userStore = useUserStore()
      const header = {}
      
      if (userStore.token) {
        header['Authorization'] = `Bearer ${userStore.token}`
      }
      
      uni.uploadFile({
        url: `${BASE_URL}${url}`,
        filePath,
        name: options.name || 'file',
        header,
        formData: options.formData || {},
        success: (response) => {
          try {
            const data = JSON.parse(response.data)
            resolve(data)
          } catch (e) {
            resolve(response.data)
          }
        },
        fail: reject
      })
    })
  }
}

export default request
