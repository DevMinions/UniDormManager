
import { request } from '@/utils/request.js'

export const roleApi = {
  // 获取所有角色
  getAllRoles() {
    return request.get('/api/roles')
  },

  // 获取角色详情
  getRoleById(id) {
    return request.get(`/api/roles/${id}`)
  },

  // 创建角色
  createRole(data) {
    return request.post('/api/roles', data)
  },

  // 更新角色
  updateRole(id, data) {
    return request.put(`/api/roles/${id}`, data)
  },

  // 删除角色
  deleteRole(id) {
    return request.delete(`/api/roles/${id}`)
  },

  // 获取所有权限
  getAllPermissions() {
    return request.get('/api/permissions')
  }
}

export default roleApi
