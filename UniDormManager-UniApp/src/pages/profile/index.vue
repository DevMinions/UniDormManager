<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { getRoleConfig, ROLES } from '@/config/roles.js'
import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()
const appStore = useAppStore()

const version = ref('1.0.0')

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo || {})

// 用户角色（支持多角色）
const userRoles = computed(() => {
  const roles = userInfo.value?.roles || []
  return roles.map(r => typeof r === 'string' ? r : r.code)
})

// 主角色
const primaryRole = computed(() => userRoles.value[0] || ROLES.STUDENT)
const roleConfig = computed(() => getRoleConfig(primaryRole.value))

// 角色显示名称
const roleDisplayName = computed(() => {
  if (userRoles.value.length > 1) {
    return `${getRoleConfig(userRoles.value[0]).name}等${userRoles.value.length}个角色`
  }
  return roleConfig.value.name
})

// 功能菜单配置
const roleMenus = {
  [ROLES.STUDENT]: [
    { icon: '🔧', label: '我的报修', desc: '查看报修记录', path: '/pages/repairs/list', color: '#FEF3C7', accent: '#D97706' },
    { icon: '🏠', label: '我的宿舍', desc: '查看宿舍信息', path: '/pages/rooms/detail', color: '#F8F2F0', accent: '#9A3412' },
    { icon: '⭐', label: '宿舍评分', desc: '查看评分记录', path: '/pages/inspections/list', color: '#ECFDF5', accent: '#059669' },
    { icon: '📢', label: '公告通知', desc: '查看系统公告', path: '/pages/notices/list', color: '#EFF6FF', accent: '#3B82F6' }
  ],
  [ROLES.DORM_MANAGER]: [
    { icon: '📋', label: '报修管理', desc: '处理学生报修', path: '/pages/repairs/list', color: '#FEF3C7', accent: '#D97706' },
    { icon: '🏠', label: '房间管理', desc: '管理宿舍房间', path: '/pages/rooms/list', color: '#F8F2F0', accent: '#9A3412' },
    { icon: '👥', label: '学生管理', desc: '管理入住学生', path: '/pages/admin/users', color: '#ECFDF5', accent: '#059669' },
    { icon: '📢', label: '公告管理', desc: '发布系统公告', path: '/pages/notices/list', color: '#EFF6FF', accent: '#3B82F6' }
  ],
  [ROLES.MAINTENANCE]: [
    { icon: '📋', label: '待处理工单', desc: '查看待处理报修', path: '/pages/repairs/list?status=pending', color: '#FEF3C7', accent: '#D97706' },
    { icon: '🔧', label: '处理中', desc: '正在处理的工单', path: '/pages/repairs/list?status=processing', color: '#ECFDF5', accent: '#059669' },
    { icon: '✅', label: '已完成', desc: '历史完成工单', path: '/pages/repairs/list?status=completed', color: '#F8F2F0', accent: '#9A3412' },
    { icon: '📊', label: '工作统计', desc: '个人工作数据', path: '/pages/repairs/statistics', color: '#EFF6FF', accent: '#3B82F6' }
  ],
  [ROLES.BUILDING_MANAGER]: [
    { icon: '🏢', label: '楼栋管理', desc: '管理负责楼栋', path: '/pages/buildings/detail', color: '#EDE9FE', accent: '#7C3AED' },
    { icon: '👥', label: '学生管理', desc: '楼栋学生信息', path: '/pages/admin/users', color: '#ECFDF5', accent: '#059669' },
    { icon: '📋', label: '报修管理', desc: '楼栋报修处理', path: '/pages/repairs/list', color: '#FEF3C7', accent: '#D97706' },
    { icon: '⭐', label: '卫生检查', desc: '宿舍卫生评分', path: '/pages/inspections/list', color: '#F8F2F0', accent: '#9A3412' }
  ],
  [ROLES.LOGISTICS_ADMIN]: [
    { icon: '📊', label: '数据统计', desc: '全局数据统计', path: '/pages/admin/dashboard', color: '#FEE2E2', accent: '#DC2626' },
    { icon: '🔧', label: '报修管理', desc: '所有报修工单', path: '/pages/repairs/list', color: '#FEF3C7', accent: '#D97706' },
    { icon: '🏠', label: '楼栋管理', desc: '管理所有楼栋', path: '/pages/buildings/list', color: '#F8F2F0', accent: '#9A3412' },
    { icon: '👥', label: '人员管理', desc: '宿管人员管理', path: '/pages/admin/users', color: '#ECFDF5', accent: '#059669' }
  ],
  [ROLES.SYSTEM_ADMIN]: [
    { icon: '⚡', label: '系统管理', desc: '系统配置管理', path: '/pages/admin/dashboard', color: '#F1F5F9', accent: '#1E293B' },
    { icon: '👤', label: '用户管理', desc: '管理系统用户', path: '/pages/admin/users', color: '#EFF6FF', accent: '#3B82F6' },
    { icon: '🔑', label: '权限管理', desc: '角色权限配置', path: '/pages/admin/roles', color: '#ECFDF5', accent: '#059669' },
    { icon: '📊', label: '系统监控', desc: '系统运行状态', path: '/pages/admin/monitor', color: '#FEF3C7', accent: '#D97706' }
  ]
}

