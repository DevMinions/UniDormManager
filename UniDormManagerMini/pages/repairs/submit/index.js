// pages/repairs/submit/index.js
const app = getApp()
const { createRepair } = require('../../../api/repairs')

Page({
  data: {
    title: '',
    description: '',
    roomNumber: '',
    priority: 'medium',
    priorityOptions: [
      { value: 'low', label: '低' },
      { value: 'medium', label: '中' },
      { value: 'high', label: '高' }
    ],
    images: [],
    submitting: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }
  },

  /**
   * 输入标题
   */
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  /**
   * 输入描述
   */
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value })
  },

  /**
   * 输入房间号
   */
  onRoomNumberInput(e) {
    this.setData({ roomNumber: e.detail.value })
  },

  /**
   * 选择优先级
   */
  onPriorityChange(e) {
    const index = e.detail.value
    this.setData({ priority: this.data.priorityOptions[index].value })
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const images = this.data.images.concat(res.tempFilePaths)
        if (images.length > 3) {
          images.splice(3)
          wx.showToast({
            title: '最多上传3张图片',
            icon: 'none'
          })
        }
        this.setData({ images })
      }
    })
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: this.data.images
    })
  },

  /**
   * 表单验证
   */
  validate() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入报修标题',
        icon: 'none'
      })
      return false
    }

    if (!this.data.description.trim()) {
      wx.showToast({
        title: '请输入报修描述',
        icon: 'none'
      })
      return false
    }

    if (!this.data.roomNumber.trim()) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      })
      return false
    }

    return true
  },

  /**
   * 提交报修
   */
  submitRepair() {
    if (!this.validate()) return

    if (this.data.submitting) return

    this.setData({ submitting: true })

    const data = {
      title: this.data.title,
      description: this.data.description,
      roomNumber: this.data.roomNumber,
      priority: this.data.priority
    }

    createRepair(data).then(res => {
      console.log('报修提交成功:', res)
      wx.showToast({
        title: '报修提交成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    }).catch(err => {
      console.error('报修提交失败:', err)
      this.setData({ submitting: false })
    })
  }
})
