<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { inspectionApi } from '@/api/inspection.js'
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

// 当前标签
const activeTab = ref('week') // 'week' | 'month'

// 加载状态
const loading = ref(false)
const rankings = ref([])

// 我的排名
const myRanking = ref(null)

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadRankings()
})

onPullDownRefresh(() => {
  loadRankings().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载排行榜
const loadRankings = async () => {
  loading.value = true
  try {
    const res = await inspectionApi.getRankings({ 
      type: activeTab.value,
      building: '' // 可选：按楼栋筛选
    })
    rankings.value = res || []
    
    // 查找我的排名（如果有）
    // 实际应该根据当前用户的房间号来匹配
    if (rankings.value.length > 0) {
      myRanking.value = rankings.value[0] // 模拟：假设第一个是用户自己
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
  loadRankings()
}

// 获取排名样式
const getRankStyle = (rank) => {
  if (rank === 1) return { color: '#FFD700', bg: '#FEF3C7' } // 金牌
  if (rank === 2) return { color: '#C0C0C0', bg: '#F3F4F6' } // 银牌
  if (rank === 3) return { color: '#CD7F32', bg: '#FDF6F0' } // 铜牌
  return { color: '#64748B', bg: '#F1F5F9' }
}

// 获取分数颜色
const getScoreColor = (score) => {
  if (score >= 95) return '#059669'
  if (score >= 90) return '#10B981'
  if (score >= 80) return '#3B82F6'
  if (score >= 70) return '#D97706'
  return '#DC2626'
}

// 获取分数等级
const getScoreLevel = (score) => {
  if (score >= 95) return '优秀'
  if (score >= 90) return '良好'
  if (score >= 80) return '合格'
  if (score >= 70) return '及格'
  return '不及格'
}

// 跳转到详情
const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/inspections/detail?id=${item.id}`
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
    
    <AppNavbar title="查寝排行榜" />
    
    <view class="content">
      <!-- 标签切换 -->
      <view class="tab-bar">
        <view 
          class="tab-item"
          :class="{ active: activeTab === 'week' }"
          @click="switchTab('week')"
        >
          <text class="tab-text">本周</text>
          <view v-if="activeTab === 'week'" class="tab-line"></view>
        </view>
        <view 
          class="tab-item"
          :class="{ active: activeTab === 'month' }"
          @click="switchTab('month')"
        >
          <text class="tab-text">本月</text>
          <view v-if="activeTab === 'month'" class="tab-line"></view>
        </view>
      </view>
      
      <!-- 我的排名卡片 -->
      <view v-if="myRanking" class="my-ranking-card">
        <view class="my-ranking-header">
          <text class="header-title">🏠 我的宿舍</text>
          <text class="header-room">{{ myRanking.roomNumber }}</text>
        </view>
        
        <view class="my-ranking-stats">
          <view class="stat-item">
            <text class="stat-value" :style="{ color: getRankStyle(myRanking.rank).color }">
              {{ myRanking.rank }}
            </text>
            <text class="stat-label">当前排名</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value" :style="{ color: getScoreColor(myRanking.score) }">
              {{ myRanking.score }}
            </text>
            <text class="stat-label">综合评分</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ getScoreLevel(myRanking.score) }}</text>
            <text class="stat-label">评级</text>
          </view>
        </view>
      </view>
      
      <!-- 排行榜列表 -->
      <view class="ranking-list">
        <view class="list-header">
          <text class="header-icon">🏆</text>
          <text class="header-text">TOP 排行榜</text>
        </view>
        
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="rankings.length === 0" class="empty-state">
          <text class="empty-icon">📊</text>
          <text class="empty-text">暂无排行榜数据</text>
        </view>
        
        <!-- 排行榜项 -->
        <view
          v-for="(item, index) in rankings"
          :key="item.id"
          class="ranking-item"
          :class="{ 'is-mine': item.id === myRanking?.id }"
          :style="{ animationDelay: `${index * 80}ms` }"
          @click="goToDetail(item)"
        >
          <!-- 排名 -->
          <view 
            class="rank-badge"
            :style="{ 
              background: getRankStyle(item.rank).bg,
              color: getRankStyle(item.rank).color 
            }"
          >
            <text v-if="item.rank <= 3" class="rank-icon">
              {{ item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉' }}
            </text>
            <text v-else>{{ item.rank }}</text>
          </view>
          
          <!-- 内容 -->
          <view class="ranking-content">
            <view class="room-info">
              <text class="room-number">{{ item.roomNumber }}</text>
              <text class="building-name">{{ item.building }}</text>
            </view>
            
            <view class="score-info">
              <view class="score-bar">
                <view 
                  class="score-fill"
                  :style="{ 
                    width: `${item.score}%`,
                    background: getScoreColor(item.score)
                  }"
                ></view>
              </view>
              <text class="score-value" :style="{ color: getScoreColor(item.score) }">
                {{ item.score }}分
              </text>
            </view>
          </view>
          
          <!-- 趋势 -->
          <view class="trend-indicator">
            <text v-if="item.rankChange > 0" class="trend-up">↑{{ item.rankChange }}</text>
            <text v-else-if="item.rankChange < 0" class="trend-down">↓{{ Math.abs(item.rankChange) }}</text>
            <text v-else class="trend-flat">-</text>
          </view>
        </view>
      </view>
      
      <!-- 底部说明 -->
      <view class="footer-tips">
        <text class="tips-icon">💡</text>
        <text class="tips-text">排行榜根据查寝评分综合计算，每周/月更新一次</text>
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

/* 我的排名卡片 */
.my-ranking-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #FCD34D;
  box-shadow: 0 4rpx 20rpx rgba(217, 119, 6, 0.15);
}

.my-ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx dashed rgba(217, 119, 6, 0.3);
}

.header-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #92400E;
}

.header-room {
  font-size: 32rpx;
  font-weight: 700;
  color: #78350F;
}

.my-ranking-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.my-ranking-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.my-ranking-stats .stat-value {
  font-size: 48rpx;
  font-weight: 700;
}

.my-ranking-stats .stat-label {
  font-size: 24rpx;
  color: #78350F;
}

.my-ranking-stats .stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(217, 119, 6, 0.3);
}

/* 排行榜列表 */
.ranking-list {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #F2E6E2;
}

.header-icon {
  font-size: 36rpx;
}

.header-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
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
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #64748B;
}

/* 排行榜项 */
.ranking-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F2E6E2;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.is-mine {
  background: #FEF3C7;
  margin: 0 -16rpx;
  padding-left: 16rpx;
  padding-right: 16rpx;
  border-radius: 16rpx;
}

.rank-badge {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-icon {
  font-size: 36rpx;
}

.ranking-content {
  flex: 1;
  min-width: 0;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.room-number {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.building-name {
  font-size: 24rpx;
  color: #64748B;
  background: #F1F5F9;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.score-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.score-bar {
  flex: 1;
  height: 8rpx;
  background: #E5E7EB;
  border-radius: 4rpx;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.5s ease;
}

.score-value {
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 80rpx;
  text-align: right;
}

.trend-indicator {
  width: 60rpx;
  text-align: center;
}

.trend-up {
  font-size: 24rpx;
  color: #059669;
  font-weight: 600;
}

.trend-down {
  font-size: 24rpx;
  color: #DC2626;
  font-weight: 600;
}

.trend-flat {
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 底部说明 */
.footer-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 32rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16rpx;
}

.tips-icon {
  font-size: 28rpx;
}

.tips-text {
  font-size: 24rpx;
  color: #64748B;
}
</style>
