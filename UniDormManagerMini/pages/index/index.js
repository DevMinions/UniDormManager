// pages/index/index.js
const app = getApp()
const { getStats } = require('../../api/dashboard')

Page({
  data: {
    stats: {
      totalRooms: 0,
      occupiedRooms: 0,
      freeRooms: 0,
      pendingRepairs: 0,
      totalStudents: 0,
      totalBuildings: 0
    },
    loading: true,
    isAdmin: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      isAdmin: app.globalData.userRole === 'admin'
    })

    this.loadStats()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.loadStats()
    }
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    this.setData({ loading: true })

    getStats().then(data => {
      console.log('统计数据:', data)
      this.setData({
        stats: data,
        loading: false
      })
    }).catch(err => {
      console.error('加载统计数据失败:', err)
      this.setData({ loading: false })
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadStats()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 快捷入口
   */
  goToRooms() {
    wx.switchTab({
      url: '/pages/rooms/list'
    })
  },

  goToRepairs() {
    wx.switchTab({
      url: '/pages/repairs/list/index'
    })
  },

  goToNotices() {
    wx.navigateTo({
      url: '/pages/notices/list/index'
    })
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/index'
    })
  }
})
