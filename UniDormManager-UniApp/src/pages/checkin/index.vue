<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()
const appStore = useAppStore()

// 用户角色
const userRole = computed(() => userStore.userRole || 'student')
const isManager = computed(() => userRole.value === 'dorm_manager' || userRole.value === 'admin')

// 当前视图：学生表单或宿管列表
const currentView = computed(() => isManager.value ? 'list' : 'form')

// 表单数据
const formData = ref({
  name: '',
  studentId: '',
  idCard: '',
  phone: '',
  building: '',
  roomNumber: '',
  checkInDate: ''
})

// 楼栋选项
const buildingOptions = ['A栋', 'B栋', 'C栋', 'D栋', 'E栋', 'F栋']

// 是否同意协议
const agreedToTerms = ref(false)
const showTerms = ref(false)

// 待入住学生列表（宿管视图）
const pendingStudents = ref([
  { id: 1, name: '张三', studentId: '2024001', phone: '13800138001', building: 'A栋', roomNumber: '301', status: 'pending' },
  { id: 2, name: '李四', studentId: '2024002', phone: '13800138002', building: 'A栋', roomNumber: '302', status: 'pending' },
  { id: 3, name: '王五', studentId: '2024003', phone: '13800138003', building: 'B栋', roomNumber: '201', status: 'pending' }
])

// 入住须知内容
const termsContent = `
入住须知与协议

一、入住条件
1. 持有效学生证和身份证件
2. 已缴纳住宿费用
3. 无违反校规校纪记录

二、住宿规定
1. 遵守宿舍作息时间
2. 保持宿舍卫生整洁
3. 爱护公共设施，损坏需赔偿
4. 禁止私拉乱接电线
5. 禁止在宿舍使用大功率电器

三、安全须知
1. 妥善保管个人财物
2. 离开宿舍时关好门窗
3. 发现可疑人员及时报告
4. 遵守消防安全规定

四、退宿规定
1. 毕业或转学需办理退宿手续
2. 退宿时需清理个人物品
3. 经检查无损坏后方可退还押金

本人已阅读并同意以上条款。
`

// 获取当前日期
const getCurrentDate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 初始化入住日期
onShow(() => {
  formData.value.checkInDate = getCurrentDate()
})

// 选择楼栋
const selectBuilding = () => {
  uni.showActionSheet({
    itemList: buildingOptions,
    success: (res) => {
      formData.value.building = buildingOptions[res.tapIndex]
    }
  })
}

// 选择日期
const selectDate = () => {
  uni.showToast({
    title: '请选择日期',
    icon: 'none'
  })
}

// 显示入住须知
const showTermsModal = () => {
  showTerms.value = true
}

// 关闭入住须知
const closeTerms = () => {
  showTerms.value = false
}

// 同意协议
const agreeTerms = () => {
  agreedToTerms.value = true
  closeTerms()
}

// 提交入住申请
const submitCheckIn = async () => {
  // 表单验证
  if (!formData.value.name.trim()) {
    appStore.showToast('请输入姓名', 'none')
    return
  }
  if (!formData.value.studentId.trim()) {
    appStore.showToast('请输入学号', 'none')
    return
  }
  if (!formData.value.idCard.trim()) {
    appStore.showToast('请输入身份证号', 'none')
    return
  }
  if (!formData.value.phone.trim()) {
    appStore.showToast('请输入手机号', 'none')
    return
  }
  if (!formData.value.building) {
    appStore.showToast('请选择楼栋', 'none')
    return
  }
  if (!formData.value.roomNumber.trim()) {
    appStore.showToast('请输入房间号', 'none')
    return
  }
  if (!agreedToTerms.value) {
    appStore.showToast('请先同意入住协议', 'none')
    return
  }

  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    appStore.showToast('入住申请提交成功', 'success')
    
    // 重置表单
    formData.value = {
      name: '',
      studentId: '',
      idCard: '',
      phone: '',
      building: '',
      roomNumber: '',
      checkInDate: getCurrentDate()
    }
    agreedToTerms.value = false
  } catch (error) {
    appStore.showToast('提交失败，请重试', 'none')
  }
}

// 宿管确认入住
const confirmCheckIn = (student) => {
  appStore.showModal('确认入住', `确认 ${student.name} (${student.studentId}) 入住 ${student.building}${student.roomNumber} 吗？`).then(async (confirmed) => {
    if (confirmed) {
      // 模拟确认
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = pendingStudents.value.findIndex(s => s.id === student.id)
      if (index > -1) {
        pendingStudents.value.splice(index, 1)
      }
      appStore.showToast('已确认入住', 'success')
    }
  })
}

