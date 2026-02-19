// pages/rooms/detail/index.js
const app = getApp()
const { getRoomDetail } = require('../../../api/rooms')
const { getRepairs } = require('../../../api/repairs')

Page({
  data: {
    roomId: '',
    room: null,
    students: [],
    repairs: [],
    loading: true,
    error: false,
    errorMessage: '',
    isAdmin: false,
    activeTab: 'info', // info, students, repairs
    statusMap: {
      'pending': '待处理',
      'in_progress': '处理中',
      'completed': '已完成',
      'closed': '已关闭'
    },
    statusColorMap: {
      'pending': '#f59e0b',
      'in_progress': '#3b82f6',
      'completed': '#10b981',
      'closed': '#6b7280'
    }
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    if (options.id) {
      this.setData({ 
        roomId: options.id,
        isAdmin: app.globalData.userRole === 'admin' || app.globalData.userRole === 'manager'
      })
      this.loadRoomDetail()
    } else {
      this.setData({
        loading: false,
        error: true,
        errorMessage: '参数错误：缺少房间ID'
      })
    }
  },

  onPullDownRefresh() {
    this.loadRoomDetail().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载房间详情
   */
  loadRoomDetail() {
    this.setData({ loading: true, error: false })

    return Promise.all([
      this.fetchRoomInfo(),
      this.fetchRoomRepairs()
    ]).then(() => {
      this.setData({ loading: false })
    }).catch(err => {
      console.error('加载房间详情失败:', err)
      this.setData({ 
        loading: false,
        error: true,
        errorMessage: err.message || '加载失败，请重试'
      })
    })
  },

  /**
   * 获取房间信息
   */
  fetchRoomInfo() {
    return getRoomDetail(this.data.roomId).then(data => {
      console.log('房间详情:', data)
      
      // 格式化房间数据
      const room = {
        ...data,
        statusText: this.getRoomStatusText(data.status),
        typeText: this.getRoomTypeText(data.type)
      }
      
      // 处理学生列表
      const students = data.students || data.residents || []
      
      this.setData({
        room: room,
        students: students
      })
    })
  },

  /**
   * 获取房间相关报修
   */
  fetchRoomRepairs() {
    return getRepairs({ 
      roomId: this.data.roomId,
      page: 1,
      limit: 10
    }).then(data => {
      console.log('房间报修:', data)
      const repairs = (data.list || data || []).map(item => ({
        ...item,
        statusText: this.data.statusMap[item.status] || item.status
      }))
      this.setData({ repairs })
    }).catch(err => {
      console.error('加载报修记录失败:', err)
      // 报修记录加载失败不影响整体
      this.setData({ repairs: [] })
    })
  },

  /**
   * 获取房间状态文本
   */
  getRoomStatusText(status) {
    const statusMap = {
      'available': '空闲',
      'occupied': '已入住',
      'maintenance': '维修中',
      'reserved': '已预订',
      'cleaning': '清洁中'
    }
    return statusMap[status] || status
  },

  /**
   * 获取房间类型文本
   */
  getRoomTypeText(type) {
    const typeMap = {
      'single': '单人间',
      'double': '双人间',
      'triple': '三人间',
      'quad': '四人间',
      'suite': '套房'
    }
    return typeMap[type] || type
  },

  /**
   * 切换标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  /**
   * 查看报修详情
   */
  goToRepairDetail(e) {
    const repairId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repairs/detail/index?id=${repairId}`
    })
  },

  /**
   * 拨打电话
   */
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone
    if (!phone) {
      wx.showToast({
        title: '暂无联系方式',
        icon: 'none'
      })
      return
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 编辑房间（管理员）
   */
  editRoom() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '无权限',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: `/pages/rooms/edit/index?id=${this.data.roomId}`
    })
  },

  /**
   * 新增报修
   */
  addRepair() {
    wx.navigateTo({
      url: `/pages/repairs/create/index?roomId=${this.data.roomId}&roomNumber=${this.data.room.number || this.data.room.roomNumber}`
    })
  },

  /**
   * 查看楼层图
   */
  viewFloorPlan() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
