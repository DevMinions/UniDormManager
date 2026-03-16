<script setup>
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { inspectionApi } from '@/api/inspection.js'
import { handleApiError } from '@/utils/helpers.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 加载状态
const loading = ref(false)
const inspections = ref([])

// 星级评分映射
const starMap = {
  5: { stars: '★★★★★', label: '优秀', color: '#6b8e6b' },
  4: { stars: '★★★★☆', label: '良好', color: '#7a8f63' },
  3: { stars: '★★★☆☆', label: '合格', color: '#c4a77d' },
  2: { stars: '★★☆☆☆', label: '需改进', color: '#c46f43' },
  1: { stars: '★☆☆☆☆', label: '不合格', color: '#c1666b' }
}

// 检查结果映射
const resultMap = {
  excellent: { label: '优秀', color: '#6b8e6b', bgColor: '#e8ece4' },
  good: { label: '良好', color: '#7a8f63', bgColor: '#e8ece4' },
  pass: { label: '合格', color: '#c4a77d', bgColor: '#f5e5d5' },
  warning: { label: '警告', color: '#c46f43', bgColor: '#fdf6f0' },
  failed: { label: '不合格', color: '#c1666b', bgColor: '#fee2e2' }
}

// 后端状态映射到前端
const mapBackendStatus = (status) => {
  const statusMap = {
    'Excellent': 'excellent',
    'Good': 'good',
    'Fair': 'pass',
    'Poor': 'warning'
  }
  return statusMap[status] || 'pass'
}

// 根据分数计算星级
const calculateStarRating = (score) => {
  if (score >= 90) return 5
  if (score >= 80) return 4
  if (score >= 70) return 3
  if (score >= 60) return 2
  return 1
}

// 转换后端数据为前端格式
const convertInspectionData = (data) => {
  if (!data) return []
  return data.map(item => ({
    id: item.id,
    inspectDate: item.checkDate || item.createdAt, // 使用 checkDate 或 createdAt
    inspector: item.inspector,
    roomNumber: item.roomNumber,
    score: item.overallScore, // 映射 overallScore -> score
    starRating: calculateStarRating(item.overallScore),
    result: mapBackendStatus(item.status), // 映射 status -> result
    items: item.details || {}, // 映射 details -> items
    issues: [], // 后端暂无此字段，留空
    remarks: item.comment || '', // 映射 comment -> remarks
    // 保留原始数据
    _raw: item
  }))
}

// 按月份分组的检查记录
const groupedInspections = computed(() => {
  const groups = {}
  
  inspections.value.forEach(inspection => {
    const date = new Date(inspection.inspectDate)
    const key = `${date.getFullYear()}年${date.getMonth() + 1}月`
    
    if (!groups[key]) {
      groups[key] = {
        month: key,
        inspections: [],
        avgScore: 0
      }
    }
    
    const starInfo = starMap[inspection.starRating] || starMap[3]
    const resultInfo = resultMap[inspection.result] || resultMap.pass
    
    groups[key].inspections.push({
      ...inspection,
      displayDate: formatDate(inspection.inspectDate),
      starDisplay: starInfo.stars,
      starColor: starInfo.color,
      resultLabel: resultInfo.label,
      resultColor: resultInfo.color,
      resultBgColor: resultInfo.bgColor
    })
  })
  
  // 计算每月平均分
  Object.values(groups).forEach(group => {
    const total = group.inspections.reduce((sum, item) => sum + item.score, 0)
    group.avgScore = Math.round(total / group.inspections.length)
  })
  
  // 按时间倒序排列
  return Object.values(groups).sort((a, b) => {
    const dateA = new Date(a.inspections[0].inspectDate)
    const dateB = new Date(b.inspections[0].inspectDate)
    return dateB - dateA
  })
})

