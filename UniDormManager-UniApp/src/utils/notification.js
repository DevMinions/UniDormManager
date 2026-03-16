// ============================================
// 推送通知服务 - 微信小程序订阅消息 + 短信 + 企业微信
// ============================================

/**
 * 订阅消息模板 ID 配置
 * 需要在微信小程序后台申请模板
 */
export const TEMPLATE_IDS = {
  // 报修进度通知
  REPAIR_STATUS: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 晚归告警通知
  LATE_RETURN: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 查寝评分通知
  INSPECTION_SCORE: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 换寝审批通知
  ROOM_SWAP_APPROVAL: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 公告通知
  NOTICE: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 系统通知
  SYSTEM: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

/**
 * 微信小程序订阅消息服务
 */
export const wechatNotify = {
  /**
   * 请求订阅授权
   * @param {string|Array} templateIds - 模板 ID(s)
   * @returns {Promise<boolean>}
   */
  async requestSubscribe(templateIds) {
    const ids = Array.isArray(templateIds) ? templateIds : [templateIds]
    
    return new Promise((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: ids,
        success: (res) => {
          const results = ids.map(id => res[id])
          const allAccepted = results.every(r => r === 'accept')
          
          // 保存订阅状态
          ids.forEach(id => {
            this.saveSubscribeStatus(id, res[id] === 'accept')
          })
          
          resolve(allAccepted)
        },
        fail: (err) => {
          console.error('订阅请求失败:', err)
          resolve(false)
        }
      })
    })
  },

  /**
   * 发送订阅消息（实际由服务端调用）
   * @param {string} templateId - 模板 ID
   * @param {Object} data - 模板数据
   * @param {string} page - 跳转页面
   */
  async sendMessage(templateId, data, page = '') {
    // 检查是否已订阅
    const isSubscribed = await this.checkSubscribeStatus(templateId)
    if (!isSubscribed) {
      console.log('用户未订阅此消息类型:', templateId)
      return false
    }

    // 调用服务端接口发送
    // 实际项目中这里调用后端 API
    console.log('发送订阅消息:', { templateId, data, page })
    return true
  },

  /**
   * 批量订阅常用消息类型
   */
  async subscribeCommon() {
    const commonIds = [
      TEMPLATE_IDS.REPAIR_STATUS,
      TEMPLATE_IDS.LATE_RETURN,
      TEMPLATE_IDS.NOTICE
    ].filter(Boolean)
    
    return this.requestSubscribe(commonIds)
  },

  /**
   * 保存订阅状态
   */
  saveSubscribeStatus(templateId, status) {
    const key = `subscribe_${templateId}`
    uni.setStorageSync(key, status)
  },

  /**
   * 检查订阅状态
   */
  checkSubscribeStatus(templateId) {
    return uni.getStorageSync(`subscribe_${templateId}`) || false
  },

  /**
   * 显示订阅引导
   */
  showSubscribeGuide(title = '开启消息通知', content = '及时获取报修进度、晚归提醒等重要通知') {
    uni.showModal({
      title,
      content,
      confirmText: '开启通知',
      cancelText: '暂不开启',
      success: (res) => {
        if (res.confirm) {
          this.subscribeCommon()
        }
      }
    })
  }
}

/**
 * 短信服务
 */
export const smsService = {
  /**
   * 发送验证码
   * @param {string} phone - 手机号
   * @param {string} type - 验证码类型
   * @returns {Promise<boolean>}
   */
  async sendVerifyCode(phone, type = 'login') {
    try {
      const res = await uni.request({
        url: '/api/sms/send-code',
        method: 'POST',
        data: { phone, type }
      })
      
      return res.data?.success || false
    } catch (error) {
      console.error('发送验证码失败:', error)
      return false
    }
  },

  /**
   * 发送通知短信（管理员功能）
   * @param {Array<string>} phones - 手机号列表
   * @param {string} templateCode - 短信模板码
   * @param {Object} params - 模板参数
   */
  async sendNotification(phones, templateCode, params) {
    try {
      const res = await uni.request({
        url: '/api/sms/send-batch',
        method: 'POST',
        data: { phones, templateCode, params }
      })
      
      return res.data?.success || false
    } catch (error) {
      console.error('发送短信失败:', error)
      return false
    }
  },

  /**
   * 验证短信验证码
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @returns {Promise<boolean>}
   */
  async verifyCode(phone, code) {
    try {
      const res = await uni.request({
        url: '/api/sms/verify-code',
        method: 'POST',
        data: { phone, code }
      })
      
      return res.data?.valid || false
    } catch (error) {
      console.error('验证验证码失败:', error)
      return false
    }
  }
}

/**
 * 企业微信通知（管理员推送）
 */
