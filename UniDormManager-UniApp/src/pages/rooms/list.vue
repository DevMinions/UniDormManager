<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { roomApi } from '@/api/room.js'
import { handleApiError } from '@/utils/helpers.js'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()
const appStore = useAppStore()

// 检查登录
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

// 搜索关键词
const keyword = ref('')

// 筛选条件
const selectedBuilding = ref('')
const selectedFloor = ref('')
const selectedStatus = ref('')

// 加载状态
const loading = ref(false)
const rooms = ref([])

// 筛选选项
const buildings = ref([
  { id: '', name: '全部楼栋' },
  { id: 'A', name: 'A栋' },
  { id: 'B', name: 'B栋' },
  { id: 'C', name: 'C栋' },
  { id: 'D', name: 'D栋' }
])

const floors = ref([
  { id: '', name: '全部楼层' },
  { id: '1', name: '1层' },
  { id: '2', name: '2层' },
  { id: '3', name: '3层' },
  { id: '4', name: '4层' },
  { id: '5', name: '5层' },
  { id: '6', name: '6层' }
])

const statusList = ref([
  { id: '', name: '全部状态' },
  { id: 'free', name: '空闲' },
  { id: 'occupied', name: '已入住' },
  { id: 'full', name: '已满' }
])

// 处理后的房间数据
const processedRooms = computed(() => {
  return rooms.value.map(room => {
    const occupancyRate = Math.round((room.occupied / room.capacity) * 100)
    const typeText = room.type === 'male' ? '男' : room.type === 'female' ? '女' : '混'
    const typeClass = room.type === 'male' ? 'type-male' : room.type === 'female' ? 'type-female' : 'type-mixed'
    return {
      ...room,
      occupancyRate,
      typeText,
      typeClass
    }
  })
})

// 是否有筛选条件
const hasFilters = computed(() => {
  return keyword.value || selectedBuilding.value || selectedFloor.value || selectedStatus.value
})

// 转换后端状态为前端状态
const mapBackendRoomStatus = (status) => {
  const statusMap = {
    'Available': 'free',
    'Full': 'full',
    'Maintenance': 'maintenance'
  }
  return statusMap[status] || 'free'
}

// 转换后端类型为前端类型
const mapBackendRoomType = (type) => {
  const typeMap = {
    'Male': 'male',
    'Female': 'female',
    'Co-ed': 'mixed'
  }
  return typeMap[type] || 'mixed'
}

// 转换后端数据为前端格式
const convertRoomData = (data) => {
  if (!data) return []
  // 处理分页响应或数组
  const list = Array.isArray(data) ? data : (data.data || data.list || [])
  return list.map(item => ({
    id: item.id,
    roomNumber: item.number || item.roomNumber || '-', // 映射 number -> roomNumber
    building: item.building,
    floor: item.floor,
    capacity: item.capacity,
    occupied: item.occupied,
    type: mapBackendRoomType(item.type), // 转换类型
    status: mapBackendRoomStatus(item.status), // 转换状态
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString().split('T')[0],
    _raw: item
  }))
}

// 获取房间列表
const fetchRooms = async () => {
  loading.value = true
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    if (selectedBuilding.value) params.building = selectedBuilding.value
    if (selectedFloor.value) params.floor = selectedFloor.value
    if (selectedStatus.value) params.status = selectedStatus.value
    
    const res = await roomApi.getRoomList(params)
    // 转换后端数据为前端格式
    rooms.value = convertRoomData(res)
  } catch (error) {
    handleApiError(error, '获取房间列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = (e) => {
  keyword.value = e.detail.value
}

const onSearch = () => {
  fetchRooms()
}

// 选择筛选条件
const selectBuilding = (id) => {
  selectedBuilding.value = selectedBuilding.value === id ? '' : id
  fetchRooms()
}

const selectFloor = (id) => {
  selectedFloor.value = selectedFloor.value === id ? '' : id
  fetchRooms()
}

const selectStatus = (id) => {
  selectedStatus.value = selectedStatus.value === id ? '' : id
  fetchRooms()
}

// 重置筛选
const resetFilters = () => {
  keyword.value = ''
  selectedBuilding.value = ''
  selectedFloor.value = ''
  selectedStatus.value = ''
  fetchRooms()
}

// 跳转到详情
const goToDetail = (id) => {
  uni.navigateTo({
    url: `/pages/rooms/detail?id=${id}`
  })
}

// 获取状态样式
const getStatusColor = (status) => {
  const colors = {
    free: { bg: '#e8ece4', text: '#5c6b52', indicator: '#7a8f63' },
    occupied: { bg: '#fdf6f0', text: '#b85a38', indicator: '#c46f43' },
    full: { bg: '#fee2e2', text: '#dc2626', indicator: '#ef4444' }
  }
  return colors[status] || colors.free
}

const getStatusText = (status) => {
  const texts = { free: '空闲', occupied: '已入住', full: '已满' }
  return texts[status] || '未知'
}

const getOccupancyColor = (rate) => {
  if (rate >= 100) return '#ef4444'
  if (rate >= 75) return '#f59e0b'
  if (rate >= 50) return '#c4a77d'
  return '#7a8f63'
}

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  fetchRooms()
})

