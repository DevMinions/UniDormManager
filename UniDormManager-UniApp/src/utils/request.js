// ============================================
// HTTP 请求封装 - 基于 uni.request
// ============================================

import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'

// 环境配置
const ENV = {
  // 开发环境 - 使用局域网 IP 或 localhost
  development: {
    // 注意：微信小程序不能访问 localhost，需要使用局域网 IP 或配置代理
    baseURL: 'http://192.168.1.36:8080'
  },
  // 生产环境
  production: {
    baseURL: 'https://api.yourdomain.com'
  }
}

// 当前环境
const CURRENT_ENV = 'development'

// 请求基础配置
const BASE_URL = ENV[CURRENT_ENV].baseURL
const TIMEOUT = 30000

// 请求计数器（处理多个并发请求时的 loading）
let requestCount = 0
let loadingTimer = null

// 显示 loading
const showRequestLoading = () => {
  requestCount++
  if (loadingTimer) {
    clearTimeout(loadingTimer)
  }
  // 延迟 300ms 显示 loading，避免快速请求闪烁
  loadingTimer = setTimeout(() => {
    if (requestCount > 0) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }
  }, 300)
}

// 隐藏 loading
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
  
  // 添加 token
  if (userStore.token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${userStore.token}`
    }
  }
  
  // 默认 header
  options.header = {
    'Content-Type': 'application/json',
    ...options.header
  }
  
  return options
}

// 响应拦截
const responseInterceptor = (response) => {
  const { statusCode, data } = response
  
  // HTTP 状态码处理
  if (statusCode === 200) {
    // 直接返回数据（后端返回的是原始数据，不是包装格式）
    return data
  } else if (statusCode === 401) {
    // Token 过期
    handleTokenExpired()
    return Promise.reject(new Error('登录已过期'))
  } else if (statusCode >= 500) {
    uni.showToast({
      title: '服务器错误，请稍后重试',
      icon: 'none'
    })
    return Promise.reject(new Error('服务器错误'))
  } else {
    // 处理错误响应
    const errorMsg = data?.error?.message || data?.message || `请求失败 (${statusCode})`
    uni.showToast({
      title: errorMsg,
      icon: 'none'
    })
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
    const { loading = true } = options
    
    // 显示 loading
    if (loading) {
      showRequestLoading()
    }
    
    // 应用请求拦截
    options = requestInterceptor(options)
    
    // 完整 URL
    const url = options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`
    
    uni.request({
      ...options,
      url,
      timeout: TIMEOUT,
      success: (response) => {
        try {
          const result = responseInterceptor(response)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        console.error('请求失败:', error)
        uni.showToast({
          title: '网络错误，请检查网络连接',
          icon: 'none'
        })
        reject(new Error('网络错误'))
      },
      complete: () => {
        if (loading) {
          hideRequestLoading()
        }
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
