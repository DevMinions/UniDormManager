<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { handleApiError } from '@/utils/helpers.js'

const userStore = useUserStore()
const appStore = useAppStore()

const form = reactive({
  username: '',
  password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  if (!form.username.trim()) {
    appStore.showToast('请输入用户名', 'none')
    return
  }
  if (!form.password.trim()) {
    appStore.showToast('请输入密码', 'none')
    return
  }
  
  isLoading.value = true
  
  try {
    // 调用真实 API 登录
    const result = await userStore.login({
      username: form.username,
      password: form.password
    })
    
    if (result.success) {
      appStore.showToast('登录成功', 'success')
      
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 500)
    } else {
      appStore.showToast(result.error || '登录失败', 'none')
    }
    
  } catch (error) {
    handleApiError(error, '登录失败')
  } finally {
    isLoading.value = false
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <view class="login-page">
    <!-- 背景层 -->
    <view class="bg-layer">
      <view class="bg-gradient"></view>
      <view class="bg-blob blob-1"></view>
      <view class="bg-blob blob-2"></view>
      <view class="bg-blob blob-3"></view>
      
      <view class="deco-leaf leaf-1">🌿</view>
      <view class="deco-leaf leaf-2">🍃</view>
      <view class="deco-leaf leaf-3">🏠</view>
    </view>
    
    <!-- 内容层 -->
    <view class="content-layer">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <view class="logo-ring ring-1"></view>
        <view class="logo-ring ring-2"></view>
        <view class="logo-icon">
          <text>🏠</text>
        </view>
        
        <view class="logo-text">宿舍管理系统</view>
        <view class="logo-subtitle">UniDorm Manager</view>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-card">
        <view class="card-deco">
          <view class="deco-line"></view>
          <view class="deco-dot"></view>
        </view>
        
        <view class="form-title">欢迎回来</view>
        <view class="form-subtitle">请登录您的账号</view>
        
        <!-- 用户名 -->
        <view class="input-group"
        >
          <view class="input-icon">👤</view>
          <input
            v-model="form.username"
            class="form-input"
            type="text"
            placeholder="请输入用户名"
            placeholder-class="placeholder"
          />
        </view>
        
        <!-- 密码 -->
        <view class="input-group"
        >
          <view class="input-icon">🔐</view>
          <input
            v-model="form.password"
            class="form-input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            placeholder-class="placeholder"
          />
          <view class="password-toggle" @click="togglePassword">
            <text>{{ showPassword ? '🙈' : '👁️' }}</text>
          </view>
        </view>
        
        <!-- 登录按钮 -->
        <button 
          class="login-btn"
          :class="{ loading: isLoading }"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <view v-if="isLoading" class="btn-loader"
          >
            <view class="loader-dot"></view>
            <view class="loader-dot"></view>
            <view class="loader-dot"></view>
          </view>
          <text v-else>登 录</text>
        </button>
        
        <!-- 底部链接 -->
        <view class="form-footer">
          <text class="footer-link">忘记密码？</text>
          <view class="footer-divider"></view>
          <text class="footer-link primary">联系管理员</text>
        </view>
      </view>
      
      <!-- 版本信息 -->
      <view class="bottom-info">
        <text class="version">Version 1.0.0 🌿</text>
        <text class="copyright">让宿舍生活更美好</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #FFFBEB;
}

/* 背景层 */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    165deg,
    #FFFBEB 0%,
    #F8F2F0 30%,
    #FEF3C7 60%,
    #FFFBEB 100%
  );
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
}

.blob-1 {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(135deg, rgba(154, 52, 18, 0.35), rgba(196, 111, 67, 0.2));
  top: -120rpx;
  right: -100rpx;
  animation: float 8s ease-in-out infinite;
}

.blob-2 {
  width: 300rpx;
  height: 300rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(16, 185, 129, 0.15));
  bottom: 150rpx;
  left: -80rpx;
  animation: float 10s ease-in-out infinite reverse;
}

.blob-3 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(251, 191, 36, 0.1));
  top: 40%;
  right: -60rpx;
  animation: float 12s ease-in-out infinite;
}

.deco-leaf {
  position: absolute;
  font-size: 48rpx;
  opacity: 0.12;
  filter: blur(1rpx);
}

.leaf-1 {
  top: 15%;
  left: 8%;
  animation: leafFloat 6s ease-in-out infinite;
}

.leaf-2 {
  top: 55%;
  right: 10%;
  font-size: 40rpx;
  animation: leafFloat 7s ease-in-out infinite 1s;
}

.leaf-3 {
  bottom: 25%;
  left: 5%;
  font-size: 36rpx;
  animation: leafFloat 5s ease-in-out infinite 0.5s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(15rpx, -15rpx) scale(1.05); }
  66% { transform: translate(-10rpx, 10rpx) scale(0.95); }
}

