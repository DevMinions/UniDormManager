<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { isAdmin, isLogisticsAdmin } from '@/config/roles.js'
import { handleApiError } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 权限检查
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isAdmin(roles) && !isLogisticsAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 加载状态
const loading = ref(true)

// 时间范围
const timeRange = ref('week') // day/week/month/year

// 核心指标
const kpis = ref({
  totalStudents: 1200,
  occupancyRate: 92,
  totalRepairs: 86,
  avgScore: 88.5,
  lateReturns: 12,
  alerts: 3
})

// 入住率趋势
const occupancyTrend = ref([
  { date: '周一', rate: 90 },
  { date: '周二', rate: 91 },
  { date: '周三', rate: 91 },
  { date: '周四', rate: 92 },
  { date: '周五', rate: 92 },
  { date: '周六', rate: 93 },
  { date: '周日', rate: 92 }
])

// 报修类型分布
const repairDistribution = ref([
  { type: '水电', count: 35, color: '#3B82F6' },
  { type: '家具', count: 28, color: '#10B981' },
  { type: '门窗', count: 12, color: '#F59E0B' },
  { type: '网络', count: 8, color: '#8B5CF6' },
  { type: '其他', count: 3, color: '#6B7280' }
])

// 查寝评分分布
const inspectionDistribution = ref([
  { range: '90-100', label: '优秀', count: 45, color: '#059669' },
  { range: '80-89', label: '良好', count: 32, color: '#3B82F6' },
  { range: '70-79', label: '一般', count: 15, color: '#F59E0B' },
  { range: '60-69', label: '及格', count: 5, color: '#D97706' },
  { range: '0-59', label: '不及格', count: 3, color: '#DC2626' }
])

// 楼栋入住率
const buildingOccupancy = ref([
  { name: 'A栋', rate: 95, total: 240, occupied: 228 },
  { name: 'B栋', rate: 88, total: 240, occupied: 211 },
  { name: 'C栋', rate: 92, total: 240, occupied: 221 },
  { name: 'D栋', rate: 94, total: 240, occupied: 226 },
  { name: 'E栋', rate: 90, total: 240, occupied: 216 }
])

// 晚归趋势
const lateReturnTrend = ref([
  { date: '周一', count: 2 },
  { date: '周二', count: 3 },
  { date: '周三', count: 1 },
  { date: '周四', count: 4 },
  { date: '周五', count: 5 },
  { date: '周六', count: 3 },
  { date: '周日', count: 2 }
])

// 实时数据（模拟）
const realtimeData = ref({
  todayCheckins: 450,
  todayCheckouts: 380,
  onlineUsers: 56,
  pendingRepairs: 8
})

// 页面加载
onShow(() => {
  if (!checkAuth()) return
  loadDashboardData()
})

// 加载数据
const loadDashboardData = async () => {
  loading.value = true
  try {
    // 实际项目中调用 API
    // const res = await dashboardApi.getData({ timeRange: timeRange.value })
    // 使用模拟数据
    setTimeout(() => {
      loading.value = false
    }, 500)
  } catch (error) {
    handleApiError(error, '加载数据失败')
    loading.value = false
  }
}

// 切换时间范围
const switchTimeRange = (range) => {
  timeRange.value = range
  loadDashboardData()
}

// 获取趋势颜色
const getTrendColor = (current, previous) => {
  if (current > previous) return '#059669'
  if (current < previous) return '#DC2626'
  return '#6B7280'
}

// 获取趋势图标
const getTrendIcon = (current, previous) => {
  if (current > previous) return '↑'
  if (current < previous) return '↓'
  return '→'
}

