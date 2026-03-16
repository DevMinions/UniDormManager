<script setup>
import { ref, computed } from 'vue'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import { request } from '@/utils/request'

// 表单数据
const formData = ref({
  type: '',
  description: '',
  images: [],
  urgent: false,
  contactPhone: ''
})

// 报修类型选项
const repairTypes = [
  { id: 'electric', name: '水电', icon: '⚡', desc: '灯管、插座、水管等' },
  { id: 'furniture', name: '家具', icon: '🪑', desc: '床、桌椅、衣柜等' },
  { id: 'door', name: '门窗', icon: '🚪', desc: '门锁、窗户、纱窗等' },
  { id: 'sanitary', name: '卫生设施', icon: '🚿', desc: '马桶、淋浴、洗手台等' },
  { id: 'network', name: '网络', icon: '📶', desc: 'WiFi、网线接口等' },
  { id: 'other', name: '其他', icon: '📦', desc: '其他设施问题' }
]

// 紧急程度选项
const urgentLevels = [
  { value: false, label: '普通', desc: '一般问题，尽快处理' },
  { value: true, label: '紧急', desc: '影响生活，需要优先处理' }
]

// 表单验证
const errors = ref({
  type: '',
  description: ''
})

// 提交状态
const submitting = ref(false)

// 选择报修类型
const selectType = (typeId) => {
  formData.value.type = typeId
  errors.value.type = ''
}

// 选择紧急程度
const selectUrgent = (urgent) => {
  formData.value.urgent = urgent
}

// 选择图片
const chooseImage = () => {
  const remainingSlots = 6 - formData.value.images.length
  if (remainingSlots <= 0) {
    uni.showToast({
      title: '最多上传6张图片',
      icon: 'none'
    })
    return
  }

  uni.chooseImage({
    count: remainingSlots,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.images.push(...res.tempFilePaths)
    }
  })
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: formData.value.images,
    current: formData.value.images[index]
  })
}

// 删除图片
const deleteImage = (index) => {
  formData.value.images.splice(index, 1)
}

// 验证表单
const validateForm = () => {
  let valid = true
  errors.value = { type: '', description: '' }

  if (!formData.value.type) {
    errors.value.type = '请选择报修类型'
    valid = false
  }

  if (!formData.value.description.trim()) {
    errors.value.description = '请描述问题详情'
    valid = false
  } else if (formData.value.description.length < 10) {
    errors.value.description = '问题描述至少10个字'
    valid = false
  }

  return valid
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 1500))

    uni.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500
    })

    // 延迟返回列表页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({
      title: '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

// 获取选中类型信息
const selectedType = computed(() => {
  return repairTypes.find(t => t.id === formData.value.type)
})
</script>

