// ============================================
// 性能优化工具函数
// ============================================

/**
 * 图片懒加载配置
 * 在页面 onLoad 或 onShow 中调用
 * @param {string} selector - 图片选择器
 */
export function initLazyLoad(selector = '.lazy-image') {
  const observer = uni.createIntersectionObserver({
    thresholds: [0.5]
  })
  
  observer.relativeToViewport({ bottom: 100 }).observe(selector, (res) => {
    if (res.intersectionRatio > 0) {
      const img = res.dataset.src
      if (img) {
        res.target.setAttribute('src', img)
        res.target.classList.remove('lazy-image')
      }
    }
  })
  
  return observer
}

/**
 * 虚拟列表计算
 * 用于长列表性能优化
 * @param {Array} list - 完整列表数据
 * @param {number} startIndex - 起始索引
 * @param {number} visibleCount - 可见数量
 * @returns {Object} 可视区域数据
 */
export function getVirtualListData(list, startIndex, visibleCount) {
  const bufferSize = 5 // 缓冲区大小
  const start = Math.max(0, startIndex - bufferSize)
  const end = Math.min(list.length, startIndex + visibleCount + bufferSize)
  
  return {
    visibleData: list.slice(start, end),
    startIndex: start,
    offset: start * 100 // 假设每项高度100rpx
  }
}

/**
 * 防抖搜索
 * @param {Function} searchFn - 搜索函数
 * @param {number} delay - 延迟时间
 * @returns {Function}
 */
export function debounceSearch(searchFn, delay = 500) {
  let timer = null
  return function (keyword) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      searchFn(keyword)
    }, delay)
  }
}

/**
 * 节流加载更多
 * @param {Function} loadFn - 加载函数
 * @param {number} interval - 间隔时间
 * @returns {Function}
 */
export function throttleLoadMore(loadFn, interval = 1000) {
  let isLoading = false
  return async function () {
    if (isLoading) return
    isLoading = true
    await loadFn()
    setTimeout(() => {
      isLoading = false
    }, interval)
  }
}

/**
 * 缓存管理
 */
export const cacheManager = {
  // 设置缓存
  set(key, data, expireMinutes = 5) {
    const cacheData = {
      data,
      expireTime: Date.now() + expireMinutes * 60 * 1000
    }
    uni.setStorageSync(key, cacheData)
  },
  
  // 获取缓存
  get(key) {
    const cacheData = uni.getStorageSync(key)
    if (!cacheData) return null
    
    if (Date.now() > cacheData.expireTime) {
      uni.removeStorageSync(key)
      return null
    }
    
    return cacheData.data
  },
  
  // 清除缓存
  clear(key) {
    if (key) {
      uni.removeStorageSync(key)
    } else {
      uni.clearStorageSync()
    }
  }
}

/**
 * 图片预加载
 * @param {Array} urls - 图片地址数组
 */
export function preloadImages(urls) {
  if (!urls || urls.length === 0) return
  
  urls.forEach(url => {
    uni.getImageInfo({
      src: url,
      fail: () => {
        console.warn('图片预加载失败:', url)
      }
    })
  })
}

/**
 * 计算列表项高度（用于虚拟列表）
 * @param {string} selector - 选择器
 * @returns {Promise<number>}
 */
export function getItemHeight(selector) {
  return new Promise((resolve) => {
    uni.createSelectorQuery()
      .select(selector)
      .boundingClientRect(rect => {
        resolve(rect ? rect.height : 100)
      })
      .exec()
  })
}
