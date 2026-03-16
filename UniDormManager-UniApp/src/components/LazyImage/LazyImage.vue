<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  errorImage: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'aspectFill'
  },
  lazy: {
    type: Boolean,
    default: true
  },
  threshold: {
    type: Number,
    default: 0.1
  }
})

const emit = defineEmits(['load', 'error'])

const isLoaded = ref(false)
const isError = ref(false)
const isInViewport = ref(!props.lazy)
const imageRef = ref(null)
let observer = null

// 图片加载完成
const onImageLoad = () => {
  isLoaded.value = true
  emit('load')
}

// 图片加载失败
const onImageError = () => {
  isError.value = true
  emit('error')
}

// 设置 IntersectionObserver
const setupObserver = () => {
  // #ifdef H5
  if (!props.lazy || typeof IntersectionObserver === 'undefined') {
    isInViewport.value = true
    return
  }
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isInViewport.value = true
          observer.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '50px',
      threshold: props.threshold
    }
  )
  
  if (imageRef.value) {
    observer.observe(imageRef.value)
  }
  // #endif
  
  // #ifndef H5
  // 小程序环境
  isInViewport.value = true
  // #endif
}

// 重新加载
const reload = () => {
  isLoaded.value = false
  isError.value = false
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// 监听 src 变化
watch(() => props.src, () => {
  reload()
})

defineExpose({
  reload
})
</script>

<template>
  <view 
    ref="imageRef" 
    class="lazy-image-wrapper"
    :class="{ 'is-loaded': isLoaded, 'is-error': isError }"
  >
    <!-- 占位图/加载中 -->
    <view v-if="!isInViewport || (!isLoaded && !isError)" class="image-placeholder">
      <image 
        v-if="placeholder" 
        :src="placeholder" 
        class="placeholder-img"
        mode="aspectFill"
      />
      <view v-else class="placeholder-default">
        <view class="loading-spinner"></view>
      </view>
    </view>
    
    <!-- 实际图片 -->
    <image
      v-if="isInViewport"
      :src="src"
      class="actual-image"
      :mode="mode"
      :lazy-load="lazy"
      @load="onImageLoad"
      @error="onImageError"
    />
    
    <!-- 错误占位图 -->
    <view v-if="isError" class="error-overlay">
      <image 
        v-if="errorImage"
        :src="errorImage"
        class="error-img"
        mode="aspectFill"
      />
      <view v-else class="error-default">
        <text class="error-icon">📷</text>
        <text class="error-text">加载失败</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.lazy-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #F3F4F6;
  
  .image-placeholder,
  .actual-image,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .image-placeholder {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .placeholder-img {
      width: 100%;
      height: 100%;
      opacity: 0.5;
      filter: blur(4rpx);
    }
    
    .placeholder-default {
      .loading-spinner {
        width: 48rpx;
        height: 48rpx;
        border: 4rpx solid #E5E7EB;
        border-top-color: #9A3412;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }
  }
  
  .actual-image {
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &.is-loaded .actual-image {
    opacity: 1;
  }
  
  .error-overlay {
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F9FAFB;
    
    .error-img {
      width: 100%;
      height: 100%;
    }
    
    .error-default {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .error-icon {
        font-size: 48rpx;
        margin-bottom: 8rpx;
      }
      
      .error-text {
        font-size: 24rpx;
        color: #9CA3AF;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
