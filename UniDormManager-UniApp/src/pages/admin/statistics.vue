<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { repairApi } from '@/api/repair.js'
import { roomApi } from '@/api/room.js'
import { inspectionApi } from '@/api/inspection.js'
import { handleApiError } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import Chart from '@/components/Chart/Chart.vue'

const userStore = useUserStore()

// 统计数据
const statistics = ref({
  repairStats: {
    pending: 0,
    processing: 0,
    completed: 0,
    total: 0
  },
  inspectionStats: {
    excellent: 0,
    good: 0,
    pass: 0,
    fail: 0
  },
  roomStats: {
    total: 0,
    occupied: 0,
    free: 0
  },
  weeklyData: []
})

const loading = ref(false)

// 生命周期
onShow(() => {
  loadStatistics()
})

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    // 并行加载数据
    const [repairRes, roomRes, inspectionRes] = await Promise.allSettled([
      repairApi.getRepairList(),
      roomApi.getRoomList(),
      inspectionApi.getInspectionList()
    ])
    
    // 处理报修数据
    if (repairRes.status === 'fulfilled') {
      const repairs = repairRes.value || []
      statistics.value.repairStats = {
        pending: repairs.filter(r => r.status === 'pending').length,
        processing: repairs.filter(r => r.status === 'processing').length,
        completed: repairs.filter(r => r.status === 'completed').length,
        total: repairs.length
      }
    }
    
    // 处理房间数据
    if (roomRes.status === 'fulfilled') {
      const rooms = roomRes.value || []
      statistics.value.roomStats = {
        total: rooms.length,
        occupied: rooms.filter(r => r.status === 'occupied' || r.occupied > 0).length,
        free: rooms.filter(r => r.status === 'free' || r.occupied === 0).length
      }
    }
    
    // 处理查寝数据
    if (inspectionRes.status === 'fulfilled') {
      const inspections = inspectionRes.value || []
      statistics.value.inspectionStats = {
        excellent: inspections.filter(i => i.score >= 90).length,
        good: inspections.filter(i => i.score >= 80 && i.score < 90).length,
        pass: inspections.filter(i => i.score >= 60 && i.score < 80).length,
        fail: inspections.filter(i => i.score < 60).length
      }
    }
    
    // 生成模拟周数据（实际应从后端获取）
    generateWeeklyData()
    
  } catch (error) {
    handleApiError(error, '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 生成周数据
const generateWeeklyData = () => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  statistics.value.weeklyData = days.map(day => ({
    name: day,
    value: Math.floor(Math.random() * 20) + 5
  }))
}

// 报修数据（饼图）
const repairPieData = computed(() => [
  { name: '待处理', value: statistics.value.repairStats.pending },
  { name: '处理中', value: statistics.value.repairStats.processing },
  { name: '已完成', value: statistics.value.repairStats.completed }
])

// 查寝数据（饼图）
const inspectionPieData = computed(() => [
  { name: '优秀', value: statistics.value.inspectionStats.excellent },
  { name: '良好', value: statistics.value.inspectionStats.good },
  { name: '合格', value: statistics.value.inspectionStats.pass },
  { name: '不及格', value: statistics.value.inspectionStats.fail }
])

// 周报修趋势（折线图）
const weeklyLineData = computed(() => 
  statistics.value.weeklyData.map(d => d.value)
)

const weeklyXAxis = computed(() => 
  statistics.value.weeklyData.map(d => d.name)
)
</script>

<template>
  <view class="page-container">
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="数据统计" />
    
    <view class="content">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载统计数据...</text>
      </view>
      
      <view v-else class="charts-container">
        <!-- 报修统计 -->
        <view class="stats-card">
          <view class="stats-header">
            <text class="stats-icon">🔧</text>
            <text class="stats-title">报修统计</text>
          </view>
          
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-value warning">{{ statistics.repairStats.pending }}</text>
              <text class="stat-label">待处理</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-value info">{{ statistics.repairStats.processing }}</text>
              <text class="stat-label">处理中</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-value success">{{ statistics.repairStats.completed }}</text>
              <text class="stat-label">已完成</text>
            </view>
          </view>
          
          <!-- 报修分布饼图 -->
          <Chart 
            v-if="statistics.repairStats.total > 0"
            type="pie"
            :data="repairPieData"
            :width="620"
            :height="300"
          />
        </view>
        
        <!-- 查寝统计 -->
        <view class="stats-card">
          <view class="stats-header">
            <text class="stats-icon">⭐</text>
            <text class="stats-title">查寝统计</text>
          </view>
          
          <view class="stats-grid">
            <view class="stat-item">
              <text class="stat-value success">{{ statistics.inspectionStats.excellent }}</text>
              <text class="stat-label">优秀</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-value primary">{{ statistics.inspectionStats.good }}</text>
              <text class="stat-label">良好</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-value warning">{{ statistics.inspectionStats.pass }}</text>
              <text class="stat-label">合格</text>
            </view>
          </view>
          
          <!-- 查寝分布饼图 -->
          <Chart 
            v-if="statistics.inspectionStats.excellent + statistics.inspectionStats.good + statistics.inspectionStats.pass + statistics.inspectionStats.fail > 0"
            type="pie"
            :data="inspectionPieData"
            :width="620"
            :height="300"
          />
        </view>
        
        <!-- 周报修趋势 -->
        <view class="stats-card">
          <view class="stats-header">
            <text class="stats-icon">📈</text>
            <text class="stats-title">本周报修趋势</text>
          </view>
          
          <Chart 
            type="line"
            title="每日报修数量"
            :data="weeklyLineData"
            :xAxis="weeklyXAxis"
            :width="620"
            :height="350"
          />
        </view>
        
        <!-- 房间统计 -->
        <view class="stats-card">
          <view class="stats-header">
            <text class="stats-icon">🏠</text>
            <text class="stats-title">房间统计</text>
          </view>
          
          <view class="room-stats">
            <view class="room-item">
              <text class="room-value">{{ statistics.roomStats.total }}</text>
              <text class="room-label">总房间数</text>
            </view>
            
            <view class="room-item occupied">
              <text class="room-value">{{ statistics.roomStats.occupied }}</text>
              <text class="room-label">已入住</text>
            </view>
            
            <view class="room-item free">
              <text class="room-value">{{ statistics.roomStats.free }}</text>
              <text class="room-label">空闲</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #FFFBEB;
  position: relative;
  padding-bottom: 40rpx;
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

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid #E8D4CD;
  border-top-color: #9A3412;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #64748B;
}

/* 图表容器 */
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 统计卡片 */
.stats-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
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
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #F2E6E2;
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
  color: #1E293B;
}

.stat-value.warning {
  color: #D97706;
}

.stat-value.info {
  color: #3B82F6;
}

.stat-value.success {
  color: #059669;
}

.stat-value.primary {
  color: #9A3412;
}

.stat-label {
  font-size: 26rpx;
  color: #64748B;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #E5E7EB;
}

/* 房间统计 */
.room-stats {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}

.room-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  background: #F9FAFB;
}

.room-item.occupied {
  background: #ECFDF5;
}

.room-item.free {
  background: #DBEAFE;
}

.room-value {
  font-size: 44rpx;
  font-weight: 700;
  color: #1E293B;
}

.room-label {
  font-size: 26rpx;
  color: #64748B;
}
</style>
