
// ============================================
// 接口防重放攻击保护
// ============================================

import { sha256, generateNonce } from './crypto.js'

// 请求时间戳允许的最大偏差（5分钟）
const TIMESTAMP_TOLERANCE = 5 * 60 * 1000

// 请求签名存储（防止重复请求）
const requestSignatures = new Set()

// 签名过期清理定时器
let cleanupTimer = null

/**
 * 生成请求签名
 * @param {Object} params - 请求参数
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机字符串
 * @returns {string}
 */
export const generateSignature = (params, timestamp, nonce) => {
  // 按字母顺序排序参数
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {})
  
  // 拼接字符串
  const paramStr = JSON.stringify(sortedParams)
  const signStr = `${paramStr}${timestamp}${nonce}`
  
  // 生成 SHA256 签名
  return sha256(signStr)
}

/**
 * 验证请求签名
 * @param {string} signature - 签名
 * @param {Object} params - 请求参数
 * @param {string} timestamp - 时间戳
 * @param {string} nonce - 随机字符串
 * @returns {boolean}
 */
export const verifySignature = (signature, params, timestamp, nonce) => {
  const expectedSignature = generateSignature(params, timestamp, nonce)
  return signature === expectedSignature
}

/**
 * 检查时间戳是否有效
 * @param {number} timestamp - 时间戳
 * @returns {boolean}
 */
export const isTimestampValid = (timestamp) => {
  const now = Date.now()
  const diff = Math.abs(now - timestamp)
  return diff <= TIMESTAMP_TOLERANCE
}

/**
 * 检查请求是否重复
 * @param {string} signature - 请求签名
 * @returns {boolean}
 */
export const isRequestDuplicate = (signature) => {
  if (requestSignatures.has(signature)) {
    return true
  }
  
  // 添加到已处理集合
  requestSignatures.add(signature)
  
  // 启动清理定时器
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      // 清理过期的签名（简单实现：清空全部）
      if (requestSignatures.size > 1000) {
        requestSignatures.clear()
      }
    }, TIMESTAMP_TOLERANCE)
  }
  
  return false
}

/**
 * 生成防重放请求头
 * @param {Object} params - 请求参数
 * @returns {Object}
 */
export const generateAntiReplayHeaders = (params = {}) => {
  const timestamp = Date.now().toString()
  const nonce = generateNonce(16)
  const signature = generateSignature(params, timestamp, nonce)
  
  return {
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature
  }
}

/**
 * 验证防重放请求
 * @param {Object} headers - 请求头
 * @param {Object} params - 请求参数
 * @returns {Object} { valid: boolean, message: string }
 */
export const verifyAntiReplayRequest = (headers, params) => {
  const timestamp = headers['X-Timestamp'] || headers['x-timestamp']
  const nonce = headers['X-Nonce'] || headers['x-nonce']
  const signature = headers['X-Signature'] || headers['x-signature']
  
  // 检查必要参数
  if (!timestamp || !nonce || !signature) {
    return { valid: false, message: '缺少防重放参数' }
  }
  
  // 检查时间戳
  if (!isTimestampValid(Number(timestamp))) {
    return { valid: false, message: '请求已过期' }
  }
  
  // 验证签名
  if (!verifySignature(signature, params, timestamp, nonce)) {
    return { valid: false, message: '签名验证失败' }
  }
  
  // 检查重复请求
  if (isRequestDuplicate(signature)) {
    return { valid: false, message: '重复请求' }
  }
  
  return { valid: true, message: '' }
}

/**
 * 创建带防重放的请求配置
 * @param {Object} config - 请求配置
 * @returns {Object}
 */
export const createSecureRequestConfig = (config = {}) => {
  const antiReplayHeaders = generateAntiReplayHeaders(config.data)
  
  return {
    ...config,
    header: {
      ...config.header,
      ...antiReplayHeaders
    }
  }
}

/**
 * 请求限流器
 */
export class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10      // 最大请求数
    this.timeWindow = options.timeWindow || 60000     // 时间窗口（毫秒）
    this.requests = new Map()                         // 请求记录
  }
  
  /**
   * 检查是否允许请求
   * @param {string} key - 标识键（如用户ID + 接口路径）
   * @returns {boolean}
   */
  allowRequest(key) {
    const now = Date.now()
    const windowStart = now - this.timeWindow
    
    // 获取该键的请求记录
    let records = this.requests.get(key) || []
    
    // 清理过期记录
    records = records.filter(time => time > windowStart)
    
    // 检查是否超过限制
    if (records.length >= this.maxRequests) {
      return false
    }
    
    // 添加新记录
    records.push(now)
    this.requests.set(key, records)
    
    return true
  }
  
  /**
   * 获取剩余请求次数
   * @param {string} key - 标识键
   * @returns {number}
   */
  getRemainingRequests(key) {
    const now = Date.now()
    const windowStart = now - this.timeWindow
    const records = (this.requests.get(key) || [])
      .filter(time => time > windowStart)
    
    return Math.max(0, this.maxRequests - records.length)
  }
  
  /**
   * 获取重置时间
   * @param {string} key - 标识键
   * @returns {number}
   */
  getResetTime(key) {
    const records = this.requests.get(key) || []
    if (records.length === 0) return 0
    
    const oldestRecord = Math.min(...records)
    return oldestRecord + this.timeWindow
  }
}

/**
 * 全局限流器实例
 */
export const globalRateLimiter = new RateLimiter({
  maxRequests: 30,    // 每分钟最多30次请求
  timeWindow: 60000
})

/**
 * 接口限流装饰器
 * @param {Object} options - 配置
 * @returns {Function}
 */
export const withRateLimit = (options = {}) => {
  const limiter = new RateLimiter(options)
  
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args) {
      const key = `${propertyKey}_${JSON.stringify(args)}`
      
      if (!limiter.allowRequest(key)) {
        throw new Error('请求过于频繁，请稍后重试')
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

/**
 * 清理所有防重放数据
 */
export const clearAntiReplayData = () => {
  requestSignatures.clear()
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}
