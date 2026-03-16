<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
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

// 当前步骤
const currentStep = ref(1) // 1:选择学生 2:设置偏好 3:查看推荐

// 待分配学生列表
const pendingStudents = ref([
  { id: 1, name: '张三', gender: 'male', major: '计算机', grade: '2024', habits: {} },
  { id: 2, name: '李四', gender: 'male', major: '计算机', grade: '2024', habits: {} },
  { id: 3, name: '王五', gender: 'male', major: '电子', grade: '2024', habits: {} },
  { id: 4, name: '赵六', gender: 'male', major: '计算机', grade: '2024', habits: {} }
])

// 已选择的学生
const selectedStudents = ref([])

// 分配设置
const allocationSettings = ref({
  priority: 'compatibility', // compatibility/major/grade/random
  considerGender: true,
  considerMajor: true,
  considerGrade: true,
  maxPerRoom: 4,
  algorithm: 'comprehensive' // comprehensive/personality/habit/random
})

// 学生偏好标签
const preferenceTags = {
  sleep: [
    { id: 'early', label: '早睡', icon: '🌙' },
    { id: 'late', label: '晚睡', icon: '🌅' },
    { id: 'normal', label: '正常作息', icon: '⏰' }
  ],
  study: [
    { id: 'quiet', label: '安静学习', icon: '📚' },
    { id: 'group', label: '小组学习', icon: '👥' },
    { id: 'flexible', label: '灵活安排', icon: '📖' }
  ],
  cleanliness: [
    { id: 'tidy', label: '爱整洁', icon: '✨' },
    { id: 'normal', label: '一般', icon: '🧹' },
    { id: 'casual', label: '随意', icon: '😊' }
  ],
  social: [
    { id: 'outgoing', label: '外向', icon: '🎉' },
    { id: 'introvert', label: '内向', icon: '🤫' },
    { id: 'balanced', label: '平衡', icon: '⚖️' }
  ],
  hobby: [
    { id: 'sports', label: '运动', icon: '⚽' },
    { id: 'game', label: '游戏', icon: '🎮' },
    { id: 'music', label: '音乐', icon: '🎵' },
    { id: 'reading', label: '阅读', icon: '📚' },
    { id: 'movie', label: '影视', icon: '🎬' }
  ]
}

// 推荐结果
const recommendations = ref([])
const isCalculating = ref(false)

// 可选房间
const availableRooms = ref([
  { id: 101, building: 'A栋', roomNumber: '101', capacity: 4, current: 0, tags: ['朝阳', '安静'] },
  { id: 102, building: 'A栋', roomNumber: '102', capacity: 4, current: 1, tags: ['近楼梯', '方便'] },
  { id: 103, building: 'A栋', roomNumber: '103', capacity: 4, current: 0, tags: ['朝阳', '宽敞'] },
  { id: 104, building: 'A栋', roomNumber: '104', capacity: 4, current: 0, tags: ['安静', '舒适'] }
])

// 页面加载
onShow(() => {
  if (!checkAuth()) return
  loadPendingStudents()
})

// 加载待分配学生
const loadPendingStudents = async () => {
  try {
    // 实际项目中调用 API
    // const res = await studentApi.getPendingAllocation()
    // pendingStudents.value = res
  } catch (error) {
    handleApiError(error, '加载学生列表失败')
  }
}

// 切换学生选择
const toggleStudentSelection = (student) => {
  const index = selectedStudents.value.findIndex(s => s.id === student.id)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
  } else {
    selectedStudents.value.push({ ...student, habits: {} })
  }
}

// 检查是否已选择
const isSelected = (student) => {
  return selectedStudents.value.some(s => s.id === student.id)
}

// 设置学生偏好
const setStudentPreference = (studentId, category, value) => {
  const student = selectedStudents.value.find(s => s.id === studentId)
  if (student) {
    if (!student.habits[category]) {
      student.habits[category] = []
    }
    const index = student.habits[category].indexOf(value)
    if (index > -1) {
      student.habits[category].splice(index, 1)
    } else {
      student.habits[category].push(value)
    }
  }
}