// 统计数据
const statistics = computed(() => {
  const total = inspections.value.length
  if (total === 0) return { total: 0, avgScore: 0, excellent: 0, good: 0 }
  
  const totalScore = inspections.value.reduce((sum, item) => sum + item.score, 0)
  const excellent = inspections.value.filter(i => i.result === 'excellent').length
  const good = inspections.value.filter(i => i.result === 'good').length
  
  return {
    total,
    avgScore: Math.round(totalScore / total),
    excellent,
    good,
    excellentRate: Math.round((excellent + good) / total * 100)
  }
})

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

// 获取分数颜色
const getScoreColor = (score) => {
  if (score >= 90) return '#6b8e6b'
  if (score >= 80) return '#7a8f63'
  if (score >= 70) return '#c4a77d'
  if (score >= 60) return '#c46f43'
  return '#c1666b'
}

// 获取分数等级
const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '合格'
  if (score >= 60) return '及格'
  return '不及格'
}

// 获取检查记录
const fetchInspections = async () => {
  loading.value = true
  try {
    const res = await inspectionApi.getMyInspections()
    // 转换后端数据为前端格式
    inspections.value = convertInspectionData(res || [])
  } catch (error) {
    handleApiError(error, '获取查寝记录失败')
  } finally {
    loading.value = false
  }
}

// 展开/收起详情
const toggleDetail = (item) => {
  item.showDetail = !item.showDetail
}

// 生命周期
onMounted(() => {
  fetchInspections()
})

