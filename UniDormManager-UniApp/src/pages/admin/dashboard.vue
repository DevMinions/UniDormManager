<script setup>
import { ref, computed, onMounted } from 'vue'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 统计数据
const statistics = ref({
  totalStudents: 1248,
  occupancyRate: 87.5,
  pendingRepairs: 23,
  monthlyNotices: 12
})

// 入住率趋势数据（最近6个月）
const occupancyTrend = ref([
  { month: '1月', rate: 82 },
  { month: '2月', rate: 85 },
  { month: '3月', rate: 86 },
  { month: '4月', rate: 84 },
  { month: '5月', rate: 87 },
  { month: '6月', rate: 87.5 }
])

// 报修类型分布
const repairTypes = ref([
  { type: '水电故障', count: 45, color: '#c46f43' },
  { type: '门窗损坏', count: 32, color: '#7a8f63' },
  { type: '家具维修', count: 28, color: '#c4a77d' },
  { type: '网络问题', count: 18, color: '#7da3c4' },
  { type: '其他', count: 12, color: '#9a958d' }
])

// 快捷入口
const quickActions = [
  { icon: '👤', label: '用户管理', desc: '管理学生/宿管账号', path: '/pages/admin/users', color: '#e8ece4' },
  { icon: '🏢', label: '楼栋管理', desc: '管理宿舍楼栋信息', path: '/pages/buildings/list', color: '#dbeafe' },
  { icon: '🔐', label: '角色权限', desc: '配置角色和权限', path: '/pages/roles/list', color: '#fef3c7' },
  { icon: '⚙️', label: '系统配置', desc: '系统参数设置', path: '/pages/admin/settings', color: '#ede9fe' },
  { icon: '🏠', label: '房间管理', desc: '查看房间分配情况', path: '/pages/rooms/list', color: '#f5e5d5' },
  { icon: '🔧', label: '报修管理', desc: '处理待办维修工单', path: '/pages/repairs/list', color: '#fce7f3' },
  { icon: '📋', label: '公告管理', desc: '发布宿舍公告通知', path: '/pages/notices/list', color: '#d1fae5' },
  { icon: '📊', label: '数据统计', desc: '查看详细统计数据', path: '/pages/admin/statistics', color: '#fee2e2' }
]

// 计算报修总数
const totalRepairs = computed(() => {
  return repairTypes.value.reduce((sum, item) => sum + item.count, 0)
})

// 计算图表高度
const getTrendHeight = (rate) => {
  return `${rate}%`
}

// 计算报修类型占比
const getRepairPercentage = (count) => {
  return Math.round((count / totalRepairs.value) * 100)
}

// 导航到页面
const navigateTo = (path) => {
  uni.navigateTo({ url: path })
}

// 刷新数据
const refreshData = async () => {
  uni.showLoading({ title: '加载中...' })
  // 模拟数据加载
  await new Promise(resolve => setTimeout(resolve, 1000))
  uni.hideLoading()
  uni.showToast({ title: '已刷新', icon: 'success' })
}

onMounted(() => {
  // 页面加载时的初始化
})
</script>

<template>
  <view class="dashboard-page">
    <AppNavbar title="管理后台" :show-back="true" />
    
    <view class="page-content">
      <!-- 统计概览卡片 -->
      <view class="stats-overview">
        <view class="stats-header">
          <view class="header-title">
            <text class="title-icon">📊</text>
            <text class="title-text">数据概览</text>
          </view>
          <view class="refresh-btn" @click="refreshData">
            <text>🔄</text>
          </view>
        </view>
        
        <view class="stats-grid">
          <view class="stat-card primary">
            <view class="stat-icon">👥</view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.totalStudents }}</text>
              <text class="stat-label">总学生数</text>
            </view>
          </view>
          
          <view class="stat-card success">
            <view class="stat-icon">🏠</view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.occupancyRate }}%</text>
              <text class="stat-label">入住率</text>
            </view>
          </view>
          
          <view class="stat-card warning">
            <view class="stat-icon">🔧</view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.pendingRepairs }}</text>
              <text class="stat-label">待处理报修</text>
            </view>
          </view>
          
          <view class="stat-card info">
            <view class="stat-icon">📢</view>
            <view class="stat-info">
              <text class="stat-value">{{ statistics.monthlyNotices }}</text>
              <text class="stat-label">本月公告</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 入住率趋势 -->
      <view class="chart-card">
        <view class="card-header">
          <text class="card-title">📈 入住率趋势</text>
          <text class="card-subtitle">最近6个月</text>
        </view>
        
        <view class="trend-chart">
          <view class="chart-y-axis">
            <text class="y-label">100%</text>
            <text class="y-label">75%</text>
            <text class="y-label">50%</text>
            <text class="y-label">25%</text>
            <text class="y-label">0%</text>
          </view>
          
          <view class="chart-content">
            <view class="grid-lines">
              <view class="grid-line"></view>
              <view class="grid-line"></view>
              <view class="grid-line"></view>
              <view class="grid-line"></view>
            </view>
            
            <view class="bars-container">
              <view 
                v-for="(item, index) in occupancyTrend" 
                :key="index"
                class="bar-wrapper"
              >
                <view class="bar">
                  <view 
                    class="bar-fill"
                    :style="{ height: getTrendHeight(item.rate) }"
                  ></view>
                </view>
                <text class="bar-label">{{ item.month }}</text>
                <text class="bar-value">{{ item.rate }}%</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 报修类型分布 -->
      <view class="chart-card">
        <view class="card-header">
          <text class="card-title">📊 报修类型分布</text>
          <text class="card-subtitle">本月统计</text>
        </view>
        
        <view class="repair-stats">
          <view class="repair-list">
            <view 
              v-for="(item, index) in repairTypes" 
              :key="index"
              class="repair-item"
            >
              <view class="repair-info">
                <view class="repair-dot" :style="{ background: item.color }"></view>
                <text class="repair-type">{{ item.type }}</text>
              </view>
              
              <view class="repair-data">
                <text class="repair-count">{{ item.count }}件</text>
                <view class="repair-bar">
                  <view 
                    class="repair-progress"
                    :style="{ width: getRepairPercentage(item.count) + '%', background: item.color }"
                  ></view>
                </view>
              </view>
            </view>
          </view>
          
          <view class="repair-summary">
            <text class="summary-label">本月报修总计</text>
            <text class="summary-value">{{ totalRepairs }}</text>
            <text class="summary-unit">件</text>
          </view>
        </view>
      </view>
      
      <!-- 快捷入口 -->
      <view class="quick-actions">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>快捷入口</text>
        </view>
        
        <view class="actions-grid">
          <view 
            v-for="(action, index) in quickActions" 
            :key="index"
            class="action-card"
            @click="navigateTo(action.path)"
          >
            <view class="action-icon-wrapper" :style="{ background: action.color }">
              <text class="action-icon">{{ action.icon }}</text>
            </view>
            <view class="action-content">
              <text class="action-label">{{ action.label }}</text>
              <text class="action-desc">{{ action.desc }}</text>
            </view>
            <text class="action-arrow">›</text>
          </view>
        </view>
      </view>
      
      <!-- 底部信息 -->
      <view class="footer-info">
        <text>UniDormManager 管理系统</text>
        <text class="footer-sub">数据每小时自动更新</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 40px;
}

