// pages/index/index.js
const app = getApp()
const { getStats } = require('../../api/dashboard')
const { getRepairs, updateRepair } = require('../../api/repairs')

Page({
  data: {
    currentDate: '',
    currentTime: '',
    stats: {
      totalRooms: 0,
      occupiedRooms: 0,
      freeRooms: 0,
      pendingRepairs: 0,
      totalStudents: 0,
      totalBuildings: 0
    },
    // 维修工专属数据
    maintenanceStats: {
      pendingCount: 0,        // 待处理工单数
      inProgressCount: 0,     // 处理中工单数
      completedToday: 0,      // 今日完成
      newToday: 0,            // 今日新增
      urgentCount: 0          // 紧急工单数
    },
    recentTickets: [],        // 最新待处理工单
    loading: true,
    isAdmin: false,
    isMaintenance: false,     // 是否为维修工
    userRole: '',
    userLevel: 1,
    userRoleName: ''
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 设置当前日期时间
    this.setCurrentDate()

    // 加载用户角色信息
    const userRole = app.globalData.userRole
    const userLevel = app.globalData.userLevel
    const userRoleName = app.globalData.userRoleName || ''
    const isMaintenance = userRole === 'maintenance' || userLevel === 3

    this.setData({
      isAdmin: userRole === 'admin',
      isMaintenance: isMaintenance,
      userRole: userRole,
      userLevel: userLevel,
      userRoleName: userRoleName
    })

    // 根据角色加载不同数据
    if (isMaintenance) {
      this.loadMaintenanceData()
    } else {
      this.loadStats()
    }
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.setCurrentDate()
      if (this.data.isMaintenance) {
        this.loadMaintenanceData()
      } else {
        this.loadStats()
      }
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
    
    // 格式化时间 HH:MM
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    this.setData({
      currentDate: `${year}年${month}月${day}日 星期${weekDay}`,
      currentTime: `${hours}:${minutes}`
    })
  },

  /**
   * 加载普通用户统计数据
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
   * 加载维修工专属数据
   */
  loadMaintenanceData() {
    this.setData({ loading: true })

    // 获取今日开始时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // 获取所有报修数据
    const params = {
      page: 1,
      pageSize: 100,
      status: 'All',
      sortOrder: 'desc',
      sortBy: 'date'
    }

    getRepairs(params).then(data => {
      const repairs = data.data || []
      
      // 统计各状态工单数
      let pendingCount = 0
      let inProgressCount = 0
      let completedToday = 0
      let newToday = 0
      let urgentCount = 0
      
      const recentTickets = []

      repairs.forEach(repair => {
        const repairDate = new Date(repair.createdAt || repair.date)
        const repairDateStr = repairDate.toISOString().split('T')[0]
        const isToday = repairDateStr === todayStr

        // 统计各状态
        switch (repair.status) {
          case 'Pending':
            pendingCount++
            // 收集待处理工单（最多3个）
            if (recentTickets.length < 3) {
              recentTickets.push(repair)
            }
            break
          case 'In Progress':
            inProgressCount++
            break
          case 'Completed':
            // 检查是否是今日完成
            const completedDate = repair.completedAt ? new Date(repair.completedAt).toISOString().split('T')[0] : null
            if (completedDate === todayStr) {
              completedToday++
            }
            break
        }

        // 统计今日新增
        if (isToday) {
          newToday++
        }

        // 统计紧急工单
        if (repair.priority === 'High') {
          urgentCount++
        }
      })

      // 按优先级排序待处理工单（紧急优先）
      recentTickets.sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      this.setData({
        maintenanceStats: {
          pendingCount,
          inProgressCount,
          completedToday,
          newToday,
          urgentCount
        },
        recentTickets: recentTickets.slice(0, 3),
        loading: false
      })
    }).catch(err => {
      console.error('加载维修数据失败:', err)
      this.setData({ loading: false })
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    if (this.data.isMaintenance) {
      this.loadMaintenanceData()
    } else {
      this.loadStats()
    }
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // ===== 快捷入口导航 =====

  /**
   * 待处理工单
   */
  goToPendingTickets() {
    wx.navigateTo({
      url: '/pages/repairs/list/index?status=Pending'
    })
  },

  /**
   * 处理中工单
   */
  goToInProgressTickets() {
    wx.navigateTo({
      url: '/pages/repairs/list/index?status=In Progress'
    })
  },

  /**
   * 已完成工单
   */
  goToCompletedTickets() {
    wx.navigateTo({
      url: '/pages/repairs/list/index?status=Completed'
    })
  },

  /**
   * 工单统计
   */
  goToStatistics() {
    wx.navigateTo({
      url: '/pages/repairs/statistics/index'
    })
  },

  /**
   * 按优先级筛选
   */
  filterByPriority(e) {
    const priority = e.currentTarget.dataset.priority
    wx.navigateTo({
      url: `/pages/repairs/list/index?priority=${priority}`
    })
  },

  /**
   * 查看工单详情
   */
  goToTicketDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repairs/detail/index?id=${id}`
    })
  },

  /**
   * 快速接单
   */
  quickAccept(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认接单',
      content: '是否接受此工单？',
      confirmText: '确认接单',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          updateRepair(id, { 
            status: 'In Progress',
            notes: '维修工已接单，准备处理'
          }).then(() => {
            wx.showToast({
              title: '接单成功',
              icon: 'success'
            })
            // 刷新数据
            this.loadMaintenanceData()
          }).catch(err => {
            wx.showToast({
              title: '接单失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // ===== 原有快捷入口 =====

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
  },

  goToStudents() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // ===== 工具方法 =====

  /**
   * 获取状态标签
   */
  getStatusTag(status) {
    const statusMap = {
      'Pending': { text: '待处理', color: '#faad14', bgColor: '#fff7e6' },
      'In Progress': { text: '处理中', color: '#3b82f6', bgColor: '#eff6ff' },
      'Completed': { text: '已完成', color: '#10b981', bgColor: '#d1fae5' },
      'Closed': { text: '已关闭', color: '#6b7280', bgColor: '#f3f4f6' }
    }
    return statusMap[status] || { text: '未知', color: '#999', bgColor: '#f5f5f5' }
  },

  /**
   * 获取优先级标签
   */
  getPriorityTag(priority) {
    const priorityMap = {
      'Low': { text: '低', color: '#10b981', icon: '🟢' },
      'Medium': { text: '中', color: '#f59e0b', icon: '🟡' },
      'High': { text: '紧急', color: '#ef4444', icon: '🔴' }
    }
    return priorityMap[priority] || { text: '中', color: '#f59e0b', icon: '🟡' }
  },

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
})
