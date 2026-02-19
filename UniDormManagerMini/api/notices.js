// api/notices.js - 公告相关接口

const { get, post, put, del } = require('../utils/request')

/**
 * 获取公告列表
 * @param {Object} params 查询参数 { category, page, limit }
 */
function getNotices(params = {}) {
  return get('/api/notices', params, { showLoading: true })
}

/**
 * 获取公告详情
 * @param {String} id 公告ID
 */
function getNoticeDetail(id) {
  return get(`/api/notices/${id}`, {}, { showLoading: true })
}

/**
 * 创建公告（管理员）
 */
function createNotice(data) {
  return post('/api/notices', data, { showLoading: true })
}

/**
 * 更新公告（管理员）
 */
function updateNotice(id, data) {
  return put(`/api/notices/${id}`, data, { showLoading: true })
}

/**
 * 删除公告（管理员）
 */
function deleteNotice(id) {
  return del(`/api/notices/${id}`, {}, { showLoading: true })
}

/**
 * 标记公告已读
 * @param {String} id 公告ID
 */
function markNoticeRead(id) {
  return post(`/api/notices/${id}/read`, {}, { showLoading: false })
}

/**
 * 获取公告阅读记录（管理员）
 * @param {String} id 公告ID
 */
function getNoticeReadRecords(id) {
  return get(`/api/notices/${id}/read-records`, {}, { showLoading: true })
}

module.exports = {
  getNotices,
  getNoticeDetail,
  createNotice,
  updateNotice,
  deleteNotice,
  markNoticeRead,
  getNoticeReadRecords
}
