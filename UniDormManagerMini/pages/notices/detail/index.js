// pages/notices/detail/index.js
const app = getApp()
const { getNoticeDetail, markNoticeRead, downloadAttachment } = require('../../../api/notices')

Page({
  data: {
    noticeId: '',
    notice: null,
    loading: true,
    error: false,
    errorMsg: ''
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
        noticeId: options.id,
        loading: true,
        error: false
      })
      this.loadNoticeDetail()
    } else {
      this.setData({
        loading: false,
        error: true,
        errorMsg: '公告ID不能为空'
      })
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
    this.setData({ loading: true, error: false })

    getNoticeDetail(this.data.noticeId).then(data => {
      console.log('公告详情:', data)
      
      // 处理公告数据
      const notice = {
        ...data,
        isRead: true, // 进入详情页标记为已读
        categoryText: this.getCategoryText(data.category)
      }
      
      this.setData({
        notice: notice,
        loading: false
      })

      // 标记为已读
      if (!data.isRead && !data.is_read) {
        this.markAsRead()
      }
    }).catch(err => {
      console.error('加载公告详情失败:', err)
      this.setData({ 
        loading: false,
        error: true,
        errorMsg: err.message || '加载失败，请重试'
      })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
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
   * 标记公告已读
   */
  markAsRead() {
    markNoticeRead(this.data.noticeId).then(() => {
      // 设置需要刷新列表页的标记
      wx.setStorageSync('notices_need_refresh', true)
    }).catch(err => {
      console.error('标记已读失败:', err)
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果返回失败，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  /**
   * 下载附件
   */
  downloadAttachment(e) {
    const { url, name } = e.currentTarget.dataset
    
    if (!url) {
      wx.showToast({
        title: '附件链接无效',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '下载中...'
    })

    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading()
        
        if (res.statusCode === 200) {
          // 保存文件
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              wx.showToast({
                title: '下载成功',
                icon: 'success'
              })
              
              // 打开文件
              wx.openDocument({
                filePath: saveRes.savedFilePath,
                showMenu: true,
                fail: (err) => {
                  console.error('打开文件失败:', err)
                }
              })
            },
            fail: (err) => {
              console.error('保存文件失败:', err)
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载文件失败:', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 分享公告
   */
  onShareAppMessage() {
    const { notice, noticeId } = this.data
    return {
      title: notice?.title || '公告详情',
      path: `/pages/notices/detail/index?id=${noticeId}`
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { notice, noticeId } = this.data
    return {
      title: notice?.title || '公告详情',
      query: `id=${noticeId}`
    }
  }
})
