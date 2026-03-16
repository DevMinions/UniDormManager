<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { isSystemAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()

// 权限检查 - 仅系统管理员可访问
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isSystemAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 配置分组
const configGroups = ref([
  {
    name: '🔔 通知设置',
    key: 'notifications',
    settings: [
      { key: 'enable_push', label: '推送通知', value: true, type: 'switch' },
      { key: 'repair_notify', label: '报修提醒', value: true, type: 'switch' },
      { key: 'notice_notify', label: '公告通知', value: true, type: 'switch' },
      { key: 'late_return_alert', label: '晚归告警', value: true, type: 'switch' }
    ]
  },
  {
    name: '🏠 宿舍设置',
    key: 'dormitory',
    settings: [
      { key: 'checkin_time', label: '门禁开始时间', value: '06:00', type: 'time' },
      { key: 'checkout_time', label: '门禁结束时间', value: '23:00', type: 'time' },
      { key: 'late_return_time', label: '晚归判定时间', value: '23:30', type: 'time' },
      { key: 'max_swap_days', label: '换寝审批时限(天)', value: 3, type: 'number' }
    ]
  },
  {
    name: '📋 查寝设置',
    key: 'inspections',
    settings: [
      { key: 'inspection_frequency', label: '查寝频率', value: 'weekly', type: 'select', options: ['daily', 'weekly', 'monthly'] },
      { key: 'excellent_threshold', label: '优秀分数线', value: 90, type: 'number' },
      { key: 'good_threshold', label: '良好分数线', value: 80, type: 'number' },
      { key: 'pass_threshold', label: '及格分数线', value: 60, type: 'number' }
    ]
  },
  {
    name: '🔧 报修设置',
    key: 'repairs',
    settings: [
      { key: 'auto_assign', label: '自动派单', value: true, type: 'switch' },
      { key: 'urgent_response_time', label: '紧急响应时间(小时)', value: 2, type: 'number' },
      { key: 'normal_response_time', label: '普通响应时间(小时)', value: 24, type: 'number' }
    ]
  },
  {
    name: '🔐 安全设置',
    key: 'security',
    settings: [
      { key: 'login_verify', label: '登录验证码', value: true, type: 'switch' },
      { key: 'session_timeout', label: '会话超时(分钟)', value: 30, type: 'number' },
      { key: 'max_login_attempts', label: '最大登录尝试次数', value: 5, type: 'number' }
    ]
  }
])

// 当前编辑的分组
const activeGroup = ref('notifications')

// 计算当前分组
const currentGroup = computed(() => {
  return configGroups.value.find(g => g.key === activeGroup.value)
})

// 页面显示
onShow(() => {
  if (!checkAuth()) return
  loadSettings()
})

// 加载设置
const loadSettings = () => {
  // 从本地存储加载
  try {
    const saved = uni.getStorageSync('system_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      configGroups.value.forEach(group => {
        group.settings.forEach(setting => {
          if (settings[setting.key] !== undefined) {
            setting.value = settings[setting.key]
          }
        })
      })
    }
  } catch (e) {
    console.error('加载设置失败', e)
  }
}

// 保存设置
const saveSettings = () => {
  try {
    const settings = {}
    configGroups.value.forEach(group => {
      group.settings.forEach(setting => {
        settings[setting.key] = setting.value
      })
    })
    uni.setStorageSync('system_settings', JSON.stringify(settings))
    showSuccess('保存成功')
  } catch (e) {
    handleApiError(e, '保存失败')
  }
}

