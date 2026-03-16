// ============================================
// API 接口模块 - 门禁记录
// ============================================

import request from '@/utils/request.js'

export const accessLogApi = {
  // 获取门禁记录列表
  getAccessLogs(params = {}) {
    return request.get('/api/access-logs', params)
  },

  // 获取实时门禁记录
  getLiveAccessLogs() {
    return request.get('/api/access-logs/live')
  }
}

export default accessLogApi
