// ============================================
// API 接口统一入口
// ============================================

import userApi from './user.js'
import noticeApi from './notice.js'
import repairApi from './repair.js'
import roomApi from './room.js'

export const api = {
  user: userApi,
  notice: noticeApi,
  repair: repairApi,
  room: roomApi
}

export default api
