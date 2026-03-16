<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { repairApi } from '@/api/repair.js'
import { handleApiError } from '@/utils/helpers.js'
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

const activeTab = ref('all')
const loading = ref(false)
const repairs = ref([])

// 状态配置 - 新配色
const statusMap = {
  pending: { 
    label: '待处理', 
    color: '#D97706', 
    bgColor: '#FEF3C7',
    icon: '⏳'
  },
  processing: { 
    label: '处理中', 
    color: '#3B82F6', 
    bgColor: '#DBEAFE',
    icon: '🔧'
  },
  completed: { 
    label: '已完成', 
    color: '#059669', 
    bgColor: '#D1FAE5',
    icon: '✅'
  },
  cancelled: { 
    label: '已取消', 
    color: '#64748B', 
    bgColor: '#F1F5F9',
    icon: '🚫'
  }
}

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待处理' },
  { id: 'processing', label: '处理中' },
  { id: 'completed', label: '已完成' }
]

// 转换后端数据为前端格式
const convertRepairData = (data) => {
  if (!data) return []
  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status, // 后端已经转换过了
    location: item.roomNumber || '-', // 映射 roomNumber -> location
    type: item.title ? item.title.split(' ')[0] : '其他', // 从标题推断类型
    createTime: item.date || '-', // 映射 date -> createTime
    priority: item.priority,
    _raw: item
  }))
}

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadRepairs()
})

onMounted(() => {
  if (!checkAuth()) return
  loadRepairs()
})

onPullDownRefresh(() => {
  loadRepairs().finally(() => {
    uni.stopPullDownRefresh()
  })
})

const loadRepairs = async () => {
  loading.value = true
  try {
    const res = await repairApi.getRepairList()
    // 转换后端数据为前端格式
    repairs.value = convertRepairData(res || [])
  } catch (error) {
    handleApiError(error, '获取报修列表失败')
  } finally {
    loading.value = false
  }
}

const filteredRepairs = computed(() => {
  if (activeTab.value === 'all') {
    return repairs.value
  }
  return repairs.value.filter(item => item.status === activeTab.value)
})

const getStatusInfo = (status) => {
  return statusMap[status] || statusMap.pending
}

const switchTab = (tabId) => {
  activeTab.value = tabId
}

const goToDetail = (repair) => {
  uni.navigateTo({
    url: `/pages/repairs/detail?id=${repair.id}`
  })
}

const goToSubmit = () => {
  uni.navigateTo({
    url: '/pages/repairs/submit'
  })
}
</script>

<template>
  <view class="page-container">
    <!-- 背景 -->
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="我的报修" />
    
    <view class="content">
      <!-- 统计卡片 -->
      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-number">{{ repairs.filter(r => r.status === 'pending').length }}</text>
          <text class="stat-label">待处理</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ repairs.filter(r => r.status === 'processing').length }}</text>
          <text class="stat-label">处理中</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ repairs.filter(r => r.status === 'completed').length }}</text>
          <text class="stat-label">已完成</text>
        </view>
      </view>
      
      <!-- 标签切换 -->
      <view class="tab-bar">
        <view 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view v-if="activeTab === tab.id" class="tab-line"></view>
        </view>
      </view>
      
      <!-- 报修列表 -->
      <view class="repair-list">
        <view 
          v-for="(repair, index) in filteredRepairs" 
          :key="repair.id"
          class="repair-item"
          :style="{ animationDelay: `${index * 80}ms` }"
          @click="goToDetail(repair)"
        >
          <!-- 状态指示 -->
          <view 
            class="status-indicator"
            :style="{ background: getStatusInfo(repair.status).color }"
          ></view>
          
          <view class="repair-content">
            <!-- 标题行 -->
            <view class="repair-header">
              <text class="repair-title">{{ repair.title }}</text>
              <view 
                class="status-tag"
                :style="{ 
                  background: getStatusInfo(repair.status).bgColor,
                  color: getStatusInfo(repair.status).color
                }"
              >
                <text>{{ getStatusInfo(repair.status).icon }}</text>
                <text>{{ getStatusInfo(repair.status).label }}</text>
              </view>
            </view>
            
            <!-- 信息行 -->
            <view class="repair-info">
              <view class="info-item">
                <text class="info-icon">📍</text>
                <text class="info-text">{{ repair.location }}</text>
              </view>
              <view class="info-item">
                <text class="info-icon">🔧</text>
                <text class="info-text">{{ repair.type }}</text>
              </view>
            </view>
            
            <!-- 描述 -->
            <text class="repair-desc">{{ repair.description }}</text>
            
            <!-- 时间 -->
            <view class="repair-time">
              <text>🕐 {{ repair.createTime }}</text>
            </view>
          </view>
          
          <!-- 箭头 -->
          <text class="repair-arrow">›</text>
        </view>
        
        <!-- 空状态 -->
        <view v-if="filteredRepairs.length === 0" class="empty-state">
          <text class="empty-icon">🔧</text>
          <text class="empty-text">暂无报修记录</text>
          <text class="empty-hint">点击下方按钮提交报修</text>
        </view>
      </view>
    </view>
    
    <!-- 新建按钮 -->
    <view class="fab-btn" @click="goToSubmit">
      <text class="fab-icon">+</text>
      <text class="fab-text">新建报修</text>
    </view>
    
    <!-- 底部 TabBar -->
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

/* 统计栏 */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: linear-gradient(135deg, #ffffff 0%, #FFFBEB 100%);
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(154, 52, 18, 0.08);
  border: 2rpx solid #F2E6E2;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-number {
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

/* 标签栏 */
.tab-bar {
  display: flex;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  position: relative;
}

.tab-text {
  font-size: 28rpx;
  color: #64748B;
  font-weight: 500;
  transition: color 0.2s ease;
}

.tab-item.active .tab-text {
  color: #9A3412;
  font-weight: 600;
}

.tab-line {
  position: absolute;
  bottom: 0;
  width: 40rpx;
  height: 4rpx;
  background: #9A3412;
  border-radius: 2rpx;
}

/* 报修列表 */
.repair-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.repair-item {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.repair-item:active {
  background: #F8F2F0;
}

.status-indicator {
  width: 8rpx;
  flex-shrink: 0;
}

.repair-content {
  flex: 1;
  padding: 28rpx;
  min-width: 0;
}

.repair-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.repair-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  flex: 1;
  margin-right: 16rpx;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.repair-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  font-size: 24rpx;
  opacity: 0.7;
}

.info-text {
  font-size: 26rpx;
  color: #64748B;
}

.repair-desc {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.repair-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

.repair-arrow {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #C49A8D;
  font-weight: 300;
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
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #9CA3AF;
}

/* 新建按钮 */
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
  animation: fabEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

@keyframes fabEnter {
  0% { opacity: 0; transform: scale(0.8) translateY(20rpx); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
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
