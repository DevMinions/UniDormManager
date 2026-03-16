<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { isAdmin, isLogisticsAdmin } from '@/config/roles.js'
import { dataTransferApi } from '@/api/dataTransfer.js'
import { handleApiError, showSuccess, formatFileSize } from '@/utils/index.js'
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

// 当前标签页
const activeTab = ref('import') // import/export/history

// 导入类型
const importTypes = [
  { id: 'students', name: '学生信息', icon: '👨‍🎓', template: 'students_template.xlsx' },
  { id: 'rooms', name: '房间信息', icon: '🏠', template: 'rooms_template.xlsx' },
  { id: 'buildings', name: '楼栋信息', icon: '🏢', template: 'buildings_template.xlsx' },
  { id: 'staff', name: '员工信息', icon: '👷', template: 'staff_template.xlsx' }
]

// 当前选择的导入类型
const selectedImportType = ref('students')

// 导出类型
const exportTypes = [
  { id: 'students', name: '学生信息', desc: '包含基本信息、住宿情况等' },
  { id: 'repairs', name: '报修记录', desc: '包含报修详情、处理记录等' },
  { id: 'inspections', name: '查寝记录', desc: '包含评分、问题记录等' },
  { id: 'late_returns', name: '晚归记录', desc: '包含晚归告警、处理情况等' },
  { id: 'room_swaps', name: '换寝申请', desc: '包含申请记录、审批情况等' },
  { id: 'access_logs', name: '门禁记录', desc: '包含进出记录、异常情况等' }
]

// 导出设置
const exportSettings = ref({
  type: 'students',
  format: 'xlsx',
  timeRange: 'all', // all/month/quarter/year/custom
  startDate: '',
  endDate: '',
  includeDeleted: false
})

// 文件上传相关
const uploadStatus = ref('idle') // idle/uploading/preview/confirming/processing/done/error
const uploadProgress = ref(0)
const uploadedFile = ref(null)
const previewData = ref(null)
const previewStats = ref({
  total: 0,
  valid: 0,
  invalid: 0,
  warnings: 0
})

// 导入历史
const importHistory = ref([])
const exportHistory = ref([])

// 页面加载
onShow(() => {
  if (!checkAuth()) return
  loadHistory()
})

// 加载历史记录
const loadHistory = async () => {
  try {
    // const [importRes, exportRes] = await Promise.all([
    //   dataTransferApi.getImportHistory(),
    //   dataTransferApi.getExportHistory()
    // ])
    // importHistory.value = importRes || []
    // exportHistory.value = exportRes || []
    
    // 模拟数据
    importHistory.value = [
      { id: 1, type: 'students', fileName: 'students_2024.xlsx', status: 'success', count: 150, time: '2024-03-15 10:00' },
      { id: 2, type: 'rooms', fileName: 'rooms_update.xlsx', status: 'partial', count: 45, time: '2024-03-14 15:30' }
    ]
    exportHistory.value = [
      { id: 1, type: 'students', format: 'xlsx', fileName: 'students_export.xlsx', size: '2.5MB', time: '2024-03-15 09:00' },
      { id: 2, type: 'repairs', format: 'csv', fileName: 'repairs_2024.csv', size: '1.2MB', time: '2024-03-14 16:00' }
    ]
  } catch (error) {
    handleApiError(error, '加载历史记录失败')
  }
}

// 选择文件
const chooseFile = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.xlsx', '.xls', '.csv'],
    success: (res) => {
      const file = res.tempFiles[0]
      uploadedFile.value = file
      uploadStatus.value = 'preview'
      // 模拟预览数据
      generatePreviewData()
    },
    fail: () => {
      uni.showToast({ title: '选择文件失败', icon: 'none' })
    }
  })
}

