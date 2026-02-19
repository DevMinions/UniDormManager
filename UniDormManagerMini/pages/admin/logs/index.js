// pages/admin/logs/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    isAdmin: false,
    
    // 日志列表
    logList: [],
    total: 0,
    
    // 分页
    page: 1,
    pageSize: 15,
    hasMore: true,
    
    // 筛选条件
    selectedType: 'all',
    selectedDate: 'all',
    keyword: '',
    
    // 操作类型选项
    typeOptions: [
      { value: 'all', label: '全部类型' },
      { value: 'user', label: '用户管理' },
      { value: 'room', label: '房间管理' },
      { value: 'repair', label: '报修管理' },
      { value: 'notice', label: '公告管理' },
      { value: 'checkin', label: '入住办理' },
      { value: 'checkout', label: '退宿办理' },
      { value: 'settings', label: '系统设置' }
    ],
    
    // 日期选项
    dateOptions: [
      { value: 'all', label: '全部时间' },
      { value: 'today', label: '今天' },
      { value: 'yesterday', label: '昨天' },
      { value: 'week', label: '近7天' },
      { value: 'month', label: '近30天' }
    ]
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadLogList()
  },

  onShow() {
    if (app.globalData.isLoggedIn && this.data.isAdmin) {
      this.loadLogList()
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
   * 加载操作日志
   */
  loadLogList(refresh = true) {
    if (!this.data.isAdmin) return

    if (refresh) {
      this.setData({ page: 1, hasMore: true, loading: true })
    }

    // 模拟数据
    setTimeout(() => {
      const mockLogs = this.generateMockLogs()
      
      // 筛选
      let filteredLogs = mockLogs
      
      // 按类型筛选
      if (this.data.selectedType !== 'all') {
        filteredLogs = filteredLogs.filter(l => l.type === this.data.selectedType)
      }
      
      // 按日期筛选
      if (this.data.selectedDate !== 'all') {
        const now = new Date()
        filteredLogs = filteredLogs.filter(l => {
          const logDate = new Date(l.timestamp)
          const diffHours = (now - logDate) / (1000 * 60 * 60)
          
          if (this.data.selectedDate === 'today') {
            return diffHours < 24
          } else if (this.data.selectedDate === 'yesterday') {
            return diffHours >= 24 && diffHours < 48
          } else if (this.data.selectedDate === 'week') {
            return diffHours < 168
          } else if (this.data.selectedDate === 'month') {
            return diffHours < 720
          }
          return true
        })
      }
      
      // 按关键词搜索
      if (this.data.keyword) {
        const keyword = this.data.keyword.toLowerCase()
        filteredLogs = filteredLogs.filter(l => 
          (l.operatorName && l.operatorName.toLowerCase().includes(keyword)) ||
          (l.action && l.action.toLowerCase().includes(keyword)) ||
          (l.description && l.description.toLowerCase().includes(keyword))
        )
      }

      const total = filteredLogs.length
      const start = (this.data.page - 1) * this.data.pageSize
      const end = start + this.data.pageSize
      const paginatedLogs = filteredLogs.slice(start, end)

      this.setData({
        logList: refresh ? paginatedLogs : [...this.data.logList, ...paginatedLogs],
        total,
        hasMore: end < total,
        loading: false
      })
    }, 600)
  },

  /**
   * 生成模拟日志数据
   */
  generateMockLogs() {
    const logs = []
    const operators = [
      { id: 1, name: '张管理员' },
      { id: 2, name: '李宿管' },
      { id: 3, name: '王后勤' }
    ]
    
    const actions = [
      { type: 'user', action: '添加用户', description: '添加了学生用户 {name}' },
      { type: 'user', action: '修改用户', description: '修改了用户 {name} 的信息' },
      { type: 'user', action: '禁用用户', description: '禁用了用户 {name}' },
      { type: 'user', action: '重置密码', description: '重置了用户 {name} 的密码' },
      { type: 'room', action: '分配房间', description: '为 {name} 分配了房间 {room}' },
      { type: 'room', action: '退房办理', description: '为 {name} 办理退房' },
      { type: 'repair', action: '接单', description: '接取了报修工单 {id}' },
      { type: 'repair', action: '完成', description: '完成了报修工单 {id}' },
      { type: 'notice', action: '发布公告', description: '发布了公告: {title}' },
      { type: 'checkin', action: '入住办理', description: '为 {name} 办理入住手续' },
      { type: 'checkout', action: '退宿办理', description: '为 {name} 办理退宿手续' },
      { type: 'settings', action: '修改设置', description: '修改了系统配置' }
    ]

    const names = ['陈明', '林晓', '黄强', '杨洋', '刘芳']
    const rooms = ['A栋101', 'B栋205', 'C栋302', 'D栋401']
    const titles = ['关于寒假期间宿舍管理通知', '宿舍安全注意事项', '网络维护通知']

    for (let i = 1; i <= 50; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const operator = operators[Math.floor(Math.random() * operators.length)]
      const name = names[Math.floor(Math.random() * names.length)]
      const room = rooms[Math.floor(Math.random() * rooms.length)]
      
      let description = action.description
        .replace('{name}', name)
        .replace('{room}', room)
        .replace('{id}', String(i + 1000))
        .replace('{title}', titles[Math.floor(Math.random() * titles.length)])
      
      const now = new Date()
      const timestamp = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000)
      
      logs.push({
        id: i,
        type: action.type,
        action: action.action,
        description,
        operatorId: operator.id,
        operatorName: operator.name,
        timestamp,
        timeStr: this.formatTime(timestamp)
      })
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp)
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadLogList(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 }, () => {
      this.loadLogList(false)
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadLogList(true)
    }, 500)
  },

  /**
   * 筛选类型
   */
  filterType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ selectedType: type }, () => {
      this.loadLogList(true)
    })
  },

  /**
   * 筛选日期
   */
  filterDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ selectedDate: date }, () => {
      this.loadLogList(true)
    })
  },

  /**
   * 导出日志
   */
  exportLogs() {
    wx.showModal({
      title: '确认导出',
      content: `将导出符合筛选条件的操作日志，共 ${this.data.total} 条记录`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '导出中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })
          }, 800)
        }
      }
    })
  }
})
