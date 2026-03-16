// ============================================
// 推送通知服务 - 微信小程序订阅消息
// ============================================

/**
 * 订阅消息模板 ID 配置
 * 需要在微信小程序后台申请模板
 */
const TEMPLATE_IDS = {
  // 报修进度通知
  REPAIR_STATUS: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 晚归告警通知
  LATE_RETURN: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 查寝评分通知
  INSPECTION_SCORE: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 换寝审批通知
  ROOM_SWAP_APPROVAL: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 公告通知
  NOTICE: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

/**
 * 推送通知服务
 */
export const notificationService = {
  /**
   * 请求订阅授权
   * @param {string} templateId - 模板 ID
   * @returns {Promise<boolean>}
   */
  async requestSubscribe(templateId) {
    return new Promise((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: [templateId],
        success: (res) => {
          if (res[templateId] === 'accept') {
            console.log('订阅成功:', templateId)
            resolve(true)
          } else {
            console.log('订阅失败或被拒绝:', res[templateId])
            resolve(false)
          }
        },
        fail: (err) => {
          console.error('订阅请求失败:', err)
          resolve(false)
        }
      })
    })
  },

  /**
   * 批量订阅多个消息类型
   * @param {Array<string>} types - 消息类型数组
   */
  async batchSubscribe(types) {
    const tmplIds = types.map(type => TEMPLATE_IDS[type]).filter(Boolean)
    
    if (tmplIds.length === 0) return false
    
    return new Promise((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: (res) => {
          const results = tmplIds.map(id => res[id])
          const allAccepted = results.every(r => r === 'accept')
          resolve(allAccepted)
        },
        fail: () => resolve(false)
      })
    })
  },

  /**
   * 检查订阅状态
   * @param {string} type - 消息类型
   * @returns {Promise<boolean>}
   */
  async checkSubscriptionStatus(type) {
    // 实际应该调用后端接口检查
    // 这里返回模拟结果
    return new Promise((resolve) => {
      // 从本地存储获取
      const status = uni.getStorageSync(`subscribe_${type}`)
      resolve(!!status)
    })
  },

  /**
   * 保存订阅状态
   * @param {string} type - 消息类型
   * @param {boolean} status - 订阅状态
   */
  saveSubscriptionStatus(type, status) {
    uni.setStorageSync(`subscribe_${type}`, status)
  },

  /**
   * 显示订阅引导弹窗
   * @param {string} title - 弹窗标题
   * @param {string} content - 弹窗内容
   * @param {Array<string>} types - 需要订阅的消息类型
   */
  showSubscribeModal(title, content, types) {
    uni.showModal({
      title,
      content,
      confirmText: '开启通知',
      cancelText: '暂不开启',
      success: (res) => {
        if (res.confirm) {
          this.batchSubscribe(types)
        }
      }
    })
  }
}

/**
 * 本地通知（应用内）
 */
export const localNotification = {
  /**
   * 显示成功通知
   * @param {string} title - 标题
   * @param {string} message - 内容
   */
  success(title, message) {
    this.show({
      type: 'success',
      title,
      message,
      duration: 3000
    })
  },

  /**
   * 显示警告通知
   * @param {string} title - 标题
   * @param {string} message - 内容
   */
  warning(title, message) {
    this.show({
      type: 'warning',
      title,
      message,
      duration: 4000
    })
  },

  /**
   * 显示错误通知
   * @param {string} title - 标题
   * @param {string} message - 内容
   */
  error(title, message) {
    this.show({
      type: 'error',
      title,
      message,
      duration: 5000
    })
  },

  /**
   * 显示通知
   * @param {Object} options - 配置选项
   */
  show(options) {
    const { type, title, message, duration = 3000 } = options
    
    // 颜色配置
    const colors = {
      success: { bg: '#ECFDF5', border: '#6EE7B7', icon: '✓', iconBg: '#059669' },
      warning: { bg: '#FEF3C7', border: '#FCD34D', icon: '!', iconBg: '#D97706' },
      error: { bg: '#FEE2E2', border: '#FCA5A5', icon: '✕', iconBg: '#DC2626' },
      info: { bg: '#DBEAFE', border: '#93C5FD', icon: 'i', iconBg: '#3B82F6' }
    }
    
    const color = colors[type] || colors.info
    
    // 创建通知元素
    const notificationId = 'notification_' + Date.now()
    
    // 使用 uni.showToast 简化实现
    uni.showToast({
      title: `${title}\n${message}`,
      icon: 'none',
      duration,
      mask: false
    })
  }
}

/**
 * 消息中心服务
 */
export const messageCenter = {
  // 消息列表
  messages: [],
  
  // 未读消息数
  unreadCount: 0,
  
  /**
   * 添加消息
   * @param {Object} message - 消息对象
   */
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
  
  /**
   * 标记已读
   * @param {number} id - 消息ID
   */
  markAsRead(id) {
    const msg = this.messages.find(m => m.id === id)
    if (msg && !msg.read) {
      msg.read = true
      this.unreadCount--
      this.saveToStorage()
    }
  },
  
  /**
   * 标记全部已读
   */
  markAllAsRead() {
    this.messages.forEach(m => m.read = true)
    this.unreadCount = 0
    this.saveToStorage()
  },
  
  /**
   * 删除消息
   * @param {number} id - 消息ID
   */
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
  
  /**
   * 清空消息
   */
  clear() {
    this.messages = []
    this.unreadCount = 0
    this.saveToStorage()
  },
  
  /**
   * 保存到本地存储
   */
  saveToStorage() {
    uni.setStorageSync('message_center', {
      messages: this.messages.slice(0, 100), // 最多保留100条
      unreadCount: this.unreadCount
    })
  },
  
  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    const data = uni.getStorageSync('message_center')
    if (data) {
      this.messages = data.messages || []
      this.unreadCount = data.unreadCount || 0
    }
  }
}

// 初始化时加载消息
messageCenter.loadFromStorage()

export default {
  notificationService,
  localNotification,
  messageCenter,
  TEMPLATE_IDS
}