// 生成预览数据（模拟）
const generatePreviewData = () => {
  const type = selectedImportType.value
  let data = []
  let stats = { total: 10, valid: 8, invalid: 1, warnings: 1 }
  
  if (type === 'students') {
    data = [
      { row: 1, name: '张三', studentId: '2024001', major: '计算机', grade: '2024', status: 'valid' },
      { row: 2, name: '李四', studentId: '2024002', major: '电子', grade: '2024', status: 'valid' },
      { row: 3, name: '王五', studentId: '2024001', major: '计算机', grade: '2024', status: 'error', message: '学号重复' },
      { row: 4, name: '赵六', studentId: '2024004', major: '', grade: '2024', status: 'warning', message: '专业为空' }
    ]
  } else if (type === 'rooms') {
    data = [
      { row: 1, building: 'A栋', roomNumber: '101', capacity: 4, status: 'valid' },
      { row: 2, building: 'A栋', roomNumber: '102', capacity: 4, status: 'valid' }
    ]
  }
  
  previewData.value = data
  previewStats.value = stats
}

// 下载模板
const downloadTemplate = async (type) => {
  try {
    const templateInfo = importTypes.find(t => t.id === type)
    uni.showLoading({ title: '下载中...' })
    
    // 实际项目中调用 API
    // await dataTransferApi.downloadTemplate(type)
    
    setTimeout(() => {
      uni.hideLoading()
      showSuccess('模板下载成功')
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    handleApiError(error, '下载失败')
  }
}

// 确认导入
const confirmImport = async () => {
  if (previewStats.value.invalid > 0) {
    uni.showModal({
      title: '存在错误数据',
      content: `有 ${previewStats.value.invalid} 条数据格式错误，是否跳过这些记录继续导入？`,
      success: (res) => {
        if (res.confirm) {
          doImport()
        }
      }
    })
  } else {
    doImport()
  }
}

// 执行导入
const doImport = async () => {
  uploadStatus.value = 'processing'
  uploadProgress.value = 0
  
  // 模拟进度
  const timer = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(timer)
      uploadStatus.value = 'done'
      showSuccess(`成功导入 ${previewStats.value.valid} 条数据`)
    }
  }, 200)
}

// 取消导入
const cancelImport = () => {
  uploadStatus.value = 'idle'
  uploadedFile.value = null
  previewData.value = null
  uploadProgress.value = 0
}

