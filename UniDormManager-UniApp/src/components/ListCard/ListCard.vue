<script setup>
import { ref, computed } from 'vue'

/**
 * ListCard 列表卡片组件
 * 统一列表项样式，支持多种变体
 */
const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 描述
  description: {
    type: String,
    default: ''
  },
  // 副标题/时间
  subtitle: {
    type: String,
    default: ''
  },
  // 标签文字
  tag: {
    type: String,
    default: ''
  },
  // 标签类型
  tagType: {
    type: String,
    default: 'default' // default | primary | success | warning | error
  },
  // 图标或图片
  icon: {
    type: String,
    default: ''
  },
  // 图片 URL
  image: {
    type: String,
    default: ''
  },
  // 是否显示箭头
  arrow: {
    type: Boolean,
    default: true
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: true
  },
  // 卡片变体
  variant: {
    type: String,
    default: 'default', // default | compact | media | action
    validator: (v) => ['default', 'compact', 'media', 'action'].includes(v)
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'action'])

const handleClick = () => {
  if (!props.disabled && props.clickable) {
    emit('click')
  }
}

const handleAction = (e) => {
  e.stopPropagation()
  emit('action')
}

// 标签颜色映射
const tagColors = {
  default: { bg: '#f5f4f2', text: '#8b8b8b' },
  primary: { bg: '#e8ece4', text: '#5c6b52' },
  success: { bg: 'rgba(107, 142, 107, 0.15)', text: '#6b8e6b' },
  warning: { bg: 'rgba(196, 167, 125, 0.15)', text: '#c4a77d' },
  error: { bg: 'rgba(193, 102, 107, 0.15)', text: '#c1666b' }
}

const tagStyle = computed(() => {
  const colors = tagColors[props.tagType] || tagColors.default
  return {
    backgroundColor: colors.bg,
    color: colors.text
  }
})
</script>

<template>
  <view 
    class="list-card" 
    :class="[
      `variant-${variant}`,
      { 
        'is-border': border, 
        'is-clickable': clickable && !disabled,
        'is-disabled': disabled
      }
    ]"
    @click="handleClick"
  >
    <!-- 图标/图片区域 -->
    <view v-if="icon || image" class="card-media">
      <image v-if="image" :src="image" class="card-image" mode="aspectFill" />
      <view v-else class="card-icon">{{ icon }}</view>
    </view>
    
    <!-- 内容区域 -->
    <view class="card-content">
      <!-- 标题行 -->
      <view class="card-header">
        <text class="card-title">{{ title }}</text>
        <view v-if="tag" class="card-tag" :style="tagStyle">
          {{ tag }}
        </view>
      </view>
      
      <!-- 描述 -->
      <text v-if="description" class="card-description">{{ description }}</text>
      
      <!-- 副标题/时间 -->
      <view v-if="subtitle || $slots.footer" class="card-footer">
        <text v-if="subtitle" class="card-subtitle">{{ subtitle }}</text>
        <slot name="footer"></slot>
      </view>
    </view>
    
    <!-- 操作区域 -->
    <view class="card-action">
      <slot name="action">
        <text v-if="arrow && variant !== 'action'" class="card-arrow">›</text>
        <button 
          v-else-if="variant === 'action'" 
          class="action-btn"
          @click="handleAction"
        >
          操作
        </button>
      </slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.list-card {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  background: white;
  transition: all 0.3s ease;
  
  // 边框
  &.is-border {
    border-bottom: 1rpx solid $warm-gray-100;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  // 可点击状态
  &.is-clickable {
    &:active {
      background: $sage-50;
    }
  }
  
  // 禁用状态
  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

// 媒体区域
.card-media {
  margin-right: 20rpx;
  flex-shrink: 0;
  
  .card-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    object-fit: cover;
  }
  
  .card-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 16rpx;
    background: $sage-50;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    border: 2rpx solid $sage-200;
  }
}

// 内容区域
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tag {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.card-description {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.card-subtitle {
  font-size: 24rpx;
  color: $text-tertiary;
}

// 操作区域
.card-action {
  margin-left: 16rpx;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.card-arrow {
  font-size: 36rpx;
  color: $warm-gray-400;
  font-weight: 300;
}

.action-btn {
  padding: 12rpx 28rpx;
  background: linear-gradient(135deg, $sage-400, $sage-600);
  color: white;
  font-size: 24rpx;
  border-radius: 28rpx;
  border: none;
  
  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
}

// 变体样式
// 紧凑模式
.variant-compact {
  padding: 16rpx 20rpx;
  
  .card-media {
    .card-icon {
      width: 64rpx;
      height: 64rpx;
      font-size: 32rpx;
    }
  }
  
  .card-title {
    font-size: 28rpx;
  }
  
  .card-description {
    font-size: 24rpx;
  }
}

// 媒体模式（大图）
.variant-media {
  flex-direction: column;
  padding: 0;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .card-media {
    width: 100%;
    margin-right: 0;
    
    .card-image {
      width: 100%;
      height: 200rpx;
      border-radius: 0;
    }
  }
  
  .card-content {
    padding: 20rpx;
  }
  
  .card-action {
    margin-left: 0;
    padding: 0 20rpx 20rpx;
  }
}

// 操作模式
.variant-action {
  align-items: center;
  
  .card-content {
    gap: 8rpx;
  }
}
</style>
