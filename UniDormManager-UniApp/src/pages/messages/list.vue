<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { messageApi } from '@/api/message.js'
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

// 当前标签
const activeTab = ref('all') // 'all' | 'unread' | 'system' | 'repair' | 'roomswap' | 'late'

// 加载状态
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

// 消息列表
const messages = ref([])
const page = ref(1)
const pageSize = 20

// 未读数
const unreadCount = ref(0)

// 标签配置
const tabs = [
  { id: 'all', label: '全部', icon: '📬' },
  { id: 'unread', label: '未读', icon: '🔔', showBadge: true },
  { id: 'system', label: '系统', icon: '⚙️' },
  { id: 'repair', label: '报修', icon: '🔧' },
  { id: 'roomswap', label: '换寝', icon: '🏠' },
  { id: 'late', label: '晚归', icon: '⏰' }
]

// 消息类型配置
const messageTypeConfig = {
  system: { label: '系统通知', color: '#9A3412', bgColor: '#FEF3C7', icon: '⚙️' },
  repair: { label: '报修通知', color: '#059669', bgColor: '#D1FAE5', icon: '🔧' },
  roomswap: { label: '换寝通知', color: '#3B82F6', bgColor: '#DBEAFE', icon: '🏠' },
  late: { label: '晚归通知', color: '#DC2626', bgColor: '#FEE2E2', icon: '⏰' },
  inspection: { label: '查寝通知', color: '#8B5CF6', bgColor: '#EDE9FE', icon: '📋' }
}

// 获取消息类型配置
const getMessageTypeConfig = (type) => {
  return messageTypeConfig[type] || messageTypeConfig.system
}

// 筛选后的消息
const filteredMessages = computed(() => {
  if (activeTab.value === 'all') return messages.value
  if (activeTab.value === 'unread') return messages.value.filter(m => !m.isRead)
  return messages.value.filter(m => m.type === activeTab.value)
})

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadMessages(true)
  loadUnreadCount()
})

onPullDownRefresh(() => {
  loadMessages(true).finally(() => {
    uni.stopPullDownRefresh()
  })
})

onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    loadMessages(false)
  }
})

// 加载消息列表
const loadMessages = async (reset = false) => {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  
  if (loading.value) return
  loading.value = true
  
  try {
    const params = {
      page: page.value,
      pageSize: pageSize
    }
    
    if (activeTab.value !== 'all' && activeTab.value !== 'unread') {
      params.type = activeTab.value
    }
    if (activeTab.value === 'unread') {
      params.isRead = false
    }
    
    const res = await messageApi.getMessages(params)
    const list = Array.isArray(res) ? res : (res.data || res.list || [])
    
    if (reset) {
      messages.value = list
    } else {
      messages.value.push(...list)
    }
    
    // 检查是否还有更多
    if (list.length < pageSize) {
      hasMore.value = false
    } else {
      page.value++
    }
  } catch (error) {
    handleApiError(error, '获取消息失败')
  } finally {
    loading.value = false
  }
}

// 加载未读数
const loadUnreadCount = async () => {
  try {
    const res = await messageApi.getUnreadCount()
    unreadCount.value = res?.count || 0
  } catch (error) {
    console.error('获取未读数失败', error)
  }
}

// 切换标签
const switchTab = (tabId) => {
  activeTab.value = tabId
  loadMessages(true)
}

// 标记已读
const markAsRead = async (message) => {
  if (message.isRead) return
  
  try {
    await messageApi.markAsRead(message.id)
    message.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

// 标记全部已读
const markAllAsRead = async () => {
  if (unreadCount.value === 0) {
    uni.showToast({ title: '没有未读消息', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认',
    content: '确定要将所有消息标记为已读吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await messageApi.markAllAsRead()
          messages.value.forEach(m => m.isRead = true)
          unreadCount.value = 0
          showSuccess('已全部标记为已读')
        } catch (error) {
          handleApiError(error, '操作失败')
        }
      }
    }
  })
}

// 删除消息
const deleteMessage = async (message, index) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条消息吗？',
    confirmColor: '#DC2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await messageApi.deleteMessage(message.id)
          messages.value.splice(index, 1)
          if (!message.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
          showSuccess('删除成功')
        } catch (error) {
          handleApiError(error, '删除失败')
        }
      }
    }
  })
}

