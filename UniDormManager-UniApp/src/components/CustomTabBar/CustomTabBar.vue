<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 根据角色获取 TabBar 配置
const tabBarList = computed(() => {
  const role = userStore.userRole
  
  // 基础 TabBar
  const baseTabs = [
    { pagePath: 'pages/index/index', text: '首页', icon: '🏠' },
    { pagePath: 'pages/rooms/list', text: '房间', icon: '🚪' },
    { pagePath: 'pages/repairs/list', text: '报修', icon: '🔧' },
    { pagePath: 'pages/profile/index', text: '我的', icon: '👤' }
  ]
  
  // 根据角色调整（如果需要）
  return baseTabs
})

const currentPath = computed(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage ? currentPage.route : ''
})

const switchTab = (item) => {
  const url = '/' + item.pagePath
  uni.switchTab({ url })
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
      <view class="tab-icon">{{ item.icon }}</view>
      
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
