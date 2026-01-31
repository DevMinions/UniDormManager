// pages/notices/detail/index.js
const app = getApp()
const { getNoticeDetail } = require('../../../api/notices')

Page({
  data: {
    noticeId: '',
    notice: null,
    loading: true
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
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      wx.navigateBack()
    }
  },

  /**
   * 加载公告详情
   */
  loadNoticeDetail() {
    this.setData({ loading: true })

    getNoticeDetail(this.data.noticeId).then(data => {
      console.log('公告详情:', data)
      this.setData({
        notice: data,
        loading: false
      })
    }).catch(err => {
      console.error('加载公告详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 分享公告
   */
  onShareAppMessage() {
    return {
      title: this.data.notice.title,
      path: `/pages/notices/detail/index?id=${this.data.noticeId}`
    }
  }
})