onPullDownRefresh(() => {
  fetchInspections().finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<template>
  <view class="inspections-page">
    <AppNavbar title="查寝记录" showBack />
    
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stats-header">
        <text class="stats-title">📊 查寝统计</text>
        <text class="stats-subtitle">共 {{ statistics.total }} 次检查</text>
      </view>
      
      <view class="stats-grid">
        <view class="stat-item">
          <view class="stat-value" :style="{ color: getScoreColor(statistics.avgScore) }">
            {{ statistics.avgScore }}
          </view>
          <text class="stat-label">平均分</text>
        </view>
        <view class="stat-item">
          <view class="stat-value" style="color: #6b8e6b;">
            {{ statistics.excellent }}
          </view>
          <text class="stat-label">优秀次数</text>
        </view>
        <view class="stat-item">
          <view class="stat-value" style="color: #7a8f63;">
            {{ statistics.excellentRate }}%
          </view>
          <text class="stat-label">优良率</text>
        </view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else-if="groupedInspections.length === 0"
    >
      <view class="empty-icon">📝</view>
      <text class="empty-title">暂无查寝记录</text>
      <text class="empty-desc">查寝记录将在这里显示</text>
    </view>
    
    <!-- 按月份分组显示 -->
    <view class="inspection-list" v-else
    >
      <view 
        v-for="group in groupedInspections" 
        :key="group.month"
        class="month-group"
      >
        <!-- 月份标题 -->
        <view class="month-header"
        >
          <view class="month-info"
          >
            <text class="month-name">{{ group.month }}</text>
            <text class="month-count">{{ group.inspections.length }} 次</text>
          </view>
          <view class="month-avg"
          >
            <text class="avg-label">月平均</text>
            <text 
              class="avg-score" 
              :style="{ color: getScoreColor(group.avgScore) }"
            >
              {{ group.avgScore }}分
            </text>
          </view>
        </view>
        
        <!-- 该月的查寝记录 -->
        <view 
          v-for="inspection in group.inspections" 
          :key="inspection.id"
          class="inspection-card"
          @click="toggleDetail(inspection)"
        
        >
          <view class="card-main"
          >
            <!-- 左侧日期 -->
            <view class="date-section"
            >
              <text class="date-day"
              >{{ inspection.inspectDate.split('-')[2] }}</text>
              <text class="date-weekday"
              >{{ inspection.displayDate.split(' ')[1] }}
            </text>
            </view>
            
            <!-- 中间内容 -->
            <view class="content-section"
            >
              <view class="content-header"
              >
                <text class="inspector"
                >👤 {{ inspection.inspector }}</text>
                <view 
                  class="result-tag"
                  :style="{ background: inspection.resultBgColor, color: inspection.resultColor }"
                >
                  {{ inspection.resultLabel }}
                </view>
              </view>
              
              <view class="score-section"
              >
                <text 
                  class="score-value"
                  :style="{ color: getScoreColor(inspection.score) }"
                >
                  {{ inspection.score }}
                </text>
                <text class="score-total">/100</text>
              </view>
              
              <view class="stars-section"
              >
                <text 
                  class="stars"
                  :style="{ color: inspection.starColor }"
                >
                  {{ inspection.starDisplay }}
                </text>
              </view>
            </view>
            
            <!-- 右侧箭头 -->
            <text class="expand-icon"
            >{{ inspection.showDetail ? '▼' : '▶' }}</text>
          </view>
          
          <!-- 展开详情 -->
          <view class="card-detail" v-if="inspection.showDetail"
          >
            <!-- 评分详情 -->
            <view class="detail-section"
            >
              <text class="detail-title">评分详情</text>
              <view class="score-items"
              >
                <view class="score-item"
                >
                  <text class="item-name">卫生状况</text>
                  <view class="item-bar"
                  >
                    <view 
                      class="item-fill"
                      :style="{ 
                        width: inspection.items.hygiene + '%',
                        background: getScoreColor(inspection.items.hygiene)
                      }"
                    ></view>
                  </view>
                  <text 
                    class="item-value"
                    :style="{ color: getScoreColor(inspection.items.hygiene) }"
                  >
                    {{ inspection.items.hygiene }}
                  </text>
                </view>
                
                <view class="score-item"
                >
                  <text class="item-name">物品摆放</text>
                  <view class="item-bar"
                >
                    <view 
                      class="item-fill"
                      :style="{ 
                        width: inspection.items.tidiness + '%',
                        background: getScoreColor(inspection.items.tidiness)
                      }"
                    ></view>
                  </view>
                  <text 
                    class="item-value"
                    :style="{ color: getScoreColor(inspection.items.tidiness) }"
                  >
                    {{ inspection.items.tidiness }}
                  </text>
                </view>
                
                <view class="score-item"
                >
                  <text class="item-name">安全意识</text>
                  <view class="item-bar"
                >
                    <view 
                      class="item-fill"
                      :style="{ 
                        width: inspection.items.safety + '%',
                        background: getScoreColor(inspection.items.safety)
                      }"
                    ></view>
                  </view>
                  <text 
                    class="item-value"
                    :style="{ color: getScoreColor(inspection.items.safety) }"
                  >
                    {{ inspection.items.safety }}
                  </text>
                </view>
                
                <view class="score-item"
                >
                  <text class="item-name">纪律表现</text>
                  <view class="item-bar"
                >
                    <view 
                      class="item-fill"
                      :style="{ 
                        width: inspection.items.discipline + '%',
                        background: getScoreColor(inspection.items.discipline)
                      }"
                    ></view>
                  </view>
                  <text 
                    class="item-value"
                    :style="{ color: getScoreColor(inspection.items.discipline) }"
                  >
                    {{ inspection.items.discipline }}
                  </text>
                </view>
              </view>
            </view>
            
            <!-- 存在问题 -->
            <view class="detail-section" v-if="inspection.issues && inspection.issues.length > 0"
            >
              <text class="detail-title">存在问题</text>
              <view class="issues-list"
              >
                <view 
                  v-for="(issue, index) in inspection.issues" 
                  :key="index"
                  class="issue-item"
                >
                  <text class="issue-dot">•</text>
                  <text class="issue-text">{{ issue }}</text>
                </view>
              </view>
            </view>
            
            <!-- 评语 -->
            <view class="detail-section" v-if="inspection.remarks"
            >
              <text class="detail-title">检查评语</text>
              <text class="remarks-text">{{ inspection.remarks }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部提示 -->
      <view class="list-footer"
      >
        <text class="footer-text">— 共 {{ statistics.total }} 条记录 —</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.inspections-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 40rpx;
}