// 拒绝入住
const rejectCheckIn = (student) => {
  appStore.showModal('拒绝入住', `确定要拒绝 ${student.name} 的入住申请吗？`).then(async (confirmed) => {
    if (confirmed) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = pendingStudents.value.findIndex(s => s.id === student.id)
      if (index > -1) {
        pendingStudents.value.splice(index, 1)
      }
      appStore.showToast('已拒绝申请', 'none')
    }
  })
}
</script>

<template>
  <view class="checkin-page">
    <AppNavbar title="入住办理" :show-back="true" />
    
    <!-- 学生视图：入住申请表单 -->
    <view class="page-content" v-if="currentView === 'form'">
      <!-- 欢迎卡片 -->
      <view class="welcome-card">
        <view class="welcome-icon">🏠</view>
        <view class="welcome-text">
          <text class="welcome-title">欢迎入住宿舍</text>
          <text class="welcome-subtitle">请填写以下信息完成入住登记</text>
        </view>
      </view>
      
      <!-- 表单卡片 -->
      <view class="form-card">
        <view class="form-section">
          <text class="section-label">基本信息</text>
          
          <view class="form-item">
            <text class="form-label">姓名 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="formData.name" 
              placeholder="请输入姓名"
              maxlength="20"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">学号 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="formData.studentId" 
              placeholder="请输入学号"
              maxlength="20"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">身份证号 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="formData.idCard" 
              placeholder="请输入身份证号"
              maxlength="18"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">手机号 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="formData.phone" 
              placeholder="请输入手机号"
              maxlength="11"
              type="number"
            />
          </view>
        </view>
        
        <view class="form-divider"></view>
        
        <view class="form-section">
          <text class="section-label">房间信息</text>
          
          <view class="form-item">
            <text class="form-label">楼栋 <text class="required">*</text></text>
            <view class="form-select" @click="selectBuilding">
              <text :class="['select-text', { 'placeholder': !formData.building }]">
                {{ formData.building || '请选择楼栋' }}
              </text>
              <text class="select-arrow">›</text>
            </view>
          </view>
          
          <view class="form-item">
            <text class="form-label">房间号 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="formData.roomNumber" 
              placeholder="请输入房间号"
              maxlength="10"
            />
          </view>
          
          <view class="form-item">
            <text class="form-label">入住日期</text>
            <picker mode="date" :value="formData.checkInDate" @change="(e) => formData.checkInDate = e.detail.value">
              <view class="form-select">
                <text class="select-text">{{ formData.checkInDate }}</text>
                <text class="select-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
      
      <!-- 协议区域 -->
      <view class="terms-section">
        <view class="terms-checkbox" @click="agreedToTerms = !agreedToTerms">
          <view :class="['checkbox', { 'checked': agreedToTerms }]">
            <text v-if="agreedToTerms">✓</text>
          </view>
          <text class="terms-text">
            我已阅读并同意
            <text class="terms-link" @click.stop="showTermsModal">《入住须知与协议》</text>
          </text>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="submitCheckIn">
          <text>提交入住申请</text>
        </button>
      </view>
    </view>
    
    <!-- 宿管视图：待入住列表 -->
    <view class="page-content" v-if="currentView === 'list'">
      <view class="list-header">
        <view class="header-icon">📋</view>
        <view class="header-info">
          <text class="header-title">待处理入住申请</text>
          <text class="header-subtitle">共 {{ pendingStudents.length }} 条待确认</text>
        </view>
      </view>
      
      <view class="student-list" v-if="pendingStudents.length > 0">
        <view class="student-card" v-for="student in pendingStudents" :key="student.id">
          <view class="student-header">
            <view class="student-avatar">
              <text>{{ student.name.charAt(0) }}</text>
            </view>
            <view class="student-info">
              <text class="student-name">{{ student.name }}</text>
              <text class="student-id">学号: {{ student.studentId }}</text>
            </view>
            <view class="status-badge pending">
              <text>待确认</text>
            </view>
          </view>
          
          <view class="student-details">
            <view class="detail-item">
              <text class="detail-label">📱</text>
              <text class="detail-value">{{ student.phone }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">🏢</text>
              <text class="detail-value">{{ student.building }}{{ student.roomNumber }}</text>
            </view>
          </view>
          
          <view class="student-actions">
            <button class="action-btn reject" @click="rejectCheckIn(student)">
              <text>拒绝</text>
            </button>
            <button class="action-btn confirm" @click="confirmCheckIn(student)">
              <text>确认入住</text>
            </button>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <view class="empty-icon">✅</view>
        <text class="empty-text">暂无待处理申请</text>
        <text class="empty-subtext">所有入住申请已处理完毕</text>
      </view>
    </view>
    
    <!-- 协议弹窗 -->
    <view class="terms-modal" v-if="showTerms" @click="closeTerms">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">入住须知</text>
          <text class="modal-close" @click="closeTerms">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <text class="terms-content">{{ termsContent }}</text>
        </scroll-view>
        <view class="modal-footer">
          <button class="agree-btn" @click="agreeTerms">
            <text>我已阅读并同意</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.checkin-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 40px;
}

