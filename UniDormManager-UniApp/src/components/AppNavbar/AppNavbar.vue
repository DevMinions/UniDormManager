<script setup>
defineProps({
  title: {
    type: String,
    default: '宿舍管理系统'
  },
  showBack: {
    type: Boolean,
    default: false
  },
  bgColor: {
    type: String,
    default: 'transparent'
  }
})

const emit = defineEmits(['back'])

const handleBack = () => {
  emit('back')
  uni.navigateBack()
}
</script>

<template>
  <view class="navbar" :style="{ backgroundColor: bgColor }">
    <view class="navbar-content">
      <!-- 返回按钮 -->
      <view v-if="showBack" class="back-btn" @click="handleBack">
        <text class="back-icon">←</text>
      </view>
      
      <!-- 标题 -->
      <view class="title-wrapper">
        <text class="navbar-title font-serif">{{ title }}</text>
      </view>
      
      <!-- 右侧占位 -->
      <view v-if="showBack" class="placeholder"></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.navbar {
  padding: 12px 20px;
  padding-top: calc(12px + env(safe-area-inset-top));
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(139, 154, 124, 0.2);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 44px;
}

.back-btn {
  position: absolute;
  left: 0;
  padding: 8px;
  display: flex;
  align-items: center;
}

.back-icon {
  font-size: 24px;
  color: $sage-600;
  font-weight: 500;
}

.title-wrapper {
  flex: 1;
  text-align: center;
}

.navbar-title {
  font-size: 20px;
  font-weight: 400;
  color: $sage-600;
  letter-spacing: 2px;
}

.placeholder {
  width: 40px;
}
</style>
