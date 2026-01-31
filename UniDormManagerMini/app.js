// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    userRole: null,  // 'student', 'maintenance', 'admin'
    userLevel: 1,     // 1:学生, 2:宿管员, 3:维修工, 4:楼栋管理员, 5:后勤管理员, 6:系统管理员
    userRoleName: null,  // '学生', '宿管员', '维修工', '楼栋管理员', '后勤管理员', '系统管理员'
    baseUrl: 'http://localhost:8080', // 开发环境API地址
    isLoggedIn: false
  },

  onLaunch() {
    console.log('小程序启动')
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  /**
   * 角色权限定义
   */
  permissions: {
    // 查看类权限（所有角色都有）
    canViewDashboard: () => true,
    canViewRooms: () => true,
    canViewRepairs: () => true,
    canViewNotices: () => true,
    canViewProfile: () => true,

    // 学生权限（level 1）
    student: {
      canSubmitRepair: () => true,  // 学生可以提交报修
      canViewOwnRepairs: () => true,
      canViewOwnProfile: () => true,
    },

    // 宿管员权限（level 2）
    dormManager: {
      canViewAllStudents: () => true,  // 查看所有学生
      canViewStudentDetails: () => true,
      canCheckInOut: () => true,  // 查寝
    },

    // 维修工权限（level 3）
    maintenance: {
      canViewAllRepairs: () => true,
      canUpdateRepairStatus: () => true,
      canAddRepairNotes: () => true,
      canCloseRepairs: () => true,
    },

    // 楼栋管理员权限（level 4）
    buildingManager: {
      canViewAllStudents: () => true,
      canViewAllRepairs: () => true,
      canUpdateRepairStatus: () => true,
      canManageRooms: () => true,
      canAssignRepairs: () => true,
    },

    // 后勤管理员权限（level 5）
    logisticsAdmin: {
      canViewAllStudents: () => true,
      canViewAllRepairs: () => true,
      canManageNotices: () => true,  // 发布、编辑、删除公告
      canViewNotices: () => true,
    },

    // 系统管理员权限（level 6）
    systemAdmin: {
      canDoEverything: () => true,
    },
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userRole = wx.getStorageSync('userRole')
    const userLevel = wx.getStorageSync('userLevel')
    const userRoleName = wx.getStorageSync('userRoleName')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userRole = userRole
      this.globalData.userLevel = userLevel || 1
      this.globalData.userRoleName = userRoleName || '学生'
      this.globalData.isLoggedIn = true
      console.log('用户已登录:', {
        role: userRole,
        level: userLevel,
        roleName: userRoleName
      })
    } else {
      this.globalData.isLoggedIn = false
      console.log('用户未登录')
    }
  },

  /**
   * 更新用户信息
   */
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  /**
   * 更新登录状态
   */
  updateLoginStatus(token, userInfo, userRole) {
    // 根据后端角色代码映射到小程序角色和权限等级
    const roleMapping = this.mapBackendRole(userRole)
    
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.userRole = roleMapping.role
    this.globalData.userLevel = roleMapping.level
    this.globalData.userRoleName = roleMapping.name
    this.globalData.isLoggedIn = true

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userRole', roleMapping.role)
    wx.setStorageSync('userLevel', roleMapping.level)
    wx.setStorageSync('userRoleName', roleMapping.name)

    console.log('登录状态已更新:', {
      backendRole: userRole,
      miniAppRole: roleMapping.role,
      level: roleMapping.level,
      roleName: roleMapping.name
    })
  },

  /**
   * 映射后端角色代码到小程序角色和权限等级
   */
  mapBackendRole(backendRoles) {
    if (!backendRoles || backendRoles.length === 0) {
      return { role: 'student', level: 1, name: '学生' }
    }

    // 获取第一个角色（优先级最高）
    const primaryRole = backendRoles[0].code

    // 角色映射表
    const roleMap = {
      'student': { role: 'student', level: 1, name: '学生' },
      'dorm_manager': { role: 'student', level: 2, name: '宿管员' },  // 宿管员对学生可见，但权限更高
      'maintenance_staff': { role: 'maintenance', level: 3, name: '维修工' },
      'building_manager': { role: 'admin', level: 4, name: '楼栋管理员' },
      'logistics_admin': { role: 'admin', level: 5, name: '后勤管理员' },
      'system_admin': { role: 'admin', level: 6, name: '系统管理员' },
    }

    return roleMap[primaryRole] || { role: 'student', level: 1, name: '学生' }
  },

  /**
   * 权限检查方法
   */
  // 快捷权限检查
  isAdmin() {
    return this.globalData.userRole === 'admin'
  },
  
  isStudent() {
    return this.globalData.userRole === 'student'
  },
  
  isMaintenance() {
    return this.globalData.userRole === 'maintenance'
  },

  // 细粒度权限检查
  canSubmitRepair() {
    const role = this.globalData.userRole
    return role === 'student' || role === 'admin'
  },

  canUpdateRepairStatus() {
    const level = this.globalData.userLevel
    return level >= 3  // 维修工及以上
  },

  canDeleteRepair() {
    const level = this.globalData.userLevel
    return level >= 4  // 楼栋管理员及以上
  },

  canManageNotices() {
    const level = this.globalData.userLevel
    return level >= 5  // 后勤管理员及以上
  },

  canManageStudents() {
    const level = this.globalData.userLevel
    return level >= 2  // 宿管员及以上
  },

  canManageRooms() {
    const level = this.globalData.userLevel
    return level >= 4  // 楼栋管理员及以上
  },

  /**
   * 清除登录状态
   */
  clearLoginStatus() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.userRole = null
    this.globalData.userLevel = 1
    this.globalData.userRoleName = null
    this.globalData.isLoggedIn = false

    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')
    wx.removeStorageSync('userLevel')
    wx.removeStorageSync('userRoleName')
  }
})
