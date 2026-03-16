// ============================================
// API 接口模块 - 用户相关
// ============================================

import request from '@/utils/request.js'

export const userApi = {
  // 用户登录
  login(data) {
    return request.post('/api/auth/login', data)
  },
  
  // 用户注册
  register(data) {
    return request.post('/api/auth/register', data)
  },
  
  // 获取当前用户信息
  getUserInfo() {
    return request.get('/api/auth/me')
  },
  
  // 获取用户列表 (管理员)
  getUserList(params = {}) {
    return request.get('/api/users', params)
  },
  
  // 获取用户详情
  getUserById(id) {
    return request.get(`/api/users/${id}`)
  },
  
  // 更新用户信息
  updateUser(id, data) {
    return request.put(`/api/users/${id}`, data)
  },
  
  // 删除用户 (管理员)
  deleteUser(id) {
    return request.delete(`/api/users/${id}`)
  },
  
  // 分配角色 (管理员)
  assignRoles(id, roles) {
    return request.post(`/api/users/${id}/roles`, { roles })
  },
  
  // 用户退出
  logout() {
    return request.post('/api/auth/logout')
  }
}

export default userApi