// 查看消息详情
const viewMessage = async (message) => {
  // 标记已读
  if (!message.isRead) {
    await markAsRead(message)
  }
  
  // 根据消息类型跳转
  switch (message.type) {
    case 'repair':
      if (message.repairId) {
        uni.navigateTo({ url: `/pages/repairs/detail?id=${message.repairId}` })
      }
      break
    case 'roomswap':
      if (message.roomSwapId) {
        uni.navigateTo({ url: `/pages/room-swaps/detail?id=${message.roomSwapId}` })
      }
      break
    case 'late':
      uni.navigateTo({ url: '/pages/late-returns/list' })
      break
    case 'inspection':
      uni.navigateTo({ url: '/pages/inspections/rankings' })
      break
    default:
      // 系统通知显示详情弹窗
      uni.showModal({
        title: message.title,
        content: message.content,
        showCancel: false
      })
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天'
  }
  
  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }
  
  // 更早
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取空状态文本
const getEmptyText = () => {
  const texts = {
    all: '暂无消息',
    unread: '没有未读消息',
    system: '暂无系统通知',
    repair: '暂无报修通知',
    roomswap: '暂无换寝通知',
    late: '暂无晚归通知'
  }
  return texts[activeTab.value] || '暂无消息'
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="消息中心" />
    
    <view class="content">
      <!-- 头部统计 -->
      <view class="header-section">
        <view class="unread-card">
          <view class="unread-info">
            <text class="unread-count">{{ unreadCount }}</text>
            <text class="unread-label">未读消息</text>
          </view>
          <view 
            v-if="unreadCount > 0"
            class="read-all-btn"
            @click="markAllAsRead"
          >
            <text class="btn-text">全部已读</text>
          </view>
        </view>
      </view>
      
      <!-- 标签栏 -->
      <view class="tab-section">
        <scroll-view scroll-x class="tab-scroll" show-scrollbar="false">
          <view class="tab-list">
            <view
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-item"
              :class="{ active: activeTab === tab.id }"
              @click="switchTab(tab.id)"
            >
              <text class="tab-icon">{{ tab.icon }}</text>
              <text class="tab-label">{{ tab.label }}</text>
              <view 
                v-if="tab.showBadge && unreadCount > 0"
                class="tab-badge"
              >
                <text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 消息列表 -->
      <view class="message-list">
        <!-- 加载中 -->
        <view v-if="loading && messages.length === 0" class="loading-state">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="filteredMessages.length === 0" class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">{{ getEmptyText() }}</text>
        </view>
        
        <!-- 消息项 -->
        <view
          v-for="(message, index) in filteredMessages"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.isRead }"
          @click="viewMessage(message)"
        >
          <!-- 类型图标 -->
          <view 
            class="type-icon"
            :style="{ backgroundColor: getMessageTypeConfig(message.type).bgColor }"
          >
            <text>{{ getMessageTypeConfig(message.type).icon }}</text>
          </view>
          
          <!-- 内容 -->
          <view class="message-content">
            <view class="message-header">
              <view class="type-tag"
                :style="{ 
                  color: getMessageTypeConfig(message.type).color,
                  backgroundColor: getMessageTypeConfig(message.type).bgColor 
                }"
              >
                <text>{{ getMessageTypeConfig(message.type).label }}</text>
              </view>
              <text class="message-time">{{ formatTime(message.createdAt) }}</text>
            </view>
            
            <text class="message-title">{{ message.title }}</text>
            <text class="message-summary">{{ message.summary || message.content }}</text>
          </view>
          
          <!-- 未读标记 -->
          <view v-if="!message.isRead" class="unread-dot"></view>
          
          <!-- 删除按钮 -->
          <view 
            class="delete-btn"
            @click.stop="deleteMessage(message, index)"
          >
            <text>🗑️</text>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view v-if="loading && messages.length > 0" class="load-more">
          <text class="load-text">加载中...</text>
        </view>
        
        <view v-else-if="!hasMore && messages.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>
    </view>
    
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 160rpx;
}

.content {
  padding: 24rpx;
}

// 头部统计
.header-section {
  margin-bottom: 24rpx;
  
  .unread-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    border-radius: 24rpx;
    padding: 32rpx;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
    
    .unread-info {
      .unread-count {
        display: block;
        font-size: 56rpx;
        font-weight: 700;
        color: #FFFFFF;
        margin-bottom: 8rpx;
      }
      
      .unread-label {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .read-all-btn {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16rpx;
      padding: 16rpx 28rpx;
      
      .btn-text {
        font-size: 26rpx;
        font-weight: 500;
        color: #FFFFFF;
      }
    }
  }
}

// 标签栏
.tab-section {
  margin-bottom: 24rpx;
  
  .tab-scroll {
    white-space: nowrap;
  }
  
  .tab-list {
    display: inline-flex;
    gap: 16rpx;
    padding: 4rpx;
  }
  
  .tab-item {
    display: inline-flex;
    align-items: center;
    gap: 12rpx;
    background: #FFFFFF;
    border-radius: 32rpx;
    padding: 16rpx 28rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    position: relative;
    
    .tab-icon {
      font-size: 32rpx;
    }
    
    .tab-label {
      font-size: 28rpx;
      color: #6B7280;
      font-weight: 500;
    }
    
    .tab-badge {
      position: absolute;
      top: -8rpx;
      right: -8rpx;
      background: #DC2626;
      border-radius: 20rpx;
      min-width: 36rpx;
      height: 36rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8rpx;
      
      .badge-text {
        font-size: 20rpx;
        font-weight: 600;
        color: #FFFFFF;
      }
    }
    
    &.active {
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      
      .tab-label {
        color: #FFFFFF;
      }
    }
  }
}

// 消息列表
.message-list {
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
    
    .loading-spinner {
      width: 80rpx;
      height: 80rpx;
      border: 4rpx solid #F3F4F6;
      border-top-color: #9A3412;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      margin-top: 24rpx;
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
    
    .empty-icon {
      font-size: 80rpx;
      margin-bottom: 24rpx;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
  
  .message-item {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    background: #FFFFFF;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    position: relative;
    
    &.unread {
      background: linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%);
      border-left: 4rpx solid #9A3412;
    }
    
    .type-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      flex-shrink: 0;
    }
    
    .message-content {
      flex: 1;
      min-width: 0;
      
      .message-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;
        
        .type-tag {
          font-size: 22rpx;
          font-weight: 500;
          padding: 6rpx 14rpx;
          border-radius: 8rpx;
        }
        
        .message-time {
          font-size: 24rpx;
          color: #9CA3AF;
        }
      }
      
      .message-title {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .message-summary {
        display: block;
        font-size: 26rpx;
        color: #6B7280;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
    
    .unread-dot {
      width: 16rpx;
      height: 16rpx;
      background: #DC2626;
      border-radius: 50%;
      position: absolute;
      top: 24rpx;
      right: 24rpx;
    }
    
    .delete-btn {
      padding: 12rpx;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    &:active .delete-btn {
      opacity: 1;
    }
  }
  
  .load-more,
  .no-more {
    text-align: center;
    padding: 32rpx 0;
    
    .load-text,
    .no-more-text {
      font-size: 26rpx;
      color: #9CA3AF;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