// 执行导出
const doExport = async () => {
  try {
    uni.showLoading({ title: '导出中...' })
    
    // 实际项目中调用 API
    // const res = await dataTransferApi.exportData(
    //   exportSettings.value.type,
    //   {
    //     timeRange: exportSettings.value.timeRange,
    //     startDate: exportSettings.value.startDate,
    //     endDate: exportSettings.value.endDate
    //   },
    //   exportSettings.value.format
    // )
    
    setTimeout(() => {
      uni.hideLoading()
      showSuccess('导出成功')
      loadHistory()
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    handleApiError(error, '导出失败')
  }
}

// 下载历史文件
const downloadHistoryFile = (item) => {
  uni.showLoading({ title: '下载中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    showSuccess('下载成功')
  }, 1000)
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    success: '成功',
    partial: '部分成功',
    error: '失败',
    processing: '处理中'
  }
  return texts[status] || status
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colors = {
    success: '#059669',
    partial: '#F59E0B',
    error: '#DC2626',
    processing: '#3B82F6'
  }
  return colors[status] || '#6B7280'
}

// 获取导入类型名称
const getImportTypeName = (type) => {
  const item = importTypes.find(t => t.id === type)
  return item?.name || type
}

// 获取导出类型名称
const getExportTypeName = (type) => {
  const item = exportTypes.find(t => t.id === type)
  return item?.name || type
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="数据导入导出" show-back />
    
    <view class="content">
      <!-- 标签切换 -->
      <view class="tab-bar">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'import' }"
          @click="activeTab = 'import'"
        >
          <text class="tab-icon">📥</text>
          <text class="tab-label">数据导入</text>
        </view>
        
        <view
          class="tab-item"
          :class="{ active: activeTab === 'export' }"
          @click="activeTab = 'export'"
        >
          <text class="tab-icon">📤</text>
          <text class="tab-label">数据导出</text>
        </view>
        
        <view
          class="tab-item"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <text class="tab-icon">📋</text>
          <text class="tab-label">历史记录</text>
        </view>
      </view>
      
      <!-- 数据导入 -->
      <view v-if="activeTab === 'import'" class="tab-content">
        <!-- 选择导入类型 -->
        <view v-if="uploadStatus === 'idle'" class="import-section">
          <view class="section-title">选择导入类型</view>
          
          <view class="type-grid">
            <view
              v-for="type in importTypes"
              :key="type.id"
              class="type-card"
              :class="{ active: selectedImportType === type.id }"
              @click="selectedImportType = type.id"
            >
              <text class="type-icon">{{ type.icon }}</text>
              <text class="type-name">{{ type.name }}</text>
            </view>
          </view>
          
          <view class="template-section">
            <text class="template-title">📄 下载模板文件</text>
            <text class="template-desc">请使用标准模板格式，确保数据能正确导入</text>
            
            <button
              class="template-btn"
              @click="downloadTemplate(selectedImportType)"
            >
              <text>下载 {{ getImportTypeName(selectedImportType) }}模板</text>
            </button>
          </view>
          
          <view class="upload-section">
            <text class="upload-title">📂 上传数据文件</text>
            <text class="upload-desc">支持 Excel (.xlsx, .xls) 或 CSV 格式，文件大小不超过 10MB</text>
            
            <view class="upload-area" @click="chooseFile">
              <text class="upload-icon">📤</text>
              <text class="upload-text">点击选择文件</text>
              <text class="upload-hint">或将文件拖拽到此处</text>
            </view>
          </view>
        </view>
        
        <!-- 文件预览 -->
        <view v-if="uploadStatus === 'preview' || uploadStatus === 'confirming'" class="preview-section">
          <view class="preview-header">
            <view class="file-info">
              <text class="file-name">{{ uploadedFile?.name }}</text>
              <text class="file-size">{{ formatFileSize(uploadedFile?.size) }}</text>
            </view>
            
            <view class="preview-stats">
              <view class="stat-item success">
                <text class="stat-value">{{ previewStats.valid }}</text>
                <text class="stat-label">有效</text>
              </view>
              
              <view class="stat-item error">
                <text class="stat-value">{{ previewStats.invalid }}</text>
                <text class="stat-label">错误</text>
              </view>
              
              <view class="stat-item warning">
                <text class="stat-value">{{ previewStats.warnings }}</text>
                <text class="stat-label">警告</text>
              </view>
            </view>
          </view>
          
          <view class="preview-table">
            <view class="table-header">
              <text class="th">行号</text>
              <text class="th">数据</text>
              <text class="th">状态</text>
            </view>
            
            <view
              v-for="row in previewData"
              :key="row.row"
              class="table-row"
              :class="row.status"
            >
              <text class="td row-num">{{ row.row }}</text>
              
              <view class="td data-preview">
                <text>{{ row.name || row.building + row.roomNumber }}</text>
                <text v-if="row.message" class="error-msg">{{ row.message }}</text>
              </view>
              
              <text class="td status" :class="row.status">
                {{ row.status === 'valid' ? '✓' : row.status === 'error' ? '✗' : '!' }}
              </text>
            </view>
          </view>
          
          <view class="preview-actions">
            <button class="secondary-btn" @click="cancelImport">重新选择</button>
            
            <button class="primary-btn" @click="confirmImport">确认导入</button>
          </view>
        </view>
        
        <!-- 导入进度 -->
        <view v-if="uploadStatus === 'processing' || uploadStatus === 'done'" class="progress-section">
          <view class="progress-status">
            <text class="status-icon">{{ uploadStatus === 'done' ? '✅' : '⏳' }}</text>
            <text class="status-text">
              {{ uploadStatus === 'done' ? '导入完成' : '正在导入数据...' }}
            </text>
          </view>
          
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
          </view>
          
          <text class="progress-percent">{{ uploadProgress }}%</text>
          
          <view v-if="uploadStatus === 'done'" class="progress-actions">
            <button class="primary-btn" @click="cancelImport">继续导入</button>
          </view>
        </view>
      </view>
      
      <!-- 数据导出 -->
      <view v-if="activeTab === 'export'" class="tab-content">
        <view class="export-section">
          <view class="section-title">选择导出类型</view>
          
          <view class="export-list">
            <view
              v-for="type in exportTypes"
              :key="type.id"
              class="export-item"
              :class="{ active: exportSettings.type === type.id }"
              @click="exportSettings.type = type.id"
            >
              <view class="export-info">
                <text class="export-name">{{ type.name }}</text>
                <text class="export-desc">{{ type.desc }}</text>
              </view>
              
              <view v-if="exportSettings.type === type.id" class="export-check">✓</view>
            </view>
          </view>
          
          <view class="section-title">导出设置</view>
          
          <view class="settings-card">
            <view class="setting-item">
              <text class="setting-label">文件格式</text>
              
              <view class="format-options">
                <view
                  v-for="fmt in ['xlsx', 'csv', 'pdf']"
                  :key="fmt"
                  class="format-btn"
                  :class="{ active: exportSettings.format === fmt }"
                  @click="exportSettings.format = fmt"
                >
                  <text>{{ fmt.toUpperCase() }}</text>
                </view>
              </view>
            </view>
            
            <view class="setting-item">
              <text class="setting-label">时间范围</text>
              
              <view class="time-options">
                <view
                  v-for="opt in [
                    { id: 'all', label: '全部' },
                    { id: 'month', label: '本月' },
                    { id: 'quarter', label: '本季度' },
                    { id: 'year', label: '本年' }
                  ]"
                  :key="opt.id"
                  class="time-btn"
                  :class="{ active: exportSettings.timeRange === opt.id }"
                  @click="exportSettings.timeRange = opt.id"
                >
                  <text>{{ opt.label }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <button class="export-btn" @click="doExport">
            <text class="btn-icon">📤</text>
            <text class="btn-text">开始导出</text>
          </button>
        </view>
      </view>
      
      <!-- 历史记录 -->
      <view v-if="activeTab === 'history'" class="tab-content">
        <view class="history-tabs">
          <view class="history-section">
            <view class="section-title">导入历史</text>
            
            <view v-if="importHistory.length === 0" class="empty-state">
              <text>暂无导入记录</text>
            </view>
            
            <view
              v-for="item in importHistory"
              :key="item.id"
              class="history-item"
            >
              <view class="history-icon import">📥</view>
              
              <view class="history-info">
                <text class="history-title">{{ getImportTypeName(item.type) }}</text>
                <text class="history-detail">{{ item.fileName }} · {{ item.count }}条</text>
                <text class="history-time">{{ item.time }}</text>
              </view>
              
              <view
                class="history-status"
                :style="{ color: getStatusColor(item.status) }"
              >
                {{ getStatusText(item.status) }}
              </view>
            </view>
          </view>
          
          <view class="history-section">
            <view class="section-title">导出历史</text>
            
            <view v-if="exportHistory.length === 0" class="empty-state">
              <text>暂无导出记录</text>
            </view>
            
            <view
              v-for="item in exportHistory"
              :key="item.id"
              class="history-item"
              @click="downloadHistoryFile(item)"
            >
              <view class="history-icon export">📤</view>
              
              <view class="history-info">
                <text class="history-title">{{ getExportTypeName(item.type) }}</text>
                <text class="history-detail">{{ item.fileName }} · {{ item.size }}</text>
                <text class="history-time">{{ item.time }}</text>
              </view>
              
              <view class="history-action">⬇️</view>
            </view>
          </view>
        </view>
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

// 标签栏
.tab-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  
  .tab-item {
    flex: 1;
    background: #FFFFFF;
    border-radius: 20rpx;
    padding: 24rpx;
    text-align: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    
    .tab-icon {
      display: block;
      font-size: 40rpx;
      margin-bottom: 12rpx;
    }
    
    .tab-label {
      font-size: 28rpx;
      color: #6B7280;
      font-weight: 500;
    }
    
    &.active {
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      
      .tab-label {
        color: #FFFFFF;
      }
    }
  }
}

