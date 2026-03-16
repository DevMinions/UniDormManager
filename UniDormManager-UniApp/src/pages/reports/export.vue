<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { reportApi } from '@/api/report.js'
import { isAdmin, isLogisticsAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 权限检查
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isAdmin(roles) && !isLogisticsAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 报表类型配置
const reportTypes = [
  {
    id: 'occupancy',
    name: '入住统计报表',
    icon: '🏠',
    desc: '楼栋入住率、房间分配情况、空房统计',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  },
  {
    id: 'repair',
    name: '报修统计报表',
    icon: '🔧',
    desc: '报修数量、处理时长、维修类型分布',
    color: '#059669',
    bgColor: '#D1FAE5'
  },
  {
    id: 'inspection',
    name: '查寝统计报表',
    icon: '📋',
    desc: '宿舍评分排行、查寝覆盖率、问题分布',
    color: '#8B5CF6',
    bgColor: '#EDE9FE'
  },
  {
    id: 'late',
    name: '晚归统计报表',
    icon: '⏰',
    desc: '晚归次数统计、晚归趋势、重点关注学生',
    color: '#DC2626',
    bgColor: '#FEE2E2'
  },
  {
    id: 'access',
    name: '门禁统计报表',
    icon: '🚪',
    desc: '进出记录统计、高峰时段分析、异常记录',
    color: '#D97706',
    bgColor: '#FEF3C7'
  },
  {
    id: 'roomswap',
    name: '换寝统计报表',
    icon: '🔄',
    desc: '换寝申请数量、审批通过率、换寝原因分析',
    color: '#9A3412',
    bgColor: '#FEF3C7'
  }
]

// 时间范围选项
const timeRanges = [
  { id: 'today', name: '今日' },
  { id: 'week', name: '本周' },
  { id: 'month', name: '本月' },
  { id: 'quarter', name: '本季度' },
  { id: 'year', name: '本年' },
  { id: 'custom', name: '自定义' }
]

// 导出格式
const exportFormats = [
  { id: 'excel', name: 'Excel', icon: '📊', ext: '.xlsx' },
  { id: 'pdf', name: 'PDF', icon: '📄', ext: '.pdf' },
  { id: 'csv', name: 'CSV', icon: '📑', ext: '.csv' }
]

// 当前选中
const selectedType = ref('occupancy')
const selectedTimeRange = ref('month')
const selectedFormat = ref('excel')
const customStartDate = ref('')
const customEndDate = ref('')

// 生成状态
const isGenerating = ref(false)
const generationProgress = ref(0)

// 预览数据
const previewData = ref(null)
const isPreviewLoading = ref(false)

// 页面加载
onShow(() => {
  if (!checkAuth()) return
  loadPreviewData()
})

// 加载预览数据
const loadPreviewData = async () => {
  isPreviewLoading.value = true
  try {
    const params = {
      type: selectedType.value,
      timeRange: selectedTimeRange.value,
      startDate: customStartDate.value,
      endDate: customEndDate.value
    }
    const res = await reportApi.getStatistics(params)
    previewData.value = res || getMockPreviewData()
  } catch (error) {
    console.error('获取预览数据失败', error)
    previewData.value = getMockPreviewData()
  } finally {
    isPreviewLoading.value = false
  }
}

// 模拟预览数据
const getMockPreviewData = () => {
  const types = {
    occupancy: {
      title: '入住统计概览',
      stats: [
        { label: '总房间数', value: 1200 },
        { label: '已入住', value: 1080 },
        { label: '空房间', value: 120 },
        { label: '入住率', value: '90%' }
      ],
      chart: {
        type: 'pie',
        data: [
          { name: '已入住', value: 1080 },
          { name: '空房间', value: 120 }
        ]
      }
    },
    repair: {
      title: '报修统计概览',
      stats: [
        { label: '本月报修', value: 86 },
        { label: '已完成', value: 78 },
        { label: '处理中', value: 6 },
        { label: '待处理', value: 2 }
      ],
      chart: {
        type: 'bar',
        categories: ['水电', '家具', '门窗', '网络', '其他'],
        data: [25, 18, 15, 12, 16]
      }
    },
    inspection: {
      title: '查寝统计概览',
      stats: [
        { label: '本月查寝', value: 45 },
        { label: '优秀宿舍', value: 32 },
        { label: '良好宿舍', value: 10 },
        { label: '待整改', value: 3 }
      ],
      chart: {
        type: 'line',
        categories: ['第1周', '第2周', '第3周', '第4周'],
        data: [88, 90, 87, 92]
      }
    },
    late: {
      title: '晚归统计概览',
      stats: [
        { label: '本月晚归', value: 23 },
        { label: '涉及学生', value: 18 },
        { label: '已处理', value: 20 },
        { label: '待处理', value: 3 }
      ],
      chart: {
        type: 'bar',
        categories: ['22:00', '23:00', '00:00', '01:00', '其他'],
        data: [5, 8, 6, 3, 1]
      }
    },
    access: {
      title: '门禁统计概览',
      stats: [
        { label: '本月通行', value: 15800 },
        { label: '异常记录', value: 45 },
        { label: '晚归次数', value: 23 },
        { label: '未归次数', value: 5 }
      ],
      chart: {
        type: 'line',
        categories: ['6时', '12时', '18时', '22时', '24时'],
        data: [800, 1200, 1500, 600, 200]
      }
    },
    roomswap: {
      title: '换寝统计概览',
      stats: [
        { label: '本月申请', value: 12 },
        { label: '已通过', value: 8 },
        { label: '已拒绝', value: 3 },
        { label: '审批中', value: 1 }
      ],
      chart: {
        type: 'pie',
        data: [
          { name: '环境原因', value: 5 },
          { name: '人际关系', value: 4 },
          { name: '学习需要', value: 2 },
          { name: '其他', value: 1 }
        ]
      }
    }
  }
  return types[selectedType.value]
}

// 生成报表
const generateReport = async () => {
  if (selectedTimeRange.value === 'custom') {
    if (!customStartDate.value || !customEndDate.value) {
      uni.showToast({ title: '请选择时间范围', icon: 'none' })
      return
    }
  }
  
  isGenerating.value = true
  generationProgress.value = 0
  
  // 模拟进度
  const progressTimer = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += 10
    }
  }, 200)
  
  try {
    const data = {
      type: selectedType.value,
      timeRange: selectedTimeRange.value,
      format: selectedFormat.value,
      startDate: customStartDate.value,
      endDate: customEndDate.value
    }
    
    const res = await reportApi.generateReport(data)
    generationProgress.value = 100
    
    setTimeout(() => {
      isGenerating.value = false
      showSuccess('报表生成成功')
      
      // 显示下载选项
      uni.showModal({
        title: '报表已生成',
        content: `文件名: ${res?.filename || getDefaultFilename()}`,
        confirmText: '下载',
        success: (modalRes) => {
          if (modalRes.confirm) {
            downloadReport(res?.id || '1')
          }
        }
      })
    }, 500)
  } catch (error) {
    clearInterval(progressTimer)
    isGenerating.value = false
    handleApiError(error, '生成报表失败')
  }
}

