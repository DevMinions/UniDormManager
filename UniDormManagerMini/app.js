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
      canViewAllRepairs: () => true,
      canUpdateRepairStatus: () => true,
      canManageRooms: () => true,
      canAssignRepairs: () => true,
      canDeleteRepairs: () => true,
    },

    // 后勤管理员权限（level 5）
    logisticsAdmin: {
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

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userRole = userRole
      this.globalData.isLoggedIn = true
      console.log('用户已登录:', userInfo)
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
   * 更新登录状态（修复后，兼容后端字符串数组格式）
   */
  updateLoginStatus(token, userInfo, backendRoles, backendUserRole, backendUserLevel) {
    // 角色映射表
    const roleMap = {
      'student': { role: 'student', level: 1, name: '学生' },
      'dorm_manager': { role: 'student', level: 2, name: '宿管员' },
      'maintenance_staff': { role: 'maintenance', level: 3, name: '维修工' },
      'building_manager': { role: 'admin', level: 4, name: '楼栋管理员' },
      'logistics_admin': { role: 'admin', level: 5, name: '后勤管理员' },
      'system_admin': { role: 'admin', level: 6, name: '系统管理员' },
    }

    // 确定主要角色（后端返回的主要角色字符串）
    let primaryRole = 'student'
    let primaryLevel = 1
    let primaryName = '学生'

    if (backendUserRole && roleMap[backendUserRole]) {
      primaryRole = roleMap[backendUserRole].role
      primaryLevel = roleMap[backendUserRole].level
      primaryName = roleMap[backendUserRole].name
    } else if (backendRoles && backendRoles.length > 0) {
      // 如果没有userRole，从roles数组中取第一个
      const firstRole = backendRoles[0]
      if (roleMap[firstRole]) {
        primaryRole = roleMap[firstRole].role
        primaryLevel = roleMap[firstRole].level
        primaryName = roleMap[firstRole].name
      }
    }

    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.userRole = primaryRole
    this.globalData.userLevel = primaryLevel
    this.globalData.userRoleName = primaryName
    this.globalData.isLoggedIn = true

    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userRole', primaryRole)
    wx.setStorageSync('userLevel', primaryLevel)
    wx.setStorageSync('userRoleName', primaryName)

    console.log('登录状态已更新:', {
      backendRoles: backendRoles,
      backendUserRole: backendUserRole,
      backendUserLevel: backendUserLevel,
      miniAppRole: primaryRole,
      miniAppLevel: primaryLevel,
      miniAppName: primaryName
    })
  },

  /**
   * 映射后端角色代码到小程序角色和权限等级（修复后）
   */
  mapBackendRole(backendRoles) {
    if (!backendRoles || backendRoles.length === 0) {
      return { role: 'student', level: 1, name: '学生' }
    }

    // 获取第一个角色代码（主要角色）
    const primaryRoleCode = backendRoles[0]

    // 角色映射表
    const roleMap = {
      'student': { role: 'student', level: 1, name: '学生' },
      'dorm_manager': { role: 'student', level: 2, name: '宿管员' },
      'maintenance_staff': { role: 'maintenance', level: 3, name: '维修工' },
      'building_manager': { role: 'admin', level: 4, name: '楼栋管理员' },
      'logistics_admin': { role: 'admin', level: 5, name: '后勤管理员' },
      'system_admin': { role: 'admin', level: 6, name: '系统管理员' },
    }

    return roleMap[primaryRoleCode] || { role: 'student', level: 1, name: '学生' }
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
