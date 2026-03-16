<script setup>
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 用户数据
const users = ref([
  { id: 1, name: '张三', studentId: '2024001', role: 'student', phone: '13800138001', status: 'active', avatar: '' },
  { id: 2, name: '李四', studentId: '2024002', role: 'student', phone: '13800138002', status: 'active', avatar: '' },
  { id: 3, name: '王五', studentId: '2024003', role: 'student', phone: '13800138003', status: 'inactive', avatar: '' },
  { id: 4, name: '赵阿姨', studentId: '', role: 'dorm_manager', phone: '13800138004', status: 'active', avatar: '' },
  { id: 5, name: '刘师傅', studentId: '', role: 'maintenance', phone: '13800138005', status: 'active', avatar: '' },
  { id: 6, name: '管理员', studentId: '', role: 'admin', phone: '13800138006', status: 'active', avatar: '' },
  { id: 7, name: '钱七', studentId: '2024007', role: 'student', phone: '13800138007', status: 'active', avatar: '' },
  { id: 8, name: '孙八', studentId: '2024008', role: 'student', phone: '13800138008', status: 'active', avatar: '' },
  { id: 9, name: '周九', studentId: '2024009', role: 'student', phone: '13800138009', status: 'inactive', avatar: '' },
  { id: 10, name: '吴十', studentId: '2024010', role: 'student', phone: '13800138010', status: 'active', avatar: '' }
])

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的角色筛选
const selectedRole = ref('all')

// 角色选项
const roleOptions = [
  { value: 'all', label: '全部角色', icon: '👥' },
  { value: 'student', label: '学生', icon: '🎓' },
  { value: 'dorm_manager', label: '宿管', icon: '🏠' },
  { value: 'maintenance', label: '维修', icon: '🔧' },
  { value: 'admin', label: '管理员', icon: '⚡' }
]

// 角色映射
const roleMap = {
  student: { label: '学生', color: '#7a8f63', bgColor: '#e8ece4' },
  dorm_manager: { label: '宿管', color: '#7c3aed', bgColor: '#ede9fe' },
  maintenance: { label: '维修', color: '#d97706', bgColor: '#fef3c7' },
  admin: { label: '管理员', color: '#dc2626', bgColor: '#fee2e2' }
}

// 状态映射
const statusMap = {
  active: { label: '正常', color: '#6b8e6b', bgColor: 'rgba(107, 142, 107, 0.1)' },
  inactive: { label: '禁用', color: '#c1666b', bgColor: 'rgba(193, 102, 107, 0.1)' }
}

// 筛选后的用户列表
const filteredUsers = computed(() => {
  let result = users.value
  
  // 角色筛选
  if (selectedRole.value !== 'all') {
    result = result.filter(user => user.role === selectedRole.value)
  }
  
  // 搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(user => 
      user.name.toLowerCase().includes(keyword) ||
      user.studentId.toLowerCase().includes(keyword) ||
      user.phone.includes(keyword)
    )
  }
  
  return result
})

// 统计数量
const roleCounts = computed(() => {
  const counts = { all: users.value.length }
  roleOptions.forEach(option => {
    if (option.value !== 'all') {
      counts[option.value] = users.value.filter(u => u.role === option.value).length
    }
  })
  return counts
})

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 选择角色筛选
const selectRoleFilter = (role) => {
  selectedRole.value = role
}

// 查看用户详情
const viewUserDetail = (user) => {
  uni.navigateTo({
    url: `/pages/profile/detail?id=${user.id}`
  })
}

// 编辑用户
const editUser = (user) => {
  uni.showToast({
    title: '编辑功能开发中...',
    icon: 'none'
  })
}

// 切换用户状态
const toggleUserStatus = (user) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  uni.showModal({
    title: `确认${action}`,
    content: `确定要${action}用户 "${user.name}" 吗？`,
    success: (res) => {
      if (res.confirm) {
        user.status = user.status === 'active' ? 'inactive' : 'active'
        uni.showToast({
          title: `已${action}`,
          icon: 'success'
        })
      }
    }
  })
}

// 获取用户头像文字
const getAvatarText = (user) => {
  return user.name.charAt(0)
}

// 下拉刷新
const onPullDownRefresh = () => {
  setTimeout(() => {
    uni.stopPullDownRefresh()
    uni.showToast({
      title: '已刷新',
      icon: 'success'
    })
  }, 1000)
}

onMounted(() => {
  // 页面加载时的初始化
})
</script>

