<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'

// 不需要登录的页面白名单
const whiteList = [
  'pages/login/login',
  'pages/register/register'
]

// 检查登录状态
const checkLoginStatus = () => {
  const userStore = useUserStore()
  
  // 延迟执行，确保页面路由已就绪
  setTimeout(() => {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    
    if (!currentPage) {
      console.log('No current page')
      return
    }
    
    const currentRoute = currentPage.route
    console.log('Current route:', currentRoute, 'isLoggedIn:', userStore.isLoggedIn)
    
    // 如果不在白名单中且未登录，跳转到登录页
    if (!whiteList.includes(currentRoute) && !userStore.isLoggedIn) {
      console.log('未登录，跳转到登录页')
      uni.reLaunch({
        url: '/pages/login/login',
        success: () => {
          console.log('跳转成功')
        },
        fail: (err) => {
          console.error('跳转失败:', err)
        }
      })
    }
  }, 100)
}

onLaunch(() => {
  console.log('App Launch')
  // 检查登录状态
  const userStore = useUserStore()
  userStore.checkLoginStatus()
  
  // 延迟检查，确保 store 已初始化
  checkLoginStatus()
})

onShow(() => {
  console.log('App Show')
  checkLoginStatus()
})

onHide(() => {
  console.log('App Hide')
})
</script>

<template>
  <view class="app-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <!-- 路由视图 -->
    <slot />
  </view>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  position: relative;
}

.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.15;
}

.blob-1 {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(135deg, #9A3412, #B07A6B);
  top: -100rpx;
  right: -100rpx;
  animation: float 8s ease-in-out infinite;
}

.blob-2 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, #059669, #10B981);
  bottom: 100rpx;
  left: -80rpx;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20rpx, -20rpx) scale(1.05); }
  66% { transform: translate(-10rpx, 10rpx) scale(0.95); }
}
</style>
