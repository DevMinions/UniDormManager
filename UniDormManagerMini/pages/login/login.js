// pages/login/login.js
const app = getApp()
const { wechatLogin } = require('../../api/auth')

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    userInfo: null,
    hasUserInfo: false,
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
      return
    }

    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },

  /**
   * 微信登录
   */
  handleLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })

    // 获取微信登录code
    wx.login({
      success: (res) => {
        if (res.code) {
          this.loginWithCode(res.code)
        } else {
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },

  /**
   * 使用code登录
   */
  loginWithCode(code) {
    wechatLogin(code).then(data => {
      console.log('登录成功:', data)

      // 保存登录信息
      app.updateLoginStatus(
        data.token,
        data.user,
        data.user.role || 'student'
      )

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)

    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  /**
   * 获取用户信息
   */
  getUserInfo(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  }
})
