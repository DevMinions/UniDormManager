<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { buildingApi } from '@/api/building.js'
import { roomApi } from '@/api/room.js'
import { isAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()

// 检查权限
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 加载状态
const loading = ref(false)
const buildings = ref([])

// 搜索关键词
const searchKeyword = ref('')

// 筛选后的楼栋
const filteredBuildings = computed(() => {
  if (!searchKeyword.value) return buildings.value
  const keyword = searchKeyword.value.toLowerCase()
  return buildings.value.filter(b => 
    b.name?.toLowerCase().includes(keyword) ||
    b.code?.toLowerCase().includes(keyword) ||
    b.address?.toLowerCase().includes(keyword)
  )
})

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadBuildings()
})

onPullDownRefresh(() => {
  loadBuildings().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载楼栋列表
const loadBuildings = async () => {
  loading.value = true
  try {
    const res = await buildingApi.getAllBuildings()
    buildings.value = res || []
  } catch (error) {
    handleApiError(error, '获取楼栋列表失败')
  } finally {
    loading.value = false
  }
}

// 删除楼栋
const deleteBuilding = (building) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除楼栋 "${building.name}" 吗？此操作不可恢复！`,
    confirmColor: '#DC2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await buildingApi.deleteBuilding(building.id)
          showSuccess('删除成功')
          loadBuildings()
        } catch (error) {
          handleApiError(error, '删除失败')
        }
      }
    }
  })
}

// 跳转到详情/编辑
const goToDetail = (building) => {
  uni.navigateTo({
    url: `/pages/buildings/detail?id=${building.id}`
  })
}

// 跳转到新增
const goToCreate = () => {
  uni.navigateTo({
    url: '/pages/buildings/detail'
  })
}

// 查看房间
const viewRooms = (building) => {
  uni.navigateTo({
    url: `/pages/rooms/list?building=${building.code}`
  })
}
</script>

<template>
  <view class="page-container">
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="楼栋管理" />
    
    <view class="content">
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stats-header">
          <text class="stats-icon">🏢</text>
          <text class="stats-title">楼栋概览</text>
        </view>
        
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ buildings.length }}</text>
            <text class="stat-label">总楼栋数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ buildings.reduce((sum, b) => sum + (b.totalRooms || 0), 0) }}</text>
            <text class="stat-label">总房间数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ buildings.reduce((sum, b) => sum + (b.totalStudents || 0), 0) }}</text>
            <text class="stat-label">入住学生</text>
          </view>
        </view>
      </view>
      
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input
            v-model="searchKeyword"
            class="search-input"
            type="text"
            placeholder="搜索楼栋名称、编号..."
            placeholder-class="placeholder"
          />
          <text 
            v-if="searchKeyword" 
            class="clear-btn"
            @click="searchKeyword = ''"
          >✕</text>
        </view>
      </view>
      
      <!-- 楼栋列表 -->
      <view class="building-list">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="filteredBuildings.length === 0" class="empty-state">
          <text class="empty-icon">🏢</text>
          <text class="empty-text">{{ searchKeyword ? '未找到匹配楼栋' : '暂无楼栋数据' }}</text>
        </view>
        
        <!-- 列表项 -->
        <view
          v-for="(building, index) in filteredBuildings"
          :key="building.id"
          class="building-item"
          :style="{ animationDelay: `${index * 80}ms` }"
        >
          <view class="building-content" @click="goToDetail(building)">
            <!-- 头部 -->
            <view class="building-header">
              <view class="building-icon">🏢</view>
              
              <view class="building-info">
                <text class="building-name">{{ building.name }}</text>
                <text class="building-code">{{ building.code }}</text>
              </view>
              
              <view 
                class="building-status"
                :class="building.status === 'active' ? 'active' : 'inactive'"
              >
                {{ building.status === 'active' ? '正常' : '停用' }}
              </view>
            </view>
            
            <!-- 统计信息 -->
            <view class="building-stats">
              <view class="stat-box">
                <text class="box-value">{{ building.totalFloors || '-' }}</text>
                <text class="box-label">层数</text>
              </view>
              
              <view class="stat-box">
                <text class="box-value">{{ building.totalRooms || '-' }}</text>
                <text class="box-label">房间</text>
              </view>
              
              <view class="stat-box">
                <text class="box-value">{{ building.totalStudents || '-' }}</text>
                <text class="box-label">入住</text>
              </view>
            </view>
            
            <!-- 地址 -->
            <view v-if="building.address" class="building-address">
              <text class="address-icon">📍</text>
              <text class="address-text">{{ building.address }}</text>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="building-actions">
            <view class="action-btn view" @click="viewRooms(building)">
              <text>查看房间</text>
            </view>
            
            <view class="action-btn edit" @click="goToDetail(building)">
              <text>编辑</text>
            </view>
            
            <view class="action-btn delete" @click="deleteBuilding(building)">
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 新增按钮 -->
    <view class="fab-btn" @click="goToCreate">
      <text class="fab-icon">+</text>
      <text class="fab-text">新增楼栋</text>
    </view>
    
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #FFFBEB;
  position: relative;
  padding-bottom: 160rpx;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.25;
}

.blob-1 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.4), rgba(251, 191, 36, 0.2));
  top: -60rpx;
  right: -60rpx;
}

.blob-2 {
  width: 250rpx;
  height: 250rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(16, 185, 129, 0.15));
  bottom: 200rpx;
  left: -50rpx;
}

.content {
  position: relative;
  z-index: 1;
  padding: 24rpx;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #ffffff 0%, #FFFBEB 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(154, 52, 18, 0.08);
  border: 2rpx solid #F2E6E2;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.stats-icon {
  font-size: 32rpx;
}

.stats-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #9A3412;
}

.stat-label {
  font-size: 26rpx;
  color: #64748B;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #E8D4CD;
}

/* 搜索栏 */
.search-bar {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #9CA3AF;
}

.search-input {
  flex: 1;
  height: 48rpx;
  font-size: 28rpx;
  color: #1E293B;
}

.search-input .placeholder {
  color: #9CA3AF;
}

.clear-btn {
  font-size: 24rpx;
  color: #9CA3AF;
  padding: 8rpx;
}

/* 楼栋列表 */
.building-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E8D4CD;
  border-top-color: #9A3412;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 26rpx;
  color: #64748B;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #64748B;
}

/* 楼栋项 */
.building-item {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  overflow: hidden;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.building-content {
  padding: 28rpx;
}

.building-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.building-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #FEF3C7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.building-info {
  flex: 1;
}

.building-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  display: block;
  margin-bottom: 4rpx;
}

.building-code {
  font-size: 24rpx;
  color: #64748B;
}

.building-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.building-status.active {
  background: #ECFDF5;
  color: #059669;
}

.building-status.inactive {
  background: #F1F5F9;
  color: #64748B;
}

.building-stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
}

.box-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 4rpx;
}

.box-label {
  font-size: 22rpx;
  color: #64748B;
}

.building-address {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #F2E6E2;
}

.address-icon {
  font-size: 24rpx;
}

.address-text {
  font-size: 24rpx;
  color: #6B7280;
}

/* 操作按钮 */
.building-actions {
  display: flex;
  border-top: 2rpx solid #F2E6E2;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 28rpx;
  font-weight: 500;
}

.action-btn.view {
  color: #3B82F6;
  background: #EFF6FF;
}

.action-btn.edit {
  color: #D97706;
  background: #FFFBEB;
  border-left: 2rpx solid #F2E6E2;
  border-right: 2rpx solid #F2E6E2;
}

.action-btn.delete {
  color: #DC2626;
  background: #FEF2F2;
}

.action-btn:active {
  opacity: 0.8;
}

/* 新增按钮 */
.fab-btn {
  position: fixed;
  right: 32rpx;
  bottom: 140rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  padding: 24rpx 32rpx;
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.35);
  z-index: 100;
}

.fab-btn:active {
  transform: scale(0.95);
}

.fab-icon {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 300;
}

.fab-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}
</style>
