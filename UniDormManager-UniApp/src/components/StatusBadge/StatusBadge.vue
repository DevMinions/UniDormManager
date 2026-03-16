<script setup>
/**
 * StatusBadge 状态标签组件
 * 用于显示报修状态、房间状态、订单状态等
 */
defineProps({
  // 状态类型
  status: {
    type: String,
    default: 'default',
    validator: (v) => [
      'default', 'primary', 'success', 'warning', 'error', 'info',
      // 报修状态
      'pending', 'processing', 'completed', 'cancelled',
      // 房间状态
      'free', 'occupied', 'full', 'maintenance',
      // 通用
      'active', 'inactive', 'draft', 'published'
    ].includes(v)
  },
  // 显示文字
  text: {
    type: String,
    default: ''
  },
  // 尺寸
  size: {
    type: String,
    default: 'medium', // small | medium | large
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  },
  // 是否显示圆点
  dot: {
    type: Boolean,
    default: true
  },
  // 是否空心样式
  outlined: {
    type: Boolean,
    default: false
  },
  // 是否圆角胶囊
  pill: {
    type: Boolean,
    default: true
  }
})

// 状态映射配置
const statusConfig = {
  // 基础状态
  default: { text: '默认', color: '#8b8b8b', bg: '#f5f4f2' },
  primary: { text: '主要', color: '#7a8f63', bg: '#e8ece4' },
  success: { text: '成功', color: '#6b8e6b', bg: 'rgba(107, 142, 107, 0.15)' },
  warning: { text: '警告', color: '#c4a77d', bg: 'rgba(196, 167, 125, 0.15)' },
  error: { text: '错误', color: '#c1666b', bg: 'rgba(193, 102, 107, 0.15)' },
  info: { text: '信息', color: '#7da3c4', bg: 'rgba(125, 163, 196, 0.15)' },
  
  // 报修状态
  pending: { text: '待处理', color: '#c4a77d', bg: 'rgba(196, 167, 125, 0.15)', icon: '⏳' },
  processing: { text: '处理中', color: '#7da3c4', bg: 'rgba(125, 163, 196, 0.15)', icon: '🔧' },
  completed: { text: '已完成', color: '#6b8e6b', bg: 'rgba(107, 142, 107, 0.15)', icon: '✅' },
  cancelled: { text: '已取消', color: '#8b8b8b', bg: '#f5f4f2', icon: '🚫' },
  
  // 房间状态
  free: { text: '空闲', color: '#6b8e6b', bg: 'rgba(107, 142, 107, 0.15)', icon: '✨' },
  occupied: { text: '已入住', color: '#7a8f63', bg: '#e8ece4', icon: '👤' },
  full: { text: '已满', color: '#c46f43', bg: '#fdf6f0', icon: '👥' },
  maintenance: { text: '维修中', color: '#c1666b', bg: 'rgba(193, 102, 107, 0.15)', icon: '🔧' },
  
  // 通用状态
  active: { text: '启用', color: '#6b8e6b', bg: 'rgba(107, 142, 107, 0.15)' },
  inactive: { text: '禁用', color: '#8b8b8b', bg: '#f5f4f2' },
  draft: { text: '草稿', color: '#9a958d', bg: '#f5f4f2' },
  published: { text: '已发布', color: '#6b8e6b', bg: 'rgba(107, 142, 107, 0.15)' }
}
</script>

<template>
  <view 
    class="status-badge" 
    :class="[
      `status-${status}`,
      `size-${size}`,
      { 'is-outlined': outlined, 'is-pill': pill, 'has-dot': dot }
    ]"
    :style="{
      color: statusConfig[status]?.color,
      backgroundColor: outlined ? 'transparent' : statusConfig[status]?.bg,
      borderColor: statusConfig[status]?.color
    }"
  >
    <!-- 状态圆点 -->
    <view 
      v-if="dot" 
      class="status-dot"
      :style="{ backgroundColor: statusConfig[status]?.color }"
    ></view>
    
    <!-- 状态图标 -->
    <text v-if="statusConfig[status]?.icon" class="status-icon">
      {{ statusConfig[status].icon }}
    </text>
    
    <!-- 状态文字 -->
    <text class="status-text">
      {{ text || statusConfig[status]?.text }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  
  // 默认圆角
  border-radius: 8rpx;
  
  // 胶囊样式
  &.is-pill {
    border-radius: 200rpx;
  }
  
  // 空心样式
  &.is-outlined {
    background-color: transparent !important;
    border-width: 2rpx;
    border-style: solid;
  }
  
  // 尺寸变体
  &.size-small {
    padding: 4rpx 12rpx;
    font-size: 20rpx;
    gap: 4rpx;
    
    .status-dot {
      width: 12rpx;
      height: 12rpx;
    }
    
    .status-icon {
      font-size: 20rpx;
    }
  }
  
  &.size-medium {
    padding: 8rpx 20rpx;
    font-size: 24rpx;
    
    .status-dot {
      width: 16rpx;
      height: 16rpx;
    }
    
    .status-icon {
      font-size: 24rpx;
    }
  }
  
  &.size-large {
    padding: 12rpx 28rpx;
    font-size: 28rpx;
    gap: 12rpx;
    
    .status-dot {
      width: 20rpx;
      height: 20rpx;
    }
    
    .status-icon {
      font-size: 28rpx;
    }
  }
  
  // 状态圆点
  .status-dot {
    border-radius: 50%;
    flex-shrink: 0;
    
    // 脉冲动画
    animation: status-pulse 2s ease-in-out infinite;
  }
  
  @keyframes status-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  // 状态图标
  .status-icon {
    flex-shrink: 0;
  }
  
  // 状态文字
  .status-text {
    line-height: 1;
  }
}

// 特定状态动画
.status-pending .status-dot,
.status-processing .status-dot {
  animation: status-blink 1.5s ease-in-out infinite;
}

@keyframes status-blink {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.5;
    transform: scale(1.1);
  }
}
</style>
