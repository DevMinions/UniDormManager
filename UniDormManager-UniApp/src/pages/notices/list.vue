<script setup>
import { ref, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { noticeApi } from '@/api/notice.js'
import { handleApiError } from '@/utils/helpers.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const keyword = ref('')
const selectedType = ref('')
const loading = ref(false)
const notices = ref([])

// 公告类型 - 新配色
const noticeTypes = ref([
  { id: '', name: '全部', icon: '📋', color: '#9A3412', bgColor: '#F8F2F0' },
  { id: 'notification', name: '通知', icon: '📢', color: '#9A3412', bgColor: '#F8F2F0' },
  { id: 'activity', name: '活动', icon: '🎉', color: '#059669', bgColor: '#ECFDF5' },
  { id: 'repair', name: '维修', icon: '🔧', color: '#D97706', bgColor: '#FEF3C7' },
  { id: 'safety', name: '安全', icon: '🛡️', color: '#DC2626', bgColor: '#FEE2E2' }
])

// 类型映射 - 新配色
const typeMap = {
  notification: { name: '通知', icon: '📢', color: '#9A3412', bgColor: '#F8F2F0', borderColor: '#E8D4CD' },
  activity: { name: '活动', icon: '🎉', color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
  repair: { name: '维修', icon: '🔧', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FCD34D' },
  safety: { name: '安全', icon: '🛡️', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#FECACA' },
  important: { name: '重要', icon: '🔔', color: '#9A3412', bgColor: '#FEF3C7', borderColor: '#FDE68A' }
}

onMounted(() => {
  loadNotices()
})

onPullDownRefresh(() => {
  loadNotices().finally(() => {
    uni.stopPullDownRefresh()
  })
})

// 转换后端数据为前端格式
const convertNoticeData = (data) => {
  if (!data) return []
  // 处理分页响应或数组
  const list = Array.isArray(data) ? data : (data.data || data.list || [])
  return list.map(item => {
    // 判断是否为新公告（24小时内）
    const publishDate = new Date(item.date || item.publishTime || item.createdAt)
    const now = new Date()
    const diff = now - publishDate
    const isNew = diff < 24 * 60 * 60 * 1000
    
    // 从内容推断类型
    let type = 'notification'
    const content = (item.content || item.summary || '').toLowerCase()
    if (content.includes('活动') || content.includes('报名') || content.includes('比赛')) {
      type = 'activity'
    } else if (content.includes('维修') || content.includes('停水') || content.includes('停电')) {
      type = 'repair'
    } else if (content.includes('安全') || content.includes('检查') || content.includes('违规')) {
      type = 'safety'
    }
    
    return {
      id: item.id,
      title: item.title,
      summary: item.summary || (item.content ? item.content.substring(0, 100) + '...' : ''),
      content: item.content,
      author: item.author,
      publishTime: item.date || item.publishTime || item.createdAt,
      type: type,
      isNew: isNew,
      _raw: item
    }
  })
}

const loadNotices = async () => {
  loading.value = true
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    if (selectedType.value) params.type = selectedType.value
    
    const res = await noticeApi.getNoticeList(params)
    // 转换后端数据为前端格式
    notices.value = convertNoticeData(res)
  } catch (error) {
    handleApiError(error, '获取公告列表失败')
  } finally {
    loading.value = false
  }
}

const getTypeInfo = (type) => {
  return typeMap[type] || typeMap.notification
}

const selectType = (typeId) => {
  selectedType.value = typeId
}

const filteredNotices = computed(() => {
  let result = notices.value
  
  if (selectedType.value) {
    result = result.filter(item => item.type === selectedType.value)
  }
  
  if (keyword.value.trim()) {
    const searchKey = keyword.value.toLowerCase()
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchKey) ||
      item.summary.toLowerCase().includes(searchKey)
    )
  }
  
  return result
})

const goToDetail = (notice) => {
  uni.navigateTo({
    url: `/pages/notices/detail?id=${notice.id}`
  })
}
</script>

<template>
  <view class="page-container">
    <!-- 背景 -->
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="公告通知" />
    
    <view class="content">
      <!-- 搜索栏 -->
      <view class="search-bar">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="搜索公告..."
            placeholder-class="placeholder"
          />
          <text 
            v-if="keyword" 
            class="clear-btn"
            @click="keyword = ''"
          >✕</text>
        </view>
      </view>
      
      <!-- 类型筛选 -->
      <view class="type-filter">
        <scroll-view scroll-x class="filter-scroll">
          <view 
            v-for="type in noticeTypes" 
            :key="type.id"
            class="filter-item"
            :class="{ active: selectedType === type.id }"
            :style="{ 
              background: selectedType === type.id ? type.bgColor : '#ffffff',
              borderColor: selectedType === type.id ? type.color : '#E8D4CD'
            }"
            @click="selectType(type.id)"
          >
            <text class="filter-icon">{{ type.icon }}</text>
            <text 
              class="filter-text"
              :style="{ color: selectedType === type.id ? type.color : '#64748B' }"
            >
              {{ type.name }}
            </text>
          </view>
        </scroll-view>
      </view>
      
      <!-- 公告列表 -->
      <view class="notice-list">
        <view 
          v-for="(notice, index) in filteredNotices" 
          :key="notice.id"
          class="notice-item"
          :style="{ 
            borderLeftColor: getTypeInfo(notice.type).color,
            animationDelay: `${index * 80}ms`
          }"
          @click="goToDetail(notice)"
        >
          <!-- 类型标签 -->
          <view 
            class="type-tag"
            :style="{ 
              background: getTypeInfo(notice.type).bgColor,
              borderColor: getTypeInfo(notice.type).borderColor,
              color: getTypeInfo(notice.type).color
            }"
          >
            <text>{{ getTypeInfo(notice.type).icon }}</text>
            <text>{{ getTypeInfo(notice.type).name }}</text>
          </view>
          
          <!-- 内容 -->
          <view class="notice-content">
            <view class="notice-header">
              <text class="notice-title">{{ notice.title }}</text>
              <view v-if="notice.isNew" class="new-badge">新</view>
            </view>
            
            <text class="notice-summary">{{ notice.summary }}</text>
            
            <view class="notice-meta">
              <text class="meta-author">{{ notice.author }}</text>
              <text class="meta-time">{{ notice.publishTime }}</text>
            </view>
          </view>
          
          <!-- 箭头 -->
          <text class="notice-arrow">›</text>
        </view>
        
        <!-- 空状态 -->
        <view v-if="filteredNotices.length === 0" class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无公告</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #FFFBEB;
  position: relative;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
  opacity: 0.3;
}

