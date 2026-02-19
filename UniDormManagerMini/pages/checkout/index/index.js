const app = getApp()

Page({
  data: {
    loading: false,
    searchQuery: '',
    studentInfo: null,
    checkoutDate: '',
    checkoutReason: '',
    roomCheckStatus: {
      keyReturned: false,
      itemsComplete: false,
      noDamage: false
    },
    remarks: ''
  },

  onLoad() {
    // 检查权限
    if (app.globalData.userLevel !== 2) {
      wx.showToast({
        title: '无权限访问',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 设置默认退宿日期为今天
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({
      checkoutDate: dateStr
    })
  },

  /**
   * 输入搜索关键词
   */
  onSearchInput(e) {
    this.setData({
      searchQuery: e.detail.value
    })
  },

  /**
   * 搜索学生
   */
  searchStudent() {
    const { searchQuery } = this.data
    if (!searchQuery.trim()) {
      wx.showToast({
        title: '请输入学号或姓名',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    // TODO: 接入实际API
    setTimeout(() => {
      // 模拟搜索结果
      const mockStudent = {
        name: '张三',
        studentId: '2021001',
        phone: '13800138000',
        buildingName: 'A栋',
        roomNumber: '101',
        checkInDate: '2024-09-01'
      }

      this.setData({
        studentInfo: mockStudent,
        loading: false
      })
    }, 500)
  },

  /**
   * 选择退宿日期
   */
  onDateChange(e) {
    this.setData({
      checkoutDate: e.detail.value
    })
  },

  /**
   * 输入退宿原因
   */
  onReasonInput(e) {
    this.setData({
      checkoutReason: e.detail.value
    })
  },

  /**
   * 切换钥匙归还状态
   */
  toggleKeyStatus() {
    this.setData({
      'roomCheckStatus.keyReturned': !this.data.roomCheckStatus.keyReturned
    })
  },

  /**
   * 切换物品清点状态
   */
  toggleItemsStatus() {
    this.setData({
      'roomCheckStatus.itemsComplete': !this.data.roomCheckStatus.itemsComplete
    })
  },

  /**
   * 切换房间损坏状态
   */
  toggleDamageStatus() {
    this.setData({
      'roomCheckStatus.noDamage': !this.data.roomCheckStatus.noDamage
    })
  },

  /**
   * 输入备注
   */
  onRemarksInput(e) {
    this.setData({
      remarks: e.detail.value
    })
  },

  /**
   * 提交退宿申请
   */
  submitCheckOut() {
    const { studentInfo, checkoutDate, checkoutReason, roomCheckStatus } = this.data

    if (!studentInfo) {
      wx.showToast({ title: '请先搜索学生', icon: 'none' })
      return
    }
    if (!checkoutReason.trim()) {
      wx.showToast({ title: '请输入退宿原因', icon: 'none' })
      return
    }
    if (!roomCheckStatus.keyReturned || !roomCheckStatus.itemsComplete || !roomCheckStatus.noDamage) {
      wx.showToast({ title: '请完成房间检查', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    // TODO: 接入实际API
    setTimeout(() => {
      this.setData({ loading: false })
      wx.showModal({
        title: '确认办理退宿',
        content: `学生：${studentInfo.name}\n学号：${studentInfo.studentId}\n房间：${studentInfo.buildingName} ${studentInfo.roomNumber}\n退宿日期：${checkoutDate}`,
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '退宿办理成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        }
      })
    }, 500)
  }
})
