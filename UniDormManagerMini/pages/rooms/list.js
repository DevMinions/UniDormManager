// pages/rooms/list.js
const app = getApp()
const { getRooms } = require('../../api/rooms')

Page({
  data: {
    rooms: [],
    loading: false,
    keyword: '',
    selectedBuilding: '',
    selectedFloor: '',
    selectedStatus: '',
    buildings: [
      { id: '', name: '全部楼栋' },
      { id: 'A', name: 'A栋' },
      { id: 'B', name: 'B栋' },
      { id: 'C', name: 'C栋' },
      { id: 'D', name: 'D栋' }
    ],
    floors: [
      { id: '', name: '全部楼层' },
      { id: '1', name: '1层' },
      { id: '2', name: '2层' },
      { id: '3', name: '3层' },
      { id: '4', name: '4层' },
      { id: '5', name: '5层' },
      { id: '6', name: '6层' }
    ],
    statusList: [
      { id: '', name: '全部状态' },
      { id: 'free', name: '空闲' },
      { id: 'occupied', name: '已入住' },
      { id: 'full', name: '已满' }
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.loadRooms()
  },

  onShow() {
    // 每次显示页面时重新加载数据
    if (app.globalData.isLoggedIn) {
      this.loadRooms()
    }
    
    // 设置 TabBar 选中状态（房间是第2个，index=1）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  /**
   * 加载房间列表
   */
  loadRooms() {
    this.setData({ loading: true })

    const params = {}
    if (this.data.keyword) {
      params.keyword = this.data.keyword
    }
    if (this.data.selectedBuilding) {
      params.building = this.data.selectedBuilding
    }
    if (this.data.selectedFloor) {
      params.floor = this.data.selectedFloor
    }
    if (this.data.selectedStatus) {
      params.status = this.data.selectedStatus
    }

    getRooms(params).then(data => {
      console.log('房间列表:', data)
      // 处理数据，添加入住率等信息
      const rooms = this.processRoomData(data.rooms || data || [])
      this.setData({
        rooms: rooms,
        loading: false
      })
    }).catch(err => {
      console.error('加载房间列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  /**
   * 处理房间数据，添加计算字段
   */
  processRoomData(rooms) {
    return rooms.map(room => {
      const occupied = room.occupied || room.current_occupancy || 0
      const capacity = room.capacity || 4
      const occupancyRate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
      
      // 确定房间状态
      let status = room.status || 'free'
      if (status === 'occupied' && occupied >= capacity) {
        status = 'full'
      }
      
      // 确定房间类型标签
      let typeLabel = room.type || 'mixed'
      let typeText = '混'
      let typeClass = 'type-mixed'
      
      if (typeLabel === 'male') {
        typeText = '男'
        typeClass = 'type-male'
      } else if (typeLabel === 'female') {
        typeText = '女'
        typeClass = 'type-female'
      }

      return {
        ...room,
        occupied,
        capacity,
        occupancyRate,
        status,
        typeText,
        typeClass,
        floor: room.floor || this.extractFloorFromRoomNumber(room.roomNumber || room.room_number)
      }
    })
  },

  /**
   * 从房间号提取楼层
   */
  extractFloorFromRoomNumber(roomNumber) {
    if (!roomNumber) return ''
    const match = roomNumber.match(/\d+/)
    if (match) {
      const num = parseInt(match[0])
      return Math.floor(num / 100).toString()
    }
    return ''
  },

  /**
   * 搜索房间
   */
  handleSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.loadRooms()
  },

  /**
   * 选择楼栋
   */
  selectBuilding(e) {
    const building = e.currentTarget.dataset.value
    this.setData({ selectedBuilding: building })
    this.loadRooms()
  },

  /**
   * 选择楼层
   */
  selectFloor(e) {
    const floor = e.currentTarget.dataset.value
    this.setData({ selectedFloor: floor })
    this.loadRooms()
  },

  /**
   * 选择状态
   */
  selectStatus(e) {
    const status = e.currentTarget.dataset.value
    this.setData({ selectedStatus: status })
    this.loadRooms()
  },

  /**
   * 重置筛选条件
   */
  resetFilters() {
    this.setData({
      keyword: '',
      selectedBuilding: '',
      selectedFloor: '',
      selectedStatus: ''
    })
    this.loadRooms()
  },

  /**
   * 判断是否有活跃筛选条件
   */
  hasActiveFilters() {
    return this.data.keyword || this.data.selectedBuilding || 
           this.data.selectedFloor || this.data.selectedStatus
  },

  /**
   * 查看房间详情
   */
  goToDetail(e) {
    const roomId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/rooms/detail/index?id=${roomId}`
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRooms()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
