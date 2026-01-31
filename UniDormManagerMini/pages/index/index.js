// pages/index/index.js
const app = getApp()
const { getStats } = require('../../api/dashboard')

Page({
  data: {
    currentDate: '',
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

    // 设置当前日期
    this.setCurrentDate()

    this.setData({
      isAdmin: app.globalData.userRole === 'admin'
    })

    this.loadStats()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.setCurrentDate()
      this.loadStats()
    }
  },

  /**
   * 设置当前日期
   */
  setCurrentDate() {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[date.getDay()]
    
    this.setData({
      currentDate: `${year}年${month}月${day}日 星期${weekDay}`
    })
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    this.setData({ loading: true })

    getStats().then(data => {
      console.log('统计数据:', data)
      
      // 转换数据格式，适配小程序WXML模板
      const transformedStats = {
        totalRooms: 0,
        occupiedRooms: 0,
        freeRooms: 0,
        pendingRepairs: data.pendingRepairs || 0,
        completedRepairs: data.completedRepairs || 0,
        totalStudents: data.totalStudents || 0,
        totalBuildings: data.occupancyData ? data.occupancyData.length : 0
      }

      // 计算房间数据
      if (data.occupancyData && data.occupancyData.length > 0) {
        let totalCapacity = 0
        let totalOccupied = 0

        data.occupancyData.forEach(building => {
          totalCapacity += building.capacity
          totalOccupied += building.occupied
        })

        transformedStats.totalRooms = totalCapacity
        transformedStats.occupiedRooms = totalOccupied
        transformedStats.freeRooms = totalCapacity - totalOccupied
      }

      this.setData({
        stats: transformedStats,
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