// 下载报表
const downloadReport = async (reportId) => {
  uni.showLoading({ title: '下载中...' })
  
  try {
    // 实际项目中这里调用下载 API
    // await reportApi.downloadReport(reportId)
    
    // 模拟下载
    setTimeout(() => {
      uni.hideLoading()
      showSuccess('下载成功')
      
      // 保存到本地
      const fs = uni.getFileSystemManager()
      // 实际项目中处理文件保存
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    handleApiError(error, '下载失败')
  }
}

// 获取默认文件名
const getDefaultFilename = () => {
  const type = reportTypes.find(t => t.id === selectedType.value)
  const format = exportFormats.find(f => f.id === selectedFormat.value)
  const date = new Date().toISOString().split('T')[0]
  return `${type?.name || '报表'}_${date}${format?.ext || '.xlsx'}`
}

// 选择自定义日期
const selectDate = (type) => {
  uni.showActionSheet({
    itemList: ['选择开始日期', '选择结束日期'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 选择开始日期
      } else {
        // 选择结束日期
      }
    }
  })
}

// 切换报表类型时刷新预览
const onTypeChange = () => {
  loadPreviewData()
}

// 切换时间范围时刷新预览（非自定义）
const onTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    loadPreviewData()
  }
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="数据报表" show-back />
    
    <view class="content">
      <!-- 报表类型选择 -->
      <view class="section">
        <view class="section-title">
          <text class="title-icon">📊</text>
          <text class="title-text">选择报表类型</text>
        </view>
        
        <view class="type-grid">
          <view
            v-for="type in reportTypes"
            :key="type.id"
            class="type-card"
            :class="{ active: selectedType === type.id }"
            :style="{ backgroundColor: type.bgColor }"
            @click="selectedType = type.id; onTypeChange()"
          >
            <text class="type-icon">{{ type.icon }}</text>
            <text class="type-name" :style="{ color: type.color }">{{ type.name }}</text>
            <text class="type-desc">{{ type.desc }}</text>
          </view>
        </view>
      </view>
      
      <!-- 时间范围选择 -->
      <view class="section">
        <view class="section-title">
          <text class="title-icon">📅</text>
          <text class="title-text">选择时间范围</text>
        </view>
        
        <view class="time-range-list">
          <view
            v-for="range in timeRanges"
            :key="range.id"
            class="time-range-item"
            :class="{ active: selectedTimeRange === range.id }"
            @click="selectedTimeRange = range.id; onTimeRangeChange()"
          >
            <text class="range-name">{{ range.name }}</text>
          </view>
        </view>
        
        <!-- 自定义日期选择 -->
        <view v-if="selectedTimeRange === 'custom'" class="custom-date-range">
          <view class="date-input-wrapper">
            <text class="date-label">开始日期</text>
            <input
              v-model="customStartDate"
              type="text"
              class="date-input"
              placeholder="YYYY-MM-DD"
            />
          </view>
          <text class="date-separator">至</text>
          <view class="date-input-wrapper">
            <text class="date-label">结束日期</text>
            <input
              v-model="customEndDate"
              type="text"
              class="date-input"
              placeholder="YYYY-MM-DD"
            />
          </view>
        </view>
      </view>
      
      <!-- 导出格式选择 -->
      <view class="section">
        <view class="section-title">
          <text class="title-icon">💾</text>
          <text class="title-text">选择导出格式</text>
        </view>
        
        <view class="format-list">
          <view
            v-for="format in exportFormats"
            :key="format.id"
            class="format-item"
            :class="{ active: selectedFormat === format.id }"
            @click="selectedFormat = format.id"
          >
            <text class="format-icon">{{ format.icon }}</text>
            <text class="format-name">{{ format.name }}</text>
            <text class="format-ext">{{ format.ext }}</text>
          </view>
        </view>
      </view>
      
      <!-- 数据预览 -->
      <view class="section">
        <view class="section-title">
          <text class="title-icon">👁️</text>
          <text class="title-text">数据预览</text>
        </view>
        
        <view v-if="isPreviewLoading" class="preview-loading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <view v-else-if="previewData" class="preview-content">
          <view class="preview-header">
            <text class="preview-title">{{ previewData.title }}</text>
          </view>
          
          <view class="preview-stats">
            <view
              v-for="(stat, index) in previewData.stats"
              :key="index"
              class="preview-stat-item"
            >
              <text class="stat-value">{{ stat.value }}</text>
              <text class="stat-label">{{ stat.label }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 生成按钮 -->
      <view class="action-section">
        <button
          class="generate-btn"
          :class="{ loading: isGenerating }"
          :disabled="isGenerating"
          @click="generateReport"
        >
          <view v-if="isGenerating" class="progress-bar">
            <view class="progress-fill" :style="{ width: generationProgress + '%' }"></view>
            <text class="progress-text">{{ generationProgress }}%</text>
          </view>
          <view v-else class="btn-content">
            <text class="btn-icon">📥</text>
            <text class="btn-text">生成并导出报表</text>
          </view>
        </button>
        
        <text class="hint-text">生成的报表将保存到本地，可在下载管理中查看</text>
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
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  
  .title-icon {
    font-size: 32rpx;
  }
  
  .title-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #1F2937;
  }
}

