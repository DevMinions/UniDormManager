// pages/index/index.js
const app = getApp()
const { getStats } = require('../../api/dashboard')
const { getRepairs, updateRepair } = require('../../api/repairs')
const { getNotices } = require('../../api/notices')

Page({
  data: {
    currentDate: '',
    currentTime: '',
    welcomeText: '',
    userName: '',
    userRoleName: '',
    userLevel: 1,
    userRole: '',
    // 视图类型: 'student' | 'dorm_manager' | 'maintenance' | 'admin'
    viewType: 'student',
    loading: true,
    
    // 轮播图数据
    banners: [],
    
    // 统计数据
    stats: {
      totalRooms: 0,
      occupiedRooms: 0,
      freeRooms: 0,
      pendingRepairs: 0,
      completedRepairs: 0,
      totalStudents: 0,
      totalBuildings: 0,
      // 学生专属
      myRepairs: 0,
      unreadNotices: 0,
      // 宿管员专属
      todayCheckins: 0,
      todayCheckouts: 0,
      // 维修工专属
      inProgressCount: 0,
      completedToday: 0,
      weekTotal: 0,
      // 管理员专属
      totalUsers: 0,
      todayRepairs: 0,
      systemDays: 0
    },
    
    // 维修工专属数据
    maintenanceStats: {
      pendingCount: 0,
      inProgressCount: 0,
      completedToday: 0,
      newToday: 0,
      urgentCount: 0
    },
    
    // 最新动态
    recentNotices: [],
    recentRepairs: [],
    
    // 管理功能权限配置
    permissions: {
      canManageStudents: false,
      canManageRepairs: false,
      canManageRooms: false,
      canManageNotices: false,
      canManageUsers: false,
      canSystemSettings: false
    }
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
    
    // 设置 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  /**
   * 初始化页面
   */
  initializePage() {
    const userLevel = app.globalData.userLevel || 1
    const userRoleName = app.globalData.userRoleName || '学生'
    const userRole = app.globalData.userRole || 'student'
    const userName = app.globalData.userInfo?.name || app.globalData.userInfo?.username || '用户'
    
    // 确定视图类型
    let viewType = 'student'
    if (userLevel >= 6) {
      viewType = 'admin'
    } else if (userLevel >= 4 && userLevel <= 5) {
      viewType = 'admin'
    } else if (userLevel === 3) {
      viewType = 'maintenance'
    } else if (userLevel === 2) {
      viewType = 'dorm_manager'
    }

    this.setData({
      userLevel: userLevel,
      userRoleName: userRoleName,
      userRole: userRole,
      userName: userName,
      viewType: viewType
    })

    // 设置欢迎信息
    this.setWelcomeInfo()
    
    // 设置当前日期
    this.setCurrentDate()
    
    // 加载轮播图
    this.loadBanners()
    
    // 加载最新通知
    this.loadRecentNotices()
    
    // 根据视图类型加载不同数据
    if (viewType === 'maintenance') {
      this.loadMaintenanceData()
    } else if (viewType === 'admin') {
      this.calculatePermissions(userLevel)
      this.loadAdminData()
    } else if (viewType === 'dorm_manager') {
      this.calculatePermissions(userLevel)
      this.loadDormManagerData()
    } else {
      // 学生视图
      this.loadStudentData()
    }
  },

  /**
   * 设置欢迎信息（根据时间）
   */
  setWelcomeInfo() {
    const hour = new Date().getHours()
    let welcomeText = ''
    
    if (hour >= 5 && hour < 12) {
      welcomeText = '早上好'
    } else if (hour >= 12 && hour < 18) {
      welcomeText = '下午好'
    } else {
      welcomeText = '晚上好'
    }
    
    this.setData({ welcomeText })
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
      canManageStudents: userLevel >= 2,
      canManageRepairs: userLevel >= 3,
      canManageRooms: userLevel >= 4,
      canManageNotices: userLevel >= 5,
      canManageUsers: userLevel >= 6,
      canSystemSettings: userLevel >= 6
    }
    
    this.setData({ permissions })
  },

  /**
   * 加载轮播图
   */
  loadBanners() {
    // 模拟轮播图数据，实际应从API获取
    const banners = [
      {
        id: 1,
        imageUrl: '',
        title: '欢迎使用宿舍管理系统',
        content: '全新升级，为您提供更便捷的宿舍服务',
        type: 'welcome',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        id: 2,
        imageUrl: '',
        title: '宿舍安全提醒',
        content: '请注意用电安全，禁止使用大功率电器',
        type: 'notice',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        id: 3,
        imageUrl: '',
        title: '报修服务优化',
        content: '在线报修，快速响应，专业维修',
        type: 'repair',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      }
    ]
    
    this.setData({ banners })
  },

  /**
   * 加载最新通知
   */
  loadRecentNotices() {
    getNotices({ page: 1, limit: 3 }).then(data => {
      const notices = (data.data || data.list || []).slice(0, 3)
      this.setData({ recentNotices: notices })
    }).catch(err => {
      console.error('加载通知失败:', err)
      // 使用模拟数据
      this.setData({
        recentNotices: [
          { id: 1, title: '关于期末宿舍检查的通知', createdAt: new Date().toISOString(), category: '通知' },
          { id: 2, title: '寒假留宿申请开始啦', createdAt: new Date(Date.now() - 86400000).toISOString(), category: '公告' },
          { id: 3, title: '宿舍维修暂停通知', createdAt: new Date(Date.now() - 172800000).toISOString(), category: '通知' }
        ]
      })
    })
  },

  /**
   * 加载学生数据
   */
  loadStudentData() {
    this.setData({ loading: true })

    // 获取统计数据
    getStats().then(data => {
      const transformedStats = {
        totalRooms: 0,
        occupiedRooms: 0,
        freeRooms: 0,
        pendingRepairs: data.pendingRepairs || 0,
        completedRepairs: data.completedRepairs || 0,
        totalStudents: data.totalStudents || 0,
        totalBuildings: data.occupancyData ? data.occupancyData.length : 0,
        myRepairs: data.myPendingRepairs || 0,
        unreadNotices: data.unreadNotices || 2
      }

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
   * 加载宿管员数据
   */
  loadDormManagerData() {
    this.setData({ loading: true })

    getStats().then(data => {
      const transformedStats = {
        totalRooms: 0,
        occupiedRooms: 0,
        freeRooms: 0,
        pendingRepairs: data.pendingRepairs || 0,
        completedRepairs: data.completedRepairs || 0,
        totalStudents: data.totalStudents || 0,
        totalBuildings: data.occupancyData ? data.occupancyData.length : 0,
        todayCheckins: data.todayCheckins || 0,
        todayCheckouts: data.todayCheckouts || 0
      }

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

    // 加载最新报修
    this.loadRecentRepairs()
  },

  /**
   * 加载管理员数据
   */
  loadAdminData() {
    this.setData({ loading: true })

    getStats().then(data => {
      const transformedStats = {
        totalRooms: 0,
        occupiedRooms: 0,
        freeRooms: 0,
        pendingRepairs: data.pendingRepairs || 0,
        completedRepairs: data.completedRepairs || 0,
        totalStudents: data.totalStudents || 0,
        totalBuildings: data.occupancyData ? data.occupancyData.length : 0,
        totalUsers: data.totalUsers || 0,
        todayRepairs: data.todayRepairs || 0,
        systemDays: data.systemDays || 365
      }

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

    // 加载最新报修
    this.loadRecentRepairs()
  },

  /**
   * 加载最新报修
   */
  loadRecentRepairs() {
    const params = {
      page: 1,
      pageSize: 3,
      status: 'All',
      sortOrder: 'desc',
      sortBy: 'date'
    }

    getRepairs(params).then(data => {
      const repairs = (data.data || []).slice(0, 3)
      this.setData({ recentRepairs: repairs })
    }).catch(err => {
      console.error('加载报修失败:', err)
      // 使用模拟数据
      this.setData({
        recentRepairs: [
          { id: 1, title: '空调不制冷', location: 'A栋 301', status: 'Pending', priority: 'High', createdAt: new Date().toISOString() },
          { id: 2, title: '水管漏水', location: 'B栋 205', status: 'In Progress', priority: 'Medium', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, title: '灯管更换', location: 'C栋 402', status: 'Pending', priority: 'Low', createdAt: new Date(Date.now() - 7200000).toISOString() }
        ]
      })
    })
  },

  /**
   * 加载维修工专属数据
   */
  loadMaintenanceData() {
    this.setData({ loading: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const params = {
      page: 1,
      pageSize: 100,
      status: 'All',
      sortOrder: 'desc',
      sortBy: 'date'
    }

    getRepairs(params).then(data => {
      const repairs = data.data || []
      
      let pendingCount = 0
      let inProgressCount = 0
      let completedToday = 0
      let newToday = 0
      let urgentCount = 0
      let weekTotal = 0

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      repairs.forEach(repair => {
        const repairDate = new Date(repair.createdAt || repair.date)
        const repairDateStr = repairDate.toISOString().split('T')[0]
        const isToday = repairDateStr === todayStr
        const isThisWeek = repairDate >= weekAgo

        switch (repair.status) {
          case 'Pending':
            pendingCount++
            break
          case 'In Progress':
            inProgressCount++
            break
          case 'Completed':
            const completedDate = repair.completedAt ? new Date(repair.completedAt).toISOString().split('T')[0] : null
            if (completedDate === todayStr) {
              completedToday++
            }
            break
        }

        if (isToday) {
          newToday++
        }
        
        if (isThisWeek) {
          weekTotal++
        }

        if (repair.priority === 'High') {
          urgentCount++
        }
      })

      this.setData({
        maintenanceStats: {
          pendingCount,
          inProgressCount,
          completedToday,
          newToday,
          urgentCount
        },
        stats: {
          ...this.data.stats,
          pendingCount,
          inProgressCount,
          completedToday,
          weekTotal
        },
        loading: false
      })

      // 加载最新报修
      this.loadRecentRepairs()
    }).catch(err => {
      console.error('加载维修数据失败:', err)
      this.setData({ loading: false })
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
   * 轮播图点击
   */
  onBannerTap(e) {
    const banner = e.currentTarget.dataset.banner
    if (banner.type === 'notice') {
      wx.navigateTo({ url: '/pages/notices/list/index' })
    } else if (banner.type === 'repair') {
      wx.switchTab({ url: '/pages/repairs/list/index' })
    }
  },

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
   * 房间管理/查询
   */
  goToRooms() {
    const { viewType, permissions } = this.data
    
    if (viewType === 'admin' && permissions.canManageRooms) {
      wx.navigateTo({
        url: '/pages/admin/rooms/index'
      })
    } else if (viewType === 'dorm_manager') {
      wx.navigateTo({
        url: '/pages/admin/rooms/index'
      })
    } else {
      wx.switchTab({
        url: '/pages/rooms/list'
      })
    }
  },

  /**
   * 公告管理/列表
   */
  goToNotices() {
    const { permissions } = this.data
    
    if (permissions.canManageNotices) {
      wx.navigateTo({
        url: '/pages/admin/notices/index'
      })
    } else {
      wx.navigateTo({
        url: '/pages/notices/list/index'
      })
    }
  },

  /**
   * 报修管理/申请
   */
  goToRepairs() {
    wx.switchTab({
      url: '/pages/repairs/list/index'
    })
  },

  /**
   * 提交报修（学生快捷入口）
   */
  goToSubmitRepair() {
    wx.navigateTo({
      url: '/pages/repairs/submit/index'
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
   * 数据概览
   */
  goToOverview() {
    wx.navigateTo({
      url: '/pages/admin/dashboard/index'
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
   * 查看通知详情
   */
  goToNoticeDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/notices/detail/index?id=${id}`
    })
  },

  /**
   * 查看更多通知
   */
  goToMoreNotices() {
    wx.navigateTo({
      url: '/pages/notices/list/index'
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
   * 查看更多报修
   */
  goToMoreRepairs() {
    wx.switchTab({
      url: '/pages/repairs/list/index'
    })
  },

  // ===== 工具方法 =====

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    // 小于1小时显示"X分钟前"
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`
    }
    // 小于24小时显示"X小时前"
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}小时前`
    }
    // 小于7天显示"X天前"
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}天前`
    }
    
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }
})
