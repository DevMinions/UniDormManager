<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/modules/user'
import { roleApi } from '@/api/role.js'
import { isSystemAdmin } from '@/config/roles.js'
import { handleApiError, showSuccess, showError } from '@/utils/index.js'
import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

const userStore = useUserStore()

// 页面参数
const roleId = ref(null)
const isEdit = computed(() => !!roleId.value)
const isLoading = ref(false)
const isSaving = ref(false)

// 权限检查
const checkAuth = () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  const roles = userStore.userInfo?.roles?.map(r => typeof r === 'string' ? r : r.code) || []
  if (!isSystemAdmin(roles)) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return false
  }
  return true
}

// 表单数据
const form = ref({
  code: '',
  name: '',
  description: '',
  level: 3,
  permissions: []
})

// 权限列表（按模块分组）
const permissions = ref([])
const permissionGroups = computed(() => {
  const groups = {}
  permissions.value.forEach(p => {
    const module = p.code.split(':')[0] || 'other'
    if (!groups[module]) {
      groups[module] = {
        name: getModuleName(module),
        permissions: []
      }
    }
    groups[module].permissions.push(p)
  })
  return groups
})

// 获取模块名称
const getModuleName = (module) => {
  const names = {
    'users': '👤 用户管理',
    'students': '👨‍🎓 学生管理',
    'rooms': '🏠 房间管理',
    'buildings': '🏢 楼栋管理',
    'repairs': '🔧 报修管理',
    'notices': '📢 公告管理',
    'inspections': '📋 查寝管理',
    'roles': '🔐 角色权限',
    'dashboard': '📊 数据统计',
    'other': '📦 其他'
  }
  return names[module] || module
}

// 预定义角色（不可修改基本信息）
const predefinedRoles = ['student', 'dorm_manager', 'maintenance_staff', 'building_manager', 'logistics_admin', 'system_admin']
const isPredefined = computed(() => {
  return predefinedRoles.includes(form.value.code)
})

// 页面加载
onLoad((options) => {
  if (!checkAuth()) return
  
  roleId.value = options.id
  loadPermissions()
  if (isEdit.value) {
    loadRoleDetail()
  }
})

// 加载角色详情
const loadRoleDetail = async () => {
  isLoading.value = true
  try {
    const res = await roleApi.getRoleById(roleId.value)
    if (res) {
      form.value = {
        code: res.code || '',
        name: res.name || '',
        description: res.description || '',
        level: res.level || 3,
        permissions: res.permissions?.map(p => p.code || p) || []
      }
    }
  } catch (error) {
    handleApiError(error, '获取角色详情失败')
  } finally {
    isLoading.value = false
  }
}

// 加载权限列表
const loadPermissions = async () => {
  try {
    const res = await roleApi.getAllPermissions()
    permissions.value = res || []
  } catch (error) {
    console.error('获取权限列表失败', error)
  }
}

// 切换权限选中状态
const togglePermission = (code) => {
  const index = form.value.permissions.indexOf(code)
  if (index > -1) {
    form.value.permissions.splice(index, 1)
  } else {
    form.value.permissions.push(code)
  }
}

// 检查权限是否选中
const isPermissionSelected = (code) => {
  return form.value.permissions.includes(code)
}

// 全选/取消全选某模块权限
const toggleModulePermissions = (modulePermissions, selected) => {
  modulePermissions.forEach(p => {
    const index = form.value.permissions.indexOf(p.code)
    if (selected && index === -1) {
      form.value.permissions.push(p.code)
    } else if (!selected && index > -1) {
      form.value.permissions.splice(index, 1)
    }
  })
}

// 检查模块是否全选
const isModuleAllSelected = (modulePermissions) => {
  return modulePermissions.every(p => form.value.permissions.includes(p.code))
}

