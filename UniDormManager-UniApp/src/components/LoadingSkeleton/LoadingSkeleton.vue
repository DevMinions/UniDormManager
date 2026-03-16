<script setup>
/**
 * LoadingSkeleton 骨架屏组件
 * 用于数据加载时的占位展示
 */
defineProps({
  // 骨架屏类型
  type: {
    type: String,
    default: 'list', // list | card | article | avatar | custom
    validator: (v) => ['list', 'card', 'article', 'avatar', 'custom'].includes(v)
  },
  // 行数（针对 list 和 article 类型）
  rows: {
    type: Number,
    default: 3
  },
  // 是否显示动画
  animated: {
    type: Boolean,
    default: true
  },
  // 自定义类名
  customClass: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <view class="skeleton-wrapper" :class="[customClass, { 'skeleton-animated': animated }]">
    <!-- 列表类型骨架屏 -->
    <view v-if="type === 'list'" class="skeleton-list">
      <view v-for="i in rows" :key="i" class="skeleton-list-item">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-content">
          <view class="skeleton-title"></view>
          <view class="skeleton-text"></view>
        </view>
      </view>
    </view>
    
    <!-- 卡片类型骨架屏 -->
    <view v-else-if="type === 'card'" class="skeleton-card">
      <view class="skeleton-card-header">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-meta">
          <view class="skeleton-title"></view>
          <view class="skeleton-text short"></view>
        </view>
      </view>
      <view class="skeleton-card-body">
        <view v-for="i in rows" :key="i" class="skeleton-line"></view>
      </view>
      <view class="skeleton-card-footer">
        <view class="skeleton-button"></view>
      </view>
    </view>
    
    <!-- 文章类型骨架屏 -->
    <view v-else-if="type === 'article'" class="skeleton-article">
      <view class="skeleton-article-title"></view>
      <view class="skeleton-article-meta">
        <view class="skeleton-avatar small"></view>
        <view class="skeleton-text"></view>
      </view>
      <view class="skeleton-article-image"></view>
      <view class="skeleton-article-content">
        <view v-for="i in rows" :key="i" class="skeleton-paragraph">
          <view class="skeleton-line"></view>
          <view class="skeleton-line short"></view>
        </view>
      </view>
    </view>
    
    <!-- 头像组骨架屏 -->
    <view v-else-if="type === 'avatar'" class="skeleton-avatar-group">
      <view v-for="i in rows" :key="i" class="skeleton-avatar-item">
        <view class="skeleton-avatar large"></view>
        <view class="skeleton-text center"></view>
      </view>
    </view>
    
    <!-- 自定义插槽 -->
    <slot v-else></slot>
  </view>
</template>

<style lang="scss" scoped>
// 基础动画
@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

// 骨架屏基础样式
%skeleton-base {
  background: linear-gradient(
    90deg,
    $warm-gray-100 25%,
    $warm-gray-50 50%,
    $warm-gray-100 75%
  );
  background-size: 200% 100%;
  border-radius: 8rpx;
}

.skeleton-wrapper {
  padding: 20rpx;
}

.skeleton-animated {
  .skeleton-avatar,
  .skeleton-title,
  .skeleton-text,
  .skeleton-line,
  .skeleton-button,
  .skeleton-article-title,
  .skeleton-article-image {
    animation: skeleton-loading 1.5s ease infinite;
  }
}

// 通用元素
.skeleton-avatar {
  @extend %skeleton-base;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
  
  &.small {
    width: 48rpx;
    height: 48rpx;
  }
  
  &.large {
    width: 120rpx;
    height: 120rpx;
  }
}

.skeleton-title {
  @extend %skeleton-base;
  height: 32rpx;
  width: 60%;
  margin-bottom: 16rpx;
}

.skeleton-text {
  @extend %skeleton-base;
  height: 24rpx;
  width: 80%;
  
  &.short {
    width: 40%;
  }
  
  &.center {
    width: 60%;
    margin: 0 auto;
  }
}

.skeleton-line {
  @extend %skeleton-base;
  height: 24rpx;
  margin-bottom: 12rpx;
  
  &.short {
    width: 60%;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.skeleton-button {
  @extend %skeleton-base;
  height: 72rpx;
  width: 200rpx;
  border-radius: 36rpx;
}

// 列表类型
.skeleton-list {
  .skeleton-list-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid $warm-gray-100;
    
    &:last-child {
      border-bottom: none;
    }
    
    .skeleton-avatar {
      margin-right: 24rpx;
    }
    
    .skeleton-content {
      flex: 1;
    }
  }
}

// 卡片类型
.skeleton-card {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .skeleton-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    
    .skeleton-avatar {
      margin-right: 20rpx;
    }
    
    .skeleton-meta {
      flex: 1;
    }
  }
  
  .skeleton-card-body {
    margin-bottom: 24rpx;
  }
  
  .skeleton-card-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 20rpx;
    border-top: 1rpx solid $warm-gray-100;
  }
}

// 文章类型
.skeleton-article {
  .skeleton-article-title {
    @extend %skeleton-base;
    height: 44rpx;
    width: 80%;
    margin-bottom: 20rpx;
  }
  
  .skeleton-article-meta {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    
    .skeleton-avatar {
      margin-right: 16rpx;
    }
    
    .skeleton-text {
      width: 30%;
    }
  }
  
  .skeleton-article-image {
    @extend %skeleton-base;
    height: 300rpx;
    border-radius: 16rpx;
    margin-bottom: 24rpx;
  }
  
  .skeleton-article-content {
    .skeleton-paragraph {
      margin-bottom: 20rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

// 头像组类型
.skeleton-avatar-group {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  
  .skeleton-avatar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .skeleton-avatar {
      margin-bottom: 16rpx;
    }
  }
}
</style>
