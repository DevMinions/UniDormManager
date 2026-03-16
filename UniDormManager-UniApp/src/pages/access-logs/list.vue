<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { accessLogApi } from '@/api/accessLog.js'
import { handleApiError } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()

// 检查登录
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

// 当前筛选
const selectedDirection = ref('') // '' | 'In' | 'Out'
const selectedStatus = ref('') // '' | 'Normal' | 'Late' | 'Absent'

// 加载状态
const loading = ref(false)
const logs = ref([])

// 实时模式
const isLiveMode = ref(false)
let liveTimer = null

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadLogs()
})

onUnmounted(() => {
  stopLiveMode()
})

onPullDownRefresh(() => {
  loadLogs().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载门禁记录
const loadLogs = async () => {
  loading.value = true
  try {
    const params = {}
    if (selectedDirection.value) params.direction = selectedDirection.value
    if (selectedStatus.value) params.status = selectedStatus.value
    
    const res = await accessLogApi.getAccessLogs(params)
    // 处理分页响应或数组
    const list = Array.isArray(res) ? res : (res.data || res.list || [])
    logs.value = list
  } catch (error) {
    handleApiError(error, '获取门禁记录失败')
  } finally {
    loading.value = false
  }
}

// 加载实时记录
const loadLiveLogs = async () => {
  try {
    const res = await accessLogApi.getLiveAccessLogs()
    logs.value = res || []
  } catch (error) {
    console.error('获取实时记录失败:', error)
  }
}

// 切换实时模式
const toggleLiveMode = () => {
  isLiveMode.value = !isLiveMode.value
  
  if (isLiveMode.value) {
    loadLiveLogs()
    liveTimer = setInterval(loadLiveLogs, 5000) // 每5秒刷新
  } else {
    stopLiveMode()
    loadLogs()
  }
}

// 停止实时模式
const stopLiveMode = () => {
  if (liveTimer) {
    clearInterval(liveTimer)
    liveTimer = null
  }
}

// 切换方向筛选
const toggleDirection = (direction) => {
  selectedDirection.value = selectedDirection.value === direction ? '' : direction
  if (!isLiveMode.value) loadLogs()
}

// 切换状态筛选
const toggleStatus = (status) => {
  selectedStatus.value = selectedStatus.value === status ? '' : status
  if (!isLiveMode.value) loadLogs()
}

// 获取方向图标
const getDirectionIcon = (direction) => {
  return direction === 'In' ? '⬇️' : '⬆️'
}

// 获取方向文字
const getDirectionText = (direction) => {
  return direction === 'In' ? '进入' : '离开'
}

// 获取状态信息
const getStatusInfo = (status) => {
  const statusMap = {
    Normal: { label: '正常', color: '#059669', bgColor: '#ECFDF5' },
    Late: { label: '晚归', color: '#DC2626', bgColor: '#FEE2E2' },
    Absent: { label: '未归', color: '#D97706', bgColor: '#FEF3C7' }
  }
  return statusMap[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9' }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// 统计数据
const statistics = computed(() => {
  const total = logs.value.length
  const inCount = logs.value.filter(l => l.direction === 'In').length
  const outCount = logs.value.filter(l => l.direction === 'Out').length
  const lateCount = logs.value.filter(l => l.status === 'Late').length
  const absentCount = logs.value.filter(l => l.status === 'Absent').length
  
  return {
    total,
    inCount,
    outCount,
    lateCount,
    absentCount,
    inRate: total > 0 ? Math.round((inCount / total) * 100) : 0,
    lateRate: total > 0 ? Math.round((lateCount / total) * 100) : 0
  }
})

// 时段统计（按小时）
const hourlyStats = computed(() => {
  const stats = {}
  for (let i = 0; i < 24; i++) {
    stats[i] = { in: 0, out: 0 }
  }
  
  logs.value.forEach(log => {
    if (log.timestamp) {
      const hour = new Date(log.timestamp).getHours()
      if (log.direction === 'In') {
        stats[hour].in++
      } else {
        stats[hour].out++
      }
    }
  })
  
  // 转换为数组，只返回有数据的时段
  return Object.entries(stats)
    .filter(([_, data]) => data.in > 0 || data.out > 0)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      ...data,
      total: data.in + data.out
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5) // 取前5个高峰时段
})
</script>

<template>
  <view class="page-container">
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="门禁记录" />
    
    <view class="content">
      <!-- 统计卡片 -->
      <view class="stats-section" v-if="!isLiveMode">
        <view class="stats-grid">
          <view class="stat-card primary">
            <text class="stat-value">{{ statistics.total }}</text>
            <text class="stat-label">总记录</text>
          </view>
          <view class="stat-card success">
            <text class="stat-value">{{ statistics.inCount }}</text>
            <text class="stat-label">进入</text>
          </view>
          <view class="stat-card warning">
            <text class="stat-value">{{ statistics.outCount }}</text>
            <text class="stat-label">离开</text>
          </view>
        </view>
        
        <!-- 异常统计 -->
        <view class="abnormal-stats" v-if="statistics.lateCount > 0 || statistics.absentCount > 0">
          <view class="abnormal-item late">
            <text class="abnormal-icon">⚠️</text>
            <text class="abnormal-count">{{ statistics.lateCount }}</text>
            <text class="abnormal-label">晚归</text>
          </view>
          <view class="abnormal-item absent" v-if="statistics.absentCount > 0">
            <text class="abnormal-icon">🚫</text>
            <text class="abnormal-count">{{ statistics.absentCount }}</text>
            <text class="abnormal-label">未归</text>
          </view>
        </view>
        
        <!-- 高峰时段 -->
        <view class="peak-hours" v-if="hourlyStats.length > 0">
          <view class="section-title">
            <text class="title-icon">📊</text>
            <text class="title-text">通行高峰时段</text>
          </view>
          <view class="hour-bars">
            <view 
              v-for="item in hourlyStats" 
              :key="item.hour"
              class="hour-bar"
            >
              <view class="bar-label">{{ item.hour }}:00</view>
              <view class="bar-track">
                <view 
                  class="bar-fill in" 
                  :style="{ width: (item.in / Math.max(...hourlyStats.map(h => h.total)) * 100) + '%' }"
                ></view>
                <view 
                  class="bar-fill out" 
                  :style="{ width: (item.out / Math.max(...hourlyStats.map(h => h.total)) * 100) + '%' }"
                ></view>
              </view>
              <view class="bar-value">{{ item.total }}人</view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 实时模式切换 -->
      <view 
        class="live-mode-bar"
        :class="{ active: isLiveMode }"
        @click="toggleLiveMode"
      >
        <text class="live-icon">{{ isLiveMode ? '🔴' : '⚪' }}</text>
        <text class="live-text">{{ isLiveMode ? '实时模式（自动刷新）' : '点击开启实时模式' }}</text>
        
        <view v-if="isLiveMode" class="live-indicator">
          <view class="live-dot"></view>
        </view>
      </view>
      
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view class="filter-section">
          <text class="filter-label">进出方向</text>
          
          <view class="filter-options"
003e
            <view 
              class="filter-option"
              :class="{ active: selectedDirection === 'In' }"
              @click="toggleDirection('In')"
            >
              <text>进入</text>
            </view>
            
            <view 
              class="filter-option"
              :class="{ active: selectedDirection === 'Out' }"
              @click="toggleDirection('Out')"
            >
              <text>离开</text>
            </view>
          </view>
        </view>
        
        <view class="filter-section">
          <text class="filter-label">状态</text>
          
          <view class="filter-options">
            <view 
              class="filter-option"
              :class="{ active: selectedStatus === 'Normal' }"
              @click="toggleStatus('Normal')"
            >
              <text>正常</text>
            </view>
            
            <view 
              class="filter-option"
              :class="{ active: selectedStatus === 'Late' }"
              @click="toggleStatus('Late')"
            >
              <text>晚归</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 记录列表 -->
      <view class="log-list">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="logs.length === 0" class="empty-state">
          <text class="empty-icon">🚪</text>
          <text class="empty-text">暂无门禁记录</text>
        </view>
        
        <!-- 列表项 -->
        <view
          v-for="(log, index) in logs"
          :key="log.id"
          class="log-item"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- 方向图标 -->
          <view 
            class="direction-icon"
            :class="log.direction.toLowerCase()"
          >
            <text>{{ getDirectionIcon(log.direction) }}</text>
          </view>
          
          <!-- 内容 -->
          <view class="log-content">
            <view class="log-header">
              <text class="student-name">{{ log.studentName || log.studentId }}</text>
              <view 
                class="status-tag"
                :style="{
                  background: getStatusInfo(log.status).bgColor,
                  color: getStatusInfo(log.status).color
                }"
              >
                {{ getStatusInfo(log.status).label }}
              </view>
            </view>
            
            <view class="log-info">
              <text class="room-number">{{ log.roomNumber }}</text>
              <text class="gate-name">{{ log.gateName }}</text>
            </view>
            
            <view class="log-time">
              <text class="time-text">{{ formatTime(log.timestamp) }}</text>
              <text class="date-text">{{ formatDate(log.timestamp) }}</text>
            </view>
          </view>
        </view>
      </view>
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

/* 统计区域 */
.stats-section {
  margin-bottom: 24rpx;
}

.stats-grid {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  
  &.primary {
    background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
    border-color: #FED7AA;
  }
  
  &.success {
    background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
    border-color: #A7F3D0;
  }
  
  &.warning {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border-color: #FCD34D;
  }
  
  .stat-value {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: #1F2937;
    margin-bottom: 8rpx;
  }
  
  .stat-label {
    font-size: 24rpx;
    color: #6B7280;
  }
}

/* 异常统计 */
.abnormal-stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.abnormal-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  &.late {
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  }
  
  &.absent {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  }
  
  .abnormal-icon {
    font-size: 32rpx;
  }
  
  .abnormal-count {
    font-size: 36rpx;
    font-weight: 700;
    color: #DC2626;
  }
  
  .abnormal-label {
    font-size: 24rpx;
    color: #6B7280;
  }
}

/* 高峰时段 */
.peak-hours {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  
  .title-icon {
    font-size: 32rpx;
  }
  
  .title-text {
    font-size: 28rpx;
    font-weight: 600;
    color: #1F2937;
  }
}

.hour-bars {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hour-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  
  .bar-label {
    width: 80rpx;
    font-size: 24rpx;
    color: #6B7280;
    text-align: right;
  }
  
  .bar-track {
    flex: 1;
    height: 24rpx;
    background: #F3F4F6;
    border-radius: 12rpx;
    overflow: hidden;
    display: flex;
  }
  
  .bar-fill {
    height: 100%;
    
    &.in {
      background: linear-gradient(90deg, #10B981, #34D399);
    }
    
    &.out {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
    }
  }
  
  .bar-value {
    width: 80rpx;
    font-size: 24rpx;
    color: #374151;
    text-align: right;
  }
}

/* 实时模式栏 */
.live-mode-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #F1F5F9;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.live-mode-bar.active {
  background: #FEE2E2;
  border: 2rpx solid #FCA5A5;
}

.live-icon {
  font-size: 28rpx;
}

.live-text {
  flex: 1;
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.live-indicator {
  display: flex;
  align-items: center;
}

.live-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #DC2626;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.filter-label {
  font-size: 26rpx;
  color: #6B7280;
  width: 100rpx;
  flex-shrink: 0;
}

.filter-options {
  display: flex;
  gap: 16rpx;
  flex: 1;
}

.filter-option {
  padding: 12rpx 24rpx;
  background: #F1F5F9;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #64748B;
  transition: all 0.2s ease;
}

.filter-option.active {
  background: #FEF3C7;
  color: #92400E;
  font-weight: 500;
}

/* 记录列表 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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

/* 记录项 */
.log-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  animation: slideIn 0.3s ease both;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.direction-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.direction-icon.in {
  background: #ECFDF5;
}

.direction-icon.out {
  background: #FEF3C7;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.student-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
}

.status-tag {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.log-info {
  display: flex;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.room-number {
  font-size: 26rpx;
  color: #64748B;
}

.gate-name {
  font-size: 26rpx;
  color: #9CA3AF;
}

.log-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #9A3412;
}

.date-text {
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>
