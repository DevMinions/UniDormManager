<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { inspectionApi } from '@/api/inspection.js'
import { roomApi } from '@/api/room.js'
import { isDormStaff } from '@/config/roles.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 检查登录和权限
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isDormStaff(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 当前步骤
const currentStep = ref(1) // 1: 选择房间, 2: 录入评分

// 房间列表
const rooms = ref([])
const selectedRoom = ref(null)
const loadingRooms = ref(false)

// 评分表单
const scoreForm = ref({
  roomNumber: '',
  building: '',
  overallScore: 85,
  items: {
    hygiene: { score: 20, maxScore: 25, label: '卫生状况', icon: '🧹' },
    tidiness: { score: 20, maxScore: 25, label: '物品整洁', icon: '📦' },
    safety: { score: 20, maxScore: 25, label: '安全规范', icon: '🔒' },
    discipline: { score: 20, maxScore: 25, label: '纪律表现', icon: '⏰' }
  },
  issues: [],
  comment: '',
  photos: []
})

// 问题选项
const issueOptions = [
  { value: 'bed_unmade', label: '床铺未整理' },
  { value: 'garbage', label: '垃圾未清理' },
  { value: 'desk_clutter', label: '桌面凌乱' },
  { value: 'illegal_appliance', label: '违规电器' },
  { value: 'power_issue', label: '私拉电线' },
  { value: 'smoking', label: '吸烟痕迹' },
  { value: 'noise', label: '噪音扰民' },
  { value: 'other', label: '其他问题' }
]

// 提交状态
const submitting = ref(false)

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  loadRooms()
})

// 加载房间列表
const loadRooms = async () => {
  loadingRooms.value = true
  try {
    const res = await roomApi.getRoomList()
    const list = Array.isArray(res) ? res : (res.data || res.list || [])
    // 只显示已入住的房间
    rooms.value = list.filter(r => r.status === 'occupied' || r.occupied > 0)
  } catch (error) {
    console.error('加载房间失败:', error)
    uni.showToast({ title: '加载房间失败', icon: 'none' })
  } finally {
    loadingRooms.value = false
  }
}

// 选择房间
const selectRoom = (room) => {
  selectedRoom.value = room
  scoreForm.value.roomNumber = room.number || room.roomNumber
  scoreForm.value.building = room.building
}

// 确认选择，进入评分
const confirmRoom = () => {
  if (!selectedRoom.value) {
    uni.showToast({ title: '请先选择房间', icon: 'none' })
    return
  }
  currentStep.value = 2
}

// 返回选择房间
const goBackToSelect = () => {
  currentStep.value = 1
}

// 计算总分
const totalScore = computed(() => {
  let total = 0
  let maxTotal = 0
  for (const key in scoreForm.value.items) {
    total += scoreForm.value.items[key].score
    maxTotal += scoreForm.value.items[key].maxScore
  }
  scoreForm.value.overallScore = Math.round((total / maxTotal) * 100)
  return { total, maxTotal, percentage: scoreForm.value.overallScore }
})

// 获取分数颜色
const getScoreColor = (score, maxScore) => {
  const ratio = score / maxScore
  if (ratio >= 0.9) return '#059669'
  if (ratio >= 0.8) return '#10B981'
  if (ratio >= 0.7) return '#3B82F6'
  if (ratio >= 0.6) return '#D97706'
  return '#DC2626'
}

// 切换问题选择
const toggleIssue = (issueValue) => {
  const index = scoreForm.value.issues.indexOf(issueValue)
  if (index > -1) {
    scoreForm.value.issues.splice(index, 1)
  } else {
    scoreForm.value.issues.push(issueValue)
  }
}

// 是否选中问题
const isIssueSelected = (issueValue) => {
  return scoreForm.value.issues.includes(issueValue)
}

// 拍照上传
const takePhoto = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      scoreForm.value.photos.push(res.tempFilePaths[0])
    }
  })
}

// 删除照片
const removePhoto = (index) => {
  scoreForm.value.photos.splice(index, 1)
}

// 验证表单
const validateForm = () => {
  if (!scoreForm.value.comment.trim() && scoreForm.value.issues.length === 0) {
    uni.showToast({ title: '请填写备注或选择存在问题', icon: 'none' })
    return false
  }
  return true
}

