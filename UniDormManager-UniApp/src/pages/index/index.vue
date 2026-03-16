<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { noticeApi } from '@/api/notice.js'
import { repairApi } from '@/api/repair.js'
import { roomApi } from '@/api/room.js'
import { 
  getRoleConfig, 
  getRoleQuickMenu, 
  getRoleStats,
  isAdmin,
  isDormStaff 
} from '@/config/roles.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'
import WelcomeCard from '@/components/WelcomeCard/WelcomeCard.vue'
import StatCard from '@/components/StatCard/StatCard.vue'
import MenuGrid from '@/components/MenuGrid/MenuGrid.vue'

import CustomTabBar from '@/components/CustomTabBar/CustomTabBar.vue'

const userStore = useUserStore()
const appStore = useAppStore()

// 加载状态
const loading = ref(false)

// 用户角色
const userRoles = computed(() => {
  const roles = userStore.userInfo?.roles || []
  return roles.map(r => typeof r === 'string' ? r : r.code)
})

const primaryRole = computed(() => userRoles.value[0] || 'student')
const roleConfig = computed(() => getRoleConfig(primaryRole.value))

// 动态菜单和统计
const quickMenu = computed(() => getRoleQuickMenu(primaryRole.value))
const statsConfig = computed(() => getRoleStats(primaryRole.value))

// 统计数据
const statsData = ref({})
const notices = ref([])

// 计算属性
const userName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '同学')

// 动态问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  const roleName = roleConfig.value.name
  
  if (hour < 6) return { text: '夜深了', emoji: '🌙', sub: '注意休息' }
  if (hour < 9) return { text: `早上好，${roleName}`, emoji: '🌅', sub: '新的一天' }
  if (hour < 12) return { text: `上午好，${roleName}`, emoji: '☀️', sub: '工作顺利' }
  if (hour < 14) return { text: `中午好，${roleName}`, emoji: '🍜', sub: '记得休息' }
  if (hour < 18) return { text: `下午好，${roleName}`, emoji: '🌤️', sub: '继续加油' }
  return { text: `晚上好，${roleName}`, emoji: '🌆', sub: '放松时刻' }
}

// 检查登录状态
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

// 获取首页数据
const fetchHomeData = async () => {
  try {
    loading.value = true
    
    // 根据角色获取不同数据
    const promises = []
    
    // 所有角色都获取公告
    promises.push(
      noticeApi.getNoticeList({ limit: 3 }).then(data => {
        notices.value = (data || []).slice(0, 3).map(item => ({
          id: item.id,
          title: item.title,
          time: item.publishTime || item.createdAt,
          icon: getNoticeIcon(item.type),
          isNew: isNewNotice(item.publishTime || item.createdAt),
          type: item.type
        }))
        statsData.value.unreadNotices = notices.value.filter(n => n.isNew).length
      }).catch(() => {})
    )
    
    // 根据角色获取特定数据
    if (primaryRole.value === 'student') {
      promises.push(fetchStudentData())
    } else if (['dorm_manager', 'building_manager'].includes(primaryRole.value)) {
      promises.push(fetchManagerData())
    } else if (primaryRole.value === 'maintenance_staff') {
      promises.push(fetchMaintenanceData())
    } else if (['logistics_admin', 'system_admin'].includes(primaryRole.value)) {
      promises.push(fetchAdminData())
    }
    
    await Promise.allSettled(promises)
    
  } catch (error) {
    console.error('获取首页数据失败:', error)
    useMockData()
  } finally {
    loading.value = false
  }
}

// 学生数据
const fetchStudentData = async () => {
  try {
    const [repairRes, roomRes] = await Promise.allSettled([
      repairApi.getRepairList(),
      roomApi.getRoomList()
    ])
    
    if (repairRes.status === 'fulfilled') {
      const repairs = repairRes.value || []
      statsData.value.pendingRepairs = repairs.filter(r => r.status === 'pending').length
    }
    
    if (roomRes.status === 'fulfilled') {
      const rooms = roomRes.value || []
      const myRoom = rooms[0] || {}
      statsData.value.roomNumber = myRoom.roomNumber || myRoom.number || '-'
      statsData.value.roomScore = myRoom.score || myRoom.rating || '-'
    }
  } catch (e) {
    console.error('获取学生数据失败:', e)
  }
}

