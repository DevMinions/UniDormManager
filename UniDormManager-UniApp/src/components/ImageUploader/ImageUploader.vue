<script setup>
import { ref, computed } from 'vue'
import { request } from '@/utils/request'

/**
 * ImageUploader 图片上传组件
 * 支持多图上传、预览、删除
 */
const props = defineProps({
  // 当前图片列表
  modelValue: {
    type: Array,
    default: () => []
  },
  // 最大上传数量
  maxCount: {
    type: Number,
    default: 6
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 上传提示文字
  tip: {
    type: String,
    default: ''
  },
  // 是否自动上传
  autoUpload: {
    type: Boolean,
    default: false
  },
  // 上传接口地址
  uploadUrl: {
    type: String,
    default: '/api/upload/image'
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'success', 'error', 'delete'])

// 本地图片列表
const fileList = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)

// 预览状态
const previewIndex = ref(0)
const showPreview = ref(false)

// 是否显示添加按钮
const showAdd = computed(() => {
  return !props.disabled && fileList.value.length < props.maxCount
})

// 选择图片
const chooseImage = () => {
  if (props.disabled || uploading.value) return
  
  const remainingCount = props.maxCount - fileList.value.length
  const count = props.multiple ? remainingCount : 1
  
  uni.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFiles = res.tempFiles.map(file => ({
        url: file.path,
        status: 'pending',
        name: file.name || 'image.jpg'
      }))
      
      // 添加到列表
      const newList = [...fileList.value, ...tempFiles]
      fileList.value = newList.slice(0, props.maxCount)
      
      // 自动上传
      if (props.autoUpload) {
        tempFiles.forEach((file, index) => {
          uploadFile(file, fileList.value.length - tempFiles.length + index)
        })
      }
    }
  })
}

// 上传文件
const uploadFile = async (file, index) => {
  if (!file.url || file.status === 'success') return
  
  uploading.value = true
  fileList.value[index].status = 'uploading'
  
  try {
    const result = await request.upload(props.uploadUrl, file.url, {
      name: 'file',
      formData: {
        type: 'image'
      }
    })
    
    fileList.value[index] = {
      ...fileList.value[index],
      url: result.url || file.url,
      status: 'success',
      id: result.id
    }
    
    emit('success', { file: fileList.value[index], index })
  } catch (error) {
    fileList.value[index].status = 'error'
    emit('error', { error, file, index })
  } finally {
    uploading.value = false
  }
}

// 删除图片
const deleteImage = (index) => {
  if (props.disabled) return
  
  uni.showModal({
    title: '提示',
    content: '确定删除这张图片吗？',
    confirmColor: '#c1666b',
    success: (res) => {
      if (res.confirm) {
        const deletedFile = fileList.value[index]
        const newList = [...fileList.value]
        newList.splice(index, 1)
        fileList.value = newList
        emit('delete', { file: deletedFile, index })
      }
    }
  })
}

// 预览图片
const previewImage = (index) => {
  previewIndex.value = index
  showPreview.value = true
  
  uni.previewImage({
    current: fileList.value[index].url,
    urls: fileList.value.map(f => f.url)
  })
}

// 重新上传
const retryUpload = (index) => {
  uploadFile(fileList.value[index], index)
}
</script>

<template>
  <view class="image-uploader" :class="{ 'is-disabled': disabled }">
    <!-- 图片列表 -->
    <view class="uploader-list">
      <view 
        v-for="(file, index) in fileList" 
        :key="index"
        class="uploader-item"
        :class="{ 'is-error': file.status === 'error' }"
        @click="previewImage(index)"
      >
        <!-- 图片 -->
        <image 
          class="uploader-image" 
          :src="file.url" 
          mode="aspectFill"
        />
        
        <!-- 删除按钮 -->
        <view 
          v-if="!disabled" 
          class="uploader-delete"
          @click.stop="deleteImage(index)"
        >
          <text class="delete-icon">×</text>
        </view>
        
        <!-- 上传中遮罩 -->
        <view v-if="file.status === 'uploading'" class="uploader-mask">
          <text class="uploading-icon">⟳</text>
          <text class="uploading-text">上传中...</text>
        </view>
        
        <!-- 上传失败 -->
        <view 
          v-if="file.status === 'error'" 
          class="uploader-mask error"
          @click.stop="retryUpload(index)"
        >
          <text class="error-icon">!</text>
          <text class="error-text">点击重试</text>
        </view>
      </view>
      
      <!-- 添加按钮 -->
      <view 
        v-if="showAdd" 
        class="uploader-add"
        @click="chooseImage"
      >
        <text class="add-icon">+</text>
        <text class="add-text">{{ fileList.length }}/{{ maxCount }}</text>
      </view>
    </view>
    
    <!-- 提示文字 -->
    <text v-if="tip" class="uploader-tip">{{ tip }}</text>
  </view>
</template>

<style lang="scss" scoped>
.image-uploader {
  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

// 图片列表
.uploader-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

// 单个图片项
.uploader-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: $warm-gray-50;
  
  &.is-error {
    border: 2rpx solid $error;
  }
}

.uploader-image {
  width: 100%;
  height: 100%;
}

// 删除按钮
.uploader-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .delete-icon {
    color: white;
    font-size: 28rpx;
    line-height: 1;
  }
}

// 遮罩层
.uploader-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  &.error {
    background: rgba(193, 102, 107, 0.8);
  }
  
  .uploading-icon {
    color: white;
    font-size: 40rpx;
    animation: rotate 1s linear infinite;
  }
  
  .uploading-text,
  .error-text {
    color: white;
    font-size: 22rpx;
    margin-top: 8rpx;
  }
  
  .error-icon {
    color: white;
    font-size: 40rpx;
    font-weight: bold;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 添加按钮
.uploader-add {
  width: 200rpx;
  height: 200rpx;
  border-radius: 16rpx;
  border: 2rpx dashed $warm-gray-300;
  background: $sage-50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:active {
    background: $sage-100;
    border-color: $sage-400;
  }
  
  .add-icon {
    font-size: 56rpx;
    color: $sage-500;
    line-height: 1;
    margin-bottom: 8rpx;
  }
  
  .add-text {
    font-size: 24rpx;
    color: $text-tertiary;
  }
}

// 提示文字
.uploader-tip {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $text-tertiary;
}
</style>