.page-content {
  padding: 20px;
}

// 统计概览
.stats-overview {
  background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: $shadow-md;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-title {
  display: flex;
  align-items: center;
}

.title-icon {
  font-size: 20px;
  margin-right: 8px;
}

.title-text {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: $shadow-sm;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-card.primary .stat-icon {
  background: $sage-100;
}

.stat-card.success .stat-icon {
  background: rgba(107, 142, 107, 0.15);
}

.stat-card.warning .stat-icon {
  background: rgba(196, 167, 125, 0.15);
}

.stat-card.info .stat-icon {
  background: rgba(125, 163, 196, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 2px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: $text-tertiary;
}

// 图表卡片
.chart-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: $text-primary;
}

.card-subtitle {
  font-size: 13px;
  color: $text-tertiary;
}

// 趋势图表
.trend-chart {
  display: flex;
  height: 200px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 10px;
  padding-bottom: 30px;
}

.y-label {
  font-size: 11px;
  color: $text-tertiary;
  text-align: right;
}

.chart-content {
  flex: 1;
  position: relative;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  height: 1px;
  background: $warm-gray-100;
}

.bars-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding-bottom: 30px;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar {
  width: 24px;
  height: 170px;
  background: $warm-gray-100;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, $sage-400 0%, $sage-500 100%);
  border-radius: 12px;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 12px;
  color: $text-tertiary;
  margin-top: 8px;
}

.bar-value {
  font-size: 11px;
  color: $sage-500;
  font-weight: 500;
  margin-top: 4px;
}

// 报修统计
.repair-stats {
  display: flex;
  gap: 20px;
}

.repair-list {
  flex: 1;
}

.repair-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.repair-info {
  display: flex;
  align-items: center;
  width: 80px;
  flex-shrink: 0;
}

.repair-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.repair-type {
  font-size: 13px;
  color: $text-secondary;
}

.repair-data {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.repair-count {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
  width: 50px;
  text-align: right;
  flex-shrink: 0;
}

.repair-bar {
  flex: 1;
  height: 8px;
  background: $warm-gray-100;
  border-radius: 4px;
  overflow: hidden;
}

.repair-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.repair-summary {
  width: 100px;
  background: $sage-50;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-label {
  font-size: 12px;
  color: $text-tertiary;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 32px;
  font-weight: 600;
  color: $sage-500;
}

.summary-unit {
  font-size: 12px;
  color: $text-tertiary;
  margin-top: 4px;
}

// 快捷入口
.quick-actions {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: $sage-600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: $sage-500;
  border-radius: 2px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.action-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.action-icon {
  font-size: 22px;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.action-desc {
  display: block;
  font-size: 12px;
  color: $text-tertiary;
}

.action-arrow {
  font-size: 20px;
  color: $warm-gray-400;
  font-weight: 300;
}

// 底部信息
.footer-info {
  text-align: center;
  padding: 20px 0;
  
  text {
    display: block;
    font-size: 13px;
    color: $text-tertiary;
    margin-bottom: 4px;
  }
}

.footer-sub {
  font-size: 11px !important;
  color: $warm-gray-400 !important;
}
</style>