// 提交评分
const submitScore = async () => {
  if (!validateForm()) return
  
  submitting.value = true
  try {
    // 构建提交数据
    const data = {
      roomNumber: scoreForm.value.roomNumber,
      building: scoreForm.value.building,
      overallScore: totalScore.value.percentage,
      details: Object.keys(scoreForm.value.items).map(key => ({
        category: scoreForm.value.items[key].label,
        item: key,
        score: scoreForm.value.items[key].score,
        maxScore: scoreForm.value.items[key].maxScore
      })),
      issues: scoreForm.value.issues,
      comment: scoreForm.value.comment
    }
    
    await inspectionApi.createInspection(data)
    
    uni.showToast({
      title: '评分提交成功',
      icon: 'success'
    })
    
    // 重置表单并返回
    setTimeout(() => {
      resetForm()
      currentStep.value = 1
      selectedRoom.value = null
    }, 1500)
  } catch (error) {
    console.error('提交评分失败:', error)
    uni.showToast({
      title: '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  scoreForm.value = {
    roomNumber: '',
    building: '',
    overallScore: 85,
    items: {
      hygiene: { score: 20, maxScore: 25, label: '卫生状况', icon: '🧹' },
      tidiness: { score: 20, maxScore: 25, label: '物品整洁', icon: '📦' },
      safety: { score: 20, maxScore: 25, label: '安全规范', icon: '🔒' },
      discipline: { score: 20, maxScore: 25, label: '纪律表现', icon: '⏰' }
    },
    issues: [],
    comment: '',
    photos: []
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
    
    <AppNavbar 
      :title="currentStep === 1 ? '选择房间' : '录入评分'" 
      showBack 
      @back="currentStep === 2 ? goBackToSelect : goBack" 
    />
    
    <view class="content">
      <!-- 步骤 1: 选择房间 -->
      <view v-if="currentStep === 1" class="step-content">
        <view class="step-header">
          <view class="step-number">1</view>
          <view class="step-info">
            <text class="step-title">选择要查寝的房间</text>
            <text class="step-desc">请点击选择下方房间</text>
          </view>
        </view>
        
        <!-- 房间列表 -->
        <view v-if="loadingRooms" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载房间中...</text>
        </view>
        
        <view v-else class="room-grid">
          <view
            v-for="room in rooms"
            :key="room.id"
            class="room-item"
            :class="{ selected: selectedRoom?.id === room.id }"
            @click="selectRoom(room)"
          >
            <text class="room-number">{{ room.number || room.roomNumber }}</text>
            <text class="room-building">{{ room.building }}</text>
            
            <view class="room-occupancy">
              <text>{{ room.occupied }}/{{ room.capacity }}人</text>
            </view>
            
            <view v-if="selectedRoom?.id === room.id" class="selected-icon">✓</view>
          </view>
        </view>
        
        <!-- 底部按钮 -->
        <view class="bottom-bar">
          <view 
            class="next-btn"
            :class="{ disabled: !selectedRoom }"
            @click="confirmRoom"
          >
            <text>下一步</text>
          </view>
        </view>
      </view>
      
      
      <!-- 步骤 2: 录入评分 -->
      <view v-else class="step-content">
        <view class="step-header">
          <view class="step-number">2</view>
          <view class="step-info">
            <text class="step-title">{{ selectedRoom?.number || selectedRoom?.roomNumber }} 评分</text>
            <text class="step-desc">请根据实际情况打分</text>
          </view>
        </view>
        
        <!-- 总分卡片 -->
        <view class="total-score-card">
          <view class="score-display">
            <text 
              class="score-value"
              :style="{ color: getScoreColor(totalScore.percentage, 100) }"
            >
              {{ totalScore.percentage }}
            </text>
            <text class="score-label">综合评分</text>
          </view>
          
          <view class="score-breakdown"
003e
            <text>{{ totalScore.total }}/{{ totalScore.maxTotal }}分</text>
          </view>
        </view>
        
        <!-- 各项评分 -->
        <view class="score-section">
          <view class="section-title">各项评分</view>
          
          <view
            v-for="(item, key) in scoreForm.items"
            :key="key"
            class="score-item"
          >
            <view class="item-header">
              <text class="item-icon">{{ item.icon }}</text>
              <text class="item-label">{{ item.label }}</text>
              <text 
                class="item-score"
                :style="{ color: getScoreColor(item.score, item.maxScore) }"
              >
                {{ item.score }}/{{ item.maxScore }}
              </text>
            </view>
            
            <view class="slider-container">
              <slider
                :value="item.score"
                :min="0"
                :max="item.maxScore"
                :step="1"
                :activeColor="getScoreColor(item.score, item.maxScore)"
                backgroundColor="#E5E7EB"
                block-size="20"
                @change="e => item.score = e.detail.value"
              />
            </view>
          </view>
        </view>
        
        <!-- 存在问题 -->
        <view class="issues-section">
          <view class="section-title">存在问题（可多选）</view>
          
          <view class="issues-grid">
            <view
              v-for="issue in issueOptions"
              :key="issue.value"
              class="issue-tag"
              :class="{ selected: isIssueSelected(issue.value) }"
              @click="toggleIssue(issue.value)"
            >
              <text>{{ issue.label }}</text>
            </view>
          </view>
        </view>
        
        <!-- 备注 -->
        <view class="comment-section">
          <view class="section-title">备注</view>
          
          <textarea
            v-model="scoreForm.comment"
            class="comment-input"
            placeholder="请填写查寝备注..."
            maxlength="200"
          />
        </view>
        
        <!-- 照片上传 -->
        <view class="photos-section">
          <view class="section-title">照片（可选）</view>
          
          <view class="photos-grid">
            <view
              v-for="(photo, index) in scoreForm.photos"
              :key="index"
              class="photo-item"
            >
              <image :src="photo" mode="aspectFill" class="photo-image" />
              <view class="photo-delete" @click="removePhoto(index)">✕</view>
            </view>
            
            <view v-if="scoreForm.photos.length < 3" class="photo-add" @click="takePhoto">
              <text class="add-icon">+</text>
              <text class="add-text">添加照片</text>
            </view>
          </view>
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-section">
          <view 
            class="submit-btn"
            :class="{ loading: submitting }"
            @click="submitScore"
          >
            <text v-if="submitting">提交中...</text>
            <text v-else>提交评分</text>
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
  padding-bottom: 140rpx;
}

/* 步骤头部 */
.step-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.step-number {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  display: block;
  margin-bottom: 8rpx;
}

.step-desc {
  font-size: 26rpx;
  color: #64748B;
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

/* 房间网格 */
.room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.room-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  background: #ffffff;
  border-radius: 20rpx;
  border: 2rpx solid #E8D4CD;
  position: relative;
  transition: all 0.2s ease;
}

.room-item:active {
  background: #F8F2F0;
}

.room-item.selected {
  background: #FEF3C7;
  border-color: #F59E0B;
}

.room-number {
  font-size: 32rpx;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8rpx;
}

.room-building {
  font-size: 24rpx;
  color: #64748B;
  margin-bottom: 12rpx;
}

.room-occupancy {
  font-size: 22rpx;
  color: #059669;
  background: #ECFDF5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.selected-icon {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #059669;
  color: #ffffff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 底部栏 */
.bottom-bar {
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

.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

.next-btn.disabled {
  background: #D1D5DB;
}

.next-btn:active:not(.disabled) {
  transform: scale(0.98);
}

/* 总分卡片 */
.total-score-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #ffffff 0%, #FFFBEB 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 72rpx;
  font-weight: 800;
  line-height: 1;
}

.score-label {
  font-size: 26rpx;
  color: #64748B;
  margin-top: 8rpx;
}

.score-breakdown {
  font-size: 28rpx;
  color: #64748B;
}

/* 评分区域 */
.score-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 24rpx;
}

.score-item {
  margin-bottom: 28rpx;
}

.score-item:last-child {
  margin-bottom: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.item-icon {
  font-size: 32rpx;
}

.item-label {
  font-size: 28rpx;
  color: #374151;
  flex: 1;
}

.item-score {
  font-size: 32rpx;
  font-weight: 700;
}

.slider-container {
  padding: 0 16rpx;
}

/* 问题区域 */
.issues-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.issues-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.issue-tag {
  padding: 16rpx 24rpx;
  background: #F1F5F9;
  border-radius: 28rpx;
  font-size: 26rpx;
  color: #64748B;
  transition: all 0.2s ease;
}

.issue-tag.selected {
  background: #FEE2E2;
  color: #DC2626;
  border: 2rpx solid #FCA5A5;
}

/* 备注区域 */
.comment-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.comment-input {
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

/* 照片区域 */
.photos-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.photos-grid {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.photo-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-delete {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #DC2626;
  color: #ffffff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-add {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #C4A77D;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 48rpx;
  color: #C4A77D;
  font-weight: 300;
}

.add-text {
  font-size: 24rpx;
  color: #C4A77D;
}

/* 提交区域 */
.submit-section {
  padding: 24rpx 0;
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
}

.submit-btn.loading {
  opacity: 0.7;
}

.submit-btn:active {
  transform: scale(0.98);
}
</style>
