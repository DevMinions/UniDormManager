// ============================================
// API 接口模块 - 晚归告警
// ============================================

import request from '@/utils/request.js'

export const lateReturnApi = {
  // 获取晚归告警列表
  getLateReturns(params = {}) {
    return request.get('/api/late-returns', params)
  },

  // 获取待处理的告警
  getPendingLateReturns() {
    return request.get('/api/late-returns/pending')
  },

  // 处理晚归告警
  handleLateReturn(id, data) {
    return request.post(`/api/late-returns/${id}/handle`, data)
  }
}

export default lateReturnApi
