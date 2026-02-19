// pages/notices/list/index.js
const app = getApp()
const { getNotices, markNoticeRead } = require('../../../api/notices')
const { formatRelativeTime } = require('../../../utils/date')

Page({
  data: {
    notices: [],
    loading: false,
    loadingMore: false,
    selectedCategory: 'all',
    page: 1,
    pageSize: 10,
    hasMore: true,
    total: 0,
    isRefreshing: false,
    isAdmin: false,
    categories: [
      { key: 'all', label: '全部' },
      { key: 'system', label: '系统' },
      { key: 'dorm', label: '宿舍' },
      { key: 'maintenance', label: '维修' },
      { key: 'other', label: '其他' }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 检查是否是管理员
    this.checkAdminStatus()
    
    this.loadNotices()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      // 检查是否需要刷新（从详情页返回可能已读）
      const needRefresh = wx.getStorageSync('notices_need_refresh')
      if (needRefresh) {
        wx.removeStorageSync('notices_need_refresh')
        this.refreshNotices()
      }
    }
  },

  /**
   * 检查管理员状态
   */
  checkAdminStatus() {
    const userInfo = app.globalData.userInfo || {}
    const isAdmin = userInfo.role === 'admin' || userInfo.isAdmin || userInfo.role === 'manager'
    this.setData({ isAdmin })
  },

  /**
   * 加载公告列表
   */
  loadNotices(reset = false) {
    if (this.data.loading) return

    const page = reset ? 1 : this.data.page
    
    this.setData({ 
      loading: reset || this.data.notices.length === 0,
      loadingMore: !reset && this.data.notices.length > 0,
      page: page
    })

    const params = {
      page: page,
      pageSize: this.data.pageSize
    }
    
    if (this.data.selectedCategory !== 'all') {
      params.category = this.data.selectedCategory
    }

    getNotices(params).then(data => {
      console.log('公告列表:', data)
      
      const notices = data.notices || data.list || data || []
      const total = data.total || notices.length
      
      // 处理公告数据
      const processedNotices = notices.map(notice => this.processNoticeData(notice))

      // 置顶公告排序
      const sortedNotices = this.sortNotices(reset ? processedNotices : [...this.data.notices, ...processedNotices])

      this.setData({
        notices: sortedNotices,
        loading: false,
        loadingMore: false,
        isRefreshing: false,
        hasMore: notices.length >= this.data.pageSize,
        total: total
      })

      // 停止下拉刷新
      if (reset) {
        wx.stopPullDownRefresh()
      }
    }).catch(err => {
      console.error('加载公告列表失败:', err)
      this.setData({ 
        loading: false,
        loadingMore: false,
        isRefreshing: false
      })
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 处理公告数据
   */
  processNoticeData(notice) {
    return {
      ...notice,
      isRead: notice.isRead || notice.is_read || false,
      isPinned: notice.isPinned || notice.is_pinned || false,
      categoryText: this.getCategoryText(notice.category),
      formattedTime: formatRelativeTime(notice.publishedAt || notice.published_at || notice.createdAt || notice.created_at)
    }
  },

  /**
   * 排序公告（置顶在前，然后按时间倒序）
   */
  sortNotices(notices) {
    const uniqueNotices = this.removeDuplicates(notices)
    return uniqueNotices.sort((a, b) => {
      // 置顶公告在前
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      // 按时间倒序
      const timeA = new Date(a.publishedAt || a.published_at || a.createdAt || a.created_at)
      const timeB = new Date(b.publishedAt || b.published_at || b.createdAt || b.created_at)
      return timeB - timeA
    })
  },

  /**
   * 去重
   */
  removeDuplicates(notices) {
    const seen = new Set()
    return notices.filter(notice => {
      if (seen.has(notice.id)) return false
      seen.add(notice.id)
      return true
    })
  },

  /**
   * 获取分类文本
   */
  getCategoryText(category) {
    const map = {
      'system': '系统',
      'dorm': '宿舍',
      'maintenance': '维修',
      'other': '其他',
      'urgent': '紧急',
      'activity': '活动',
      'general': '一般'
    }
    return map[category] || category
  },

  /**
   * 筛选分类
   */
  filterCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ 
      selectedCategory: category,
      page: 1,
      hasMore: true
    })
    this.loadNotices(true)
  },

  /**
   * 查看公告详情
   */
  goToDetail(e) {
    const noticeId = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    // 标记为已读（本地状态）
    const notices = this.data.notices
    if (notices[index] && !notices[index].isRead) {
      notices[index].isRead = true
      this.setData({ notices })
      
      // 调用API标记已读
      this.markAsRead(noticeId)
    }
    
    wx.navigateTo({
      url: `/pages/notices/detail/index?id=${noticeId}`
    })
  },

  /**
   * 标记公告已读
   */
  markAsRead(noticeId) {
    markNoticeRead(noticeId).catch(err => {
      console.error('标记已读失败:', err)
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ isRefreshing: true })
    this.loadNotices(true)
  },

  /**
   * 上拉加载更多
   */
  onLoadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return
    
    this.setData({ page: this.data.page + 1 })
    this.loadNotices()
  },

  /**
   * 刷新公告列表
   */
  refreshNotices() {
    this.setData({ page: 1, hasMore: true })
    this.loadNotices(true)
  },

  /**
   * 发布通知（管理员）
   */
  goToPublish() {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/notices/publish/index'
    })
  },

  /**
   * 长按编辑（管理员）
   */
  onLongPress(e) {
    if (!this.data.isAdmin) return
    
    const noticeId = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    const notice = this.data.notices[index]
    
    const itemList = ['编辑', '删除']
    if (notice.isPinned) {
      itemList.push('取消置顶')
    } else {
      itemList.push('置顶')
    }
    itemList.push('查看阅读统计')
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 编辑
            this.editNotice(noticeId)
            break
          case 1: // 删除
            this.deleteNotice(noticeId)
            break
          case 2: // 置顶/取消置顶
            this.togglePin(noticeId, !notice.isPinned)
            break
          case 3: // 阅读统计
            this.viewReadStats(noticeId)
            break
        }
      }
    })
  },

  /**
   * 编辑通知
   */
  editNotice(noticeId) {
    wx.navigateTo({
      url: `/pages/notices/publish/index?id=${noticeId}&mode=edit`
    })
  },

  /**
   * 删除通知
   */
  deleteNotice(noticeId) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const { deleteNotice } = require('../../../api/notices')
          deleteNotice(noticeId).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.refreshNotices()
          }).catch(err => {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  /**
   * 置顶/取消置顶
   */
  togglePin(noticeId, isPinned) {
    const { updateNotice } = require('../../../api/notices')
    updateNotice(noticeId, { isPinned }).then(() => {
      wx.showToast({
        title: isPinned ? '置顶成功' : '已取消置顶',
        icon: 'success'
      })
      this.refreshNotices()
    }).catch(err => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  /**
   * 查看阅读统计
   */
  viewReadStats(noticeId) {
    wx.navigateTo({
      url: `/pages/notices/stats/index?id=${noticeId}`
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '宿舍公告',
      path: '/pages/notices/list/index'
    }
  }
})
