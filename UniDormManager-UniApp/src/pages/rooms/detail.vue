<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { roomApi } from '@/api/room.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 房间ID
const roomId = ref(null)
const loading = ref(false)

// 房间详情数据
const roomDetail = ref({})

// 室友列表
const roommates = ref([])

// 页面加载
onLoad((options) => {
  if (options.id) {
    roomId.value = parseInt(options.id)
    fetchRoomDetail()
  }
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

// 获取房间详情
const fetchRoomDetail = async () => {
  loading.value = true
  try {
    const res = await roomApi.getRoomDetail(roomId.value)
    if (res) {
      // 转换后端数据为前端格式
      roomDetail.value = {
        id: res.id,
        roomNumber: res.number || res.roomNumber,
        building: res.building,
        floor: res.floor,
        capacity: res.capacity,
        occupied: res.occupied,
        status: mapBackendRoomStatus(res.status),
        type: mapBackendRoomType(res.type),
        area: res.area || '25m²',
        direction: res.direction || '南',
        description: res.description || '标准宿舍',
        updatedAt: res.updatedAt || res.createdAt || new Date().toISOString().split('T')[0],
        facilities: res.facilities || [
          { name: '空调', icon: '❄️', available: true },
          { name: '热水器', icon: '🚿', available: true },
          { name: '独立卫浴', icon: '🚽', available: true },
          { name: '衣柜', icon: '👔', available: true },
          { name: '书桌', icon: '📚', available: true },
          { name: '宽带', icon: '📶', available: true }
        ],
        _raw: res
      }
      // 如果后端返回室友信息，更新roommates
      if (res.students || res.roommates) {
        roommates.value = res.students || res.roommates || []
      }
    }
  } catch (error) {
    console.error('获取房间详情失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
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

const getTypeText = (type) => {
  const texts = { male: '男生宿舍', female: '女生宿舍', mixed: '混合宿舍' }
  return texts[type] || '未知'
}

const getTypeClass = (type) => {
  return type === 'male' ? 'type-male' : type === 'female' ? 'type-female' : 'type-mixed'
}

const getOccupancyColor = (rate) => {
  if (rate >= 100) return '#ef4444'
  if (rate >= 75) return '#f59e0b'
  if (rate >= 50) return '#c4a77d'
  return '#7a8f63'
}

// 计算入住率
const occupancyRate = computed(() => {
  if (!roomDetail.value.capacity) return 0
  return Math.round((roomDetail.value.occupied / roomDetail.value.capacity) * 100)
})

// 拨打室友电话
const callRoommate = (phone) => {
  uni.makePhoneCall({
    phoneNumber: phone
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到报修页面
const goToRepair = () => {
  uni.navigateTo({
    url: '/pages/repairs/submit'
  })
}
</script>

<template>
  <view class="room-detail-page">
    <!-- 导航栏 -->
    <AppNavbar title="房间详情" showBack bgColor="#faf9f7" />

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 内容区域 -->
    <view class="content" v-else>
      <!-- 房间基本信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <view class="room-title-section">
            <text class="room-number font-serif">{{ roomDetail.roomNumber }}</text>
            <view 
              class="room-type-tag"
              :class="getTypeClass(roomDetail.type)"
            >
              {{ roomDetail.type === 'male' ? '男' : roomDetail.type === 'female' ? '女' : '混' }}
            </view>
          </view>
          <view 
            class="room-status"
            :style="{ 
              background: getStatusColor(roomDetail.status).bg, 
              color: getStatusColor(roomDetail.status).text 
            }"
          >
            {{ getStatusText(roomDetail.status) }}
          </view>
        </view>

        <view class="room-desc">{{ roomDetail.description }}</view>

        <!-- 入住率 -->
        <view class="occupancy-section">
          <view class="occupancy-header">
            <text class="occupancy-label">入住情况</text>
            <text 
              class="occupancy-value"
              :style="{ color: getOccupancyColor(occupancyRate) }"
            >
              {{ roomDetail.occupied }}/{{ roomDetail.capacity }}人
            </text>
          </view>
          <view class="progress-bar">
            <view 
              class="progress-fill"
              :style="{ 
                width: occupancyRate + '%',
                background: getOccupancyColor(occupancyRate)
              }"
            ></view>
          </view>
        </view>
      </view>

      <!-- 房间详细信息 -->
      <view class="detail-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>详细信息</text>
        </view>
        <view class="detail-grid">
          <view class="detail-item">
            <text class="detail-icon">🏢</text>
            <view class="detail-content">
              <text class="detail-label">楼栋</text>
              <text class="detail-value">{{ roomDetail.building }}</text>
            </view>
          </view>
          <view class="detail-item">
            <text class="detail-icon">📍</text>
            <view class="detail-content">
              <text class="detail-label">楼层</text>
              <text class="detail-value">{{ roomDetail.floor }}层</text>
            </view>
          </view>
          <view class="detail-item">
            <text class="detail-icon">📐</text>
            <view class="detail-content">
              <text class="detail-label">面积</text>
              <text class="detail-value">{{ roomDetail.area }}</text>
            </view>
          </view>
          <view class="detail-item">
            <text class="detail-icon">🧭</text>
            <view class="detail-content">
              <text class="detail-label">朝向</text>
              <text class="detail-value">{{ roomDetail.direction }}</text>
            </view>
          </view>
          <view class="detail-item">
            <text class="detail-icon">👥</text>
            <view class="detail-content">
              <text class="detail-label">容量</text>
              <text class="detail-value">{{ roomDetail.capacity }}人</text>
            </view>
          </view>
          <view class="detail-item">
            <text class="detail-icon">🏷️</text>
            <view class="detail-content">
              <text class="detail-label">类型</text>
              <text class="detail-value">{{ getTypeText(roomDetail.type) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 房间设施 -->
      <view class="facilities-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>房间设施</text>
        </view>
        <view class="facilities-grid">
          <view 
            v-for="item in roomDetail.facilities" 
            :key="item.name"
            class="facility-item"
            :class="{ 'facility-unavailable': !item.available }"
          >
            <text class="facility-icon">{{ item.icon }}</text>
            <text class="facility-name">{{ item.name }}</text>
            <text v-if="!item.available" class="facility-status">暂无</text>
          </view>
        </view>
      </view>

      <!-- 室友列表 -->
      <view class="roommates-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>室友信息</text>
          <text class="roommates-count">{{ roommates.length }}人</text>
        </view>
        <view class="roommates-list">
          <view 
            v-for="mate in roommates" 
            :key="mate.id"
            class="roommate-item"
            :class="{ 'is-self': mate.isSelf }"
          >
            <view class="roommate-avatar">
              <text>{{ mate.avatar }}</text>
              <view v-if="mate.isSelf" class="self-badge">我</view>
            </view>
            <view class="roommate-info">
              <view class="roommate-header">
                <text class="roommate-name">{{ mate.name }}</text>
                <text class="roommate-major">{{ mate.major }}</text>
              </view>
              <view class="roommate-meta">
                <text class="meta-item">学号: {{ mate.studentId }}</text>
                <text class="meta-item">入住: {{ mate.checkInDate }}</text>
              </view>
            </view>
            <view class="roommate-action" @click="callRoommate(mate.phone)">
              <text class="phone-icon">📞</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <button class="action-btn secondary" @click="goBack">
          <text>返回列表</text>
        </button>
        <button class="action-btn primary" @click="goToRepair">
          <text>🛠️ 报修</text>
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.room-detail-page {
  min-height: 100vh;
  background: $bg-primary;
}

.content {
  padding: 16px;
  padding-bottom: 100px;
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 60px 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $warm-gray-200;
  border-top-color: $sage-500;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: $warm-gray-500;
}

// 卡片通用样式
.info-card,
.detail-card,
.facilities-card,
.roommates-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid $warm-gray-100;
}

.room-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-number {
  font-size: 28px;
  font-weight: 400;
  color: $text-primary;
}

.room-type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 12px;
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
  padding: 6px 14px;
  border-radius: $radius-full;
  font-size: 13px;
  font-weight: 500;
}

.room-desc {
  font-size: 14px;
  color: $warm-gray-600;
  line-height: 1.6;
  margin-bottom: 16px;
}

// 入住率
.occupancy-section {
  background: $bg-secondary;
  border-radius: $radius-md;
  padding: 14px;
}

.occupancy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.occupancy-label {
  font-size: 13px;
  color: $warm-gray-500;
}

.occupancy-value {
  font-size: 14px;
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: $warm-gray-200;
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.5s ease;
}

// 章节标题
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: $sage-600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: $sage-500;
  border-radius: 2px;
}

.roommates-count {
  font-size: 13px;
  color: $warm-gray-400;
  margin-left: auto;
}

// 详细信息网格
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-icon {
  font-size: 20px;
  margin-right: 10px;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 11px;
  color: $warm-gray-400;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

// 设施网格
.facilities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.facility-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: $bg-secondary;
  border-radius: $radius-md;
  transition: all 0.2s ease;
}

.facility-item.facility-unavailable {
  opacity: 0.5;
  background: $warm-gray-100;
}

.facility-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.facility-name {
  font-size: 12px;
  color: $text-primary;
}

.facility-status {
  font-size: 10px;
  color: $warm-gray-400;
  margin-top: 2px;
}

// 室友列表
.roommates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roommate-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: $bg-secondary;
  border-radius: $radius-lg;
  transition: all 0.2s ease;
}

.roommate-item.is-self {
  background: rgba($sage-300, 0.2);
  border: 1px solid rgba($sage-400, 0.3);
}

.roommate-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $sage-300, $sage-400);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
}

.roommate-avatar text {
  font-size: 20px;
  color: #fff;
}

.self-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: $terracotta-500;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid #fff;
}

.roommate-info {
  flex: 1;
  min-width: 0;
}

.roommate-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.roommate-name {
  font-size: 15px;
  font-weight: 500;
  color: $text-primary;
}

.roommate-major {
  font-size: 12px;
  color: $warm-gray-500;
}

.roommate-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  font-size: 12px;
  color: $warm-gray-500;
}

.roommate-action {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  margin-left: 8px;
  box-shadow: $shadow-sm;
}

.phone-icon {
  font-size: 18px;
}

// 底部操作栏
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid $warm-gray-100;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-btn {
  flex: 1;
  height: 46px;
  line-height: 46px;
  border-radius: $radius-lg;
  font-size: 15px;
  font-weight: 500;
  border: none;
}

.action-btn.secondary {
  background: $warm-gray-100;
  color: $warm-gray-700;
}

.action-btn.primary {
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  box-shadow: $shadow-sm;
}

.action-btn:active {
  opacity: 0.9;
  transform: translateY(1px);
}
</style>
