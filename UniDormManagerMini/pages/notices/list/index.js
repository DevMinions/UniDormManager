// pages/notices/list/index.js
const app = getApp()
const { getNotices, markNoticeRead } = require('../../../api/notices')

Page({
  data: {
    notices: [],
    loading: false,
    loadingMore: false,
    selectedCategory: 'all',
    page: 1,
    pageSize: 10,
    hasMore: true,
    total: 0
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
      // 检查是否需要刷新（从详情页返回可能已读）
      const needRefresh = wx.getStorageSync('notices_need_refresh')
      if (needRefresh) {
        wx.removeStorageSync('notices_need_refresh')
        this.refreshNotices()
      }
    }
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
      
      // 处理公告数据，添加已读状态
      const processedNotices = notices.map(notice => ({
        ...notice,
        isRead: notice.isRead || notice.is_read || false,
        isPinned: notice.isPinned || notice.is_pinned || false,
        categoryText: this.getCategoryText(notice.category)
      }))

      // 置顶公告排序（置顶在前）
      const sortedNotices = this.sortNotices(reset ? processedNotices : [...this.data.notices, ...processedNotices])

      this.setData({
        notices: reset ? sortedNotices : sortedNotices,
        loading: false,
        loadingMore: false,
        hasMore: notices.length >= this.data.pageSize,
        total: total
      })
    }).catch(err => {
      console.error('加载公告列表失败:', err)
      this.setData({ 
        loading: false,
        loadingMore: false
      })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
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
      'urgent': '紧急',
      'maintenance': '维修',
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
    this.setData({ page: 1, hasMore: true })
    this.loadNotices(true).then(() => {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      })
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
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
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '宿舍公告',
      path: '/pages/notices/list/index'
    }
  }
})
