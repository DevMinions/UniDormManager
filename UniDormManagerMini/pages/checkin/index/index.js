const app = getApp()

Page({
  data: {
    loading: false,
    studentName: '',
    studentId: '',
    phone: '',
    selectedBuilding: '',
    selectedRoom: '',
    buildings: ['A栋', 'B栋', 'C栋'],
    rooms: [],
    availableRooms: {
      'A栋': ['101', '102', '103', '104'],
      'B栋': ['201', '202', '203'],
      'C栋': ['301', '302']
    }
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
  },

  /**
   * 输入学生姓名
   */
  onNameInput(e) {
    this.setData({
      studentName: e.detail.value
    })
  },

  /**
   * 输入学号
   */
  onStudentIdInput(e) {
    this.setData({
      studentId: e.detail.value
    })
  },

  /**
   * 输入电话
   */
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    })
  },

  /**
   * 选择楼栋
   */
  onBuildingChange(e) {
    const index = e.detail.value
    const building = this.data.buildings[index]
    const rooms = this.data.availableRooms[building] || []
    
    this.setData({
      selectedBuilding: building,
      rooms: rooms,
      selectedRoom: ''
    })
  },

  /**
   * 选择房间
   */
  onRoomChange(e) {
    const index = e.detail.value
    this.setData({
      selectedRoom: this.data.rooms[index]
    })
  },

  /**
   * 提交入住申请
   */
  submitCheckIn() {
    const { studentName, studentId, phone, selectedBuilding, selectedRoom } = this.data

    // 表单验证
    if (!studentName.trim()) {
      wx.showToast({ title: '请输入学生姓名', icon: 'none' })
      return
    }
    if (!studentId.trim()) {
      wx.showToast({ title: '请输入学号', icon: 'none' })
      return
    }
    if (!selectedBuilding) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' })
      return
    }
    if (!selectedRoom) {
      wx.showToast({ title: '请选择房间', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    // TODO: 接入实际API
    setTimeout(() => {
      this.setData({ loading: false })
      wx.showModal({
        title: '确认办理入住',
        content: `学生：${studentName}\n学号：${studentId}\n房间：${selectedBuilding} ${selectedRoom}`,
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '入住办理成功',
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
