// ============================================
// API 接口模块 - 公告相关
// ============================================

import request from '@/utils/request.js'

export const noticeApi = {
  // 获取公告列表
  getNoticeList(params = {}) {
    return request.get('/api/notices', params)
  },
  
  // 获取公告详情
  getNoticeDetail(id) {
    return request.get(`/api/notices/${id}`)
  },
  
  // 创建公告 (管理员)
  createNotice(data) {
    return request.post('/api/notices', data)
  },
  
  // 更新公告 (管理员)
  updateNotice(id, data) {
    return request.put(`/api/notices/${id}`, data)
  },
  
  // 删除公告 (管理员)
  deleteNotice(id) {
    return request.delete(`/api/notices/${id}`)
  }
}

export default noticeApi
