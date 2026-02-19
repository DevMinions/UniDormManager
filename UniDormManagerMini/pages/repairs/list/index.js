// pages/repairs/list/index.js
const app = getApp()
const { getRepairs } = require('../../../api/repairs')

Page({
  data: {
    repairList: [],
    loading: true,
    // 权限控制
    userRole: 'student',        // 'student', 'maintenance', 'admin'
    userLevel: 1,             // 1:学生, 2:宿管员, 3:维修工, 4:楼栋管理员, 5:后勤管理员, 6:系统管理员
    userRoleName: '学生',
    // 功能权限
    canViewAllRepairs: false,  // 查看所有报修
    canUpdateStatus: false,      // 更新报修状态
    canDeleteRepair: false,      // 删除报修
    canSubmitRepair: true,        // 提交报修（学生可以）
    // 筛选参数
    filterStatus: '',
    filterPriority: '',
    keyword: ''
  },

  onLoad(options) {
    this.checkLoginStatus()
    this.loadPermissions()
    
    // 处理传入的筛选参数
    const filterStatus = options.status || ''
    const filterPriority = options.priority || ''
    
    this.setData({
      filterStatus,
      filterPriority
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
    const userRole = app.globalData.userRole
    const userLevel = app.globalData.userLevel
    const userRoleName = app.globalData.userRoleName

    // 权限判断
    const canViewAllRepairs = userRole === 'admin' || userRole === 'maintenance'
    const canUpdateStatus = userLevel >= 3  // 维修工及以上
    const canDeleteRepair = userLevel >= 4  // 楼栋管理员及以上
    const canSubmitRepair = userRole === 'student' || userRole === 'admin' // 学生可以提交报修

    this.setData({
      userRole,
      userLevel,
      userRoleName,
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
      pageSize: 100,  // 获取所有报修（管理员）或自己的报修（学生）
      status: 'All',
      sortOrder: 'desc',
      sortBy: 'date'
    }

    getRepairs(params).then(data => {
      console.log('报修列表:', data)
      let repairList = data.data || []
      
      // 前端筛选 - 按状态
      if (this.data.filterStatus) {
        repairList = repairList.filter(item => item.status === this.data.filterStatus)
      }
      
      // 前端筛选 - 按优先级
      if (this.data.filterPriority) {
        repairList = repairList.filter(item => item.priority === this.data.filterPriority)
      }
      
      // 前端筛选 - 按关键词
      if (this.data.keyword) {
        const keyword = this.data.keyword.toLowerCase()
        repairList = repairList.filter(item => 
          (item.title && item.title.toLowerCase().includes(keyword)) ||
          (item.description && item.description.toLowerCase().includes(keyword)) ||
          (item.roomNumber && item.roomNumber.toLowerCase().includes(keyword))
        )
      }
      
      this.setData({
        repairList: repairList,
        loading: false
      })
    }).catch(err => {
      console.error('加载报修列表失败:', err)
      this.setData({ loading: false })
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
    // TODO: 实现搜索逻辑
  },

  /**
   * 筛选状态
   */
  onStatusFilter(e) {
    const status = e.detail.value
    this.setData({ selectedStatus: status })
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
   * 状态标签映射
   */
  getStatusTagInfo(status) {
    const statusMap = {
      'Pending': { text: '待处理', color: '#faad14' },
      'In Progress': { text: '处理中', color: '#3b82f6' },
      'Completed': { text: '已完成', color: '#10b981' },
      'Closed': { text: '已关闭', color: '#6b7280' }
    }
    return statusMap[status] || { text: '未知', color: '#999' }
  },

  /**
   * 优先级标签映射
   */
  getPriorityTagInfo(priority) {
    const priorityMap = {
      'Low': { text: '低', color: '#999999' },
      'Medium': { text: '中', color: '#f59e0b' },
      'High': { text: '高', color: '#ef4444' }
    }
    return priorityMap[priority] || { text: '中', color: '#f59e0b' }
  }
})
