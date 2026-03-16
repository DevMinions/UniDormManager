# ============================================
# API 集成测试
# ============================================

import { describe, it, expect, beforeAll } from 'vitest'
import { request } from '../utils/request.js'

describe('API 集成测试', () => {
  let authToken = null
  
  // 登录获取 token
  beforeAll(async () => {
    try {
      const res = await request.post('/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      })
      authToken = res.token
    } catch (error) {
      console.warn('登录失败，测试可能无法继续')
    }
  })
  
  describe('认证相关', () => {
    it('应该成功登录', async () => {
      const res = await request.post('/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      })
      
      expect(res).toHaveProperty('token')
      expect(res).toHaveProperty('user')
    })
    
    it('错误密码应该返回 401', async () => {
      try {
        await request.post('/api/auth/login', {
          username: 'admin',
          password: 'wrongpassword'
        })
        expect(false).toBe(true) // 不应该到这里
      } catch (error) {
        expect(error.message).toContain('401')
      }
    })
  })
  
  describe('用户管理', () => {
    it('应该获取用户列表', async () => {
      const res = await request.get('/api/users', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('list')
      expect(res).toHaveProperty('total')
      expect(Array.isArray(res.list)).toBe(true)
    })
    
    it('应该获取用户详情', async () => {
      const res = await request.get('/api/users/1', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('id')
      expect(res).toHaveProperty('username')
    })
  })
  
  describe('报修管理', () => {
    it('应该获取报修列表', async () => {
      const res = await request.get('/api/repairs', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('list')
      expect(Array.isArray(res.list)).toBe(true)
    })
    
    it('应该创建报修', async () => {
      const res = await request.post('/api/repairs', {
        title: '测试报修',
        type: 'plumbing',
        description: 'API 测试创建'
      }, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('id')
    })
  })
  
  describe('学生管理', () => {
    it('应该获取学生列表', async () => {
      const res = await request.get('/api/students', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('list')
      expect(Array.isArray(res.list)).toBe(true)
    })
  })
  
  describe('房间管理', () => {
    it('应该获取房间列表', async () => {
      const res = await request.get('/api/rooms', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('list')
      expect(Array.isArray(res.list)).toBe(true)
    })
  })
  
  describe('消息中心', () => {
    it('应该获取消息列表', async () => {
      const res = await request.get('/api/messages', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('list')
      expect(Array.isArray(res.list)).toBe(true)
    })
    
    it('应该获取未读消息数', async () => {
      const res = await request.get('/api/messages/unread-count', {}, {
        header: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(res).toHaveProperty('count')
      expect(typeof res.count).toBe('number')
    })
  })
})
