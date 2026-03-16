<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { isDormStaff } from '@/config/roles.js'
import { showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 检查权限
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

// 通知设置
const settings = ref({
  // 推送总开关
  enabled: true,
  
  // 推送渠道
  pushEnabled: true,    // 推送通知
  smsEnabled: false,    // 短信通知
  emailEnabled: false,  // 邮件通知
  
  // 通知方式
  soundEnabled: true,   // 声音提醒
  vibrateEnabled: true, // 震动提醒
  bannerEnabled: true,  // 横幅通知
  
  // 通知场景
  newAlert: true,       // 新告警通知
  dailyReport: false,   // 日报通知
  weeklyReport: true,   // 周报通知
  
  // 通知时间
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  respectQuietHours: true
})

// 加载设置
onShow(() => {
  if (!checkAuth()) return
  loadSettings()
})

const loadSettings = () => {
  try {
    const saved = uni.getStorageSync('late_return_notification_settings')
    if (saved) {
      settings.value = { ...settings.value, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('加载设置失败', e)
  }
}

// 保存设置
const saveSettings = () => {
  try {
    uni.setStorageSync('late_return_notification_settings', JSON.stringify(settings.value))
    showSuccess('设置已保存')
  } catch (e) {
    console.error('保存设置失败', e)
  }
}

// 切换设置
const toggle = (key) => {
  settings.value[key] = !settings.value[key]
  saveSettings()
}

// 发送测试通知
const sendTestNotification = () => {
  if (!settings.value.enabled) {
    uni.showToast({ title: '请先开启通知总开关', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '发送测试通知',
    content: `将向您发送一条晚归告警测试通知\n\n推送: ${settings.value.pushEnabled ? '✓' : '✗'}\n声音: ${settings.value.soundEnabled ? '✓' : '✗'}\n震动: ${settings.value.vibrateEnabled ? '✓' : '✗'}`,
    success: (res) => {
      if (res.confirm) {
        // 实际项目中调用推送 API
        simulateNotification()
      }
    }
  })
}

// 模拟通知
const simulateNotification = () => {
  uni.showToast({ 
    title: settings.value.soundEnabled ? '通知已发送 📢' : '通知已发送', 
    icon: 'success',
    duration: 2000
  })
  
  // 如果开启震动
  if (settings.value.vibrateEnabled) {
    uni.vibrateShort()
    setTimeout(() => uni.vibrateShort(), 200)
    setTimeout(() => uni.vibrateShort(), 400)
  }
}

// 静默时间段检查
const isInQuietHours = () => {
  if (!settings.value.respectQuietHours) return false
  
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute
  
  const [startHour, startMinute] = settings.value.quietHoursStart.split(':').map(Number)
  const [endHour, endMinute] = settings.value.quietHoursEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime <= endTime
  } else {
    // 跨天情况 (22:00 - 08:00)
    return currentTime >= startTime || currentTime <= endTime
  }
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="通知设置" show-back />
    
    <view class="content">
      <!-- 总开关 -->
      <view class="section">
        <view class="section-title">
          <text class="title-icon">🔔</text>
          <text class="title-text">总开关</text>
        </view>
        
        <view class="setting-item">
          <view class="item-info"
003e
            <text class="item-title">启用通知</text>
            <text class="item-desc">关闭后将不再接收任何晚归告警通知</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.enabled }"
            @click="toggle('enabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>
      
      <!-- 推送渠道 -->
      <view class="section" v-if="settings.enabled">
        <view class="section-title">
          <text class="title-icon">📱</text>
          <text class="title-text">推送渠道</text>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">推送通知</text>
            <text class="item-desc">通过 App 推送接收告警</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.pushEnabled }"
            @click="toggle('pushEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">短信通知</text>
            <text class="item-desc">通过短信接收告警</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.smsEnabled }"
            @click="toggle('smsEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">邮件通知</text>
            <text class="item-desc">通过邮件接收告警</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.emailEnabled }"
            @click="toggle('emailEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>
      
      <!-- 通知方式 -->
      <view class="section" v-if="settings.enabled && settings.pushEnabled">
        <view class="section-title">
          <text class="title-icon">🎵</text>
          <text class="title-text">通知方式</text>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">声音提醒</text>
            <text class="item-desc">收到通知时播放提示音</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.soundEnabled }"
            @click="toggle('soundEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">震动提醒</text>
            <text class="item-desc">收到通知时震动</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.vibrateEnabled }"
            @click="toggle('vibrateEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">横幅通知</text>
            <text class="item-desc">在屏幕顶部显示横幅</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.bannerEnabled }"
            @click="toggle('bannerEnabled')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>
      
      <!-- 通知场景 -->
      <view class="section" v-if="settings.enabled">
        <view class="section-title">
          <text class="title-icon">📋</text>
          <text class="title-text">通知场景</text>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">新告警通知</text>
            <text class="item-desc">有新的晚归告警时立即通知</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.newAlert }"
            @click="toggle('newAlert')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">日报通知</text>
            <text class="item-desc">每日推送晚归统计报告</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.dailyReport }"
            @click="toggle('dailyReport')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">周报通知</text>
            <text class="item-desc">每周推送晚归统计报告</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.weeklyReport }"
            @click="toggle('weeklyReport')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
      </view>
      
      <!-- 静默时段 -->
      <view class="section" v-if="settings.enabled">
        <view class="section-title">
          <text class="title-icon">🌙</text>
          <text class="title-text">静默时段</text>
        </view>
        
        <view class="setting-item">
          <view class="item-info">
            <text class="item-title">启用静默时段</text>
            <text class="item-desc">在指定时间段内不发送通知</text>
          </view>
          <view 
            class="switch" 
            :class="{ active: settings.respectQuietHours }"
            @click="toggle('respectQuietHours')"
          >
            <view class="switch-thumb"></view>
          </view>
        </view>
        
        <view class="time-range" v-if="settings.respectQuietHours">
          <view class="time-input-wrapper">
            <text class="time-label">开始</text>
            <input 
              v-model="settings.quietHoursStart" 
              type="text" 
              class="time-input"
              placeholder="22:00"
              @blur="saveSettings"
            />
          </view>
          <text class="time-separator">至</text>
          <view class="time-input-wrapper">
            <text class="time-label">结束</text>
            <input 
              v-model="settings.quietHoursEnd" 
              type="text" 
              class="time-input"
              placeholder="08:00"
              @blur="saveSettings"
            />
          </view>
        </view>
      </view>
      
      <!-- 测试按钮 -->
      <view class="test-section" v-if="settings.enabled">
        <button class="test-btn" @click="sendTestNotification">
          <text class="btn-icon">🔔</text>
          <text class="btn-text">发送测试通知</text>
        </button>
        <text class="test-hint">测试当前的通知设置配置</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 40rpx;
}