// 管理员数据
const fetchManagerData = async () => {
  try {
    const [repairRes, roomRes, studentRes] = await Promise.allSettled([
      repairApi.getRepairList(),
      roomApi.getRoomList(),
      roomApi.getStudentList()
    ])
    
    if (repairRes.status === 'fulfilled') {
      const repairs = repairRes.value || []
      statsData.value.pendingRepairs = repairs.filter(r => r.status === 'pending').length
      statsData.value.urgentIssues = repairs.filter(r => r.priority === 'urgent').length
    }
    
    if (roomRes.status === 'fulfilled') {
      statsData.value.totalRooms = (roomRes.value || []).length
    }
    
    if (studentRes.status === 'fulfilled') {
      statsData.value.totalStudents = (studentRes.value || []).length
    }
  } catch (e) {
    console.error('获取管理员数据失败:', e)
  }
}

// 维修人员数据
const fetchMaintenanceData = async () => {
  try {
    const repairRes = await repairApi.getRepairList()
    const repairs = repairRes || []
    
    statsData.value.pendingTasks = repairs.filter(r => r.status === 'pending').length
    statsData.value.processingTasks = repairs.filter(r => r.status === 'processing').length
    statsData.value.completedToday = repairs.filter(r => {
      if (r.status !== 'completed') return false
      const today = new Date().toDateString()
      const completedDate = new Date(r.completedAt || r.updatedAt).toDateString()
      return today === completedDate
    }).length
    statsData.value.weeklyTotal = repairs.length
  } catch (e) {
    console.error('获取维修数据失败:', e)
  }
}

// 后勤/系统管理员数据
const fetchAdminData = async () => {
  try {
    const [repairRes, roomRes, buildingRes] = await Promise.allSettled([
      repairApi.getRepairList(),
      roomApi.getAllRooms(),
      roomApi.getBuildingList()
    ])
    
    if (repairRes.status === 'fulfilled') {
      const repairs = repairRes.value || []
      const thisMonth = new Date().getMonth()
      statsData.value.monthlyRepairs = repairs.filter(r => {
        const repairMonth = new Date(r.createdAt).getMonth()
        return repairMonth === thisMonth
      }).length
    }
    
    if (roomRes.status === 'fulfilled') {
      statsData.value.totalRooms = (roomRes.value || []).length
    }
    
    if (buildingRes.status === 'fulfilled') {
      statsData.value.totalBuildings = (buildingRes.value || []).length
    }
  } catch (e) {
    console.error('获取管理员数据失败:', e)
  }
}

// 获取公告图标
const getNoticeIcon = (type) => {
  const iconMap = {
    notification: '📢',
    activity: '🎉',
    repair: '🔧',
    safety: '🛡️',
    important: '🔔'
  }
  return iconMap[type] || '📋'
}

// 判断是否是新公告
const isNewNotice = (time) => {
  if (!time) return false
  const noticeTime = new Date(time).getTime()
  const now = Date.now()
  const diff = now - noticeTime
  return diff < 24 * 60 * 60 * 1000 // 24小时内
}

// 生成统计数据
const generateStats = () => {
  return statsConfig.value.map(config => ({
    icon: config.icon,
    value: statsData.value[config.key] || '-',
    label: config.label,
    variant: config.variant
  }))
}

// 使用模拟数据
const useMockData = () => {
  if (primaryRole.value === 'student') {
    statsData.value = {
      roomNumber: '3-205',
      pendingRepairs: 2,
      unreadNotices: 3,
      roomScore: 98
    }
  } else if (['dorm_manager', 'building_manager'].includes(primaryRole.value)) {
    statsData.value = {
      pendingRepairs: 12,
      totalRooms: 120,
      totalStudents: 450,
      urgentIssues: 3
    }
  } else if (primaryRole.value === 'maintenance_staff') {
    statsData.value = {
      pendingTasks: 5,
      processingTasks: 3,
      completedToday: 8,
      weeklyTotal: 45
    }
  } else {
    statsData.value = {
      totalBuildings: 8,
      totalStudents: 3200,
      monthlyRepairs: 156,
      totalRooms: 1200
    }
  }
  
  notices.value = [
    { id: 1, title: '关于期末宿舍检查的通知', time: '2024-12-20', icon: '📢', isNew: true, type: 'notification' },
    { id: 2, title: '暖气供应调整通知', time: '2024-12-19', icon: '🔥', isNew: false, type: 'repair' }
  ]
}

// 刷新数据
const refreshData = async () => {
  await fetchHomeData()
}

