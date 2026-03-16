
// ============================================
// 输入校验工具 - 强化版
// ============================================

/**
 * 校验规则
 */
export const VALIDATION_RULES = {
  // 必填
  required: (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  },
  
  // 手机号
  phone: (value) => {
    if (!value) return true
    return /^1[3-9]\d{9}$/.test(value)
  },
  
  // 邮箱
  email: (value) => {
    if (!value) return true
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
  },
  
  // 身份证号
  idCard: (value) => {
    if (!value) return true
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value)
  },
  
  // 学号/工号
  studentId: (value) => {
    if (!value) return true
    return /^[A-Za-z0-9]{6,20}$/.test(value)
  },
  
  // 纯数字
  numeric: (value) => {
    if (!value) return true
    return /^\d+$/.test(value)
  },
  
  // 纯字母
  alpha: (value) => {
    if (!value) return true
    return /^[a-zA-Z]+$/.test(value)
  },
  
  // 字母数字
  alphanumeric: (value) => {
    if (!value) return true
    return /^[a-zA-Z0-9]+$/.test(value)
  },
  
  // 中文
  chinese: (value) => {
    if (!value) return true
    return /^[\u4e00-\u9fa5]+$/.test(value)
  },
  
  // URL
  url: (value) => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  
  // 最小长度
  minLength: (value, length) => {
    if (!value) return true
    return String(value).length >= Number(length)
  },
  
  // 最大长度
  maxLength: (value, length) => {
    if (!value) return true
    return String(value).length <= Number(length)
  },
  
  // 长度范围
  length: (value, min, max) => {
    if (!value) return true
    const len = String(value).length
    return len >= Number(min) && len <= Number(max)
  },
  
  // 最小值
  min: (value, min) => {
    if (!value && value !== 0) return true
    return Number(value) >= Number(min)
  },
  
  // 最大值
  max: (value, max) => {
    if (!value && value !== 0) return true
    return Number(value) <= Number(max)
  },
  
  // 数值范围
  range: (value, min, max) => {
    if (!value && value !== 0) return true
    const num = Number(value)
    return num >= Number(min) && num <= Number(max)
  },
  
  // 正则匹配
  pattern: (value, regex) => {
    if (!value) return true
    return new RegExp(regex).test(value)
  },
  
  // 日期格式
  date: (value) => {
    if (!value) return true
    const date = new Date(value)
    return !isNaN(date.getTime())
  },
  
  // 日期范围
  dateRange: (value, start, end) => {
    if (!value) return true
    const date = new Date(value)
    if (isNaN(date.getTime())) return false
    if (start && date < new Date(start)) return false
    if (end && date > new Date(end)) return false
    return true
  },
  
  // 匹配
  match: (value, target) => {
    return value === target
  },
  
  // 不匹配
  notMatch: (value, target) => {
    return value !== target
  },
  
  // 包含
  includes: (value, arr) => {
    if (!value) return true
    const array = Array.isArray(arr) ? arr : arr.split(',')
    return array.includes(value)
  },
  
  // 不包含
  excludes: (value, arr) => {
    if (!value) return true
    const array = Array.isArray(arr) ? arr : arr.split(',')
    return !array.includes(value)
  },
  
  // 不能包含特殊字符（防 XSS）
  noSpecialChars: (value) => {
    if (!value) return true
    return !/[<>&"']/.test(value)
  },
  
  // 安全密码（至少8位，包含大小写字母和数字）
  strongPassword: (value) => {
    if (!value) return true
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(value)
  }
}

/**
 * 错误消息模板
 */
