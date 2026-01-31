// pages/rooms/list.js
const app = getApp()
const { getRooms } = require('../../api/rooms')

Page({
  data: {
    rooms: [],
    loading: false,
    keyword: '',
    selectedBuilding: null,
    selectedStatus: null
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.loadRooms()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.loadRooms()
    }
  },

  /**
   * 加载房间列表
   */
  loadRooms() {
    this.setData({ loading: true })

    const params = {}
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    if (this.data.selectedBuilding) {
      params.buildingId = this.data.selectedBuilding
    }
    if (this.data.selectedStatus) {
      params.status = this.data.selectedStatus
    }

    getRooms(params).then(data => {
      console.log('房间列表:', data)
      this.setData({
        rooms: data.rooms || data || [],
        loading: false
      })
    }).catch(err => {
      console.error('加载房间列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 搜索房间
   */
  handleSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.loadRooms()
  },

  /**
   * 查看房间详情
   */
  goToDetail(e) {
    const roomId = e.currentTarget.dataset.id
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRooms()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
