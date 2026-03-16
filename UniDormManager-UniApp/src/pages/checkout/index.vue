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

// 当前视图
const currentView = computed(() => isManager.value ? 'list' : 'form')

// 表单数据
const formData = ref({
  reason: '',
  checkOutDate: '',
  itemsChecked: {
    bed: false,
    desk: false,
    chair: false,
    closet: false,
    light: false,
    socket: false,
    window: false,
    door: false
  },
  otherNotes: ''
})

// 退宿原因选项
const reasonOptions = [
  '毕业退宿',
  '转学退宿',
  '休学退宿',
  '换宿退宿',
  '其他原因'
]

// 物品清单
const itemList = [
  { key: 'bed', label: '床铺', icon: '🛏️' },
  { key: 'desk', label: '书桌', icon: '📚' },
  { key: 'chair', label: '椅子', icon: '🪑' },
  { key: 'closet', label: '衣柜', icon: '👔' },
  { key: 'light', label: '灯具', icon: '💡' },
  { key: 'socket', label: '插座', icon: '🔌' },
  { key: 'window', label: '门窗', icon: '🪟' },
  { key: 'door', label: '门锁', icon: '🚪' }
]

// 待处理退宿申请（宿管视图）
const pendingCheckouts = ref([
  { 
    id: 1, 
    name: '赵六', 
    studentId: '2021001', 
    phone: '13800138006', 
    building: 'A栋', 
    roomNumber: '305',
    reason: '毕业退宿',
    checkOutDate: '2024-06-30',
    status: 'pending' 
  },
  { 
    id: 2, 
    name: '孙七', 
    studentId: '2021002', 
    phone: '13800138007', 
    building: 'B栋', 
    roomNumber: '210',
    reason: '转学退宿',
    checkOutDate: '2024-07-15',
    status: 'pending' 
  }
])

// 获取当前日期
const getCurrentDate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 初始化退宿日期
onShow(() => {
  formData.value.checkOutDate = getCurrentDate()
})

// 选择退宿原因
const selectReason = () => {
  uni.showActionSheet({
    itemList: reasonOptions,
    success: (res) => {
      formData.value.reason = reasonOptions[res.tapIndex]
    }
  })
}

// 全选/取消全选物品
const toggleAllItems = () => {
  const allChecked = Object.values(formData.value.itemsChecked).every(v => v)
  const newValue = !allChecked
  Object.keys(formData.value.itemsChecked).forEach(key => {
    formData.value.itemsChecked[key] = newValue
  })
}

// 检查是否所有物品已清点
const allItemsChecked = computed(() => {
  return Object.values(formData.value.itemsChecked).every(v => v)
})

// 提交退宿申请
const submitCheckOut = async () => {
  // 表单验证
  if (!formData.value.reason) {
    appStore.showToast('请选择退宿原因', 'none')
    return
  }
  if (!allItemsChecked.value) {
    appStore.showToast('请确认所有物品已清点', 'none')
    return
  }

  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000))
    appStore.showToast('退宿申请提交成功', 'success')
    
    // 重置表单
    formData.value = {
      reason: '',
      checkOutDate: getCurrentDate(),
      itemsChecked: {
        bed: false,
        desk: false,
        chair: false,
        closet: false,
        light: false,
        socket: false,
        window: false,
        door: false
      },
      otherNotes: ''
    }
  } catch (error) {
    appStore.showToast('提交失败，请重试', 'none')
  }
}

// 宿管确认退宿
const confirmCheckOut = (record) => {
  appStore.showModal('确认退宿', `确认 ${record.name} (${record.studentId}) 完成退宿手续吗？`).then(async (confirmed) => {
    if (confirmed) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = pendingCheckouts.value.findIndex(r => r.id === record.id)
      if (index > -1) {
        pendingCheckouts.value.splice(index, 1)
      }
      appStore.showToast('已确认退宿', 'success')
    }
  })
}

// 查看退宿详情
const viewCheckOutDetail = (record) => {
  uni.navigateTo({
    url: `/pages/checkout/detail?id=${record.id}`
  })
}
</script>

