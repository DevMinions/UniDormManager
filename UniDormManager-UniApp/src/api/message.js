
import { request } from '@/utils/request.js'

export const messageApi = {
  // 获取消息列表
  getMessages(params = {}) {
    return request({
      url: '/api/messages',
      method: 'GET',
      data: params
    })
  },

  // 获取未读消息数
  getUnreadCount() {
    return request({
      url: '/api/messages/unread-count',
      method: 'GET'
    })
  },

  // 标记消息为已读
  markAsRead(messageId) {
    return request({
      url: `/api/messages/${messageId}/read`,
      method: 'POST'
    })
  },

  // 标记所有消息为已读
  markAllAsRead() {
    return request({
      url: '/api/messages/read-all',
      method: 'POST'
    })
  },

  // 删除消息
  deleteMessage(messageId) {
    return request({
      url: `/api/messages/${messageId}`,
      method: 'DELETE'
    })
  },

  // 获取消息详情
  getMessageDetail(messageId) {
    return request({
      url: `/api/messages/${messageId}`,
      method: 'GET'
    })
  }
}
