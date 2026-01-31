// api/rooms.js - 房间相关接口

const { get, post, put, del } = require('../utils/request')

/**
 * 获取所有房间
 * @param {Object} params 查询参数 { buildingId, status, keyword, page, limit }
 */
function getRooms(params = {}) {
  return get('/api/rooms', params, { showLoading: true })
}

/**
 * 获取房间详情
 * @param {String} id 房间ID
 */
function getRoomDetail(id) {
  return get(`/api/rooms/${id}`, {}, { showLoading: true })
}

/**
 * 创建房间（管理员）
 */
function createRoom(data) {
  return post('/api/rooms', data, { showLoading: true })
}

/**
 * 更新房间信息（管理员）
 */
function updateRoom(id, data) {
  return put(`/api/rooms/${id}`, data, { showLoading: true })
}

/**
 * 删除房间（管理员）
 */
function deleteRoom(id) {
  return del(`/api/rooms/${id}`, {}, { showLoading: true })
}

module.exports = {
  getRooms,
  getRoomDetail,
  createRoom,
  updateRoom,
  deleteRoom
}