// 系统功能菜单（所有角色通用）
const systemMenus = [
  { icon: '🔐', label: '修改密码', desc: '更改登录密码', handler: 'changePassword', color: '#F8F2F0', accent: '#9A3412' },
  { icon: '⚙️', label: '系统设置', desc: '应用偏好设置', handler: 'settings', color: '#FEF3C7', accent: '#D97706' },
  { icon: '❓', label: '帮助反馈', desc: '问题反馈帮助', handler: 'help', color: '#ECFDF5', accent: '#059669' }
]

// 获取角色菜单
const getRoleMenu = () => {
  return roleMenus[primaryRole.value] || roleMenus[ROLES.STUDENT]
}

// 检查登录
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

onShow(() => {
  userStore.checkLoginStatus()
  checkAuth()
})

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' })
}

const handleMenuClick = (item) => {
  if (item.handler) {
    handleSpecialMenu(item.handler)
    return
  }
  if (item.path) {
    uni.navigateTo({ url: item.path })
  }
}

const handleSpecialMenu = (handler) => {
  switch (handler) {
    case 'changePassword':
      uni.showToast({ title: '功能开发中...', icon: 'none' })
      break
    case 'settings':
      uni.showToast({ title: '功能开发中...', icon: 'none' })
      break
    case 'help':
      uni.showToast({ title: '功能开发中...', icon: 'none' })
      break
  }
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    }
  })
}
</script>

<template>
  <view class="profile-page">
    <!-- 背景 -->
    <view class="page-bg">
      <view class="bg-blob blob-1" :style="{ background: roleConfig.color }"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <!-- 未登录状态 -->
    <view class="login-prompt" v-if="!isLoggedIn">
      <view class="prompt-icon" :style="{ background: roleConfig.bgColor }">
        <text>{{ roleConfig.icon }}</text>
      </view>
      <text class="prompt-text">请先登录</text>
      <button class="login-btn" :style="{ background: roleConfig.color }" @click="goToLogin">
        去登录
      </button>
    </view>
    
    <!-- 已登录状态 -->
    <view class="profile-content" v-if="isLoggedIn">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="card-glow"></view>
        
        <view class="user-main">
          <!-- 头像 -->
          <view class="avatar-section">
            <view 
              class="avatar-wrapper"
              :style="{ 
                background: roleConfig.bgColor,
                borderColor: roleConfig.color
              }"
            >
              <text class="avatar-text">{{ roleConfig.icon }}</text>
            </view>
            <view 
              class="avatar-ring"
              :style="{ borderColor: roleConfig.color }"
            ></view>
          </view>
          
          <!-- 信息 -->
          <view class="user-info">
            <view class="user-header">
              <text class="user-name">{{ userInfo.realName || userInfo.username || '用户' }}</text>
              <view 
                class="user-role-tag"
                :style="{ 
                  background: roleConfig.bgColor,
                  color: roleConfig.color,
                  borderColor: roleConfig.color
                }"
              >
                <text>{{ roleDisplayName }}</text>
              </view>
            </view>
            
            <view class="user-meta">
              <text class="meta-item" v-if="userInfo.studentId">
                <text class="meta-icon">📋</text>
                <text>{{ userInfo.studentId }}</text>
              </text>
              <text class="meta-item" v-if="userInfo.phone">
                <text class="meta-icon">📱</text>
                <text>{{ userInfo.phone }}</text>
              </text>
              <text class="meta-item" v-if="userInfo.email">
                <text class="meta-icon">📧</text>
                <text>{{ userInfo.email }}</text>
              </text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 角色功能菜单 -->
      <view class="menu-section">
        <view class="section-title">
          <view 
            class="title-icon" 
            :style="{ background: roleConfig.bgColor }"
          >
            <text>⚡</text>
          </view>
          <text>{{ roleConfig.name }}功能</text>
        </view>
        
        <view class="menu-list">
          <view 
            v-for="(item, index) in getRoleMenu()" 
            :key="index"
            class="menu-item"
            :style="{ animationDelay: `${index * 80}ms` }"
            @click="handleMenuClick(item)"
          >
            <view 
              class="item-icon"
              :style="{ background: item.color }"
            >
              <text>{{ item.icon }}</text>
            </view>
            
            <view class="item-content">
              <text class="item-label">{{ item.label }}</text>
              <text class="item-desc">{{ item.desc }}</text>
            </view>
            
            <text class="item-arrow">></text>
          </view>
        </view>
      </view>
      
      <!-- 系统功能菜单 -->
      <view class="menu-section">
        <view class="section-title">
          <view class="title-icon" style="background: #F1F5F9">⚙️</view>
          <text>系统设置</text>
        </view>
        
        <view class="menu-list">
          <view 
            v-for="(item, index) in systemMenus" 
            :key="index"
            class="menu-item"
            :style="{ animationDelay: `${index * 80}ms` }"
            @click="handleMenuClick(item)"
          >
            <view 
              class="item-icon"
              :style="{ background: item.color }"
            >
              <text>{{ item.icon }}</text>
            </view>
            
            <view class="item-content">
              <text class="item-label">{{ item.label }}</text>
              <text class="item-desc">{{ item.desc }}</text>
            </view>
            
            <text class="item-arrow">></text>
          </view>
        </view>
      </view>
      
      <!-- 退出登录 -->
      <view class="logout-section">
        <button class="logout-btn" @click="handleLogout">
          <text class="logout-icon">🚪</text>
          <text>退出登录</text>
        </button>
      </view>
      
      <!-- 版本信息 -->
      <view class="version-info">
        <text>UniDormManager v{{ version }} {{ roleConfig.icon }}</text>
      </view>
    </view>
    
    <!-- 底部 TabBar -->
    <CustomTabBar />
  </view>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #FFFBEB;
  position: relative;
  padding: 24rpx;
  padding-bottom: 160rpx;
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
  opacity: 0.2;
}

