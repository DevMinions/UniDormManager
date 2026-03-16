
import { request } from '@/utils/request.js'

/**
 * 数据导入导出 API
 */
export const dataTransferApi = {
  // ==================== 导入功能 ====================
  
  /**
   * 上传导入文件
   * @param {string} filePath - 文件路径
   * @param {string} type - 导入类型: students/rooms/buildings
   * @param {Object} options - 配置选项
   */
  uploadImportFile(filePath, type, options = {}) {
    return request.upload('/api/data-transfer/import', filePath, {
      name: 'file',
      formData: {
        type,
        ...options
      }
    })
  },

  /**
   * 预览导入数据
   * @param {string} uploadId - 上传ID
   * @param {Object} params - 分页参数
   */
  previewImportData(uploadId, params = {}) {
    return request.get('/api/data-transfer/import/preview', {
      uploadId,
      ...params
    })
  },

  /**
   * 确认导入
   * @param {string} uploadId - 上传ID
   * @param {Object} options - 导入选项
   */
  confirmImport(uploadId, options = {}) {
    return request.post('/api/data-transfer/import/confirm', {
      uploadId,
      ...options
    })
  },

  /**
   * 获取导入进度
   * @param {string} taskId - 任务ID
   */
  getImportProgress(taskId) {
    return request.get(`/api/data-transfer/import/progress/${taskId}`)
  },

  /**
   * 取消导入
   * @param {string} taskId - 任务ID
   */
  cancelImport(taskId) {
    return request.post(`/api/data-transfer/import/cancel/${taskId}`)
  },

  /**
   * 获取导入历史
   * @param {Object} params - 查询参数
   */
  getImportHistory(params = {}) {
    return request.get('/api/data-transfer/import/history', params)
  },

  // ==================== 导出功能 ====================
  
  /**
   * 导出数据
   * @param {string} type - 导出类型
   * @param {Object} params - 导出参数
   * @param {string} format - 格式: xlsx/csv/pdf
   */
  exportData(type, params = {}, format = 'xlsx') {
    return request.post('/api/data-transfer/export', {
      type,
      format,
      ...params
    }, {
      responseType: 'blob'
    })
  },

  /**
   * 异步导出（大数据量）
   * @param {string} type - 导出类型
   * @param {Object} params - 导出参数
   * @param {string} format - 格式
   */
  asyncExport(type, params = {}, format = 'xlsx') {
    return request.post('/api/data-transfer/export/async', {
      type,
      format,
      ...params
    })
  },

  /**
   * 获取导出进度
   * @param {string} taskId - 任务ID
   */
  getExportProgress(taskId) {
    return request.get(`/api/data-transfer/export/progress/${taskId}`)
  },

  /**
   * 下载导出的文件
   * @param {string} taskId - 任务ID
   */
  downloadExportedFile(taskId) {
    return request.get(`/api/data-transfer/export/download/${taskId}`, {}, {
      responseType: 'blob'
    })
  },

  /**
   * 获取导出历史
   * @param {Object} params - 查询参数
   */
  getExportHistory(params = {}) {
    return request.get('/api/data-transfer/export/history', params)
  },

  // ==================== 模板下载 ====================
  
  /**
   * 下载导入模板
   * @param {string} type - 模板类型
   * @param {string} format - 格式: xlsx/csv
   */
  downloadTemplate(type, format = 'xlsx') {
    return request.get(`/api/data-transfer/template/${type}`, {
      format
    }, {
      responseType: 'blob'
    })
  },

  /**
   * 获取支持的导入类型
   */
  getSupportedImportTypes() {
    return request.get('/api/data-transfer/import/types')
  },

  /**
   * 获取字段映射建议
   * @param {string} uploadId - 上传ID
   */
  getFieldMappingSuggestions(uploadId) {
    return request.get('/api/data-transfer/import/field-mapping', { uploadId })
  },

  /**
   * 保存字段映射
   * @param {string} uploadId - 上传ID
   * @param {Object} mapping - 字段映射
   */
  saveFieldMapping(uploadId, mapping) {
    return request.post('/api/data-transfer/import/field-mapping', {
      uploadId,
      mapping
    })
  }
}

export default dataTransferApi
