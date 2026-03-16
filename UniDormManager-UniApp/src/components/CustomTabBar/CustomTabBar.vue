<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { messageApi } from '@/api/message.js'

const userStore = useUserStore()
const unreadCount = ref(0)
let unreadTimer = null

// 根据角色获取 TabBar 配置
const tabBarList = computed(() => {
  const role = userStore.userRole
  
  // 基础 TabBar
  const baseTabs = [
    { pagePath: 'pages/index/index', text: '首页', icon: '🏠' },
    { pagePath: 'pages/rooms/list', text: '房间', icon: '🚪' },
    { pagePath: 'pages/repairs/list', text: '报修', icon: '🔧' },
    { pagePath: 'pages/messages/list', text: '消息', icon: '💬', showBadge: true },
    { pagePath: 'pages/profile/index', text: '我的', icon: '👤' }
  ]
  
  return baseTabs
})

const currentPath = computed(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage ? currentPage.route : ''
})

// 加载未读数
const loadUnreadCount = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await messageApi.getUnreadCount()
    unreadCount.value = res?.count || 0
  } catch (error) {
    console.error('获取未读消息数失败', error)
  }
}

// 启动定时刷新
const startUnreadTimer = () => {
  loadUnreadCount()
  unreadTimer = setInterval(loadUnreadCount, 30000) // 每30秒刷新
}

// 停止定时刷新
const stopUnreadTimer = () => {
  if (unreadTimer) {
    clearInterval(unreadTimer)
    unreadTimer = null
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    startUnreadTimer()
  }
})

onUnmounted(() => {
  stopUnreadTimer()
})

const switchTab = (item) => {
  const url = '/' + item.pagePath
  // 使用 navigateTo 代替 switchTab，因为这些页面不是真正的 tabBar 页面
  uni.navigateTo({ url, fail: () => {
    // 如果 navigateTo 失败（页面层级太深），尝试 redirectTo
    uni.redirectTo({ url })
  }})
}
</script>

<template>
  <view class="custom-tabbar">
    <view 
      v-for="(item, index) in tabBarList" 
      :key="index"
      class="tab-item"
      :class="{ active: currentPath === item.pagePath }"
      @click="switchTab(item)"
    >
      <view class="tab-icon-wrapper">
        <view class="tab-icon">{{ item.icon }}</view>
        <view 
          v-if="item.showBadge && unreadCount > 0"
          class="tab-badge"
        >
          <text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
        </view>
      </view>
      <view class="tab-text">{{ item.text }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 2rpx solid #F2E6E2;
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -8rpx 32rpx rgba(154, 52, 18, 0.08);
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx;
  color: #9CA3AF;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #9A3412;
}

.tab-item.active .tab-icon {
  background: #F8F2F0;
  border-color: #E8D4CD;
  transform: scale(1.1);
}

.tab-icon-wrapper {
  position: relative;
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
  box-shadow: 0 4rpx 8rpx rgba(220, 38, 38, 0.3);
  
  .badge-text {
    font-size: 20rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}

.tab-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  background: #F5F4F2;
  border: 2rpx solid transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-text {
  font-size: 22rpx;
  font-weight: 500;
}
</style>
