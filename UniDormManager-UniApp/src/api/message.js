
import { request } from '@/utils/request.js'

export const messageApi = {
  // 获取消息列表
  getMessages(params = {}) {
    return request.get('/api/messages', params)
  },

  // 获取未读消息数
  getUnreadCount() {
    return request.get('/api/messages/unread-count')
  },

  // 标记消息为已读
  markAsRead(messageId) {
    return request.post(`/api/messages/${messageId}/read`)
  },

  // 标记所有消息为已读
  markAllAsRead() {
    return request.post('/api/messages/read-all')
  },

  // 删除消息
  deleteMessage(messageId) {
    return request.delete(`/api/messages/${messageId}`)
  },

  // 获取消息详情
  getMessageDetail(messageId) {
    return request.get(`/api/messages/${messageId}`)
  }
}

export default messageApi
