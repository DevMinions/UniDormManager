// pages/notices/publish/index.js
const app = getApp()
const { createNotice, updateNotice, getNoticeDetail } = require('../../../api/notices')

Page({
  data: {
    mode: 'create', // create 或 edit
    noticeId: '',
    
    // 表单数据
    title: '',
    category: 'system',
    content: '',
    isPinned: false,
    targetUsers: 'all', // all, student, manager, worker
    attachments: [],
    
    // 界面状态
    loading: false,
    submitting: false,
    
    // 分类选项
    categories: [
      { key: 'system', label: '系统通知', icon: '⚙️' },
      { key: 'dorm', label: '宿舍通知', icon: '🏠' },
      { key: 'maintenance', label: '维修通知', icon: '🔧' },
      { key: 'other', label: '其他通知', icon: '📢' }
    ],
    
    // 接收对象选项
    targetOptions: [
      { key: 'all', label: '全部用户', desc: '所有用户可见' },
      { key: 'student', label: '学生', desc: '仅学生可见' },
      { key: 'manager', label: '宿管员', desc: '仅宿管员可见' },
      { key: 'worker', label: '维修工', desc: '仅维修工可见' }
    ]
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 编辑模式
    if (options.id && options.mode === 'edit') {
      this.setData({ 
        mode: 'edit',
        noticeId: options.id
      })
      this.loadNoticeDetail()
    }
  },

  /**
   * 加载通知详情（编辑模式）
   */
  loadNoticeDetail() {
    this.setData({ loading: true })

    getNoticeDetail(this.data.noticeId).then(data => {
      this.setData({
        title: data.title || '',
        category: data.category || 'system',
        content: data.content || '',
        isPinned: data.isPinned || data.is_pinned || false,
        targetUsers: data.targetUsers || 'all',
        attachments: data.attachments || [],
        loading: false
      })
    }).catch(err => {
      console.error('加载通知详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    })
  },

  /**
   * 输入标题
   */
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  /**
   * 输入内容
   */
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  /**
   * 选择分类
   */
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ category })
  },

  /**
   * 选择分类（picker备选）
   */
  onCategoryChange(e) {
    const index = parseInt(e.detail.value)
    const category = this.data.categories[index].key
    this.setData({ category })
  },

  /**
   * 切换置顶
   */
  onPinnedChange(e) {
    this.setData({ isPinned: e.detail.value })
  },

  /**
   * 选择接收对象
   */
  selectTarget(e) {
    const targetUsers = e.currentTarget.dataset.target
    this.setData({ targetUsers })
  },

  /**
   * 选择接收对象（picker备选）
   */
  onTargetChange(e) {
    const index = parseInt(e.detail.value)
    const targetUsers = this.data.targetOptions[index].key
    this.setData({ targetUsers })
  },

  /**
   * 上传附件
   */
  chooseAttachment() {
    const maxFiles = 5 - this.data.attachments.length
    
    if (maxFiles <= 0) {
      wx.showToast({
        title: '最多上传5个附件',
        icon: 'none'
      })
      return
    }

    wx.chooseMessageFile({
      count: maxFiles,
      type: 'file',
      success: (res) => {
        const files = res.tempFiles
        this.uploadFiles(files)
      }
    })
  },

  /**
   * 上传文件
   */
  uploadFiles(files) {
    wx.showLoading({ title: '上传中...' })

    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/api/upload',
          filePath: file.path,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              if (data.code === 0) {
                resolve({
                  id: data.data.id,
                  name: data.data.name || file.name,
                  url: data.data.url,
                  size: file.size
                })
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } catch (err) {
              reject(err)
            }
          },
          fail: reject
        })
      })
    })

    Promise.all(uploadPromises).then(results => {
      wx.hideLoading()
      this.setData({
        attachments: [...this.data.attachments, ...results]
      })
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('上传文件失败:', err)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    })
  },

  /**
   * 删除附件
   */
  deleteAttachment(e) {
    const index = e.currentTarget.dataset.index
    const attachments = [...this.data.attachments]
    attachments.splice(index, 1)
    this.setData({ attachments })
  },

  /**
   * 插入快捷标签
   */
  insertTag(e) {
    const tag = e.currentTarget.dataset.tag
    const content = this.data.content
    this.setData({
      content: content + tag
    })
  },

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  },

  /**
   * 表单验证
   */
  validateForm() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入通知标题',
        icon: 'none'
      })
      return false
    }

    if (this.data.title.length > 100) {
      wx.showToast({
        title: '标题不能超过100字',
        icon: 'none'
      })
      return false
    }

    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入通知内容',
        icon: 'none'
      })
      return false
    }

    return true
  },

  /**
   * 提交
   */
  submit() {
    if (!this.validateForm()) return

    this.setData({ submitting: true })

    const data = {
      title: this.data.title.trim(),
      category: this.data.category,
      content: this.data.content.trim(),
      isPinned: this.data.isPinned,
      targetUsers: this.data.targetUsers,
      attachments: this.data.attachments
    }

    const request = this.data.mode === 'edit'
      ? updateNotice(this.data.noticeId, data)
      : createNotice(data)

    request.then(() => {
      wx.hideLoading()
      wx.showToast({
        title: this.data.mode === 'edit' ? '更新成功' : '发布成功',
        icon: 'success'
      })
      
      // 设置需要刷新列表的标记
      wx.setStorageSync('notices_need_refresh', true)
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('提交失败:', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      })
    })
  },

  /**
   * 保存草稿
   */
  saveDraft() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '至少输入标题',
        icon: 'none'
      })
      return
    }

    const draft = {
      title: this.data.title,
      category: this.data.category,
      content: this.data.content,
      isPinned: this.data.isPinned,
      targetUsers: this.data.targetUsers
    }

    wx.setStorageSync('notice_draft', draft)
    wx.showToast({
      title: '草稿已保存',
      icon: 'success'
    })
  },

  /**
   * 加载草稿
   */
  loadDraft() {
    const draft = wx.getStorageSync('notice_draft')
    if (draft && !this.data.title) {
      this.setData({
        title: draft.title || '',
        category: draft.category || 'system',
        content: draft.content || '',
        isPinned: draft.isPinned || false,
        targetUsers: draft.targetUsers || 'all'
      })
    }
  },

  /**
   * 取消
   */
  cancel() {
    if (this.data.title || this.data.content) {
      wx.showModal({
        title: '确认退出',
        content: '当前内容将不会保存，是否继续？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    } else {
      wx.navigateBack()
    }
  }
})
