// pages/repairs/detail/index.js
const app = getApp()
const { getRepairDetail, updateRepair } = require('../../../api/repairs')

Page({
  data: {
    repairId: '',
    repair: null,
    loading: true,
    error: false,
    errorMessage: '',
    isAdmin: false,
    notes: '',
    statusMap: {
      'pending': '待处理',
      'in_progress': '处理中',
      'completed': '已完成',
      'closed': '已关闭'
    },
    priorityMap: {
      'high': '紧急',
      'medium': '一般',
      'low': '低'
    },
    timeline: []
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
        repairId: options.id,
        isAdmin: app.globalData.userRole === 'admin' || app.globalData.userRole === 'manager'
      })
      this.loadRepairDetail()
    } else {
      this.setData({
        loading: false,
        error: true,
        errorMessage: '参数错误：缺少报修ID'
      })
    }
  },

  onPullDownRefresh() {
    this.loadRepairDetail().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载报修详情
   */
  loadRepairDetail() {
    this.setData({ loading: true, error: false })

    return getRepairDetail(this.data.repairId).then(data => {
      console.log('报修详情:', data)
      
      // 构建时间线
      const timeline = this.buildTimeline(data)
      
      this.setData({
        repair: data,
        timeline: timeline,
        loading: false
      })
    }).catch(err => {
      console.error('加载报修详情失败:', err)
      this.setData({ 
        loading: false,
        error: true,
        errorMessage: err.message || '加载失败，请重试'
      })
    })
  },

  /**
   * 构建状态时间线
   */
  buildTimeline(repair) {
    const timeline = []
    const status = repair.status
    
    // 提交阶段
    timeline.push({
      status: 'pending',
      title: '报修提交',
      time: repair.createdAt || repair.created_at,
      desc: '您的报修申请已提交，等待管理员处理',
      completed: ['pending', 'in_progress', 'completed', 'closed'].includes(status)
    })
    
    // 处理中阶段
    if (status === 'in_progress' || status === 'completed' || status === 'closed' || 
        (repair.history && repair.history.some(h => h.status === 'in_progress'))) {
      const progressTime = repair.history?.find(h => h.status === 'in_progress')?.time || 
                          repair.updatedAt || repair.updated_at || '处理中'
      timeline.push({
        status: 'in_progress',
        title: '处理中',
        time: typeof progressTime === 'string' ? progressTime : '正在进行',
        desc: '维修人员已接单，正在处理您的报修',
        completed: ['in_progress', 'completed', 'closed'].includes(status)
      })
    } else {
      timeline.push({
        status: 'in_progress',
        title: '处理中',
        time: '',
        desc: '等待管理员分配维修人员',
        completed: false
      })
    }
    
    // 完成阶段
    if (status === 'completed' || status === 'closed') {
      const completeTime = repair.history?.find(h => h.status === 'completed')?.time || 
                          repair.updatedAt || repair.updated_at
      timeline.push({
        status: 'completed',
        title: status === 'closed' ? '已关闭' : '已完成',
        time: completeTime,
        desc: status === 'closed' ? '该报修已关闭' : '维修已完成，感谢反馈',
        completed: true
      })
    } else {
      timeline.push({
        status: 'completed',
        title: '已完成',
        time: '',
        desc: '处理完成后将通知您',
        completed: false
      })
    }
    
    return timeline
  },

  /**
   * 获取状态描述
   */
  getStatusDescription(status) {
    const descriptions = {
      'pending': '等待管理员处理',
      'in_progress': '正在处理中',
      'completed': '报修已处理完成',
      'closed': '报修已关闭'
    }
    return descriptions[status] || ''
  },

  /**
   * 输入备注
   */
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  /**
   * 更新报修状态
   */
  updateRepairStatus(status) {
    const data = {
      status: status
    }

    if (this.data.notes.trim()) {
      data.notes = this.data.notes
    }

    wx.showLoading({ title: '处理中...' })
    
    updateRepair(this.data.repairId, data).then(res => {
      wx.hideLoading()
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })
      this.setData({ notes: '' })
      this.loadRepairDetail()
    }).catch(err => {
      wx.hideLoading()
      console.error('更新失败:', err)
      wx.showToast({
        title: err.message || '更新失败',
        icon: 'none'
      })
    })
  },

  /**
   * 标记为处理中
   */
  markInProgress() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将报修标记为处理中吗？',
      confirmColor: '#667eea',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('in_progress')
        }
      }
    })
  },

  /**
   * 标记为已完成
   */
  markCompleted() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将报修标记为已完成吗？\n完成后将通知报修人。',
      confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('completed')
        }
      }
    })
  },

  /**
   * 关闭报修
   */
  closeRepair() {
    wx.showModal({
      title: '确认关闭',
      content: '确定要关闭此报修吗？关闭后将无法恢复。',
      confirmColor: '#ef4444',
      confirmText: '确认关闭',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('closed')
        }
      }
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    const images = this.data.repair.images || []
    wx.previewImage({
      current: url,
      urls: images
    })
  },

  /**
   * 联系管理员
   */
  contactAdmin() {
    wx.showModal({
      title: '联系管理员',
      content: '是否拨打管理员电话？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以从配置或接口获取管理员电话
          wx.makePhoneCall({
            phoneNumber: '10086',
            fail: () => {
              wx.showToast({
                title: '拨打电话失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  /**
   * 查看房间详情
   */
  goToRoom(e) {
    const roomId = e.currentTarget.dataset.roomId
    if (roomId) {
      wx.navigateTo({
        url: `/pages/rooms/detail/index?id=${roomId}`
      })
    } else {
      wx.showToast({
        title: '房间信息不存在',
        icon: 'none'
      })
    }
  }
})
