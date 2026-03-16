<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { roomSwapApi } from '@/api/roomSwap.js'
import { roomApi } from '@/api/room.js'
import { 
  handleApiError, 
  showSuccess,
  validateForm,
  showFirstError
} from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 检查登录
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

// 表单数据
const formData = ref({
  targetRoom: '',
  reason: '',
  urgencyLevel: 'Normal'
})

// 加载状态
const loading = ref(false)
const submitting = ref(false)
const rooms = ref([])

// 紧急程度选项
const urgencyOptions = [
  { value: 'Normal', label: '普通', color: '#64748B', desc: '正常申请，按流程处理' },
  { value: 'Urgent', label: '紧急', color: '#D97706', desc: '有特殊情况，需要加急处理' },
  { value: 'VeryUrgent', label: '非常紧急', color: '#DC2626', desc: '极特殊情况，需要立即处理' }
]

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadRooms()
})

// 加载可用房间
const loadRooms = async () => {
  loading.value = true
  try {
    const res = await roomApi.getRoomList({ status: 'Available' })
    // 处理分页响应或数组
    const list = Array.isArray(res) ? res : (res.data || res.list || [])
    rooms.value = list.filter(r => r.status === 'Available' || r.status === 'free')
  } catch (error) {
    handleApiError(error, '获取房间列表失败')
  } finally {
    loading.value = false
  }
}

// 选择目标房间
const selectTargetRoom = () => {
  const roomOptions = rooms.value.map(r => ({
    value: r.number || r.roomNumber,
    label: `${r.number || r.roomNumber} (${r.building})`
  }))
  
  if (roomOptions.length === 0) {
    uni.showToast({
      title: '暂无可用房间',
      icon: 'none'
    })
    return
  }
  
  uni.showActionSheet({
    itemList: roomOptions.map(r => r.label),
    success: (res) => {
      formData.value.targetRoom = roomOptions[res.tapIndex].value
    }
  })
}

// 选择紧急程度
const selectUrgency = () => {
  uni.showActionSheet({
    itemList: urgencyOptions.map(u => u.label),
    success: (res) => {
      formData.value.urgencyLevel = urgencyOptions[res.tapIndex].value
    }
  })
}

// 获取紧急程度信息
const getUrgencyInfo = (value) => {
  return urgencyOptions.find(u => u.value === value) || urgencyOptions[0]
}

// 验证规则配置
const validationRules = {
  targetRoom: ['required'],
  reason: [
    'required',
    { type: 'minLength', value: 10, message: '申请原因至少需要10个字' },
    { type: 'maxLength', value: 500 }
  ]
}

// 验证表单
const checkForm = () => {
  const { valid, errors } = validateForm(formData.value, validationRules)
  if (!valid) {
    showFirstError(errors)
    return false
  }
  return true
}
  return true
}