// 跳转到详情
const navigateTo = (url) => {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="数据大屏" show-back />
    
    <view class="content">
      <!-- 时间范围选择 -->
      <view class="time-range-bar">
        <view
          v-for="range in ['day', 'week', 'month', 'year']"
          :key="range"
          class="range-item"
          :class="{ active: timeRange === range }"
          @click="switchTimeRange(range)"
        >
          <text>
            {{ range === 'day' ? '今日' : 
               range === 'week' ? '本周' : 
               range === 'month' ? '本月' : '本年' }}
          </text>
        </view>
      </view>
      
      <!-- 核心指标卡片 -->
      <view class="kpi-section">
        <view class="kpi-grid">
          <view class="kpi-card primary" @click="navigateTo('/pages/admin/users')">
            <view class="kpi-header">
              <text class="kpi-icon">👨‍🎓</text>
              <text class="kpi-trend" :style="{ color: '#059669' }">↑ 5%</text>
            </view>
            <text class="kpi-value">{{ kpis.totalStudents }}</text>
            <text class="kpi-label">在住学生</text>
          </view>
          
          <view class="kpi-card success" @click="navigateTo('/pages/buildings/list')"
          >
            <view class="kpi-header">
              <text class="kpi-icon">🏠</text>
              <text class="kpi-trend" :style="{ color: '#059669' }">↑ 2%</text>
            </view>
            <text class="kpi-value">{{ kpis.occupancyRate }}%</text>
            <text class="kpi-label">入住率</text>
          </view>
          
          <view class="kpi-card warning" @click="navigateTo('/pages/repairs/list')"
          >
            <view class="kpi-header">
              <text class="kpi-icon">🔧</text>
              <text class="kpi-trend" :style="{ color: '#DC2626' }">↓ 8%</text>
            </view>
            <text class="kpi-value">{{ kpis.totalRepairs }}</text>
            <text class="kpi-label">本月报修</text>
          </view>
          
          <view class="kpi-card info" @click="navigateTo('/pages/inspections/rankings')"
          >
            <view class="kpi-header">
              <text class="kpi-icon">📋</text>
              <text class="kpi-trend" :style="{ color: '#059669' }">↑ 1.2</text>
            </view>
            <text class="kpi-value">{{ kpis.avgScore }}</text>
            <text class="kpi-label">平均评分</text>
          </view>
        </view>
      </view>
      
      <!-- 图表区域 -->
      <view class="charts-section">
        <!-- 入住率趋势 -->
        <view class="chart-card">
          <view class="chart-header">
            <text class="chart-title">📈 入住率趋势</text>
            <text class="chart-value">平均 91.4%</text>
          </view>
          <view class="trend-chart">
            <view class="trend-bars"
003e
              <view
                v-for="(item, index) in occupancyTrend"
                :key="index"
                class="trend-bar-item"
              >
                <view class="bar-wrapper"
003e
                  <view
                    class="bar-fill"
                    :style="{ height: item.rate + '%', backgroundColor: item.rate >= 90 ? '#059669' : '#F59E0B' }"
                  ></view>
                </view>
                <text class="bar-label">{{ item.date }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 报修类型分布 -->
        <view class="chart-card"
003e
          <view class="chart-header"
003e
            <text class="chart-title">🔧 报修类型分布</text>
            <text class="chart-value">共 {{ repairDistribution.reduce((a,b) => a + b.count, 0) }} 单</text>
          </view>
          
          <view class="distribution-chart">
            <view
              v-for="item in repairDistribution"
              :key="item.type"
              class="dist-item"
            >
              <view class="dist-color" :style="{ backgroundColor: item.color }"></view>
              <view class="dist-info">
                <text class="dist-name">{{ item.type }}</text>
                <view class="dist-bar-wrapper">
                  <view
                    class="dist-bar"
                    :style="{
                      width: (item.count / Math.max(...repairDistribution.map(d => d.count)) * 100) + '%',
                      backgroundColor: item.color
                    }"
                  ></view>
                </view>
              </view>
              <text class="dist-count">{{ item.count }}</text>
            </view>
          </view>
        </view>
        
        <!-- 查寝评分分布 -->
        <view class="chart-card">
          <view class="chart-header">
            <text class="chart-title">📊 查寝评分分布</text>
            <text class="chart-value">共 {{ inspectionDistribution.reduce((a,b) => a + b.count, 0) }} 间</text>
          </view>
          
          <view class="score-distribution">
            <view
              v-for="item in inspectionDistribution"
              :key="item.range"
              class="score-item"
              :style="{ backgroundColor: item.color + '20', borderLeftColor: item.color }"
            >
              <view class="score-info">
                <text class="score-range" :style="{ color: item.color }">{{ item.label }}</text>
                <text class="score-text">{{ item.range }}分</text>
              </view>
              <text class="score-count">{{ item.count }} 间</text>
            </view>
          </view>
        </view>
        
        <!-- 楼栋入住率 -->
        <view class="chart-card">
          <view class="chart-header">
            <text class="chart-title">🏢 楼栋入住率</text>
          </view>
          
          <view class="building-list">
            <view
              v-for="building in buildingOccupancy"
              :key="building.name"
              class="building-item"
            >
              <view class="building-info">
                <text class="building-name">{{ building.name }}</text>
                <text class="building-detail">{{ building.occupied }}/{{ building.total }} 人</text>
              </view>
              
              <view class="building-bar-wrapper">
                <view
                  class="building-bar"
                  :style="{
                    width: building.rate + '%',
                    backgroundColor: building.rate >= 90 ? '#059669' : building.rate >= 80 ? '#3B82F6' : '#F59E0B'
                  }"
                ></view>
              </view>
              
              <text class="building-rate" :style="{
                color: building.rate >= 90 ? '#059669' : building.rate >= 80 ? '#3B82F6' : '#F59E0B'
              }">{{ building.rate }}%</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 实时数据 -->
      <view class="realtime-section">
        <view class="section-title">
          <text class="title-icon">⚡</text>
          <text class="title-text">实时数据</text>
          <view class="live-indicator">
            <view class="live-dot"></view>
            <text class="live-text">LIVE</text>
          </view>
        </view>
        
        <view class="realtime-grid">
          <view class="realtime-card">
            <text class="rt-icon">🚪</text>
            <text class="rt-value">{{ realtimeData.todayCheckins }}</text>
            <text class="rt-label">今日进入</text>
          </view>
          
          <view class="realtime-card">
            <text class="rt-icon">🏃</text>
            <text class="rt-value">{{ realtimeData.todayCheckouts }}</text>
            <text class="rt-label">今日离开</text>
          </view>
          
          <view class="realtime-card">
            <text class="rt-icon">👥</text>
            <text class="rt-value">{{ realtimeData.onlineUsers }}</text>
            <text class="rt-label">在线用户</text>
          </view>
          
          <view class="realtime-card alert">
            <text class="rt-icon">🔧</text>
            <text class="rt-value">{{ realtimeData.pendingRepairs }}</text>
            <text class="rt-label">待处理报修</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 40rpx;
}

