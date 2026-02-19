// pages/notices/stats/index.js
const app = getApp()
const { getNoticeDetail, getNoticeReadRecords } = require('../../../api/notices')

Page({
  data: {
    noticeId: '',
    notice: null,
    loading: true,
    
    // 统计数据
    stats: {
      total: 0,
      read: 0,
      unread: 0,
      readRate: 0
    },
    
    // 阅读记录列表
    records: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false
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
      this.setData({ noticeId: options.id })
      this.loadNoticeDetail()
      this.loadReadRecords()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 加载公告详情
   */
  loadNoticeDetail() {
    getNoticeDetail(this.data.noticeId).then(data => {
      this.setData({
        notice: data
      })
    }).catch(err => {
      console.error('加载公告详情失败:', err)
    })
  },

  /**
   * 加载阅读记录
   */
  loadReadRecords(reset = false) {
    const page = reset ? 1 : this.data.page
    
    this.setData({
      loading: reset,
      loadingMore: !reset && this.data.records.length > 0,
      page: page
    })

    getNoticeReadRecords(this.data.noticeId, {
      page,
      pageSize: this.data.pageSize
    }).then(data => {
      console.log('阅读记录:', data)
      
      const records = data.records || data.list || []
      const stats = {
        total: data.total || 0,
        read: data.readCount || 0,
        unread: data.unreadCount || 0
      }
      stats.readRate = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0

      // 处理记录数据
      const processedRecords = records.map(record => ({
        ...record,
        userName: record.userName || record.user_name || record.name || record.nickname,
        userAvatar: record.userAvatar || record.user_avatar || record.avatar,
        roomInfo: record.roomInfo || record.room_info || record.room,
        readTime: record.readTime || record.read_time || record.createdAt || record.created_at
      }))

      this.setData({
        stats: stats,
        records: reset ? processedRecords : [...this.data.records, ...processedRecords],
        loading: false,
        loadingMore: false,
        hasMore: records.length >= this.data.pageSize
      })
    }).catch(err => {
      console.error('加载阅读记录失败:', err)
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
   * 格式化时间
   */
  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    
    return date.toLocaleDateString()
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { notice } = this.data
    return {
      title: `《${notice?.title}》阅读统计`,
      path: `/pages/notices/stats/index?id=${this.data.noticeId}`
    }
  }
})