// 区块标题
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 20rpx;
  margin-top: 32rpx;
  
  &:first-of-type {
    margin-top: 0;
  }
}

// 导入区块
.import-section,
.export-section {
  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    
    .type-card {
      background: #FFFFFF;
      border-radius: 20rpx;
      padding: 32rpx;
      text-align: center;
      border: 2rpx solid transparent;
      
      .type-icon {
        display: block;
        font-size: 48rpx;
        margin-bottom: 12rpx;
      }
      
      .type-name {
        font-size: 28rpx;
        color: #374151;
        font-weight: 500;
      }
      
      &.active {
        border-color: #9A3412;
        background: #FFF7ED;
        
        .type-name {
          color: #9A3412;
        }
      }
    }
  }
}

// 模板区块
.template-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-top: 24rpx;
  
  .template-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 8rpx;
  }
  
  .template-desc {
    display: block;
    font-size: 24rpx;
    color: #9CA3AF;
    margin-bottom: 20rpx;
  }
  
  .template-btn {
    background: #F3F4F6;
    border-radius: 12rpx;
    padding: 20rpx 32rpx;
    border: none;
    
    text {
      font-size: 28rpx;
      color: #374151;
      font-weight: 500;
    }
  }
}

// 上传区块
.upload-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-top: 24rpx;
  
  .upload-title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 8rpx;
  }
  
  .upload-desc {
    display: block;
    font-size: 24rpx;
    color: #9CA3AF;
    margin-bottom: 24rpx;
  }
  
  .upload-area {
    border: 2rpx dashed #D1D5DB;
    border-radius: 16rpx;
    padding: 60rpx;
    text-align: center;
    background: #F9FAFB;
    
    .upload-icon {
      display: block;
      font-size: 64rpx;
      margin-bottom: 16rpx;
    }
    
    .upload-text {
      display: block;
      font-size: 30rpx;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8rpx;
    }
    
    .upload-hint {
      font-size: 24rpx;
      color: #9CA3AF;
    }
  }
}

