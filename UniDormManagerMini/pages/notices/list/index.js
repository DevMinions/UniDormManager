// pages/notices/list/index.js
const app = getApp()
const { getNotices } = require('../../../api/notices')

Page({
  data: {
    notices: [],
    loading: false,
    selectedCategory: 'all'
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.loadNotices()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.loadNotices()
    }
  },

  /**
   * 加载公告列表
   */
  loadNotices() {
    this.setData({ loading: true })

    const params = {}
    if (this.data.selectedCategory !== 'all') {
      params.category = this.data.selectedCategory
    }

    getNotices(params).then(data => {
      console.log('公告列表:', data)
      this.setData({
        notices: data.notices || data || [],
        loading: false
      })
    }).catch(err => {
      console.error('加载公告列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 筛选分类
   */
  filterCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category })
    this.loadNotices()
  },

  /**
   * 查看公告详情
   */
  goToDetail(e) {
    const noticeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/notices/detail/index?id=${noticeId}`
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadNotices()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
