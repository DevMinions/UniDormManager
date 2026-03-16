
import { request } from '@/utils/request.js'

export const reportApi = {
  // 获取报表列表
  getReports(params = {}) {
    return request({
      url: '/api/reports',
      method: 'GET',
      data: params
    })
  },

  // 生成报表
  generateReport(data) {
    return request({
      url: '/api/reports/generate',
      method: 'POST',
      data
    })
  },

  // 下载报表
  downloadReport(reportId) {
    return request({
      url: `/api/reports/${reportId}/download`,
      method: 'GET',
      responseType: 'blob'
    })
  },

  // 获取报表模板列表
  getReportTemplates() {
    return request({
      url: '/api/reports/templates',
      method: 'GET'
    })
  },

  // 获取统计数据（用于报表预览）
  getStatistics(params) {
    return request({
      url: '/api/statistics',
      method: 'GET',
      data: params
    })
  }
}