<template>
  <view class="users-page">
    <AppNavbar title="用户管理" :show-back="true" />
    
    <view class="page-content">
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-bar">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            v-model="searchKeyword"
            placeholder="搜索姓名、学号或手机号"
            confirm-type="search"
            @confirm="handleSearch"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
        </view>
      </view>
      
      <!-- 角色筛选 -->
      <view class="filter-section">
        <scroll-view class="filter-scroll" scroll-x show-scrollbar="false">
          <view class="filter-list">
            <view 
              v-for="option in roleOptions" 
              :key="option.value"
              :class="['filter-item', { active: selectedRole === option.value }]"
              @click="selectRoleFilter(option.value)"
            >
              <text class="filter-icon">{{ option.icon }}</text>
              <text class="filter-label">{{ option.label }}</text>
              <view class="filter-count" v-if="roleCounts[option.value] > 0">
                <text>{{ roleCounts[option.value] }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 用户列表 -->
      <view class="users-section">
        <view class="section-header">
          <text class="header-title">用户列表</text>
          <text class="header-count">共 {{ filteredUsers.length }} 人</text>
        </view>
        
        <view class="users-list" v-if="filteredUsers.length > 0">
          <view 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-card"
          >
            <!-- 用户信息 -->
            <view class="user-main" @click="viewUserDetail(user)">
              <view class="user-avatar">
                <text>{{ getAvatarText(user) }}</text>
              </view>
              
              <view class="user-info">
                <view class="info-row">
                  <text class="user-name">{{ user.name }}</text>
                  <view 
                    class="role-tag"
                    :style="{ 
                      background: roleMap[user.role]?.bgColor,
                      color: roleMap[user.role]?.color 
                    }"
                  >
                    <text>{{ roleMap[user.role]?.label }}</text>
                  </view>
                </view>
                
                <view class="info-row secondary">
                  <text v-if="user.studentId" class="student-id">学号: {{ user.studentId }}</text>
                  <text class="user-phone">{{ user.phone }}</text>
                </view>
              </view>
              
              <view 
                class="status-tag"
                :style="{ 
                  background: statusMap[user.status]?.bgColor,
                  color: statusMap[user.status]?.color 
                }"
              >
                <text>{{ statusMap[user.status]?.label }}</text>
              </view>
            </view>
            
            <!-- 操作按钮 -->
            <view class="user-actions">
              <button class="action-btn" @click="viewUserDetail(user)">
                <text>查看</text>
              </button>
              
              <button class="action-btn" @click="editUser(user)">
                <text>编辑</text>
              </button>
              
              <button 
                :class="['action-btn', user.status === 'active' ? 'danger' : 'success']"
                @click="toggleUserStatus(user)"
              >
                <text>{{ user.status === 'active' ? '禁用' : '启用' }}</text>
              </button>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-else>
          <view class="empty-icon">🔍</view>
          <text class="empty-text">未找到相关用户</text>
          <text class="empty-subtext">请尝试其他搜索关键词</text>
        </view>
      </view>
    </view>
    
    <!-- 添加用户按钮 -->
    <view class="fab-button" @click="editUser({})">
      <text>+</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.users-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 40px;
}

.page-content {
  padding: 16px 20px;
}

// 搜索栏
.search-section {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: $radius-lg;
  padding: 0 16px;
  height: 44px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.search-icon {
  font-size: 16px;
  margin-right: 10px;
  color: $warm-gray-400;
}

.search-input {
  flex: 1;
  font-size: 15px;
  color: $text-primary;
}

.clear-icon {
  font-size: 18px;
  color: $warm-gray-400;
  padding: 0 4px;
}

// 筛选栏
.filter-section {
  margin-bottom: 20px;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: inline-flex;
  gap: 10px;
  padding: 4px 0;
}

.filter-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  background: #fff;
  border-radius: $radius-full;
  border: 1px solid $warm-gray-200;
  transition: all 0.2s ease;
  
  &.active {
    background: $sage-500;
    border-color: $sage-500;
    
    .filter-icon,
    .filter-label {
      color: #fff;
    }
    
    .filter-count {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }
  }
}

.filter-icon {
  font-size: 14px;
  margin-right: 6px;
}

.filter-label {
  font-size: 13px;
  color: $text-secondary;
}

.filter-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: $sage-100;
  border-radius: 9px;
  margin-left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 11px;
    color: $sage-500;
    font-weight: 500;
  }
}

// 用户列表区域
.users-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .header-title {
    font-size: 16px;
    font-weight: 500;
    color: $text-primary;
  }
  
  .header-count {
    font-size: 13px;
    color: $text-tertiary;
  }
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 16px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.user-main {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid $warm-gray-100;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $sage-300 0%, $sage-400 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  
  text {
    font-size: 20px;
    color: #fff;
    font-weight: 500;
  }
}

.user-info {
  flex: 1;
  min-width: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.secondary {
    flex-wrap: wrap;
  }
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: $text-primary;
}

.role-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.student-id {
  font-size: 13px;
  color: $text-tertiary;
}

.user-phone {
  font-size: 13px;
  color: $text-tertiary;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
  flex-shrink: 0;
}

// 操作按钮
.user-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  height: 36px;
  line-height: 36px;
  background: $warm-gray-100;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
  border-radius: $radius-md;
  border: none;
  
  &.danger {
    background: rgba(193, 102, 107, 0.1);
    color: $error;
  }
  
  &.success {
    background: rgba(107, 142, 107, 0.1);
    color: $success;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: $warm-gray-100;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 17px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: $text-tertiary;
}

// 悬浮按钮
.fab-button {
  position: fixed;
  right: 20px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(122, 143, 99, 0.4);
  z-index: 100;
  
  text {
    font-size: 28px;
    color: #fff;
    font-weight: 300;
  }
}
</style>