.content {
  padding: 24rpx;
}

.section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 24rpx;
    padding-bottom: 16rpx;
    border-bottom: 2rpx solid #F3F4F6;
    
    .title-icon {
      font-size: 32rpx;
    }
    
    .title-text {
      font-size: 30rpx;
      font-weight: 600;
      color: #1F2937;
    }
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #F9FAFB;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  &:first-of-type {
    padding-top: 0;
  }
  
  .item-info {
    .item-title {
      display: block;
      font-size: 30rpx;
      color: #1F2937;
      margin-bottom: 8rpx;
    }
    
    .item-desc {
      font-size: 24rpx;
      color: #9CA3AF;
    }
  }
  
  .switch {
    width: 96rpx;
    height: 52rpx;
    background: #E5E7EB;
    border-radius: 26rpx;
    padding: 4rpx;
    transition: background 0.3s;
    
    &.active {
      background: #10B981;
      
      .switch-thumb {
        transform: translateX(44rpx);
      }
    }
    
    .switch-thumb {
      width: 44rpx;
      height: 44rpx;
      background: #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
      transition: transform 0.3s;
    }
  }
}

.time-range {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #F9FAFB;
  
  .time-input-wrapper {
    flex: 1;
    
    .time-label {
      display: block;
      font-size: 24rpx;
      color: #9CA3AF;
      margin-bottom: 8rpx;
    }
    
    .time-input {
      width: 100%;
      height: 72rpx;
      background: #F9FAFB;
      border: 2rpx solid #E5E7EB;
      border-radius: 12rpx;
      text-align: center;
      font-size: 28rpx;
      color: #1F2937;
    }
  }
  
  .time-separator {
    font-size: 28rpx;
    color: #6B7280;
    margin-top: 28rpx;
  }
}

.test-section {
  margin-top: 40rpx;
  text-align: center;
  
  .test-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    padding: 28rpx 48rpx;
    border-radius: 24rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
    margin-bottom: 16rpx;
    
    .btn-icon {
      font-size: 32rpx;
    }
    
    .btn-text {
      font-size: 30rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }
  
  .test-hint {
    font-size: 24rpx;
    color: #9CA3AF;
  }
}
</style>