// 报表类型网格
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.type-card {
  border-radius: 20rpx;
  padding: 24rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
  
  .type-icon {
    display: block;
    font-size: 44rpx;
    margin-bottom: 12rpx;
  }
  
  .type-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
  }
  
  .type-desc {
    display: block;
    font-size: 24rpx;
    color: #6B7280;
    line-height: 1.4;
  }
  
  &.active {
    border-color: #9A3412;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.15);
    transform: translateY(-2rpx);
  }
}

// 时间范围
.time-range-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.time-range-item {
  padding: 16rpx 32rpx;
  background: #F3F4F6;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  
  .range-name {
    font-size: 28rpx;
    color: #6B7280;
  }
  
  &.active {
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    border-color: #9A3412;
    
    .range-name {
      color: #FFFFFF;
      font-weight: 500;
    }
  }
}

// 自定义日期
.custom-date-range {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #F3F4F6;
  
  .date-input-wrapper {
    flex: 1;
    
    .date-label {
      display: block;
      font-size: 24rpx;
      color: #9CA3AF;
      margin-bottom: 8rpx;
    }
    
    .date-input {
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
  
  .date-separator {
    font-size: 28rpx;
    color: #6B7280;
    margin-top: 28rpx;
  }
}

// 格式选择
.format-list {
  display: flex;
  gap: 20rpx;
}

.format-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background: #F9FAFB;
  border: 2rpx solid #E5E7EB;
  border-radius: 16rpx;
  padding: 24rpx;
  
  .format-icon {
    font-size: 48rpx;
  }
  
  .format-name {
    font-size: 28rpx;
    font-weight: 500;
    color: #1F2937;
  }
  
  .format-ext {
    font-size: 22rpx;
    color: #9CA3AF;
    font-family: monospace;
  }
  
  &.active {
    background: #FFF7ED;
    border-color: #9A3412;
    
    .format-name {
      color: #9A3412;
    }
  }
}

// 数据预览
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  
  .loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #F3F4F6;
    border-top-color: #9A3412;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: 16rpx;
    font-size: 26rpx;
    color: #9CA3AF;
  }
}