onMounted(() => {
  if (!checkAuth()) return
  fetchRooms()
})

onPullDownRefresh(() => {
  fetchRooms().finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<template>
  <view class="rooms-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索房间号"
          v-model="keyword"
          @input="handleSearch"
          @confirm="onSearch"
          placeholder-class="search-placeholder"
        />
        <view class="search-btn" @click="onSearch">搜索</view>
      </view>
    </view>

    <!-- 筛选区域 -->
    <view class="filter-section">
      <view class="filter-header">
        <text class="filter-title">筛选条件</text>
        <view 
          class="reset-btn" 
          :class="{ active: hasFilters }"
          @click="resetFilters"
        >
          <text class="reset-icon">↺</text>
          <text>重置</text>
        </view>
      </view>
      
      <!-- 楼栋筛选 -->
      <scroll-view class="filter-scroll" scroll-x>
        <view
          v-for="item in buildings"
          :key="item.id"
          class="filter-item"
          :class="{ active: selectedBuilding === item.id }"
          @click="selectBuilding(item.id)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
      
      <!-- 楼层筛选 -->
      <scroll-view class="filter-scroll floor-scroll" scroll-x>
        <view
          v-for="item in floors"
          :key="item.id"
          class="filter-item"
          :class="{ active: selectedFloor === item.id }"
          @click="selectFloor(item.id)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
      
      <!-- 状态筛选 -->
      <scroll-view class="filter-scroll" scroll-x>
        <view
          v-for="item in statusList"
          :key="item.id"
          class="filter-item"
          :class="{ active: selectedStatus === item.id }"
          @click="selectStatus(item.id)"
        >
          {{ item.name }}
        </view>
      </scroll-view>
    </view>

    <!-- 房间列表 -->
    <view class="room-list">
      <!-- 加载状态 -->
      <view class="loading-container" v-if="loading">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="processedRooms.length === 0">
        <view class="empty-icon">🏠</view>
        <text class="empty-title">暂无房间数据</text>
        <text class="empty-desc" v-if="hasFilters">暂无符合条件的房间，请调整筛选条件</text>
        <text class="empty-desc" v-else>暂无房间数据，请联系管理员</text>
        <view class="empty-action" v-if="hasFilters" @click="resetFilters">
          <text class="empty-btn">清除筛选</text>
        </view>
      </view>

      <!-- 房间卡片 -->
      <view
        v-for="item in processedRooms"
        :key="item.id"
        class="room-card"
        @click="goToDetail(item.id)"
      >
        <!-- 左侧状态指示条 -->
        <view class="status-indicator" :style="{ background: getStatusColor(item.status).indicator }"></view>
        
        <view class="room-content">
          <!-- 卡片头部 -->
          <view class="room-header">
            <view class="room-title-section">
              <text class="room-number font-serif">{{ item.roomNumber }}</text>
              <view 
                class="room-type-tag"
                :class="item.typeClass"
              >
                {{ item.typeText }}
              </view>
            </view>
            <view 
              class="room-status"
              :style="{ 
                background: getStatusColor(item.status).bg, 
                color: getStatusColor(item.status).text 
              }"
            >
              {{ getStatusText(item.status) }}
            </view>
          </view>

          <!-- 房间信息 -->
          <view class="room-info">
            <view class="info-grid">
              <view class="info-item">
                <text class="info-icon">🏢</text>
                <view class="info-content">
                  <text class="info-label">楼栋</text>
                  <text class="info-value">{{ item.building }}</text>
                </view>
              </view>
              <view class="info-item">
                <text class="info-icon">📍</text>
                <view class="info-content">
                  <text class="info-label">楼层</text>
                  <text class="info-value">{{ item.floor }}层</text>
                </view>
              </view>
              <view class="info-item">
                <text class="info-icon">👥</text>
                <view class="info-content">
                  <text class="info-label">入住</text>
                  <text class="info-value">{{ item.occupied }}/{{ item.capacity }}人</text>
                </view>
              </view>
            </view>
            
            <!-- 入住率进度条 -->
            <view class="occupancy-section">
              <view class="occupancy-header">
                <text class="occupancy-label">入住率</text>
                <text 
                  class="occupancy-value"
                  :style="{ color: getOccupancyColor(item.occupancyRate) }"
                >
                  {{ item.occupancyRate }}%
                </text>
              </view>
              <view class="progress-bar">
                <view 
                  class="progress-fill"
                  :style="{ 
                    width: item.occupancyRate + '%',
                    background: getOccupancyColor(item.occupancyRate)
                  }"
                ></view>
              </view>
            </view>
          </view>

          <!-- 卡片底部 -->
          <view class="room-footer">
            <text class="room-date">更新于 {{ item.updatedAt }}</text>
            <view class="view-detail">
              <text>查看详情</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部提示 -->
      <view class="list-footer" v-if="processedRooms.length > 0 && !loading">
        <text class="footer-text">— 共 {{ processedRooms.length }} 个房间 —</text>
      </view>
    </view>
    
    <!-- 底部 TabBar -->
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.rooms-page {
  min-height: 100vh;
  background: $bg-primary;
  padding: 32rpx;
  padding-bottom: 200rpx;
}