.page-content {
  padding: 20px;
}

// 欢迎卡片
.welcome-card {
  background: linear-gradient(135deg, $sage-400 0%, $sage-500 100%);
  border-radius: $radius-xl;
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  box-shadow: $shadow-md;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
}

.welcome-text {
  flex: 1;
}

.welcome-title {
  display: block;
  font-size: 20px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.welcome-subtitle {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

// 表单卡片
.form-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 24px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.form-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: $sage-600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid $sage-100;
}

.form-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 8px;
}

.required {
  color: $terracotta-500;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: $warm-gray-50;
  border: 1px solid $warm-gray-200;
  border-radius: $radius-md;
  font-size: 15px;
  color: $text-primary;
  box-sizing: border-box;
}

.form-select {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: $warm-gray-50;
  border: 1px solid $warm-gray-200;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.select-text {
  font-size: 15px;
  color: $text-primary;
}

.select-text.placeholder {
  color: $warm-gray-400;
}

.select-arrow {
  font-size: 18px;
  color: $warm-gray-400;
}

.form-divider {
  height: 1px;
  background: $warm-gray-100;
  margin: 20px 0;
}

// 协议区域
.terms-section {
  margin-top: 20px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid $sage-400;
  border-radius: 4px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  
  &.checked {
    background: $sage-500;
    border-color: $sage-500;
    color: #fff;
    font-size: 12px;
  }
}

.terms-text {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.6;
}

.terms-link {
  color: $sage-500;
  font-weight: 500;
}

// 提交按钮
.submit-section {
  margin-top: 32px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border-radius: $radius-lg;
  border: none;
  box-shadow: $shadow-md;
}

// 列表头部
.list-header {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: $sage-100;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.header-info {
  flex: 1;
}

.header-title {
  display: block;
  font-size: 17px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4px;
}

.header-subtitle {
  display: block;
  font-size: 13px;
  color: $text-tertiary;
}

// 学生列表
.student-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.student-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.student-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $sage-300 0%, $sage-400 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  
  text {
    font-size: 20px;
    color: #fff;
    font-weight: 500;
  }
}

.student-info {
  flex: 1;
}

.student-name {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.student-id {
  display: block;
  font-size: 13px;
  color: $text-tertiary;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  &.pending {
    background: $warning-light;
    color: $warning;
  }
}

.student-details {
  background: $warm-gray-50;
  border-radius: $radius-md;
  padding: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.detail-label {
  font-size: 14px;
  margin-right: 8px;
}

.detail-value {
  font-size: 14px;
  color: $text-secondary;
}

.student-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 500;
  border: none;
  
  &.reject {
    background: $warm-gray-100;
    color: $text-secondary;
  }
  
  &.confirm {
    background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
    color: #fff;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: $sage-100;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 17px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: $text-tertiary;
}

// 协议弹窗
.terms-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: $radius-xl;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $warm-gray-100;
}

.modal-title {
  font-size: 17px;
  font-weight: 500;
  color: $text-primary;
}

.modal-close {
  font-size: 24px;
  color: $warm-gray-400;
  padding: 0 4px;
}

.modal-body {
  flex: 1;
  padding: 20px;
  max-height: 50vh;
}

.terms-content {
  font-size: 14px;
  color: $text-secondary;
  line-height: 1.8;
  white-space: pre-line;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid $warm-gray-100;
}

.agree-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border-radius: $radius-lg;
  border: none;
}
</style>