// 检查偏好是否已选
const hasPreference = (studentId, category, value) => {
  const student = selectedStudents.value.find(s => s.id === studentId)
  return student?.habits[category]?.includes(value) || false
}

// 计算匹配度
const calculateCompatibility = (student1, student2) => {
  let score = 0
  let factors = 0
  
  // 作息匹配
  if (student1.habits.sleep && student2.habits.sleep) {
    const sleepMatch = student1.habits.sleep.some(s => student2.habits.sleep.includes(s))
    score += sleepMatch ? 25 : 5
    factors++
  }
  
  // 学习习惯匹配
  if (student1.habits.study && student2.habits.study) {
    const studyMatch = student1.habits.study.some(s => student2.habits.study.includes(s))
    score += studyMatch ? 20 : 10
    factors++
  }
  
  // 整洁度匹配
  if (student1.habits.cleanliness && student2.habits.cleanliness) {
    const cleanMatch = student1.habits.cleanliness.some(c => student2.habits.cleanliness.includes(c))
    score += cleanMatch ? 20 : 10
    factors++
  }
  
  // 社交偏好匹配
  if (student1.habits.social && student2.habits.social) {
    const socialMatch = student1.habits.social.some(s => student2.habits.social.includes(s))
    score += socialMatch ? 15 : 10
    factors++
  }
  
  // 兴趣爱好匹配（有共同爱好加分）
  if (student1.habits.hobby && student2.habits.hobby) {
    const commonHobbies = student1.habits.hobby.filter(h => student2.habits.hobby.includes(h))
    score += Math.min(commonHobbies.length * 5, 20)
    factors++
  }
  
  // 专业相同加分
  if (allocationSettings.value.considerMajor && student1.major === student2.major) {
    score += 10
  }
  
  // 年级相同加分
  if (allocationSettings.value.considerGrade && student1.grade === student2.grade) {
    score += 5
  }
  
  return Math.min(score, 100)
}

// 生成推荐
const generateRecommendations = async () => {
  if (selectedStudents.value.length === 0) {
    uni.showToast({ title: '请先选择学生', icon: 'none' })
    return
  }
  
  // 检查是否都设置了偏好
  const incomplete = selectedStudents.value.filter(s => 
    !s.habits.sleep || s.habits.sleep.length === 0
  )
  if (incomplete.length > 0) {
    uni.showToast({ title: '请为所有学生设置作息偏好', icon: 'none' })
    return
  }
  
  isCalculating.value = true
  
  // 模拟计算过程
  setTimeout(() => {
    const result = []
    const students = [...selectedStudents.value]
    const rooms = [...availableRooms.value]
    
    // 简单的分配算法
    while (students.length > 0 && rooms.length > 0) {
      const room = rooms[0]
      const roomGroup = {
        room: room,
        students: [],
        compatibilityScore: 0
      }
      
      // 为当前房间分配学生
      const slots = room.capacity - room.current
      for (let i = 0; i < slots && students.length > 0; i++) {
        let bestStudent = null
        let bestScore = -1
        
        // 找到与已分配学生匹配度最高的学生
        for (const student of students) {
          let totalScore = 0
          for (const assigned of roomGroup.students) {
            totalScore += calculateCompatibility(student, assigned)
          }
          const avgScore = roomGroup.students.length > 0 ? totalScore / roomGroup.students.length : 50
          
          if (avgScore > bestScore) {
            bestScore = avgScore
            bestStudent = student
          }
        }
        
        if (bestStudent) {
          roomGroup.students.push(bestStudent)
          students.splice(students.indexOf(bestStudent), 1)
        }
      }
      
      // 计算整体匹配度
      if (roomGroup.students.length > 1) {
        let totalCompat = 0
        let pairs = 0
        for (let i = 0; i < roomGroup.students.length; i++) {
          for (let j = i + 1; j < roomGroup.students.length; j++) {
            totalCompat += calculateCompatibility(roomGroup.students[i], roomGroup.students[j])
            pairs++
          }
        }
        roomGroup.compatibilityScore = pairs > 0 ? Math.round(totalCompat / pairs) : 100
      } else {
        roomGroup.compatibilityScore = 100
      }
      
      result.push(roomGroup)
      rooms.shift()
    }
    
    recommendations.value = result
    isCalculating.value = false
    currentStep.value = 3
    
    showSuccess('推荐方案生成完成')
  }, 1500)
}

