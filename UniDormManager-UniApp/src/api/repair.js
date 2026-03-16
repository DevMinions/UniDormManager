// ============================================
// API 接口模块 - 报修相关
// ============================================

import request from '@/utils/request.js'

export const repairApi = {
  // 获取报修列表
  getRepairList(params = {}) {
    return request.get('/api/repairs', params)
  },
  
  // 获取所有报修 (不分页)
  getAllRepairs() {
    return request.get('/api/repairs/all')
  },
  
  // 获取报修详情
  getRepairDetail(id) {
    return request.get(`/api/repairs/${id}`)
  },
  
  // 创建报修
  createRepair(data) {
    return request.post('/api/repairs', data)
  },
  
  // 更新报修
  updateRepair(id, data) {
    return request.put(`/api/repairs/${id}`, data)
  },
  
  // 删除报修
  deleteRepair(id) {
    return request.delete(`/api/repairs/${id}`)
  },
  
  // 上传报修图片
  uploadImage(filePath) {
    return request.upload('/api/upload/image', filePath, {
      name: 'image'
    })
  }
}

export default repairApi