// 搜索栏
.search-section {
  background: #fff;
  border-radius: $radius-lg;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
}

.search-bar {
  display: flex;
  align-items: center;
  background: $bg-secondary;
  border-radius: $radius-full;
  padding: 0 12px;
  height: 44px;
}

.search-icon {
  font-size: 16px;
  margin-right: 8px;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 14px;
  color: $text-primary;
  background: transparent;
}

.search-placeholder {
  color: $warm-gray-400;
}

.search-btn {
  margin-left: 8px;
  padding: 6px 16px;
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: $radius-full;
}

// 筛选区域
.filter-section {
  background: #fff;
  border-radius: $radius-lg;
  padding: 12px 0;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
  border-bottom: 1px solid $warm-gray-100;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
}

.reset-btn {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: $radius-full;
  font-size: 12px;
  color: $warm-gray-400;
  background: $warm-gray-100;
}

.reset-btn.active {
  color: $sage-600;
  background: $sage-100;
}

.reset-icon {
  margin-right: 4px;
  font-size: 12px;
}

.filter-scroll {
  white-space: nowrap;
  padding: 8px;
}

.floor-scroll {
  border-top: 1px solid $warm-gray-100;
  border-bottom: 1px solid $warm-gray-100;
}

.filter-item {
  display: inline-block;
  padding: 8px 16px;
  margin: 0 4px;
  border-radius: $radius-full;
  font-size: 13px;
  font-weight: 500;
  color: $warm-gray-500;
  background: $warm-gray-50;
}

.filter-item:first-child {
  margin-left: 8px;
}

.filter-item:last-child {
  margin-right: 8px;
}

.filter-item.active {
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  box-shadow: $shadow-sm;
}

// 房间列表
.room-list {
  padding-bottom: 16px;
}

// 房间卡片
.room-card {
  display: flex;
  background: #fff;
  border-radius: $radius-xl;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.room-card:active {
  transform: translateY(-2px);
  box-shadow: $shadow-md;
}

.status-indicator {
  width: 4px;
  min-height: 100%;
  flex-shrink: 0;
}

.room-content {
  flex: 1;
  padding: 16px;
}

// 卡片头部
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid $warm-gray-100;
}

.room-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-number {
  font-size: 22px;
  font-weight: 400;
  color: $text-primary;
}

.room-type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
}

.room-type-tag.type-male {
  background: #dbeafe;
  color: #3b82f6;
}

.room-type-tag.type-female {
  background: #fce7f3;
  color: #ec4899;
}

.room-type-tag.type-mixed {
  background: #fef3c7;
  color: #f59e0b;
}

.room-status {
  padding: 6px 12px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

// 房间信息
.room-info {
  margin-bottom: 12px;
}

.info-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.info-icon {
  font-size: 18px;
  margin-right: 6px;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: $warm-gray-400;
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

// 入住率进度条
.occupancy-section {
  background: $bg-secondary;
  border-radius: $radius-md;
  padding: 12px;
}

.occupancy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.occupancy-label {
  font-size: 12px;
  color: $warm-gray-500;
}

.occupancy-value {
  font-size: 13px;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: $warm-gray-200;
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.5s ease;
}

// 卡片底部
.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid $warm-gray-100;
}

.room-date {
  font-size: 12px;
  color: $warm-gray-400;
}

.view-detail {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: $sage-600;
}

.view-detail .arrow {
  margin-left: 4px;
  font-size: 16px;
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid $warm-gray-200;
  border-top-color: $sage-500;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: $warm-gray-500;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  text-align: center;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: $bg-secondary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 48px;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: $warm-gray-600;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: $warm-gray-400;
  max-width: 260px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.empty-btn {
  display: inline-block;
  padding: 10px 24px;
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border-radius: $radius-full;
  box-shadow: $shadow-sm;
}

// 列表底部
.list-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
}

.footer-text {
  font-size: 12px;
  color: $warm-gray-400;
}
</style>
