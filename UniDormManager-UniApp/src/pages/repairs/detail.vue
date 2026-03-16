<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { repairApi } from '@/api/repair.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 报修ID
const repairId = ref(null)
const loading = ref(false)

// 报修详情数据
const repairDetail = ref({})

// 处理进度时间线
const timeline = ref([
  {
    status: 'submitted',
    title: '报修提交',
    time: '2024-12-20 14:30',
    desc: '您的报修申请已提交',
    icon: '📝',
    active: true
  },
  {
    status: 'assigned',
    title: '任务分配',
    time: '2024-12-20 15:00',
    desc: '已分配给维修人员：王师傅',
    icon: '👷',
    active: true
  },
  {
    status: 'processing',
    title: '维修中',
    time: '2024-12-21 08:30',
    desc: '维修人员已到达现场',
    icon: '🔧',
    active: true
  },
  {
    status: 'completed',
    title: '维修完成',
    time: '2024-12-21 09:15',
    desc: '灯管已更换，问题已解决',
    icon: '✅',
    active: true
  }
])

// 维修人员信息
const repairman = ref({
  name: '王师傅',
  phone: '13900139001',
  avatar: '王',
  rating: 4.8,
  completedCount: 156
})

// 评价相关
const showRating = ref(false)
const userRating = ref(0)
const ratingComment = ref('')
const ratingSubmitted = ref(false)

// 页面加载
onLoad((options) => {
  if (options.id) {
    repairId.value = parseInt(options.id)
    fetchRepairDetail()
  }
})

// 获取报修详情
const fetchRepairDetail = async () => {
  loading.value = true
  try {
    const res = await repairApi.getRepairDetail(repairId.value)
    if (res) {
      // 转换后端数据为前端格式
      repairDetail.value = {
        id: res.id,
        type: res.title ? res.title.split(' ')[0] : '其他',
        typeIcon: '🔧',
        description: res.description,
        status: res.status, // 后端已经转换过了
        urgent: res.priority === 'High',
        submitTime: res.date,
        updateTime: res.date, // 后端暂无更新时间字段
        location: res.roomNumber,
        images: res.images || [],
        contactPhone: res.contactPhone || '',
        submitter: {
          name: res.submitter?.name || '',
          studentId: res.submitter?.studentId || ''
        },
        _raw: res
      }
    }
  } catch (error) {
    console.error('获取报修详情失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 获取状态配置
const getStatusConfig = (status) => {
  const configs = {
    pending: {
      text: '待处理',
      bg: '#fef3c7',
      color: '#d97706',
      icon: '⏳',
      desc: '您的报修已提交，等待分配维修人员'
    },
    processing: {
      text: '处理中',
      bg: '#dbeafe',
      color: '#3b82f6',
      icon: '🔧',
      desc: '维修人员正在处理中'
    },
    completed: {
      text: '已完成',
      bg: '#d1fae5',
      color: '#059669',
      icon: '✅',
      desc: '维修已完成，感谢耐心等待'
    }
  }
  return configs[status] || configs.pending
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: repairDetail.value.images,
    current: repairDetail.value.images[index]
  })
}

// 拨打电话
const makeCall = (phone) => {
  uni.makePhoneCall({
    phoneNumber: phone
  })
}

// 提交评价
const submitRating = () => {
  if (userRating.value === 0) {
    uni.showToast({
      title: '请选择评分',
      icon: 'none'
    })
    return
  }

  uni.showLoading({ title: '提交中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    ratingSubmitted.value = true
    uni.showToast({
      title: '评价成功',
      icon: 'success'
    })
  }, 1000)
}

// 是否显示评价区域
const canRate = computed(() => {
  return repairDetail.value.status === 'completed' && !ratingSubmitted.value
})

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}
</script>

