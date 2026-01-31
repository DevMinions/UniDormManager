// pages/repairs/detail/index.js
const app = getApp()
const { getRepairDetail, updateRepair } = require('../../../api/repairs')

Page({
  data: {
    repairId: '',
    repair: null,
    loading: true,
    isAdmin: false,
    notes: ''
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
      this.setData({ repairId: options.id })
      this.loadRepairDetail()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      wx.navigateBack()
    }

    this.setData({
      isAdmin: app.globalData.userRole === 'admin'
    })
  },

  /**
   * 加载报修详情
   */
  loadRepairDetail() {
    this.setData({ loading: true })

    getRepairDetail(this.data.repairId).then(data => {
      console.log('报修详情:', data)
      this.setData({
        repair: data,
        loading: false
      })
    }).catch(err => {
      console.error('加载报修详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 输入备注
   */
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  /**
   * 更新报修状态
   */
  updateRepairStatus(status) {
    const data = {
      status: status
    }

    if (this.data.notes.trim()) {
      data.notes = this.data.notes
    }

    updateRepair(this.data.repairId, data).then(res => {
      console.log('更新成功:', res)
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })
      this.loadRepairDetail()
    }).catch(err => {
      console.error('更新失败:', err)
    })
  },

  /**
   * 标记为处理中
   */
  markInProgress() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将报修标记为处理中吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('in_progress')
        }
      }
    })
  },

  /**
   * 标记为已完成
   */
  markCompleted() {
    wx.showModal({
      title: '确认操作',
      content: '确定要将报修标记为已完成吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('completed')
        }
      }
    })
  },

  /**
   * 关闭报修
   */
  closeRepair() {
    wx.showModal({
      title: '确认操作',
      content: '确定要关闭此报修吗？',
      success: (res) => {
        if (res.confirm) {
          this.updateRepairStatus('closed')
        }
      }
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    const images = this.data.repair.images || []
    wx.previewImage({
      current: url,
      urls: images
    })
  }
})