// 检查模块是否部分选中
const isModulePartialSelected = (modulePermissions) => {
  const selected = modulePermissions.filter(p => form.value.permissions.includes(p.code))
  return selected.length > 0 && selected.length < modulePermissions.length
}

// 表单验证
const validateForm = () => {
  if (!form.value.code.trim()) {
    showError('请输入角色代码')
    return false
  }
  if (!form.value.name.trim()) {
    showError('请输入角色名称')
    return false
  }
  if (!/^[a-z_]+$/.test(form.value.code)) {
    showError('角色代码只能包含小写字母和下划线')
    return false
  }
  return true
}

// 保存角色
const saveRole = async () => {
  if (!validateForm()) return
  
  isSaving.value = true
  try {
    const data = {
      code: form.value.code.trim(),
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      level: parseInt(form.value.level),
      permissions: form.value.permissions
    }
    
    if (isEdit.value) {
      await roleApi.updateRole(roleId.value, data)
      showSuccess('更新成功')
    } else {
      await roleApi.createRole(data)
      showSuccess('创建成功')
    }
    
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (error) {
    handleApiError(error, isEdit.value ? '更新失败' : '创建失败')
  } finally {
    isSaving.value = false
  }
}

// 获取权限描述
const getPermissionDesc = (code) => {
  const descs = {
    'users:read': '查看用户列表',
    'users:create': '创建新用户',
    'users:update': '编辑用户信息',
    'users:delete': '删除用户',
    'students:read': '查看学生信息',
    'students:create': '录入学生信息',
    'students:update': '编辑学生信息',
    'students:delete': '删除学生',
    'rooms:read': '查看房间信息',
    'rooms:create': '创建房间',
    'rooms:update': '编辑房间信息',
    'rooms:delete': '删除房间',
    'buildings:read': '查看楼栋信息',
    'buildings:create': '创建楼栋',
    'buildings:update': '编辑楼栋信息',
    'buildings:delete': '删除楼栋',
    'repairs:read': '查看报修记录',
    'repairs:create': '提交报修',
    'repairs:update': '处理报修',
    'repairs:delete': '删除报修记录',
    'notices:read': '查看公告',
    'notices:create': '发布公告',
    'notices:update': '编辑公告',
    'notices:delete': '删除公告',
    'inspections:read': '查看查寝记录',
    'inspections:create': '录入查寝评分',
    'inspections:update': '修改查寝记录',
    'inspections:delete': '删除查寝记录',
    'roles:read': '查看角色权限',
    'roles:create': '创建角色',
    'roles:update': '编辑角色权限',
    'roles:delete': '删除角色',
    'dashboard:read': '查看数据统计'
  }
  return descs[code] || code
}

// 获取权限类型图标
const getPermissionIcon = (code) => {
  if (code.endsWith(':read')) return '👁️'
  if (code.endsWith(':create')) return '➕'
  if (code.endsWith(':update')) return '✏️'
  if (code.endsWith(':delete')) return '🗑️'
  return '🔑'
}
</script>

<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <AppNavbar :title="isEdit ? '编辑角色' : '新增角色'" show-back />
    
    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <view v-else class="form-container">
      <!-- 基本信息卡片 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-icon">📝</text>
          <text class="card-title">基本信息</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">角色代码 <text class="required">*</text></text>
          <input
            v-model="form.code"
            type="text"
            placeholder="如: custom_manager"
            class="form-input"
            :disabled="isEdit || isPredefined"
          />
          <text class="form-hint">只能包含小写字母和下划线</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">角色名称 <text class="required">*</text></text>
          <input
            v-model="form.name"
            type="text"
            placeholder="如: 自定义管理员"
            class="form-input"
            :disabled="isPredefined"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">角色级别 <text class="required">*</text></text>
          <view class="level-selector">
            <view
              v-for="level in [1, 2, 3, 4, 5]"
              :key="level"
              class="level-option"
              :class="{ active: form.level === level }"
              @click="form.level = level"
            >
              <text class="level-text">{{ level }}级</text>
            </view>
          </view>
          <text class="form-hint">级别越高，权限越大（5级为系统管理员）</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">角色描述</text>
          <textarea
            v-model="form.description"
            placeholder="请输入角色描述..."
            class="form-textarea"
            :disabled="isPredefined"
          />
        </view>
        
        <view v-if="isPredefined" class="warning-banner">
          <text class="warning-icon">⚠️</text>
          <text class="warning-text">系统预定义角色，基本信息不可修改</text>
        </view>
      </view>
      
      <!-- 权限配置卡片 -->
      <view class="form-card">
        <view class="card-header">
          <text class="card-icon">🔐</text>
          <text class="card-title">权限配置</text>
          <text class="permission-count">已选 {{ form.permissions.length }} 项</text>
        </view>
        
        <view class="permission-groups">
          <view
            v-for="(group, module) in permissionGroups"
            :key="module"
            class="permission-group"
          >
            <!-- 组标题 -->
            <view class="group-header">
              <view
                class="group-checkbox"
                :class="{
                  'checked': isModuleAllSelected(group.permissions),
                  'partial': isModulePartialSelected(group.permissions)
                }"
                @click="toggleModulePermissions(group.permissions, !isModuleAllSelected(group.permissions))"
              >
                <text class="checkbox-icon">
                  {{ isModuleAllSelected(group.permissions) ? '✓' : isModulePartialSelected(group.permissions) ? '−' : '' }}
                </text>
              </view>
              <text class="group-name">{{ group.name }}</text>
              <text class="group-count">{{ group.permissions.filter(p => isPermissionSelected(p.code)).length }}/{{ group.permissions.length }}</text>
            </view>
            
            <!-- 权限列表 -->
            <view class="permission-list"
            >
              <view
                v-for="permission in group.permissions"
                :key="permission.code"
                class="permission-item"
                :class="{ selected: isPermissionSelected(permission.code) }"
                @click="togglePermission(permission.code)"
              >
                <view class="permission-checkbox"
                >
                  <text v-if="isPermissionSelected(permission.code)" class="check-icon">✓</text>
                </view>
                <text class="permission-icon">{{ getPermissionIcon(permission.code) }}</text>
                <view class="permission-info"
                >
                  <text class="permission-code">{{ permission.code }}</text>
                  <text class="permission-desc">{{ getPermissionDesc(permission.code) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 保存按钮 -->
      <view class="action-section"
        >
        <button
          class="save-btn"
          :class="{ loading: isSaving }"
          :disabled="isSaving"
          @click="saveRole"
        >
          <text v-if="isSaving" class="btn-spinner">⏳</text>
          <text class="btn-text">{{ isSaving ? '保存中...' : (isEdit ? '保存修改' : '创建角色') }}</text>
        </button>
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

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
  
  .loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 4rpx solid #F3F4F6;
    border-top-color: #9A3412;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #9CA3AF;
  }
}