export const wecomService = {
  /**
   * 发送文本消息给指定用户
   * @param {string} userId - 企业微信用户ID
   * @param {string} content - 消息内容
   */
  async sendText(userId, content) {
    try {
      const res = await uni.request({
        url: '/api/wecom/send-text',
        method: 'POST',
        data: { userId, content }
      })
      
      return res.data?.success || false
    } catch (error) {
      console.error('发送企业微信消息失败:', error)
      return false
    }
  },

  /**
   * 发送卡片消息
   * @param {string} userId - 企业微信用户ID
   * @param {Object} card - 卡片内容
   */
  async sendCard(userId, card) {
    try {
      const res = await uni.request({
        url: '/api/wecom/send-card',
        method: 'POST',
        data: { userId, card }
      })
      
      return res.data?.success || false
    } catch (error) {
      console.error('发送企业微信卡片失败:', error)
      return false
    }
  },

  /**
   * 发送应用通知
   * @param {Array<string>} userIds - 用户ID列表
   * @param {string} title - 标题
   * @param {string} description - 描述
   * @param {string} url - 跳转链接
   */
  async sendAppMessage(userIds, title, description, url = '') {
    try {
      const res = await uni.request({
        url: '/api/wecom/send-app-msg',
        method: 'POST',
        data: { userIds, title, description, url }
      })
      
      return res.data?.success || false
    } catch (error) {
      console.error('发送企业微信应用消息失败:', error)
      return false
    }
  }
}

/**
 * 推送消息统一管理
 */
export const pushManager = {
  /**
   * 发送晚归告警通知（多渠道）
   * @param {Object} data - 告警数据
   */
  async sendLateReturnAlert(data) {
    const { studentName, roomNumber, lateTime, userId } = data
    
    // 1. 微信小程序订阅消息
    await wechatNotify.sendMessage(
      TEMPLATE_IDS.LATE_RETURN,
      {
        name1: { value: studentName },
        thing2: { value: roomNumber },
        time3: { value: lateTime },
        thing4: { value: '请及时处理' }
      },
      '/pages/late-returns/list'
    )
    
    // 2. 企业微信通知（管理员）
    await wecomService.sendAppMessage(
      [userId],
      '晚归告警通知',
      `${studentName} (${roomNumber}) 于 ${lateTime} 晚归`,
      '/pages/late-returns/list'
    )
  },

  /**
   * 发送报修状态变更通知
   * @param {Object} data - 报修数据
   */
  async sendRepairStatusChange(data) {
    const { userId, repairId, status, title } = data
    
    await wechatNotify.sendMessage(
      TEMPLATE_IDS.REPAIR_STATUS,
      {
        character_string1: { value: repairId },
        thing2: { value: title },
        phrase3: { value: status }
      },
      `/pages/repairs/detail?id=${repairId}`
    )
  },

  /**
   * 发送换寝审批通知
   * @param {Object} data - 审批数据
   */
  async sendRoomSwapApproval(data) {
    const { userId, status, reason } = data
    
    await wechatNotify.sendMessage(
      TEMPLATE_IDS.ROOM_SWAP_APPROVAL,
      {
        phrase1: { value: status },
        thing2: { value: reason || '审批完成' }
      },
      '/pages/room-swaps/list'
    )
  }
}

/**
 * 本地通知（应用内）- 保留原有功能
 */
export const localNotification = {
  /**
   * 显示成功通知
   */
  success(title, message) {
    uni.showToast({
      title: message || title,
      icon: 'success',
      duration: 2000
    })
  },

  /**
   * 显示警告通知
   */
  warning(title, message) {
    uni.showToast({
      title: message || title,
      icon: 'none',
      duration: 3000
    })
  },

  /**
   * 显示错误通知
   */
  error(title, message) {
    uni.showToast({
      title: message || title,
      icon: 'error',
      duration: 3000
    })
  },

  /**
   * 显示加载中
   */
  loading(title = '加载中...') {
    uni.showLoading({ title, mask: true })
  },

  /**
   * 隐藏加载
   */
  hideLoading() {
    uni.hideLoading()
  }
}

/**
 * 消息中心服务 - 保留原有功能
 */
export const messageCenter = {
  messages: [],
  unreadCount: 0,
  
  add(message) {
    this.messages.unshift({
      id: Date.now(),
      read: false,
      time: new Date().toISOString(),
      ...message
    })
    this.unreadCount++
    this.saveToStorage()
  },
  
  markAsRead(id) {
    const msg = this.messages.find(m => m.id === id)
    if (msg && !msg.read) {
      msg.read = true
      this.unreadCount--
      this.saveToStorage()
    }
  },
  
  markAllAsRead() {
    this.messages.forEach(m => m.read = true)
    this.unreadCount = 0
    this.saveToStorage()
  },
  
  remove(id) {
    const index = this.messages.findIndex(m => m.id === id)
    if (index > -1) {
      if (!this.messages[index].read) {
        this.unreadCount--
      }
      this.messages.splice(index, 1)
      this.saveToStorage()
    }
  },
  
  clear() {
    this.messages = []
    this.unreadCount = 0
    this.saveToStorage()
  },
  
  saveToStorage() {
    uni.setStorageSync('message_center', {
      messages: this.messages.slice(0, 100),
      unreadCount: this.unreadCount
    })
  },
  
  loadFromStorage() {
    const data = uni.getStorageSync('message_center')
    if (data) {
      this.messages = data.messages || []
      this.unreadCount = data.unreadCount || 0
    }
  }
}

// 初始化
messageCenter.loadFromStorage()

// 兼容性导出
export const notificationService = wechatNotify

export default {
  wechatNotify,
  smsService,
  wecomService,
  pushManager,
  localNotification,
  messageCenter,
  TEMPLATE_IDS
}