<template>
  <view class="checkout-page">
    <AppNavbar title="退宿办理" :show-back="true" />
    
    <!-- 学生视图：退宿申请表单 -->
    <view class="page-content" v-if="currentView === 'form'">
      <!-- 流程说明卡片 -->
      <view class="process-card">
        <view class="process-header">
          <view class="process-icon">📝</view>
          <text class="process-title">退宿流程</text>
        </view>
        <view class="process-steps">
          <view class="step">
            <view class="step-num">1</view>
            <view class="step-info">
              <text class="step-title">提交申请</text>
              <text class="step-desc">填写退宿原因和日期</text>
            </view>
          </view>
          <view class="step-arrow">→</view>
          <view class="step">
            <view class="step-num">2</view>
            <view class="step-info">
              <text class="step-title">物品清点</text>
              <text class="step-desc">确认宿舍物品完好</text>
            </view>
          </view>
          <view class="step-arrow">→</view>
          <view class="step">
            <view class="step-num">3</view>
            <view class="step-info">
              <text class="step-title">宿管确认</text>
              <text class="step-desc">等待管理员审核</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 表单卡片 -->
      <view class="form-card">
        <view class="form-section">
          <text class="section-label">退宿信息</text>
          
          <view class="form-item">
            <text class="form-label">退宿原因 <text class="required">*</text></text>
            <view class="form-select" @click="selectReason">
              <text :class="['select-text', { 'placeholder': !formData.reason }]">
                {{ formData.reason || '请选择退宿原因' }}
              </text>
              <text class="select-arrow">›</text>
            </view>
          </view>
          
          <view class="form-item">
            <text class="form-label">退宿日期 <text class="required">*</text></text>
            <picker mode="date" :value="formData.checkOutDate" @change="(e) => formData.checkOutDate = e.detail.value">
              <view class="form-select">
                <text class="select-text">{{ formData.checkOutDate }}</text>
                <text class="select-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
      </view>
      
      <!-- 物品清点卡片 -->
      <view class="form-card">
        <view class="form-section">
          <view class="section-header">
            <text class="section-label">物品清点 <text class="required">*</text></text>
            <text class="check-all" @click="toggleAllItems">{{ allItemsChecked ? '取消全选' : '全选' }}</text>
          </view>
          
          <text class="section-desc">请确认以下宿舍公共设施完好无损</text>
          
          <view class="items-grid">
            <view 
              v-for="item in itemList" 
              :key="item.key"
              :class="['item-cell', { 'checked': formData.itemsChecked[item.key] }]"
              @click="formData.itemsChecked[item.key] = !formData.itemsChecked[item.key]"
            >
              <text class="item-icon">{{ item.icon }}</text>
              <text class="item-label">{{ item.label }}</text>
              <view class="item-check" v-if="formData.itemsChecked[item.key]">
                <text>✓</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="form-divider"></view>
        
        <view class="form-section">
          <text class="section-label">其他备注</text>
          <textarea 
            class="form-textarea" 
            v-model="formData.otherNotes" 
            placeholder="如有物品损坏或其他特殊情况，请在此说明..."
            maxlength="200"
          />
          <text class="textarea-count">{{ formData.otherNotes.length }}/200</text>
        </view>
      </view>
      
      <!-- 提示信息 -->
      <view class="notice-card">
        <view class="notice-item">
          <text class="notice-icon">💡</text>
          <text class="notice-text">退宿前请清理个人物品，保持宿舍整洁</text>
        </view>
        <view class="notice-item">
          <text class="notice-icon">🔑</text>
          <text class="notice-text">退宿时需归还宿舍钥匙和门禁卡</text>
        </view>
        <view class="notice-item">
          <text class="notice-icon">💰</text>
          <text class="notice-text">退宿审核通过后，押金将在7个工作日内退还</text>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="submitCheckOut">
          <text>提交退宿申请</text>
        </button>
      </view>
    </view>
    
    <!-- 宿管视图：待处理退宿列表 -->
    <view class="page-content" v-if="currentView === 'list'">
      <view class="list-header">
        <view class="header-icon">📋</view>
        <view class="header-info">
          <text class="header-title">待处理退宿申请</text>
          <text class="header-subtitle">共 {{ pendingCheckouts.length }} 条待处理</text>
        </view>
      </view>
      
      <view class="checkout-list" v-if="pendingCheckouts.length > 0">
        <view class="checkout-card" v-for="record in pendingCheckouts" :key="record.id">
          <view class="card-header">
            <view class="user-info">
              <view class="user-avatar">
                <text>{{ record.name.charAt(0) }}</text>
              </view>
              <view class="user-detail">
                <text class="user-name">{{ record.name }}</text>
                <text class="user-id">{{ record.studentId }}</text>
              </view>
            </view>
            <view class="status-badge">
              <text>待处理</text>
            </view>
          </view>
          
          <view class="card-body">
            <view class="info-row">
              <text class="info-label">退宿原因</text>
              <text class="info-value">{{ record.reason }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">退宿日期</text>
              <text class="info-value">{{ record.checkOutDate }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">房间信息</text>
              <text class="info-value">{{ record.building }}{{ record.roomNumber }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">联系电话</text>
              <text class="info-value">{{ record.phone }}</text>
            </view>
          </view>
          
          <view class="card-footer">
            <button class="btn-secondary" @click="viewCheckOutDetail(record)">
              <text>查看详情</text>
            </button>
            <button class="btn-primary" @click="confirmCheckOut(record)">
              <text>确认退宿</text>
            </button>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <view class="empty-icon">✅</view>
        <text class="empty-text">暂无待处理申请</text>
        <text class="empty-subtext">所有退宿申请已处理完毕</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.checkout-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 40px;
}

.page-content {
  padding: 20px;
}

// 流程卡片
.process-card {
  background: linear-gradient(135deg, $terracotta-400 0%, $terracotta-500 100%);
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: $shadow-md;
}

.process-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.process-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
}

.process-title {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.process-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-num {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.step-info {
  text-align: center;
}

.step-title {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
}

.step-desc {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.step-arrow {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 4px;
}

// 表单卡片
.form-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.form-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: $sage-600;
}

.section-desc {
  display: block;
  font-size: 12px;
  color: $text-tertiary;
  margin-bottom: 16px;
}

.check-all {
  font-size: 13px;
  color: $sage-500;
  font-weight: 500;
}

.required {
  color: $terracotta-500;
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

// 物品网格
.items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.item-cell {
  aspect-ratio: 1;
  background: $warm-gray-50;
  border: 2px solid transparent;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  
  &.checked {
    background: $sage-50;
    border-color: $sage-400;
  }
}

.item-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.item-label {
  font-size: 12px;
  color: $text-secondary;
}

.item-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  background: $sage-500;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  text {
    font-size: 10px;
    color: #fff;
  }
}

// 文本域
.form-textarea {
  width: 100%;
  height: 100px;
  padding: 12px 16px;
  background: $warm-gray-50;
  border: 1px solid $warm-gray-200;
  border-radius: $radius-md;
  font-size: 14px;
  color: $text-primary;
  box-sizing: border-box;
}

.textarea-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: $text-tertiary;
  margin-top: 8px;
}

// 提示卡片
.notice-card {
  background: $terracotta-50;
  border: 1px solid $terracotta-100;
  border-radius: $radius-lg;
  padding: 16px;
  margin-bottom: 20px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.notice-icon {
  font-size: 16px;
  margin-right: 10px;
  flex-shrink: 0;
}

.notice-text {
  font-size: 13px;
  color: $terracotta-700;
  line-height: 1.5;
}

// 提交按钮
.submit-section {
  margin-top: 32px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: linear-gradient(135deg, $terracotta-500 0%, $terracotta-600 100%);
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
  background: $terracotta-100;
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

// 退宿列表
.checkout-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkout-card {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  box-shadow: $shadow-sm;
  border: 1px solid $warm-gray-100;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid $warm-gray-100;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, $terracotta-300 0%, $terracotta-400 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  
  text {
    font-size: 18px;
    color: #fff;
    font-weight: 500;
  }
}

.user-detail {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.user-id {
  display: block;
  font-size: 13px;
  color: $text-tertiary;
}

.status-badge {
  padding: 4px 10px;
  background: $warning-light;
  border-radius: 12px;
  
  text {
    font-size: 12px;
    color: $warning;
    font-weight: 500;
  }
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 14px;
  color: $text-tertiary;
}

.info-value {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.card-footer {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  flex: 1;
  height: 40px;
  line-height: 40px;
  background: $warm-gray-100;
  color: $text-secondary;
  font-size: 14px;
  font-weight: 500;
  border-radius: $radius-md;
  border: none;
}

.btn-primary {
  flex: 1;
  height: 40px;
  line-height: 40px;
  background: linear-gradient(135deg, $terracotta-500 0%, $terracotta-600 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border-radius: $radius-md;
  border: none;
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
  background: $terracotta-100;
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
</style>
