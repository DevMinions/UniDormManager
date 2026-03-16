<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'warning', 'success', 'error', 'info'].includes(v)
  },
  trend: {
    type: String,
    default: '' // 'up', 'down', ''
  },
  delay: {
    type: Number,
    default: 0
  }
})

const variants = {
  primary: {
    bg: 'linear-gradient(135deg, #F8F2F0 0%, #F2E6E2 100%)',
    border: '#E8D4CD',
    accent: '#9A3412',
    iconBg: 'rgba(154, 52, 18, 0.12)',
    shadow: 'rgba(154, 52, 18, 0.12)'
  },
  secondary: {
    bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    border: '#A7F3D0',
    accent: '#059669',
    iconBg: 'rgba(5, 150, 105, 0.12)',
    shadow: 'rgba(5, 150, 105, 0.12)'
  },
  warning: {
    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    border: '#FCD34D',
    accent: '#D97706',
    iconBg: 'rgba(217, 119, 6, 0.12)',
    shadow: 'rgba(217, 119, 6, 0.12)'
  },
  success: {
    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    border: '#6EE7B7',
    accent: '#059669',
    iconBg: 'rgba(5, 150, 105, 0.15)',
    shadow: 'rgba(5, 150, 105, 0.12)'
  },
  error: {
    bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
    border: '#FCA5A5',
    accent: '#DC2626',
    iconBg: 'rgba(220, 38, 38, 0.12)',
    shadow: 'rgba(220, 38, 38, 0.12)'
  },
  info: {
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    border: '#93C5FD',
    accent: '#2563EB',
    iconBg: 'rgba(37, 99, 235, 0.12)',
    shadow: 'rgba(37, 99, 235, 0.12)'
  }
}

// 防御性处理：获取有效的 variant 配置
const getVariantConfig = (variant) => {
  return variants[variant] || variants.primary
}
</script>

<template>
  <view
    class="stat-card"
    :class="`variant-${variant}`"
    :style="{
      background: getVariantConfig(variant).bg,
      borderColor: getVariantConfig(variant).border,
      boxShadow: `0 4rpx 16rpx ${getVariantConfig(variant).shadow}`,
      animationDelay: `${delay}ms`
    }"
  >
    <!-- 背景光晕 -->
    <view
      class="card-glow"
      :style="{ background: getVariantConfig(variant).iconBg }"
    ></view>

    <!-- 角落装饰 -->
    <view class="corner-deco">
      <view class="corner-dot" :style="{ background: getVariantConfig(variant).accent }"></view>
      <view class="corner-line" :style="{ background: getVariantConfig(variant).border }"></view>
    </view>

    <!-- 图标 -->
    <view
      class="stat-icon-wrapper"
      :style="{
        background: getVariantConfig(variant).iconBg,
        borderColor: getVariantConfig(variant).border
      }"
    >
      <text class="stat-icon">{{ icon }}</text>
      <view
        class="icon-ring"
        :style="{ borderColor: getVariantConfig(variant).border }"
      ></view>
    </view>

    <!-- 数值和内容 -->
    <view class="stat-content">
      <view class="value-row">
        <text
          class="stat-value"
          :style="{ color: getVariantConfig(variant).accent }"
        >
          {{ value }}
        </text>

        <view v-if="trend" class="trend-badge" :class="trend">
          <text class="trend-arrow">{{ trend === 'up' ? '↑' : '↓' }}</text>
        </view>
      </view>

      <text class="stat-label">{{ label }}</text>
    </view>

    <!-- 底部装饰线 -->
    <view
      class="bottom-accent"
      :style="{ background: getVariantConfig(variant).accent }"
    ></view>
  </view>
</template>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  border-radius: 24rpx 24rpx 24rpx 12rpx;
  padding: 28rpx 20rpx 24rpx;
  border: 2rpx solid;
  overflow: hidden;
  animation: cardSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
  transform: translateY(20rpx);
}

@keyframes cardSlideUp {
  0% {
    opacity: 0;
    transform: translateY(20rpx) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stat-card:active {
  transform: scale(0.96);
  transition: transform 0.15s ease;
}

/* 背景光晕 */
.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(40rpx);
  opacity: 0.6;
  pointer-events: none;
}

/* 角落装饰 */
.corner-deco {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.corner-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  opacity: 0.8;
}

.corner-line {
  width: 24rpx;
  height: 2rpx;
  border-radius: 1rpx;
  opacity: 0.5;
}

/* 图标 */
.stat-icon-wrapper {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:active .stat-icon-wrapper {
  transform: scale(1.1);
}

.stat-icon {
  font-size: 32rpx;
  z-index: 1;
}

.icon-ring {
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border: 2rpx dashed;
  border-radius: 50%;
  opacity: 0.4;
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 内容区域 */
.stat-content {
  position: relative;
  z-index: 1;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

/* 趋势标记 */
.trend-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  font-size: 18rpx;
  animation: fadeIn 0.4s ease;
}

.trend-badge.up {
  background: rgba(5, 150, 105, 0.15);
  color: #059669;
}

.trend-badge.down {
  background: rgba(220, 38, 38, 0.15);
  color: #DC2626;
}

.trend-arrow {
  font-weight: 700;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}

/* 标签 */
.stat-label {
  font-size: 24rpx;
  color: #64748B;
  font-weight: 400;
}

/* 底部强调线 */
.bottom-accent {
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  border-radius: 4rpx 4rpx 0 0;
  opacity: 0.4;
}
</style>
