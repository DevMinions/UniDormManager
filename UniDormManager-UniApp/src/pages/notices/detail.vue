<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { noticeApi } from '@/api/notice.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 公告ID
const noticeId = ref('')

// 加载状态
const loading = ref(false)
const notice = ref(null)

// 类型映射
const typeMap = {
  notification: { name: '通知', icon: '📢', color: '#7a8f63', bgColor: '#e8ece4' },
  activity: { name: '活动', icon: '🎉', color: '#c46f43', bgColor: '#fdf6f0' },
  repair: { name: '维修', icon: '🔧', color: '#c4a77d', bgColor: '#f5e5d5' },
  safety: { name: '安全', icon: '🛡️', color: '#c1666b', bgColor: '#fee2e2' }
}

// 模拟公告数据
const mockNotices = [
  { 
    id: 1, 
    title: '关于寒假宿舍关闭通知', 
    type: 'notification', 
    author: '宿舍管理中心',
    publishTime: '2024-01-15 09:30',
    content: `各位同学：

寒假即将到来，为确保宿舍安全，宿舍楼将于1月20日至2月25日期间关闭。请同学们提前做好以下安排：

**一、离校前注意事项**

1. 关闭门窗，检查水电开关是否关闭
2. 带走贵重物品，妥善保管个人物品
3. 清理宿舍垃圾，保持宿舍整洁
4. 拔掉所有电器插头，确保安全

**二、留校申请**

如有特殊情况需留校，请于1月15日前提交留校申请：
- 申请方式：登录宿舍管理系统在线申请
- 审批时间：3个工作日内
- 留校宿舍安排：统一安排至B栋集中住宿

**三、开学返校**

宿舍将于2月25日重新开放，请同学们合理安排返校时间。

如有疑问，请联系宿舍管理中心。

联系人：张老师
联系电话：010-12345678

宿舍管理中心
2024年1月15日`,
    attachments: []
  },
  { 
    id: 2, 
    title: '新年联欢晚会报名开始', 
    type: 'activity', 
    author: '学生会',
    publishTime: '2024-01-12 14:00',
    content: `各位同学：

为迎接新春佳节，丰富宿舍文化生活，学生会特举办新年联欢晚会，现开始接受报名。

**一、活动信息**

- 活动时间：1月25日（周四）晚7:00
- 活动地点：学生活动中心多功能厅
- 参与对象：全体住宿学生

**二、节目形式**

欢迎各宿舍组队参加，节目形式包括但不限于：
- 歌曲演唱（独唱、合唱）
- 舞蹈表演（独舞、群舞）
- 小品相声
- 乐器演奏
- 魔术杂技
- 其他创意表演

**三、报名方式**

1. 在线报名：宿舍管理系统 → 活动报名
2. 报名截止：1月20日
3. 节目初审：1月22日

**四、奖项设置**

- 一等奖：1名，奖金1000元
- 二等奖：2名，奖金600元
- 三等奖：3名，奖金300元
- 最佳人气奖：1名
- 参与奖：若干

期待大家的精彩表现！

学生会
2024年1月12日`,
    attachments: [
      { name: '报名表.docx', size: '25KB', url: '#' },
      { name: '节目要求.pdf', size: '156KB', url: '#' }
    ]
  },
  { 
    id: 3, 
    title: 'A栋热水器维修通知', 
    type: 'repair', 
    author: '后勤处',
    publishTime: '2024-01-10 16:30',
    content: `A栋各位同学：

为进一步提升宿舍热水供应质量，后勤处将对A栋热水器进行例行维护，具体安排如下：

**一、维修时间**

2024年1月13日（周六）上午9:00-12:00

**二、影响范围**

A栋1-6层所有宿舍

**三、温馨提示**

1. 请同学们提前做好热水储备
2. 维修期间请关闭热水器电源开关
3. 如有紧急情况请联系宿舍管理员
4. 维修完成后将恢复正常供水

**四、联系方式**

后勤服务热线：010-87654321
宿舍管理员：李阿姨（A栋值班室）

给您带来的不便敬请谅解，感谢大家的配合！

后勤处
2024年1月10日`,
    attachments: []
  },
  { 
    id: 4, 
    title: '宿舍用电安全提醒', 
    type: 'safety', 
    author: '安全管理科',
    publishTime: '2024-01-08 10:00',
    content: `各位同学：

近期气温较低，宿舍用电负荷增加，为确保大家的人身和财产安全，安全管理科特此提醒：

**一、禁止使用的电器**

以下大功率电器严禁在宿舍使用：
- ❌ 电热毯
- ❌ 电暖器/小太阳
- ❌ 电火锅/电磁炉
- ❌ 电热水壶（超过1500W）
- ❌ 电吹风（建议到公共浴室使用）
- ❌ 任何发热类取暖设备

**二、安全用电规范**

1. 人走断电，离开宿舍请关闭所有电源
2. 手机、充电宝充电时不要放在床上
3. 不使用劣质插线板，不私拉乱接电线
4. 发现线路老化、插座松动及时报修
5. 不在宿舍内给电动车电池充电

**三、应急处理**

发现电器冒烟、起火时：
1. 立即切断电源
2. 使用干粉灭火器灭火（严禁用水）
3. 拨打119报警
4. 通知宿舍管理员

**四、违规处理**

违反用电规定者，将按校规校纪处理：
- 首次违规：警告并没收违规电器
- 再次违规：通报批评
- 造成事故的：依法追究责任

安全无小事，防患于未"燃"。请大家共同维护宿舍安全！

安全管理科
2024年1月8日`,
    attachments: [
      { name: '宿舍安全手册.pdf', size: '2.3MB', url: '#' }
    ]
  },
  { 
    id: 5, 
    title: '春季宿舍卫生评比活动', 
    type: 'activity', 
    author: '宿舍管理中心',
    publishTime: '2024-01-05 09:00',
    content: `各位同学：

为营造整洁舒适的宿舍环境，培养学生良好的生活习惯，宿舍管理中心决定开展春季宿舍卫生评比活动。

**一、评比时间**

2024年3月1日至3月31日

**二、评比标准**

| 项目 | 分值 | 评分标准 |
|------|------|----------|
| 整体整洁 | 30分 | 地面干净、空气清新 |
| 物品摆放 | 25分 | 桌面整洁、床铺规范 |
| 卫生间 | 25分 | 无异味、无积水 |
| 安全隐患 | 20分 | 无违规电器、无私拉电线 |

**三、检查方式**

1. 每周不定期抽查（占40%）
2. 月末集中检查（占60%）

**四、奖项设置**

- 🥇 一等奖：3名，奖金500元 + 购物卡
- 🥈 二等奖：10名，奖金300元 + 生活用品
- 🥉 三等奖：20名，奖金100元 + 清洁用品
- 🌟 最佳进步奖：若干，精美礼品

**五、注意事项**

1. 评比结果将在公告栏和系统公示
2. 获奖宿舍将获得"文明宿舍"流动红旗
3. 连续获奖宿舍可优先选择下学年宿舍

让我们一起打造温馨舒适的家！

宿舍管理中心
2024年1月5日`,
    attachments: [
      { name: '评比细则.pdf', size: '320KB', url: '#' },
      { name: '评分表模板.docx', size: '18KB', url: '#' }
    ]
  },
  { 
    id: 6, 
    title: '关于调整熄灯时间的通知', 
    type: 'notification', 
    author: '宿舍管理中心',
    publishTime: '2024-01-03 15:30',
    content: `各位同学：

经学校研究决定，为更好地满足同学们的学习和生活需求，自本学期开始调整宿舍熄灯时间。

**一、调整内容**

| 时间类型 | 原时间 | 新时间 |
|----------|--------|--------|
| 熄灯时间 | 23:00 | 23:30 |
| 门禁时间 | 23:30 | 24:00 |

**二、执行时间**

2024年3月1日起正式执行

**三、温馨提示**

1. 熄灯后请保持安静，不影响他人休息
2. 可使用台灯继续学习，但请调暗亮度
3. 请合理安排作息时间，保证充足睡眠
4. 门禁时间延后，但仍建议大家早睡早起

**四、特殊情况**

考试周期间（以教务处通知为准），熄灯时间延长至24:00。

请大家相互转告，合理安排作息时间。

宿舍管理中心
2024年1月3日`,
    attachments: []
  }
]

