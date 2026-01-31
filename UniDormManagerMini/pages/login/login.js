// pages/login/login.js
const app = getApp()
const { wechatLogin } = require('../../api/auth')

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    userInfo: null,
    hasUserInfo: false,
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.isLoggedIn) {
      wx.switchTab({
        url: '/pages/index/index'
      })
      return
    }

    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },

  /**
   * 微信登录
   */
  handleLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })

    // 获取微信登录code
    wx.login({
      success: (res) => {
        if (res.code) {
          this.loginWithCode(res.code)
        } else {
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    })
  },

  /**
   * 使用code登录
   */
  loginWithCode(code) {
    wechatLogin(code).then(data => {
      console.log('登录成功:', data)

      // 根据后端角色代码映射到小程序角色
      const miniAppRole = this.mapBackendRoleToMiniAppRole(data.user.roles || [])

      // 保存登录信息
      app.updateLoginStatus(
        data.token,
        data.user,
        miniAppRole
      )

      // 显示角色提示
      const roleName = this.getRoleDisplayName(miniAppRole)
      wx.showToast({
        title: `登录成功 - ${roleName}`,
        icon: 'success',
        duration: 2000
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)

    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  /**
   * 映射后端角色代码到小程序角色代码
   */
  mapBackendRoleToMiniAppRole(backendRoles) {
    // 后端角色列表，按优先级排序
    const roleCode = backendRoles[0] || 'student'

    // 角色映射表
    const roleMap = {
      'student': {
        role: 'student',
        level: 1,
        name: '学生'
      },
      'dorm_manager': {
        role: 'student',  // 宿管员主要处理宿舍，对学生可见
        level: 2,
        name: '宿管员'
      },
      'maintenance_staff': {
        role: 'maintenance',  // 维修工
        level: 3,
        name: '维修工'
      },
      'building_manager': {
        role: 'admin',  // 楼栋管理员，有部分管理权限
        level: 4,
        name: '楼栋管理员'
      },
      'logistics_admin': {
        role: 'admin',  // 后勤管理员
        level: 5,
        name: '后勤管理员'
      },
      'system_admin': {
        role: 'admin',  // 系统管理员
        level: 6,
        name: '系统管理员'
      }
    }

    const mapped = roleMap[roleCode]
    return mapped || roleMap['student']
  },

  /**
   * 获取角色显示名称
   */
  getRoleDisplayName(miniAppRole) {
    const roleNames = {
      'student': '学生',
      'maintenance': '维修工',
      'admin': '管理员'
    }
    return roleNames[miniAppRole] || '未知角色'
  },

  /**
   * 获取用户信息
   */
  getUserInfo(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  }
})