// 处理公告点击
const handleNoticeClick = (notice) => {
  uni.navigateTo({
    url: `/pages/notices/detail?id=${notice.id}`
  })
}

// 生命周期
onShow(() => {
  if (!checkAuth()) return
  fetchHomeData()
})

onPullDownRefresh(() => {
  refreshData().finally(() => {
    uni.stopPullDownRefresh()
  })
})

onMounted(() => {
  if (!checkAuth()) return
  fetchHomeData()
})
</script>

<template>
  <view class="page-container">
    <!-- 背景装饰 -->
    <view class="page-bg">
      <view class="bg-blob blob-1" :style="{ background: roleConfig.color }"></view>
      <view class="bg-blob blob-2"></view>
    </view>
    
    <!-- 导航栏 -->
    <AppNavbar :title="getGreeting().text" show-back="false" />
    
    <view class="content">
      <!-- 欢迎卡片 -->
      <WelcomeCard 
        :name="userName" 
        :role="roleConfig.name" 
        :decoration="roleConfig.icon"
      />
      
      <!-- 统计卡片 -->
      <view class="stats-section">
        <view class="section-header">
          <view 
            class="header-icon" 
            :style="{ background: roleConfig.bgColor }"
          >
            <text>📊</text>
          </view>
          <text class="section-title">数据概览</text>
        </view>
        
        <view class="stats-grid">
          <StatCard
            v-for="(stat, index) in generateStats()"
            :key="index"
            :icon="stat.icon"
            :value="String(stat.value)"
            :label="stat.label"
            :variant="stat.variant"
            :delay="index * 100"
          />
        </view>
      </view>
      
      <!-- 快捷功能 -->
      <view class="section">
        <view class="section-header">
          <view 
            class="header-icon" 
            :style="{ background: roleConfig.bgColor }"
          >
            <text>⚡</text>
          </view>
          <text class="section-title">快捷功能</text>
        </view>
        
        <MenuGrid :items="quickMenu" />
      </view>
      
      <!-- 最新公告 -->
      <view class="section">
        <view class="section-header">
          <view 
            class="header-icon" 
            :style="{ background: '#FEF3C7' }"
          >
            <text>📢</text>
          </view>
          <text class="section-title">最新公告</text>
          <text 
            class="view-more" 
            @click="uni.navigateTo({ url: '/pages/notices/list' })"
          >
            查看更多 ›
          </text>
        </view>
        
        <view class="notice-list">
          <view 
            v-for="(notice, index) in notices" 
            :key="notice.id"
            class="notice-item"
            :style="{ animationDelay: `${index * 80}ms` }"
            @click="handleNoticeClick(notice)"
          >
            <view class="notice-icon">{{ notice.icon }}</view>
            <view class="notice-content">
              <view class="notice-title-row">
                <text class="notice-title">{{ notice.title }}</text>
                <view v-if="notice.isNew" class="new-badge">新</view>
              </view>
              <text class="notice-time">{{ notice.time }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部装饰 -->
      <view class="footer-decoration">
        <text class="footer-text">{{ roleConfig.icon }} {{ roleConfig.description }}</text>
      </view>
    </view>
    
    <!-- 底部 TabBar -->
    <CustomTabBar />
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
  overflow: hidden;
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
  width: 250rpx;
  height: 250rpx;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(16, 185, 129, 0.2));
  bottom: 200rpx;
  left: -60rpx;
}

.content {
  position: relative;
  z-index: 1;
  padding: 16rpx 24rpx;
  padding-bottom: 160rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.header-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  flex: 1;
}

.view-more {
  font-size: 26rpx;
  color: #9A3412;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
}

.view-more:active {
  background: #F8F2F0;
}

.stats-section {
  margin-bottom: 32rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.section {
  margin-bottom: 32rpx;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20rpx); }
  100% { opacity: 1; transform: translateY(0); }
}

.notice-item:active {
  background: #F8F2F0;
}

.notice-icon {
  width: 72rpx;
  height: 72rpx;
  background: #FEF3C7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.notice-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #1E293B;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-badge {
  background: #DC2626;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.notice-time {
  font-size: 24rpx;
  color: #9CA3AF;
}

.footer-decoration {
  display: flex;
  justify-content: center;
  padding: 40rpx 0 20rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #64748B;
  background: rgba(255, 255, 255, 0.7);
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  backdrop-filter: blur(8rpx);
}
</style>
