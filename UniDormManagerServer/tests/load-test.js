# ============================================
# k6 性能压测脚本
# ============================================

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// 自定义指标
const errorRate = new Rate('errors')
const apiLatency = new Trend('api_latency')
const successfulLogins = new Counter('successful_logins')

// 测试配置
export const options = {
  // 测试阶段
  stages: [
    { duration: '2m', target: 50 },    //  ramp up
    { duration: '5m', target: 50 },    //  steady state
    { duration: '2m', target: 100 },   //  ramp up
    { duration: '5m', target: 100 },   //  steady state
    { duration: '2m', target: 0 }      //  ramp down
  ],
  
  // 阈值
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% 请求响应时间 < 500ms
    http_req_failed: ['rate<0.1'],      // 错误率 < 10%
    errors: ['rate<0.05']               // 自定义错误率 < 5%
  }
}

// 基础 URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'

// 登录获取 token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    username: 'admin',
    password: 'admin123'
  })
  
  const success = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined
  })
  
  if (success) {
    successfulLogins.add(1)
    return { token: loginRes.json('token') }
  }
  
  return { token: null }
}

// 默认测试函数
export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json'
    }
  }
  
  // 首页数据
  group('首页数据', () => {
    const res = http.get(`${BASE_URL}/api/dashboard/stats`, params)
    
    const success = check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 500ms': (r) => r.timings.duration < 500
    })
    
    errorRate.add(!success)
    apiLatency.add(res.timings.duration)
    
    sleep(1)
  })
  
  // 报修列表
  group('报修列表', () => {
    const res = http.get(`${BASE_URL}/api/repairs?page=1&pageSize=20`, params)
    
    const success = check(res, {
      'repairs list status is 200': (r) => r.status === 200,
      'repairs list has data': (r) => r.json('list') !== undefined
    })
    
    errorRate.add(!success)
    apiLatency.add(res.timings.duration)
    
    sleep(2)
  })
  
  // 学生列表
  group('学生列表', () => {
    const res = http.get(`${BASE_URL}/api/students?page=1&pageSize=20`, params)
    
    const success = check(res, {
      'students list status is 200': (r) => r.status === 200,
      'students list has data': (r) => r.json('list') !== undefined
    })
    
    errorRate.add(!success)
    apiLatency.add(res.timings.duration)
    
    sleep(2)
  })
  
  // 提交报修（写操作）
  group('提交报修', () => {
    const payload = JSON.stringify({
      title: `测试报修 ${Date.now()}`,
      type: 'plumbing',
      description: '性能测试生成的报修数据',
      urgency: 'normal'
    })
    
    const res = http.post(`${BASE_URL}/api/repairs`, payload, params)
    
    const success = check(res, {
      'create repair status is 200': (r) => r.status === 200,
      'create repair has id': (r) => r.json('id') !== undefined
    })
    
    errorRate.add(!success)
    apiLatency.add(res.timings.duration)
    
    sleep(3)
  })
}

// 清理
export function teardown(data) {
  console.log('测试完成，成功登录次数:', successfulLogins.value)
}
