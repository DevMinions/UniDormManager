const app = getApp()

Page({
  data: {
    loading: true,
    inspectionList: [],
    currentDate: ''
  },

  onLoad() {
    this.setCurrentDate()
    this.loadInspections()
  },

  onShow() {
    this.loadInspections()
  },

  /**
   * 设置当前日期
   */
  setCurrentDate() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    this.setData({
      currentDate: `${year}-${month}-${day}`
    })
  },

  /**
   * 加载查寝记录
   */
  loadInspections() {
    this.setData({ loading: true })
    
    // TODO: 接入实际API
    // 模拟数据
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          buildingName: 'A栋',
          roomNumber: '101',
          status: 'normal', // normal, abnormal
          checkTime: '2025-02-19 21:30',
          inspector: '张宿管',
          notes: '一切正常'
        },
        {
          id: 2,
          buildingName: 'A栋',
          roomNumber: '102',
          status: 'abnormal',
          checkTime: '2025-02-19 21:35',
          inspector: '张宿管',
          notes: '有违规电器'
        }
      ]
      
      this.setData({
        inspectionList: mockData,
        loading: false
      })
    }, 500)
  },

  /**
   * 新增查寝记录
   */
  addInspection() {
    wx.showToast({
      title: '新增查寝功能开发中',
      icon: 'none'
    })
  },

  /**
   * 查看详情
   */
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: `查看记录 ${id}`,
      icon: 'none'
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadInspections()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
