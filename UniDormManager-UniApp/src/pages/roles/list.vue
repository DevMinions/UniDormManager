<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { roleApi } from '@/api/role.js'
import { isSystemAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()

// 检查权限 - 仅系统管理员可访问
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isSystemAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 加载状态
const loading = ref(false)
const roles = ref([])
const permissions = ref([])

// 搜索关键词
const searchKeyword = ref('')

// 筛选后的角色
const filteredRoles = computed(() => {
  if (!searchKeyword.value) return roles.value
  const keyword = searchKeyword.value.toLowerCase()
  return roles.value.filter(r => 
    r.name?.toLowerCase().includes(keyword) ||
    r.code?.toLowerCase().includes(keyword) ||
    r.description?.toLowerCase().includes(keyword)
  )
})

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadRoles()
  loadPermissions()
})

onPullDownRefresh(() => {
  Promise.all([loadRoles(), loadPermissions()]).finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载角色列表
const loadRoles = async () => {
  loading.value = true
  try {
    const res = await roleApi.getAllRoles()
    roles.value = res || []
  } catch (error) {
    handleApiError(error, '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 加载权限列表
const loadPermissions = async () => {
  try {
    const res = await roleApi.getAllPermissions()
    permissions.value = res || []
  } catch (error) {
    console.error('获取权限列表失败', error)
  }
}

// 预定义角色（不可删除）
const predefinedRoles = ['student', 'dorm_manager', 'maintenance_staff', 'building_manager', 'logistics_admin', 'system_admin']
const isPredefined = (code) => predefinedRoles.includes(code)

// 删除角色
const deleteRole = (role) => {
  if (isPredefined(role.code)) {
    uni.showToast({ title: '预定义角色不能删除', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除角色 "${role.name}" 吗？此操作不可恢复！`,
    confirmColor: '#DC2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await roleApi.deleteRole(role.id)
          showSuccess('删除成功')
          loadRoles()
        } catch (error) {
          handleApiError(error, '删除失败')
        }
      }
    }
  })
}

// 跳转到详情/编辑
const goToDetail = (role) => {
  uni.navigateTo({
    url: `/pages/roles/detail?id=${role.id}`
  })
}

// 跳转到新增
const goToCreate = () => {
  uni.navigateTo({
    url: '/pages/roles/detail'
  })
}

// 获取角色等级标签
const getLevelLabel = (level) => {
  const levels = { 1: '一级', 2: '二级', 3: '三级', 4: '四级', 5: '五级' }
  return levels[level] || `${level}级`
}

// 获取角色等级颜色
const getLevelColor = (level) => {
  const colors = { 1: '#9CA3AF', 2: '#10B981', 3: '#3B82F6', 4: '#8B5CF6', 5: '#DC2626' }
  return colors[level] || '#6B7280'
}

// 获取权限数量
const getPermissionCount = (role) => {
  return role.permissions?.length || 0
}

// 获取角色图标
const getRoleIcon = (code) => {
  const icons = {
    'student': '👨‍🎓',
    'dorm_manager': '🏠',
    'maintenance_staff': '🔧',
    'building_manager': '🏢',
    'logistics_admin': '📋',
    'system_admin': '⚡'
  }
  return icons[code] || '👤'
}

// 获取角色描述
const getRoleDescription = (code) => {
  const descs = {
    'student': '学生用户，可提交报修、申请换寝、查看公告',
    'dorm_manager': '宿管员，管理报修、查寝评分、学生信息',
    'maintenance_staff': '维修人员，处理维修工单',
    'building_manager': '楼栋管理员，管理指定楼栋的房间和学生',
    'logistics_admin': '后勤管理员，负责楼栋管理、晚归告警、数据统计',
    'system_admin': '系统管理员，拥有所有权限'
  }
  return descs[code] || '自定义角色'
}
</script>

<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <AppNavbar title="角色管理" show-back />
    
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索角色名称、代码..."
          class="search-input"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="searchKeyword = ''">✕</text>
      </view>
    </view>
    
    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card">
        <text class="stat-value">{{ roles.length }}</text>
        <text class="stat-label">总角色</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ predefinedRoles.length }}</text>
        <text class="stat-label">预定义</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ permissions.length }}</text>
        <text class="stat-label">权限项</text>
      </view>
    </view>
    
    <!-- 角色列表 -->
    <view class="list-section">
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else-if="filteredRoles.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">{{ searchKeyword ? '未找到匹配的角色' : '暂无角色数据' }}</text>
      </view>
      
      <view v-else class="role-list">
        <view
          v-for="role in filteredRoles"
          :key="role.id"
          class="role-card"
          :class="{ 'predefined': isPredefined(role.code) }"
          @click="goToDetail(role)"
        >
          <!-- 角色头部 -->
          <view class="role-header">
            <view class="role-icon">{{ getRoleIcon(role.code) }}</view>
            <view class="role-info">
              <text class="role-name">{{ role.name }}</text>
              <text class="role-code">{{ role.code }}</text>
            </view>
            <view class="role-badge" :style="{ backgroundColor: getLevelColor(role.level) }">
              <text class="badge-text">{{ getLevelLabel(role.level) }}</text>
            </view>
          </view>
          
          <!-- 角色描述 -->
          <text class="role-desc">{{ role.description || getRoleDescription(role.code) }}</text>
          
          <!-- 角色底部 -->
          <view class="role-footer">
            <view class="permission-tag">
              <text class="tag-icon">🔒</text>
              <text class="tag-text">{{ getPermissionCount(role) }} 个权限</text>
            </view>
            <view class="role-actions" @click.stop>
              <button 
                v-if="!isPredefined(role.code)" 
                class="action-btn delete-btn" 
                @click="deleteRole(role)"
              >
                删除
              </button>
              <button class="action-btn edit-btn" @click="goToDetail(role)">
                编辑
              </button>
            </view>
          </view>
          
          <!-- 预定义标记 -->
          <view v-if="isPredefined(role.code)" class="predefined-badge">
            <text class="predefined-text">系统</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="fab-container">
      <button class="fab-button" @click="goToCreate">
        <text class="fab-icon">+</text>
        <text class="fab-text">新增角色</text>
      </button>
    </view>
    
    <!-- TabBar -->
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 160rpx;
}

// 搜索栏
.search-section {
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  
  .search-bar {
    display: flex;
    align-items: center;
    background: #F3F4F6;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    gap: 16rpx;
    
    .search-icon {
      font-size: 32rpx;
      color: #9CA3AF;
    }
    
    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #1F2937;
    }
    
    .clear-icon {
      font-size: 28rpx;
      color: #9CA3AF;
      padding: 8rpx;
    }
  }
}

// 统计区域
.stats-section {
  display: flex;
  padding: 0 32rpx 24rpx;
  gap: 20rpx;
  background: rgba(255, 255, 255, 0.8);
  
  .stat-card {
    flex: 1;
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border-radius: 20rpx;
    padding: 24rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.15);
    
    .stat-value {
      display: block;
      font-size: 40rpx;
      font-weight: 700;
      color: #92400E;
      margin-bottom: 8rpx;
    }
    
    .stat-label {
      font-size: 24rpx;
      color: #92400E;
      opacity: 0.8;
    }
  }
}

// 列表区域
.list-section {
  padding: 24rpx 32rpx;
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
    
    .loading-spinner {
      width: 80rpx;
      height: 80rpx;
      border: 4rpx solid #F3F4F6;
      border-top-color: #9A3412;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      margin-top: 24rpx;
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
    
    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 24rpx;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
}

// 角色卡片
.role-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.role-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  
  &.predefined {
    border-left: 6rpx solid #059669;
  }
  
  .role-header {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 16rpx;
    
    .role-icon {
      width: 80rpx;
      height: 80rpx;
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
    }
    
    .role-info {
      flex: 1;
      
      .role-name {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 4rpx;
      }
      
      .role-code {
        font-size: 24rpx;
        color: #9CA3AF;
        font-family: monospace;
      }
    }
    
    .role-badge {
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      
      .badge-text {
        font-size: 22rpx;
        font-weight: 500;
        color: #FFFFFF;
      }
    }
  }
  
  .role-desc {
    font-size: 26rpx;
    color: #6B7280;
    line-height: 1.5;
    margin-bottom: 24rpx;
  }
  
  .role-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .permission-tag {
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: #F3F4F6;
      padding: 12rpx 20rpx;
      border-radius: 12rpx;
      
      .tag-icon {
        font-size: 24rpx;
      }
      
      .tag-text {
        font-size: 24rpx;
        color: #6B7280;
      }
    }
    
    .role-actions {
      display: flex;
      gap: 12rpx;
      
      .action-btn {
        padding: 16rpx 28rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        font-weight: 500;
        border: none;
        
        &.edit-btn {
          background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
          color: #FFFFFF;
        }
        
        &.delete-btn {
          background: #FEE2E2;
          color: #DC2626;
        }
      }
    }
  }
  
  .predefined-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(135deg, #059669 0%, #10B981 100%);
    padding: 8rpx 20rpx;
    border-bottom-left-radius: 16rpx;
    
    .predefined-text {
      font-size: 20rpx;
      font-weight: 500;
      color: #FFFFFF;
    }
  }
}

// 新增按钮
.fab-container {
  position: fixed;
  bottom: 180rpx;
  right: 32rpx;
  z-index: 100;
  
  .fab-button {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    padding: 28rpx 40rpx;
    border-radius: 50rpx;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.4);
    border: none;
    
    .fab-icon {
      font-size: 36rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
    
    .fab-text {
      font-size: 28rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
