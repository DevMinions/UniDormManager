// ============================================
// API 接口模块 - 房间相关
// ============================================

import request from '@/utils/request.js'

export const roomApi = {
  // 获取房间列表
  getRoomList(params = {}) {
    return request.get('/api/rooms', params)
  },
  
  // 获取所有房间 (不分页)
  getAllRooms() {
    return request.get('/api/rooms/all')
  },
  
  // 获取房间详情
  getRoomDetail(id) {
    return request.get(`/api/rooms/${id}`)
  },
  
  // 获取我的房间 (当前登录用户的房间)
  getMyRoom() {
    // 如果有专门的接口就用专门的，否则从房间列表中筛选
    return request.get('/api/rooms', { assignee: 'me' })
  },
  
  // 创建房间 (管理员)
  createRoom(data) {
    return request.post('/api/rooms', data)
  },
  
  // 更新房间 (管理员)
  updateRoom(id, data) {
    return request.put(`/api/rooms/${id}`, data)
  },
  
  // 删除房间 (管理员)
  deleteRoom(id) {
    return request.delete(`/api/rooms/${id}`)
  },
  
  // 获取楼栋列表
  getBuildingList() {
    return request.get('/api/buildings')
  },
  
  // 获取学生列表
  getStudentList(params = {}) {
    return request.get('/api/students', params)
  }
}

export default roomApi
