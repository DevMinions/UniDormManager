import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user.js'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref(uni.getStorageSync('userInfo') || null)
  const permissions = ref([])
  const loading = ref(false)
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || 'student')
  const userRoleName = computed(() => {
    const roleMap = {
      student: '学生',
      dorm_manager: '宿管',
      maintenance: '维修人员',
      admin: '管理员'
    }
    return roleMap[userRole.value] || '学生'
  })
  
  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }
  
  const setUserInfo = (info) => {
    userInfo.value = info
    uni.setStorageSync('userInfo', info)
  }
  
  const setPermissions = (perms) => {
    permissions.value = perms
  }
  
  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true
      const data = await userApi.login(credentials)
      
      setToken(data.token)
      setUserInfo(data.user)
      
      return { success: true, data }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const data = await userApi.getUserInfo()
      setUserInfo(data)
      return { success: true, data }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 检查登录状态
  const checkLoginStatus = () => {
    const storedToken = uni.getStorageSync('token')
    const storedUserInfo = uni.getStorageSync('userInfo')
    
    if (storedToken && storedUserInfo) {
      token.value = storedToken
      userInfo.value = storedUserInfo
      
      // 可以在这里验证 token 是否有效
      // fetchUserInfo()
      
      return true
    }
    return false
  }
  
  // 退出登录
  const logout = async () => {
    try {
      // 调用退出 API（可选，取决于后端实现）
      // await userApi.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      token.value = ''
      userInfo.value = null
      permissions.value = []
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      
      uni.reLaunch({
        url: '/pages/login/login'
      })
    }
  }
  
  return {
    token,
    userInfo,
    permissions,
    loading,
    isLoggedIn,
    userRole,
    userRoleName,
    setToken,
    setUserInfo,
    setPermissions,
    login,
    fetchUserInfo,
    checkLoginStatus,
    logout
  }
})