const ERROR_MESSAGES = {
  required: (field) => `${field}不能为空`,
  phone: () => '请输入正确的手机号',
  email: () => '请输入正确的邮箱地址',
  idCard: () => '请输入正确的身份证号',
  studentId: () => '请输入正确的学号/工号',
  numeric: () => '只能输入数字',
  alpha: () => '只能输入字母',
  alphanumeric: () => '只能输入字母和数字',
  chinese: () => '只能输入中文',
  url: () => '请输入正确的URL',
  minLength: (field, length) => `${field}长度不能少于${length}个字符`,
  maxLength: (field, length) => `${field}长度不能超过${length}个字符`,
  length: (field, min, max) => `${field}长度必须在${min}-${max}个字符之间`,
  min: (field, min) => `${field}不能小于${min}`,
  max: (field, max) => `${field}不能大于${max}`,
  range: (field, min, max) => `${field}必须在${min}-${max}之间`,
  pattern: () => '格式不正确',
  date: () => '请输入正确的日期',
  dateRange: (field, start, end) => `${field}必须在${start}至${end}之间`,
  match: (field) => `${field}不匹配`,
  notMatch: (field) => `${field}不能相同`,
  includes: () => '选择的值不合法',
  excludes: () => '包含不允许的值',
  noSpecialChars: () => '不能包含特殊字符',
  strongPassword: () => '密码至少8位，需包含大小写字母和数字'
}

/**
 * 单字段校验
 * @param {*} value - 值
 * @param {Array} rules - 校验规则
 * @param {string} fieldName - 字段名
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateField = (value, rules, fieldName = '字段') => {
  for (const rule of rules) {
    const { type, message, ...params } = rule
    const validator = VALIDATION_RULES[type]
    
    if (!validator) {
      console.warn(`未知的校验规则: ${type}`)
      continue
    }
    
    const valid = validator(value, ...Object.values(params))
    
    if (!valid) {
      const errorMsg = message || 
        (ERROR_MESSAGES[type] ? ERROR_MESSAGES[type](fieldName, ...Object.values(params)) : '校验失败')
      return { valid: false, message: errorMsg }
    }
  }
  
  return { valid: true, message: '' }
}

/**
 * 表单校验
 * @param {Object} data - 表单数据
 * @param {Object} schema - 校验规则
 * @returns {Object} { valid: boolean, errors: Object }
 */
export const validateForm = (data, schema) => {
  const errors = {}
  let valid = true
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const fieldName = rules.label || field
    const fieldRules = rules.rules || rules
    
    const result = validateField(value, fieldRules, fieldName)
    
    if (!result.valid) {
      errors[field] = result.message
      valid = false
    }
  }
  
  return { valid, errors }
}

/**
 * 显示第一个错误
 * @param {Object} errors - 错误对象
 */
export const showFirstError = (errors) => {
  const firstError = Object.values(errors)[0]
  if (firstError) {
    uni.showToast({
      title: firstError,
      icon: 'none'
    })
  }
}

/**
 * 防止 XSS - 转义 HTML
 * @param {string} str - 输入字符串
 * @returns {string}
 */
export const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * 防止 XSS - 过滤危险标签
 * @param {string} str - 输入字符串
 * @returns {string}
 */
export const sanitizeHtml = (str) => {
  if (!str || typeof str !== 'string') return str
  return str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * 安全修剪输入
 * @param {*} input - 输入
 * @returns {*}
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeHtml(input.trim())
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  if (input && typeof input === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}

/**
 * 常用校验组合
 */
export const validators = {
  // 手机号
  phone: { type: 'phone', required: true },
  
  // 邮箱
  email: { type: 'email', required: true },
  
  // 身份证号
  idCard: { type: 'idCard', required: true },
  
  // 姓名（2-20位中文）
  name: [
    { type: 'required' },
    { type: 'chinese' },
    { type: 'length', min: 2, max: 20 }
  ],
  
  // 学号/工号
  studentId: [
    { type: 'required' },
    { type: 'studentId' }
  ],
  
  // 房间号
  roomNumber: [
    { type: 'required' },
    { type: 'alphanumeric' },
    { type: 'length', min: 3, max: 10 }
  ],
  
  // 密码
  password: [
    { type: 'required' },
    { type: 'strongPassword' }
  ],
  
  // 描述（防止 XSS）
  description: [
    { type: 'maxLength', length: 500 },
    { type: 'noSpecialChars' }
  ]
}
