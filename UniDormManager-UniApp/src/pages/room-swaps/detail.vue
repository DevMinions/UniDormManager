<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { roomSwapApi } from '@/api/roomSwap.js'
import { isDormStaff } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 申请ID
const applicationId = ref('')
const loading = ref(false)
const processing = ref(false)

// 申请详情
const application = ref(null)

// 审批表单
const approvalForm = ref({
  status: 'Approved',
  comment: ''
})

// 用户角色
const userRoles = computed(() => {
  const roles = userStore.userInfo?.roles || []
  return roles.map(r => typeof r === 'string' ? r : r.code)
})

const isManager = computed(() => isDormStaff(userRoles.value))

// 是否可以审批
const canApprove = computed(() => {
  if (!isManager.value || !application.value) return false
  // 只有待审批状态可以审批
  return ['Pending', 'CounselorApproved', 'CollegeApproved'].includes(application.value.status)
})

// 是否显示审批弹窗
const showApprovalModal = ref(false)

// 页面加载
onLoad((options) => {
  if (options.id) {
    applicationId.value = options.id
    loadDetail()
  }
})

// 加载详情
const loadDetail = async () => {
  loading.value = true
  try {
    // 获取列表中找到对应详情（实际应该调用详情接口）
    const res = await roomSwapApi.getMyApplications()
    const list = res || []
    application.value = list.find(item => item.id === applicationId.value)
    
    if (!application.value) {
      uni.showToast({
        title: '申请不存在',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    handleApiError(error, '获取申请详情失败')
  } finally {
    loading.value = false
  }
}

// 状态映射
const statusMap = {
  Pending: { label: '待审批', color: '#D97706', bgColor: '#FEF3C7', step: 1 },
  CounselorApproved: { label: '辅导员已通过', color: '#3B82F6', bgColor: '#DBEAFE', step: 2 },
  CounselorRejected: { label: '辅导员已拒绝', color: '#DC2626', bgColor: '#FEE2E2', step: -1 },
  CollegeApproved: { label: '学院已通过', color: '#3B82F6', bgColor: '#DBEAFE', step: 3 },
  CollegeRejected: { label: '学院已拒绝', color: '#DC2626', bgColor: '#FEE2E2', step: -1 },
  FinalApproved: { label: '公寓中心已通过', color: '#059669', bgColor: '#D1FAE5', step: 4 },
  FinalRejected: { label: '公寓中心已拒绝', color: '#DC2626', bgColor: '#FEE2E2', step: -1 },
  Completed: { label: '已完成', color: '#059669', bgColor: '#D1FAE5', step: 5 },
  Cancelled: { label: '已取消', color: '#64748B', bgColor: '#F1F5F9', step: 0 }
}

// 获取状态信息
const getStatusInfo = (status) => {
  return statusMap[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9', step: 0 }
}

// 紧急程度映射
const urgencyMap = {
  Normal: { label: '普通', color: '#64748B' },
  Urgent: { label: '紧急', color: '#D97706' },
  VeryUrgent: { label: '非常紧急', color: '#DC2626' }
}

const getUrgencyInfo = (urgency) => {
  return urgencyMap[urgency] || { label: urgency, color: '#64748B' }
}

// 审批流程步骤
const approvalSteps = [
  { key: 'counselor', label: '辅导员审批', icon: '👨‍🏫' },
  { key: 'college', label: '学院审批', icon: '🏛️' },
  { key: 'apartment', label: '公寓中心', icon: '🏠' }
]

// 获取当前步骤状态
const getStepStatus = (stepIndex) => {
  if (!application.value) return 'pending'
  const step = getStatusInfo(application.value.status).step
  
  if (step < 0) {
    // 被拒绝
    if (stepIndex === 0 && application.value.status === 'CounselorRejected') return 'rejected'
    if (stepIndex === 1 && application.value.status === 'CollegeRejected') return 'rejected'
    if (stepIndex === 2 && application.value.status === 'FinalRejected') return 'rejected'
    if (stepIndex < Math.abs(step) - 1) return 'completed'
    return 'pending'
  }
  
  if (step > stepIndex + 1) return 'completed'
  if (step === stepIndex + 1) return 'active'
  return 'pending'
}

// 打开审批弹窗
const openApprovalModal = () => {
  approvalForm.value = { status: 'Approved', comment: '' }
  showApprovalModal.value = true
}

// 关闭审批弹窗
const closeApprovalModal = () => {
  showApprovalModal.value = false
}

// 提交审批
const submitApproval = async () => {
  if (!approvalForm.value.comment.trim()) {
    uni.showToast({ title: '请填写审批意见', icon: 'none' })
    return
  }
  
  processing.value = true
  try {
    await roomSwapApi.approveApplication(applicationId.value, {
      status: approvalForm.value.status,
      comment: approvalForm.value.comment
    })
    uni.showToast({
      title: '审批成功',
      icon: 'success'
    })
    showApprovalModal.value = false
    loadDetail() // 刷新详情
  } catch (error) {
    handleApiError(error, '审批失败')
  } finally {
    processing.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-container">
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar title="申请详情" showBack @back="goBack" />
    
    <view class="content">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 详情内容 -->
      <view v-else-if="application" class="detail-content">
        <!-- 状态卡片 -->
        <view 
          class="status-card"
          :style="{ background: getStatusInfo(application.status).bgColor }"
        >
          <view class="status-header">
            <text class="status-icon">
              {{ getStatusInfo(application.status).step >= 0 ? '📋' : '❌' }}
            </text>
            <view class="status-info">
              <text 
                class="status-text"
                :style="{ color: getStatusInfo(application.status).color }"
              >
                {{ getStatusInfo(application.status).label }}
              </text>
              <text class="status-desc">
                {{ getStatusInfo(application.status).step >= 0 ? '申请正在处理中' : '申请已被拒绝' }}
              </text>
            </view>
          </view>
        </view>
        
        <!-- 审批进度 -->
        <view class="progress-card">
          <view class="card-title">审批进度</view>
          
          <view class="progress-steps">
            <view
              v-for="(step, index) in approvalSteps"
              :key="step.key"
              class="progress-step"
              :class="getStepStatus(index)"
            >
              <view class="step-icon">{{ step.icon }}</view>
              <view class="step-info">
                <text class="step-label">{{ step.label }}</text>
                <text class="step-status">
                  {{ 
                    getStepStatus(index) === 'completed' ? '已通过' :
                    getStepStatus(index) === 'active' ? '审批中' :
                    getStepStatus(index) === 'rejected' ? '已拒绝' :
                    '待审批'
                  }}
                </text>
              </view>
              
              <view v-if="index < approvalSteps.length - 1" class="step-line"></view>
            </view>
          </view>
        </view>
        
        <!-- 申请信息 -->
        <view class="info-card"
        >
          <view class="card-title">申请信息</view>
          
          <view class="info-list"
          >
            <view class="info-item"
            >
              <text class="info-label">申请人</text>
              <text class="info-value">{{ application.applicantName || '-' }}</text>
            </view>
            
            <view class="info-item"
            >
              <text class="info-label">当前房间</text>
              <text class="info-value">{{ application.currentRoom }}</text>
            </view>
            
            <view class="info-item"
            >
              <text class="info-label">目标房间</text>
              <text class="info-value highlight">{{ application.targetRoom }}</text>
            </view>
            
            <view class="info-item"
            >
              <text class="info-label">紧急程度</text>
              <text 
                class="info-value"
                :style="{ color: getUrgencyInfo(application.urgencyLevel).color }"
              >
                {{ getUrgencyInfo(application.urgencyLevel).label }}
              </text>
            </view>
            
            <view class="info-item"
            >
              <text class="info-label">申请时间</text>
              <text class="info-value">{{ application.applyDate || application.createdAt }}</text>
            </view>
          </view>
        </view>
        
        <!-- 申请原因 -->
        <view class="reason-card"
        >
          <view class="card-title">申请原因</view>
          <text class="reason-content">{{ application.reason }}</text>
        </view>
      </view>
    </view>
    
    <!-- 审批按钮（管理员显示） -->
    <view v-if="canApprove" class="action-bar"
    >
      <view class="action-btn approve" @click="openApprovalModal"
      >
        <text>去审批</text>
      </view>
    </view>
    
    <!-- 审批弹窗 -->
    <view v-if="showApprovalModal" class="modal-mask" @click="closeApprovalModal"
    >
      <view class="modal-content" @click.stop
      >
        <view class="modal-header"
        >
          <text class="modal-title">审批申请</text>
          <text class="modal-close" @click="closeApprovalModal">✕</text>
        </view>
        
        <view class="modal-body"
        >
          <!-- 审批结果 -->
          <view class="form-item"
          >
            <text class="form-label">审批结果</text>
            
            <view class="radio-group"
            >
              <view 
                class="radio-option"
                :class="{ active: approvalForm.status === 'Approved' }"
                @click="approvalForm.status = 'Approved'"
              >
                <view class="radio-dot">
                  <view v-if="approvalForm.status === 'Approved'" class="radio-dot-inner"></view>
                </view>
                <text>通过</text>
              </view>
              
              <view 
                class="radio-option"
                :class="{ active: approvalForm.status === 'Rejected' }"
                @click="approvalForm.status = 'Rejected'"
              >
                <view class="radio-dot">
                  <view v-if="approvalForm.status === 'Rejected'" class="radio-dot-inner"></view>
                </view>
                <text>拒绝</text>
              </view>
            </view>
          </view>
          
          <!-- 审批意见 -->
          <view class="form-item"
          >
            <text class="form-label">审批意见</text>
            
            <textarea
              v-model="approvalForm.comment"
              class="form-textarea"
              placeholder="请填写审批意见..."
              maxlength="200"
            />
          </view>
        </view>
        
        <view class="modal-footer"
        >
          <view class="btn-cancel" @click="closeApprovalModal">取消</view>
          
          <view 
            class="btn-confirm"
            :class="{ loading: processing }"
            @click="submitApproval"
          >
            <text v-if="processing">处理中...</text>
            <text v-else>确认</text>
          </view>
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
  padding-bottom: 140rpx;
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
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E8D4CD;
  border-top-color: #9A3412;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 26rpx;
  color: #64748B;
}

/* 状态卡片 */
.status-card {
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid transparent;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.status-icon {
  font-size: 48rpx;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 8rpx;
}

.status-desc {
  font-size: 26rpx;
  color: #64748B;
}

/* 进度卡片 */
.progress-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 24rpx;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  position: relative;
}

.progress-step.completed {
  opacity: 1;
}

.progress-step.active {
  opacity: 1;
}

.progress-step.pending {
  opacity: 0.5;
}

.progress-step.rejected {
  opacity: 1;
}

.step-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.progress-step.completed .step-icon {
  background: #D1FAE5;
}

.progress-step.active .step-icon {
  background: #DBEAFE;
}

.progress-step.rejected .step-icon {
  background: #FEE2E2;
}

.step-info {
  flex: 1;
}

.step-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  display: block;
  margin-bottom: 4rpx;
}

.step-status {
  font-size: 24rpx;
  color: #6B7280;
}

.progress-step.completed .step-status {
  color: #059669;
}

.progress-step.active .step-status {
  color: #3B82F6;
  font-weight: 500;
}

.progress-step.rejected .step-status {
  color: #DC2626;
}

.step-line {
  position: absolute;
  left: 32rpx;
  top: 84rpx;
  width: 2rpx;
  height: 40rpx;
  background: #E5E7EB;
}

.progress-step.completed .step-line {
  background: #6EE7B7;
}

/* 信息卡片 */
.info-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 28rpx;
  color: #6B7280;
}

.info-value {
  font-size: 28rpx;
  color: #1E293B;
  font-weight: 500;
}

.info-value.highlight {
  color: #9A3412;
  font-size: 32rpx;
}

/* 原因卡片 */
.reason-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.reason-content {
  font-size: 28rpx;
  color: #374151;
  line-height: 1.8;
}

/* 操作栏 */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.action-btn.approve {
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  color: #ffffff;
}

.action-btn:active {
  transform: scale(0.98);
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1E293B;
}

.modal-close {
  font-size: 40rpx;
  color: #9CA3AF;
  padding: 8rpx;
}

.modal-body {
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 28rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
  margin-bottom: 16rpx;
  display: block;
}

.radio-group {
  display: flex;
  gap: 32rpx;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: #6B7280;
}

.radio-option.active {
  color: #1E293B;
}

.radio-dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 4rpx solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-option.active .radio-dot {
  border-color: #9A3412;
}

.radio-dot-inner {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #9A3412;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #1E293B;
  border: 2rpx solid #E5E7EB;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.btn-cancel {
  background: #F3F4F6;
  color: #6B7280;
}

.btn-confirm {
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  color: #ffffff;
}

.btn-confirm.loading {
  opacity: 0.7;
}
</style>
