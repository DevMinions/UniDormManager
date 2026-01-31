// api/repairs.js - 报修相关接口

const { get, post, put, del } = require('../utils/request')

/**
 * 获取报修列表
 * @param {Object} params 查询参数 { status, priority, page, limit }
 */
function getRepairs(params = {}) {
  return get('/api/repairs', params, { showLoading: true })
}

/**
 * 获取报修详情
 * @param {String} id 报修ID
 */
function getRepairDetail(id) {
  return get(`/api/repairs/${id}`, {}, { showLoading: true })
}

/**
 * 创建报修申请
 * @param {Object} data 报修数据 { title, description, roomNumber, priority }
 */
function createRepair(data) {
  return post('/api/repairs', data, { showLoading: true, loadingText: '提交中...' })
}

/**
 * 更新报修状态（管理员）
 * @param {String} id 报修ID
 * @param {Object} data 更新数据 { status, notes }
 */
function updateRepair(id, data) {
  return put(`/api/repairs/${id}`, data, { showLoading: true })
}

/**
 * 删除报修（管理员）
 */
function deleteRepair(id) {
  return del(`/api/repairs/${id}`, {}, { showLoading: true })
}

module.exports = {
  getRepairs,
  getRepairDetail,
  createRepair,
  updateRepair,
  deleteRepair
}
