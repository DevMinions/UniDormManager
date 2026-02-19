// pages/admin/dashboard/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    // 权限控制
    userLevel: 1,
    isAdmin: false,
    // 关键指标
    statistics: {
      totalUsers: 0,
      totalRooms: 0,
      occupancyRate: 0,
      todayRepairs: 0,
      pendingRepairs: 0,
      newUsersThisMonth: 0
    },
    // 趋势数据
    trendData: {
      dates: [],
      occupancyRates: []
    },
    // 报修类型分布
    repairTypes: [],
    // 各楼栋入住情况
    buildingStats: [],
    // 图表配置
    chartConfig: {
      trendChart: null,
      typeChart: null,
      buildingChart: null
    }
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadDashboardData()
  },

  onShow() {
    if (app.globalData.isLoggedIn && this.data.isAdmin) {
      this.loadDashboardData()
    }
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const userLevel = app.globalData.userLevel || 1
    const isAdmin = userLevel >= 4  // 楼栋管理员及以上

    this.setData({
      userLevel,
      isAdmin
    })

    if (!isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 加载仪表板数据
   */
  loadDashboardData() {
    this.setData({ loading: true })

    // 模拟数据加载（实际应该调用API）
    setTimeout(() => {
      const statistics = {
        totalUsers: 2458,
        totalRooms: 680,
        occupancyRate: 87.5,
        todayRepairs: 12,
        pendingRepairs: 8,
        newUsersThisMonth: 156
      }

      // 近7天入住率趋势
      const trendData = {
        dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        occupancyRates: [85.2, 85.8, 86.1, 86.5, 87.0, 87.3, 87.5]
      }

      // 报修类型分布
      const repairTypes = [
        { name: '水电', value: 35, color: '#667eea' },
        { name: '门窗', value: 25, color: '#10b981' },
        { name: '家具', value: 20, color: '#f59e0b' },
        { name: '网络', value: 12, color: '#ef4444' },
        { name: '其他', value: 8, color: '#6b7280' }
      ]

      // 各楼栋入住情况
      const buildingStats = [
        { name: 'A栋', total: 120, occupied: 108, rate: 90 },
        { name: 'B栋', total: 150, occupied: 132, rate: 88 },
        { name: 'C栋', total: 100, occupied: 85, rate: 85 },
        { name: 'D栋', total: 180, occupied: 150, rate: 83 },
        { name: 'E栋', total: 130, occupied: 115, rate: 88 }
      ]

      this.setData({
        statistics,
        trendData,
        repairTypes,
        buildingStats,
        loading: false
      })
    }, 800)
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadDashboardData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 跳转到用户管理
   */
  goToUserManagement() {
    wx.navigateTo({
      url: '/pages/admin/users/index'
    })
  },

  /**
   * 跳转到报修管理
   */
  goToRepairManagement() {
    wx.switchTab({
      url: '/pages/repairs/list/index'
    })
  },

  /**
   * 跳转到房间管理
   */
  goToRoomManagement() {
    wx.switchTab({
      url: '/pages/rooms/list'
    })
  },

  /**
   * 跳转到系统设置
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/admin/settings/index'
    })
  },

  /**
   * 跳转到操作日志
   */
  goToLogs() {
    wx.navigateTo({
      url: '/pages/admin/logs/index'
    })
  }
})
