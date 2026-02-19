// pages/profile/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    // 角色信息
    userRole: 'student',  // 'student', 'maintenance', 'admin'
    userLevel: 1,       // 1-6
    userRoleName: '学生',
    
    // 权限控制
    canManageStudents: false,
    canManageRooms: false,
    canManageNotices: false,
    canManageRepairs: false,
    
    // 菜单项
    showStudentManagement: false,
    showRoomManagement: false,
    showNoticeManagement: false,
    showRepairManagement: false
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
    const userInfo = app.globalData.userInfo
    const userRole = app.globalData.userRole
    const userLevel = app.globalData.userLevel
    const userRoleName = app.globalData.userRoleName

    // 权限判断
    const canManageStudents = userLevel >= 2  // 宿管员及以上
    const canManageRooms = userLevel >= 4     // 楼栋管理员及以上
    const canManageNotices = userLevel >= 5    // 后勤管理员及以上
    const canManageRepairs = userLevel >= 3     // 维修工及以上

    // 菜单显示
    const showStudentManagement = userLevel >= 2  // 宿管员及以上
    const showRoomManagement = userLevel >= 4      // 楼栋管理员及以上
    const showNoticeManagement = userLevel >= 5      // 后勤管理员及以上
    const showRepairManagement = userLevel >= 3      // 维修工及以上

    this.setData({
      hasLogin,
      userInfo,
      userRole,
      userLevel,
      userRoleName,
      canManageStudents,
      canManageRooms,
      canManageNotices,
      canManageRepairs,
      showStudentManagement,
      showRoomManagement,
      showNoticeManagement,
      showRepairManagement
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
   * 跳转到学生管理（宿管员及以上）
   */
  goToStudentManagement() {
    if (!this.data.canManageStudents) {
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
   * 跳转到房间管理（楼栋管理员及以上）
   */
  goToRoomManagement() {
    if (!this.data.canManageRooms) {
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
   * 跳转到公告管理（后勤管理员及以上）
   */
  goToNoticeManagement() {
    if (!this.data.canManageNotices) {
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
   * 跳转到报修管理（维修工及以上）
   */
  goToRepairManagement() {
    if (!this.data.canManageRepairs) {
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
  }
})
