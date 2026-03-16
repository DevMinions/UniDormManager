
import { request } from '@/utils/request.js'

/**
 * 人脸识别门禁 API
 * 预留接口，待硬件设备对接后实现
 */
export const faceRecognitionApi = {
  // ==================== 设备管理 ====================
  
  /**
   * 获取门禁设备列表
   */
  getDevices() {
    return request.get('/api/face-recognition/devices')
  },

  /**
   * 添加门禁设备
   * @param {Object} data - 设备信息
   */
  addDevice(data) {
    return request.post('/api/face-recognition/devices', data)
  },

  /**
   * 更新设备信息
   * @param {string} deviceId - 设备ID
   * @param {Object} data - 设备信息
   */
  updateDevice(deviceId, data) {
    return request.put(`/api/face-recognition/devices/${deviceId}`, data)
  },

  /**
   * 删除设备
   * @param {string} deviceId - 设备ID
   */
  deleteDevice(deviceId) {
    return request.delete(`/api/face-recognition/devices/${deviceId}`)
  },

  /**
   * 获取设备状态
   * @param {string} deviceId - 设备ID
   */
  getDeviceStatus(deviceId) {
    return request.get(`/api/face-recognition/devices/${deviceId}/status`)
  },

  // ==================== 人脸库管理 ====================
  
  /**
   * 注册人脸
   * @param {string} studentId - 学生ID
   * @param {string} imageBase64 - 人脸图片 Base64
   */
  registerFace(studentId, imageBase64) {
    return request.post('/api/face-recognition/faces', {
      studentId,
      image: imageBase64
    })
  },

  /**
   * 更新人脸信息
   * @param {string} studentId - 学生ID
   * @param {string} imageBase64 - 新的人脸图片
   */
  updateFace(studentId, imageBase64) {
    return request.put(`/api/face-recognition/faces/${studentId}`, {
      image: imageBase64
    })
  },

  /**
   * 删除人脸
   * @param {string} studentId - 学生ID
   */
  deleteFace(studentId) {
    return request.delete(`/api/face-recognition/faces/${studentId}`)
  },

  /**
   * 获取人脸库列表
   * @param {Object} params - 查询参数
   */
  getFaceLibrary(params = {}) {
    return request.get('/api/face-recognition/faces', params)
  },

  // ==================== 识别记录 ====================
  
  /**
   * 获取识别记录
   * @param {Object} params - 查询参数
   */
  getRecognitionRecords(params = {}) {
    return request.get('/api/face-recognition/records', params)
  },

  /**
   * 获取实时识别数据（WebSocket 备用）
   */
  getRealtimeRecognitions() {
    return request.get('/api/face-recognition/records/realtime')
  },

  // ==================== 门禁控制 ====================
  
  /**
   * 远程开门
   * @param {string} deviceId - 设备ID
   * @param {string} reason - 开门原因
   */
  remoteOpenDoor(deviceId, reason) {
    return request.post(`/api/face-recognition/devices/${deviceId}/open`, {
      reason
    })
  },

  /**
   * 批量同步人脸到设备
   * @param {string} deviceId - 设备ID
   */
  syncFacesToDevice(deviceId) {
    return request.post(`/api/face-recognition/devices/${deviceId}/sync`)
  },

  /**
   * 获取设备识别统计
   * @param {string} deviceId - 设备ID
   * @param {Object} params - 统计参数
   */
  getDeviceStats(deviceId, params = {}) {
    return request.get(`/api/face-recognition/devices/${deviceId}/stats`, params)
  }
}

/**
 * 人脸识别 WebSocket 连接（预留）
 * 用于实时接收识别结果
 */
export class FaceRecognitionWebSocket {
  constructor() {
    this.ws = null
    this.reconnectTimer = null
    this.listeners = new Map()
  }

  /**
   * 连接 WebSocket
   * @param {string} url - WebSocket 地址
   */
  connect(url) {
    // 预留实现
    console.log('[FaceRecognitionWebSocket] 连接预留:', url)
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 预留实现
    console.log('[FaceRecognitionWebSocket] 断开连接预留')
  }

  /**
   * 添加事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 发送消息
   * @param {Object} data - 消息数据
   */
  send(data) {
    // 预留实现
    console.log('[FaceRecognitionWebSocket] 发送消息预留:', data)
  }
}

export default faceRecognitionApi