// 提交申请
const submitApplication = async () => {
  if (!checkForm()) return
  
  submitting.value = true
  try {
    await roomSwapApi.createApplication(formData.value)
    uni.showToast({
      title: '申请提交成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    handleApiError(error, '提交申请失败')
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-container">
    <!-- 背景 -->
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="申请换寝" showBack @back="goBack" />
    
    <view class="content">
      <!-- 提示卡片 -->
      <view class="tips-card">
        <view class="tips-header">
          <text class="tips-icon">💡</text>
          <text class="tips-title">申请须知</text>
        </view>
        <view class="tips-list">
          <view class="tip-item">
            <text class="tip-dot">•</text>
            <text class="tip-text">换寝申请需要辅导员、学院、公寓中心逐级审批</text>
          </view>
          <view class="tip-item">
            <text class="tip-dot">•</text>
            <text class="tip-text">审批通过后需在规定时间内完成换寝</text>
          </view>
          <view class="tip-item">
            <text class="tip-dot">•</text>
            <text class="tip-text">请确保目标房间有空余床位</text>
          </view>
        </view>
      </view>
      
      <!-- 表单 -->
      <view class="form-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>申请信息</text>
        </view>
        
        <!-- 目标房间 -->
        <view class="form-item">
          <view class="item-label required">
            <text class="label-icon">🏠</text>
            <text>目标房间</text>
          </view>
          <view 
            class="item-input selector"
            :class="{ active: formData.targetRoom }"
            @click="selectTargetRoom"
          >
            <text class="input-text" :class="{ placeholder: !formData.targetRoom }">
              {{ formData.targetRoom || '请选择目标房间' }}
            </text>
            <text class="input-arrow">›</text>
          </view>
        </view>
        
        <!-- 紧急程度 -->
        <view class="form-item">
          <view class="item-label">
            <text class="label-icon">⚡</text>
            <text>紧急程度</text>
          </view>
          <view 
            class="urgency-selector"
            @click="selectUrgency"
          >
            <view 
              v-for="option in urgencyOptions" 
              :key="option.value"
              class="urgency-option"
              :class="{ active: formData.urgencyLevel === option.value }"
              :style="{
                background: formData.urgencyLevel === option.value ? option.color + '20' : '#F1F5F9',
                borderColor: formData.urgencyLevel === option.value ? option.color : 'transparent'
              }"
            >
              <text 
                class="option-label"
                :style="{ color: formData.urgencyLevel === option.value ? option.color : '#64748B' }"
              >
                {{ option.label }}
              </text>
            </view>
          </view>          
          <text class="urgency-desc">{{ getUrgencyInfo(formData.urgencyLevel).desc }}</text>
        </view>
        
        <!-- 申请原因 -->
        <view class="form-item">
          <view class="item-label required">
            <text class="label-icon">📝</text>
            <text>申请原因</text>
          </view>
          <textarea
            v-model="formData.reason"
            class="item-textarea"
            placeholder="请详细说明换寝原因，至少需要10个字..."
            maxlength="500"
            auto-height
          />
          <view class="textarea-count">
            <text :class="{ warning: formData.reason.length < 10 }">
              {{ formData.reason.length }}/500
            </text>
          </view>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-section">
        <view 
          class="submit-btn"
          :class="{ loading: submitting }"
          @click="submitApplication"
        >
          <text v-if="submitting">提交中...</text>
          <text v-else>提交申请</text>
        </view>
        
        <text class="submit-tips">提交后可在换寝申请列表查看进度</text>
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
  opacity: 0.25;
}

.blob-1 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.4), rgba(251, 191, 36, 0.2));
  top: -60rpx;
  right: -60rpx;
}

.blob-2 {
  width: 250rpx;
  height: 250rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(16, 185, 129, 0.15));
  bottom: 200rpx;
  left: -50rpx;
}

.content {
  position: relative;
  z-index: 1;
  padding: 24rpx;
  padding-bottom: 48rpx;
}

/* 提示卡片 */
.tips-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #FCD34D;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tips-icon {
  font-size: 32rpx;
}

.tips-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #92400E;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}

.tip-dot {
  font-size: 24rpx;
  color: #D97706;
  line-height: 1.5;
}

.tip-text {
  font-size: 26rpx;
  color: #78350F;
  line-height: 1.5;
  flex: 1;
}

/* 表单卡片 */
.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  margin-bottom: 32rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.title-bar {
  width: 8rpx;
  height: 32rpx;
  background: linear-gradient(180deg, #9A3412, #C2410C);
  border-radius: 4rpx;
}

/* 表单项 */
.form-item {
  margin-bottom: 32rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
}

.item-label.required::after {
  content: '*';
  color: #DC2626;
  margin-left: 4rpx;
}

.label-icon {
  font-size: 28rpx;
}

.item-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 0 24rpx;
  border: 2rpx solid #E5E7EB;
  transition: all 0.2s ease;
}

.item-input.selector {
  background: #FFFBEB;
  border-color: #FDE68A;
}

.item-input.selector.active {
  background: #FEF3C7;
  border-color: #F59E0B;
}

.input-text {
  font-size: 28rpx;
  color: #1E293B;
}

.input-text.placeholder {
  color: #9CA3AF;
}

.input-arrow {
  font-size: 32rpx;
  color: #9A3412;
}

/* 紧急程度选择器 */
.urgency-selector {
  display: flex;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.urgency-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.urgency-option.active {
  font-weight: 600;
}

.option-label {
  font-size: 26rpx;
}

.urgency-desc {
  font-size: 24rpx;
  color: #6B7280;
  padding-left: 8rpx;
}

/* 文本域 */
.item-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1E293B;
  border: 2rpx solid #E5E7EB;
  box-sizing: border-box;
}

.textarea-count {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #9CA3AF;
}

.textarea-count .warning {
  color: #DC2626;
}

/* 提交区域 */
.submit-section {
  padding: 0 24rpx;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.35);
  margin-bottom: 16rpx;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn.loading {
  opacity: 0.7;
}

.submit-tips {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>
