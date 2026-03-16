// ============================================
// API 接口模块 - 楼栋管理
// ============================================

import request from '@/utils/request.js'

export const buildingApi = {
  // 获取所有楼栋
  getAllBuildings() {
    return request.get('/api/buildings')
  },

  // 获取楼栋详情
  getBuildingById(id) {
    return request.get(`/api/buildings/${id}`)
  },

  // 创建楼栋
  createBuilding(data) {
    return request.post('/api/buildings', data)
  },

  // 更新楼栋
  updateBuilding(id, data) {
    return request.put(`/api/buildings/${id}`, data)
  },

  // 删除楼栋
  deleteBuilding(id) {
    return request.delete(`/api/buildings/${id}`)
  }
}

export default buildingApi
