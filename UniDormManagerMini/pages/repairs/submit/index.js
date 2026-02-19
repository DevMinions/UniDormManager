// pages/repairs/submit/index.js
const app = getApp()
const { createRepair } = require('../../../api/repairs')

Page({
  data: {
    title: '',
    roomNumber: '',
    repairType: '',
    priority: 'medium',
    description: '',
    selectedTypeLabel: '请选择报修类型',
    images: [],
    submitting: false,
    errors: {},

    // 房间选项
    roomOptions: [
      'A101', 'A102', 'A103', 'A201', 'A202', 'A203', 'A301', 'A302', 'A303',
      'B101', 'B102', 'B103', 'B201', 'B202', 'B203', 'B301', 'B302', 'B303',
      'C101', 'C102', 'C103', 'C201', 'C202', 'C203', 'C301', 'C302', 'C303'
    ],

    // 报修类型选项
    repairTypes: [
      { value: 'water', label: '水电故障' },
      { value: 'appliance', label: '家电故障' },
      { value: 'furniture', label: '家具损坏' },
      { value: 'network', label: '网络问题' },
      { value: 'other', label: '其他' }
    ],

    // 优先级选项
    priorityOptions: [
      { value: 'low', label: '低', desc: '一般问题' },
      { value: 'medium', label: '中', desc: '需要处理' },
      { value: 'high', label: '高', desc: '紧急处理' }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }

    // 设置默认优先级为"中"
    this.setData({ priority: 'medium' })
  },

  /**
   * 输入标题
   */
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
    // 清除错误
    if (this.data.errors.title) {
      this.setData({ 'errors.title': '' })
    }
  },

  /**
   * 选择房间号
   */
  onRoomChange(e) {
    const index = e.detail.value
    const roomNumber = this.data.roomOptions[index]
    this.setData({
      roomNumber: roomNumber
    })
    // 清除错误
    if (this.data.errors.roomNumber) {
      this.setData({ 'errors.roomNumber': '' })
    }
  },

  /**
   * 选择报修类型
   */
  onTypeChange(e) {
    const index = e.detail.value
    const type = this.data.repairTypes[index]
    this.setData({
      repairType: type.value,
      selectedTypeLabel: type.label
    })
    // 清除错误
    if (this.data.errors.repairType) {
      this.setData({ 'errors.repairType': '' })
    }
  },

  /**
   * 选择优先级 - 卡片式单选
   */
  onPrioritySelect(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ priority: value })
  },

  /**
   * 输入描述
   */
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value })
    // 清除错误
    if (this.data.errors.description) {
      this.setData({ 'errors.description': '' })
    }
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const remainingSlots = 3 - this.data.images.length
    if (remainingSlots <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: remainingSlots,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const images = this.data.images.concat(res.tempFilePaths)
        this.setData({ images })
        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1000
        })
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
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
   * 字段失焦验证
   */
  validateField(e) {
    const field = e.currentTarget.dataset.field
    const value = this.data[field]
    const errors = { ...this.data.errors }

    if (field === 'title' && !value.trim()) {
      errors.title = '请输入报修标题'
    } else if (field === 'description' && !value.trim()) {
      errors.description = '请输入报修描述'
    }

    this.setData({ errors })
  },

  /**
   * 表单验证
   */
  validate() {
    const { title, roomNumber, repairType, description } = this.data
    const errors = {}

    if (!title.trim()) {
      errors.title = '请输入报修标题'
    }

    if (!roomNumber.trim()) {
      errors.roomNumber = '请选择房间号'
    }

    if (!repairType) {
      errors.repairType = '请选择报修类型'
    }

    if (!description.trim()) {
      errors.description = '请输入报修描述'
    }

    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  /**
   * 提交报修
   */
  submitRepair() {
    if (!this.validate()) {
      // 滚动到第一个错误项
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (this.data.submitting) return

    this.setData({ submitting: true })

    const data = {
      title: this.data.title,
      description: this.data.description,
      roomNumber: this.data.roomNumber,
      type: this.data.repairType,
      priority: this.data.priority,
      images: this.data.images
    }

    createRepair(data).then(res => {
      console.log('报修提交成功:', res)
      wx.showToast({
        title: '报修提交成功',
        icon: 'success',
        duration: 2000
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('报修提交失败:', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: '报修提交失败，请重试',
        icon: 'none',
        duration: 2000
      })
    })
  }
})
