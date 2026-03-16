// ============================================
// 表单验证工具
// ============================================

/**
 * 验证规则
 */
const rules = {
  // 必填
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return '此项为必填项'
    }
    return true
  },
  
  // 最小长度
  minLength: (value, length) => {
    if (!value || value.length < length) {
      return `最少需要 ${length} 个字符`
    }
    return true
  },
  
  // 最大长度
  maxLength: (value, length) => {
    if (value && value.length > length) {
      return `最多只能 ${length} 个字符`
    }
    return true
  },
  
  // 手机号
  phone: (value) => {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(value)) {
      return '请输入正确的手机号码'
    }
    return true
  },
  
  // 学号
  studentId: (value) => {
    const idRegex = /^\d{4,12}$/
    if (!idRegex.test(value)) {
      return '请输入正确的学号'
    }
    return true
  },
  
  // 邮箱
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return '请输入正确的邮箱地址'
    }
    return true
  },
  
  // 数字范围
  range: (value, min, max) => {
    const num = Number(value)
    if (isNaN(num) || num < min || num > max) {
      return `数值必须在 ${min} 到 ${max} 之间`
    }
    return true
  }
}

/**
 * 验证表单
 * @param {Object} formData - 表单数据
 * @param {Object} validationRules - 验证规则配置
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateForm(formData, validationRules) {
  const errors = {}
  let isValid = true
  
  for (const field in validationRules) {
    const value = formData[field]
    const fieldRules = validationRules[field]
    
    for (const rule of fieldRules) {
      let result = true
      
      if (typeof rule === 'string') {
        // 简单规则，如 'required'
        result = rules[rule]?.(value)
      } else if (typeof rule === 'function') {
        // 自定义验证函数
        result = rule(value)
      } else if (typeof rule === 'object') {
        // 带参数的规则，如 { type: 'minLength', value: 6 }
        const { type, value: param, message } = rule
        result = rules[type]?.(value, param)
        if (result !== true && message) {
          result = message
        }
      }
      
      if (result !== true) {
        errors[field] = result
        isValid = false
        break
      }
    }
  }
  
  return { valid: isValid, errors }
}

/**
 * 快速验证单个字段
 * @param {*} value - 字段值
 * @param {Array} fieldRules - 验证规则数组
 * @returns {string|true} 错误消息或 true
 */
export function validateField(value, fieldRules) {
  for (const rule of fieldRules) {
    let result = true
    
    if (typeof rule === 'string') {
      result = rules[rule]?.(value)
    } else if (typeof rule === 'function') {
      result = rule(value)
    } else if (typeof rule === 'object') {
      const { type, value: param, message } = rule
      result = rules[type]?.(value, param)
      if (result !== true && message) {
        result = message
      }
    }
    
    if (result !== true) {
      return result
    }
  }
  
  return true
}

/**
 * 显示第一个错误
 * @param {Object} errors - 错误对象
 */
export function showFirstError(errors) {
  const firstError = Object.values(errors)[0]
  if (firstError) {
    uni.showToast({
      title: firstError,
      icon: 'none'
    })
  }
}

// 预设的验证规则组合
export const validators = {
  // 用户名
  username: [
    'required',
    { type: 'minLength', value: 3 },
    { type: 'maxLength', value: 20 }
  ],
  
  // 密码
  password: [
    'required',
    { type: 'minLength', value: 6, message: '密码至少需要6位' }
  ],
  
  // 手机号
  phone: ['required', 'phone'],
  
  // 学号
  studentId: ['required', 'studentId'],
  
  // 邮箱
  email: ['required', 'email'],
  
  // 搜索关键词
  keyword: [
    { type: 'maxLength', value: 50 }
  ],
  
  // 备注
  comment: [
    { type: 'maxLength', value: 500 }
  ]
}
