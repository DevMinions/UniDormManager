// pages/repairs/list/index.js
const app = getApp()
const { getRepairs } = require('../../../api/repairs')

Page({
  data: {
    repairs: [],
    loading: false,
    selectedStatus: 'all',
    isAdmin: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      isAdmin: app.globalData.userRole === 'admin'
    })

    this.loadRepairs()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.loadRepairs()
    }
  },

  /**
   * 加载报修列表
   */
  loadRepairs() {
    this.setData({ loading: true })

    const params = {}
    if (this.data.selectedStatus !== 'all') {
      params.status = this.data.selectedStatus
    }

    getRepairs(params).then(data => {
      console.log('报修列表:', data)
      this.setData({
        repairs: data.repairs || data || [],
        loading: false
      })
    }).catch(err => {
      console.error('加载报修列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 筛选状态
   */
  filterStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ selectedStatus: status })
    this.loadRepairs()
  },

  /**
   * 查看报修详情
   */
  goToDetail(e) {
    const repairId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repairs/detail/index?id=${repairId}`
    })
  },

  /**
   * 提交报修
   */
  goToSubmit() {
    wx.navigateTo({
      url: '/pages/repairs/submit/index'
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRepairs()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
