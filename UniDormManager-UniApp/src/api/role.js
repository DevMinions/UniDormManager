
import { request } from '@/utils/request.js'

export const roleApi = {
  // 获取所有角色
  getAllRoles() {
    return request({
      url: '/api/roles',
      method: 'GET'
    })
  },

  // 获取角色详情
  getRoleById(id) {
    return request({
      url: `/api/roles/${id}`,
      method: 'GET'
    })
  },

  // 创建角色
  createRole(data) {
    return request({
      url: '/api/roles',
      method: 'POST',
      data
    })
  },

  // 更新角色
  updateRole(id, data) {
    return request({
      url: `/api/roles/${id}`,
      method: 'PUT',
      data
    })
  },

  // 删除角色
  deleteRole(id) {
    return request({
      url: `/api/roles/${id}`,
      method: 'DELETE'
    })
  },

  // 获取所有权限
  getAllPermissions() {
    return request({
      url: '/api/permissions',
      method: 'GET'
    })
  }
}
