<script setup>
defineProps({
  notices: {
    type: Array,
    required: true
    // { id, title, time, icon?, iconBg?, iconBorder?, borderColor? }
  }
})

const emit = defineEmits(['click'])

const handleClick = (notice) => {
  emit('click', notice)
}
</script>

<template>
  <view class="notice-list">
    <view 
      v-for="notice in notices" 
      :key="notice.id"
      class="notice-card"
      :style="{ borderLeftColor: notice.borderColor || '#c4a77d' }"
      @click="handleClick(notice)"
    >
      <view 
        class="notice-icon"
        :style="{ 
          background: notice.iconBg || '#fdf6f0',
          borderColor: notice.iconBorder || '#e8d5c4'
        }"
      >
        {{ notice.icon || '📢' }}
      </view>
      
      <view class="notice-content">
        <view class="notice-title">{{ notice.title }}</view>
        <view class="notice-time">{{ notice.time }}</view>
      </view>
      
      <view class="notice-arrow">›</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notice-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8e4df;
  border-left: 3px solid;
  transition: all 0.2s ease;
}

.notice-card:active {
  transform: translateX(4px);
}

.notice-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-time {
  font-size: 12px;
  color: #999;
}

.notice-arrow {
  color: #b5b5b5;
  font-size: 20px;
  font-weight: 300;
}
</style>
