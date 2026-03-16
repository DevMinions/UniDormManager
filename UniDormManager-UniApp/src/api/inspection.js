// ============================================
// API 接口模块 - 查寝相关
// ============================================

import request from '@/utils/request.js'

export const inspectionApi = {
  // 获取查寝记录列表
  getInspectionList(params = {}) {
    return request.get('/api/inspections', params)
  },

  // 获取查寝详情
  getInspectionDetail(id) {
    return request.get(`/api/inspections/${id}`)
  },

  // 获取我的查寝记录
  getMyInspections() {
    return request.get('/api/inspections/my')
  },

  // 提交查寝评分
  createInspection(data) {
    return request.post('/api/inspections', data)
  },

  // 更新查寝记录
  updateInspection(id, data) {
    return request.put(`/api/inspections/${id}`, data)
  },

  // 获取查寝排行榜
  getRankings(params = {}) {
    return request.get('/api/inspections/rankings', params)
  },

  // 获取房间评分统计
  getRoomStats(roomId) {
    return request.get(`/api/inspections/stats/room/${roomId}`)
  }
}

export default inspectionApi