.blob-1 {
  width: 300rpx;
  height: 300rpx;
  top: -80rpx;
  right: -60rpx;
}

.blob-2 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(16, 185, 129, 0.15));
  bottom: 200rpx;
  left: -40rpx;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 48rpx;
}

.prompt-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.prompt-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 32rpx;
}

.login-btn {
  width: 280rpx;
  height: 88rpx;
  line-height: 88rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.2);
}

.user-card {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #FFFBEB 100%);
  border-radius: 28rpx 28rpx 28rpx 12rpx;
  padding: 36rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid #F2E6E2;
  overflow: hidden;
  animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(30rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 80%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 28rpx;
  position: relative;
  z-index: 1;
}

.avatar-section {
  position: relative;
}

.avatar-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.avatar-text {
  font-size: 56rpx;
}

.avatar-ring {
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border: 2rpx dashed;
  border-radius: 50%;
  opacity: 0.4;
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-info {
  flex: 1;
}

.user-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  color: #1E293B;
}

.user-role-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  font-weight: 500;
  border: 2rpx solid;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: #64748B;
}

.meta-icon {
  font-size: 28rpx;
}

.menu-section {
  margin-bottom: 32rpx;
  animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.title-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.menu-list {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  transition: background 0.2s ease;
  animation: fadeInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeInRight {
  0% { opacity: 0; transform: translateX(-20rpx); }
  100% { opacity: 1; transform: translateX(0); }
}

.menu-item:active {
  background: #F8F2F0;
}

.menu-item:not(:last-child) {
  border-bottom: 2rpx solid #F2E6E2;
}

.item-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
}

.item-content {
  flex: 1;
}

.item-label {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 4rpx;
}

.item-desc {
  display: block;
  font-size: 24rpx;
  color: #64748B;
}

.item-arrow {
  font-size: 32rpx;
  color: #C49A8D;
  font-weight: 300;
}

.logout-section {
  margin-top: 48rpx;
  margin-bottom: 24rpx;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #ffffff 0%, #F8F2F0 100%);
  color: #9A3412;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 24rpx;
  border: 2rpx solid #E8D4CD;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.logout-btn:active {
  background: #F2E6E2;
}

.logout-icon {
  font-size: 32rpx;
}

.version-info {
  text-align: center;
  padding: 24rpx 0;
}

.version-info text {
  font-size: 24rpx;
  color: #9CA3AF;
}
</style>