.content {
  padding: 24rpx;
}

// 时间范围选择
.time-range-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  
  .range-item {
    flex: 1;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 20rpx;
    text-align: center;
    font-size: 28rpx;
    color: #6B7280;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    
    &.active {
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      color: #FFFFFF;
      font-weight: 600;
    }
  }
}

// 核心指标
.kpi-section {
  margin-bottom: 24rpx;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.kpi-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border-left: 6rpx solid;
  
  &.primary { border-left-color: #9A3412; }
  &.success { border-left-color: #059669; }
  &.warning { border-left-color: #F59E0B; }
  &.info { border-left-color: #3B82F6; }
  
  .kpi-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
    
    .kpi-icon {
      font-size: 40rpx;
    }
    
    .kpi-trend {
      font-size: 24rpx;
      font-weight: 600;
    }
  }
  
  .kpi-value {
    display: block;
    font-size: 48rpx;
    font-weight: 700;
    color: #1F2937;
    margin-bottom: 8rpx;
  }
  
  .kpi-label {
    font-size: 26rpx;
    color: #6B7280;
  }
}

// 图表区域
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    
    .chart-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #1F2937;
    }
    
    .chart-value {
      font-size: 26rpx;
      color: #9A3412;
      font-weight: 500;
    }
  }
}