// 表单容器
.form-container {
  padding: 24rpx 32rpx;
  
  .form-card {
    background: #FFFFFF;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 32rpx;
      padding-bottom: 24rpx;
      border-bottom: 2rpx solid #F3F4F6;
      
      .card-icon {
        font-size: 40rpx;
      }
      
      .card-title {
        flex: 1;
        font-size: 32rpx;
        font-weight: 600;
        color: #1F2937;
      }
      
      .permission-count {
        font-size: 26rpx;
        color: #9A3412;
        font-weight: 500;
        background: #FEF3C7;
        padding: 8rpx 20rpx;
        border-radius: 12rpx;
      }
    }
  }
}

// 表单项
.form-item {
  margin-bottom: 32rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .form-label {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: #374151;
    margin-bottom: 16rpx;
    
    .required {
      color: #DC2626;
      margin-left: 4rpx;
    }
  }
  
  .form-input {
    width: 100%;
    height: 88rpx;
    background: #F9FAFB;
    border: 2rpx solid #E5E7EB;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1F2937;
    box-sizing: border-box;
    
    &:disabled {
      background: #F3F4F6;
      color: #9CA3AF;
    }
    
    &:focus {
      border-color: #9A3412;
      background: #FFFFFF;
    }
  }
  
  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    background: #F9FAFB;
    border: 2rpx solid #E5E7EB;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #1F2937;
    box-sizing: border-box;
    
    &:disabled {
      background: #F3F4F6;
      color: #9CA3AF;
    }
  }
  
  .form-hint {
    display: block;
    font-size: 24rpx;
    color: #9CA3AF;
    margin-top: 12rpx;
  }
}

