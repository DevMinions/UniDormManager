<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { roomSwapApi } from '@/api/roomSwap.js'
import { isDormStaff } from '@/config/roles.js'
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

// 用户角色
const userRoles = computed(() => {
  const roles = userStore.userInfo?.roles || []
  return roles.map(r => typeof r === 'string' ? r : r.code)
})

const isManager = computed(() => isDormStaff(userRoles.value))

// 当前标签页
const activeTab = ref('my') // 'my' | 'pending'

// 加载状态
const loading = ref(false)
const applications = ref([])

// 状态映射
const statusMap = {
  Pending: { label: '待审批', color: '#D97706', bgColor: '#FEF3C7' },
  CounselorApproved: { label: '辅导员已通过', color: '#3B82F6', bgColor: '#DBEAFE' },
  CollegeApproved: { label: '学院已通过', color: '#3B82F6', bgColor: '#DBEAFE' },
  FinalApproved: { label: '已通过', color: '#059669', bgColor: '#D1FAE5' },
  Completed: { label: '已完成', color: '#059669', bgColor: '#D1FAE5' },
  CounselorRejected: { label: '辅导员已拒绝', color: '#DC2626', bgColor: '#FEE2E2' },
  CollegeRejected: { label: '学院已拒绝', color: '#DC2626', bgColor: '#FEE2E2' },
  FinalRejected: { label: '已拒绝', color: '#DC2626', bgColor: '#FEE2E2' },
  Cancelled: { label: '已取消', color: '#64748B', bgColor: '#F1F5F9' }
}

const urgencyMap = {
  Normal: { label: '普通', color: '#64748B' },
  Urgent: { label: '紧急', color: '#D97706' },
  VeryUrgent: { label: '非常紧急', color: '#DC2626' }
}

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadApplications()
})

onPullDownRefresh(() => {
  loadApplications().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载申请列表
const loadApplications = async () => {
  loading.value = true
  try {
    let res
    if (isManager.value && activeTab.value === 'pending') {
      res = await roomSwapApi.getPendingApplications()
    } else {
      res = await roomSwapApi.getMyApplications()
    }
    applications.value = res || []
  } catch (error) {
    handleApiError(error, '获取换寝申请失败')
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
  loadApplications()
}

// 获取状态信息
const getStatusInfo = (status) => {
  return statusMap[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9' }
}

// 获取紧急程度信息
const getUrgencyInfo = (urgency) => {
  return urgencyMap[urgency] || { label: urgency, color: '#64748B' }
}

// 跳转到详情
const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/room-swaps/detail?id=${item.id}`
  })
}

// 跳转到申请页面
const goToApply = () => {
  uni.navigateTo({
    url: '/pages/room-swaps/apply'
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
    
    <AppNavbar title="换寝申请" />
    
    <view class="content">
      <!-- 标签切换（管理员显示） -->
      <view v-if="isManager" class="tab-bar">
        <view 
          class="tab-item"
          :class="{ active: activeTab === 'my' }"
          @click="switchTab('my')"
        >
          <text class="tab-text">我的申请</text>
          <view v-if="activeTab === 'my'" class="tab-line"></view>
        </view>
        <view 
          class="tab-item"
          :class="{ active: activeTab === 'pending' }"
          @click="switchTab('pending')"
        >
          <text class="tab-text">待审批</text>
          <view v-if="activeTab === 'pending'" class="tab-line"></view>
        </view>
      </view>
      
      <!-- 统计卡片 -->
      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-number">{{ applications.filter(a => a.status === 'Pending').length }}</text>
          <text class="stat-label">待审批</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ applications.filter(a => ['FinalApproved', 'Completed'].includes(a.status)).length }}</text>
          <text class="stat-label">已通过</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ applications.length }}</text>
          <text class="stat-label">总计</text>
        </view>
      </view>
      
      <!-- 申请列表 -->
      <view class="application-list">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="applications.length === 0" class="empty-state">
          <text class="empty-icon">🔄</text>
          <text class="empty-text">
            {{ activeTab === 'pending' ? '暂无待审批申请' : '暂无换寝申请' }}
          </text>
          <text v-if="!isManager || activeTab === 'my'" class="empty-hint">
            点击下方按钮提交申请
          </text>
        </view>
        
        <!-- 列表项 -->
        <view
          v-for="(item, index) in applications"
          :key="item.id"
          class="application-item"
          :style="{ animationDelay: `${index * 80}ms` }"
          @click="goToDetail(item)"
        >
          <!-- 状态指示条 -->
          <view 
            class="status-indicator"
            :style="{ background: getStatusInfo(item.status).color }"
          ></view>
          
          <view class="application-content">
            <!-- 头部 -->
            <view class="item-header">
              <view class="room-info">
                <text class="room-change">{{ item.currentRoom }} → {{ item.targetRoom }}</text>
                <view 
                  class="urgency-tag"
                  :style="{ color: getUrgencyInfo(item.urgencyLevel).color }"
                >
                  {{ getUrgencyInfo(item.urgencyLevel).label }}
                </view>
              </view>
              <view 
                class="status-tag"
                :style="{
                  background: getStatusInfo(item.status).bgColor,
                  color: getStatusInfo(item.status).color
                }"
              >
                {{ getStatusInfo(item.status).label }}
              </view>
            </view>
            
            <!-- 原因 -->
            <text class="reason-text">{{ item.reason }}</text>
            
            <!-- 底部信息 -->
            <view class="item-footer">
              <text class="applicant-info">{{ item.applicantName || '我' }}</text>
              <text class="apply-time">{{ item.applyDate || item.createdAt }}</text>
            </view>
          </view>
          
          <!-- 箭头 -->
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 新建按钮（学生显示） -->
    <view v-if="!isManager || activeTab === 'my'" class="fab-btn" @click="goToApply">
      <text class="fab-icon">+</text>
      <text class="fab-text">申请换寝</text>
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

/* 申请列表 */
.application-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.application-item {
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

.application-item:active {
  background: #F8F2F0;
}

.status-indicator {
  width: 8rpx;
  flex-shrink: 0;
}

.application-content {
  flex: 1;
  padding: 28rpx;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.room-change {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.urgency-tag {
  font-size: 22rpx;
  font-weight: 500;
  padding: 4rpx 12rpx;
  background: #F1F5F9;
  border-radius: 8rpx;
}

.status-tag {
  display: flex;
  align-items: center;
  padding: 12rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.reason-text {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.applicant-info {
  font-size: 26rpx;
  color: #64748B;
}

.apply-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

.item-arrow {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #C49A8D;
  font-weight: 300;
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