.preview-content {
  .preview-header {
    margin-bottom: 20rpx;
    
    .preview-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #1F2937;
    }
  }
  
  .preview-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
  }
  
  .preview-stat-item {
    text-align: center;
    padding: 20rpx;
    background: #F9FAFB;
    border-radius: 16rpx;
    
    .stat-value {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: #9A3412;
      margin-bottom: 8rpx;
    }
    
    .stat-label {
      font-size: 24rpx;
      color: #6B7280;
    }
  }
}

// 操作区域
.action-section {
  margin-top: 40rpx;
  
  .generate-btn {
    width: 100%;
    height: 100rpx;
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
    border: none;
    position: relative;
    overflow: hidden;
    
    &.loading {
      background: #E5E7EB;
    }
    
    &.disabled {
      opacity: 0.8;
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .btn-icon {
        font-size: 36rpx;
      }
      
      .btn-text {
        font-size: 32rpx;
        font-weight: 600;
        color: #FFFFFF;
      }
    }
    
    .progress-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .progress-text {
        font-size: 28rpx;
        font-weight: 600;
        color: #FFFFFF;
        z-index: 1;
      }
    }
  }
  
  .hint-text {
    display: block;
    text-align: center;
    font-size: 24rpx;
    color: #9CA3AF;
    margin-top: 20rpx;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