// 趋势图表
.trend-chart {
  height: 200rpx;
  
  .trend-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 100%;
    
    .trend-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      
      .bar-wrapper {
        width: 40rpx;
        height: 160rpx;
        background: #F3F4F6;
        border-radius: 8rpx;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        
        .bar-fill {
          width: 100%;
          border-radius: 8rpx;
          transition: height 0.3s ease;
        }
      }
      
      .bar-label {
        font-size: 24rpx;
        color: #6B7280;
        margin-top: 12rpx;
      }
    }
  }
}

// 分布图表
.distribution-chart {
  .dist-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .dist-color {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .dist-info {
      flex: 1;
      
      .dist-name {
        display: block;
        font-size: 26rpx;
        color: #1F2937;
        margin-bottom: 8rpx;
      }
      
      .dist-bar-wrapper {
        height: 12rpx;
        background: #F3F4F6;
        border-radius: 6rpx;
        overflow: hidden;
        
        .dist-bar {
          height: 100%;
          border-radius: 6rpx;
          transition: width 0.3s ease;
        }
      }
    }
    
    .dist-count {
      font-size: 28rpx;
      font-weight: 600;
      color: #1F2937;
      min-width: 60rpx;
      text-align: right;
    }
  }
}

// 评分分布
.score-distribution {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx;
  
  .score-item {
    background: #F9FAFB;
    border-radius: 16rpx;
    padding: 20rpx 12rpx;
    text-align: center;
    border-left: 4rpx solid;
    
    .score-info {
      margin-bottom: 12rpx;
      
      .score-range {
        display: block;
        font-size: 26rpx;
        font-weight: 600;
        margin-bottom: 4rpx;
      }
      
      .score-text {
        font-size: 20rpx;
        color: #9CA3AF;
      }
    }
    
    .score-count {
      font-size: 32rpx;
      font-weight: 700;
      color: #1F2937;
    }
  }
}

// 楼栋列表
.building-list {
  .building-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .building-info {
      width: 140rpx;
      
      .building-name {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 4rpx;
      }
      
      .building-detail {
        font-size: 22rpx;
        color: #9CA3AF;
      }
    }
    
    .building-bar-wrapper {
      flex: 1;
      height: 16rpx;
      background: #F3F4F6;
      border-radius: 8rpx;
      overflow: hidden;
      
      .building-bar {
        height: 100%;
        border-radius: 8rpx;
        transition: width 0.3s ease;
      }
    }
    
    .building-rate {
      width: 80rpx;
      font-size: 28rpx;
      font-weight: 600;
      text-align: right;
    }
  }
}

// 实时数据
.realtime-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
    
    .title-icon {
      font-size: 32rpx;
    }
    
    .title-text {
      flex: 1;
      font-size: 30rpx;
      font-weight: 600;
      color: #1F2937;
    }
    
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: #FEE2E2;
      padding: 8rpx 16rpx;
      border-radius: 12rpx;
      
      .live-dot {
        width: 16rpx;
        height: 16rpx;
        background: #DC2626;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      .live-text {
        font-size: 22rpx;
        font-weight: 600;
        color: #DC2626;
      }
    }
  }
}

.realtime-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.realtime-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  
  &.alert {
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  }
  
  .rt-icon {
    display: block;
    font-size: 40rpx;
    margin-bottom: 12rpx;
  }
  
  .rt-value {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #1F2937;
    margin-bottom: 8rpx;
  }
  
  .rt-label {
    font-size: 24rpx;
    color: #6B7280;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