<template>
  <view class="repair-detail-page">
    <!-- 导航栏 -->
    <AppNavbar title="报修详情" showBack bgColor="#faf9f7" />

    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 内容区域 -->
    <view class="content" v-else>
      <!-- 状态卡片 -->
      <view class="status-card" :style="{ background: getStatusConfig(repairDetail.status).bg }">
        <view class="status-header">
          <text class="status-icon">{{ getStatusConfig(repairDetail.status).icon }}</text>
          <view class="status-info">
            <text class="status-text" :style="{ color: getStatusConfig(repairDetail.status).color }">
              {{ getStatusConfig(repairDetail.status).text }}
            </text>
            <text class="status-desc">{{ getStatusConfig(repairDetail.status).desc }}</text>
          </view>
        </view>
      </view>

      <!-- 报修信息 -->
      <view class="info-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>报修信息</text>
        </view>

        <view class="info-content">
          <view class="info-row">
            <text class="info-label">报修类型</text>
            <view class="info-value">
              <text class="type-icon-small">{{ repairDetail.typeIcon }}</text>
              <text>{{ repairDetail.type }}</text>
            </view>
          </view>

          <view class="info-row">
            <text class="info-label">报修位置</text>
            <text class="info-value">{{ repairDetail.location }}</text>
          </view>

          <view class="info-row">
            <text class="info-label">提交时间</text>
            <text class="info-value">{{ repairDetail.submitTime }}</text>
          </view>

          <view class="info-row">
            <text class="info-label">紧急程度</text>
            <view class="info-value">
              <text v-if="repairDetail.urgent" class="urgent-tag">紧急</text>
              <text v-else class="normal-tag">普通</text>
            </view>
          </view>
        </view>

        <view class="description-section">
          <text class="desc-label">问题描述</text>
          <text class="desc-content">{{ repairDetail.description }}</text>
        </view>

        <!-- 图片列表 -->
        <view class="images-section" v-if="repairDetail.images && repairDetail.images.length > 0">
          <text class="images-label">问题图片</text>
          <view class="images-list">
            <image
              v-for="(img, index) in repairDetail.images"
              :key="index"
              :src="img"
              class="repair-image"
              mode="aspectFill"
              @click="previewImage(index)"
            />
          </view>
        </view>
      </view>

      <!-- 处理进度 -->
      <view class="timeline-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>处理进度</text>
        </view>

        <view class="timeline">
          <view
            v-for="(item, index) in timeline"
            :key="item.status"
            class="timeline-item"
            :class="{ active: item.active }"
          >
            <view class="timeline-left">
              <view class="timeline-icon" :class="{ active: item.active }">
                <text>{{ item.icon }}</text>
              </view>
              <view v-if="index < timeline.length - 1" class="timeline-line"></view>
            </view>

            <view class="timeline-content">
              <view class="timeline-header">
                <text class="timeline-title">{{ item.title }}</text>
                <text class="timeline-time">{{ item.time }}</text>
              </view>
              <text class="timeline-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 维修人员 -->
      <view class="repairman-card" v-if="repairDetail.status !== 'pending'">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>维修人员</text>
        </view>

        <view class="repairman-info">
          <view class="repairman-avatar">
            <text>{{ repairman.avatar }}</text>
          </view>

          <view class="repairman-detail">
            <view class="repairman-header">
              <text class="repairman-name">{{ repairman.name }}</text>
              <view class="repairman-rating">
                <text class="rating-star">⭐</text>
                <text class="rating-value">{{ repairman.rating }}</text>
              </view>
            </view>
            
            <text class="repairman-stats">已完成 {{ repairman.completedCount }} 单</text>
          </view>

          <view class="call-btn" @click="makeCall(repairman.phone)">
            <text class="call-icon">📞</text>
          </view>
        </view>
      </view>

      <!-- 评价区域 -->
      <view class="rating-card" v-if="canRate">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>服务评价</text>
        </view>

        <view class="rating-section">
          <text class="rating-label">请对本次服务进行评分</text>
          
          <view class="rating-stars">
            <text
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ active: n <= userRating }"
              @click="userRating = n"
            >
              {{ n <= userRating ? '⭐' : '☆' }}
            </text>
          </view>

          <view class="comment-wrapper">
            <textarea
              class="comment-input"
              v-model="ratingComment"
              placeholder="请输入您的评价（可选）"
              maxlength="200"
            />
            <text class="char-count">{{ ratingComment.length }}/200</text>
          </view>

          <button class="submit-rating-btn" @click="submitRating">
            提交评价
          </button>
        </view>
      </view>

      <!-- 已评价提示 -->
      <view class="rated-card" v-if="ratingSubmitted">
        <view class="rated-content">
          <text class="rated-icon">🎉</text>
          <text class="rated-text">感谢您的评价！</text>
        </view>
      </view>

      <!-- 底部间距 -->
      <view style="height: 40px;"></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.repair-detail-page {
  min-height: 100vh;
  background: $bg-primary;
}

