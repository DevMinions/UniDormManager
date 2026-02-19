// pages/repairs/list/index.js
const app = getApp()
const { getRepairs, updateRepair, deleteRepair } = require('../../../api/repairs')

Page({
  data: {
    repairList: [],
    loading: true,
    // 权限控制
    userRole: 'student',        // 'student', 'maintenance', 'admin'
    userLevel: 1,             // 1:学生, 2:宿管员, 3:维修工, 4:楼栋管理员, 5:后勤管理员, 6:系统管理员
    userRoleName: '学生',
    userId: '',
    // 功能权限
    canViewAllRepairs: false,  // 查看所有报修
    canUpdateStatus: false,      // 更新报修状态
    canDeleteRepair: false,      // 删除报修
    canSubmitRepair: true,        // 提交报修（学生可以）
    // 筛选参数
    selectedStatus: 'all',
    selectedPriority: 'all',
    keyword: ''
  },

  onLoad(options) {
    this.checkLoginStatus()
    this.loadPermissions()
    
    // 处理传入的筛选参数
    const selectedStatus = options.status || 'all'
    const selectedPriority = options.priority || 'all'
    
    this.setData({
      selectedStatus,
      selectedPriority
    })
    
    this.loadRepairList()
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.loadRepairList()
    }
    
    // 设置 TabBar 选中状态（报修是第3个，index=2）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
  },

  /**
   * 加载权限信息
   */
  loadPermissions() {
    const userRole = app.globalData.userRole || 'student'
    const userLevel = app.globalData.userLevel || 1
    const userRoleName = app.globalData.userRoleName || '学生'
    const userId = app.globalData.userId || ''

    // 权限判断
    // 学生：只看自己的报修
    // 维修工：看分配给自己的工单
    // 管理员：看所有报修
    const canViewAllRepairs = userRole === 'admin' || userLevel >= 4
    const canUpdateStatus = userLevel >= 3 || userRole === 'maintenance'
    const canDeleteRepair = userLevel >= 4 || userRole === 'admin'
    const canSubmitRepair = userRole === 'student' || userRole === 'admin'

    this.setData({
      userRole,
      userLevel,
      userRoleName,
      userId,
      canViewAllRepairs,
      canUpdateStatus,
      canDeleteRepair,
      canSubmitRepair
    })
  },

  /**
   * 加载报修列表
   */
  loadRepairList() {
    this.setData({ loading: true })

    const params = {
      page: 1,
      pageSize: 100,
      sortOrder: 'desc',
      sortBy: 'createdAt'
    }

    // 根据角色添加筛选条件
    if (this.data.userRole === 'student') {
      params.userId = this.data.userId
    } else if (this.data.userRole === 'maintenance') {
      params.assignedTo = this.data.userId
    }
    // 管理员不添加限制，查看所有

    // 状态筛选（非all时）
    if (this.data.selectedStatus && this.data.selectedStatus !== 'all') {
      params.status = this.data.selectedStatus
    }

    // 优先级筛选（非all时）
    if (this.data.selectedPriority && this.data.selectedPriority !== 'all') {
      params.priority = this.data.selectedPriority
    }

    getRepairs(params).then(data => {
      let repairList = data.data || data || []
      
      // 前端筛选 - 按关键词
      if (this.data.keyword) {
        const keyword = this.data.keyword.toLowerCase()
        repairList = repairList.filter(item => 
          (item.title && item.title.toLowerCase().includes(keyword)) ||
          (item.description && item.description.toLowerCase().includes(keyword)) ||
          (item.roomNumber && item.roomNumber.toLowerCase().includes(keyword)) ||
          (item.room_number && item.room_number.toLowerCase().includes(keyword))
        )
      }
      
      // 格式化数据
      repairList = repairList.map(item => ({
        ...item,
        statusText: this.getStatusText(item.status),
        priorityText: this.getPriorityText(item.priority),
        statusClass: this.getStatusClass(item.status),
        priorityClass: this.getPriorityClass(item.priority)
      }))
      
      this.setData({
        repairList: repairList,
        loading: false
      })
    }).catch(err => {
      console.error('加载报修列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRepairList()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 搜索报修
   */
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadRepairList()
    }, 500)
  },

  /**
   * 状态筛选
   */
  filterStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ selectedStatus: status })
    this.loadRepairList()
  },

  /**
   * 优先级筛选
   */
  filterPriority(e) {
    const priority = e.currentTarget.dataset.priority
    this.setData({ selectedPriority: priority })
    this.loadRepairList()
  },

  /**
   * 跳转到提交页面
   */
  goToSubmit() {
    if (!this.data.canSubmitRepair) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/repairs/submit/index'
    })
  },

  /**
   * 查看详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repairs/detail/index?id=${id}`
    })
  },

  /**
   * 接单（维修工）
   */
  takeOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认接单',
      content: '确定要接这个工单吗？',
      success: (res) => {
        if (res.confirm) {
          updateRepair(id, {
            status: 'in_progress',
            assignedTo: this.data.userId,
            notes: '维修工接单'
          }).then(() => {
            wx.showToast({
              title: '接单成功',
              icon: 'success'
            })
            this.loadRepairList()
          }).catch(err => {
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
   * 取消报修（学生）
   */
  cancelRepair(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个报修吗？此操作无法撤销。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          updateRepair(id, {
            status: 'closed',
            notes: '用户取消报修'
          }).then(() => {
            wx.showToast({
              title: '已取消',
              icon: 'success'
            })
            this.loadRepairList()
          }).catch(err => {
            wx.showToast({
              title: err.message || '操作失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  /**
   * 删除报修（管理员）
   */
  deleteRepair(e) {
    const id = e.currentTarget.dataset.id
    if (!this.data.canDeleteRepair) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个报修吗？此操作无法撤销。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          deleteRepair(id).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadRepairList()
          }).catch(err => {
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // ========== 辅助方法 ==========

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'in_progress': '处理中',
      'completed': '已完成',
      'closed': '已关闭',
      'Pending': '待处理',
      'In Progress': '处理中',
      'Completed': '已完成',
      'Closed': '已关闭'
    }
    return statusMap[status] || status
  },

  /**
   * 获取优先级文本
   */
  getPriorityText(priority) {
    const priorityMap = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'Low': '低',
      'Medium': '中',
      'High': '高'
    }
    return priorityMap[priority] || priority
  },

  /**
   * 获取状态样式类名
   */
  getStatusClass(status) {
    const classMap = {
      'pending': 'status-pending',
      'in_progress': 'status-in_progress',
      'completed': 'status-completed',
      'closed': 'status-closed',
      'Pending': 'status-pending',
      'In Progress': 'status-in_progress',
      'Completed': 'status-completed',
      'Closed': 'status-closed'
    }
    return classMap[status] || ''
  },

  /**
   * 获取优先级样式类名
   */
  getPriorityClass(priority) {
    const classMap = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high'
    }
    return classMap[priority] || 'priority-medium'
  }
})