// 统计卡片
.stats-card {
  background: linear-gradient(135deg, $sage-500, $sage-600);
  border-radius: $radius-lg;
  padding: 32rpx;
  margin: 24rpx;
  box-shadow: $shadow-md;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.stats-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
}

.loading-spinner {
  width: 72rpx;
  height: 72rpx;
  border: 4rpx solid $warm-gray-200;
  border-top-color: $sage-500;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: $warm-gray-500;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 32rpx;
  text-align: center;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  background: $bg-secondary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  font-size: 96rpx;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 500;
  color: $warm-gray-600;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: $warm-gray-400;
}

// 查寝列表
.inspection-list {
  padding: 0 24rpx;
}

.month-group {
  margin-bottom: 32rpx;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 24rpx;
  background: $bg-secondary;
  border-radius: $radius-md $radius-md 0 0;
}

.month-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.month-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.month-count {
  font-size: 24rpx;
  color: $warm-gray-500;
  background: #fff;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
}

.month-avg {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.avg-label {
  font-size: 24rpx;
  color: $warm-gray-500;
}

.avg-score {
  font-size: 32rpx;
  font-weight: 600;
}

// 查寝卡片
.inspection-card {
  background: #fff;
  border-bottom: 1px solid $warm-gray-100;
}

.inspection-card:last-child {
  border-radius: 0 0 $radius-md $radius-md;
  border-bottom: none;
}

.card-main {
  display: flex;
  align-items: center;
  padding: 24rpx;
}

// 日期区域
date-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 24rpx;
  border-right: 1px solid $warm-gray-100;
  min-width: 100rpx;
}

.date-day {
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
}

.date-weekday {
  font-size: 22rpx;
  color: $warm-gray-400;
  margin-top: 4rpx;
}

// 内容区域
.content-section {
  flex: 1;
  margin-left: 24rpx;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.inspector {
  font-size: 26rpx;
  color: $warm-gray-500;
}

.result-tag {
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-size: 22rpx;
  font-weight: 500;
}

.score-section {
  display: flex;
  align-items: baseline;
  margin-bottom: 8rpx;
}

.score-value {
  font-size: 48rpx;
  font-weight: 700;
}

.score-total {
  font-size: 24rpx;
  color: $warm-gray-400;
  margin-left: 4rpx;
}

.stars-section {
  margin-top: 4rpx;
}

.stars {
  font-size: 28rpx;
  letter-spacing: 4rpx;
}

// 展开图标
.expand-icon {
  font-size: 24rpx;
  color: $warm-gray-400;
  margin-left: 16rpx;
}

// 详情区域
.card-detail {
  padding: 0 24rpx 24rpx;
  background: $bg-secondary;
  border-top: 1px dashed $warm-gray-200;
}

.detail-section {
  padding-top: 24rpx;
}

.detail-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
}

// 评分项目
.score-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.item-name {
  width: 120rpx;
  font-size: 26rpx;
  color: $text-secondary;
  flex-shrink: 0;
}

.item-bar {
  flex: 1;
  height: 16rpx;
  background: $warm-gray-200;
  border-radius: $radius-full;
  overflow: hidden;
}

.item-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.5s ease;
}

.item-value {
  width: 60rpx;
  font-size: 26rpx;
  font-weight: 600;
  text-align: right;
  flex-shrink: 0;
}

// 问题列表
.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.issue-dot {
  font-size: 32rpx;
  color: $error;
  line-height: 1;
}

.issue-text {
  font-size: 26rpx;
  color: $text-secondary;
}

// 评语
.remarks-text {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  padding: 16rpx;
  background: #fff;
  border-radius: $radius-md;
}

// 列表底部
.list-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48rpx 0;
}

.footer-text {
  font-size: 24rpx;
  color: $warm-gray-400;
}
</style>