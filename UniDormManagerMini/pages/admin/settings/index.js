// pages/admin/settings/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    isAdmin: false,
    
    // 基础设置
    basicSettings: {
      systemName: 'UniDorm 宿舍管理系统',
      contactPhone: '400-123-4567',
      contactEmail: 'support@unidorm.com',
      enableAnnouncement: true,
      announcementContent: ''
    },
    
    // 报修设置
    repairSettings: {
      allowAnonymous: true,
      autoAssign: false,
      urgentThreshold: 24,
      notifyOnSubmit: true,
      notifyOnComplete: true
    },
    
    // 入住设置
    checkinSettings: {
      maxOccupancyPerRoom: 4,
      allowSelfCheckin: true,
      checkinRequireApproval: false
    }
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadSettings()
  },

  onShow() {
    if (app.globalData.isLoggedIn && this.data.isAdmin) {
      this.loadSettings()
    }
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const userLevel = app.globalData.userLevel || 1
    const isAdmin = userLevel >= 5  // 后勤管理员及以上

    this.setData({ isAdmin })

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
   * 加载设置
   */
  loadSettings() {
    this.setData({ loading: true })

    // 模拟加载设置
    setTimeout(() => {
      this.setData({
        loading: false
      })
    }, 600)
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadSettings()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 基础设置输入
   */
  onBasicInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`basicSettings.${field}`]: e.detail.value
    })
  },

  /**
   * 基础设置开关
   */
  onBasicSwitch(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`basicSettings.${field}`]: e.detail.value
    })
  },

  /**
   * 报修设置开关
   */
  onRepairSwitch(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`repairSettings.${field}`]: e.detail.value
    })
  },

  /**
   * 紧急报修阈值选择
   */
  onThresholdChange(e) {
    const thresholds = [12, 24, 48, 72]
    const value = thresholds[e.detail.value]
    this.setData({
      'repairSettings.urgentThreshold': value
    })
  },

  /**
   * 入住设置输入
   */
  onCheckinInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`checkinSettings.${field}`]: e.detail.value
    })
  },

  /**
   * 入住设置开关
   */
  onCheckinSwitch(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`checkinSettings.${field}`]: e.detail.value
    })
  },

  /**
   * 保存所有设置
   */
  saveSettings() {
    wx.showLoading({ title: '保存中...' })

    // 模拟保存
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    }, 800)
  },

  /**
   * 重置为默认值
   */
  resetToDefault() {
    wx.showModal({
      title: '确认重置',
      content: '确定要将所有设置恢复为默认值吗？此操作无法撤销。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '重置中...' })
          
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '已重置',
              icon: 'success'
            })
            this.loadSettings()
          }, 800)
        }
      }
    })
  },

  /**
   * 测试联系方式
   */
  testContact(e) {
    const { type } = e.currentTarget.dataset
    if (type === 'phone') {
      wx.makePhoneCall({
        phoneNumber: this.data.basicSettings.contactPhone
      })
    } else if (type === 'email') {
      wx.setClipboardData({
        data: this.data.basicSettings.contactEmail,
        success: () => {
          wx.showToast({
            title: '邮箱已复制',
            icon: 'success'
          })
        }
      })
    }
  }
})
