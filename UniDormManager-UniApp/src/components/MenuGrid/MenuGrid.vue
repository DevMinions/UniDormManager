<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['click'])

const handleClick = (item) => {
  emit('click', item)
  
  if (item.path) {
    const tabBarPages = ['/pages/index/index', '/pages/rooms/list', '/pages/repairs/list', '/pages/profile/index']
    if (tabBarPages.includes(item.path)) {
      uni.switchTab({ url: item.path })
    } else {
      uni.navigateTo({ url: item.path })
    }
  }
}

// 生成有机形状
const organicShapes = [
  '24rpx 24rpx 24rpx 12rpx',
  '24rpx 24rpx 12rpx 24rpx',
  '12rpx 24rpx 24rpx 24rpx',
  '24rpx 12rpx 24rpx 24rpx',
]

const getShape = (index) => organicShapes[index % organicShapes.length]

// 颜色配置
const colorSchemes = [
  { bg: '#F8F2F0', accent: '#9A3412', shadow: 'rgba(154, 52, 18, 0.1)' },
  { bg: '#ECFDF5', accent: '#059669', shadow: 'rgba(5, 150, 105, 0.1)' },
  { bg: '#FEF3C7', accent: '#D97706', shadow: 'rgba(217, 119, 6, 0.1)' },
  { bg: '#EFF6FF', accent: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.1)' },
]

const getColor = (index) => colorSchemes[index % colorSchemes.length]
</script>

<template>
  <view class="menu-grid">
    <view 
      v-for="(item, index) in items" 
      :key="index"
      class="menu-item"
      :style="{ 
        borderRadius: getShape(index),
        background: getColor(index).bg,
        boxShadow: `0 4rpx 16rpx ${getColor(index).shadow}`,
        animationDelay: `${index * 80}ms`
      }"
      @click="handleClick(item)"
    >
      <!-- 波纹效果 -->
      <view class="ripple-container">
        <view class="ripple"></view>
      </view>
      
      <!-- 图标 -->
      <view 
        class="menu-icon-wrapper"
        :style="{ 
          background: 'rgba(255, 255, 255, 0.8)',
          borderColor: getColor(index).accent 
        }"
      >
        <text class="menu-icon">{{ item.icon }}</text>
        <view 
          class="icon-dot"
          :style="{ background: getColor(index).accent }"
        ></view>
      </view>
      
      <!-- 文字 -->
      <text 
        class="menu-text"
        :style="{ color: getColor(index).accent }"
      >
        {{ item.text }}
      </text>
      
      <!-- 角落装饰 -->
      <view 
        class="corner-accent"
        :style="{ background: getColor(index).accent }"
      ></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.menu-item {
  position: relative;
  padding: 20rpx 8rpx 16rpx;
  text-align: center;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  animation: itemPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
  transform: scale(0.8);
}

@keyframes itemPop {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10rpx);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-item:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}

.menu-item:active .menu-icon-wrapper {
  transform: scale(1.1) rotate(-5deg);
}

/* 波纹效果 */
.ripple-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  opacity: 0;
}

.menu-item:active .ripple {
  animation: rippleEffect 0.6s ease-out;
}

@keyframes rippleEffect {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 120rpx;
    height: 120rpx;
    opacity: 0;
  }
}

/* 图标 */
.menu-icon-wrapper {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 3rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16rpx;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.menu-icon {
  font-size: 36rpx;
  z-index: 1;
}

.icon-dot {
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  border: 2rpx solid #ffffff;
}

/* 文字 */
.menu-text {
  font-size: 24rpx;
  font-weight: 500;
  z-index: 1;
}

/* 角落装饰 */
.corner-accent {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  opacity: 0.6;
}
</style>