.blob-1 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, rgba(154, 52, 18, 0.3), rgba(176, 122, 107, 0.2));
  top: -80rpx;
  right: -60rpx;
}

.blob-2 {
  width: 250rpx;
  height: 250rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(16, 185, 129, 0.15));
  bottom: 200rpx;
  left: -60rpx;
}

.content {
  position: relative;
  z-index: 1;
  padding: 24rpx;
  padding-bottom: 160rpx;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 24rpx;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 4rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
  color: #1E293B;
}

.placeholder {
  color: #9CA3AF;
}

.clear-btn {
  font-size: 28rpx;
  color: #9CA3AF;
  padding: 8rpx;
}

/* 类型筛选 */
.type-filter {
  margin-bottom: 24rpx;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 28rpx;
  border-radius: 32rpx;
  margin-right: 16rpx;
  border: 2rpx solid;
  transition: all 0.2s ease;
  background: #ffffff;
}

.filter-item.active {
  border-width: 2rpx;
}

.filter-icon {
  font-size: 28rpx;
}

.filter-text {
  font-size: 26rpx;
  font-weight: 500;
}

/* 公告列表 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border-left: 6rpx solid;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.notice-item:active {
  background: #F8F2F0;
}

.type-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: 2rpx solid;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.notice-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
  flex: 1;
}

.new-badge {
  background: #DC2626;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.notice-summary {
  font-size: 26rpx;
  color: #64748B;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meta-author {
  font-size: 24rpx;
  color: #9A3412;
  font-weight: 500;
}

.meta-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

.notice-arrow {
  font-size: 36rpx;
  color: #C49A8D;
  font-weight: 300;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 30rpx;
  color: #9CA3AF;
}
</style>
