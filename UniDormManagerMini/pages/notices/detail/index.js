// pages/notices/detail/index.js
const app = getApp()
const { getNoticeDetail, markNoticeRead, getNotices } = require('../../../api/notices')
const { formatDateTime } = require('../../../utils/date')

Page({
  data: {
    noticeId: '',
    notice: null,
    loading: true,
    error: false,
    errorMsg: '',
    prevNotice: null,
    nextNotice: null,
    isAdmin: false,
    showAdminMenu: false
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 检查管理员状态
    this.checkAdminStatus()

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
   * 检查管理员状态
   */
  checkAdminStatus() {
    const userInfo = app.globalData.userInfo || {}
    const isAdmin = userInfo.role === 'admin' || userInfo.isAdmin || userInfo.role === 'manager'
    this.setData({ isAdmin })
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
        isRead: true,
        categoryText: this.getCategoryText(data.category),
        formattedTime: formatDateTime(data.publishedAt || data.published_at || data.createdAt || data.created_at)
      }
      
      this.setData({
        notice: notice,
        loading: false
      })

      // 标记为已读
      if (!data.isRead && !data.is_read) {
        this.markAsRead()
      }

      // 加载相邻公告
      this.loadAdjacentNotices()
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
   * 加载相邻公告（上一篇/下一篇）
   */
  loadAdjacentNotices() {
    getNotices({ page: 1, pageSize: 100 }).then(data => {
      const notices = data.notices || data.list || data || []
      const currentId = this.data.noticeId
      const currentIndex = notices.findIndex(n => String(n.id) === String(currentId))
      
      if (currentIndex > -1) {
        const prevNotice = currentIndex < notices.length - 1 ? notices[currentIndex + 1] : null
        const nextNotice = currentIndex > 0 ? notices[currentIndex - 1] : null
        
        this.setData({
          prevNotice: prevNotice ? { id: prevNotice.id, title: prevNotice.title } : null,
          nextNotice: nextNotice ? { id: nextNotice.id, title: nextNotice.title } : null
        })
      }
    }).catch(err => {
      console.error('加载相邻公告失败:', err)
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
   * 标记公告已读
   */
  markAsRead() {
    markNoticeRead(this.data.noticeId).then(() => {
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
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  /**
   * 上一篇
   */
  goToPrev() {
    if (!this.data.prevNotice) return
    wx.redirectTo({
      url: `/pages/notices/detail/index?id=${this.data.prevNotice.id}`
    })
  },

  /**
   * 下一篇
   */
  goToNext() {
    if (!this.data.nextNotice) return
    wx.redirectTo({
      url: `/pages/notices/detail/index?id=${this.data.nextNotice.id}`
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
          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              wx.showToast({
                title: '下载成功',
                icon: 'success'
              })
              
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
  },

  /**
   * 显示管理员菜单
   */
  showAdminMenu() {
    if (!this.data.isAdmin) return
    
    const { notice } = this.data
    const itemList = ['编辑', '删除']
    if (notice.isPinned || notice.is_pinned) {
      itemList.push('取消置顶')
    } else {
      itemList.push('置顶')
    }
    itemList.push('查看阅读统计')
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editNotice()
            break
          case 1:
            this.deleteNotice()
            break
          case 2:
            this.togglePin()
            break
          case 3:
            this.viewReadStats()
            break
        }
      }
    })
  },

  /**
   * 编辑通知
   */
  editNotice() {
    wx.navigateTo({
      url: `/pages/notices/publish/index?id=${this.data.noticeId}&mode=edit`
    })
  },

  /**
   * 删除通知
   */
  deleteNotice() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const { deleteNotice } = require('../../../api/notices')
          deleteNotice(this.data.noticeId).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            wx.setStorageSync('notices_need_refresh', true)
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
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
  togglePin() {
    const { updateNotice } = require('../../../api/notices')
    const notice = this.data.notice
    const isPinned = !(notice.isPinned || notice.is_pinned)
    
    updateNotice(this.data.noticeId, { isPinned }).then(() => {
      wx.showToast({
        title: isPinned ? '置顶成功' : '已取消置顶',
        icon: 'success'
      })
      this.setData({
        'notice.isPinned': isPinned,
        'notice.is_pinned': isPinned
      })
      wx.setStorageSync('notices_need_refresh', true)
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
  viewReadStats() {
    wx.navigateTo({
      url: `/pages/notices/stats/index?id=${this.data.noticeId}`
    })
  }
})
