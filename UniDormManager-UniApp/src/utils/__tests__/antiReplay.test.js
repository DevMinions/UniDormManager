import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateSignature,
  verifySignature,
  isTimestampValid,
  isRequestDuplicate,
  generateAntiReplayHeaders,
  verifyAntiReplayRequest,
  RateLimiter
} from '../antiReplay.js'

describe('generateSignature', () => {
  it('应该生成一致的签名', () => {
    const params = { id: 1, name: 'test' }
    const timestamp = '1234567890'
    const nonce = 'abc123'
    
    const signature1 = generateSignature(params, timestamp, nonce)
    const signature2 = generateSignature(params, timestamp, nonce)
    
    expect(signature1).toBe(signature2)
    expect(typeof signature1).toBe('string')
    expect(signature1.length).toBeGreaterThan(0)
  })

  it('不同参数应该生成不同签名', () => {
    const signature1 = generateSignature({ id: 1 }, '123', 'abc')
    const signature2 = generateSignature({ id: 2 }, '123', 'abc')
    
    expect(signature1).not.toBe(signature2)
  })
})

describe('verifySignature', () => {
  it('应该验证正确的签名', () => {
    const params = { id: 1 }
    const timestamp = '1234567890'
    const nonce = 'abc123'
    
    const signature = generateSignature(params, timestamp, nonce)
    const isValid = verifySignature(signature, params, timestamp, nonce)
    
    expect(isValid).toBe(true)
  })

  it('应该拒绝错误的签名', () => {
    const params = { id: 1 }
    const timestamp = '1234567890'
    const nonce = 'abc123'
    
    const isValid = verifySignature('wrong-signature', params, timestamp, nonce)
    
    expect(isValid).toBe(false)
  })
})

describe('isTimestampValid', () => {
  it('应该接受当前时间', () => {
    const now = Date.now()
    expect(isTimestampValid(now)).toBe(true)
  })

  it('应该接受稍早的时间', () => {
    const fourMinutesAgo = Date.now() - 4 * 60 * 1000
    expect(isTimestampValid(fourMinutesAgo)).toBe(true)
  })

  it('应该拒绝过期时间', () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    expect(isTimestampValid(tenMinutesAgo)).toBe(false)
  })

  it('应该拒绝未来时间', () => {
    const tenMinutesLater = Date.now() + 10 * 60 * 1000
    expect(isTimestampValid(tenMinutesLater)).toBe(false)
  })
})

describe('isRequestDuplicate', () => {
  it('应该识别新请求', () => {
    const isDuplicate = isRequestDuplicate('new-signature-1')
    expect(isDuplicate).toBe(false)
  })

  it('应该识别重复请求', () => {
    const signature = 'duplicate-signature'
    isRequestDuplicate(signature) // 第一次
    const isDuplicate = isRequestDuplicate(signature) // 第二次
    expect(isDuplicate).toBe(true)
  })
})

describe('generateAntiReplayHeaders', () => {
  it('应该生成包含必要字段的请求头', () => {
    const headers = generateAntiReplayHeaders({ id: 1 })
    
    expect(headers['X-Timestamp']).toBeDefined()
    expect(headers['X-Nonce']).toBeDefined()
    expect(headers['X-Signature']).toBeDefined()
  })

  it('应该为不同参数生成不同请求头', () => {
    const headers1 = generateAntiReplayHeaders({ id: 1 })
    const headers2 = generateAntiReplayHeaders({ id: 2 })
    
    expect(headers1['X-Signature']).not.toBe(headers2['X-Signature'])
  })
})

describe('verifyAntiReplayRequest', () => {
  it('应该验证有效的请求', () => {
    const params = { id: 1 }
    const timestamp = Date.now().toString()
    const nonce = 'abc123'
    const signature = generateSignature(params, timestamp, nonce)
    
    const headers = {
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    }
    
    const result = verifyAntiReplayRequest(headers, params)
    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })

  it('应该拒绝缺少参数的请求', () => {
    const result = verifyAntiReplayRequest({}, { id: 1 })
    expect(result.valid).toBe(false)
    expect(result.message).toBe('缺少防重放参数')
  })

  it('应该拒绝过期的请求', () => {
    const params = { id: 1 }
    const timestamp = (Date.now() - 10 * 60 * 1000).toString()
    const nonce = 'abc123'
    const signature = generateSignature(params, timestamp, nonce)
    
    const headers = {
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    }
    
    const result = verifyAntiReplayRequest(headers, params)
    expect(result.valid).toBe(false)
    expect(result.message).toBe('请求已过期')
  })

  it('应该拒绝签名错误的请求', () => {
    const headers = {
      'X-Timestamp': Date.now().toString(),
      'X-Nonce': 'abc123',
      'X-Signature': 'wrong-signature'
    }
    
    const result = verifyAntiReplayRequest(headers, { id: 1 })
    expect(result.valid).toBe(false)
    expect(result.message).toBe('签名验证失败')
  })
})

describe('RateLimiter', () => {
  let limiter

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 3,
      timeWindow: 60000
    })
  })

  it('应该允许初始请求', () => {
    expect(limiter.allowRequest('user1')).toBe(true)
    expect(limiter.allowRequest('user1')).toBe(true)
    expect(limiter.allowRequest('user1')).toBe(true)
  })

  it('应该限制超出频率的请求', () => {
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    
    expect(limiter.allowRequest('user1')).toBe(false)
  })

  it('应该为不同键独立计数', () => {
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    
    expect(limiter.allowRequest('user2')).toBe(true)
  })

  it('应该正确计算剩余请求数', () => {
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    
    expect(limiter.getRemainingRequests('user1')).toBe(1)
  })

  it('超过限制后应该返回0剩余', () => {
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    limiter.allowRequest('user1')
    limiter.allowRequest('user1') // 超出
    
    expect(limiter.getRemainingRequests('user1')).toBe(0)
  })
})
