import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const systemInfo = ref({})
  const isLoading = ref(false)
  const loadingText = ref('加载中...')
  
  // Actions
  const getSystemInfo = async () => {
    try {
      const info = await uni.getSystemInfo()
      systemInfo.value = info
      return info
    } catch (error) {
      console.error('获取系统信息失败:', error)
      return null
    }
  }
  
  const showLoading = (text = '加载中...') => {
    loadingText.value = text
    isLoading.value = true
    uni.showLoading({
      title: text,
      mask: true
    })
  }
  
  const hideLoading = () => {
    isLoading.value = false
    uni.hideLoading()
  }
  
  const showToast = (title, icon = 'none', duration = 2000) => {
    uni.showToast({
      title,
      icon,
      duration
    })
  }
  
  const showModal = (title, content) => {
    return new Promise((resolve) => {
      uni.showModal({
        title,
        content,
        success: (res) => {
          resolve(res.confirm)
        }
      })
    })
  }
  
  return {
    systemInfo,
    isLoading,
    loadingText,
    getSystemInfo,
    showLoading,
    hideLoading,
    showToast,
    showModal
  }
})
