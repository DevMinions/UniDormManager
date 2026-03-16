<script setup>
/**
 * EmptyState 空状态组件
 * 用于列表为空、搜索无结果、网络错误等场景
 */
defineProps({
  // 图标类型或自定义图标
  icon: {
    type: String,
    default: 'empty'
  },
  // 标题文字
  title: {
    type: String,
    default: '暂无数据'
  },
  // 描述文字
  description: {
    type: String,
    default: ''
  },
  // 按钮文字，为空则不显示按钮
  buttonText: {
    type: String,
    default: ''
  },
  // 主题色
  theme: {
    type: String,
    default: 'sage', // sage | terracotta | clay
    validator: (v) => ['sage', 'terracotta', 'clay'].includes(v)
  },
  // 尺寸
  size: {
    type: String,
    default: 'normal', // small | normal | large
    validator: (v) => ['small', 'normal', 'large'].includes(v)
  }
})

const emit = defineEmits(['click'])

// 内置图标映射
const iconMap = {
  empty: '📭',
  search: '🔍',
  error: '⚠️',
  network: '📡',
  message: '💬',
  notification: '🔔',
  favorite: '⭐',
  order: '📋',
  cart: '🛒',
  success: '✅'
}

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <view class="empty-state" :class="[`theme-${theme}`, `size-${size}`]">
    <!-- 图标区域 -->
    <view class="empty-icon-wrapper">
      <view class="empty-icon">
        {{ iconMap[icon] || icon }}
      </view>
      <!-- 装饰圆环 -->
      <view class="decoration-ring"></view>
    </view>
    
    <!-- 文字区域 -->
    <view class="empty-content">
      <text class="empty-title">{{ title }}</text>
      <text v-if="description" class="empty-description">{{ description }}</text>
    </view>
    
    <!-- 操作按钮 -->
    <button 
      v-if="buttonText" 
      class="empty-button"
      @click="handleClick"
    >
      {{ buttonText }}
    </button>
  </view>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  text-align: center;
}

// 图标区域
.empty-icon-wrapper {
  position: relative;
  margin-bottom: 32rpx;
}

.empty-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.decoration-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.15; }
}

// 文字区域
.empty-content {
  margin-bottom: 40rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 12rpx;
}

.empty-description {
  display: block;
  font-size: 26rpx;
  color: $text-tertiary;
  line-height: 1.6;
  max-width: 480rpx;
}

// 按钮
.empty-button {
  min-width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

// 主题色 - 鼠尾草绿
.theme-sage {
  .empty-icon {
    background: $sage-50;
    border: 3px solid $sage-200;
  }
  
  .decoration-ring {
    border: 2px solid $sage-300;
  }
  
  .empty-button {
    background: linear-gradient(135deg, $sage-400, $sage-600);
    color: white;
    box-shadow: 0 4rpx 16rpx rgba($sage-500, 0.3);
  }
}

// 主题色 - 陶土色
.theme-terracotta {
  .empty-icon {
    background: $terracotta-50;
    border: 3px solid $terracotta-200;
  }
  
  .decoration-ring {
    border: 2px solid $terracotta-300;
  }
  
  .empty-button {
    background: linear-gradient(135deg, $terracotta-400, $terracotta-600);
    color: white;
    box-shadow: 0 4rpx 16rpx rgba($terracotta-500, 0.3);
  }
}

// 主题色 - 黏土色
.theme-clay {
  .empty-icon {
    background: #faf5f3;
    border: 3px solid #e8d5cd;
  }
  
  .decoration-ring {
    border: 2px solid #d4b8a8;
  }
  
  .empty-button {
    background: linear-gradient(135deg, #c4a89a, #a67c6b);
    color: white;
    box-shadow: 0 4rpx 16rpx rgba(164, 124, 107, 0.3);
  }
}

// 尺寸变体
.size-small {
  padding: 40rpx 32rpx;
  
  .empty-icon {
    width: 100rpx;
    height: 100rpx;
    font-size: 48rpx;
  }
  
  .decoration-ring {
    width: 130rpx;
    height: 130rpx;
  }
  
  .empty-title {
    font-size: 28rpx;
  }
  
  .empty-description {
    font-size: 24rpx;
  }
  
  .empty-button {
    min-width: 200rpx;
    height: 68rpx;
    line-height: 68rpx;
    font-size: 26rpx;
  }
}

.size-large {
  padding: 100rpx 60rpx;
  
  .empty-icon {
    width: 180rpx;
    height: 180rpx;
    font-size: 80rpx;
  }
  
  .decoration-ring {
    width: 230rpx;
    height: 230rpx;
  }
  
  .empty-title {
    font-size: 36rpx;
  }
  
  .empty-description {
    font-size: 28rpx;
  }
}
</style>
