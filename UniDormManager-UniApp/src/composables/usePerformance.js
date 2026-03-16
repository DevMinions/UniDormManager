
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 图片懒加载 Hook
 * 使用 IntersectionObserver 实现图片懒加载
 * 
 * 使用方法:
 * const { isVisible, imageRef } = useLazyLoad()
 * 
 * 模板中:
 * <image ref="imageRef" v-if="isVisible" :src="actualSrc" />
 * <view v-else class="placeholder"></view>
 */
export function useLazyLoad(options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1
  } = options
  
  const isVisible = ref(false)
  const imageRef = ref(null)
  let observer = null
  
  onMounted(() => {
    // #ifdef H5
    if (typeof IntersectionObserver !== 'undefined' && imageRef.value) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              isVisible.value = true
              observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin, threshold }
      )
      
      observer.observe(imageRef.value)
    } else {
      // 不支持 IntersectionObserver 时直接显示
      isVisible.value = true
    }
    // #endif
    
    // #ifndef H5
    // 小程序环境下直接显示（小程序有自己的懒加载机制）
    isVisible.value = true
    // #endif
  })
  
  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
  
  return {
    isVisible,
    imageRef
  }
}

/**
 * 列表虚拟滚动 Hook
 * 用于长列表性能优化
 * 
 * 使用方法:
 * const { visibleItems, containerHeight, onScroll } = useVirtualScroll(list, itemHeight)
 */
export function useVirtualScroll(list, itemHeight, visibleCount = 10) {
  const scrollTop = ref(0)
  
  const startIndex = computed(() => {
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - 2)
  })
  
  const endIndex = computed(() => {
    return Math.min(list.value.length, startIndex.value + visibleCount + 4)
  })
  
  const visibleItems = computed(() => {
    return list.value.slice(startIndex.value, endIndex.value).map((item, index) => ({
      ...item,
      _index: startIndex.value + index,
      _offset: (startIndex.value + index) * itemHeight
    }))
  })
  
  const containerHeight = computed(() => {
    return list.value.length * itemHeight
  })
  
  const onScroll = (e) => {
    scrollTop.value = e.detail.scrollTop
  }
  
  return {
    visibleItems,
    containerHeight,
    onScroll,
    startIndex,
    endIndex
  }
}

/**
 * API 请求缓存 Hook
 * 缓存 GET 请求结果，减少重复请求
 */
const cacheStore = new Map()
const cacheTimers = new Map()

export function useApiCache() {
  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @param {number} maxAge - 最大缓存时间（毫秒）
   */
  const getCache = (key, maxAge = 5 * 60 * 1000) => {
    const cached = cacheStore.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > maxAge) {
      cacheStore.delete(key)
      return null
    }
    
    return cached.data
  }
  
  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {*} data - 缓存数据
   * @param {number} maxAge - 最大缓存时间（毫秒）
   */
  const setCache = (key, data, maxAge = 5 * 60 * 1000) => {
    cacheStore.set(key, {
      data,
      timestamp: Date.now()
    })
    
    // 清除旧的定时器
    if (cacheTimers.has(key)) {
      clearTimeout(cacheTimers.get(key))
    }
    
    // 设置过期自动清除
    const timer = setTimeout(() => {
      cacheStore.delete(key)
      cacheTimers.delete(key)
    }, maxAge)
    
    cacheTimers.set(key, timer)
  }
  
  /**
   * 清除缓存
   * @param {string} key - 缓存键，不传则清除全部
   */
  const clearCache = (key) => {
    if (key) {
      cacheStore.delete(key)
      if (cacheTimers.has(key)) {
        clearTimeout(cacheTimers.get(key))
        cacheTimers.delete(key)
      }
    } else {
      cacheStore.clear()
      cacheTimers.forEach(timer => clearTimeout(timer))
      cacheTimers.clear()
    }
  }
  
  return {
    getCache,
    setCache,
    clearCache
  }
}

/**
 * 性能监控 Hook
 * 监控页面性能指标
 */
export function usePerformanceMonitor() {
  const metrics = ref({
    pageLoadTime: 0,
    apiCallCount: 0,
    apiTotalTime: 0,
    renderTime: 0
  })
  
  const startTime = ref(0)
  const apiCalls = ref([])
  
  onMounted(() => {
    startTime.value = performance.now()
    
    // #ifdef H5
    // 监听页面加载完成
    window.addEventListener('load', () => {
      metrics.value.pageLoadTime = performance.now() - startTime.value
    })
    // #endif
  })
  
  /**
   * 记录 API 调用
   */
  const recordApiCall = (duration) => {
    apiCalls.value.push(duration)
    metrics.value.apiCallCount = apiCalls.value.length
    metrics.value.apiTotalTime = apiCalls.value.reduce((a, b) => a + b, 0)
  }
  
  /**
   * 获取性能报告
   */
  const getReport = () => {
    return {
      ...metrics.value,
      avgApiTime: metrics.value.apiCallCount > 0 
        ? metrics.value.apiTotalTime / metrics.value.apiCallCount 
        : 0
    }
  }
  
  return {
    metrics,
    recordApiCall,
    getReport
  }
}

/**
 * 防抖 Hook
 */
export function useDebounce(fn, delay = 300) {
  let timer = null
  
  const debouncedFn = (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return {
    debouncedFn,
    cancel
  }
}

/**
 * 节流 Hook
 */
export function useThrottle(fn, interval = 300) {
  let lastTime = 0
  let timer = null
  
  const throttledFn = (...args) => {
    const now = Date.now()
    
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    } else {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        lastTime = Date.now()
        fn.apply(this, args)
      }, interval - (now - lastTime))
    }
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return {
    throttledFn,
    cancel
  }
}