// 应用推荐方案
const applyRecommendation = async () => {
  uni.showModal({
    title: '确认应用',
    content: '确定要应用此推荐方案吗？此操作将实际分配宿舍。',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 实际项目中调用 API
          // await allocationApi.applyRecommendation(recommendations.value)
          showSuccess('宿舍分配完成')
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          handleApiError(error, '应用失败')
        }
      }
    }
  })
}

// 重新生成
const regenerate = () => {
  currentStep.value = 1
  selectedStudents.value = []
  recommendations.value = []
}

// 获取匹配度颜色
const getCompatibilityColor = (score) => {
  if (score >= 80) return '#059669'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#DC2626'
}

// 获取匹配度标签
const getCompatibilityLabel = (score) => {
  if (score >= 80) return '非常匹配'
  if (score >= 60) return '比较匹配'
  if (score >= 40) return '基本匹配'
  return '需要磨合'
}
</script>

<template>
  <view class="page-container">
    <AppNavbar title="智能宿舍分配" show-back />
    
    <view class="content">
      <!-- 步骤指示器 -->
      <view class="step-indicator">
        <view class="step-item" :class="{ active: currentStep >= 1, current: currentStep === 1 }">
          <view class="step-number">1</view>
          <text class="step-label">选择学生</text>
        </view>
        <view class="step-line" :class="{ active: currentStep >= 2 }"></view>
        
        <view class="step-item" :class="{ active: currentStep >= 2, current: currentStep === 2 }">
          <view class="step-number">2</view>
          <text class="step-label">设置偏好</text>
        </view>
        <view class="step-line" :class="{ active: currentStep >= 3 }"></view>
        
        <view class="step-item" :class="{ active: currentStep >= 3, current: currentStep === 3 }">
          <view class="step-number">3</view>
          <text class="step-label">查看推荐</text>
        </view>
      </view>
      
      <!-- 步骤1: 选择学生 -->
      <view v-if="currentStep === 1" class="step-content">
        <view class="section-card">
          <view class="card-header">
            <text class="card-title">选择待分配学生</text>
            <text class="card-subtitle">已选择 {{ selectedStudents.length }} 人</text>
          </view>
          
          <view class="student-list">
            <view
              v-for="student in pendingStudents"
              :key="student.id"
              class="student-item"
              :class="{ selected: isSelected(student) }"
              @click="toggleStudentSelection(student)"
            >
              <view class="student-avatar">{{ student.name[0] }}</view>
              
              <view class="student-info">
                <text class="student-name">{{ student.name }}</text>
                <text class="student-detail">{{ student.major }} · {{ student.grade }}</text>
              </view>
              
              <view class="student-check">
                <text v-if="isSelected(student)" class="check-icon">✓</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="action-bar">
          <button
            class="primary-btn"
            :disabled="selectedStudents.length === 0"
            @click="currentStep = 2"
          >
            <text>下一步：设置偏好</text>
          </button>
        </view>
      </view>
      
      <!-- 步骤2: 设置偏好 -->
      <view v-if="currentStep === 2" class="step-content">
        <view class="settings-card">
          <view class="card-header">
            <text class="card-title">分配设置</text>
          </view>
          
          <view class="setting-item">
            <text class="setting-label">分配优先级</text>
            <view class="option-group">
              <view
                v-for="opt in [
                  { id: 'compatibility', label: '性格匹配' },
                  { id: 'major', label: '同专业' },
                  { id: 'grade', label: '同年级' },
                  { id: 'random', label: '随机' }
                ]"
                :key="opt.id"
                class="option-btn"
                :class="{ active: allocationSettings.priority === opt.id }"
                @click="allocationSettings.priority = opt.id"
              >
                <text>{{ opt.label }}</text>
              </view>
            </view>
          </view>
          
          <view class="setting-item">
            <text class="setting-label">每间宿舍人数</text>
            <view class="option-group">
              <view
                v-for="n in [2, 3, 4, 6]"
                :key="n"
                class="option-btn"
                :class="{ active: allocationSettings.maxPerRoom === n }"
                @click="allocationSettings.maxPerRoom = n"
              >
                <text>{{ n }}人</text>
              </view>
            </view>
          </view>
        </view>
        
        <view
          v-for="student in selectedStudents"
          :key="student.id"
          class="preference-card"
        >
          <view class="card-header">
            <view class="student-avatar small">{{ student.name[0] }}</view>
            <text class="card-title">{{ student.name }}的偏好</text>
          </view>
          
          <view class="preference-section">
            <text class="section-label">作息习惯</text>
            <view class="tag-group">
              <view
                v-for="tag in preferenceTags.sleep"
                :key="tag.id"
                class="preference-tag"
                :class="{ active: hasPreference(student.id, 'sleep', tag.id) }"
                @click="setStudentPreference(student.id, 'sleep', tag.id)"
              >
                <text class="tag-icon">{{ tag.icon }}</text>
                <text class="tag-label">{{ tag.label }}</text>
              </view>
            </view>
          </view>
          
          <view class="preference-section">
            <text class="section-label">学习习惯</text>
            <view class="tag-group">
              <view
                v-for="tag in preferenceTags.study"
                :key="tag.id"
                class="preference-tag"
                :class="{ active: hasPreference(student.id, 'study', tag.id) }"
                @click="setStudentPreference(student.id, 'study', tag.id)"
              >
                <text class="tag-icon">{{ tag.icon }}</text>
                <text class="tag-label">{{ tag.label }}</text>
              </view>
            </view>
          </view>
          
          <view class="preference-section">
            <text class="section-label">整洁程度</text>
            <view class="tag-group">
              <view
                v-for="tag in preferenceTags.cleanliness"
                :key="tag.id"
                class="preference-tag"
                :class="{ active: hasPreference(student.id, 'cleanliness', tag.id) }"
                @click="setStudentPreference(student.id, 'cleanliness', tag.id)"
              >
                <text class="tag-icon">{{ tag.icon }}</text>
                <text class="tag-label">{{ tag.label }}</text>
              </view>
            </view>
          </view>
          
          
          <view class="preference-section">
            <text class="section-label">社交偏好</text>
            <view class="tag-group">
              <view
                v-for="tag in preferenceTags.social"
                :key="tag.id"
                class="preference-tag"
                :class="{ active: hasPreference(student.id, 'social', tag.id) }"
                @click="setStudentPreference(student.id, 'social', tag.id)"
              >
                <text class="tag-icon">{{ tag.icon }}</text>
                <text class="tag-label">{{ tag.label }}</text>
              </view>
            </view>
          </view>
          
          
          <view class="preference-section">
            <text class="section-label">兴趣爱好（可多选）</text>
            <view class="tag-group">
              <view
                v-for="tag in preferenceTags.hobby"
                :key="tag.id"
                class="preference-tag"
                :class="{ active: hasPreference(student.id, 'hobby', tag.id) }"
                @click="setStudentPreference(student.id, 'hobby', tag.id)"
              >
                <text class="tag-icon">{{ tag.icon }}</text>
                <text class="tag-label">{{ tag.label }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="action-bar">
          <button class="secondary-btn" @click="currentStep = 1">
            <text>上一步</text>
          </button>
          
          <button
            class="primary-btn"
            :loading="isCalculating"
            @click="generateRecommendations"
          >
            <text>{{ isCalculating ? '计算中...' : '生成推荐方案' }}</text>
          </button>
        </view>
      </view>
      
      <!-- 步骤3: 查看推荐 -->
      <view v-if="currentStep === 3" class="step-content">
        <view class="result-summary">
          <text class="summary-title">🎉 推荐方案已生成</text>
          <text class="summary-desc">共分配 {{ recommendations.length }} 间宿舍，平均匹配度 {{ Math.round(recommendations.reduce((a,b) => a + b.compatibilityScore, 0) / recommendations.length) }}%</text>
        </view>
        
        <view
          v-for="(group, index) in recommendations"
          :key="index"
          class="recommendation-card"
        >
          <view class="room-header">
            <view class="room-info">
              <text class="room-name">{{ group.room.building }} {{ group.room.roomNumber }}</text>
              <view class="room-tags">
                <text
                  v-for="tag in group.room.tags"
                  :key="tag"
                  class="room-tag"
                >{{ tag }}</text>
              </view>
            </view>
            
            <view
              class="compatibility-badge"
              :style="{ backgroundColor: getCompatibilityColor(group.compatibilityScore) + '20' }"
            >
              <text
                class="compatibility-score"
                :style="{ color: getCompatibilityColor(group.compatibilityScore) }"
              >{{ group.compatibilityScore }}%</text>
              <text
                class="compatibility-label"
                :style="{ color: getCompatibilityColor(group.compatibilityScore) }"
              >{{ getCompatibilityLabel(group.compatibilityScore) }}</text>
            </view>
          </view>
          
          <view class="assigned-students">
            <view
              v-for="student in group.students"
              :key="student.id"
              class="assigned-student"
            >
              <view class="student-avatar small">{{ student.name[0] }}</view>
              <view class="student-info">
                <text class="student-name">{{ student.name }}</text>
                <text class="student-detail">{{ student.major }}</text>
              </view>
            </view>
          </view>
          
          <view v-if="group.students.length > 1" class="match-details">
            <text class="match-title">匹配亮点</text>
            <view class="match-tags">
              <text class="match-tag">🌙 作息相似</text>
              <text class="match-tag">📚 学习习惯相近</text>
              <text v-if="group.students[0].major === group.students[1]?.major" class="match-tag">🎓 同专业</text>
            </view>
          </view>
        </view>
        
        <view class="action-bar">
          <button class="secondary-btn" @click="regenerate">
            <text>重新生成</text>
          </button>
          
          <button class="primary-btn" @click="applyRecommendation">
            <text>应用此方案</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  padding-bottom: 160rpx;
}

