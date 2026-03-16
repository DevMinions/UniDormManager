<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { buildingApi } from '@/api/building.js'
import { isAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import { validateForm, showFirstError } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 检查权限
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 楼栋ID（编辑模式）
const buildingId = ref('')
const isEdit = ref(false)

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const formData = ref({
  name: '',
  code: '',
  address: '',
  totalFloors: 6,
  totalRooms: 0,
  description: '',
  status: 'active'
})

// 验证规则
const validationRules = {
  name: ['required', { type: 'maxLength', value: 50 }],
  code: ['required', { type: 'maxLength', value: 20 }],
  totalFloors: ['required'],
  address: [{ type: 'maxLength', value: 200 }]
}

// 生命周期
onLoad((options) => {
  if (!checkAuth()) return
  
  if (options.id) {
    buildingId.value = options.id
    isEdit.value = true
    loadBuildingDetail()
  }
})

// 加载楼栋详情
const loadBuildingDetail = async () => {
  loading.value = true
  try {
    const res = await buildingApi.getBuildingById(buildingId.value)
    if (res) {
      formData.value = {
        name: res.name || '',
        code: res.code || '',
        address: res.address || '',
        totalFloors: res.totalFloors || 6,
        totalRooms: res.totalRooms || 0,
        description: res.description || '',
        status: res.status || 'active'
      }
    }
  } catch (error) {
    handleApiError(error, '获取楼栋详情失败')
    uni.navigateBack()
  } finally {
    loading.value = false
  }
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

// 提交表单
const submitForm = async () => {
  if (!checkForm()) return
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await buildingApi.updateBuilding(buildingId.value, formData.value)
      showSuccess('更新成功')
    } else {
      await buildingApi.createBuilding(formData.value)
      showSuccess('创建成功')
    }
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    handleApiError(error, isEdit.value ? '更新失败' : '创建失败')
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
    <view class="page-bg">
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <AppNavbar 
      :title="isEdit ? '编辑楼栋' : '新增楼栋'" 
      showBack 
      @back="goBack" 
    />
    
    <view class="content">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <view v-else class="form-card">
        <view class="section-title">
          <view class="title-bar"></view>
          <text>基本信息</text>
        </view>
        
        <!-- 楼栋名称 -->
        <view class="form-item">
          <view class="item-label required">
            <text class="label-icon">🏢</text>
            <text>楼栋名称</text>
          </view>
          <input
            v-model="formData.name"
            class="item-input"
            type="text"
            placeholder="请输入楼栋名称"
            maxlength="50"
          />
        </view>
        
        <!-- 楼栋编号 -->
        <view class="form-item"
003e
          <view class="item-label required">
            <text class="label-icon">🔢</text>
            <text>楼栋编号</text>
          </view>
          <input
            v-model="formData.code"
            class="item-input"
            type="text"
            placeholder="如：A、B、C栋"
            maxlength="20"
            :disabled="isEdit"
          />
          <text v-if="isEdit" class="input-tip">编号不可修改</text>
        </view>
        
        <!-- 楼层数 -->
        <view class="form-item">
          <view class="item-label required">
            <text class="label-icon">🏗️</text>
            <text>楼层数</text>
          </view>
          <input
            v-model.number="formData.totalFloors"
            class="item-input"
            type="number"
            placeholder="请输入楼层数"
          />
        </view>
        
        <!-- 地址 -->
        <view class="form-item">
          <view class="item-label">
            <text class="label-icon">📍</text>
            <text>地址</text>
          </view>
          <input
            v-model="formData.address"
            class="item-input"
            type="text"
            placeholder="请输入楼栋地址"
            maxlength="200"
          />
        </view>
        
        <!-- 状态 -->
        <view class="form-item">
          <view class="item-label">
            <text class="label-icon">⚡</text>
            <text>状态</text>
          </view>
          
          <view class="radio-group">
            <view 
              class="radio-option"
              :class="{ active: formData.status === 'active' }"
              @click="formData.status = 'active'"
            >
              <view class="radio-dot">
                <view v-if="formData.status === 'active'" class="radio-dot-inner"></view>
              </view>
              <text>正常使用</text>
            </view>
            
            <view 
              class="radio-option"
              :class="{ active: formData.status === 'inactive' }"
              @click="formData.status = 'inactive'"
            >
              <view class="radio-dot">
                <view v-if="formData.status === 'inactive'" class="radio-dot-inner"></view>
              </view>
              <text>停用</text>
            </view>
          </view>
        </view>
        
        <!-- 备注 -->
        <view class="form-item">
          <view class="item-label">
            <text class="label-icon">📝</text>
            <text>备注</text>
          </view>
          <textarea
            v-model="formData.description"
            class="item-textarea"
            placeholder="请输入备注信息..."
            maxlength="500"
          />
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-section">
          <view 
            class="submit-btn"
            :class="{ loading: submitting }"
            @click="submitForm"
          >
            <text v-if="submitting">提交中...</text>
            <text v-else>{{ isEdit ? '保存修改' : '创建楼栋' }}</text>
          </view>
          
          <view class="cancel-btn" @click="goBack">取消</view>
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
  padding-bottom: 48rpx;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 0;
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

/* 表单卡片 */
.form-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 32rpx;
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
  width: 100%;
  height: 88rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1E293B;
  border: 2rpx solid #E5E7EB;
  box-sizing: border-box;
}

.item-input:disabled {
  background: #F1F5F9;
  color: #9CA3AF;
}

.input-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #9CA3AF;
}

/* 单选组 */
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

/* 文本域 */
.item-textarea {
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

/* 提交区域 */
.submit-section {
  margin-top: 48rpx;
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
  margin-bottom: 20rpx;
}

.submit-btn.loading {
  opacity: 0.7;
}

.submit-btn:active {
  transform: scale(0.98);
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: #F3F4F6;
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #6B7280;
}

.cancel-btn:active {
  background: #E5E7EB;
}
</style>