@keyframes leafFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12rpx) rotate(5deg); }
}

/* 内容层 */
.content-layer {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 32rpx;
}

/* Logo */
.logo-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  animation: fadeInUp 0.8s ease forwards;
}

.logo-ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx dashed rgba(154, 52, 18, 0.25);
}

.ring-1 {
  width: 140rpx;
  height: 140rpx;
  animation: spin-slow 30s linear infinite;
}

.ring-2 {
  width: 160rpx;
  height: 160rpx;
  animation: spin-reverse 25s linear infinite;
}

.logo-icon {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #ffffff 0%, #F8F2F0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  box-shadow: 
    0 8rpx 32rpx rgba(154, 52, 18, 0.15),
    0 2rpx 8rpx rgba(0, 0, 0, 0.05),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.8);
  border: 3rpx solid rgba(154, 52, 18, 0.2);
  margin-bottom: 24rpx;
  animation: breathe 4s ease-in-out infinite;
}

.logo-icon::before {
  content: '';
  position: absolute;
  top: -6rpx;
  left: -6rpx;
  right: -6rpx;
  bottom: -6rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(154, 52, 18, 0.15);
}

@keyframes breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 8rpx 32rpx rgba(154, 52, 18, 0.15); }
  50% { transform: scale(1.03); box-shadow: 0 12rpx 40rpx rgba(154, 52, 18, 0.2); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(30rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.logo-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #1E293B;
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
}

.logo-subtitle {
  font-size: 24rpx;
  color: #64748B;
  letter-spacing: 3rpx;
}

/* 表单卡片 */
.form-card {
  width: 100%;
  max-width: 600rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: 32rpx 32rpx 32rpx 16rpx;
  padding: 48rpx 36rpx 36rpx;
  box-shadow: 
    0 8rpx 40rpx rgba(154, 52, 18, 0.12),
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
  border: 2rpx solid rgba(242, 230, 226, 0.6);
  position: relative;
  animation: fadeInUp 0.8s ease 0.2s forwards;
  opacity: 0;
}

.card-deco {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.deco-line {
  width: 32rpx;
  height: 3rpx;
  background: linear-gradient(90deg, #E8D4CD, transparent);
  border-radius: 2rpx;
}

.deco-dot {
  width: 8rpx;
  height: 8rpx;
  background: #C49A8D;
  border-radius: 50%;
}

.form-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 8rpx;
  text-align: center;
}

.form-subtitle {
  font-size: 26rpx;
  color: #64748B;
  margin-bottom: 40rpx;
  text-align: center;
}

/* 输入框 */
.input-group {
  display: flex;
  align-items: center;
  background: #F8F2F0;
  border-radius: 20rpx;
  padding: 4rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #F2E6E2;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  background: #ffffff;
  border-color: #C49A8D;
  box-shadow: 0 0 0 6rpx rgba(154, 52, 18, 0.1);
}

.input-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  opacity: 0.7;
}

.form-input {
  flex: 1;
  height: 80rpx;
  font-size: 30rpx;
  color: #1E293B;
  background: transparent;
  padding: 0 16rpx;
}

.placeholder {
  color: #9CA3AF;
  font-size: 28rpx;
}

.password-toggle {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.password-toggle:active {
  opacity: 1;
  transform: scale(0.9);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #9A3412 0%, #7C2D12 100%);
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  margin-top: 16rpx;
  margin-bottom: 28rpx;
  box-shadow: 
    0 6rpx 20rpx rgba(154, 52, 18, 0.35),
    0 2rpx 4rpx rgba(0, 0, 0, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.login-btn:not(:disabled):active {
  transform: scale(0.98);
  box-shadow: 
    0 3rpx 12rpx rgba(154, 52, 18, 0.35),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
}

.login-btn:disabled {
  opacity: 0.85;
}

.login-btn.loading {
  pointer-events: none;
}

/* 加载动画 */
.btn-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.loader-dot {
  width: 12rpx;
  height: 12rpx;
  background: #ffffff;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loader-dot:nth-child(1) { animation-delay: -0.32s; }
.loader-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* 底部链接 */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.footer-link {
  font-size: 26rpx;
  color: #64748B;
  transition: color 0.2s ease;
}

.footer-link.primary {
  color: #9A3412;
  font-weight: 500;
}

.footer-link:active {
  color: #7C2D12;
}

.footer-divider {
  width: 2rpx;
  height: 24rpx;
  background: #E8D4CD;
}

/* 版本信息 */
.bottom-info {
  margin-top: 48rpx;
  text-align: center;
  animation: fadeIn 1s ease 0.6s forwards;
  opacity: 0;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.version {
  display: block;
  font-size: 24rpx;
  color: #9CA3AF;
  margin-bottom: 8rpx;
}

.copyright {
  font-size: 22rpx;
  color: #9CA3AF;
}
</style>