.content {
  padding: 24rpx;
}

// 步骤指示器
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  
  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    
    .step-number {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 600;
      color: #9CA3AF;
    }
    
    .step-label {
      font-size: 24rpx;
      color: #9CA3AF;
    }
    
    &.active {
      .step-number {
        background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
        color: #FFFFFF;
      }
      
      .step-label {
        color: #9A3412;
        font-weight: 500;
      }
    }
    
    &.current {
      .step-number {
        box-shadow: 0 0 0 4rpx rgba(154, 52, 18, 0.2);
      }
    }
  }
  
  .step-line {
    width: 80rpx;
    height: 4rpx;
    background: #E5E7EB;
    margin: 0 16rpx;
    margin-bottom: 40rpx;
    
    &.active {
      background: linear-gradient(90deg, #9A3412, #C2410C);
    }
  }
}

// 卡片样式
.section-card,
.settings-card,
.preference-card,
.recommendation-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
    
    .card-title {
      flex: 1;
      font-size: 30rpx;
      font-weight: 600;
      color: #1F2937;
    }
    
    .card-subtitle {
      font-size: 26rpx;
      color: #9A3412;
      font-weight: 500;
    }
  }
}

// 学生列表
.student-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  
  .student-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx;
    background: #F9FAFB;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    
    &.selected {
      background: #FFF7ED;
      border-color: #9A3412;
    }
    
    .student-avatar {
      width: 72rpx;
      height: 72rpx;
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      font-weight: 600;
      color: #FFFFFF;
      
      &.small {
        width: 56rpx;
        height: 56rpx;
        font-size: 26rpx;
      }
    }
    
    .student-info {
      flex: 1;
      
      .student-name {
        display: block;
        font-size: 30rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 4rpx;
      }
      
      .student-detail {
        font-size: 24rpx;
        color: #9CA3AF;
      }
    }
    
    .student-check {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .check-icon {
        font-size: 28rpx;
        color: #9A3412;
        font-weight: 600;
      }
    }
  }
}

