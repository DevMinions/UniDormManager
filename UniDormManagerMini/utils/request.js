// utils/request.js - 网络请求工具

const app = getApp()

// 请求计数器，用于管理多个并发请求的 loading 状态
let requestCount = 0
let loadingTimer = null

/**
 * 显示 loading
 */
function showLoading(text) {
  if (requestCount === 0) {
    // 延迟显示 loading，避免快速请求闪烁
    loadingTimer = setTimeout(() => {
      wx.showLoading({
        title: text || '加载中...',
        mask: true
      })
    }, 300)
  }
  requestCount++
}

/**
 * 隐藏 loading
 */
function hideLoading() {
  requestCount--
  if (requestCount <= 0) {
    requestCount = 0
    if (loadingTimer) {
      clearTimeout(loadingTimer)
      loadingTimer = null
    }
    wx.hideLoading()
  }
}

/**
 * 网络请求封装
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, needAuth = true } = options

    // 构建完整URL
    const fullUrl = app.globalData.baseUrl + url

    // 构建请求头
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    // 添加认证token
    if (needAuth && app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`
    }

    // 显示加载提示
    if (options.showLoading !== false) {
      showLoading(options.loadingText)
    }

    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          hideLoading()
        }

        // 处理响应
        if (res.statusCode === 200) {
          // 检查业务错误码
          if (res.data.code && res.data.code !== 200 && res.data.code !== 0) {
            const errorMsg = res.data.message || res.data.msg || '请求失败'
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(new Error(errorMsg))
            return
          }
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token过期，需要重新登录
          handleTokenExpired()
          reject(new Error('登录已过期'))
        } else if (res.statusCode === 403) {
          // 权限不足
          const errorMsg = '权限不足'
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          reject(new Error(errorMsg))
        } else if (res.statusCode >= 500) {
          // 服务器错误
          const errorMsg = '服务器繁忙，请稍后重试'
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          reject(new Error(errorMsg))
        } else {
          // 其他错误
          const errorMsg = res.data.message || res.data.msg || `请求失败(${res.statusCode})`
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          hideLoading()
        }

        // 网络错误处理
        console.error('网络请求失败:', err)
        let errorMsg = '网络连接失败'
        
        // 根据错误类型显示不同提示
        if (err.errMsg && err.errMsg.includes('timeout')) {
          errorMsg = '请求超时，请重试'
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          errorMsg = '网络连接失败，请检查网络'
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        reject(err)
      }
    })
  })
}

/**
 * 处理 Token 过期
 */
function handleTokenExpired() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  app.clearLoginStatus()
  
  // 重置 TabBar 为学生角色
  app.globalData.userLevel = 1
  app.globalData.userRole = 'student'
  app.globalData.userRoleName = '学生'
  app.refreshTabBarConfig()
  
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })
  
  setTimeout(() => {
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }, 1500)
}

/**
 * GET请求
 */
function get(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'GET',
    data: data,
    ...options
  })
}

/**
 * POST请求
 */
function post(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'POST',
    data: data,
    ...options
  })
}

/**
 * PUT请求
 */
function put(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'PUT',
    data: data,
    ...options
  })
}

/**
 * DELETE请求
 */
function del(url, data = {}, options = {}) {
  return request({
    url: url,
    method: 'DELETE',
    data: data,
    ...options
  })
}

/**
 * 上传文件
 */
function uploadFile(url, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const fullUrl = app.globalData.baseUrl + url

    // 构建请求头
    const header = {}
    if (app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`
    }

    // 显示加载提示
    if (options.showLoading !== false) {
      wx.showLoading({
        title: options.loadingText || '上传中...',
        mask: true
      })
    }

    wx.uploadFile({
      url: fullUrl,
      filePath: filePath,
      name: options.name || 'file',
      header: header,
      formData: options.formData || {},
      success: (res) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading()
        }

        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          resolve(data)
        } else {
          const errorMsg = '上传失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading()
        }

        console.error('文件上传失败:', err)
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile
}