<template>
  <view class="repair-submit-page">
    <!-- 导航栏 -->
    <AppNavbar title="提交报修" showBack bgColor="#faf9f7" />

    <view class="content">
      <!-- 报修类型选择 -->
      <view class="form-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>报修类型</text>
        </view>
        
        <view class="type-grid">
          <view
            v-for="item in repairTypes"
            :key="item.id"
            class="type-item"
            :class="{ active: formData.type === item.id }"
            @click="selectType(item.id)"
          >
            <text class="type-icon">{{ item.icon }}</text>
            <text class="type-name">{{ item.name }}</text>
            <text class="type-desc">{{ item.desc }}</text>
            <view v-if="formData.type === item.id" class="type-check">✓</view>
          </view>
        </view>
        
        <text v-if="errors.type" class="error-text">{{ errors.type }}</text>
      </view>

      <!-- 问题描述 -->
      <view class="form-section">
        <view class="section-title">
          <text class="required">*</text>
          <text>问题描述</text>
        </view>
        
        <view class="textarea-wrapper">
          <textarea
            class="description-input"
            v-model="formData.description"
            placeholder="请详细描述您遇到的问题，如：位置、现象、持续时间等，以便我们更快处理..."
            :maxlength="500"
            @input="errors.description = ''"
          />
          <text class="char-count">{{ formData.description.length }}/500</text>
        </view>
        
        <text v-if="errors.description" class="error-text">{{ errors.description }}</text>
      </view>

      <!-- 图片上传 -->
      <view class="form-section">
        <view class="section-title">
          <text>图片上传</text>
          <text class="section-desc">（可选，最多6张）</text>
        </view>
        
        <view class="image-upload">
          <view 
            v-for="(img, index) in formData.images" 
            :key="index"
            class="image-item"
            @click="previewImage(index)"
          >
            <image :src="img" mode="aspectFill" class="uploaded-img" />
            <view class="delete-btn" @click.stop="deleteImage(index)">
              <text>×</text>
            </view>
          </view>
          
          <view 
            v-if="formData.images.length < 6"
            class="upload-btn"
            @click="chooseImage"
          >
            <text class="upload-icon">📷</text>
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </view>

      <!-- 紧急程度 -->
      <view class="form-section">
        <view class="section-title">
          <text>紧急程度</text>
        </view>
        
        <view class="urgent-options">
          <view
            v-for="level in urgentLevels"
            :key="level.label"
            class="urgent-item"
            :class="{ active: formData.urgent === level.value, urgent: level.value }"
            @click="selectUrgent(level.value)"
          >
            <view class="urgent-radio">
              <view v-if="formData.urgent === level.value" class="radio-inner"></view>
            </view>
            <view class="urgent-content">
              <text class="urgent-label">{{ level.label }}</text>
              <text class="urgent-desc">{{ level.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系电话 -->
      <view class="form-section">
        <view class="section-title">
          <text>联系电话</text>
          <text class="section-desc">（可选，方便维修人员联系）</text>
        </view>
        
        <input
          class="phone-input"
          v-model="formData.contactPhone"
          type="number"
          placeholder="请输入联系电话"
          maxlength="11"
        />
      </view>

      <!-- 提示信息 -->
      <view class="tips-section">
        <view class="tips-title">💡 温馨提示</view>
        <view class="tips-list">
          <text class="tip-item">• 请尽量详细描述问题，有助于快速定位和处理</text>
          <text class="tip-item">• 上传图片可以更直观地展示问题</text>
          <text class="tip-item">• 紧急问题会被优先处理，请合理使用</text>
          <text class="tip-item">• 提交后可在"我的报修"中查看进度</text>
        </view>
      </view>

      <!-- 底部间距 -->
      <view style="height: 100px;"></view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn secondary" @click="goBack" :disabled="submitting">
        <text>取消</text>
      </button>
      <button 
        class="action-btn primary" 
        @click="handleSubmit"
        :disabled="submitting"
        :class="{ submitting }"
      >
        <text v-if="submitting">提交中...</text>
        <text v-else>提交报修</text>
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.repair-submit-page {
  min-height: 100vh;
  background: $bg-primary;
}

.content {
  padding: 16px;
}

// 表单区域
.form-section {
  background: #fff;
  border-radius: $radius-xl;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: $shadow-sm;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: $terracotta-500;
}

.section-desc {
  font-size: 12px;
  color: $warm-gray-400;
  font-weight: normal;
  margin-left: 4px;
}

.error-text {
  font-size: 12px;
  color: $terracotta-500;
  margin-top: 8px;
}

// 报修类型网格
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: $bg-secondary;
  border-radius: $radius-lg;
  position: relative;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.type-item:active {
  transform: scale(0.98);
}

.type-item.active {
  background: rgba($sage-300, 0.2);
  border-color: $sage-500;
}

.type-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.type-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.type-desc {
  font-size: 10px;
  color: $warm-gray-400;
  text-align: center;
}

.type-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: $sage-500;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

// 文本域
.textarea-wrapper {
  position: relative;
  background: $bg-secondary;
  border-radius: $radius-lg;
  padding: 12px;
}

.description-input {
  width: 100%;
  min-height: 120px;
  font-size: 14px;
  line-height: 1.6;
  color: $text-primary;
}

.description-input::placeholder {
  color: $warm-gray-400;
}

.char-count {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 12px;
  color: $warm-gray-400;
}

// 图片上传
.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: $radius-md;
  overflow: hidden;
}

.uploaded-img {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn text {
  color: #fff;
  font-size: 14px;
  line-height: 1;
}

.upload-btn {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
  border-radius: $radius-md;
  border: 2px dashed $warm-gray-300;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.upload-text {
  font-size: 12px;
  color: $warm-gray-400;
}

// 紧急程度选项
.urgent-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.urgent-item {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  background: $bg-secondary;
  border-radius: $radius-lg;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.urgent-item.active {
  border-color: $sage-500;
  background: rgba($sage-300, 0.15);
}

.urgent-item.active.urgent {
  border-color: $terracotta-500;
  background: rgba($terracotta-300, 0.15);
}

.urgent-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid $warm-gray-300;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.urgent-item.active .urgent-radio {
  border-color: $sage-500;
}

.urgent-item.active.urgent .urgent-radio {
  border-color: $terracotta-500;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: $sage-500;
}

.urgent-item.active.urgent .radio-inner {
  background: $terracotta-500;
}

.urgent-content {
  flex: 1;
}

.urgent-label {
  font-size: 15px;
  font-weight: 500;
  color: $text-primary;
  display: block;
  margin-bottom: 4px;
}

.urgent-desc {
  font-size: 12px;
  color: $warm-gray-400;
}

// 电话输入
.phone-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: $bg-secondary;
  border-radius: $radius-lg;
  font-size: 14px;
  color: $text-primary;
}

.phone-input::placeholder {
  color: $warm-gray-400;
}

// 提示信息
.tips-section {
  background: rgba($sage-300, 0.15);
  border-radius: $radius-lg;
  padding: 16px;
  margin-top: 8px;
}

.tips-title {
  font-size: 14px;
  font-weight: 500;
  color: $sage-600;
  margin-bottom: 10px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-item {
  font-size: 12px;
  color: $warm-gray-600;
  line-height: 1.5;
}

// 底部操作栏
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid $warm-gray-100;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-btn {
  flex: 1;
  height: 48px;
  line-height: 48px;
  border-radius: $radius-lg;
  font-size: 15px;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
}

.action-btn.secondary {
  background: $warm-gray-100;
  color: $warm-gray-700;
}

.action-btn.primary {
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  box-shadow: $shadow-sm;
}

.action-btn.submitting {
  opacity: 0.8;
}

.action-btn:active {
  opacity: 0.9;
  transform: translateY(1px);
}

.action-btn[disabled] {
  opacity: 0.6;
}
</style>