// 重置设置
const resetSettings = () => {
  uni.showModal({
    title: '确认重置',
    content: '确定要恢复默认设置吗？此操作不可恢复！',
    confirmColor: '#DC2626',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('system_settings')
        // 重置为默认值
        configGroups.value = [
          {
            name: '🔔 通知设置',
            key: 'notifications',
            settings: [
              { key: 'enable_push', label: '推送通知', value: true, type: 'switch' },
              { key: 'repair_notify', label: '报修提醒', value: true, type: 'switch' },
              { key: 'notice_notify', label: '公告通知', value: true, type: 'switch' },
              { key: 'late_return_alert', label: '晚归告警', value: true, type: 'switch' }
            ]
          },
          {
            name: '🏠 宿舍设置',
            key: 'dormitory',
            settings: [
              { key: 'checkin_time', label: '门禁开始时间', value: '06:00', type: 'time' },
              { key: 'checkout_time', label: '门禁结束时间', value: '23:00', type: 'time' },
              { key: 'late_return_time', label: '晚归判定时间', value: '23:30', type: 'time' },
              { key: 'max_swap_days', label: '换寝审批时限(天)', value: 3, type: 'number' }
            ]
          },
          {
            name: '📋 查寝设置',
            key: 'inspections',
            settings: [
              { key: 'inspection_frequency', label: '查寝频率', value: 'weekly', type: 'select', options: ['daily', 'weekly', 'monthly'] },
              { key: 'excellent_threshold', label: '优秀分数线', value: 90, type: 'number' },
              { key: 'good_threshold', label: '良好分数线', value: 80, type: 'number' },
              { key: 'pass_threshold', label: '及格分数线', value: 60, type: 'number' }
            ]
          },
          {
            name: '🔧 报修设置',
            key: 'repairs',
            settings: [
              { key: 'auto_assign', label: '自动派单', value: true, type: 'switch' },
              { key: 'urgent_response_time', label: '紧急响应时间(小时)', value: 2, type: 'number' },
              { key: 'normal_response_time', label: '普通响应时间(小时)', value: 24, type: 'number' }
            ]
          },
          {
            name: '🔐 安全设置',
            key: 'security',
            settings: [
              { key: 'login_verify', label: '登录验证码', value: true, type: 'switch' },
              { key: 'session_timeout', label: '会话超时(分钟)', value: 30, type: 'number' },
              { key: 'max_login_attempts', label: '最大登录尝试次数', value: 5, type: 'number' }
            ]
          }
        ]
        showSuccess('已恢复默认设置')
      }
    }
  })
}

// 获取选项文本
const getOptionText = (key, value) => {
  const optionMap = {
    'inspection_frequency': {
      'daily': '每日',
      'weekly': '每周',
      'monthly': '每月'
    }
  }
  return optionMap[key]?.[value] || value
}

// 显示选择器
const showSelect = (setting) => {
  const itemList = setting.options.map(opt => getOptionText(setting.key, opt))
  uni.showActionSheet({
    itemList,
    success: (res) => {
      setting.value = setting.options[res.tapIndex]
    }
  })
}

// 跳转到页面
const navigateTo = (url) => {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <AppNavbar title="系统配置" show-back />
    
    <view class="content-wrapper">
      <!-- 左侧菜单 -->
      <view class="sidebar">
        <view
          v-for="group in configGroups"
          :key="group.key"
          class="menu-item"
          :class="{ active: activeGroup === group.key }"
          @click="activeGroup = group.key"
        >
          <text class="menu-icon">{{ group.name.split(' ')[0] }}</text>
          <text class="menu-text">{{ group.name.split(' ')[1] }}</text>
        </view>
        
        <!-- 快捷入口 -->
        <view class="quick-links">
          <text class="links-title">快捷入口</text>
          <view class="link-item" @click="navigateTo('/pages/admin/users')">
            <text class="link-icon">👤</text>
            <text class="link-text">用户管理</text>
          </view>
          <view class="link-item" @click="navigateTo('/pages/roles/list')"
          >
            <text class="link-icon">🔐</text>
            <text class="link-text">角色权限</text>
          </view>
          <view class="link-item" @click="navigateTo('/pages/buildings/list')"
          >
            <text class="link-icon">🏢</text>
            <text class="link-text">楼栋管理</text>
          </view>
        </view>
      </view>
      
      <!-- 右侧内容 -->
      <view class="main-content">
        <view v-if="currentGroup" class="settings-card"
        >
          <view class="card-header"
          >
            <text class="card-title">{{ currentGroup.name }}</text>
          </view>
          
          <view class="settings-list">
            <view
              v-for="setting in currentGroup.settings"
              :key="setting.key"
              class="setting-item"
            >
              <view class="setting-info"
              >
                <text class="setting-label">{{ setting.label }}</text>
                <text class="setting-desc">{{ setting.key }}</text>
              </view>
              
              <view class="setting-control">
                <!-- Switch 类型 -->
                <view
                  v-if="setting.type === 'switch'"
                  class="switch-wrapper"
                  :class="{ active: setting.value }"
                  @click="setting.value = !setting.value"
                >
                  <view class="switch-track">
                    <view class="switch-thumb"></view>
                  </view>
                </view>
                
                <!-- Number 类型 -->
                <input
                  v-else-if="setting.type === 'number'"
                  v-model.number="setting.value"
                  type="number"
                  class="number-input"
                />
                
                <!-- Time 类型 -->
                <input
                  v-else-if="setting.type === 'time'"
                  v-model="setting.value"
                  type="text"
                  class="time-input"
                  placeholder="HH:MM"
                />
                
                <!-- Select 类型 -->
                <view
                  v-else-if="setting.type === 'select'"
                  class="select-input"
                  @click="showSelect(setting)"
                >
                  <text class="select-value">{{ getOptionText(setting.key, setting.value) }}</text>
                  <text class="select-arrow">▾</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="action-bar">
          <button class="reset-btn" @click="resetSettings">
            <text class="btn-icon">↺</text>
            <text class="btn-text">恢复默认</text>
          </button>
          <button class="save-btn" @click="saveSettings">
            <text class="btn-icon">✓</text>
            <text class="btn-text">保存设置</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- TabBar -->
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 160rpx;
}