// 级别选择器
.level-selector {
  display: flex;
  gap: 16rpx;
  
  .level-option {
    flex: 1;
    height: 72rpx;
    background: #F3F4F6;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .level-text {
      font-size: 26rpx;
      color: #6B7280;
      font-weight: 500;
    }
    
    &.active {
      background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
      
      .level-text {
        color: #FFFFFF;
      }
    }
  }
}

// 警告横幅
.warning-banner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #FEF3C7;
  border: 2rpx solid #FDE68A;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-top: 24rpx;
  
  .warning-icon {
    font-size: 32rpx;
  }
  
  .warning-text {
    font-size: 26rpx;
    color: #92400E;
  }
}

// 权限组
.permission-groups {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.permission-group {
  background: #F9FAFB;
  border-radius: 20rpx;
  padding: 24rpx;
  
  .group-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
    
    .group-checkbox {
      width: 44rpx;
      height: 44rpx;
      border: 2rpx solid #D1D5DB;
      border-radius: 10rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      
      &.checked {
        background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
        border-color: #9A3412;
        
        .checkbox-icon {
          color: #FFFFFF;
          font-size: 28rpx;
          font-weight: 600;
        }
      }
      
      &.partial {
        background: #FEF3C7;
        border-color: #F59E0B;
        
        .checkbox-icon {
          color: #F59E0B;
          font-size: 28rpx;
          font-weight: 600;
        }
      }
    }
    
    .group-name {
      flex: 1;
      font-size: 30rpx;
      font-weight: 600;
      color: #1F2937;
    }
    
    .group-count {
      font-size: 24rpx;
      color: #9CA3AF;
      background: #F3F4F6;
      padding: 6rpx 16rpx;
      border-radius: 10rpx;
    }
  }
}

// 权限列表
.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #FFFFFF;
  border: 2rpx solid #E5E7EB;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  flex: 1;
  min-width: 280rpx;
  
  .permission-checkbox {
    width: 40rpx;
    height: 40rpx;
    border: 2rpx solid #D1D5DB;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F9FAFB;
    
    .check-icon {
      font-size: 24rpx;
      color: #9A3412;
      font-weight: 600;
    }
  }
  
  .permission-icon {
    font-size: 28rpx;
  }
  
  .permission-info {
    flex: 1;
    min-width: 0;
    
    .permission-code {
      display: block;
      font-size: 24rpx;
      color: #6B7280;
      font-family: monospace;
      margin-bottom: 2rpx;
    }
    
    .permission-desc {
      font-size: 26rpx;
      color: #1F2937;
      font-weight: 500;
    }
  }
  
  &.selected {
    border-color: #9A3412;
    background: #FFF7ED;
    
    .permission-checkbox {
      border-color: #9A3412;
      background: #FFFFFF;
    }
  }
}

// 操作区域
.action-section {
  padding: 24rpx 0;
  
  .save-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #9A3412 0%, #C2410C 100%);
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    box-shadow: 0 8rpx 24rpx rgba(154, 52, 18, 0.3);
    border: none;
    
    &.disabled {
      opacity: 0.6;
    }
    
    .btn-spinner {
      font-size: 32rpx;
    }
    
    .btn-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
