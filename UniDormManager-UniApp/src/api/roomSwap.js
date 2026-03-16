// ============================================
// API 接口模块 - 换寝申请相关
// ============================================

import request from '@/utils/request.js'

export const roomSwapApi = {
  // 获取我的换寝申请列表
  getMyApplications() {
    return request.get('/api/room-swaps')
  },

  // 获取待审批的申请列表（管理员）
  getPendingApplications() {
    return request.get('/api/room-swaps/pending')
  },

  // 提交换寝申请
  createApplication(data) {
    return request.post('/api/room-swaps', data)
  },

  // 审批换寝申请（管理员）
  approveApplication(id, data) {
    return request.post(`/api/room-swaps/${id}/approve`, data)
  }
}

export default roomSwapApi
