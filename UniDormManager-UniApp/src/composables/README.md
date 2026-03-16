# 性能优化指南

## 已完成的优化

### 1. 图片懒加载 (LazyImage 组件)

**使用方式:**
```vue
<LazyImage
  :src="imageUrl"
  :placeholder="placeholderUrl"
  mode="aspectFill"
  @load="onLoad"
  @error="onError"
/>
```

**特性:**
- 基于 IntersectionObserver 实现
- 支持占位图和错误图
- 平滑的淡入动画效果
- 自动重载机制

### 2. API 请求缓存

**使用方式:**
```javascript
// 启用缓存的请求
request.get('/api/data', {}, { 
  cache: true,           // 启用缓存
  cacheMaxAge: 60000     // 缓存1分钟
})

// 清除缓存
clearRequestCache()      // 清除全部
clearRequestCache(key)   // 清除指定缓存
```

**特性:**
- 自动缓存 GET 请求结果
- 可配置缓存时间
- 支持手动清除缓存
- 控制台显示缓存命中日志

### 3. 性能 Hooks

#### useLazyLoad - 懒加载 Hook
```javascript
import { useLazyLoad } from '@/composables'

const { isVisible, imageRef } = useLazyLoad({
  rootMargin: '50px',
  threshold: 0.1
})
```

#### useVirtualScroll - 虚拟滚动
```javascript
import { useVirtualScroll } from '@/composables'

const { visibleItems, containerHeight, onScroll } = useVirtualScroll(
  listRef,      // 完整列表数据
  100,          // 每项高度
  10            // 可见数量
)
```

#### useApiCache - API 缓存
```javascript
import { useApiCache } from '@/composables'

const { getCache, setCache, clearCache } = useApiCache()

// 获取缓存
const data = getCache('key', 5 * 60 * 1000)

// 设置缓存
setCache('key', data, 5 * 60 * 1000)
```

#### useDebounce / useThrottle - 防抖节流
```javascript
import { useDebounce, useThrottle } from '@/composables'

// 防抖
const { debouncedFn } = useDebounce(() => {
  // 处理搜索输入
}, 300)

// 节流
const { throttledFn } = useThrottle(() => {
  // 处理滚动事件
}, 100)
```

## 性能优化建议

### 1. 列表优化
- 长列表使用虚拟滚动
- 分页加载数据
- 使用图片懒加载

### 2. 请求优化
- 启用请求缓存
- 合并多个请求
- 防抖处理搜索输入

### 3. 渲染优化
- 使用 v-show 代替 v-if（频繁切换时）
- 合理使用 computed 缓存计算结果
- 避免在 template 中直接调用方法

### 4. 资源优化
- 图片使用 WebP 格式
- 使用 CDN 加速静态资源
- 分包加载减少首屏时间

## 性能监控

```javascript
import { usePerformanceMonitor } from '@/composables'

const { metrics, recordApiCall, getReport } = usePerformanceMonitor()

// 记录 API 调用
recordApiCall(duration)

// 获取性能报告
const report = getReport()
console.log('平均 API 响应时间:', report.avgApiTime)
```
