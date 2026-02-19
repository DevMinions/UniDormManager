// pages/admin/users/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    isAdmin: false,
    
    // 用户列表
    userList: [],
    total: 0,
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    
    // 搜索和筛选
    keyword: '',
    selectedRole: 'all',
    selectedStatus: 'all',
    
    // 角色选项
    roleOptions: [
      { value: 'all', label: '全部角色' },
      { value: 'student', label: '学生' },
      { value: 'dorm_manager', label: '宿管员' },
      { value: 'maintenance', label: '维修工' },
      { value: 'building_admin', label: '楼栋管理员' },
      { value: 'logistics_admin', label: '后勤管理员' },
      { value: 'system_admin', label: '系统管理员' }
    ],
    
    // 状态选项
    statusOptions: [
      { value: 'all', label: '全部状态' },
      { value: 'active', label: '启用' },
      { value: 'disabled', label: '禁用' }
    ],
    
    // 模态框
    showUserModal: false,
    showPasswordModal: false,
    currentUser: null,
    isEditing: false,
    
    // 表单数据
    formData: {
      username: '',
      realName: '',
      studentId: '',
      email: '',
      phone: '',
      role: 'student',
      status: 'active'
    },
    
    // 重置密码
    newPassword: '',
    confirmPassword: ''
  },

  onLoad() {
    this.checkAdminPermission()
    this.loadUserList()
  },

  onShow() {
    if (app.globalData.isLoggedIn && this.data.isAdmin) {
      this.loadUserList()
    }
  },

  /**
   * 检查管理员权限
   */
  checkAdminPermission() {
    const userLevel = app.globalData.userLevel || 1
    const isAdmin = userLevel >= 4  // 楼栋管理员及以上

    this.setData({ isAdmin })

    if (!isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 加载用户列表
   */
  loadUserList(refresh = true) {
    if (!this.data.isAdmin) return

    if (refresh) {
      this.setData({ page: 1, hasMore: true, loading: true })
    }

    // 模拟数据
    setTimeout(() => {
      const mockUsers = this.generateMockUsers()
      
      // 筛选
      let filteredUsers = mockUsers
      
      // 按角色筛选
      if (this.data.selectedRole !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.role === this.data.selectedRole)
      }
      
      // 按状态筛选
      if (this.data.selectedStatus !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.status === this.data.selectedStatus)
      }
      
      // 按关键词搜索
      if (this.data.keyword) {
        const keyword = this.data.keyword.toLowerCase()
        filteredUsers = filteredUsers.filter(u => 
          (u.realName && u.realName.toLowerCase().includes(keyword)) ||
          (u.studentId && u.studentId.toLowerCase().includes(keyword)) ||
          (u.username && u.username.toLowerCase().includes(keyword))
        )
      }

      const total = filteredUsers.length
      const start = (this.data.page - 1) * this.data.pageSize
      const end = start + this.data.pageSize
      const paginatedUsers = filteredUsers.slice(start, end)

      this.setData({
        userList: refresh ? paginatedUsers : [...this.data.userList, ...paginatedUsers],
        total,
        hasMore: end < total,
        loading: false
      })
    }, 600)
  },

  /**
   * 生成模拟用户数据
   */
  generateMockUsers() {
    const roles = ['student', 'dorm_manager', 'maintenance', 'building_admin', 'logistics_admin', 'system_admin']
    const roleNames = {
      student: '学生',
      dorm_manager: '宿管员',
      maintenance: '维修工',
      building_admin: '楼栋管理员',
      logistics_admin: '后勤管理员',
      system_admin: '系统管理员'
    }
    
    const users = []
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二',
                   '陈明', '林晓', '黄强', '杨洋', '刘芳', '黄磊', '吴刚', '马超', '罗翔', '林俊杰']
    
    for (let i = 1; i <= 35; i++) {
      const role = roles[Math.floor(Math.random() * (roles.length - 2)) + 1] // 优先普通角色
      users.push({
        id: i,
        username: `user${String(i).padStart(3, '0')}`,
        realName: names[i % names.length] + (i > 20 ? i : ''),
        studentId: role === 'student' ? `2021${String(i).padStart(4, '0')}` : '',
        email: `user${i}@example.com`,
        phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        role,
        roleName: roleNames[role],
        status: Math.random() > 0.1 ? 'active' : 'disabled',
        createdAt: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
        lastLoginAt: `2024-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
      })
    }
    
    return users
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadUserList(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 }, () => {
      this.loadUserList(false)
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadUserList(true)
    }, 500)
  },

  /**
   * 筛选角色
   */
  filterRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({ selectedRole: role }, () => {
      this.loadUserList(true)
    })
  },

  /**
   * 筛选状态
   */
  filterStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ selectedStatus: status }, () => {
      this.loadUserList(true)
    })
  },

  /**
   * 打开添加用户弹窗
   */
  openAddModal() {
    this.setData({
      showUserModal: true,
      isEditing: false,
      formData: {
        username: '',
        realName: '',
        studentId: '',
        email: '',
        phone: '',
        role: 'student',
        status: 'active'
      }
    })
  },

  /**
   * 打开编辑用户弹窗
   */
  openEditModal(e) {
    const user = e.currentTarget.dataset.user
    this.setData({
      showUserModal: true,
      isEditing: true,
      currentUser: user,
      formData: {
        username: user.username,
        realName: user.realName,
        studentId: user.studentId,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    })
  },

  /**
   * 关闭用户弹窗
   */
  closeUserModal() {
    this.setData({ showUserModal: false })
  },

  /**
   * 表单输入
   */
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 选择角色
   */
  onRoleChange(e) {
    const role = this.data.roleOptions[e.detail.value].value
    this.setData({ 'formData.role': role })
  },

  /**
   * 选择状态
   */
  onStatusChange(e) {
    const status = this.data.statusOptions[e.detail.value].value
    this.setData({ 'formData.status': status })
  },

  /**
   * 保存用户
   */
  saveUser() {
    const { formData, isEditing } = this.data
    
    // 表单验证
    if (!formData.username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!formData.realName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 模拟保存
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: isEditing ? '修改成功' : '添加成功',
        icon: 'success'
      })
      this.closeUserModal()
      this.loadUserList(true)
    }, 800)
  },

  /**
   * 切换用户状态
   */
  toggleUserStatus(e) {
    const user = e.currentTarget.dataset.user
    const newStatus = user.status === 'active' ? 'disabled' : 'active'
    const actionText = newStatus === 'active' ? '启用' : '禁用'

    wx.showModal({
      title: `确认${actionText}`,
      content: `确定要${actionText}用户 "${user.realName}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          // 模拟操作
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: `${actionText}成功`,
              icon: 'success'
            })
            this.loadUserList(true)
          }, 600)
        }
      }
    })
  },

  /**
   * 打开重置密码弹窗
   */
  openPasswordModal(e) {
    const user = e.currentTarget.dataset.user
    this.setData({
      showPasswordModal: true,
      currentUser: user,
      newPassword: '',
      confirmPassword: ''
    })
  },

  /**
   * 关闭密码弹窗
   */
  closePasswordModal() {
    this.setData({ showPasswordModal: false })
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },

  /**
   * 重置密码
   */
  resetPassword() {
    const { newPassword, confirmPassword } = this.data
    
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    wx.showLoading({ title: '重置中...' })
    
    // 模拟重置
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '密码重置成功',
        icon: 'success'
      })
      this.closePasswordModal()
    }, 600)
  }
})
