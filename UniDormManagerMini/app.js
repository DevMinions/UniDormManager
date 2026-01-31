// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    userRole: null, // 'admin' 或 'student'
    baseUrl: 'http://localhost:8080', // 开发环境API地址
    isLoggedIn: false
  },

  onLaunch() {
    console.log('小程序启动')
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userRole = wx.getStorageSync('userRole')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userRole = userRole
      this.globalData.isLoggedIn = true
      console.log('用户已登录:', userInfo)
    } else {
      this.globalData.isLoggedIn = false
      console.log('用户未登录')
    }
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 更新登录状态
  updateLoginStatus(token, userInfo, userRole) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.userRole = userRole
    this.globalData.isLoggedIn = true

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userRole', userRole)
  },

  // 清除登录状态
  clearLoginStatus() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.userRole = null
    this.globalData.isLoggedIn = false

    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')
  }
})
