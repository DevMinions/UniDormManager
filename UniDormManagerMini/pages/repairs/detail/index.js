// pages/repairs/detail/index.js
const app = getApp()
const { getRepairDetail, updateRepair, deleteRepair } = require('../../../api/repairs')

Page({
  data: {
    repairId: '',
    repair: null,
    loading: true,
    error: false,
    errorMessage: '',
    // 用户角色信息
    userRole: 'student',
    userLevel: 1,
    userId: '',
    // 权限控制
    canCancel: false,        // 取消报修
    canTakeOrder: false,     // 接单
    canComplete: false,      // 完成工单
    canAssign: false,        // 分配工单
    canUpdateStatus: false,  // 更新状态
    canDelete: false,        // 删除报修
    // 其他数据
    notes: '',
    statusMap: {
      'pending': '待处理',
      'in_progress': '处理中',
      'completed': '已完成',
      'closed': '已关闭',
      'Pending': '待处理',
      'In Progress': '处理中',
      'Completed': '已完成',
      'Closed': '已关闭'
    },
    priorityMap: {
      'high': { text: '高', class: 'priority-high' },
      'medium': { text: '中', class: 'priority-medium' },
      'low': { text: '低', class: 'priority-low' },
      'High': { text: '高', class: 'priority-high' },
      'Medium': { text: '中', class: 'priority-medium' },
      'Low': { text: '低', class: 'priority-low' }
    },
    timeline: [],
    history: []
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 加载用户权限
    this.loadPermissions()

    if (options.id) {
      this.setData({ 
        repairId: options.id
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
   * 加载用户权限信息
   */
  loadPermissions() {
    const userRole = app.globalData.userRole || 'student'
    const userLevel = app.globalData.userLevel || 1
    const userId = app.globalData.userId || ''

    this.setData({
      userRole,
      userLevel,
      userId
    })
  },

  /**
   * 计算操作权限
   */
  calculatePermissions(repair) {
    const { userRole, userLevel, userId, repairId } = this.data
    const status = repair.status
    const isCreator = repair.userId === userId || repair.user_id === userId

    // 学生权限
    const canCancel = userRole === 'student' && isCreator && status === 'pending'

    // 维修工权限
    const canTakeOrder = userRole === 'maintenance' && status === 'pending'
    const canComplete = userRole === 'maintenance' && 
                        (status === 'in_progress' || status === 'In Progress') &&
                        (repair.assignedTo === userId || repair.assigned_to === userId)

    // 管理员权限
    const canAssign = (userLevel >= 4 || userRole === 'admin') && status === 'pending'
    const canUpdateStatus = userLevel >= 4 || userRole === 'admin' || userRole === 'maintenance'
    const canDelete = (userLevel >= 5 || userRole === 'admin') || 
                      (userRole === 'student' && isCreator && status === 'pending')

    this.setData({
      canCancel,
      canTakeOrder,
      canComplete,
      canAssign,
      canUpdateStatus,
      canDelete
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
      // 格式化处理记录
      const history = this.formatHistory(data.history || [])
      
      this.setData({
        repair: data,
        timeline: timeline,
        history: history,
        loading: false
      })

      // 计算权限
      this.calculatePermissions(data)
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
    const status = repair.status ? repair.status.toLowerCase() : 'pending'
    
    // 提交阶段 - 总是存在
    timeline.push({
      status: 'pending',
      title: '报修提交',
      time: repair.createdAt || repair.created_at,
      desc: '您的报修申请已提交，等待处理',
      completed: true,
      isFirst: true
    })
    
    // 处理中阶段
    const hasProgress = ['in_progress', 'completed', 'closed'].includes(status) ||
                        ['in progress', 'completed', 'closed'].includes(status)
    
    if (hasProgress) {
      const progressTime = repair.acceptedAt || repair.accepted_at || 
                          repair.assignedAt || repair.assigned_at ||
                          repair.updatedAt || repair.updated_at || 
                          '处理中'
      const assignee = repair.assignedToName || repair.assigned_to_name || 
                       repair.maintenanceName || '维修人员'
      
      timeline.push({
        status: 'in_progress',
        title: '处理中',
        time: typeof progressTime === 'string' ? progressTime : '',
        desc: assignee ? `${assignee}已接单，正在处理您的报修` : '维修人员已接单，正在处理',
        completed: true
      })
    } else {
      timeline.push({
        status: 'in_progress',
        title: '处理中',
        time: '',
        desc: '等待分配维修人员',
        completed: false
      })
    }
    
    // 完成阶段
    if (status === 'completed' || status === 'closed') {
      const completeTime = repair.completedAt || repair.completed_at || 
                          repair.updatedAt || repair.updated_at
      const isClosed = status === 'closed'
      
      timeline.push({
        status: isClosed ? 'closed' : 'completed',
        title: isClosed ? '已关闭' : '已完成',
        time: completeTime || '',
        desc: isClosed ? '该报修已关闭' : '维修已完成，感谢反馈',
        completed: true,
        isLast: true
      })
    } else {
      timeline.push({
        status: 'completed',
        title: '已完成',
        time: '',
        desc: '处理完成后将通知您',
        completed: false,
        isLast: true
      })
    }
    
    return timeline
  },

  /**
   * 格式化处理记录
   */
  formatHistory(historyList) {
    if (!historyList || historyList.length === 0) {
      return []
    }

    return historyList.map(item => ({
      ...item,
      actionText: this.getActionText(item.action || item.status),
      timeFormatted: item.time || item.createdAt || item.created_at
    }))
  },

  /**
   * 获取操作描述
   */
  getActionText(action) {
    const actionMap = {
      'created': '提交报修',
      'pending': '提交报修',
      'in_progress': '开始处理',
      'in progress': '开始处理',
      'assigned': '分配工单',
      'completed': '完成维修',
      'closed': '关闭报修',
      'cancelled': '取消报修',
      'updated': '更新状态'
    }
    return actionMap[action] || action
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
  updateRepairStatus(status, notes = '') {
    const data = { status }

    if (notes.trim()) {
      data.notes = notes
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
   * 学生取消报修
   */
  cancelRepair() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个报修吗？此操作无法撤销。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('closed', '用户取消报修')
        }
      }
    })
  },

  /**
   * 维修工接单
   */
  takeOrder() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接这个工单吗？',
      confirmColor: '#667eea',
      success: (res) => {
        if (res.confirm) {
          const data = {
            status: 'in_progress',
            assignedTo: this.data.userId,
            notes: this.data.notes || '维修工接单'
          }

          wx.showLoading({ title: '处理中...' })
          
          updateRepair(this.data.repairId, data).then(() => {
            wx.hideLoading()
            wx.showToast({
              title: '接单成功',
              icon: 'success'
            })
            this.setData({ notes: '' })
            this.loadRepairDetail()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({
              title: err.message || '接单失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  /**
   * 维修工/管理员完成工单
   */
  completeRepair() {
    wx.showModal({
      title: '确认完成',
      content: '确定要完成这个工单吗？完成后将通知报修人。',
      confirmColor: '#10b981',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('completed', this.data.notes || '维修完成')
        }
      }
    })
  },

  /**
   * 标记为处理中（管理员）
   */
  markInProgress() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将报修标记为处理中吗？',
      confirmColor: '#667eea',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('in_progress', this.data.notes || '开始处理')
        }
      }
    })
  },

  /**
   * 标记为已完成
   */
  markCompleted() {
    this.completeRepair()
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
          this.updateRepairStatus('closed', this.data.notes || '关闭报修')
        }
      }
    })
  },

  /**
   * 删除报修
   */
  deleteRepair() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此报修吗？删除后将无法恢复。',
      confirmColor: '#ef4444',
      confirmText: '确认删除',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          deleteRepair(this.data.repairId).then(() => {
            wx.hideLoading()
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          })
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
   * 返回列表
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 阻止事件冒泡
   */
  preventBubble() {
    // 用于阻止事件冒泡
  }
})
