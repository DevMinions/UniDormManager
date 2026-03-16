<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: '学生'
  },
  decoration: {
    type: String,
    default: '🏠'
  }
})

// 根据时间动态问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return { text: '夜深了', emoji: '🌙', sub: '注意休息' }
  if (hour < 9) return { text: '早上好', emoji: '🌅', sub: '新的一天' }
  if (hour < 12) return { text: '上午好', emoji: '☀️', sub: '精神满满' }
  if (hour < 14) return { text: '中午好', emoji: '🍜', sub: '记得休息' }
  if (hour < 18) return { text: '下午好', emoji: '🌤️', sub: '继续加油' }
  return { text: '晚上好', emoji: '🌆', sub: '放松时刻' }
}
</script>

<template>
  <view class="welcome-card">
    <!-- 背景装饰 -->
    <view class="card-bg">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
      <view class="bg-circle circle-3"></view>
    </view>
    
    <!-- 装饰元素 -->
    <view class="deco-leaf leaf-1">🌿</view>
    <view class="deco-leaf leaf-2">🍃</view>
    
    <!-- 主要内容 -->
    <view class="card-content">
      <!-- 问候语 -->
      <view class="greeting-row">
        <text class="greeting-emoji">{{ getGreeting().emoji }}</text>
        <text class="greeting-text">{{ getGreeting().text }}</text>
        <text class="greeting-sub">{{ getGreeting().sub }}</text>
      </view>
      
      <!-- 用户名 -->
      <view class="name-section">
        <text class="user-name">{{ name }}</text>
        <view class="decoration-badge">{{ decoration }}</view>
      </view>
      
      <!-- 角色标签 -->
      <view class="role-badge">
        <view class="role-dot"></view>
        <text class="role-text">{{ role }}</text>
      </view>
    </view>
    
    <!-- 右侧装饰环 -->
    <view class="rings">
      <view class="ring ring-1"></view>
      <view class="ring ring-2"></view>
      <view class="ring ring-3"></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.welcome-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #FFFBEB 100%);
  border-radius: 24rpx 24rpx 24rpx 12rpx;
  padding: 36rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 
    0 8rpx 32rpx rgba(154, 52, 18, 0.12),
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
  border: 2rpx solid #F2E6E2;
  overflow: hidden;
  animation: cardEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardEnter {
  0% {
    opacity: 0;
    transform: translateY(30rpx) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 背景装饰 */
.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #9A3412, #B07A6B);
  top: -60rpx;
  right: -40rpx;
}

.circle-2 {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #059669, #10B981);
  bottom: 40rpx;
  right: 80rpx;
}

.circle-3 {
  width: 60rpx;
  height: 60rpx;
  background: #D97706;
  top: 60rpx;
  right: 140rpx;
  opacity: 0.15;
}

/* 装饰叶子 */
.deco-leaf {
  position: absolute;
  font-size: 48rpx;
  opacity: 0.08;
  pointer-events: none;
}

.leaf-1 {
  top: 10rpx;
  right: 40rpx;
  animation: float 5s ease-in-out infinite;
}

.leaf-2 {
  bottom: -10rpx;
  left: 60rpx;
  font-size: 36rpx;
  animation: float 6s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10rpx) rotate(5deg); }
}

/* 卡片内容 */
.card-content {
  position: relative;
  z-index: 1;
}

.greeting-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.greeting-emoji {
  font-size: 32rpx;
}

.greeting-text {
  font-size: 26rpx;
  color: #9A3412;
  font-weight: 600;
}

.greeting-sub {
  font-size: 24rpx;
  color: #64748B;
}

/* 用户名区域 */
.name-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.user-name {
  font-size: 44rpx;
  font-weight: 600;
  color: #1E293B;
  letter-spacing: 2rpx;
}

.decoration-badge {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* 角色标签 */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
  padding: 12rpx 24rpx;
  border-radius: 28rpx;
  border: 2rpx solid #A7F3D0;
}

.role-dot {
  width: 12rpx;
  height: 12rpx;
  background: #059669;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.role-text {
  font-size: 24rpx;
  color: #047857;
  font-weight: 500;
}

/* 装饰环 */
.rings {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.ring {
  border-radius: 50%;
  border: 2rpx solid rgba(154, 52, 18, 0.15);
}

.ring-1 {
  width: 56rpx;
  height: 56rpx;
  animation: ripple 3s ease-in-out infinite;
}

.ring-2 {
  width: 40rpx;
  height: 40rpx;
  margin-left: 8rpx;
  animation: ripple 3s ease-in-out infinite 0.5s;
}

.ring-3 {
  width: 28rpx;
  height: 28rpx;
  margin-left: 16rpx;
  animation: ripple 3s ease-in-out infinite 1s;
}

@keyframes ripple {
  0%, 100% { 
    transform: scale(1);
    border-color: rgba(154, 52, 18, 0.15);
  }
  50% { 
    transform: scale(1.1);
    border-color: rgba(154, 52, 18, 0.3);
  }
}
</style>