.content {
  padding: 16px;
  padding-bottom: 40px;
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 60px 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $warm-gray-200;
  border-top-color: $sage-500;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: $warm-gray-500;
}

// 状态卡片
.status-card {
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-icon {
  width: 56px;
  height: 56px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: $shadow-sm;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 20px;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.status-desc {
  font-size: 13px;
  color: $warm-gray-600;
}

// 通用卡片样式
.info-card,
.timeline-card,
.repairman-card,
.rating-card,
.rated-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: $sage-600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: $sage-500;
  border-radius: 2px;
}

// 报修信息
.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid $warm-gray-100;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: $warm-gray-500;
}

.info-value {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-icon-small {
  font-size: 16px;
}

.urgent-tag {
  background: $terracotta-100;
  color: $terracotta-600;
  padding: 4px 10px;
  border-radius: $radius-full;
  font-size: 12px;
}

.normal-tag {
  background: $warm-gray-100;
  color: $warm-gray-500;
  padding: 4px 10px;
  border-radius: $radius-full;
  font-size: 12px;
}

// 问题描述
.description-section {
  margin-bottom: 16px;
}

.desc-label {
  font-size: 14px;
  color: $warm-gray-500;
  display: block;
  margin-bottom: 10px;
}

.desc-content {
  font-size: 14px;
  color: $text-primary;
  line-height: 1.7;
}

// 图片列表
.images-section {
  padding-top: 16px;
  border-top: 1px solid $warm-gray-100;
}

.images-label {
  font-size: 14px;
  color: $warm-gray-500;
  display: block;
  margin-bottom: 10px;
}

.images-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.repair-image {
  width: 90px;
  height: 90px;
  border-radius: $radius-md;
  object-fit: cover;
}

// 时间线
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 14px;
  position: relative;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
}

.timeline-icon {
  width: 36px;
  height: 36px;
  background: $warm-gray-100;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.timeline-icon.active {
  background: $sage-500;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: $warm-gray-200;
  margin: 8px 0;
}

.timeline-content {
  flex: 1;
  padding-bottom: 24px;
}

.timeline-item:last-child .timeline-content {
  padding-bottom: 0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.timeline-title {
  font-size: 15px;
  font-weight: 500;
  color: $text-primary;
}

.timeline-time {
  font-size: 12px;
  color: $warm-gray-400;
}

.timeline-desc {
  font-size: 13px;
  color: $warm-gray-500;
  line-height: 1.5;
}

// 维修人员
.repairman-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.repairman-avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sage-300, $sage-400);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.repairman-avatar text {
  font-size: 24px;
  color: #fff;
}

.repairman-detail {
  flex: 1;
}

.repairman-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.repairman-name {
  font-size: 16px;
  font-weight: 500;
  color: $text-primary;
}

.repairman-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 193, 7, 0.15);
  padding: 4px 8px;
  border-radius: $radius-full;
}

.rating-star {
  font-size: 12px;
}

.rating-value {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
}

.repairman-stats {
  font-size: 13px;
  color: $warm-gray-500;
}

.call-btn {
  width: 44px;
  height: 44px;
  background: $sage-100;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-icon {
  font-size: 20px;
}

// 评价区域
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.rating-label {
  font-size: 14px;
  color: $warm-gray-600;
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.star {
  font-size: 32px;
  color: $warm-gray-300;
  transition: all 0.2s ease;
}

.star.active {
  color: #ffc107;
}

.comment-wrapper {
  width: 100%;
  position: relative;
  margin-bottom: 16px;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  padding-bottom: 32px;
  background: $bg-secondary;
  border-radius: $radius-lg;
  font-size: 14px;
  color: $text-primary;
}

.comment-input::placeholder {
  color: $warm-gray-400;
}

.char-count {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 12px;
  color: $warm-gray-400;
}

.submit-rating-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border-radius: $radius-lg;
  border: none;
  box-shadow: $shadow-sm;
}

.submit-rating-btn:active {
  opacity: 0.9;
}

// 已评价卡片
.rated-card {
  background: linear-gradient(135deg, rgba($sage-300, 0.2), rgba($sage-200, 0.3));
  border: 1px solid rgba($sage-400, 0.3);
}

.rated-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.rated-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.rated-text {
  font-size: 16px;
  font-weight: 500;
  color: $sage-600;
}
</style>
