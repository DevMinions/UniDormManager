<!-- ============================================ -->
<!-- 图表组件 - 使用 ECharts 或简易 Canvas 实现 -->
<!-- ============================================ -->

<template>
  <view class="chart-container" :style="{ height: height + 'rpx' }">
    <!-- 标题 -->
    <view v-if="title" class="chart-title">{{ title }}</view>
    
    <!-- Canvas 图表 -->
    <canvas 
      :id="canvasId"
      :canvas-id="canvasId"
      class="chart-canvas"
      :style="{ width: width + 'rpx', height: chartHeight + 'rpx' }"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
    />
    
    <!-- 图例 -->
    <view v-if="showLegend" class="chart-legend">
      <view 
        v-for="(item, index) in legendData" 
        :key="index"
        class="legend-item"
      >
        <view class="legend-color" :style="{ background: item.color }"></view>
        <text class="legend-text">{{ item.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  // 图表类型：line, bar, pie, ring
  type: {
    type: String,
    default: 'line'
  },
  // 图表标题
  title: {
    type: String,
    default: ''
  },
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // X轴数据（非饼图）
  xAxis: {
    type: Array,
    default: () => []
  },
  // 宽度（rpx）
  width: {
    type: Number,
    default: 686
  },
  // 高度（rpx）
  height: {
    type: Number,
    default: 400
  },
  // 颜色配置
  colors: {
    type: Array,
    default: () => ['#9A3412', '#059669', '#3B82F6', '#D97706', '#7C3AED']
  },
  // 显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 显示数值
  showValue: {
    type: Boolean,
    default: true
  }
})

// 生成唯一ID
const canvasId = 'chart_' + Math.random().toString(36).substr(2, 9)

// 计算图表高度（减去标题和图例）
const chartHeight = computed(() => {
  let h = props.height
  if (props.title) h -= 60
  if (props.showLegend) h -= 60
  return h
})

// 图例数据
const legendData = computed(() => {
  if (props.type === 'pie' || props.type === 'ring') {
    return props.data.map((item, index) => ({
      name: item.name,
      color: props.colors[index % props.colors.length]
    }))
  }
  return []
})

// Canvas 上下文
let ctx = null

// 绘制图表
const drawChart = () => {
  if (!ctx) {
    ctx = uni.createCanvasContext(canvasId)
  }
  
  const width = props.width
  const height = chartHeight.value
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  switch (props.type) {
    case 'line':
      drawLineChart(width, height)
      break
    case 'bar':
      drawBarChart(width, height)
      break
    case 'pie':
      drawPieChart(width, height, false)
      break
    case 'ring':
      drawPieChart(width, height, true)
      break
  }
  
  ctx.draw()
}

// 绘制折线图
const drawLineChart = (width, height) => {
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  // 找出最大最小值
  const values = props.data
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  
  // 绘制坐标轴
  ctx.beginPath()
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 1
  
  // Y轴
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  
  // X轴
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.stroke()
  
  // 绘制网格线
  ctx.beginPath()
  ctx.strokeStyle = '#F3F4F6'
  for (let i = 1; i <= 4; i++) {
    const y = padding + (chartHeight / 5) * i
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
  }
  ctx.stroke()
  
  // 绘制折线
  if (values.length > 0) {
    ctx.beginPath()
    ctx.strokeStyle = props.colors[0]
    ctx.lineWidth = 3
    
    values.forEach((value, index) => {
      const x = padding + (chartWidth / (values.length - 1)) * index
      const y = height - padding - ((value - minValue) / range) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // 绘制数据点
    values.forEach((value, index) => {
      const x = padding + (chartWidth / (values.length - 1)) * index
      const y = height - padding - ((value - minValue) / range) * chartHeight
      
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = props.colors[0]
      ctx.lineWidth = 2
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      
      // 显示数值
      if (props.showValue) {
        ctx.fillStyle = '#374151'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(value.toString(), x, y - 15)
      }
    })
  }
  
  // 绘制X轴标签
  ctx.fillStyle = '#6B7280'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  props.xAxis.forEach((label, index) => {
    const x = padding + (chartWidth / (props.xAxis.length - 1)) * index
    ctx.fillText(label, x, height - padding + 20)
  })
}

// 绘制柱状图
const drawBarChart = (width, height) => {
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const data = props.data
  const maxValue = Math.max(...data.map(d => d.value))
  
  const barWidth = (chartWidth / data.length) * 0.6
  const spacing = (chartWidth / data.length) * 0.4
  
  data.forEach((item, index) => {
    const x = padding + spacing / 2 + (barWidth + spacing) * index
    const barHeight = (item.value / maxValue) * chartHeight
    const y = height - padding - barHeight
    
    // 绘制柱子
    ctx.fillStyle = props.colors[index % props.colors.length]
    ctx.fillRect(x, y, barWidth, barHeight)
    
    // 显示数值
    if (props.showValue) {
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 10)
    }
    
    // X轴标签
    ctx.fillStyle = '#6B7280'
    ctx.font = '11px sans-serif'
    ctx.fillText(item.name, x + barWidth / 2, height - padding + 20)
  })
}

// 绘制饼图/环形图
const drawPieChart = (width, height, isRing) => {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(centerX, centerY) - 40
  const innerRadius = isRing ? radius * 0.5 : 0
  
  const total = props.data.reduce((sum, item) => sum + item.value, 0)
  let startAngle = -Math.PI / 2
  
  props.data.forEach((item, index) => {
    const angle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + angle
    const color = props.colors[index % props.colors.length]
    
    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    
    // 环形图：挖空中间
    if (isRing) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    }
    
    startAngle = endAngle
  })
  
  // 中心文字
  if (isRing) {
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('总计', centerX, centerY - 10)
    ctx.font = '12px sans-serif'
    ctx.fillText(total.toString(), centerX, centerY + 15)
  }
}

// 触摸事件（用于交互）
const touchStart = (e) => {
  // 可扩展：显示 tooltip
}

const touchMove = (e) => {
  // 可扩展：拖动查看
}

const touchEnd = (e) => {
  // 可扩展：点击事件
}

// 监听数据变化
watch(() => props.data, drawChart, { deep: true })

// 初始化
onMounted(() => {
  setTimeout(drawChart, 100)
})

// 暴露方法
defineExpose({
  drawChart
})
</script>

<style lang="scss" scoped>
.chart-container {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid #F2E6E2;
}

.chart-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 20rpx;
  text-align: center;
}

.chart-canvas {
  display: block;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-color {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx;
}

.legend-text {
  font-size: 24rpx;
  color: #64748B;
}
</style>