// 获取公告详情
const fetchNoticeDetail = async () => {
  loading.value = true
  try {
    const res = await noticeApi.getNoticeDetail(noticeId.value)
    if (res) {
      // 推断公告类型
      let type = res.type || 'notification'
      if (!res.type) {
        const content = (res.content || '').toLowerCase()
        if (content.includes('活动') || content.includes('报名') || content.includes('比赛')) {
          type = 'activity'
        } else if (content.includes('维修') || content.includes('停水') || content.includes('停电')) {
          type = 'repair'
        } else if (content.includes('安全') || content.includes('检查') || content.includes('违规')) {
          type = 'safety'
        }
      }
      
      const typeInfo = typeMap[type] || typeMap.notification
      notice.value = {
        ...res,
        title: res.title,
        content: res.content,
        author: res.author,
        publishTime: res.date || res.publishTime || res.createdAt,
        type: type,
        typeName: typeInfo.name,
        typeIcon: typeInfo.icon,
        typeColor: typeInfo.color,
        typeBgColor: typeInfo.bgColor,
        displayTime: formatTime(res.date || res.publishTime || res.createdAt)
      }
    } else {
      uni.showToast({
        title: '公告不存在',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error) {
    console.error('获取公告详情失败:', error)
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 下载附件
const downloadAttachment = (attachment) => {
  uni.showToast({
    title: `下载 ${attachment.name}`,
    icon: 'none'
  })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 生命周期
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  noticeId.value = currentPage.$page?.options?.id || currentPage.options?.id || '1'
  fetchNoticeDetail()
})
</script>

<template>
  <view class="notice-detail-page">
    <AppNavbar title="公告详情" showBack @back="goBack" />
    
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 公告内容 -->
    <view class="notice-content-wrapper" v-else-if="notice">
      <!-- 公告头部 -->
      <view class="notice-header-card">
        <!-- 类型标签 -->
        <view 
          class="type-tag"
          :style="{ background: notice.typeBgColor, color: notice.typeColor }"
        >
          <text class="type-icon">{{ notice.typeIcon }}</text>
          <text class="type-name">{{ notice.typeName }}</text>
        </view>
        
        <!-- 标题 -->
        <text class="notice-title">{{ notice.title }}</text>
        
        <!-- 发布信息 -->
        <view class="notice-meta">
          <view class="meta-item">
            <text class="meta-icon">👤</text>
            <text class="meta-text">{{ notice.author }}</text>
          </view>
          <view class="meta-divider"></view>
          <view class="meta-item">
            <text class="meta-icon">🕐</text>
            <text class="meta-text">{{ notice.displayTime }}</text>
          </view>
        </view>
      </view>
      
      <!-- 正文内容 -->
      <view class="notice-body-card"
        >
        <view class="content-text">{{ notice.content }}</view>
      </view>
      
      <!-- 附件列表 -->
      <view class="attachments-card" v-if="notice.attachments && notice.attachments.length > 0"
        >
        <view class="attachments-header"
        >
          <text class="attachments-icon">📎</text>
          <text class="attachments-title">附件 ({{ notice.attachments.length }})</text>
        </view>
        
        <view 
          v-for="(file, index) in notice.attachments" 
          :key="index"
          class="attachment-item"
          @click="downloadAttachment(file)"
        >
          <view class="attachment-info"
          >
            <text class="attachment-name">{{ file.name }}</text>
            <text class="attachment-size">{{ file.size }}</text>
          </view>
          <text class="download-icon">⬇️</text>
        </view>
      </view>
      
      <!-- 底部操作栏 -->
      <view class="action-bar"
      >
        <view class="back-btn" @click="goBack"
        >
          <text class="back-icon">←</text>
          <text class="back-text">返回列表</text>
        </view>
      </view>
    </view>
    
    <!-- 错误状态 -->
    <view class="error-state" v-else
    >
      <view class="error-icon">⚠️</view>
      <text class="error-title">公告加载失败</text>
      <text class="error-desc">请检查网络连接后重试</text>
      <view class="retry-btn" @click="fetchNoticeDetail"
      >
        <text>重新加载</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.notice-detail-page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 160rpx;
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 32rpx;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid $warm-gray-200;
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

// 公告内容容器
.notice-content-wrapper {
  padding: 24rpx;
}

// 头部卡片
.notice-header-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
}

.type-tag {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 24rpx;
  border-radius: $radius-full;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.type-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.notice-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.5;
  margin-bottom: 32rpx;
}

.notice-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: $warm-gray-500;
}

.meta-icon {
  margin-right: 8rpx;
  font-size: 24rpx;
}

.meta-divider {
  width: 4rpx;
  height: 24rpx;
  background: $warm-gray-300;
  border-radius: 2rpx;
}

// 正文卡片
.notice-body-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
}

.content-text {
  font-size: 30rpx;
  color: $text-primary;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

// 附件卡片
.attachments-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
}

.attachments-header {
  display: flex;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1px solid $warm-gray-100;
  margin-bottom: 16rpx;
}

.attachments-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.attachments-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: $bg-secondary;
  border-radius: $radius-md;
  margin-bottom: 16rpx;
  transition: all 0.2s ease;
}

.attachment-item:last-child {
  margin-bottom: 0;
}

.attachment-item:active {
  background: $sage-100;
  transform: scale(0.98);
}

.attachment-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 24rpx;
  color: $warm-gray-400;
}

.download-icon {
  font-size: 36rpx;
  margin-left: 16rpx;
}

// 底部操作栏
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, $sage-500, $sage-600);
  border-radius: $radius-full;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: $shadow-md;
  transition: all 0.2s ease;
}

.back-btn:active {
  transform: scale(0.98);
  box-shadow: $shadow-sm;
}

.back-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

// 错误状态
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 32rpx;
  text-align: center;
}

.error-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.error-title {
  font-size: 36rpx;
  font-weight: 500;
  color: $warm-gray-600;
  margin-bottom: 16rpx;
}

.error-desc {
  font-size: 28rpx;
  color: $warm-gray-400;
  margin-bottom: 48rpx;
}

.retry-btn {
  padding: 24rpx 64rpx;
  background: linear-gradient(135deg, $sage-500, $sage-600);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: $radius-full;
  box-shadow: $shadow-sm;
}
</style>