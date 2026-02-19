// pages/index/index.js
const app = getApp()
const { getStats } = require('../../api/dashboard')
const { getRepairs, updateRepair } = require('../../api/repairs')

Page({
  data: {
    currentDate: '',
    currentTime: '',
    welcomeTitle: '',
    userRoleName: '',
    userLevel: 1,
    userRole: '',
    // 视图类型: 'student' | 'maintenance' | 'admin'
    viewType: 'student',
    loading: true,
    
    // 统计数据
    stats: {
      totalRooms: 0,
      occupiedRooms: 0,
      freeRooms: 0,
      pendingRepairs: 0,
      completedRepairs: 0,
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
    
    // 管理功能权限配置
    permissions: {
      canManageStudents: false,   // Level 2+
      canManageRepairs: false,    // Level 3+
      canManageRooms: false,      // Level 4+
      canManageNotices: false,    // Level 5+
      canManageUsers: false,      // Level 6
      canSystemSettings: false    // Level 6
    },
    
    // 数据概览
    overviewData: {
      buildingOccupancy: [],      // 各楼栋入住率
      weeklyRepairTrend: [],      // 本周报修趋势
      last7DaysStats: []          // 最近7天数据变化
    },
    
    // 紧急待办
    urgentTodos: [],
    hasUrgentTodos: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.initializePage()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.initializePage()
    }
  },

  /**
   * 初始化页面
   */
  initializePage() {
    const userLevel = app.globalData.userLevel || 1
    const userRoleName = app.globalData.userRoleName || '学生'
    const userRole = app.globalData.userRole || 'student'
    
    // 确定视图类型
    let viewType = 'student'
    if (userLevel >= 4) {
      viewType = 'admin'  // 楼栋管理员及以上显示管理控制台
    } else if (userRole === 'maintenance' || userLevel === 3) {
      viewType = 'maintenance'  // 维修工
    }

    this.setData({
      userLevel: userLevel,
      userRoleName: userRoleName,
      userRole: userRole,
      viewType: viewType
    })

    // 设置欢迎信息
    this.setWelcomeInfo(viewType, userRoleName)
    
    // 设置当前日期
    this.setCurrentDate()
    
    // 根据视图类型加载不同数据
    if (viewType === 'maintenance') {
      this.loadMaintenanceData()
    } else if (viewType === 'admin') {
      // 管理员视图
      this.calculatePermissions(userLevel)
      this.loadStats()
      this.loadUrgentTodos()
      this.loadOverviewData()
    } else {
      // 学生视图
      this.loadStats()
    }
  },

  /**
   * 设置欢迎信息
   */
  setWelcomeInfo(viewType, userRoleName) {
    let welcomeTitle = '欢迎使用宿舍管理系统'
    if (viewType === 'admin') {
      welcomeTitle = '管理控制台'
    } else if (viewType === 'maintenance') {
      welcomeTitle = '维修工作台'
    }
    
    this.setData({ welcomeTitle })
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
   * 根据用户等级计算权限
   */
  calculatePermissions(userLevel) {
    const permissions = {
      canManageStudents: userLevel >= 2,   // 宿管员及以上
      canManageRepairs: userLevel >= 3,    // 维修工及以上
      canManageRooms: userLevel >= 4,      // 楼栋管理员及以上
      canManageNotices: userLevel >= 5,    // 后勤管理员及以上
      canManageUsers: userLevel >= 6,      // 系统管理员
      canSystemSettings: userLevel >= 6    // 系统管理员
    }
    
    this.setData({ permissions })
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
   * 加载紧急待办事项
   */
  loadUrgentTodos() {
    // 模拟待办数据，实际应从API获取
    const todos = []
    const { permissions, stats, userLevel } = this.data
    
    // 根据权限生成不同的待办
    if (permissions.canManageRepairs && stats.pendingRepairs > 0) {
      todos.push({
        id: 'repair-1',
        type: 'repair',
        icon: '🔧',
        title: '待处理报修',
        desc: `${stats.pendingRepairs} 个报修请求待处理`,
        urgent: true,
        action: 'goToRepairs'
      })
    }
    
    // 模拟超时未处理报修
    if (permissions.canManageRepairs) {
      todos.push({
        id: 'repair-overdue',
        type: 'overdue',
        icon: '⚠️',
        title: '超时未处理报修',
        desc: '2 个报修已超时 24 小时未处理',
        urgent: true,
        action: 'goToRepairs'
      })
    }
    
    // 模拟待审批申请
    if (userLevel >= 4) {
      todos.push({
        id: 'approval',
        type: 'approval',
        icon: '📋',
        title: '待审批调宿申请',
        desc: '3 个调宿申请待审批',
        urgent: false,
        action: 'goToApprovals'
      })
    }

    this.setData({
      urgentTodos: todos,
      hasUrgentTodos: todos.length > 0
    })
  },

  /**
   * 加载数据概览
   */
  loadOverviewData() {
    // 模拟数据概览，实际应从API获取
    const buildingOccupancy = [
      { name: 'A栋', rate: 85 },
      { name: 'B栋', rate: 92 },
      { name: 'C栋', rate: 78 },
      { name: 'D栋', rate: 88 }
    ]
    
    const weeklyRepairTrend = [
      { day: '周一', count: 5 },
      { day: '周二', count: 8 },
      { day: '周三', count: 3 },
      { day: '周四', count: 12 },
      { day: '周五', count: 7 },
      { day: '周六', count: 4 },
      { day: '周日', count: 6 }
    ]

    this.setData({
      'overviewData.buildingOccupancy': buildingOccupancy,
      'overviewData.weeklyRepairTrend': weeklyRepairTrend
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.initializePage()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // ==================== 页面跳转方法 ====================

  /**
   * 学生管理
   */
  goToStudents() {
    if (!this.data.permissions.canManageStudents) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/admin/students/index'
    })
  },

  /**
   * 房间管理
   */
  goToRooms() {
    const { viewType, permissions } = this.data
    
    if (viewType === 'admin' && permissions.canManageRooms) {
      // 管理员跳转到管理页面
      wx.navigateTo({
        url: '/pages/admin/rooms/index'
      })
    } else {
      // 普通用户跳转到查询页面
      wx.switchTab({
        url: '/pages/rooms/list'
      })
    }
  },

  /**
   * 公告管理
   */
  goToNotices() {
    const { permissions } = this.data
    
    if (permissions.canManageNotices) {
      // 有管理权限跳转到管理页面
      wx.navigateTo({
        url: '/pages/admin/notices/index'
      })
    } else {
      // 普通查看
      wx.navigateTo({
        url: '/pages/notices/list/index'
      })
    }
  },

  /**
   * 报修管理
   */
  goToRepairs() {
    wx.switchTab({
      url: '/pages/repairs/list/index'
    })
  },

  /**
   * 用户管理
   */
  goToUsers() {
    if (!this.data.permissions.canManageUsers) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/admin/users/index'
    })
  },

  /**
   * 系统设置
   */
  goToSettings() {
    if (!this.data.permissions.canSystemSettings) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/admin/settings/index'
    })
  },

  /**
   * 审批管理
   */
  goToApprovals() {
    wx.navigateTo({
      url: '/pages/admin/approvals/index'
    })
  },

  /**
   * 个人中心
   */
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/index'
    })
  },

  // ===== 维修工专属导航 =====

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

  /**
   * 处理待办事项点击
   */
  onTodoClick(e) {
    const { action } = e.currentTarget.dataset
    if (action && this[action]) {
      this[action]()
    }
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
