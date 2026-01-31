// api/dashboard.js - 仪表板相关接口

const { get } = require('../utils/request')

/**
 * 获取仪表板统计数据
 */
function getStats() {
  return get('/api/dashboard/stats', {}, { showLoading: true })
}

module.exports = {
  getStats
}