// 预览区块
.preview-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  
  .preview-header {
    margin-bottom: 24rpx;
    
    .file-info {
      margin-bottom: 20rpx;
      
      .file-name {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8rpx;
      }
      
      .file-size {
        font-size: 24rpx;
        color: #9CA3AF;
      }
    }
    
    .preview-stats {
      display: flex;
      gap: 20rpx;
      
      .stat-item {
        flex: 1;
        background: #F9FAFB;
        border-radius: 12rpx;
        padding: 16rpx;
        text-align: center;
        
        .stat-value {
          display: block;
          font-size: 36rpx;
          font-weight: 700;
          margin-bottom: 4rpx;
        }
        
        .stat-label {
          font-size: 24rpx;
          color: #6B7280;
        }
        
        &.success .stat-value { color: #059669; }
        &.error .stat-value { color: #DC2626; }
        &.warning .stat-value { color: #F59E0B; }
      }
    }
  }
  
  .preview-table {
    border: 2rpx solid #E5E7EB;
    border-radius: 12rpx;
    overflow: hidden;
    margin-bottom: 24rpx;
    
    .table-header {
      display: flex;
      background: #F9FAFB;
      padding: 20rpx;
      border-bottom: 2rpx solid #E5E7EB;
      
      .th {
        font-size: 26rpx;
        font-weight: 600;
        color: #374151;
        
        &:first-child { width: 100rpx; }
        &:last-child { width: 80rpx; text-align: center; }
        &:nth-child(2) { flex: 1; }
      }
    }
    
    .table-row {
      display: flex;
      padding: 20rpx;
      border-bottom: 2rpx solid #F3F4F6;
      
      &:last-child { border-bottom: none; }
      &.error { background: #FEF2F2; }
      &.warning { background: #FFFBEB; }
      &.valid { background: #F0FDF4; }
      
      .td {
        font-size: 26rpx;
        &.row-num { width: 100rpx; color: #9CA3AF; }
        &.status {
          width: 80rpx;
          text-align: center;
          font-weight: 600;
          
          &.valid { color: #059669; }
          &.error { color: #DC2626; }
          &.warning { color: #F59E0B; }
        }
        &.data-preview {
          flex: 1;
          
          .error-msg {
            display: block;
            font-size: 22rpx;
            color: #DC2626;
            margin-top: 4rpx;
          }
        }
      }
    }
  }
  
  .preview-actions {
    display: flex;
    gap: 20rpx;
  }
}

// 进度区块
.progress-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  
  .progress-status {
    margin-bottom: 40rpx;
    
    .status-icon {
      display: block;
      font-size: 80rpx;
      margin-bottom: 20rpx;
    }
    
    .status-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #1F2937;
    }
  }
  
  .progress-bar {
    height: 16rpx;
    background: #E5E7EB;
    border-radius: 8rpx;
    overflow: hidden;
    margin-bottom: 20rpx;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #9A3412, #C2410C);
      border-radius: 8rpx;
      transition: width 0.3s ease;
    }
  }
  
  .progress-percent {
    font-size: 36rpx;
    font-weight: 700;
    color: #9A3412;
  }
  
  .progress-actions {
    margin-top: 40rpx;
  }
}

// 按钮样式
.primary-btn,
.secondary-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  
  text {
    font-size: 30rpx;
    font-weight: 600;
  }
}

.primary-btn {
  background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
  box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
  
  text {
    color: #FFFFFF;
  }
}

.secondary-btn {
  background: #F3F4F6;
  
  text {
    color: #6B7280;
  }
}

// 导出列表
.export-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;
  
  .export-item {
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border-radius: 16rpx;
    padding: 24rpx;
    border: 2rpx solid transparent;
    
    .export-info {
      flex: 1;
      
      .export-name {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8rpx;
      }
      
      .export-desc {
        font-size: 24rpx;
        color: #9CA3AF;
      }
    }
    
    .export-check {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 600;
    }
    
    &.active {
      border-color: #9A3412;
      background: #FFF7ED;
    }
  }
}

// 设置卡片
.settings-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 32rpx;
  
  .setting-item {
    margin-bottom: 24rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .setting-label {
      display: block;
      font-size: 28rpx;
      font-weight: 500;
      color: #374151;
      margin-bottom: 16rpx;
    }
    
    .format-options,
    .time-options {
      display: flex;
      gap: 16rpx;
      
      .format-btn,
      .time-btn {
        padding: 16rpx 32rpx;
        background: #F3F4F6;
        border-radius: 12rpx;
        border: 2rpx solid transparent;
        
        text {
          font-size: 28rpx;
          color: #6B7280;
        }
        
        &.active {
          background: #FFF7ED;
          border-color: #9A3412;
          
          text {
            color: #9A3412;
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 导出按钮
.export-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
  
  .btn-icon {
    font-size: 36rpx;
  }
  
  .btn-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #FFFFFF;
  }
}

// 历史记录
.history-tabs {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  
  .history-section {
    .empty-state {
      background: #FFFFFF;
      border-radius: 16rpx;
      padding: 60rpx;
      text-align: center;
      
      text {
        font-size: 28rpx;
        color: #9CA3AF;
      }
    }
    
    .history-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      background: #FFFFFF;
      border-radius: 16rpx;
      padding: 24rpx;
      margin-bottom: 16rpx;
      
      .history-icon {
        width: 72rpx;
        height: 72rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36rpx;
        
        &.import { background: #DBEAFE; }
        &.export { background: #D1FAE5; }
      }
      
      .history-info {
        flex: 1;
        
        .history-title {
          display: block;
          font-size: 30rpx;
          font-weight: 600;
          color: #1F2937;
          margin-bottom: 4rpx;
        }
        
        .history-detail {
          display: block;
          font-size: 24rpx;
          color: #6B7280;
          margin-bottom: 4rpx;
        }
        
        .history-time {
          font-size: 22rpx;
          color: #9CA3AF;
        }
      }
      
      .history-status,
      .history-action {
        font-size: 26rpx;
        font-weight: 500;
      }
      
      .history-action {
        font-size: 32rpx;
      }
    }
  }
}
</style>
