// pages/profile/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isAdmin: false,
    hasLogin: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const hasLogin = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo
    const isAdmin = app.globalData.userRole === 'admin'

    this.setData({
      hasLogin,
      userInfo,
      isAdmin
    })
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  },

  /**
   * 跳转到房间管理（管理员）
   */
  goToRoomManagement() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到公告管理（管理员）
   */
  goToNoticeManagement() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
