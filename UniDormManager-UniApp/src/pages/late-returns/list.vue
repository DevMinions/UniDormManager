<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { lateReturnApi } from '@/api/lateReturn.js'
import { isDormStaff } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
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

// 当前标签
const activeTab = ref('all') // 'all' | 'pending' | 'handled'

// 筛选条件
const selectedStatus = ref('') // '' | 'Pending' | 'Handled' | 'Ignored'
const selectedDate = ref('') // 日期筛选

// 搜索关键词
const searchKeyword = ref('')

// 筛选后的列表
const filteredAlerts = computed(() => {
  let result = alerts.value
  
  // 按状态筛选
  if (selectedStatus.value) {
    result = result.filter(a => a.status === selectedStatus.value)
  }
  
  // 按日期筛选
  if (selectedDate.value) {
    result = result.filter(a => a.alertDate === selectedDate.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(a => 
      (a.studentName && a.studentName.toLowerCase().includes(keyword)) ||
      (a.roomNumber && a.roomNumber.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

// 统计信息
const statistics = computed(() => {
  const total = alerts.value.length
  const pending = alerts.value.filter(a => a.status === 'Pending').length
  const handled = alerts.value.filter(a => a.status === 'Handled').length
  const ignored = alerts.value.filter(a => a.status === 'Ignored').length
  
  return { total, pending, handled, ignored }
})
const loading = ref(false)
const alerts = ref([])

// 状态映射
const statusMap = {
  Pending: { label: '待处理', color: '#D97706', bgColor: '#FEF3C7' },
  Handled: { label: '已处理', color: '#059669', bgColor: '#D1FAE5' },
  Ignored: { label: '已忽略', color: '#64748B', bgColor: '#F1F5F9' }
}

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadAlerts()
})

onPullDownRefresh(() => {
  loadAlerts().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 加载告警列表
const loadAlerts = async () => {
  loading.value = true
  try {
    let res
    if (isManager.value && activeTab.value === 'pending') {
      res = await lateReturnApi.getPendingLateReturns()
    } else {
      res = await lateReturnApi.getLateReturns({ status: activeTab.value === 'all' ? '' : activeTab.value })
    }
    alerts.value = res || []
  } catch (error) {
    handleApiError(error, '获取晚归告警失败')
  } finally {
    loading.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
  loadAlerts()
}

// 获取状态信息
const getStatusInfo = (status) => {
  return statusMap[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9' }
}

// 处理告警（管理员）
const handleAlert = async (alert, action) => {
  try {
    await lateReturnApi.handleLateReturn(alert.id, {
      status: action,
      comment: action === 'Handled' ? '已确认并处理' : '已忽略'
    })
    showSuccess(action === 'Handled' ? '已处理' : '已忽略')
    loadAlerts()
  } catch (error) {
    handleApiError(error, '处理失败')
  }
}

// 查看详情
const viewDetail = (alert) => {
  uni.showModal({
    title: '晚归详情',
    content: `学生：${alert.studentName}\n房间：${alert.roomNumber}\n日期：${alert.alertDate}\n状态：${getStatusInfo(alert.status).label}${alert.handler ? '\n处理人：' + alert.handler : ''}${alert.comment ? '\n备注：' + alert.comment : ''}`,
    showCancel: false
  })
}

// 通知设置
const notificationSettings = ref({
  enabled: true,
  pushEnabled: true,
  soundEnabled: true,
  vibrateEnabled: true
})

// 加载通知设置
const loadNotificationSettings = () => {
  try {
    const saved = uni.getStorageSync('late_return_notifications')
    if (saved) {
      notificationSettings.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载通知设置失败', e)
  }
}

// 保存通知设置
const saveNotificationSettings = () => {
  try {
    uni.setStorageSync('late_return_notifications', JSON.stringify(notificationSettings.value))
    showSuccess('设置已保存')
  } catch (e) {
    console.error('保存通知设置失败', e)
  }
}

// 切换通知开关
const toggleNotification = (key) => {
  notificationSettings.value[key] = !notificationSettings.value[key]
  saveNotificationSettings()
}

// 发送测试通知
const sendTestNotification = () => {
  if (!notificationSettings.value.enabled) {
    uni.showToast({ title: '请先开启通知', icon: 'none' })
    return
  }
  
  // 模拟推送通知
  uni.showModal({
    title: '测试通知',
    content: '这是一条晚归告警测试通知',
    success: (res) => {
      if (res.confirm) {
        // 实际项目中这里调用推送 API
        uni.showToast({ title: '通知已发送', icon: 'success' })
      }
    }
  })
}

// 显示通知设置
const showNotificationSettings = () => {
  loadNotificationSettings()
  uni.navigateTo({
    url: '/pages/late-returns/notification-settings'
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-container">
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="晚归告警" />
    
    <!-- 通知设置入口 -->
    <view class="notification-bar" v-if="isManager" @click="showNotificationSettings">
      <view class="notification-info">
        <text class="notification-icon">🔔</text>
        <text class="notification-text">推送通知</text>
        <text class="notification-status" :class="{ active: notificationSettings.enabled }">
          {{ notificationSettings.enabled ? '已开启' : '已关闭' }}
        </text>
      </view>
      <text class="notification-arrow">›</text>
    </view>
    
    <view class="content">
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stats-header">
          <text class="stats-icon">⏰</text>
          <text class="stats-title">晚归统计</text>
        </view>
        
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value warning">{{ statistics.pending }}</text>
            <text class="stat-label">待处理</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ statistics.handled }}</text>
            <text class="stat-label">已处理</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ statistics.total }}</text>
            <text class="stat-label">总计</text>
          </view>
        </view>
      </view>
      
      <!-- 标签切换 -->
      <view class="tab-bar">
        <view 
          v-for="tab in [
            { id: 'all', label: '全部' },
            { id: 'pending', label: '待处理' },
            { id: 'handled', label: '已处理' }
          ]"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view v-if="activeTab === tab.id" class="tab-line"></view>
        </view>
      </view>
      
      <!-- 告警列表 -->
      <view class="alert-list">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="alerts.length === 0" class="empty-state">
          <text class="empty-icon">🌙</text>
          <text class="empty-text">{{ activeTab === 'all' ? '暂无晚归记录' : '暂无记录' }}</text>
        </view>
        
        <!-- 列表项 -->
        <view
          v-for="(alert, index) in alerts"
          :key="alert.id"
          class="alert-item"
          :style="{ animationDelay: `${index * 80}ms` }"
        >
          <view class="alert-content" @click="viewDetail(alert)">
            <!-- 头部 -->
            <view class="alert-header">
              <view class="student-info">
                <text class="student-name">{{ alert.studentName }}</text>
                <text class="room-number">{{ alert.roomNumber }}</text>
              </view>
              
              <view 
                class="status-tag"
                :style="{
                  background: getStatusInfo(alert.status).bgColor,
                  color: getStatusInfo(alert.status).color
                }"
              >
                {{ getStatusInfo(alert.status).label }}
              </view>
            </view>
            
            <!-- 详情 -->
            <view class="alert-details">
              <view class="detail-item">
                <text class="detail-label">告警日期</text>
                <text class="detail-value">{{ alert.alertDate }}</text>
              </view>
              
              <view v-if="alert.lastEntry" class="detail-item">
                <text class="detail-label">最后进门</text>
                <text class="detail-value">{{ alert.lastEntry }}</text>
              </view>
            </view>
            
            <!-- 处理信息 -->
            <view v-if="alert.handler" class="handler-info">
              <text>处理人：{{ alert.handler }} {{ alert.handleTime ? '(' + alert.handleTime + ')' : '' }}</text>
            </view>
          </view>
          
          <!-- 操作按钮（管理员 + 待处理状态） -->
          <view v-if="isManager && alert.status === 'Pending'" class="alert-actions">
            <view class="action-btn ignore" @click="handleAlert(alert, 'Ignored')">
              忽略
            </view>
            
            <view class="action-btn handle" @click="handleAlert(alert, 'Handled')">
              处理
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

/* 通知栏 */
.notification-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
  border: 2rpx solid #FED7AA;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin: 20rpx 24rpx 0;
  
  .notification-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .notification-icon {
      font-size: 32rpx;
    }
    
    .notification-text {
      font-size: 28rpx;
      font-weight: 500;
      color: #1F2937;
    }
    
    .notification-status {
      font-size: 24rpx;
      color: #9CA3AF;
      background: #F3F4F6;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      
      &.active {
        color: #059669;
        background: #D1FAE5;
      }
    }
  }
  
  .notification-arrow {
    font-size: 36rpx;
    color: #9CA3AF;
  }
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
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #FCA5A5;
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
  color: #7F1D1D;
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
  color: #1E293B;
}

.stat-value.warning {
  color: #DC2626;
}

.stat-label {
  font-size: 26rpx;
  color: #64748B;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(127, 29, 29, 0.2);
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

/* 告警列表 */
.alert-list {
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

/* 告警项 */
.alert-item {
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

.alert-content {
  padding: 28rpx;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.student-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.room-number {
  font-size: 26rpx;
  color: #64748B;
  background: #F1F5F9;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.status-tag {
  padding: 12rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.alert-details {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 26rpx;
  color: #6B7280;
}

.detail-value {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
}

.handler-info {
  font-size: 24rpx;
  color: #9CA3AF;
  padding-top: 16rpx;
  border-top: 2rpx solid #F2E6E2;
}

/* 操作按钮 */
.alert-actions {
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

.action-btn.ignore {
  color: #6B7280;
  background: #F9FAFB;
}

.action-btn.handle {
  color: #059669;
  background: #ECFDF5;
  border-left: 2rpx solid #F2E6E2;
}

.action-btn:active {
  opacity: 0.8;
}

/* 搜索栏 */
.search-bar {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
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
