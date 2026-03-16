
import { request } from '@/utils/request.js'

export const reportApi = {
  // 获取报表列表
  getReports(params = {}) {
    return request.get('/api/reports', params)
  },

  // 生成报表
  generateReport(data) {
    return request.post('/api/reports/generate', data)
  },

  // 下载报表
  downloadReport(reportId) {
    return request.get(`/api/reports/${reportId}/download`, {}, { responseType: 'blob' })
  },

  // 获取报表模板列表
  getReportTemplates() {
    return request.get('/api/reports/templates')
  },

  // 获取统计数据（用于报表预览）
  getStatistics(params) {
    return request.get('/api/statistics', params)
  }
}

export default reportApi