.content-wrapper {
  display: flex;
  height: calc(100vh - 200rpx);
  padding: 24rpx;
  gap: 24rpx;
}

// 侧边栏
.sidebar {
  width: 220rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx 20rpx;
    border-radius: 16rpx;
    margin-bottom: 12rpx;
    
    .menu-icon {
      font-size: 32rpx;
    }
    
    .menu-text {
      font-size: 28rpx;
      color: #6B7280;
      font-weight: 500;
    }
    
    &.active {
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      
      .menu-text {
        color: #FFFFFF;
      }
    }
  }
  
  .quick-links {
    margin-top: auto;
    padding-top: 24rpx;
    border-top: 2rpx solid #F3F4F6;
    
    .links-title {
      display: block;
      font-size: 24rpx;
      color: #9CA3AF;
      margin-bottom: 16rpx;
      padding-left: 12rpx;
    }
    
    .link-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      padding: 16rpx 12rpx;
      border-radius: 12rpx;
      
      .link-icon {
        font-size: 28rpx;
      }
      
      .link-text {
        font-size: 26rpx;
        color: #6B7280;
      }
      
      &:active {
        background: #F3F4F6;
      }
    }
  }
}

// 主内容区
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .settings-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 24rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    overflow-y: auto;
    
    .card-header {
      padding-bottom: 24rpx;
      border-bottom: 2rpx solid #F3F4F6;
      margin-bottom: 24rpx;
      
      .card-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #1F2937;
      }
    }
  }
}

// 设置列表
.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 2rpx solid #F9FAFB;
  
  &:last-child {
    border-bottom: none;
  }
  
  .setting-info {
    .setting-label {
      display: block;
      font-size: 30rpx;
      color: #1F2937;
      margin-bottom: 8rpx;
    }
    
    .setting-desc {
      font-size: 24rpx;
      color: #9CA3AF;
      font-family: monospace;
    }
  }
  
  .setting-control {
    .switch-wrapper {
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
    
    .number-input,
    .time-input {
      width: 140rpx;
      height: 64rpx;
      background: #F9FAFB;
      border: 2rpx solid #E5E7EB;
      border-radius: 12rpx;
      text-align: center;
      font-size: 28rpx;
      color: #1F2937;
    }
    
    .select-input {
      display: flex;
      align-items: center;
      gap: 12rpx;
      background: #F9FAFB;
      border: 2rpx solid #E5E7EB;
      border-radius: 12rpx;
      padding: 16rpx 24rpx;
      
      .select-value {
        font-size: 28rpx;
        color: #1F2937;
      }
      
      .select-arrow {
        font-size: 24rpx;
        color: #9CA3AF;
      }
    }
  }
}

// 操作栏
.action-bar {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
  
  .reset-btn,
  .save-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    border: none;
    
    .btn-icon {
      font-size: 32rpx;
    }
    
    .btn-text {
      font-size: 30rpx;
      font-weight: 600;
    }
  }
  
  .reset-btn {
    background: #F3F4F6;
    
    .btn-text {
      color: #6B7280;
    }
  }
  
  .save-btn {
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
    
    .btn-text {
      color: #FFFFFF;
    }
  }
}
</style>
