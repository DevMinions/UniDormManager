// pages/repairs/statistics/index.js
const app = getApp()
const { getRepairs } = require('../../../api/repairs')

Page({
  data: {
    loading: true,
    
    // 总统计
    totalStats: {
      totalTickets: 0,
      completedTickets: 0,
      pendingTickets: 0,
      inProgressTickets: 0,
      completionRate: 0,
      avgResponseTime: 0
    },
    
    // 今日统计
    todayStats: {
      newTickets: 0,
      completedTickets: 0,
      urgentTickets: 0
    },
    
    // 本周统计
    weekStats: {
      totalTickets: 0,
      completedTickets: 0,
      completionRate: 0
    },
    
    // 优先级分布
    priorityStats: {
      high: 0,
      medium: 0,
      low: 0
    },
    
    // 类型分布（模拟数据，实际可从后端获取）
    typeStats: [
      { name: '水电维修', count: 0, icon: '💧', color: '#3b82f6' },
      { name: '家具维修', count: 0, icon: '🪑', color: '#8b5cf6' },
      { name: '电器维修', count: 0, icon: '⚡', color: '#f59e0b' },
      { name: '门窗维修', count: 0, icon: '🚪', color: '#10b981' },
      { name: '其他', count: 0, icon: '🔧', color: '#6b7280' }
    ],
    
    // 近7天趋势
    weeklyTrend: [],
    
    // 个人绩效
    personalStats: {
      weeklyCompleted: 0,
      monthlyCompleted: 0,
      avgRating: 4.8,
      responseTime: '15分钟'
    }
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadStatistics()
  },

  onShow() {
    if (app.globalData.isLoggedIn) {
      this.loadStatistics()
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
   * 加载统计数据
   */
  loadStatistics() {
    this.setData({ loading: true })

    const params = {
      page: 1,
      pageSize: 500,
      status: 'All',
      sortOrder: 'desc',
      sortBy: 'date'
    }

    getRepairs(params).then(data => {
      const repairs = data.data || []
      this.calculateStats(repairs)
    }).catch(err => {
      console.error('加载统计数据失败:', err)
      this.setData({ loading: false })
    })
  },

  /**
   * 计算统计数据
   */
  calculateStats(repairs) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // 本周开始时间（周一）
    const weekStart = new Date(today)
    const dayOfWeek = weekStart.getDay() || 7
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // 本月开始时间
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    // 初始化统计
    let totalTickets = repairs.length
    let completedTickets = 0
    let pendingTickets = 0
    let inProgressTickets = 0
    let todayNew = 0
    let todayCompleted = 0
    let todayUrgent = 0
    let weekCompleted = 0
    let monthCompleted = 0
    
    let priorityStats = { high: 0, medium: 0, low: 0 }
    let typeStats = this.data.typeStats.map(t => ({ ...t, count: 0 }))

    // 近7天数据初始化
    let weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      weeklyTrend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        new: 0,
        completed: 0,
        dateStr: d.toISOString().split('T')[0]
      })
    }

    repairs.forEach(repair => {
      const repairDate = new Date(repair.createdAt || repair.date)
      const repairDateStr = repairDate.toISOString().split('T')[0]
      const isToday = repairDateStr === todayStr
      const isThisWeek = repairDateStr >= weekStartStr
      const isThisMonth = repairDateStr >= monthStartStr

      // 状态统计
      switch (repair.status) {
        case 'Completed':
          completedTickets++
          const completedDate = repair.completedAt ? new Date(repair.completedAt).toISOString().split('T')[0] : repairDateStr
          if (completedDate === todayStr) todayCompleted++
          if (completedDate >= weekStartStr) weekCompleted++
          if (completedDate >= monthStartStr) monthCompleted++
          break
        case 'Pending':
          pendingTickets++
          break
        case 'In Progress':
          inProgressTickets++
          break
      }

      // 今日新增
      if (isToday) {
        todayNew++
        if (repair.priority === 'High') {
          todayUrgent++
        }
      }

      // 优先级统计
      if (repair.priority === 'High') priorityStats.high++
      else if (repair.priority === 'Low') priorityStats.low++
      else priorityStats.medium++

      // 类型统计（根据标题关键词判断）
      const title = (repair.title || '').toLowerCase()
      if (title.includes('水') || title.includes('电') || title.includes('灯') || title.includes('插座')) {
        typeStats[0].count++
      } else if (title.includes('床') || title.includes('桌') || title.includes('椅') || title.includes('柜')) {
        typeStats[1].count++
      } else if (title.includes('空调') || title.includes('风扇') || title.includes('电器') || title.includes('开关')) {
        typeStats[2].count++
      } else if (title.includes('门') || title.includes('窗') || title.includes('锁')) {
        typeStats[3].count++
      } else {
        typeStats[4].count++
      }

      // 周趋势统计
      const trendIndex = weeklyTrend.findIndex(t => t.dateStr === repairDateStr)
      if (trendIndex !== -1) {
        weeklyTrend[trendIndex].new++
        if (repair.status === 'Completed') {
          weeklyTrend[trendIndex].completed++
        }
      }
    })

    // 计算完成率
    const completionRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0
    const weekCompletionRate = (todayNew + pendingTickets + inProgressTickets + weekCompleted) > 0 
      ? Math.round((weekCompleted / (todayNew + pendingTickets + inProgressTickets + weekCompleted)) * 100) 
      : 0

    this.setData({
      totalStats: {
        totalTickets,
        completedTickets,
        pendingTickets,
        inProgressTickets,
        completionRate,
        avgResponseTime: 24 // 平均响应时间（小时）
      },
      todayStats: {
        newTickets: todayNew,
        completedTickets: todayCompleted,
        urgentTickets: todayUrgent
      },
      weekStats: {
        totalTickets: todayNew + pendingTickets + inProgressTickets + weekCompleted,
        completedTickets: weekCompleted,
        completionRate: weekCompletionRate
      },
      priorityStats,
      typeStats,
      weeklyTrend,
      personalStats: {
        weeklyCompleted: weekCompleted,
        monthlyCompleted: monthCompleted,
        avgRating: 4.8,
        responseTime: '15分钟'
      },
      loading: false
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadStatistics()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 查看工单列表
   */
  viewTickets(e) {
    const type = e.currentTarget.dataset.type
    let url = '/pages/repairs/list/index'
    
    switch (type) {
      case 'pending':
        url += '?status=Pending'
        break
      case 'completed':
        url += '?status=Completed'
        break
      case 'high':
        url += '?priority=High'
        break
      case 'medium':
        url += '?priority=Medium'
        break
      case 'low':
        url += '?priority=Low'
        break
    }
    
    wx.navigateTo({ url })
  }
})
