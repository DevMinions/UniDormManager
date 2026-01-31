// utils/request.js - 网络请求工具

const app = getApp()

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
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      })
    }

    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading()
        }

        // 处理响应
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token过期，需要重新登录
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.clearLoginStatus()
          wx.showToast({
            title: '登录已过期',
            icon: 'none'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
          reject(new Error('登录已过期'))
        } else {
          // 其他错误
          const errorMsg = res.data.message || '请求失败'
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
          wx.hideLoading()
        }

        // 网络错误
        console.error('网络请求失败:', err)
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        })
        reject(err)
      }
    })
  })
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
