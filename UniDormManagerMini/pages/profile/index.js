// pages/profile/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    // 角色信息
    userRole: 'student',  // 'student', 'dorm_manager', 'maintenance', 'admin'
    userLevel: 1,       // 1-6
    userRoleName: '学生',
    
    // 版本信息
    version: '1.0.0',
    
    // 权限控制
    isStudent: false,
    isDormManager: false,
    isMaintenance: false,
    isAdmin: false,
    
    // 功能菜单显示控制
    showStudentManagement: false,
    showRoomAllocation: false,
    showCheckInOut: false,
    showMyWorkOrders: false,
    showWorkOrderStats: false,
    showUserManagement: false,
    showSystemSettings: false
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    
    // 设置 TabBar 选中状态（"我的"是第4个，index=3）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const hasLogin = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo || {}
    const userRole = app.globalData.userRole || 'student'
    const userLevel = app.globalData.userLevel || 1
    const userRoleName = app.globalData.userRoleName || '学生'

    // 角色判断
    const isStudent = userRole === 'student'
    const isDormManager = userRole === 'dorm_manager' || userLevel === 2
    const isMaintenance = userRole === 'maintenance' || userLevel === 3
    const isAdmin = userLevel >= 4

    // 菜单显示控制
    const showStudentManagement = isDormManager || isAdmin
    const showRoomAllocation = isDormManager || isAdmin
    const showCheckInOut = isDormManager || isAdmin
    const showMyWorkOrders = isMaintenance || isAdmin
    const showWorkOrderStats = isMaintenance || isAdmin
    const showUserManagement = isAdmin
    const showSystemSettings = isAdmin

    this.setData({
      hasLogin,
      userInfo,
      userRole,
      userLevel,
      userRoleName,
      isStudent,
      isDormManager,
      isMaintenance,
      isAdmin,
      showStudentManagement,
      showRoomAllocation,
      showCheckInOut,
      showMyWorkOrders,
      showWorkOrderStats,
      showUserManagement,
      showSystemSettings
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadUserInfo()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // ==================== 通用功能 ====================
  
  /**
   * 跳转到我的报修
   */
  goToMyRepairs() {
    wx.navigateTo({
      url: '/pages/repairs/list/index'
    })
  },

  /**
   * 跳转到修改密码
   */
  goToChangePassword() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到设置页面
   */
  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // ==================== 宿管员功能 ====================
  
  /**
   * 跳转到学生管理
   */
  goToStudentManagement() {
    if (!this.data.isDormManager && !this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到房间分配
   */
  goToRoomAllocation() {
    if (!this.data.isDormManager && !this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到入住/退住办理
   */
  goToCheckInOut() {
    if (!this.data.isDormManager && !this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/checkin/index/index'
    })
  },

  // ==================== 维修工功能 ====================
  
  /**
   * 跳转到我的工单
   */
  goToMyWorkOrders() {
    if (!this.data.isMaintenance && !this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/repairs/list/index'
    })
  },

  /**
   * 跳转到工单统计
   */
  goToWorkOrderStats() {
    if (!this.data.isMaintenance && !this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/repairs/statistics/index'
    })
  },

  // ==================== 管理员功能 ====================
  
  /**
   * 跳转到用户管理
   */
  goToUserManagement() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 跳转到系统设置
   */
  goToSystemSettings() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // ==================== 其他功能 ====================
  
  /**
   * 跳转到关于我们
   */
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'UniDormManager 宿舍管理系统\n版本：' + this.data.version + '\n\n为高校宿舍管理提供一站式解决方案。',
      showCancel: false
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
          // 清理登录状态
          app.clearLoginStatus()
          // 重置 TabBar 为学生角色
          app.globalData.userLevel = 1
          app.globalData.userRole = 'student'
          app.globalData.userRoleName = '学生'
          app.refreshTabBarConfig()
          
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
  }
})