// 设置项
.setting-item {
  margin-bottom: 28rpx;
  
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
  
  .option-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .option-btn {
      padding: 16rpx 28rpx;
      background: #F3F4F6;
      border-radius: 12rpx;
      border: 2rpx solid transparent;
      
      text {
        font-size: 26rpx;
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

// 偏好设置
.preference-section {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .section-label {
    display: block;
    font-size: 26rpx;
    color: #6B7280;
    margin-bottom: 16rpx;
  }
  
  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .preference-tag {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 16rpx 24rpx;
      background: #F9FAFB;
      border-radius: 12rpx;
      border: 2rpx solid transparent;
      
      .tag-icon {
        font-size: 28rpx;
      }
      
      .tag-label {
        font-size: 26rpx;
        color: #374151;
      }
      
      &.active {
        background: #FFF7ED;
        border-color: #9A3412;
        
        .tag-label {
          color: #9A3412;
          font-weight: 500;
        }
      }
    }
  }
}

// 结果摘要
.result-summary {
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  
  .summary-title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #059669;
    margin-bottom: 12rpx;
  }
  
  .summary-desc {
    font-size: 26rpx;
    color: #059669;
    opacity: 0.8;
  }
}

// 推荐卡片
.recommendation-card {
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    
    .room-info {
      .room-name {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8rpx;
      }
      
      .room-tags {
        display: flex;
        gap: 12rpx;
        
        .room-tag {
          font-size: 22rpx;
          color: #9A3412;
          background: #FEF3C7;
          padding: 6rpx 14rpx;
          border-radius: 8rpx;
        }
      }
    }
    
    .compatibility-badge {
      padding: 16rpx 24rpx;
      border-radius: 16rpx;
      text-align: center;
      
      .compatibility-score {
        display: block;
        font-size: 36rpx;
        font-weight: 700;
        margin-bottom: 4rpx;
      }
      
      .compatibility-label {
        font-size: 22rpx;
      }
    }
  }
  
  .assigned-students {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 20rpx;
    
    .assigned-student {
      display: flex;
      align-items: center;
      gap: 12rpx;
      background: #F9FAFB;
      padding: 16rpx 20rpx;
      border-radius: 12rpx;
      
      .student-info {
        .student-name {
          display: block;
          font-size: 28rpx;
          font-weight: 500;
          color: #1F2937;
          margin-bottom: 2rpx;
        }
        
        .student-detail {
          font-size: 22rpx;
          color: #9CA3AF;
        }
      }
    }
  }
  
  .match-details {
    padding-top: 20rpx;
    border-top: 2rpx solid #F3F4F6;
    
    .match-title {
      display: block;
      font-size: 24rpx;
      color: #6B7280;
      margin-bottom: 12rpx;
    }
    
    .match-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      
      .match-tag {
        font-size: 24rpx;
        color: #059669;
        background: #ECFDF5;
        padding: 10rpx 20rpx;
        border-radius: 10rpx;
      }
    }
  }
}

// 操作栏
.action-bar {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  
  .primary-btn,
  .secondary-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 20rpx;
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
    
    &:disabled {
      opacity: 0.6;
    }
  }
  
  .secondary-btn {
    background: #F3F4F6;
    
    text {
      color: #6B7280;
    }
  }
}
</style>
